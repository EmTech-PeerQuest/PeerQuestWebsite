from django.db import models
from django.conf import settings

class Notification(models.Model):
    NOTIF_TYPES = [
        ("quest_application", "Quest Application"),
        ("quest_application_result", "Quest Application Result"),
        ("kicked_from_quest", "Kicked From Quest"),
        ("quest_disabled", "Quest Disabled"),
        ("quest_deleted", "Quest Deleted"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    notif_type = models.CharField(max_length=32, choices=NOTIF_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    quest_id = models.IntegerField(null=True, blank=True)
    applicant = models.CharField(max_length=255, blank=True, null=True)
    quest_title = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=32, blank=True, null=True)  # pending, approved, rejected
    result = models.CharField(max_length=32, blank=True, null=True)  # accepted, rejected
    reason = models.TextField(blank=True, null=True)
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    application_id = models.IntegerField(null=True, blank=True, help_text="Related Application ID")

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} - {self.notif_type} - {self.title}"
