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
            "username", "email", "bio", "birthday", "gender", "location",
            "social_links", "settings", "avatar_url", "avatar_data", "preferred_language", "timezone",
            "notification_preferences", "privacy_settings", "two_factor_enabled", "two_factor_method",
            "backup_codes_generated", "spending_limits"
        ]
        extra_kwargs = {field: {"required": False, "allow_null": True} for field in fields}
    
    def validate_username(self, value):
        if not value:
            return value
        
        # Use enhanced username validation
        from .validators import validate_username_content
        is_valid, error_message = validate_username_content(value)
        
        if not is_valid:
            raise serializers.ValidationError(error_message)
        
        # Check if username is already taken by another user
        if User.objects.filter(username=value).exclude(id=self.instance.id if self.instance else None).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        
        return value

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
    birthday = serializers.DateField(required=False, allow_null=True)
    gender = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'birthday', 'gender']
        extra_kwargs = {
            'password': {'write_only': True},
            'password_confirm': {'write_only': True},
            'birthday': {'required': False, 'allow_null': True},
            'gender': {'required': False, 'allow_blank': True, 'allow_null': True},
        }
    
    def validate(self, attrs):
        # Check if passwords match
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password_confirm": ["Passwords do not match."]})
        
        # Validate password strength - check if this is for a superuser
        # Note: Since we're in registration, we don't have the user object yet
        # We'll check the username to see if it's a superuser pattern
        username = attrs.get('username', '')
        is_likely_superuser = username.lower() in ['admin', 'superadmin', 'root', 'administrator']
        
        # Use our friendly password strength checker
        from .password_validators import PasswordStrengthChecker
        checker = PasswordStrengthChecker()
        
        # Create a temporary user object for validation
        temp_user = type('TempUser', (), {
            'username': username,
            'email': attrs.get('email', ''),
            'is_superuser': is_likely_superuser
        })()
        
        result = checker.check_password_strength(attrs['password'], temp_user)
        
        # For superusers, just check basic length
        if is_likely_superuser:
            if len(attrs['password']) < 8:
                raise serializers.ValidationError({"password": ["Password must be at least 8 characters long."]})
        else:
            # For regular users, check if password meets minimum requirements
            if not result['is_valid']:
                # Show only the most critical error - make it simple
                error_messages = []
                if len(attrs['password']) < 8:
                    error_messages.append("Password must be at least 8 characters long")
                elif not result['requirements']['uppercase']:
                    error_messages.append("Password must contain at least one uppercase letter")
                elif not result['requirements']['lowercase']:
                    error_messages.append("Password must contain at least one lowercase letter")  
                elif not result['requirements']['numbers']:
                    error_messages.append("Password must contain at least one number")
                
                # Only show the first error to keep it simple
                if error_messages:
                    raise serializers.ValidationError({"password": [error_messages[0]]})
        
        return attrs
    
    def validate_username(self, value):
        # Normalize and validate username
        value = value.strip()
        
        # Use enhanced username validation
        from .validators import validate_username_content
        is_valid, error_message = validate_username_content(value)
        
        if not is_valid:
            raise serializers.ValidationError(error_message)
        
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        
        return value
    
    def validate_email(self, value):
        value = value.strip().lower()
        
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        
        return value
    
    def create(self, validated_data):
        # Remove password_confirm from validated_data
        validated_data.pop('password_confirm', None)
        
        # Extract additional fields
        birthday = validated_data.pop('birthday', None)
        gender = validated_data.pop('gender', None)
        
        # Create user
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        
        # Set additional fields if provided
        if birthday:
            user.birthday = birthday
        if gender:
            user.gender = gender
        
        user.save()
        
        return user

class UserSearchSerializer(serializers.ModelSerializer):
    """Serializer for user search results"""
    user_skills = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'display_name', 'avatar_url', 'avatar_data', 
            'bio', 'level', 'experience_points', 'location', 'user_skills'
        ]
        read_only_fields = ['id', 'level', 'experience_points']
    
    def get_user_skills(self, obj):
        """Get user's skills with proficiency levels"""
        from .models import UserSkill
        skills = UserSkill.objects.filter(user=obj).select_related('skill')
        return [
            {
                'skill_name': skill.skill.name if skill.skill else 'Unknown',
                'category': skill.skill.category if skill.skill else 'Unknown',
                'proficiency_level': skill.proficiency_level,
                'years_experience': skill.years_experience,
                'is_verified': skill.is_verified
            }
            for skill in skills
        ]
