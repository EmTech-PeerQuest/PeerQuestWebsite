from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Application
from quests.serializers import UserBasicSerializer

User = get_user_model()


class QuestBasicSerializer(serializers.Serializer):
    """Basic quest info for application displays"""
    id = serializers.IntegerField()
    title = serializers.CharField()
    difficulty = serializers.CharField()
    status = serializers.CharField()
    xp_reward = serializers.IntegerField()
    gold_reward = serializers.IntegerField()
    due_date = serializers.DateField()
    creator = UserBasicSerializer(read_only=True)


class ApplicationListSerializer(serializers.ModelSerializer):
    """Serializer for listing applications"""
    quest = QuestBasicSerializer(read_only=True)
    applicant = UserBasicSerializer(read_only=True)
    reviewed_by = UserBasicSerializer(read_only=True)

    class Meta:
        model = Application
        fields = [
            'id', 'quest', 'applicant', 'status',
            'applied_at', 'reviewed_at', 'reviewed_by'
        ]


class ApplicationDetailSerializer(serializers.ModelSerializer):
    """Serializer for detailed application view"""
    quest = QuestBasicSerializer(read_only=True)
    applicant = UserBasicSerializer(read_only=True)
    reviewed_by = UserBasicSerializer(read_only=True)

    class Meta:
        model = Application
        fields = [
            'id', 'quest', 'applicant', 'status',
            'applied_at', 'reviewed_at', 'reviewed_by'
        ]


class ApplicationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating applications"""
    applicant = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = Application
        fields = ['quest', 'applicant']

    def validate(self, data):
        quest = data['quest']
        applicant = data['applicant']

        # Use the new application attempt system for validation
        from .models import ApplicationAttempt
        can_apply, reason = ApplicationAttempt.can_apply_again(quest, applicant)
        
        if not can_apply:
            raise serializers.ValidationError(reason)

        # Check if quest is still open
        if quest.status != 'open':
            raise serializers.ValidationError("This quest is no longer accepting applications.")

        # Check if user is the quest creator
        if quest.creator == applicant:
            raise serializers.ValidationError("You cannot apply to your own quest.")

        # Check if quest can accept more participants
        if not quest.can_accept_participants:
            raise serializers.ValidationError("This quest cannot accept more participants.")

        return data
