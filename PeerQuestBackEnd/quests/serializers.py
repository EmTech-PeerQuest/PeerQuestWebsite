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
    xp = serializers.IntegerField(source='experience_points', read_only=True)
    
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
    assigned_to = UserBasicSerializer(read_only=True)
    category = QuestCategorySerializer(read_only=True)
    participant_count = serializers.ReadOnlyField()
    can_accept_participants = serializers.ReadOnlyField()
    is_completed = serializers.ReadOnlyField()
    applications_count = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()

    class Meta:
        model = Quest
        fields = [
            'id', 'title', 'description', 'difficulty',
            'status', 'xp_reward', 'gold_reward',
            'creator', 'assigned_to', 'category', 'created_at', 'updated_at', 'due_date', 'slug',
            'participant_count', 'can_accept_participants', 'is_completed', 'applications_count'
        ]
    
    def get_applications_count(self, obj):
        """Return the number of pending applications for this quest"""
        return obj.applications.filter(status='pending').count()
    
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
    assigned_to = UserBasicSerializer(read_only=True)
    category = QuestCategorySerializer(read_only=True)
    participants_detail = QuestParticipantSerializer(
        source='questparticipant_set', 
        many=True, 
        read_only=True
    )
    participant_count = serializers.ReadOnlyField()
    can_accept_participants = serializers.ReadOnlyField()
    is_completed = serializers.ReadOnlyField()
    applications_count = serializers.SerializerMethodField()

    class Meta:
        model = Quest
        fields = [
            'id', 'title', 'description', 'category',
            'difficulty', 'status', 'xp_reward', 'gold_reward',
            'creator', 'assigned_to', 'participants_detail', 'created_at',
            'updated_at', 'due_date', 'completed_at',
            'requirements', 'resources', 'slug', 'participant_count',
            'can_accept_participants', 'is_completed', 'applications_count'
        ]

    def get_applications_count(self, obj):
        """Return the number of pending applications for this quest"""
        return obj.applications.filter(status='pending').count()


class QuestCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating quests"""
    
    class Meta:
        model = Quest
        fields = [
            'id', 'title', 'description', 'category',
            'difficulty', 'status', 'xp_reward', 'gold_reward',
            'assigned_to', 'due_date',
            'requirements', 'resources'
        ]

    def create(self, validated_data):
        # Set the creator to the current authenticated user
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            validated_data['creator'] = request.user
        else:
            # Fallback to first user if no authenticated user (for testing)
            from django.contrib.auth import get_user_model
            User = get_user_model()
            validated_data['creator'] = User.objects.first()
        
        # Get gold_reward value
        gold_reward = validated_data.get('gold_reward', 0)
        
        # If there's a gold reward, check balance before creating the quest
        if gold_reward > 0:
            from transactions.transaction_utils import get_available_balance
            from decimal import Decimal
            
            # Calculate total gold needed with 5% commission
            COMMISSION_RATE = Decimal('0.05')
            gold_reward_decimal = Decimal(str(gold_reward))
            total_gold_needed = gold_reward_decimal + (gold_reward_decimal * COMMISSION_RATE).quantize(Decimal('1'), rounding='ROUND_UP')
            
            # Check if user has enough available balance
            available_balance = get_available_balance(validated_data['creator'])
            if total_gold_needed > available_balance:
                raise serializers.ValidationError({
                    'gold_reward': f"You don't have enough gold. Required: {total_gold_needed} (reward + 5% fee), Available: {available_balance}"
                })
        
        # Create the quest
        print(f"🆕 Creating quest with data: {validated_data}")
        quest = super().create(validated_data)
        
        # Reserve gold for the quest including commission
        if gold_reward > 0:
            from transactions.transaction_utils import reserve_gold_for_quest
            
            # Reserve the total amount (reward + commission)
            success = reserve_gold_for_quest(quest, total_gold_needed)
            if not success:
                # This should not happen since we checked the balance above,
                # but just in case, clean up and raise an error
                quest.delete()
                raise serializers.ValidationError({
                    'gold_reward': 'Failed to reserve gold for the quest. Please try again.'
                })
            
        return quest

    def update(self, instance, validated_data):
        print(f"🔄 Updating quest {instance.id} with data: {validated_data}")
        print(f"🔄 Current description: '{instance.description}'")
        print(f"🔄 New description: '{validated_data.get('description', 'NOT PROVIDED')}'")
        
        # Check if gold_reward is being updated
        old_gold_reward = instance.gold_reward
        new_gold_reward = validated_data.get('gold_reward', old_gold_reward)
        
        # Update the instance
        updated_instance = super().update(instance, validated_data)
        
        # Handle gold reservation changes if needed
        if new_gold_reward != old_gold_reward:
            from transactions.transaction_utils import reserve_gold_for_quest, release_gold_reservation
            from decimal import Decimal
            
            # Define commission rate
            COMMISSION_RATE = Decimal('0.05')
            
            # Release old reservation first (which includes old commission)
            release_gold_reservation(updated_instance)
            
            # Create new reservation if needed, including commission
            if new_gold_reward > 0:
                # Calculate total gold needed with 5% commission
                total_gold_needed = new_gold_reward + (new_gold_reward * COMMISSION_RATE).quantize(Decimal('1'), rounding='ROUND_UP')
                reserve_gold_for_quest(updated_instance, total_gold_needed)
        
        print(f"✅ Updated quest {updated_instance.id}, new description: '{updated_instance.description}'")
        return updated_instance

    def validate_xp_reward(self, value):
        if value < 0:
            raise serializers.ValidationError("XP reward cannot be negative.")
        return value

    def validate_description(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Description is required.")
        if len(value.strip()) < 10:
            raise serializers.ValidationError("Description must be at least 10 characters long.")
        if len(value.strip()) > 2000:
            raise serializers.ValidationError("Description cannot exceed 2000 characters.")
        return value

    def validate_gold_reward(self, value):
        if value < 0:
            raise serializers.ValidationError("Gold reward cannot be negative.")
        if value > 999:
            raise serializers.ValidationError("Gold reward cannot exceed 999.")
            
        # Check if user has enough available balance for this reward
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            # Import here to avoid circular imports
            from transactions.transaction_utils import get_available_balance
            from decimal import Decimal
            
            # Calculate total needed gold with 5% commission fee
            COMMISSION_RATE = Decimal('0.05')
            total_gold_needed = value + (value * COMMISSION_RATE).quantize(Decimal('1'), rounding='ROUND_UP')
            
            # For update operations, we need to account for the current reservation
            instance = getattr(self, 'instance', None)
            current_reservation = 0
            if instance and instance.gold_reward:
                # Also include current commission in the reservation calculation
                current_commission = (instance.gold_reward * COMMISSION_RATE).quantize(Decimal('1'), rounding='ROUND_UP')
                current_reservation = instance.gold_reward + current_commission
            
            # Get available balance plus current reservation (if updating)
            available_balance = get_available_balance(request.user) + current_reservation
            
            if total_gold_needed > available_balance:
                raise serializers.ValidationError(
                    f"Gold reward plus 5% commission ({total_gold_needed} gold) exceeds your available balance of {available_balance} gold."
                )
        
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
            if quest.status == 'in-progress':
                raise serializers.ValidationError("This quest is already in progress and cannot accept new participants.")
            elif quest.status == 'completed':
                raise serializers.ValidationError("This quest has been completed and cannot accept new participants.")
            else:
                raise serializers.ValidationError("This quest cannot accept more participants.")

        # Check if user is the creator (creators can't join their own quests)
        if quest.creator == user:
            raise serializers.ValidationError("You cannot join your own quest.")

        return data


class QuestSubmissionCreateSerializer(serializers.ModelSerializer):
    """For creating quest submissions"""
    
    # Accept files as a list of uploads
    files = serializers.ListField(
        child=serializers.FileField(max_length=100000, allow_empty_file=False, use_url=False),
        write_only=True,
        required=False,
        help_text="List of files to upload (max 25MB each, images/docs only)"
    )
    from applications.models import Application as _AppModel
    application = serializers.PrimaryKeyRelatedField(
        queryset=_AppModel.objects.none(),  # Set real queryset in __init__
        required=False,
        write_only=True,
        help_text="Approved application ID (if submitting as an approved applicant)"
    )

    class Meta:
        model = QuestSubmission
        fields = ['quest_participant', 'application', 'submission_text', 'submission_files', 'files']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Import here to avoid circular import
        from applications.models import Application
        self.fields['application'].queryset = Application.objects.filter(status='approved')

    def validate(self, attrs):
        request = self.context['request']
        quest_participant = attrs.get('quest_participant')
        application = attrs.get('application')
        if not quest_participant and not application:
            raise serializers.ValidationError("You must provide either a quest_participant or an approved application.")
        if quest_participant and application:
            raise serializers.ValidationError("Provide only one of quest_participant or application, not both.")
        if application:
            # Check application is approved and belongs to this user
            if application.status != 'approved':
                raise serializers.ValidationError("Application is not approved.")
            if application.applicant != request.user:
                raise serializers.ValidationError("You can only submit for your own approved application.")
            # Check quest is active
            if application.quest.status not in ['open', 'in-progress']:
                raise serializers.ValidationError("Cannot submit to a quest that is not active.")
        return attrs

    def validate_quest_participant(self, value):
        # Ensure the participant belongs to the current user
        if value.user != self.context['request'].user:
            raise serializers.ValidationError("You can only submit for your own quest participation.")
        # Ensure the quest is active
        if value.quest.status not in ['open', 'in-progress']:
            raise serializers.ValidationError("Cannot submit to a quest that is not active.")
        return value

    def validate_files(self, files):
        allowed_types = ["image/jpeg", "image/png", "image/gif", "application/pdf", "text/plain", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
        for f in files:
            if f.size > 25 * 1024 * 1024:
                raise serializers.ValidationError(f"File {f.name} exceeds 25MB size limit.")
            if hasattr(f, 'content_type') and f.content_type not in allowed_types:
                raise serializers.ValidationError(f"File {f.name} type {f.content_type} is not allowed.")
        return files

    def create(self, validated_data):
        from .models import QuestParticipant
        application = validated_data.pop('application', None)
        quest_participant = validated_data.get('quest_participant')
        request = self.context.get('request')
        if application and not quest_participant:
            # Auto-create or get QuestParticipant for this user/quest
            quest = application.quest
            user = application.applicant
            participant, created = QuestParticipant.objects.get_or_create(
                quest=quest, user=user,
                defaults={"status": "joined"}
            )
            validated_data['quest_participant'] = participant
        files = validated_data.pop('files', [])
        submission = super().create(validated_data)
        # Save uploaded files and store their URLs/paths in submission_files
        file_urls = submission.submission_files or []
        for f in files:
            from django.core.files.storage import default_storage
            from django.core.files.base import ContentFile
            path = default_storage.save(f"submissions/{f.name}", ContentFile(f.read()))
            if hasattr(default_storage, 'url'):
                url = default_storage.url(path)
            else:
                url = path
            file_urls.append(url)
        submission.submission_files = file_urls
        submission.save()
        return submission


class QuestSubmissionReviewSerializer(serializers.ModelSerializer):
    """For reviewing quest submissions (quest creators only)"""
    reviewed_by = serializers.HiddenField(default=serializers.CurrentUserDefault())
    xp_reward = serializers.SerializerMethodField()
    gold_reward = serializers.SerializerMethodField()

    class Meta:
        model = QuestSubmission
        fields = ['status', 'feedback', 'reviewed_by', 'xp_reward', 'gold_reward']

    def get_xp_reward(self, obj):
        """Return the XP reward amount for this quest"""
        return obj.quest_participant.quest.xp_reward
        
    def get_gold_reward(self, obj):
        """Return the gold reward amount for this quest"""
        return obj.quest_participant.quest.gold_reward

    def validate_status(self, value):
        if value not in ['approved', 'rejected', 'needs_revision']:
            raise serializers.ValidationError("Invalid status for review.")
        return value
        
    def to_representation(self, instance):
        """Add reward information to the response when submission is approved"""
        data = super().to_representation(instance)
        
        # Add reward info if submission was approved
        if instance.status == 'approved':
            quest = instance.quest_participant.quest
            data['rewards'] = {
                'xp_awarded': quest.xp_reward,
                'gold_awarded': quest.gold_reward
            }
            
        return data
