# User Report model for reporting users
from django.db import models

class UserReport(models.Model):
    reported_user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='reports_against')
    reporter = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='reports_made')
    reason = models.CharField(max_length=255)
    message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved = models.BooleanField(default=False)
    resolved_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='resolved_reports')
    resolved_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Report by {self.reporter.username} against {self.reported_user.username} at {self.created_at}"

# Quest Report model for reporting quests
class QuestReport(models.Model):
    from quests.models import Quest
    reported_quest = models.ForeignKey('quests.Quest', on_delete=models.CASCADE, related_name='reports_against')
    reporter = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='quest_reports_made')
    reason = models.CharField(max_length=255)
    message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved = models.BooleanField(default=False)
    resolved_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='resolved_quest_reports')
    resolved_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"QuestReport by {self.reporter.username} against Quest {self.reported_quest.id} at {self.created_at}"


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
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.hashers import make_password, check_password
import uuid

# User Role Hierarchy
class UserRole(models.TextChoices):
    QUEST_MAKER = 'quest_maker', _('Quest Maker')
    ADVENTURER = 'adventurer', _('Adventurer')
    MODERATOR = 'moderator', _('Moderator')
    ADMIN = 'admin', _('Admin')

ROLE_HIERARCHY = {
    UserRole.QUEST_MAKER: 1,
    UserRole.ADVENTURER: 2,
    UserRole.MODERATOR: 3,
    UserRole.ADMIN: 4,
}

# College student skills categories
COLLEGE_SKILLS = {
    'Programming & Tech': [
        'Python', 'JavaScript', 'Java', 'C++', 'HTML/CSS', 'React', 'Node.js', 
        'SQL', 'Git', 'Web Development', 'Mobile App Development', 'Data Analysis',
        'Machine Learning', 'Cybersecurity', 'UI/UX Design', 'Database Management'
    ],
    'Business & Finance': [
        'Financial Analysis', 'Accounting', 'Marketing', 'Project Management',
        'Business Strategy', 'Excel', 'PowerPoint', 'Market Research',
        'Social Media Marketing', 'Content Creation', 'Sales', 'Entrepreneurship'
    ],
    'Design & Creative': [
        'Graphic Design', 'Video Editing', 'Photography', 'Adobe Creative Suite',
        'Illustration', 'Animation', 'Web Design', 'Logo Design', 'Branding',
        'Digital Art', 'Typography', 'Print Design'
    ],
    'Writing & Communication': [
        'Technical Writing', 'Creative Writing', 'Content Writing', 'Copywriting',
        'Editing', 'Proofreading', 'Public Speaking', 'Presentation Skills',
        'Blog Writing', 'Academic Writing', 'Translation', 'Social Media Content'
    ],
    'Science & Research': [
        'Research Methods', 'Data Collection', 'Statistical Analysis', 'Lab Skills',
        'Scientific Writing', 'Literature Review', 'SPSS', 'R Programming',
        'Survey Design', 'Experimental Design', 'Critical Thinking', 'Problem Solving'
    ],
    'Language': [
        'Spanish', 'French', 'German', 'Chinese (Mandarin)', 'Japanese', 'Korean',
        'Arabic', 'Portuguese', 'Italian', 'Russian', 'Hindi', 'ESL Teaching'
    ],
    'Education & Tutoring': [
        'Math Tutoring', 'Science Tutoring', 'Language Teaching', 'Test Prep',
        'Curriculum Development', 'Lesson Planning', 'Student Mentoring',
        'Online Teaching', 'Study Skills', 'Academic Coaching'
    ],
    'Leadership & Teamwork': [
        'Team Leadership', 'Event Planning', 'Volunteer Coordination', 'Mentoring',
        'Conflict Resolution', 'Networking', 'Collaboration', 'Time Management',
        'Organization', 'Decision Making', 'Delegation', 'Community Building'
    ]
}

