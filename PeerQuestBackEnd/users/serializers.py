# User Report Serializer
from rest_framework import serializers
from .models import UserReport, QuestReport, GuildReport, GuildReport

class UserReportSerializer(serializers.ModelSerializer):
    reporter_username = serializers.CharField(source='reporter.username', read_only=True)
    reported_user_username = serializers.CharField(source='reported_user.username', read_only=True)

    class Meta:
        model = UserReport
        fields = [
            'id', 'reported_user', 'reporter', 'reason', 'message', 'created_at',
            'resolved', 'resolved_by', 'resolved_at',
            'reporter_username', 'reported_user_username',
        ]
        read_only_fields = ['id', 'created_at', 'resolved', 'resolved_by', 'resolved_at', 'reporter_username', 'reported_user_username']

# Quest Report Serializer
class QuestReportSerializer(serializers.ModelSerializer):
    reporter_username = serializers.CharField(source='reporter.username', read_only=True)
    reported_quest_title = serializers.CharField(source='reported_quest.title', read_only=True)

    class Meta:
        model = QuestReport
        fields = [
            'id', 'reported_quest', 'reporter', 'reason', 'message', 'created_at',
            'resolved', 'resolved_by', 'resolved_at',
            'reporter_username', 'reported_quest_title',
        ]
        read_only_fields = ['id', 'created_at', 'resolved', 'resolved_by', 'resolved_at', 'reporter_username', 'reported_quest_title']

# Guild Report Serializer
class GuildReportSerializer(serializers.ModelSerializer):
    reporter_username = serializers.CharField(source='reporter.username', read_only=True)
    reported_guild_name = serializers.CharField(source='reported_guild.name', read_only=True)

    class Meta:
        model = GuildReport
        fields = [
            'id', 'reported_guild', 'reporter', 'reason', 'message', 'created_at',
            'resolved', 'resolved_by', 'resolved_at',
            'reporter_username', 'reported_guild_name',
        ]
        read_only_fields = ['id', 'created_at', 'resolved', 'resolved_by', 'resolved_at', 'reporter_username', 'reported_guild_name']

from .validators import PROFANITY_LIST, LEET_MAP, levenshtein, normalize_username
from itertools import product
import unicodedata
from .models import User, UserRole, COLLEGE_SKILLS, Skill, UserSkill
from django.contrib.auth.password_validation import validate_password

class UserInfoUpdateSerializer(serializers.ModelSerializer):
    # Accept nested objects for social_links and settings
    social_links = serializers.JSONField(required=False)
    settings = serializers.JSONField(required=False)
    spending_limits = serializers.JSONField(required=False)
    role = serializers.ChoiceField(choices=UserRole.choices, required=False)

    class Meta:
        model = User
        fields = [
            "username", "email", "bio", "birthday", "gender", "location", "role",
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
    role_display = serializers.CharField(source='get_role_display_name', read_only=True)
    role_level = serializers.IntegerField(read_only=True)
    gold_balance = serializers.SerializerMethodField()
    is_staff = serializers.BooleanField(read_only=True)
    is_superuser = serializers.BooleanField(read_only=True)
    experience_points = serializers.SerializerMethodField()

    def get_gold_balance(self, obj):
        """Get gold balance from UserBalance model (source of truth)"""
        try:
            from transactions.models import UserBalance
            user_balance = UserBalance.objects.get(user=obj)
            return float(user_balance.gold_balance)
        except UserBalance.DoesNotExist:
            # Create UserBalance if it doesn't exist
            from transactions.models import UserBalance
            from decimal import Decimal
            UserBalance.objects.create(user=obj, gold_balance=Decimal('0.00'))
            return 0.0
    
    def get_experience_points(self, obj):
        return obj.xp

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "email_verified", "avatar_url", "avatar_data", "bio", "birthday", "gender",
            "level", "experience_points", "gold_balance", "role", "role_display", "role_level",
            "preferred_language", "timezone", "notification_preferences", "privacy_settings",
            "two_factor_enabled", "two_factor_method", "backup_codes_generated", "spending_limits",
            "last_password_change", "date_joined",
            "is_staff", "is_superuser"
        ]
        read_only_fields = ["id", "email", "email_verified", "level", "experience_points", "gold_balance", "last_password_change", "date_joined", "is_staff", "is_superuser"]

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
    experience_points = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'display_name', 'avatar_url', 'avatar_data', 
            'bio', 'level', 'experience_points', 'location', 'user_skills'
        ]
        read_only_fields = ['id', 'level', 'experience_points']
    
    def get_experience_points(self, obj):
        return obj.xp

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

class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ['id', 'name', 'category', 'description', 'is_active']

class UserSkillSerializer(serializers.ModelSerializer):
    skill_name = serializers.CharField(source='skill.name', read_only=True)
    skill_category = serializers.CharField(source='skill.category', read_only=True)
    skill_id = serializers.UUIDField(write_only=True)
    
    class Meta:
        model = UserSkill
        fields = [
            'id', 'skill_id', 'skill_name', 'skill_category', 
            'proficiency_level', 'years_experience', 'is_verified',
            'endorsements_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'skill_name', 'skill_category', 'is_verified', 'endorsements_count', 'created_at', 'updated_at']

class SkillsManagementSerializer(serializers.Serializer):
    """Serializer for managing user skills"""
    skills = UserSkillSerializer(many=True)
    
    def create(self, validated_data):
        skills_data = validated_data.get('skills', [])
        user = self.context['request'].user
        
        # Clear existing skills
        UserSkill.objects.filter(user=user).delete()
        
        # Add new skills
        for skill_data in skills_data:
            skill_id = skill_data.pop('skill_id')
            skill = Skill.objects.get(id=skill_id)
            UserSkill.objects.create(
                user=user,
                skill=skill,
                **skill_data
            )
        
        return user

class SkillRecommendationSerializer(serializers.Serializer):
    """Serializer for skill recommendations"""
    recommended_skills = serializers.ListField(
        child=serializers.CharField(),
        read_only=True
    )
    recommendation_reason = serializers.CharField(read_only=True)
    category = serializers.CharField(read_only=True)
