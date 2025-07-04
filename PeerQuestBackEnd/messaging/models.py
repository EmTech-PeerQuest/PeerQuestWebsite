from django.db import models
from django.conf import settings
from django.utils import timezone

class Conversation(models.Model):
    """
    Represents a conversation between multiple users.
    This helps group messages and makes it easier to manage conversations.
    """
    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name="conversations"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)  # Track when conversation was last updated
    
    class Meta:
        ordering = ['-updated_at']  # Show most recently updated conversations first

    def __str__(self):
        usernames = [user.username for user in self.participants.all()[:2]]
        return f"Conversation: {' & '.join(usernames)}"

    def get_other_participant(self, current_user):
        """Helper method to get the other participant in a 2-person conversation"""
        return self.participants.exclude(id=current_user.id).first()

    def get_last_message(self):
        """Get the most recent message in this conversation"""
        return self.messages.order_by('-timestamp').first()

    def update_timestamp(self):
        """Update the conversation timestamp to now"""
        self.updated_at = timezone.now()
        self.save(update_fields=['updated_at'])


class Message(models.Model):
    """
    Represents a single message in a conversation.
    """
    # 🔧 FIXED: Changed to SET_NULL to prevent cascade deletion
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.SET_NULL,  # ← FIXED: Won't delete messages when conversation is deleted
        related_name="messages",
        null=True, blank=True
    )
    
    # Keep sender/recipient for backward compatibility and direct queries
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_messages"
    )
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="received_messages"
    )
    
    # Message content and metadata
    content = models.TextField()
    subject = models.CharField(max_length=200, blank=True, null=True)  # Optional subject
    
    # Message status
    is_read = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # Message type (for future features)
    MESSAGE_TYPES = [
        ('text', 'Text Message'),
        ('image', 'Image'),
        ('file', 'File'),
        ('system', 'System Message'),
    ]
    message_type = models.CharField(max_length=10, choices=MESSAGE_TYPES, default='text')
    
    # Optional: Message priority
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('normal', 'Normal'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='normal')
    
    # Optional: Reply to another message (for threading)
    reply_to = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='replies'
    )

    class Meta:
        db_table = "messages"
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=['sender', 'recipient']),
            models.Index(fields=['conversation', 'timestamp']),
            models.Index(fields=['is_read']),
        ]

    def __str__(self):
        return f"Message {self.id}: {self.sender.username} → {self.recipient.username}"

    def save(self, *args, **kwargs):
        """Override save to update conversation timestamp"""
        super().save(*args, **kwargs)
        
        # Update conversation timestamp when message is saved
        if self.conversation:
            self.conversation.update_timestamp()

    def mark_as_read(self):
        """Mark message as read and set read timestamp"""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])

    def get_preview(self, max_length=50):
        """Get a preview of the message content"""
        if len(self.content) <= max_length:
            return self.content
        return self.content[:max_length] + "..."


class MessageAttachment(models.Model):
    """
    Handle file attachments for messages (images, documents, etc.)
    """
    message = models.ForeignKey(
        Message,
        on_delete=models.CASCADE,
        related_name='attachments'
    )
    file = models.FileField(upload_to='message_attachments/%Y/%m/%d/')
    filename = models.CharField(max_length=255)
    file_size = models.PositiveIntegerField()  # Size in bytes
    content_type = models.CharField(max_length=100)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Attachment: {self.filename} for Message {self.message.id}"

    @property
    def file_size_human(self):
        """Return human-readable file size"""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if self.file_size < 1024.0:
                return f"{self.file_size:.1f} {unit}"
            self.file_size /= 1024.0
        return f"{self.file_size:.1f} TB"


# Optional: Message reactions (like/dislike, emojis)
class MessageReaction(models.Model):
    """
    Allow users to react to messages with emojis
    """
    message = models.ForeignKey(
        Message,
        on_delete=models.CASCADE,
        related_name='reactions'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )
    reaction = models.CharField(max_length=10)  # Emoji or reaction type
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['message', 'user', 'reaction']  # One reaction per user per message

    def __str__(self):
        return f"{self.user.username} reacted {self.reaction} to Message {self.message.id}"
