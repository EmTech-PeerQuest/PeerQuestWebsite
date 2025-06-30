from django.db import models
from django.conf import settings
from django.utils import timezone


class Application(models.Model):
    APPLICATION_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
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
    message = models.TextField(
        blank=True,
        help_text="Application message"
    )
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
        unique_together = ['quest', 'applicant']  # Prevent duplicate applications
        indexes = [
            models.Index(fields=['quest', 'status']),
            models.Index(fields=['applicant', 'status']),
            models.Index(fields=['applied_at']),
        ]

    def __str__(self):
        return f"{self.applicant.username} -> {self.quest.title} ({self.get_status_display()})"

    def approve(self, reviewer):
        """Approve the application and assign the quest to the applicant"""
        self.status = 'approved'
        self.reviewed_by = reviewer
        self.reviewed_at = timezone.now()
        self.save()
        
        # Assign the quest to the applicant
        self.quest.assign_to_user(self.applicant)
        return True

    def reject(self, reviewer):
        """Reject the application"""
        self.status = 'rejected'
        self.reviewed_by = reviewer
        self.reviewed_at = timezone.now()
        self.save()
        return True

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
    def can_be_reviewed(self):
        return self.status == 'pending'
