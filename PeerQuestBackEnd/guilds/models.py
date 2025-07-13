from django.db import models
from django.contrib.auth import get_user_model
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
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

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    def is_member(self, user):
        return GuildMembership.objects.filter(guild=self, user=user, is_active=True).exists()

    def is_admin(self, user):
        return GuildMembership.objects.filter(
            guild=self,
            user=user,
            is_active=True,
            role__in=['admin', 'owner']
        ).exists()

    def is_owner(self, user):
        return self.owner == user


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