class Skill(models.Model):
    """Master list of available skills for college students"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['category', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.category})"

class User(AbstractUser):
    # Override email to make it unique
    email = models.EmailField(_('email address'), unique=True)
    
    # User Role
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.QUEST_MAKER,
        help_text=_('User role determining permissions and access level')
    )
    
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
    # Removed experience_points and gold_balance fields; now use transaction tables
    from .models_reward import XPTransaction, GoldTransaction
    @property
    def xp(self):
        from .models_reward import XPTransaction
        return XPTransaction.objects.filter(user=self).aggregate(models.Sum('amount'))['amount__sum'] or 0

    @property
    def gold(self):
        from .models_reward import GoldTransaction
        return GoldTransaction.objects.filter(user=self).aggregate(models.Sum('amount'))['amount__sum'] or 0

    @gold.setter
    def gold(self, value):
        """
        Set the user's gold by creating a GoldTransaction to adjust the balance.
        This setter will create a transaction for the difference between the new value and the current value.
        """
        from .models_reward import GoldTransaction
        current_gold = self.gold
        diff = value - current_gold
        if diff != 0:
            GoldTransaction.objects.create(user=self, amount=diff, reason='admin_set')
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
        """Override set_password to update last_password_change timestamp and track password history."""
        from django.utils import timezone
        
        # Skip password history for superadmins if this is not their first password
        if not self.is_superuser and self.pk:
            # Add current password to history before changing it
            # Import here to avoid circular imports
            from .models import PasswordHistory
            if self.password:  # Only add to history if there's an existing password
                PasswordHistory.add_password_to_history(self, self.password)
        
        super().set_password(raw_password)
        self.last_password_change = timezone.now()

    def calculate_level(self):
        # Level is now based on transaction-based XP
        return min(100, max(1, self.xp // 1000))

    # Role hierarchy methods
    def role_level(self):
        """Get the numeric level of the user's role."""
        return ROLE_HIERARCHY.get(self.role, 0)

    def is_at_least(self, required_role):
        """Check if user has required role or higher."""
        return self.role_level() >= ROLE_HIERARCHY.get(required_role, 0)

    def is_admin_role(self):
        """Check if user has admin role."""
        return self.role == UserRole.ADMIN

    def is_moderator_role(self):
        """Check if user has moderator role."""
        return self.role == UserRole.MODERATOR

    def is_adventurer_role(self):
        """Check if user has adventurer role."""
        return self.role == UserRole.ADVENTURER

    def is_quest_maker_role(self):
        """Check if user has quest maker role."""
        return self.role == UserRole.QUEST_MAKER

    def get_role_display_name(self):
        """Get the display name for the user's role."""
        return dict(UserRole.choices).get(self.role, 'Unknown')

    def can_moderate(self):
        """Check if user can perform moderation actions."""
        return self.is_at_least(UserRole.MODERATOR)

    def can_admin(self):
        """Check if user can perform admin actions."""
        return self.is_at_least(UserRole.ADMIN)

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
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_skills')
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE, related_name='user_skills', null=True, blank=True)
    proficiency_level = models.CharField(max_length=12, choices=ProficiencyLevel.choices, default=ProficiencyLevel.BEGINNER)
    years_experience = models.IntegerField(null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    endorsements_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'skill')
        ordering = ['-proficiency_level', 'skill__name']
    
    def __str__(self):
        return f"{self.user.username} - {self.skill.name} ({self.proficiency_level})"


# Master Achievement model
class Achievement(models.Model):
    class RarityLevel(models.TextChoices):
        COMMON = 'common', _('Common')
        UNCOMMON = 'uncommon', _('Uncommon')
        RARE = 'rare', _('Rare')
        EPIC = 'epic', _('Epic')
        LEGENDARY = 'legendary', _('Legendary')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    icon_url = models.URLField(max_length=255, blank=True)
    rarity = models.CharField(max_length=10, choices=RarityLevel.choices, default=RarityLevel.COMMON)
    points_value = models.IntegerField(default=0)
    category = models.CharField(max_length=50, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-rarity', 'name']

    def __str__(self):
        return f"{self.name} ({self.rarity})"

# UserAchievement now references Achievement
class UserAchievement(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='achievements')
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE, related_name='user_achievements', null=True, blank=True)
    awarded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'achievement')

class PasswordHistory(models.Model):
    """Track user password history for security."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_history')
    password_hash = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = _('Password History')
        verbose_name_plural = _('Password Histories')
    
    def set_password(self, raw_password):
        """Set the password hash."""
        self.password_hash = make_password(raw_password)
    
    def check_password(self, raw_password):
        """Check if the raw password matches this historical password."""
        return check_password(raw_password, self.password_hash)
    
    @classmethod
    def add_password_to_history(cls, user, raw_password):
        """Add a password to the user's history."""
        password_history = cls(user=user)
        password_history.set_password(raw_password)
        password_history.save()
        
        # Keep only the last 10 passwords
        old_passwords = cls.objects.filter(user=user).order_by('-created_at')[10:]
        if old_passwords:
            cls.objects.filter(id__in=[p.id for p in old_passwords]).delete()

class SecurityEvent(models.Model):
    """Track security-related events."""
    EVENT_TYPES = [
        ('password_change', 'Password Change'),
        ('password_reset', 'Password Reset'),
        ('failed_login', 'Failed Login'),
        ('successful_login', 'Successful Login'),
        ('account_lockout', 'Account Lockout'),
        ('suspicious_activity', 'Suspicious Activity'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='security_events')
    event_type = models.CharField(max_length=50, choices=EVENT_TYPES)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    details = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
        verbose_name = _('Security Event')
        verbose_name_plural = _('Security Events')
    
    def __str__(self):
        return f"{self.user.username} - {self.event_type} - {self.timestamp}"