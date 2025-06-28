from rest_framework import serializers
from .models import User

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id", "username", "email", "avatar_url", "bio",
            "level", "experience_points", "gold_balance",
            "preferred_language", "timezone", "notification_preferences", "privacy_settings"
        ]
        read_only_fields = ["id", "email", "level", "experience_points", "gold_balance"]
