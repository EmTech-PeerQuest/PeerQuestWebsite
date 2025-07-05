from django.db import models
from django.conf import settings
from .models import Quest

class QuestSubmission(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("completed", "Completed"),
    ]
    quest = models.ForeignKey(Quest, on_delete=models.CASCADE, related_name="submissions")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="quest_submissions")
    text = models.TextField(blank=True)
    link = models.URLField(blank=True)
    file = models.FileField(upload_to="submissions/", blank=True, null=True)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="pending")
    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    def clean(self):
        # Enforce file size limit (25MB)
        if self.file and self.file.size > 25 * 1024 * 1024:
            from django.core.exceptions import ValidationError
            raise ValidationError("File size must be under 25MB.")

    def __str__(self):
        return f"Submission by {self.user} for {self.quest} ({self.status})"
