from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import User, UserAchievement, Achievement
from .achievement_api import UserAchievementSerializer
from django.shortcuts import get_object_or_404

class UserAchievementsFullView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, user_id):
        user = get_object_or_404(User, id=user_id)
        all_achievements = Achievement.objects.all()
        user_achievements = UserAchievement.objects.filter(user=user)
        owned_ids = set(ua.achievement.id for ua in user_achievements)
        owned = []
        unowned = []
        for ach in all_achievements:
            ach_data = {
                'id': str(ach.id),
                'achievement_type': ach.category,
                'achievement_name': ach.name,
                'description': ach.description,
                'earned_at': None,
                'owned': False,
            }
            if ach.id in owned_ids:
                ua = user_achievements.get(achievement=ach)
                ach_data['earned_at'] = ua.awarded_at
                ach_data['owned'] = True
                owned.append(ach_data)
            else:
                unowned.append(ach_data)
        return Response({'owned': owned, 'unowned': unowned})
