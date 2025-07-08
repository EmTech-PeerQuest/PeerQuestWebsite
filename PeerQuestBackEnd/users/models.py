

# Ban Appeal model for user ban appeals

from django.db import models
class ActionLog(models.Model):
    ACTION_CHOICES = [
        ("ban_lifted", "Ban Lifted"),
        ("ban_dismissed", "Ban Appeal Dismissed"),
        ("ban_resolved", "Ban Appeal Resolved"),
        ("user_banned", "User Banned"),
        ("user_unbanned", "User Unbanned"),
        ("user_deleted", "User Deleted"),
    ]
    action = models.CharField(max_length=32, choices=ACTION_CHOICES)
    admin = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, related_name='admin_actions')
    target_user = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, related_name='targeted_actions')
    details = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.action} by {self.admin.username if self.admin else 'Unknown'} on {self.target_user.username if self.target_user else 'Unknown'} at {self.created_at}" 

# Ban Appeal model for user ban appeals
class BanAppeal(models.Model):
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='ban_appeals')
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed = models.BooleanField(default=False)
    reviewed_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_appeals')
    review_decision = models.CharField(max_length=20, blank=True, null=True, choices=[('dismissed', 'Dismissed'), ('lifted', 'Ban Lifted')])
    review_comment = models.TextField(blank=True, null=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"BanAppeal by {self.user.username} at {self.created_at}"

# New: Support multiple files per appeal
class BanAppealFile(models.Model):
    appeal = models.ForeignKey(BanAppeal, on_delete=models.CASCADE, related_name='files')
    file = models.FileField(upload_to='ban_appeals/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _
from rest_framework_simplejwt.tokens import RefreshToken
import uuid

class User(AbstractUser):
    # Override email to make it unique
    email = models.EmailField(_('email address'), unique=True)
    
    display_name = models.CharField(max_length=150, blank=True)
    birthday = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=20, blank=True)
    location = models.CharField(max_length=255, blank=True)
    social_links = models.JSONField(default=dict, blank=True)
    settings = models.JSONField(default=dict, blank=True)
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    avatar_url = models.URLField(max_length=255, blank=True, null=True)
    avatar_data = models.TextField(blank=True, null=True)  # For base64 image data
    bio = models.TextField(blank=True)
    level = models.IntegerField(default=1)
    experience_points = models.IntegerField(default=0)
    gold_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    is_admin = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    verification_documents = models.JSONField(default=dict, blank=True)
    preferred_language = models.CharField(max_length=10, default='en')
    timezone = models.CharField(max_length=50, default='UTC')
    notification_preferences = models.JSONField(default=dict, blank=True)
    privacy_settings = models.JSONField(default=dict, blank=True)
    last_login = models.DateTimeField(null=True, blank=True)
    last_seen = models.DateTimeField(null=True, blank=True)
    
    # Email verification fields
    email_verified = models.BooleanField(default=False)
    email_verification_token = models.CharField(max_length=255, blank=True, null=True)
    email_verification_sent_at = models.DateTimeField(null=True, blank=True)

    # Admin ban system
    is_banned = models.BooleanField(default=False)
    ban_reason = models.CharField(max_length=255, blank=True, null=True)
    ban_expires_at = models.DateTimeField(null=True, blank=True)
    
    # Security settings
    two_factor_enabled = models.BooleanField(default=False)
    two_factor_method = models.CharField(max_length=20, default='email', blank=True)
    backup_codes_generated = models.BooleanField(default=False)
    last_password_change = models.DateTimeField(null=True, blank=True)
    
    # Spending limits
    spending_limits = models.JSONField(default=dict, blank=True)
    
    # OAuth fields
    google_id = models.CharField(max_length=255, blank=True, null=True, unique=True)
    
    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')

    def __str__(self):
        return self.username

    def save(self, *args, **kwargs):
        # Set last_password_change to current time if it's a new user and not set
        if not self.pk and self.last_password_change is None:
            from django.utils import timezone
            self.last_password_change = timezone.now()

        # Automatically verify superusers
        if self.is_superuser and not self.email_verified:
            self.email_verified = True

        # If ban has expired, unban the user automatically
        from django.utils import timezone
        if self.is_banned and self.ban_expires_at:
            if timezone.now() > self.ban_expires_at:
                self.is_banned = False
                self.ban_reason = None
                self.ban_expires_at = None

        self.level = self.calculate_level()
        super().save(*args, **kwargs)

    def set_password(self, raw_password):
        """Override set_password to update last_password_change timestamp."""
        from django.utils import timezone
        super().set_password(raw_password)
        self.last_password_change = timezone.now()

    def calculate_level(self):
        # Implement your level calculation logic
        return min(100, max(1, self.experience_points // 1000))

class BlacklistedToken(models.Model):
    """Model to track blacklisted/revoked tokens"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    token_jti = models.CharField(max_length=255, unique=True, db_index=True)  # JWT ID from token
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blacklisted_tokens')
    token_type = models.CharField(max_length=20, choices=[
        ('access', 'Access Token'),
        ('refresh', 'Refresh Token'),
    ])
    blacklisted_at = models.DateTimeField(auto_now_add=True)
    reason = models.CharField(max_length=100, choices=[
        ('logout', 'User Logout'),
        ('password_change', 'Password Changed'),
        ('security_breach', 'Security Breach'),
        ('account_deactivation', 'Account Deactivated'),
        ('manual_revoke', 'Manual Revocation'),
    ], default='logout')
    
    class Meta:
        db_table = 'blacklisted_tokens'
        indexes = [
            models.Index(fields=['token_jti']),
            models.Index(fields=['user', 'blacklisted_at']),
        ]
    
    def __str__(self):
        return f"Blacklisted {self.token_type} token for {self.user.username}"

class UserSession(models.Model):
    """Model to track active user sessions"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    refresh_token_jti = models.CharField(max_length=255, unique=True, db_index=True)
    device_info = models.JSONField(default=dict, blank=True)  # Browser, OS, etc.
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'user_sessions'
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['refresh_token_jti']),
        ]
    
    def __str__(self):
        return f"Session for {self.user.username} from {self.ip_address}"

class UserSkill(models.Model):
    class ProficiencyLevel(models.TextChoices):
        BEGINNER = 'beginner', _('Beginner')
        INTERMEDIATE = 'intermediate', _('Intermediate')
        ADVANCED = 'advanced', _('Advanced')
        EXPERT = 'expert', _('Expert')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='skills')
    skill_name = models.CharField(max_length=50)
    skill_category = models.CharField(max_length=50, blank=True)
    proficiency_level = models.CharField(max_length=12, choices=ProficiencyLevel.choices)
    years_experience = models.IntegerField(null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    endorsements_count = models.IntegerField(default=0)

    class Meta:
        unique_together = ('user', 'skill_name')

class UserAchievement(models.Model):
    class RarityLevel(models.TextChoices):
        COMMON = 'common', _('Common')
        UNCOMMON = 'uncommon', _('Uncommon')
        RARE = 'rare', _('Rare')
        EPIC = 'epic', _('Epic')
        LEGENDARY = 'legendary', _('Legendary')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='achievements')
    achievement_type = models.CharField(max_length=50)
    achievement_name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    icon_url = models.URLField(max_length=255, blank=True)
    rarity = models.CharField(max_length=10, choices=RarityLevel.choices, default=RarityLevel.COMMON)
    points_value = models.IntegerField(default=0)
    category = models.CharField(max_length=50, blank=True)

    class Meta:
        unique_together = ('user', 'achievement_name')