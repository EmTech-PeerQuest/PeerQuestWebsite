from django.db import models
from django.contrib.auth import get_user_model
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
import uuid

User = get_user_model()

class Guild(models.Model):
    SPECIALIZATION_CHOICES = [
        ('alchemy', 'Alchemy'),
        ('art_design', 'Art & Design'),
        ('writing', 'Writing'),
        ('research', 'Research'),
        ('protection', 'Protection'),
        ('development', 'Development'),
        ('music', 'Music'),
        ('marketing', 'Marketing'),
    ]

    PRIVACY_CHOICES = [
        ('public', 'Public'),
        ('private', 'Private'),
    ]

    PERMISSION_CHOICES = [
        ('all_members', 'All Members'),
        ('admins_only', 'Admins Only'),
        ('owner_only', 'Owner Only'),
    ]

    # Basic Information
    guild_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(max_length=500)
    specialization = models.CharField(max_length=20, choices=SPECIALIZATION_CHOICES)
    welcome_message = models.TextField(max_length=300, blank=True)

    # Customization
    custom_emblem = models.ImageField(upload_to='guild_emblems/', blank=True, null=True)
    preset_emblem = models.CharField(max_length=50, blank=True)

    # Guild Settings
    privacy = models.CharField(max_length=10, choices=PRIVACY_CHOICES, default='public')

    # Join Requirements
    require_approval = models.BooleanField(default=False)
    minimum_level = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(1), MaxValueValidator(100)]
    )

    # Visibility
    allow_discovery = models.BooleanField(default=True)
    show_on_home_page = models.BooleanField(default=True)

    # Permissions
    who_can_post_quests = models.CharField(
        max_length=15,
        choices=PERMISSION_CHOICES,
        default='all_members'
    )
    who_can_invite_members = models.CharField(
        max_length=15,
        choices=PERMISSION_CHOICES,
        default='all_members'
    )

    # Meta
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='owned_guilds')
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        through='GuildMembership',
        through_fields=('guild', 'user'),
        related_name='guilds'
    )
    member_count = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    member_count = models.PositiveIntegerField(default=1)  # Starts with 1 (the owner)
    
    # Moderation System
    is_disabled = models.BooleanField(default=False)  # True when guild is disabled due to warnings
    warning_count = models.PositiveIntegerField(default=0)  # Current number of active warnings
    disabled_at = models.DateTimeField(null=True, blank=True)  # When guild was disabled
    disabled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='disabled_guilds'
    )
    disable_reason = models.TextField(max_length=500, blank=True)  # Reason for disabling
    
    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    def is_member(self, user):
        return GuildMembership.objects.filter(guild=self, user=user, is_active=True).exists()

    def is_admin(self, user):
        """Check if a user is an admin of this guild (includes owner)"""
        # Guild owner always has admin permissions
        if self.owner == user:
            return True
        
        # Check if user is an admin member
        return GuildMembership.objects.filter(
            guild=self,
            user=user,
            is_active=True,
            role__in=['admin', 'owner']
        ).exists()

    def is_owner(self, user):
        return self.owner == user
    
    def add_warning(self, admin_user, reason):
        """Add a warning to the guild and check if it should be disabled"""
        from django.utils import timezone
        
        # Create warning record
        warning = GuildWarning.objects.create(
            guild=self,
            reason=reason,
            issued_by=admin_user,
            issued_at=timezone.now()
        )
        
        # Update warning count (only count active warnings from last week)
        active_warnings = GuildWarning.objects.filter(
            guild=self,
            issued_at__gte=timezone.now() - timezone.timedelta(days=7)
        ).count()
        
        self.warning_count = active_warnings
        
        # Create notification for guild owner about warning
        from notifications.models import Notification
        Notification.objects.create(
            user=self.owner,
            notif_type="guild_warned",
            title=f"Guild Warning Issued",
            message=f"Your guild '{self.name}' has received a warning: {reason}. Total warnings: {self.warning_count}/3",
            guild_id=self.guild_id,
            guild_name=self.name,
            reason=reason
        )
        
        # Disable guild if it reaches 3 warnings
        if self.warning_count >= 3 and not self.is_disabled:
            self.is_disabled = True
            self.disabled_at = timezone.now()
            self.disabled_by = admin_user
            self.disable_reason = f"Guild disabled due to {self.warning_count} warnings within 7 days"
            
            # Create notification for guild owner about disabling
            Notification.objects.create(
                user=self.owner,
                notif_type="guild_disabled",
                title=f"Guild Disabled",
                message=f"Your guild '{self.name}' has been disabled due to receiving {self.warning_count} warnings within 7 days.",
                guild_id=self.guild_id,
                guild_name=self.name,
                reason=self.disable_reason
            )
        
        self.save()
        return warning
    
    def reset_warnings(self):
        """Reset all warnings for the guild (admin action)"""
        was_disabled = self.is_disabled
        self.warning_count = 0
        if self.is_disabled:
            self.is_disabled = False
            self.disabled_at = None
            self.disabled_by = None
            self.disable_reason = ""
        self.save()
        
        # Create notification for guild owner about warning reset
        from notifications.models import Notification
        message = f"All warnings for your guild '{self.name}' have been reset by an administrator."
        if was_disabled:
            message += " Your guild has also been re-enabled."
        
        Notification.objects.create(
            user=self.owner,
            notif_type="warning_reset",
            title=f"Guild Warnings Reset",
            message=message,
            guild_id=self.guild_id,
            guild_name=self.name
        )
    
    def disable_guild(self, admin_user, reason):
        """Manually disable a guild"""
        from django.utils import timezone
        self.is_disabled = True
        self.disabled_at = timezone.now()
        self.disabled_by = admin_user
        self.disable_reason = reason
        self.save()
        
        # Create notification for guild owner about manual disabling
        from notifications.models import Notification
        Notification.objects.create(
            user=self.owner,
            notif_type="guild_disabled",
            title=f"Guild Disabled",
            message=f"Your guild '{self.name}' has been disabled by an administrator. Reason: {reason}",
            guild_id=self.guild_id,
            guild_name=self.name,
            reason=reason
        )
    
    def enable_guild(self):
        """Re-enable a disabled guild"""
        self.is_disabled = False
        self.disabled_at = None
        self.disabled_by = None
        self.disable_reason = ""
        self.save()
        
        # Create notification for guild owner about re-enabling
        from notifications.models import Notification
        Notification.objects.create(
            user=self.owner,
            notif_type="guild_re_enabled",
            title=f"Guild Re-enabled",
            message=f"Your guild '{self.name}' has been re-enabled by an administrator.",
            guild_id=self.guild_id,
            guild_name=self.name
        )
    
    def get_active_warnings(self):
        """Get warnings from the last 7 days"""
        from django.utils import timezone
        return GuildWarning.objects.filter(
            guild=self,
            issued_at__gte=timezone.now() - timezone.timedelta(days=7)
        ).order_by('-issued_at')
    
    def can_perform_actions(self):
        """Check if guild can perform actions (not disabled)"""
        return not self.is_disabled


