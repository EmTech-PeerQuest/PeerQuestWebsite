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
    """Lightweight serializer for quest lists with truncated description"""
    creator = UserBasicSerializer(read_only=True)
    category = QuestCategorySerializer(read_only=True)
    participant_count = serializers.ReadOnlyField()
    can_accept_participants = serializers.ReadOnlyField()
    is_completed = serializers.ReadOnlyField()
    description = serializers.SerializerMethodField()

    class Meta:
        model = Quest
        fields = [
            'id', 'title', 'description', 'difficulty',
            'status', 'xp_reward', 'estimated_time', 'max_participants',
            'creator', 'category', 'created_at', 'updated_at', 'due_date', 'slug',
            'participant_count', 'can_accept_participants', 'is_completed'
        ]
    
    def get_description(self, obj):
        """Return truncated description for quest cards"""
        if not obj.description:
            return ""
        
        max_length = 150
        if len(obj.description) <= max_length:
            return obj.description
        
        # Find the last space within the limit to avoid cutting words
        truncated = obj.description[:max_length]
        last_space = truncated.rfind(' ')
        
        if last_space > 0:
            truncated = truncated[:last_space]
        
        return truncated + "..."


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
            'id', 'title', 'description', 'category',
            'difficulty', 'status', 'xp_reward', 'estimated_time',
            'max_participants', 'creator', 'participants_detail', 'created_at',
            'updated_at', 'due_date', 'completed_at',
            'requirements', 'resources', 'slug', 'participant_count',
            'can_accept_participants', 'is_completed'
        ]


class QuestCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating quests"""
    
    class Meta:
        model = Quest
        fields = [
            'id', 'title', 'description', 'category',
            'difficulty', 'status', 'xp_reward', 'estimated_time',
            'max_participants', 'due_date',
            'requirements', 'resources'
        ]

    def create(self, validated_data):
        # Set a default user for quest creation
        from django.contrib.auth import get_user_model
        User = get_user_model()
    def create(self, validated_data):
        # Set a default user for quest creation
        from django.contrib.auth import get_user_model
        User = get_user_model()
        default_user = User.objects.first()  # Use first user as default
        validated_data['creator'] = default_user
        return super().create(validated_data)

    def validate_max_participants(self, value):
        if value < 1:
            raise serializers.ValidationError("Maximum participants must be at least 1.")
        return value

    def validate_xp_reward(self, value):
        if value < 0:
            raise serializers.ValidationError("XP reward cannot be negative.")
        return value

    def validate(self, data):
        if data.get('due_date'):
            from datetime import date
            if data['due_date'] <= date.today():
                raise serializers.ValidationError("Due date must be in the future.")
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
        if value.quest.status not in ['open', 'in-progress']:
            raise serializers.ValidationError("Cannot submit to a quest that is not active.")
        
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
