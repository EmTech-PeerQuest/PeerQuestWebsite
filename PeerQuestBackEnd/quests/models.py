from django.db import models, transaction
from django.conf import settings
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
import logging

logger = logging.getLogger(__name__)


class QuestCategory(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Quest Categories"


class Quest(models.Model):
    class QuestObjects(models.Manager):
        def get_queryset(self):
            return super().get_queryset().filter(status='open')

    STATUS_CHOICES = [
        ('in-progress', 'In-Progress'),
        ('open', 'Open'),
        ('completed', 'Completed'),
    ]

    DIFFICULTY_CHOICES = [
        ('initiate', 'Initiate'),
        ('adventurer', 'Adventurer'),
        ('champion', 'Champion'),
        ('mythic', 'Mythic'),
    ]

    XP_REWARD_CHOICES = [
        (25, '25 XP (Initiate)'),
        (50, '50 XP (Adventurer)'),
        (100, '100 XP (Champion)'),
        (200, '200 XP (Mythic)'),
    ]

    # Mapping of difficulty to XP rewards
    DIFFICULTY_XP_MAPPING = {
        'initiate': 25,
        'adventurer': 50,
        'champion': 100,
        'mythic': 200,
    }

    # Basic quest information
    title = models.CharField(max_length=200)
    description = models.TextField(max_length=2000, help_text="Maximum 2000 characters")
    
    # Quest metadata
    category = models.ForeignKey(QuestCategory, on_delete=models.CASCADE, default=2)
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default='initiate')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='open')
    
    # Quest rewards and requirements
    xp_reward = models.PositiveIntegerField(choices=XP_REWARD_CHOICES, default=25, help_text="XP points awarded upon completion")
    gold_reward = models.PositiveIntegerField(
        default=0, 
        validators=[MinValueValidator(0)],
        help_text="Gold coins awarded upon completion"
    )
    commission_fee = models.PositiveIntegerField(
        default=0,
        help_text="Commission fee taken by the system for this quest (auto-calculated, non-refundable)"
    )
    # estimated_time field removed - no longer needed
    
    # Quest creator and participants
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='created_quests'
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_quests',
        help_text="User currently assigned to this quest"
    )
    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        through='QuestParticipant',
        related_name='participating_quests',
        blank=True
    )
    
    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    due_date = models.DateField(null=True, blank=True, help_text="Deadline date for quest completion")
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Quest content / FOR CHECKING
    requirements = models.TextField(blank=True, help_text="What needs to be done to complete this quest")
    resources = models.TextField(blank=True, help_text="Links, files, or resources needed for the quest")
    
    # Slug for SEO-friendly URLs
    slug = models.SlugField(max_length=250, unique=True, blank=True)
    
    # Soft delete flag
    is_deleted = models.BooleanField(default=False, help_text="If true, this quest is soft-deleted and hidden from normal queries.")

    # Custom managers
    objects = models.Manager()  # Default manager
    active_quests = QuestObjects()  # Custom manager for active quests only

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'difficulty']),
            models.Index(fields=['creator', 'status']),
            models.Index(fields=['assigned_to', 'status']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        # Automatically set XP reward based on difficulty ONLY if not manually set
        if self.difficulty in self.DIFFICULTY_XP_MAPPING and (not self.xp_reward or self.xp_reward == self.DIFFICULTY_XP_MAPPING.get(self.difficulty)):
            self.xp_reward = self.DIFFICULTY_XP_MAPPING[self.difficulty]

        # Detect status change to 'completed' and trigger reward logic
        status_changing_to_completed = False
        if self.pk:
            old = Quest.objects.get(pk=self.pk)
            if old.status != 'completed' and self.status == 'completed':
                status_changing_to_completed = True

        if not self.slug:
            from django.utils.text import slugify
            import uuid
            self.slug = f"{slugify(self.title)}-{str(uuid.uuid4())[:8]}"

        super().save(*args, **kwargs)

        # After saving, if status just changed to completed, trigger reward logic
        if status_changing_to_completed:
            # Ensure assigned user is a participant
            if self.assigned_to:
                from .models import QuestParticipant
                participant, created = QuestParticipant.objects.get_or_create(
                    quest=self, user=self.assigned_to,
                    defaults={'status': 'joined'}
                )
                if participant.status != 'completed':
                    participant.status = 'joined'
                    participant.save()
            self.complete_quest()

    @property
    def is_completed(self):
        return self.status == 'completed'

    @property
    def participant_count(self):
        return self.participants.count()

    @property
    def can_accept_participants(self):
        return self.status == 'open'
    
    @property
    def is_assigned(self):
        """Returns True if the quest is assigned to a specific user"""
        return self.assigned_to is not None
    
    @property
    def assigned_to_username(self):
        """Returns the username of the assigned user or None"""
        return self.assigned_to.username if self.assigned_to else None
    
    def assign_to_user(self, user):
        """Add user as a participant to the quest and assign the quest to them"""
        try:
            with transaction.atomic():
                logger.info(f"Starting quest assignment: {user.username} -> Quest '{self.title}' (ID: {self.id})")
                
                # Check if user is already a participant
                existing_participant = QuestParticipant.objects.filter(quest=self, user=user).first()
                if existing_participant:
                    # If they exist but dropped, reactivate them
                    if existing_participant.status == 'dropped':
                        existing_participant.status = 'joined'
                        existing_participant.save()
                        logger.info(f"Reactivated participant: {user.username} for quest: {self.title}")
                    else:
                        logger.info(f"User {user.username} is already a participant in quest: {self.title}")
                    
                    # Update assigned_to field
                    self.assigned_to = user
                    self.save()
                    logger.info(f"Updated quest assignment: {user.username} -> Quest '{self.title}'")
                    return existing_participant
                
                # Check current participant count before creating new participant
                current_participant_count = self.participant_count
                logger.debug(f"Current participant count for quest '{self.title}': {current_participant_count}")
                
                # Create new participant
                try:
                    participant = QuestParticipant.objects.create(
                        quest=self,
                        user=user,
                        status='joined',
                        application_message=''  # Provide default empty message
                    )
                    logger.info(f"Created new participant record: {user.username} -> Quest '{self.title}'")
                except Exception as create_error:
                    logger.error(f"Failed to create QuestParticipant: {str(create_error)}")
                    raise Exception(f"Failed to create participant record: {str(create_error)}")
                
                # Assign the quest to the user
                self.assigned_to = user
                
                # Update quest status if this is the first participant
                old_status = self.status
                if self.status == 'open' and current_participant_count == 0:
                    self.status = 'in-progress'
                    logger.info(f"Updated quest status from '{old_status}' to '{self.status}' for quest '{self.title}'")
                
                try:
                    self.save()
                    logger.info(f"Saved quest changes: {user.username} assigned to Quest '{self.title}'")
                except Exception as save_error:
                    logger.error(f"Failed to save quest changes: {str(save_error)}")
                    raise Exception(f"Failed to save quest assignment: {str(save_error)}")
                
                logger.info(f"Quest assignment completed successfully: {user.username} -> Quest '{self.title}'")
                return participant
                
        except Exception as e:
            logger.error(f"Quest assignment failed: {user.username} -> Quest '{self.title}' (ID: {self.id}): {str(e)}")
            raise Exception(f"Failed to assign quest to user {user.username}: {str(e)}")
    
    def unassign(self):
        """Remove the assignment from the quest"""
        self.assigned_to = None
        if self.status == 'in-progress':
            self.status = 'open'
        self.save()
        return True
    
    @property
    def days_until_deadline(self):
        """Returns the number of days until the deadline"""
        if not self.due_date:
            return None
        
        from datetime import date
        today = date.today()
        deadline = self.due_date
        
        days_diff = (deadline - today).days
        return days_diff

    @property
    def deadline_status(self):
        """Returns a human-readable deadline status"""
        if not self.due_date:
            return "No deadline set"
        
        days = self.days_until_deadline
        
        if days < 0:
            return f"Overdue by {abs(days)} day{'s' if abs(days) != 1 else ''}"
        elif days == 0:
            return "Due today"
        elif days == 1:
            return "Due tomorrow"
        elif days <= 7:
            return f"Due in {days} days"
        else:
            return f"Due in {days} days"

    @property
    def truncated_description(self):
        """Returns a truncated version of the description for quest cards"""
        max_length = 150  # Adjust this to control truncation length
        if len(self.description) <= max_length:
            return self.description
        
        # Find the last space before the cutoff to avoid cutting words
        truncated = self.description[:max_length]
        last_space = truncated.rfind(' ')
        
        if last_space > 0:
            truncated = truncated[:last_space]
        
        return truncated + "..."

    def get_truncated_description(self, max_length=150):
        """
        Get truncated description with customizable length
        Args:
            max_length (int): Maximum characters before truncation
        Returns:
            str: Truncated description with ellipsis if needed
        """
        if len(self.description) <= max_length:
            return self.description
        
        # Find the last space before the cutoff to avoid cutting words
        truncated = self.description[:max_length]
        last_space = truncated.rfind(' ')
        
        if last_space > 0:
            truncated = truncated[:last_space]
        
        return truncated + "..."

    @property
    def recommended_xp_for_difficulty(self):
        """Returns the recommended XP reward for the current difficulty"""
        return self.DIFFICULTY_XP_MAPPING.get(self.difficulty, 50)

    @classmethod
    def update_xp_rewards_by_difficulty(cls):
        """
        Class method to update existing quests' XP rewards based on their difficulty.
        This can be used to apply the new difficulty-XP mapping to existing quests.
        """
        updated_count = 0
        for quest in cls.objects.all():
            if quest.difficulty in cls.DIFFICULTY_XP_MAPPING:
                expected_xp = cls.DIFFICULTY_XP_MAPPING[quest.difficulty]
                if quest.xp_reward != expected_xp:
                    quest.xp_reward = expected_xp
                    quest.save()
                    updated_count += 1
        return updated_count

    def complete_quest(self, completion_reason="Quest completed"):
        """
        Complete the quest and dynamically divide XP and gold among all eligible participants.
        Any remainder is given to the admin account. Rewards are tracked in transaction tables.
        This version is robust: it rewards all participants who are not dropped, and logs all actions.
        """
        from users.models import User
        from decimal import Decimal
        import logging
        logger = logging.getLogger("quest-rewards")
        from transactions.models import Transaction, TransactionType, UserBalance
        from .models import QuestParticipant
        # XP is now tracked in Transaction table as type='REWARD', with a new 'xp' field or as a negative gold value if not supported
        # For now, we will use Transaction for both XP and Gold, and UserBalance for gold only

        if self.status == 'completed':
            logger.warning(f"Quest '{self.title}' is already completed. No rewards distributed.")
            return {"error": "Quest is already completed"}

        self.status = 'completed'
        self.completed_at = timezone.now()
        self.save()

        # Reward all participants who are not dropped
        participants = QuestParticipant.objects.filter(
            quest=self,
            status__in=['joined', 'in_progress', 'approved', 'completed']
        ).exclude(status='dropped')
        num_participants = participants.count()
        if num_participants == 0:
            logger.warning(f"Quest '{self.title}' has no eligible participants for rewards.")
            return {"error": "No participants to complete this quest."}

        # Calculate divided rewards
        xp_per = int(self.xp_reward // num_participants)
        gold_per = int(self.gold_reward // num_participants)
        xp_excess = int(self.xp_reward - (xp_per * num_participants))
        gold_excess = int(self.gold_reward - (gold_per * num_participants))

        # Find admin account (first with is_admin True, fallback to role=ADMIN)
        admin_user = User.objects.filter(is_admin=True).first()
        if not admin_user:
            admin_user = User.objects.filter(role='admin').first()

        completion_results = []

        from .models import QuestCompletionLog
        for participant in participants:
            # Mark as completed if not already
            if participant.status != 'completed':
                participant.status = 'completed'
                participant.completed_at = timezone.now()
                participant.save()
            user = participant.user
            # Create Transaction records for XP and Gold (for unified transaction history)
            Transaction.objects.create(
                user=user,
                type=TransactionType.REWARD,
                amount=Decimal(xp_per),
                description=f"XP for quest '{self.title}' completion",
                quest=self
            )
            Transaction.objects.create(
                user=user,
                type=TransactionType.REWARD,
                amount=Decimal(gold_per),
                description=f"Gold for quest '{self.title}' completion",
                quest=self
            )
            # Update UserBalance for gold
            balance, _ = UserBalance.objects.get_or_create(user=user)
            balance.gold_balance += Decimal(gold_per)
            balance.save()
            # Create QuestCompletionLog if not already exists, with debug logging
            log_obj, created = QuestCompletionLog.objects.get_or_create(
                quest=self,
                adventurer=user,
                defaults={
                    'xp_earned': xp_per,
                    'gold_earned': gold_per,
                    'completed_at': timezone.now()
                }
            )
            if created:
                logger.info(f"[QuestCompletionLog] Created for {user.username} on quest '{self.title}' (XP: {xp_per}, Gold: {gold_per})")
            else:
                logger.warning(f"[QuestCompletionLog] Already exists for {user.username} on quest '{self.title}'")
            completion_results.append({
                "user": user.username,
                "xp_awarded": xp_per,
                "gold_awarded": gold_per
            })

        # Give excess to admin
        admin_award = None
        if admin_user and (xp_excess > 0 or gold_excess > 0):
            if xp_excess > 0:
                Transaction.objects.create(
                    user=admin_user,
                    type=TransactionType.REWARD,
                    amount=Decimal(xp_excess),
                    description=f"Excess XP from quest '{self.title}'",
                    quest=self
                )
            if gold_excess > 0:
                Transaction.objects.create(
                    user=admin_user,
                    type=TransactionType.REWARD,
                    amount=Decimal(gold_excess),
                    description=f"Excess gold from quest '{self.title}'",
                    quest=self
                )
                balance, _ = UserBalance.objects.get_or_create(user=admin_user)
                balance.gold_balance += Decimal(gold_excess)
                balance.save()
            logger.info(f"Admin {admin_user.username} received excess: {xp_excess} XP, {gold_excess} Gold from quest '{self.title}' (new system)")
            admin_award = {
                "user": admin_user.username,
                "xp_awarded": xp_excess,
                "gold_awarded": gold_excess
            }

        logger.info(f"Quest '{self.title}' completed. Rewards distributed to {num_participants} participants. (new system)")

        # Return updated balances for admin/creator if needed
        admin_balance = None
        if admin_user:
            admin_balance = {
                "xp": int(sum([t.amount for t in Transaction.objects.filter(user=admin_user, description__icontains="XP")])) or 0,
                "gold": float(UserBalance.objects.get(user=admin_user).gold_balance) if UserBalance.objects.filter(user=admin_user).exists() else 0.0
            }

        return {
            "quest_title": self.title,
            "completion_reason": completion_reason,
            "participants_completed": num_participants,
            "xp_per_participant": xp_per,
            "gold_per_participant": gold_per,
            "total_xp_awarded": self.xp_reward,
            "total_gold_awarded": self.gold_reward,
            "participant_results": completion_results,
            "admin_award": admin_award,
            "admin_balance": admin_balance
        }

    def delete(self, using=None, keep_parents=False):
        # Soft delete: mark as deleted instead of removing from DB.
        self.is_deleted = True
        self.save(update_fields=["is_deleted"])
        


class QuestParticipant(models.Model):
    STATUS_CHOICES = [
        ('joined', 'Joined'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('dropped', 'Dropped'),
    ]

    quest = models.ForeignKey(Quest, on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='quest_participations')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='joined')
    joined_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    progress_notes = models.TextField(blank=True)
    
    # Legacy fields that we'll ignore but keep for now due to SQLite constraints
    application_id = models.BigIntegerField(null=True, blank=True)
    application_date = models.DateTimeField(null=True, blank=True)
    application_message = models.TextField(blank=True, default='', null=True)
    review_notes = models.TextField(blank=True, default='', null=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ['quest', 'user']
        indexes = [
            models.Index(fields=['quest', 'status']),
            models.Index(fields=['user', 'status']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.quest.title} ({self.get_status_display()})"


class QuestSubmission(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('needs_revision', 'Needs Revision'),
    ]

    quest_participant = models.ForeignKey(QuestParticipant, on_delete=models.CASCADE, related_name='submissions')
    description = models.TextField(blank=True, help_text="Text description of the submission")
    link = models.URLField(blank=True, null=True, help_text="Optional link to submitted work")
    submission_files = models.JSONField(default=list, blank=True, help_text="List of file URLs or paths")
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='pending')
    feedback = models.TextField(blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='reviewed_submissions'
    )

    class Meta:
        ordering = ['-submitted_at']

    def __str__(self):
        return f"Submission for {self.quest_participant.quest.title} by {self.quest_participant.user.username}"


class QuestCompletionLog(models.Model):
    quest = models.ForeignKey(Quest, on_delete=models.CASCADE, related_name='completion_logs')
    adventurer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='quest_completions')
    xp_earned = models.PositiveIntegerField()
    gold_earned = models.PositiveIntegerField()
    completed_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-completed_at']
        unique_together = ('quest', 'adventurer')

    def __str__(self):
        return f"{self.adventurer.username} completed '{self.quest.title}' ({self.xp_earned} XP, {self.gold_earned} Gold)"

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        super().save(*args, **kwargs)
        if is_new:
            # Update adventurer's XP and gold balance tables
            from users.models_reward import XPTransaction, GoldTransaction
            from transactions.models import UserBalance
            # XPTransaction (for .xp property)
            XPTransaction.objects.create(
                user=self.adventurer,
                amount=self.xp_earned,
                reason=f"Quest '{self.quest.title}' completion log"
            )
            # GoldTransaction (for .gold property)
            GoldTransaction.objects.create(
                user=self.adventurer,
                amount=self.gold_earned,
                reason=f"Quest '{self.quest.title}' completion log"
            )
            # UserBalance (for gold balance)
            from decimal import Decimal
            balance, _ = UserBalance.objects.get_or_create(user=self.adventurer)
            balance.gold_balance += Decimal(self.gold_earned)
            balance.save()


class QuestSubmissionAttempt(models.Model):
    participant = models.ForeignKey(QuestParticipant, on_delete=models.CASCADE, related_name='submission_attempts')
    quest = models.ForeignKey(Quest, on_delete=models.CASCADE, related_name='submission_attempts')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='submission_attempts')
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('participant', 'quest', 'user', 'timestamp')
        ordering = ['-timestamp']

    def __str__(self):
        return f"Attempt by {self.user} for {self.quest} at {self.timestamp}"
