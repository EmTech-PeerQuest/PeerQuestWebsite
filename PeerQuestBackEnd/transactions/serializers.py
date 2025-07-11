from rest_framework import serializers
from .models import Transaction, UserBalance, CashoutRequest
from django.contrib.auth import get_user_model

User = get_user_model()

class TransactionSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()
    type_display = serializers.SerializerMethodField()
    quest_title = serializers.SerializerMethodField()
    
    class Meta:
        model = Transaction
        fields = [
            'transaction_id', 'user', 'username', 'type', 'type_display', 
            'amount', 'commission_fee', 'description', 'quest', 'quest_title', 'created_at'
        ]
        read_only_fields = ['transaction_id', 'created_at']
    
    def get_username(self, obj):
        return obj.user.username if obj.user else None
        
    def get_type_display(self, obj):
        return obj.get_type_display()
        
    def get_quest_title(self, obj):
        return obj.quest.title if obj.quest else None

class UserBalanceSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()
    gold_balance = serializers.SerializerMethodField()
    
    class Meta:
        model = UserBalance
        fields = ['user', 'username', 'gold_balance', 'last_updated']
        read_only_fields = ['last_updated']
    
    def get_username(self, obj):
        return obj.user.username if obj.user else None
        
    def get_gold_balance(self, obj):
        # Ensure gold_balance is returned as a float, not a string
        return float(obj.gold_balance) if obj.gold_balance is not None else 0.0
        
class UserBalanceUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserBalance
        fields = ['gold_balance']

class CashoutRequestSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    method_display = serializers.SerializerMethodField()
    can_be_cancelled = serializers.SerializerMethodField()
    
    class Meta:
        model = CashoutRequest
        fields = [
            'id', 'user', 'username', 'amount_gold', 'amount_php', 
            'exchange_rate', 'method', 'method_display', 'payment_details',
            'status', 'status_display', 'notes', 'transaction',
            'created_at', 'processed_at', 'can_be_cancelled'
        ]
        read_only_fields = [
            'id', 'amount_php', 'exchange_rate', 'transaction',
            'created_at', 'processed_at'
        ]
    
    def get_username(self, obj):
        return obj.user.username if obj.user else None
        
    def get_status_display(self, obj):
        return obj.get_status_display()
        
    def get_method_display(self, obj):
        return obj.get_method_display()
        
    def get_can_be_cancelled(self, obj):
        return obj.can_be_cancelled
