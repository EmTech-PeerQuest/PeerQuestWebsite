from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from users.models import UserAchievement, Achievement
from .models import Guild

@receiver(post_save, sender=Guild)
def award_guild_leader_achievement(sender, instance, created, **kwargs):
    if created:
        # Award "Guild Leader" achievement to the owner
        try:
            achievement = Achievement.objects.get(name="Guild Leader")
            UserAchievement.objects.get_or_create(user=instance.owner, achievement=achievement)
        except Achievement.DoesNotExist:
            pass
