from rest_framework import serializers
from .models import User

class UserProfileSerializer(serializers.ModelSerializer):
    gold_balance = serializers.SerializerMethodField()
    
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
    
    class Meta:
        model = User
        fields = [
            "id", "username", "email", "avatar_url", "bio",
            "level", "experience_points", "gold_balance",
            "preferred_language", "timezone", "notification_preferences", "privacy_settings"
        ]
        read_only_fields = ["id", "email", "level", "experience_points", "gold_balance"]
