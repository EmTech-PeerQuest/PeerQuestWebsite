from .validators import PROFANITY_LIST, LEET_MAP, levenshtein, normalize_username
from itertools import product
import unicodedata
from rest_framework import serializers
from .models import User
from django.contrib.auth.password_validation import validate_password

class UserInfoUpdateSerializer(serializers.ModelSerializer):
    # Accept nested objects for social_links and settings
    social_links = serializers.JSONField(required=False)
    settings = serializers.JSONField(required=False)
    spending_limits = serializers.JSONField(required=False)

    class Meta:
        model = User
        fields = [
            "display_name", "username", "email", "bio", "birthday", "gender", "location",
            "social_links", "settings", "avatar_url", "avatar_data", "preferred_language", "timezone",
            "notification_preferences", "privacy_settings", "two_factor_enabled", "two_factor_method",
            "backup_codes_generated", "spending_limits"
        ]
        extra_kwargs = {field: {"required": False, "allow_null": True} for field in fields}

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id", "username", "email", "email_verified", "avatar_url", "avatar_data", "bio", "birthday", "gender",
            "level", "experience_points", "gold_balance",
            "preferred_language", "timezone", "notification_preferences", "privacy_settings",
            "two_factor_enabled", "two_factor_method", "backup_codes_generated", "spending_limits",
            "last_password_change", "date_joined"
        ]
        read_only_fields = ["id", "email", "email_verified", "level", "experience_points", "gold_balance", "last_password_change", "date_joined"]

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'display_name']
        extra_kwargs = {
            'password': {'write_only': True},
            'password_confirm': {'write_only': True}
        }
    
    def validate(self, attrs):
        # Check if passwords match
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords do not match.")
        
        # Validate password strength
        try:
            validate_password(attrs['password'])
        except Exception as e:
            raise serializers.ValidationError({"password": list(e.messages)})
        
        return attrs
    
    def validate_username(self, value):
        # Normalize and validate username
        value = value.strip()
        
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        
        # Check profanity
        normalized = normalize_username(value)
        for word in PROFANITY_LIST:
            if word in normalized:
                raise serializers.ValidationError("Username contains inappropriate content.")
        
        return value
    
    def validate_email(self, value):
        value = value.strip().lower()
        
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        
        return value
    
    def create(self, validated_data):
        # Remove password_confirm from validated_data
        validated_data.pop('password_confirm', None)
        
        # Create user
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            display_name=validated_data.get('display_name', validated_data['username'])
        )
        
        return user
