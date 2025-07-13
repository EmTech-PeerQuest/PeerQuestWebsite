from django.conf import settings
from django.db import transaction
from users.models import User


def award_xp(user, xp_amount, reason="Quest completion"):
    """
    Award XP to a user and handle level up logic.
    
    Args:
        user: User instance or user ID
        xp_amount: Amount of XP to award
        reason: Reason for awarding XP (for logging/notifications)
    
    Returns:
        dict: Contains updated user info and whether they leveled up
    """
    if isinstance(user, int):
        from users.models import User
        try:
            user = User.objects.get(id=user)
        except User.DoesNotExist:
            return {"error": "User not found"}
    
    old_xp = user.xp
    old_level = calculate_level(old_xp)

    from users.models_reward import XPTransaction
    with transaction.atomic():
        XPTransaction.objects.create(user=user, amount=xp_amount, reason=reason)
        new_xp = user.xp  # property will now reflect the new total
        new_level = calculate_level(new_xp)
        user.level = new_level
        user.save(update_fields=["level"])

    leveled_up = new_level > old_level

    return {
        "user": user,
        "old_xp": old_xp,
        "new_xp": new_xp,
        "old_level": old_level,
        "new_level": new_level,
        "leveled_up": leveled_up,
        "xp_awarded": xp_amount,
        "reason": reason
    }


def calculate_level(xp):
    """
    Calculate user level based on XP.
    Uses a simple formula: level = floor(xp / 100) + 1
    """
    if xp < 0:
        return 1
    return (xp // 100) + 1


def get_xp_for_next_level(current_xp):
    """
    Calculate XP needed for the next level.
    """
    current_level = calculate_level(current_xp)
    next_level_xp = current_level * 100
    return next_level_xp - current_xp


def get_level_progress(current_xp):
    """
    Get progress percentage towards the next level.
    """
    current_level = calculate_level(current_xp)
    current_level_start_xp = (current_level - 1) * 100
    next_level_start_xp = current_level * 100
    
    progress_xp = current_xp - current_level_start_xp
    level_xp_range = next_level_start_xp - current_level_start_xp
    
    if level_xp_range == 0:
        return 100
    
    return min(100, (progress_xp / level_xp_range) * 100)


def get_difficulty_xp_reward(difficulty):
    """
    Get the XP reward for a specific difficulty level.
    """
    from quests.models import Quest
    return Quest.DIFFICULTY_XP_MAPPING.get(difficulty, 50)