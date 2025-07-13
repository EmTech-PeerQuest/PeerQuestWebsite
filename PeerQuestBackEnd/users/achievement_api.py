from rest_framework import serializers
from .models import UserAchievement

class UserAchievementSerializer(serializers.ModelSerializer):
    achievement_name = serializers.CharField(source='achievement.name', read_only=True)
    achievement_type = serializers.CharField(source='achievement.category', read_only=True)
    description = serializers.CharField(source='achievement.description', read_only=True)
    earned_at = serializers.DateTimeField(source='awarded_at', read_only=True)

    class Meta:
        model = UserAchievement
        fields = ['id', 'achievement_type', 'achievement_name', 'description', 'earned_at']
