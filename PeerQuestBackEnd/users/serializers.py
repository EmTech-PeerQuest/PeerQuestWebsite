from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.validators import UniqueValidator
from django.contrib.auth.password_validation import validate_password

User = get_user_model()
UserSkill = get_user_model()
UserAchievement = get_user_model()

class GoogleAuthSerializer(serializers.Serializer):
    code = serializers.CharField(required=False)
    error = serializers.CharField(required=False)
    state = serializers.CharField(required=False)
    access_token = serializers.CharField(required=False)
    id_token = serializers.CharField(required=False)

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'avatar_url', 'bio', 'level', 'experience_points', 'gold_balance',
            'is_verified', 'preferred_language', 'timezone'
        ]
        read_only_fields = ['id', 'level', 'experience_points', 'gold_balance', 'is_verified']

class UserSkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSkill
        fields = '__all__'
        read_only_fields = ['id', 'user', 'endorsements_count']

class UserAchievementSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAchievement
        fields = '__all__'
        read_only_fields = ['id', 'user']