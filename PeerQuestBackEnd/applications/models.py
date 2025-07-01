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