class GuildWarning(models.Model):
    """Model to track guild warnings issued by admins"""
    guild = models.ForeignKey(Guild, on_delete=models.CASCADE, related_name='warnings')
    reason = models.TextField(max_length=500)
    issued_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='issued_guild_warnings')
    issued_at = models.DateTimeField(auto_now_add=True)
    dismissed_at = models.DateTimeField(null=True, blank=True)  # When guild owner dismisses the warning
    dismissed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='dismissed_guild_warnings'
    )
    
    class Meta:
        ordering = ['-issued_at']
    
    def __str__(self):
        return f"Warning for {self.guild.name} - {self.issued_at.strftime('%Y-%m-%d')}"
    
    def dismiss(self, user):
        """Dismiss the warning (guild owner action)"""
        from django.utils import timezone
        self.dismissed_at = timezone.now()
        self.dismissed_by = user
        self.save()
    
    def is_dismissed(self):
        """Check if warning has been dismissed"""
        return self.dismissed_at is not None
    
    def is_active(self):
        """Check if warning is still active (within 7 days and not dismissed)"""
        from django.utils import timezone
        if self.dismissed_at:
            return False
        return self.issued_at >= timezone.now() - timezone.timedelta(days=7)


class GuildTag(models.Model):
    guild = models.ForeignKey(Guild, on_delete=models.CASCADE, related_name='tags')
    tag = models.CharField(max_length=30)

    class Meta:
        unique_together = ['guild', 'tag']

    def __str__(self):
        return f"{self.guild.name} - {self.tag}"


class GuildSocialLink(models.Model):
    guild = models.ForeignKey(Guild, on_delete=models.CASCADE, related_name='social_links')
    platform_name = models.CharField(max_length=50)
    url = models.URLField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['guild', 'platform_name']

    def __str__(self):
        return f"{self.guild.name} - {self.platform_name}"


