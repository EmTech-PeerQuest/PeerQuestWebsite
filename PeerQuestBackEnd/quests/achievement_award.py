from django.db import transaction
from users.models import Achievement, UserAchievement

def award_first_quest_achievement(user):
    """
    Award the 'First Quest' achievement to the user if they have completed at least one quest and don't already have it.
    """
    try:
        achievement = Achievement.objects.get(name="First Quest")
    except Achievement.DoesNotExist:
        return False
    if UserAchievement.objects.filter(user=user, achievement=achievement).exists():
        return False
    # Check if user has completed at least one quest
    from quests.models import QuestParticipant
    completed_count = QuestParticipant.objects.filter(user=user, status='completed').count()
    if completed_count > 0:
        with transaction.atomic():
            UserAchievement.objects.create(user=user, achievement=achievement)
        return True
    return False
