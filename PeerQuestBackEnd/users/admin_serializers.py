from rest_framework import serializers
from .models import User

class AdminUserSerializer(serializers.ModelSerializer):
    is_staff = serializers.BooleanField(read_only=True)
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'display_name', 'is_superuser', 'is_staff', 'is_banned',
            'ban_reason', 'ban_expires_at', 'date_joined', 'is_active', 'email_verified',
            'level', 'experience_points', 'gold_balance', 'avatar_url', 'bio',
        ]
        read_only_fields = ['id', 'date_joined', 'is_superuser', 'is_staff', 'level', 'experience_points', 'gold_balance']
