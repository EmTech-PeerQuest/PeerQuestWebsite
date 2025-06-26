# from django.utils import timezone
# from notifications.models import Notification
# # from user_achievements.models import UserAchievement

# def calculate_level(xp):
#     return int((xp ** 0.5) // 2 + 1)

# async def award_xp(user, amount=10, reason=""):
#     user.experience_points += amount
#     new_level = calculate_level(user.experience_points)

#     leveled_up = new_level > user.level
#     if leveled_up:
#         user.level = new_level
#         user.gold_balance += 50  # reward
#         user.save()

#         # Log an achievement
#         # UserAchievement.objects.create(
#         #     user=user,
#         #     achievement_type="Level",
#         #     achievement_name=f"Level {new_level}",
#         #     description="You leveled up!",
#         #     earned_at=timezone.now()
#         # )

#         # Notify the user
#         Notification.objects.create(
#             user=user,
#             type="Achievement",
#             title="Level Up!",
#             message=f"You reached Level {new_level} and earned 50 gold!"
#         )

#     else:
#         user.save()