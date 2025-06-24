from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _
import uuid

class NewUser(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    avatar_url = models.URLField(max_length=255, blank=True, null=True)
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
    
    # OAuth fields
    google_id = models.CharField(max_length=255, blank=True, null=True, unique=True)
    
    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')

    def __str__(self):
        return self.username

    def save(self, *args, **kwargs):
        self.level = self.calculate_level()
        super().save(*args, **kwargs)

    def calculate_level(self):
        # Implement your level calculation logic
        return min(100, max(1, self.experience_points // 1000))

class UserSkill(models.Model):
    class ProficiencyLevel(models.TextChoices):
        BEGINNER = 'beginner', _('Beginner')
        INTERMEDIATE = 'intermediate', _('Intermediate')
        ADVANCED = 'advanced', _('Advanced')
        EXPERT = 'expert', _('Expert')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(NewUser, on_delete=models.CASCADE, related_name='skills')
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
    user = models.ForeignKey(NewUser, on_delete=models.CASCADE, related_name='achievements')
    achievement_type = models.CharField(max_length=50)
    achievement_name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    icon_url = models.URLField(max_length=255, blank=True)
    rarity = models.CharField(max_length=10, choices=RarityLevel.choices, default=RarityLevel.COMMON)
    points_value = models.IntegerField(default=0)
    category = models.CharField(max_length=50, blank=True)

    class Meta:
        unique_together = ('user', 'achievement_name')