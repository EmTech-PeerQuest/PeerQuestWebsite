from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Quest, QuestCategory, QuestParticipant, QuestSubmission

User = get_user_model()


class QuestCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestCategory
        fields = ['id', 'name', 'description', 'created_at']


class UserBasicSerializer(serializers.ModelSerializer):
    """Basic user info for quest displays"""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'level', 'xp']


class QuestParticipantSerializer(serializers.ModelSerializer):
    user = UserBasicSerializer(read_only=True)
    quest_title = serializers.CharField(source='quest.title', read_only=True)

    class Meta:
        model = QuestParticipant
        fields = [
            'id', 'user', 'quest_title', 'status', 'joined_at', 
            'completed_at', 'progress_notes'
        ]


class QuestSubmissionSerializer(serializers.ModelSerializer):
    participant_username = serializers.CharField(source='quest_participant.user.username', read_only=True)
    quest_title = serializers.CharField(source='quest_participant.quest.title', read_only=True)
    reviewed_by_username = serializers.CharField(source='reviewed_by.username', read_only=True)

    class Meta:
        model = QuestSubmission
        fields = [
            'id', 'participant_username', 'quest_title', 'submission_text',
            'submission_files', 'status', 'feedback', 'submitted_at',
            'reviewed_at', 'reviewed_by_username'
        ]


class QuestListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for quest lists"""
    creator = UserBasicSerializer(read_only=True)
    category = QuestCategorySerializer(read_only=True)
    participant_count = serializers.ReadOnlyField()
    can_accept_participants = serializers.ReadOnlyField()

    class Meta:
        model = Quest
        fields = [
            'id', 'title', 'short_description', 'difficulty',
            'status', 'xp_reward', 'estimated_time', 'max_participants',
            'creator', 'category', 'created_at', 'due_date', 'slug',
            'participant_count', 'can_accept_participants'
        ]


class QuestDetailSerializer(serializers.ModelSerializer):
    """Full quest details including participants and submissions"""
    creator = UserBasicSerializer(read_only=True)
    category = QuestCategorySerializer(read_only=True)
    participants_detail = QuestParticipantSerializer(
        source='questparticipant_set', 
        many=True, 
        read_only=True
    )
    participant_count = serializers.ReadOnlyField()
    can_accept_participants = serializers.ReadOnlyField()
    is_completed = serializers.ReadOnlyField()

    class Meta:
        model = Quest
        fields = [
            'id', 'title', 'description', 'short_description', 'category',
            'difficulty', 'status', 'xp_reward', 'estimated_time',
            'max_participants', 'creator', 'participants_detail', 'created_at',
            'updated_at', 'start_date', 'due_date', 'completed_at',
            'requirements', 'resources', 'slug', 'participant_count',
            'can_accept_participants', 'is_completed'
        ]


class QuestCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating quests"""
    creator = serializers.HiddenField(default=serializers.CurrentUserDefault())
    
    class Meta:
        model = Quest
        fields = [
            'id', 'title', 'description', 'short_description', 'category',
            'difficulty', 'status', 'xp_reward', 'estimated_time',
            'max_participants', 'creator', 'start_date', 'due_date',
            'requirements', 'resources'
        ]

    def validate_max_participants(self, value):
        if value < 1:
            raise serializers.ValidationError("Maximum participants must be at least 1.")
        return value

    def validate_xp_reward(self, value):
        if value < 0:
            raise serializers.ValidationError("XP reward cannot be negative.")
        return value

    def validate(self, data):
        if data.get('start_date') and data.get('due_date'):
            if data['start_date'] >= data['due_date']:
                raise serializers.ValidationError("Due date must be after start date.")
        return data


class QuestParticipantCreateSerializer(serializers.ModelSerializer):
    """For joining quests"""
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = QuestParticipant
        fields = ['quest', 'user', 'progress_notes']

    def validate(self, data):
        quest = data['quest']
        user = data['user']

        # Check if user is already a participant
        if QuestParticipant.objects.filter(quest=quest, user=user).exists():
            raise serializers.ValidationError("You are already participating in this quest.")

        # Check if quest can accept more participants
        if not quest.can_accept_participants:
            raise serializers.ValidationError("This quest cannot accept more participants.")

        # Check if user is the creator (creators can't join their own quests)
        if quest.creator == user:
            raise serializers.ValidationError("You cannot join your own quest.")

        return data


class QuestSubmissionCreateSerializer(serializers.ModelSerializer):
    """For creating quest submissions"""
    
    class Meta:
        model = QuestSubmission
        fields = ['quest_participant', 'submission_text', 'submission_files']

    def validate_quest_participant(self, value):
        # Ensure the participant belongs to the current user
        if value.user != self.context['request'].user:
            raise serializers.ValidationError("You can only submit for your own quest participation.")
        
        # Ensure the quest is active
        if value.quest.status != 'active':
            raise serializers.ValidationError("Cannot submit to an inactive quest.")
        
        return value


class QuestSubmissionReviewSerializer(serializers.ModelSerializer):
    """For reviewing quest submissions (quest creators only)"""
    reviewed_by = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = QuestSubmission
        fields = ['status', 'feedback', 'reviewed_by']

    def validate_status(self, value):
        if value not in ['approved', 'rejected', 'needs_revision']:
            raise serializers.ValidationError("Invalid status for review.")
        return value
