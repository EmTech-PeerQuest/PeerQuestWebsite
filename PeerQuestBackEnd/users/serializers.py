from .validators import PROFANITY_LIST, LEET_MAP, levenshtein, normalize_username
from itertools import product
import unicodedata
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
        value = value.strip()
        # Optionally, add more email validation here
        return value
