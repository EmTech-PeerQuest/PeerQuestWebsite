from django.db import models
<<<<<<< HEAD
from django.conf import settings


class Guild(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    specialization = models.CharField(max_length=100, blank=True)
    welcome_message = models.TextField(blank=True)
    emblem = models.ImageField(upload_to='guild_emblems/', blank=True, null=True)
    tags = models.JSONField(default=list, blank=True)  # Store up to 5 tags as a list
    social_links = models.JSONField(default=list, blank=True)  # List of {platform, link}
    privacy = models.CharField(max_length=10, choices=[('public', 'Public'), ('private', 'Private')], default='public')
    join_requirements = models.JSONField(default=dict, blank=True)  # {required_approval, min_level}
    visibility = models.JSONField(default=dict, blank=True)  # {allow_discovery, show_on_home}
    permissions = models.JSONField(default=dict, blank=True)  # {post_quests, invite_members}
    created_at = models.DateTimeField(auto_now_add=True)
    leader = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='led_guilds')

    def __str__(self):
        return self.name


class GuildMembership(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    guild = models.ForeignKey(Guild, on_delete=models.CASCADE)
    role = models.CharField(max_length=50, default='Member')  # e.g., Member, Officer, etc.
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'guild')

    def __str__(self):
        return f"{self.user.username} in {self.guild.name} as {self.role}"
=======

# Create your models here.
>>>>>>> origin/main
