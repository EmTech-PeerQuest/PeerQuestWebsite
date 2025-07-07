from django.db import models, transaction
from django.conf import settings
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


class Application(models.Model):
    APPLICATION_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('kicked', 'Kicked'),
    ]

    # Foreign key relationships
    quest = models.ForeignKey(
        'quests.Quest',
        on_delete=models.CASCADE,
        related_name='applications',
        help_text="Applied quest"
    )
    applicant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='quest_applications',
        help_text="Quest applicant"
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_applications',
        help_text="Reviewer (quest creator)"
    )
    
    # Application details
    status = models.CharField(
        max_length=15,
        choices=APPLICATION_STATUS_CHOICES,
        default='pending',
        help_text="Application status"
    )
    
    # Timestamps
    applied_at = models.DateTimeField(
        default=timezone.now,
        help_text="Application submission time"
    )
    reviewed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Application review time"
    )

    class Meta:
        ordering = ['-applied_at']
        # Allow reapplication after rejection - no unique constraint
        indexes = [
            models.Index(fields=['quest', 'status']),
            models.Index(fields=['applicant', 'status']),
            models.Index(fields=['applied_at']),
            models.Index(fields=['quest', 'applicant']),  # Index for performance
        ]

    def __str__(self):
        return f"{self.applicant.username} -> {self.quest.title} ({self.get_status_display()})"

    def clean(self):
        """Custom validation to enforce application limits and prevent duplicate pending applications"""
        if self.status == 'pending':
            # Check for existing pending applications for same quest+applicant
            existing_pending = Application.objects.filter(
                quest=self.quest,
                applicant=self.applicant,
                status='pending'
            ).exclude(pk=self.pk)
            
            if existing_pending.exists():
                from django.core.exceptions import ValidationError
                raise ValidationError(
                    'You already have a pending application for this quest. '
                    'Please wait for a response before applying again.'
                )
            
            # Check application attempt limits using the new system
            can_apply, reason = ApplicationAttempt.can_apply_again(self.quest, self.applicant)
            if not can_apply:
                from django.core.exceptions import ValidationError
                raise ValidationError(reason)

    def save(self, *args, **kwargs):
        """Override save to run validation and record application attempts"""
        self.clean()
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        # Record application attempt when creating a new application
        if is_new and self.status == 'pending':
            ApplicationAttempt.record_attempt(self)

    def approve(self, reviewer):
        """Approve the application and assign the quest to the applicant"""
        try:
            with transaction.atomic():
                # Step 1: Update application status
                self.status = 'approved'
                self.reviewed_by = reviewer
                self.reviewed_at = timezone.now()
                self.save()
                
                logger.info(f"Application approved: {self.applicant.username} -> Quest '{self.quest.title}' (ID: {self.quest.id})")
                
                # Step 2: Assign the quest to the applicant (CRITICAL STEP)
                try:
                    participant = self.quest.assign_to_user(self.applicant)
                    if not participant:
                        raise Exception("assign_to_user returned None - participant creation failed")
                    
                    logger.info(f"Quest assignment successful: {self.applicant.username} -> Quest '{self.quest.title}'")
                    
                except Exception as assign_error:
                    logger.error(f"CRITICAL: Quest assignment failed for {self.applicant.username} -> Quest '{self.quest.title}' (ID: {self.quest.id}): {str(assign_error)}")
                    # Rollback application approval since quest assignment failed
                    raise Exception(f"Failed to assign quest to user: {str(assign_error)}")
                
                # Step 3: Automatically reject all other pending applications for this quest
                other_pending_applications = Application.objects.filter(
                    quest=self.quest,
                    status='pending'
                ).exclude(id=self.id)
                
                rejected_count = 0
                for app in other_pending_applications:
                    app.status = 'rejected'
                    app.reviewed_by = reviewer
                    app.reviewed_at = timezone.now()
                    app.save()
                    rejected_count += 1
                
                if rejected_count > 0:
                    logger.info(f"Auto-rejected {rejected_count} other pending applications for Quest '{self.quest.title}'")
                
                logger.info(f"Application approval completed successfully: {self.applicant.username} -> Quest '{self.quest.title}'")
                return True
                
        except Exception as e:
            logger.error(f"Application approval failed: {self.applicant.username} -> Quest '{self.quest.title}' (ID: {self.quest.id}): {str(e)}")
            # Reset application status if it was changed
            if self.status == 'approved':
                self.status = 'pending'
                self.reviewed_by = None
                self.reviewed_at = None
                self.save()
                logger.info(f"Reverted application status to pending due to failure")
            raise Exception(f"Application approval failed: {str(e)}")

    def reject(self, reviewer):
        """Reject the application"""
        self.status = 'rejected'
        self.reviewed_by = reviewer
        self.reviewed_at = timezone.now()
        self.save()
        return True

    def kick(self, reviewer):
        """Kick the application (soft delete - just change status like reject)"""
        try:
            with transaction.atomic():
                # Step 1: Update application status (soft delete - keep record like reject)
                self.status = 'kicked'
                self.reviewed_by = reviewer
                self.reviewed_at = timezone.now()
                self.save()
                
                logger.info(f"Application kicked: {self.applicant.username} -> Quest '{self.quest.title}' (ID: {self.quest.id})")
                
                # Step 2: Update QuestParticipant status instead of deleting (soft delete)
                # Import QuestParticipant here to avoid circular imports
                from quests.models import QuestParticipant
                participants = QuestParticipant.objects.filter(quest=self.quest, user=self.applicant)
                for participant in participants:
                    # Set participant status to 'dropped' instead of deleting
                    participant.status = 'dropped'
                    participant.save()
                    logger.info(f"Set participant status to 'dropped': {self.applicant.username} from Quest '{self.quest.title}'")
                
                # Step 3: Check if quest should revert to 'open' status
                # Check both approved applications AND active quest participants
                approved_applications = Application.objects.filter(
                    quest=self.quest,
                    status='approved'
                )
                
                # Also check for active quest participants (not dropped)
                from quests.models import QuestParticipant
                active_participants = QuestParticipant.objects.filter(
                    quest=self.quest,
                    status__in=['joined', 'in_progress', 'completed']  # Any active status except 'dropped'
                )
                
                # Revert quest status to 'open' if no approved applications AND no active participants remain
                if (not approved_applications.exists() and 
                    not active_participants.exists() and 
                    self.quest.status in ['in-progress', 'assigned']):  # Fixed: use 'in-progress' with hyphen
                    self.quest.status = 'open'
                    self.quest.save()
                    logger.info(f"Quest '{self.quest.title}' reverted to 'open' status - no active participants remain")
                
                logger.info(f"Application kick completed successfully: {self.applicant.username} -> Quest '{self.quest.title}'")
                return True
                
        except Exception as e:
            logger.error(f"Application kick failed: {self.applicant.username} -> Quest '{self.quest.title}' (ID: {self.quest.id}): {str(e)}")
            # Reset application status if it was changed
            if self.status == 'kicked':
                self.status = 'approved'  # Revert to previous state
                self.save()
                logger.info(f"Reverted application status due to kick failure")
            raise Exception(f"Application kick failed: {str(e)}")

    @property
    def is_pending(self):
        return self.status == 'pending'

    @property
    def is_approved(self):
        return self.status == 'approved'

    @property
    def is_rejected(self):
        return self.status == 'rejected'

    @property
    def is_kicked(self):
        return self.status == 'kicked'

    @property
    def can_be_reviewed(self):
        return self.status == 'pending'


