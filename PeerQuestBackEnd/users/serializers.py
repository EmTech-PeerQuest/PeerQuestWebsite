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
    password = serializers.CharField(write_only=True)
    avatar_url = serializers.URLField(required=False, allow_blank=True, allow_null=True)
    bio = serializers.CharField(required=False, allow_blank=True)
    birthday = serializers.DateField(required=False, allow_null=True)
    gender = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    preferred_language = serializers.CharField(required=False, allow_blank=True)
    timezone = serializers.CharField(required=False, allow_blank=True)
    notification_preferences = serializers.JSONField(required=False)
    privacy_settings = serializers.JSONField(required=False)

    class Meta:
        model = User
        fields = (
            "username", "email", "password", "avatar_url", "bio", "birthday", "gender",
            "preferred_language", "timezone", "notification_preferences", "privacy_settings"
        )

    def normalize_username(self, value):
        return normalize_username(value)

    def validate_username(self, value):
        value = value.strip()
        norm_value = self.normalize_username(value)
        if not norm_value.isalnum():
            raise serializers.ValidationError("Username must be alphanumeric.")
        lowered = norm_value.lower()
        for bad_word in PROFANITY_LIST:
            if bad_word in lowered:
                raise serializers.ValidationError("Username contains inappropriate language.")
            for i in range(len(lowered) - len(bad_word) + 1):
                sub = lowered[i:i+len(bad_word)]
                if levenshtein(sub, bad_word) <= 1:
                    raise serializers.ValidationError("Username contains inappropriate language.")
                leet_positions = [j for j, c in enumerate(sub) if c in LEET_MAP]
                n = len(leet_positions)
                if n > 0:
                    for mask in product([False, True], repeat=n):
                        chars = list(sub)
                        for idx, use_leet in enumerate(mask):
                            if use_leet:
                                pos = leet_positions[idx]
                                chars[pos] = LEET_MAP[chars[pos]]
                        variant = ''.join(chars)
                        if bad_word in variant:
                            raise serializers.ValidationError("Username contains inappropriate language.")
                        if levenshtein(variant, bad_word) <= 1:
                            raise serializers.ValidationError("Username contains inappropriate language.")
        return value

    def validate_email(self, value):
        value = value.strip().lower()
        
        # Check if email already exists
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email address already exists.")
        
        return value

    def create(self, validated_data):
        user = User(
            username=validated_data["username"],
            email=validated_data["email"],
            avatar_url=validated_data.get("avatar_url", ""),
            bio=validated_data.get("bio", ""),
            birthday=validated_data.get("birthday"),
            gender=validated_data.get("gender", ""),
            preferred_language=validated_data.get("preferred_language", "en"),
            timezone=validated_data.get("timezone", "UTC"),
            notification_preferences=validated_data.get("notification_preferences", {}),
            privacy_settings=validated_data.get("privacy_settings", {}),
        )
        validate_password(validated_data["password"], user)
        user.set_password(validated_data["password"])  # This will now set last_password_change
        user.save()
        return user
    def validate_username(self, value):
        value = value.strip()
        norm_value = normalize_username(value)
        if not norm_value.isalnum():
            raise serializers.ValidationError("Username must be alphanumeric.")
        lowered = norm_value.lower()
        for bad_word in PROFANITY_LIST:
            if bad_word in lowered:
                raise serializers.ValidationError("Username contains inappropriate language.")
            for i in range(len(lowered) - len(bad_word) + 1):
                sub = lowered[i:i+len(bad_word)]
                if levenshtein(sub, bad_word) <= 1:
                    raise serializers.ValidationError("Username contains inappropriate language.")
                leet_positions = [j for j, c in enumerate(sub) if c in LEET_MAP]
                n = len(leet_positions)
                if n > 0:
                    for mask in product([False, True], repeat=n):
                        chars = list(sub)
                        for idx, use_leet in enumerate(mask):
                            if use_leet:
                                pos = leet_positions[idx]
                                chars[pos] = LEET_MAP[chars[pos]]
                        variant = ''.join(chars)
                        if bad_word in variant:
                            raise serializers.ValidationError("Username contains inappropriate language.")
                        if levenshtein(variant, bad_word) <= 1:
                            raise serializers.ValidationError("Username contains inappropriate language.")
        return value

    def validate_email(self, value):
        value = value.strip().lower()  # Normalize email to lowercase
        
        # Check if email already exists
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        
        return value
