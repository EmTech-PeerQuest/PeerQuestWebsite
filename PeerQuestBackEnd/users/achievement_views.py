from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import User, UserAchievement
from .achievement_api import UserAchievementSerializer
from django.shortcuts import get_object_or_404

class UserAchievementsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, user_id):
        user = get_object_or_404(User, id=user_id)
        achievements = UserAchievement.objects.filter(user=user).select_related('achievement')
        serializer = UserAchievementSerializer(achievements, many=True)
        return Response(serializer.data)