class ApplicationAttempt(models.Model):
    """
    Track application attempts for each user per quest.
    Used to enforce limits on re-applications after rejection.
    """
    quest = models.ForeignKey(
        'quests.Quest',
        on_delete=models.CASCADE,
        related_name='application_attempts',
        help_text="Quest being applied to"
    )
    applicant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='application_attempts',
        help_text="User making the application attempt"
    )
    application = models.ForeignKey(
        Application,
        on_delete=models.CASCADE,
        related_name='attempts',
        help_text="The application record this attempt belongs to"
    )
    attempt_number = models.PositiveIntegerField(
        help_text="Sequential attempt number for this user/quest combination"
    )
    timestamp = models.DateTimeField(
        auto_now_add=True,
        help_text="When this attempt was made"
    )
    
    class Meta:
        unique_together = ('quest', 'applicant', 'attempt_number')
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['quest', 'applicant']),
            models.Index(fields=['applicant', 'timestamp']),
        ]

    def __str__(self):
        return f"Attempt #{self.attempt_number} by {self.applicant.username} for quest '{self.quest.title}'"
    
    @classmethod
    def get_attempt_count(cls, quest, applicant):
        """Get the current number of attempts for a user on a quest"""
        return cls.objects.filter(quest=quest, applicant=applicant).count()
    
    @classmethod
    def can_apply_again(cls, quest, applicant):
        """
        Check if a user can apply again to a quest.
        Rules:
        - Kicked users can apply unlimited times
        - Rejected users can only apply 3 more times (4 total attempts including first)
        - Approved/pending users cannot apply again
        """
        # Get the latest application status
        latest_application = Application.objects.filter(
            quest=quest, 
            applicant=applicant
        ).order_by('-applied_at').first()
        
        if not latest_application:
            # No previous application, can apply
            return True, "Can apply"
        
        if latest_application.status == 'pending':
            return False, "You already have a pending application for this quest"
        
        if latest_application.status == 'approved':
            return False, "You are already participating in this quest"
        
        if latest_application.status == 'kicked':
            # Kicked users can apply unlimited times
            return True, "Can re-apply (kicked users have unlimited attempts)"
        
        if latest_application.status == 'rejected':
            # Check attempt count
            attempt_count = cls.get_attempt_count(quest, applicant)
            max_attempts = 4  # 1 initial + 3 re-attempts
            
            if attempt_count < max_attempts:
                remaining = max_attempts - attempt_count
                return True, f"Can re-apply ({remaining} attempts remaining after rejection)"
            else:
                return False, f"Maximum application attempts ({max_attempts}) reached for this quest"
        
        return False, "Unknown application status"
    
    @classmethod
    def record_attempt(cls, application):
        """Record a new application attempt"""
        attempt_count = cls.get_attempt_count(application.quest, application.applicant)
        return cls.objects.create(
            quest=application.quest,
            applicant=application.applicant,
            application=application,
            attempt_number=attempt_count + 1
        )
