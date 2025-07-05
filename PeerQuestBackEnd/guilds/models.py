
from django.db import models
from django.conf import settings
from django.utils import timezone

class Guild(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    avatar = models.ImageField(upload_to='guild_avatars/', blank=True, null=True)
    banner = models.ImageField(upload_to='guild_banners/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_public = models.BooleanField(default=True, help_text='Whether the guild is publicly visible')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='owned_guilds')
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        through='GuildMembership',
        related_name='guilds',
        blank=True
    )

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

class GuildMembership(models.Model):
    ROLE_CHOICES = [
        ('member', 'Member'),
        ('moderator', 'Moderator'),
        ('admin', 'Admin'),
        ('owner', 'Owner'),
    ]
    guild = models.ForeignKey(Guild, on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='member')
    joined_at = models.DateTimeField(auto_now_add=True)
    can_post_quests = models.BooleanField(default=False, help_text='Can create quests on behalf of the guild')

    class Meta:
        unique_together = ('guild', 'user')

    def __str__(self):
        return f"{self.user.username} in {self.guild.name} as {self.role}"