class GuildMembership(models.Model):
    ROLE_CHOICES = [
        ('owner', 'Owner'),
        ('admin', 'Admin'),
        ('member', 'Member'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('left', 'Left'),
        ('kicked', 'Kicked'),
    ]

    guild = models.ForeignKey(Guild, on_delete=models.CASCADE, related_name='memberships')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='guild_memberships')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='member')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    is_active = models.BooleanField(default=False)

    joined_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    left_at = models.DateTimeField(null=True, blank=True)

    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_memberships'
    )

    class Meta:
        unique_together = ['guild', 'user']
        ordering = ['-joined_at']

    def __str__(self):
        return f"{self.user.username} - {self.guild.name} ({self.role})"

    def approve(self, approved_by_user):
        from django.utils import timezone
        self.status = 'approved'
        self.is_active = True
        self.approved_at = timezone.now()
        self.approved_by = approved_by_user
        self.save()
        self.guild.member_count = self.guild.memberships.filter(is_active=True).count()
        self.guild.save()

    def reject(self, rejected_by_user):
        self.status = 'rejected'
        self.is_active = False
        self.approved_by = rejected_by_user
        self.save()

    def leave(self):
        from django.utils import timezone
        self.status = 'left'
        self.is_active = False
        self.left_at = timezone.now()
        self.save()
        self.guild.member_count = self.guild.memberships.filter(is_active=True).count()
        self.guild.save()

    def kick(self, kicked_by_user):
        from django.utils import timezone
        self.status = 'kicked'
        self.is_active = False
        self.left_at = timezone.now()
        self.approved_by = kicked_by_user
        self.save()
        self.guild.member_count = self.guild.memberships.filter(is_active=True).count()
        self.guild.save()


class GuildJoinRequest(models.Model):
    guild = models.ForeignKey(Guild, on_delete=models.CASCADE, related_name='join_requests')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='guild_join_requests')
    message = models.TextField(max_length=300, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    processed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='processed_join_requests'
    )
    is_approved = models.BooleanField(null=True, blank=True)

    class Meta:
        unique_together = ['guild', 'user']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} -> {self.guild.name}"


class GuildChatMessage(models.Model):
    guild = models.ForeignKey(Guild, on_delete=models.CASCADE, related_name='chat_messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField(max_length=1000)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.guild.name}] {self.sender.username}: {self.content[:30]}"
    
    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        # Notify guild owner/admins about new join request
        if is_new and self.is_approved is None:
            from notifications.models import Notification
            # Notify guild owner
            Notification.objects.create(
                user=self.guild.owner,
                notif_type='guild_event',
                title='New Guild Join Request',
                message=f'{self.user.username} has requested to join your guild "{self.guild.name}".',
                guild_id=str(self.guild.guild_id),
                guild_name=self.guild.name,
                applicant=self.user.username
            )
    
    def approve(self, processed_by_user):
        """Approve the join request and add user to guild"""
        from django.utils import timezone
        self.is_approved = True
        self.processed_by = processed_by_user
        self.processed_at = timezone.now()
        self.save()
        # Add user to guild as a member (create GuildMembership if not exists)
        from .models import GuildMembership
        membership, created = GuildMembership.objects.get_or_create(
            guild=self.guild,
            user=self.user,
            defaults={
                'role': 'member',
                'status': 'approved',
                'is_active': True
            }
        )
        if not created:
            membership.status = 'approved'
            membership.is_active = True
            membership.save()
        # Update guild member count
        self.guild.member_count = self.guild.memberships.filter(is_active=True).count()
        self.guild.save()
        # Notify applicant of approval
        from notifications.models import Notification
        Notification.objects.create(
            user=self.user,
            notif_type='guild_application_approved',
            title='Guild Join Request Approved',
            message=f'Your request to join guild "{self.guild.name}" has been approved!',
            guild_id=str(self.guild.guild_id),
            guild_name=self.guild.name,
            status='approved'
        )

    def reject(self, processed_by_user):
        """Reject the join request"""
        from django.utils import timezone
        self.is_approved = False
        self.processed_by = processed_by_user
        self.processed_at = timezone.now()
        self.save()
        # Notify applicant of rejection
        from notifications.models import Notification
        Notification.objects.create(
            user=self.user,
            notif_type='guild_application_rejected',
            title='Guild Join Request Rejected',
            message=f'Your request to join guild "{self.guild.name}" was rejected.',
            guild_id=str(self.guild.guild_id),
            guild_name=self.guild.name,
            status='rejected'
        )
