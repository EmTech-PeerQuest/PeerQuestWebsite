from django.db import models
from django.conf import settings
from django.utils import timezone


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
            return super().get_queryset().filter(status='active')

    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('archived', 'Archived'),
    ]

    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ]

    XP_REWARD_CHOICES = [
        (50, '50 XP'),
        (75, '75 XP'),
        (150, '150 XP'),
    ]

    # Basic quest information
    title = models.CharField(max_length=200)
    description = models.TextField()
    short_description = models.CharField(max_length=300, help_text="Brief description for quest cards")
    
    # Quest metadata
    category = models.ForeignKey(QuestCategory, on_delete=models.PROTECT, default=1)
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default='easy')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='draft')
    
    # Quest rewards and requirements
    xp_reward = models.PositiveIntegerField(choices=XP_REWARD_CHOICES, default=50, help_text="XP points awarded upon completion")
    estimated_time = models.PositiveIntegerField(help_text="Estimated time in minutes")
    max_participants = models.PositiveIntegerField(default=1, help_text="Maximum number of participants")
    
    # Quest creator and participants
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='created_quests'
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
    start_date = models.DateTimeField(null=True, blank=True)
    due_date = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Quest content
    requirements = models.TextField(blank=True, help_text="What needs to be done to complete this quest")
    resources = models.TextField(blank=True, help_text="Links, files, or resources needed for the quest")
    
    # Slug for SEO-friendly URLs
    slug = models.SlugField(max_length=250, unique=True, blank=True)
    
    # Custom managers
    objects = models.Manager()  # Default manager
    active_quests = QuestObjects()  # Custom manager for active quests only

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'difficulty']),
            models.Index(fields=['creator', 'status']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"

    def save(self, *args, **kwargs):
        if not self.slug:
            from django.utils.text import slugify
            import uuid
            self.slug = f"{slugify(self.title)}-{str(uuid.uuid4())[:8]}"
        super().save(*args, **kwargs)

    @property
    def is_completed(self):
        return self.status == 'completed'

    @property
    def participant_count(self):
        return self.participants.count()

    @property
    def can_accept_participants(self):
        return self.participant_count < self.max_participants and self.status == 'active'


class QuestParticipant(models.Model):
    STATUS_CHOICES = [
        ('joined', 'Joined'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('dropped', 'Dropped'),
    ]

    quest = models.ForeignKey(Quest, on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='joined')
    joined_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    progress_notes = models.TextField(blank=True)

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
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('needs_revision', 'Needs Revision'),
    ]

    quest_participant = models.ForeignKey(QuestParticipant, on_delete=models.CASCADE, related_name='submissions')
    submission_text = models.TextField()
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
