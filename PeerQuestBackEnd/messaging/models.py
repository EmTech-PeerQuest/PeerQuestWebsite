from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Message(models.Model):
        sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_messages")
        recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name="received_messages")
        content = models.TextField()
        timestamp = models.DateTimeField(auto_now_add=True)
        subject = models.CharField(max_length=200, blank=True, null=True)
        is_read = models.BooleanField(default=False)
        sent_at = models.DateTimeField(auto_now_add=True)
        read_at = models.DateTimeField(null=True, blank=True)

        class Meta:
                db_table = "messages"
                ordering = ["-sent_at"]
