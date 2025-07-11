from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Quest, QuestCategory, QuestParticipant, QuestSubmission, QuestSubmissionAttempt

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
    quest_slug = serializers.CharField(source='quest.slug', read_only=True)  # <-- Add this line

    class Meta:
        model = QuestParticipant
        fields = [
            'id', 'user', 'quest_title', 'quest_slug', 'status', 'joined_at', 
            'completed_at', 'progress_notes'
        ]


class QuestSubmissionSerializer(serializers.ModelSerializer):
    participant_username = serializers.CharField(source='quest_participant.user.username', read_only=True)
    quest_title = serializers.CharField(source='quest_participant.quest.title', read_only=True)
    quest_slug = serializers.CharField(source='quest_participant.quest.slug', read_only=True)
    reviewed_by_username = serializers.CharField(source='reviewed_by.username', read_only=True)
    submission_files = serializers.ListField(child=serializers.CharField(), read_only=True)
    description = serializers.CharField(read_only=True)
    link = serializers.CharField(read_only=True)

    class Meta:
        model = QuestSubmission
        fields = [
            'id', 'participant_username', 'quest_title', 'quest_slug',
            'description', 'link', 'submission_files', 'status', 'feedback', 'submitted_at',
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
            'participant_count', 'can_accept_participants', 'is_completed', 'applications_count',
            'is_deleted'
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
            'can_accept_participants', 'is_completed', 'applications_count',
            'is_deleted'
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
            'difficulty', 'status', 'xp_reward', 'gold_reward', 'commission_fee',
            'assigned_to', 'due_date',
            'requirements', 'resources'
        ]

    def validate(self, data):
        """Custom validation for quest creation"""
        print(f"🔍 QuestCreateUpdateSerializer.validate called")
        print(f"🔍 Raw data received: {data}")
        print(f"🔍 Data keys: {list(data.keys())}")
        print(f"🔍 Data types: {[(key, type(value)) for key, value in data.items()]}")
        
        # Validate required fields
        if not data.get('title'):
            print(f"❌ Title validation failed")
            raise serializers.ValidationError({'title': 'Title is required.'})
        
        if not data.get('description'):
            print(f"❌ Description validation failed")
            raise serializers.ValidationError({'description': 'Description is required.'})
        
        # Validate category
        category = data.get('category')
        if category:
            print(f"🔍 Category validation: {category} (type: {type(category)})")
            try:
                from .models import QuestCategory
                category_id = int(category) if category else None
                if not category_id or not QuestCategory.objects.filter(id=category_id).exists():
                    print(f"❌ Category validation failed: Category {category_id} does not exist")
                    raise serializers.ValidationError({'category': f'Invalid category selected: {category_id}. Available categories: {list(QuestCategory.objects.values_list("id", "name"))}'})
            except (ValueError, TypeError) as e:
                print(f"❌ Category conversion error: {e}")
                raise serializers.ValidationError({'category': f'Category must be a valid number. Received: {category} ({type(category)})'})
        else:
            print(f"❌ Category is missing")
            raise serializers.ValidationError({'category': 'Category is required.'})
        
        # Validate gold_reward
        gold_reward = data.get('gold_reward')
        
        if gold_reward is not None:
            print(f"🔍 Gold reward validation: {gold_reward} (type: {type(gold_reward)})")
            try:
                gold_value = int(gold_reward)
                if gold_value < 0:
                    print(f"❌ Gold reward negative")
                    raise serializers.ValidationError({'gold_reward': 'Gold reward cannot be negative.'})
                    
            except (ValueError, TypeError) as e:
                print(f"❌ Gold reward conversion error: {e}")
                raise serializers.ValidationError({'gold_reward': f'Gold reward must be a valid number. Received: {gold_reward} ({type(gold_reward)})'})
        
        # Validate due_date format
        due_date = data.get('due_date')
        if due_date:
            print(f"🔍 Due date validation: {due_date} (type: {type(due_date)})")
            try:
                from datetime import datetime
                if isinstance(due_date, str):
                    # Try to parse the date string
                    parsed_date = datetime.strptime(due_date, '%Y-%m-%d').date()
                    print(f"🔍 Due date parsed successfully: {parsed_date}")
                    # Check if date is in the future
                    from datetime import date
                    if parsed_date <= date.today():
                        print(f"❌ Due date is not in the future")
                        raise serializers.ValidationError({'due_date': 'Due date must be in the future.'})
            except ValueError as e:
                print(f"❌ Due date format error: {e}")
                raise serializers.ValidationError({'due_date': f'Due date must be in YYYY-MM-DD format. Received: {due_date}'})
        
        print(f"✅ Validation passed")
        return data

    def create(self, validated_data):
        # Debug logging
        print(f"🔍 QuestCreateUpdateSerializer.create called")
        print(f"🔍 Raw validated_data: {validated_data}")
        print(f"🔍 Validated data keys: {list(validated_data.keys())}")
        print(f"🔍 Gold reward value: {validated_data.get('gold_reward', 'NOT PROVIDED')}")
        print(f"🔍 Gold reward type: {type(validated_data.get('gold_reward'))}")
        
        # Set the creator to the current authenticated user
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            validated_data['creator'] = request.user
            print(f"🔍 Creator set to: {request.user.username}")
        else:
            # Fallback to first user if no authenticated user (for testing)
            from django.contrib.auth import get_user_model
            User = get_user_model()
            validated_data['creator'] = User.objects.first()
            print(f"🔍 Creator set to first user (fallback): {validated_data['creator'].username}")
        
        # Get gold_reward value
        gold_reward = validated_data.get('gold_reward', 0)
        from decimal import Decimal
        COMMISSION_RATE = Decimal('0.05')
        gold_reward_decimal = Decimal(str(gold_reward))
        commission_fee = (gold_reward_decimal * COMMISSION_RATE).quantize(Decimal('1'), rounding='ROUND_UP')
        validated_data['commission_fee'] = int(commission_fee)
        
        # If there's a gold reward, check balance before creating the quest
        if gold_reward > 0:
            from transactions.transaction_utils import get_user_balance
            from decimal import Decimal
            
            # Calculate total gold needed with 5% commission
            COMMISSION_RATE = Decimal('0.05')
            gold_reward_decimal = Decimal(str(gold_reward))
            total_gold_needed = gold_reward_decimal + (gold_reward_decimal * COMMISSION_RATE).quantize(Decimal('1'), rounding='ROUND_UP')
            
            print(f"🔍 Gold calculation: reward={gold_reward_decimal}, commission=5%, total_needed={total_gold_needed}")
            
            # Check if user has enough balance (using actual balance, not available balance)
            current_balance = get_user_balance(validated_data['creator'])
            print(f"🔍 Current balance: {current_balance}")
            
            if total_gold_needed > current_balance:
                error_msg = f"You don't have enough gold. Required: {total_gold_needed} (reward + 5% fee), Available: {current_balance}"
                print(f"❌ Gold validation failed: {error_msg}")
                raise serializers.ValidationError({
                    'gold_reward': error_msg
                })
        
        # Create the quest
        print(f"🆕 Creating quest with final data: {validated_data}")
        quest = super().create(validated_data)
        print(f"✅ Quest created successfully with ID: {quest.id}")
        
        # Immediately deduct gold for the quest including commission
        if gold_reward > 0:
            from transactions.transaction_utils import deduct_gold_for_quest_creation
            from decimal import Decimal
            
            COMMISSION_RATE = Decimal('0.05')
            gold_reward_decimal = Decimal(str(gold_reward))
            total_gold_needed = gold_reward_decimal + (gold_reward_decimal * COMMISSION_RATE).quantize(Decimal('1'), rounding='ROUND_UP')
            
            print(f"💰 Deducting gold immediately: {total_gold_needed}")
            # Deduct the total amount (reward + commission) immediately
            result = deduct_gold_for_quest_creation(quest, total_gold_needed)
            if not result["success"]:
                # If deduction fails, delete the quest and raise an error
                print(f"❌ Failed to deduct gold, deleting quest: {result['error']}")
                quest.delete()
                raise serializers.ValidationError({
                    'gold_reward': f'Failed to deduct gold: {result["error"]}'
                })
            print(f"✅ Gold deducted successfully: {result['amount_deducted']} gold. New balance: {result['new_balance']}")
            
        return quest

    def update(self, instance, validated_data):
        print(f"🔄 Updating quest {instance.id} with data: {validated_data}")
        print(f"🔄 Current description: '{instance.description}'")
        print(f"🔄 New description: '{validated_data.get('description', 'NOT PROVIDED')}'")
        
        # Check if gold_reward is being updated
        old_gold_reward = instance.gold_reward
        new_gold_reward = validated_data.get('gold_reward', old_gold_reward)
        
        # Update the instance
        # Update commission_fee if gold_reward is updated
        if 'gold_reward' in validated_data:
            from decimal import Decimal
            COMMISSION_RATE = Decimal('0.05')
            gold_reward_decimal = Decimal(str(validated_data['gold_reward']))
            commission_fee = (gold_reward_decimal * COMMISSION_RATE).quantize(Decimal('1'), rounding='ROUND_UP')
            validated_data['commission_fee'] = int(commission_fee)
        
        updated_instance = super().update(instance, validated_data)
        
        # Handle gold changes if needed
        if new_gold_reward != old_gold_reward:
            from transactions.transaction_utils import refund_gold_for_quest_deletion, deduct_gold_for_quest_creation
            from decimal import Decimal
            
            # Define commission rate
            COMMISSION_RATE = Decimal('0.05')
            
            # Refund the old gold deduction first
            if old_gold_reward > 0:
                refund_result = refund_gold_for_quest_deletion(updated_instance)
                print(f"🔄 Refunded old gold amount: {refund_result.get('amount_refunded', 0)}")
            
            # Deduct new gold amount if needed
            if new_gold_reward > 0:
                # Calculate total gold needed with 5% commission
                new_gold_decimal = Decimal(str(new_gold_reward))
                total_gold_needed = new_gold_decimal + (new_gold_decimal * COMMISSION_RATE).quantize(Decimal('1'), rounding='ROUND_UP')
                deduct_result = deduct_gold_for_quest_creation(updated_instance, total_gold_needed)
                print(f"🔄 Deducted new gold amount: {deduct_result.get('amount_deducted', 0)}")
        
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
        
        # Check if this is an update operation for a quest that's in-progress
        instance = getattr(self, 'instance', None)
        if instance and instance.status == 'in-progress':
            # Allow only if the gold reward is not being changed
            if instance.gold_reward != value:
                raise serializers.ValidationError(
                    "Cannot modify gold reward for a quest that is already in progress. "
                    "Participants have already committed based on the current reward amount."
                )
            
        # Check if user has enough actual balance for this reward
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            # Import here to avoid circular imports
            from transactions.transaction_utils import get_user_balance
            from decimal import Decimal
            
            # Calculate total needed gold with 5% commission fee
            COMMISSION_RATE = Decimal('0.05')
            total_gold_needed = value + (value * COMMISSION_RATE).quantize(Decimal('1'), rounding='ROUND_UP')
            
            # For update operations, we need to account for the current deduction
            instance = getattr(self, 'instance', None)
            current_deduction_refund = 0
            if instance and instance.gold_reward:
                # Include current commission in the refund calculation
                current_commission = (instance.gold_reward * COMMISSION_RATE).quantize(Decimal('1'), rounding='ROUND_UP')
                current_deduction_refund = instance.gold_reward + current_commission
            
            # Get current balance plus any refund from current quest (if updating)
            current_balance = get_user_balance(request.user) + current_deduction_refund
            
            if total_gold_needed > current_balance:
                raise serializers.ValidationError(
                    f"Gold reward plus 5% commission ({total_gold_needed} gold) exceeds your balance of {current_balance} gold."
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
    quest_participant = serializers.PrimaryKeyRelatedField(
        queryset=QuestParticipant.objects.all(),
        required=False,
        write_only=True,
        help_text="Quest participant ID (if user is already a participant)"
    )
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
    quest_slug = serializers.CharField(write_only=True, required=False, help_text="Quest slug (alternative to quest_participant)")
    slug = serializers.CharField(write_only=True, required=False, help_text="Quest slug (frontend fallback)")

    class Meta:
        model = QuestSubmission
        fields = ['quest_participant', 'application', 'quest_slug', 'slug', 'description', 'link', 'submission_files', 'files']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        from applications.models import Application
        self.fields['application'].queryset = Application.objects.filter(status='approved')

    def validate(self, attrs):
        request = self.context['request']
        # Debug logging for incoming data
        print("\n===== QuestSubmissionCreateSerializer.validate =====")
        print(f"attrs: {attrs}")
        if hasattr(request, 'data'):
            print(f"request.data: {getattr(request, 'data', None)}")
        else:
            print("request.data not available")
        print("===============================================\n")
        quest_participant = attrs.get('quest_participant')
        application = attrs.get('application')
        quest_slug = attrs.get('quest_slug') or attrs.get('slug')
        if not quest_participant and not application and not quest_slug:
            raise serializers.ValidationError("You must provide either a quest_participant, an approved application, or a quest_slug.")
        if (quest_participant and application) or (quest_participant and quest_slug) or (application and quest_slug):
            raise serializers.ValidationError("Provide only one of quest_participant, application, or quest_slug.")
        if application:
            if application.status != 'approved':
                raise serializers.ValidationError("Application is not approved.")
            if application.applicant != request.user:
                raise serializers.ValidationError("You can only submit for your own approved application.")
            if application.quest.status not in ['open', 'in-progress']:
                raise serializers.ValidationError("Cannot submit to a quest that is not active.")
        # Restrict to 5 submissions per participant per quest
        participant = quest_participant
        if application and not participant:
            # For applications, we need to get or check if a participant exists
            # since the participant might be created during the submission process
            from .models import QuestParticipant
            try:
                participant = QuestParticipant.objects.get(
                    quest=application.quest, 
                    user=application.applicant
                )
            except QuestParticipant.DoesNotExist:
                # Participant will be created during submission, start count from 0
                participant = None
        
        if participant:
            from .models import QuestSubmission
            count = QuestSubmission.objects.filter(quest_participant=participant).count()
            if count >= 5:
                raise serializers.ValidationError("You have reached the maximum of 5 submissions for this quest.")
        return attrs

    def validate_quest_participant(self, value):
        if value.user != self.context['request'].user:
            raise serializers.ValidationError("You can only submit for your own quest participation.")
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
        from .models import Quest, QuestParticipant
        application = validated_data.pop('application', None)
        quest_participant = validated_data.get('quest_participant')
        quest_slug = validated_data.pop('quest_slug', None) or validated_data.pop('slug', None)
        request = self.context.get('request')
        if application and not quest_participant:
            quest = application.quest
            user = application.applicant
            participant, created = QuestParticipant.objects.get_or_create(
                quest=quest, user=user,
                defaults={"status": "joined"}
            )
            validated_data['quest_participant'] = participant
        elif quest_slug and not quest_participant:
            quest = Quest.objects.get(slug=quest_slug)
            user = request.user
            participant, created = QuestParticipant.objects.get_or_create(
                quest=quest, user=user,
                defaults={"status": "joined"}
            )
            validated_data['quest_participant'] = participant
        else:
            participant = validated_data['quest_participant']
        
        # Update any existing pending submissions from this participant to 'superseded'
        # This ensures only the latest submission is actionable for review
        from .models import QuestSubmission
        QuestSubmission.objects.filter(
            quest_participant=participant,
            status='pending'
        ).update(status='superseded')
        
        files = validated_data.pop('files', [])
        submission = super().create(validated_data)
        # Save uploaded files and store their URLs/paths in submission_files
        file_objs = submission.submission_files or []
        for f in files:
            from django.core.files.storage import default_storage
            from django.core.files.base import ContentFile
            f.seek(0)  # Ensure pointer is at start
            path = default_storage.save(f"submissions/{f.name}", ContentFile(f.read()))
            if hasattr(default_storage, 'url'):
                url = default_storage.url(path)
            else:
                url = path
            file_objs.append({"file": url, "name": f.name})
        submission.submission_files = file_objs
        submission.save()
        # Record a submission attempt
        QuestSubmissionAttempt.objects.create(
            participant=participant,
            quest=participant.quest,
            user=participant.user
        )
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
        if value not in ['approved', 'needs_revision']:
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
