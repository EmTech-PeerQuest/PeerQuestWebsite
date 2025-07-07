from django.db import models
from django.conf import settings
from django.utils import timezone
from django.db.models.signals import post_save
from django.dispatch import receiver
import uuid

class Conversation(models.Model):
    """
    Represents a conversation between multiple users.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name="conversations"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Add conversation metadata
    is_group = models.BooleanField(default=False)
    name = models.CharField(max_length=100, blank=True, null=True)  # For group chats
    
    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        if self.is_group and self.name:
            return f"Group: {self.name}"
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

    @classmethod
    def get_or_create_conversation(cls, user1, user2):
        """Get existing conversation between two users or create new one"""
        # Look for existing conversation between these two users
        conversation = cls.objects.filter(
            participants=user1, is_group=False
        ).filter(
            participants=user2
        ).first()
        
        if not conversation:
            # Create new conversation
            conversation = cls.objects.create(is_group=False)
            conversation.participants.add(user1, user2)
        
        return conversation


class Message(models.Model):
    """
    Represents a single message in a conversation.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # FIXED: Always link to conversation
    conversation = models.ForeignKey(
        'Conversation',
        on_delete=models.CASCADE,
        related_name='messages'
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
    subject = models.CharField(max_length=200, blank=True, null=True)
    
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
        ('link', 'Link'),
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
        # If no conversation is set, create/get one
        if not self.conversation:
            self.conversation = Conversation.get_or_create_conversation(
                self.sender, self.recipient
            )
        
        super().save(*args, **kwargs)
        
        # Update conversation timestamp when message is saved
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
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
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
    
    # Add thumbnail for images
    thumbnail = models.ImageField(upload_to='message_thumbnails/%Y/%m/%d/', blank=True, null=True)

    def __str__(self):
        return f"Attachment: {self.filename} for Message {self.message.id}"

    @property
    def file_size_human(self):
        """Return human-readable file size"""
        size = self.file_size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024.0:
                return f"{size:.1f} {unit}"
            size /= 1024.0
        return f"{size:.1f} TB"

    @property
    def is_image(self):
        """Check if attachment is an image"""
        return self.content_type.startswith('image/')


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
        unique_together = ['message', 'user', 'reaction']

    def __str__(self):
        return f"{self.user.username} reacted {self.reaction} to Message {self.message.id}"


# NEW: User Presence Model for Online/Offline Status
class UserPresence(models.Model):
    """
    Track user online/offline status
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='presence'
    )
    is_online = models.BooleanField(default=False)
    last_seen = models.DateTimeField(auto_now=True)
    last_activity = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        status = "Online" if self.is_online else "Offline"
        return f"{self.user.username} - {status}"

    @classmethod
    def set_user_online(cls, user):
        """Set user as online"""
        presence, created = cls.objects.get_or_create(user=user)
        presence.is_online = True
        presence.last_activity = timezone.now()
        presence.save()
        return presence

    @classmethod
    def set_user_offline(cls, user):
        """Set user as offline"""
        try:
            presence = cls.objects.get(user=user)
            presence.is_online = False
            presence.save()
        except cls.DoesNotExist:
            pass


# Signal to create UserPresence when user is created
@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_user_presence(sender, instance, created, **kwargs):
    if created:
        UserPresence.objects.create(user=instance)
