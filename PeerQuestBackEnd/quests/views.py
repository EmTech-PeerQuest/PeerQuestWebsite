# API endpoint to create a QuestCompletionLog directly
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import JSONParser

class QuestCompletionLogCreateView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser]

    def post(self, request):
        """
        Create a QuestCompletionLog for a given quest and adventurer, awarding XP and gold.
        Required fields: quest_id, adventurer_id, xp_earned, gold_earned
        """
        from .models import Quest, QuestCompletionLog
        from users.models import User
        quest_id = request.data.get('quest_id')
        adventurer_id = request.data.get('adventurer_id')
        xp_earned = request.data.get('xp_earned')
        gold_earned = request.data.get('gold_earned')

        if not quest_id or not adventurer_id or xp_earned is None or gold_earned is None:
            return Response({'detail': 'quest_id, adventurer_id, xp_earned, and gold_earned are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            quest = Quest.objects.get(id=quest_id)
            adventurer = User.objects.get(id=adventurer_id)
        except Quest.DoesNotExist:
            return Response({'detail': 'Quest not found.'}, status=status.HTTP_404_NOT_FOUND)
        except User.DoesNotExist:
            return Response({'detail': 'Adventurer not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Prevent double reward
        if QuestCompletionLog.objects.filter(quest=quest, adventurer=adventurer).exists():
            return Response({'detail': 'Reward already granted for this quest and adventurer.'}, status=status.HTTP_400_BAD_REQUEST)

        adventurer.xp = getattr(adventurer, 'xp', 0) + int(xp_earned)
        adventurer.gold = getattr(adventurer, 'gold', 0) + int(gold_earned)
        # Update level if needed
        import math
        new_level = int(math.floor(adventurer.xp / 100))
        if getattr(adventurer, 'level', 0) != new_level:
            adventurer.level = new_level
        adventurer.save()
        # Award XP and gold using transaction system
        from xp.utils import award_xp
        from transactions.models import TransactionType
        from transactions.transaction_utils import award_gold

        xp_result = award_xp(
            user=adventurer,
            xp_amount=int(xp_earned),
            reason=f"Completed quest: {quest.title}"
        )

        gold_result = award_gold(
            user=adventurer,
            amount=int(gold_earned),
            description=f"Reward for completing quest: {quest.title}",
            quest=quest,
            transaction_type=TransactionType.QUEST_REWARD
        )

        # Create the log
        log = QuestCompletionLog.objects.create(
            quest=quest,
            adventurer=adventurer,
            xp_earned=xp_earned,
            gold_earned=gold_earned,
            completed_at=timezone.now()
        )

        return Response({
            'log_id': log.id,
            'adventurer': {
                'id': adventurer.id,
                'username': adventurer.username,
                'level': adventurer.level,
                'xp': adventurer.xp,
                'gold': adventurer.gold,
            },
            'xp_earned': xp_earned,
            'gold_earned': gold_earned,
            'detail': f"{adventurer.username} earned {xp_earned} XP and {gold_earned} gold!"
        }, status=status.HTTP_201_CREATED)
from rest_framework import generics, viewsets, filters, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, SAFE_METHODS, BasePermission
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q, Count, F
from .models import Quest, QuestCategory, QuestParticipant, QuestSubmission, QuestSubmissionAttempt, QuestCompletionLog
from .serializers import (
    QuestListSerializer, QuestDetailSerializer, QuestCreateUpdateSerializer,
    QuestCategorySerializer, QuestParticipantSerializer, QuestParticipantCreateSerializer,
    QuestSubmissionSerializer, QuestSubmissionCreateSerializer, QuestSubmissionReviewSerializer,
    QuestCompletionLogSerializer
)
from django.http import FileResponse, Http404
from django.conf import settings
import os
import mimetypes
import urllib.parse
import math

# Custom Permissions
class IsQuestCreatorOrReadOnly(BasePermission):
    """
    Custom permission to only allow quest creators to edit/delete their quests.
    """
    message = 'Only quest creators can edit or delete their quests.'

    def has_object_permission(self, request, view, obj):
        # Read permissions for any request
        if request.method in SAFE_METHODS:
            return True
        # Write permissions only for quest creator
        return obj.creator == request.user


class IsQuestCreatorForReview(BasePermission):
    """
    Permission for quest creators to review submissions
    """
    message = 'Only quest creators can review submissions.'

    def has_object_permission(self, request, view, obj):
        return obj.quest_participant.quest.creator == request.user


# Quest Category Views
class QuestCategoryListCreateView(generics.ListCreateAPIView):
    """
    List all quest categories or create a new one.
    """
    queryset = QuestCategory.objects.all()
    serializer_class = QuestCategorySerializer
    permission_classes = [AllowAny]


class QuestCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a quest category.
    """
    queryset = QuestCategory.objects.all()
    serializer_class = QuestCategorySerializer
    permission_classes = [AllowAny]  # Temporarily allow anonymous access


# Main Quest ViewSet with full CRUD
class QuestViewSet(viewsets.ModelViewSet):
    """
    ViewSet for full CRUD operations on quests.
    Provides: list, create, retrieve, update, partial_update, destroy
    """
    queryset = Quest.objects.all()
    lookup_field = 'slug'
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'due_date', 'xp_reward', 'difficulty']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return QuestListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return QuestCreateUpdateSerializer
        return QuestDetailSerializer

    def get_permissions(self):
        # Require authentication for creating, updating, and deleting quests
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        # Allow all users to view quests
        return [AllowAny()]

    def get_queryset(self):
        queryset = Quest.objects.all()
        
        # Exclude soft-deleted quests
        queryset = queryset.filter(is_deleted=False)
        
        # Get the search query first
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search)
            )
        
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by difficulty
        difficulty = self.request.query_params.get('difficulty', None)
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)
        
        # Filter by category
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category_id=category)
        
        # Filter by creator
        creator = self.request.query_params.get('creator', None)
        if creator:
            queryset = queryset.filter(creator_id=creator)
            
        return queryset

    def create(self, request, *args, **kwargs):
        """Custom create method with enhanced debugging"""
        print(f"🔍 QuestViewSet.create called")
        print(f"🔍 Request method: {request.method}")
        print(f"🔍 Request user: {request.user}")
        print(f"🔍 Request data: {request.data}")
        print(f"🔍 Request data type: {type(request.data)}")
        print(f"🔍 Request content type: {request.content_type}")
        
        try:
            response = super().create(request, *args, **kwargs)
            print(f"✅ Quest created successfully with status: {response.status_code}")
            return response
        except Exception as e:
            print(f"❌ Quest creation failed with error: {str(e)}")
            print(f"❌ Error type: {type(e)}")
            import traceback
            print(f"❌ Traceback: {traceback.format_exc()}")
            raise

    @action(detail=True, methods=['post'])
    def join_quest(self, request, slug=None):
        """
        Allow authenticated users to join a quest.
        """
        quest = self.get_object()
        
        # Create quest participant
        serializer = QuestParticipantCreateSerializer(
            data={'quest': quest.id},
            context={'request': request}
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response(
                {'message': 'Successfully joined the quest!'},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def leave_quest(self, request, slug=None):
        """
        Allow participants to leave a quest.
        """
        quest = self.get_object()
        
        try:
            participant = QuestParticipant.objects.get(quest=quest, user=request.user)
            participant.delete()
            return Response(
                {'message': 'Successfully left the quest.'},
                status=status.HTTP_200_OK
            )
        except QuestParticipant.DoesNotExist:
            return Response(
                {'error': 'You are not a participant of this quest.'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def my_quests(self, request):
        """
        Get quests created by or participated in by the current user.
        """
        created_quests = Quest.objects.filter(creator=request.user)
        participating_quests = Quest.objects.filter(
            questparticipant__user=request.user
        ).distinct()
        
        quest_type = request.query_params.get('type', 'all')
        
        if quest_type == 'created':
            queryset = created_quests
        elif quest_type == 'participating':
            queryset = participating_quests
        else:
            queryset = created_quests.union(participating_quests)
        
        serializer = QuestListSerializer(queryset, many=True)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        """
        Override destroy to prevent deletion of in-progress or completed quests.
        Only allow deletion of quests that are still 'open' (no participants assigned).
        Returns the actual refund amount and new balance in the response.
        Also creates a notification for the quest owner.
        """
        from notifications.models import Notification
        quest = self.get_object()
        # Check if user is the quest creator
        if quest.creator != request.user:
            return Response(
                {'error': 'You can only delete your own quests.'},
                status=status.HTTP_403_FORBIDDEN
            )
        # Check if quest is in progress
        if quest.status == 'in-progress':
            return Response(
                {'error': 'Cannot delete a quest that is already in progress. Please complete or cancel the quest first.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        # Check if quest has been completed
        if quest.status == 'completed':
            return Response(
                {'error': 'Cannot delete a completed quest.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        # Refund gold when quest is deleted
        from transactions.transaction_utils import refund_gold_for_quest_deletion
        refund_result = refund_gold_for_quest_deletion(quest)
        if refund_result["success"]:
            print(f"✅ Refunded {refund_result['amount_refunded']} gold to {quest.creator.username} for quest deletion")
            # Soft delete the quest instead of hard delete
            quest.delete()  # This now sets is_deleted=True
            # Create notification for quest owner
            Notification.objects.create(
                user=quest.creator,
                notif_type="quest_deleted",
                title="Quest Deleted",
                message=f"Your quest '{quest.title}' was deleted.",
                quest_id=quest.id,
                quest_title=quest.title
            )
            # Return refund info and new balance
            return Response({
                'success': True,
                'amount_refunded': refund_result['amount_refunded'],
                'new_balance': refund_result['new_balance'] if 'new_balance' in refund_result else None,
                'message': f"Quest deleted. {refund_result['amount_refunded']} gold (quest reward only) refunded. Commission fee is non-refundable."
            }, status=status.HTTP_200_OK)
        else:
            print(f"⚠️ Failed to refund gold for quest deletion: {refund_result.get('error', 'Unknown error')}")
            return Response({'error': refund_result.get('error', 'Refund failed')}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def complete(self, request, slug=None):
        """
        Complete a quest and award XP and gold to participants
        """
        quest = self.get_object()

        # Only quest creators or admins can complete quests
        user = request.user
        is_admin = getattr(user, 'is_admin', False) or getattr(user, 'role', None) == 'admin'
        if quest.creator != user and not is_admin:
            return Response(
                {'error': 'Only the quest creator or an admin can complete this quest.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check if quest is already completed
        if quest.status == 'completed':
            return Response(
                {'error': 'This quest is already completed.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if quest has participants
        if not quest.participants.exists():
            return Response(
                {'error': 'Cannot complete a quest with no participants.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Release gold reservation since gold will now be deducted directly
        from transactions.transaction_utils import release_gold_reservation
        release_gold_reservation(quest)

        # Complete the quest and award rewards
        completion_reason = request.data.get('completion_reason', "Completed by creator")
        result = quest.complete_quest(completion_reason=completion_reason)

        # If admin_award is present, always include it in the response and double-check admin balance
        if result.get('admin_award'):
            from users.models import User
            admin_user = User.objects.filter(is_admin=True).first()
            if not admin_user:
                admin_user = User.objects.filter(role='admin').first()
            if admin_user:
                # Fetch latest values
                result['admin_balance'] = {
                    'username': admin_user.username,
                    'xp': admin_user.xp,
                    'gold': admin_user.gold
                }

        return Response(result)


# Quest Search and Filter Views
class QuestSearchView(generics.ListAPIView):
    """
    Advanced search for quests with multiple filters.
    """
    serializer_class = QuestListSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'description', 'requirements']

    def get_queryset(self):
        queryset = Quest.active_quests.all()
        
        # Text search
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search)
            )
        
        # Filter by available spots - now just checks if quest is open
        available_only = self.request.query_params.get('available_only', None)
        if available_only == 'true':
            queryset = queryset.filter(status='open')
        
        return queryset


# Quest Participant Views
class QuestParticipantListView(generics.ListAPIView):
    """
    List participants for a specific quest.
    """
    serializer_class = QuestParticipantSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        quest_slug = self.kwargs.get('quest_slug')
        quest = get_object_or_404(Quest, slug=quest_slug)
        return QuestParticipant.objects.filter(quest=quest)


class QuestParticipantDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Manage individual quest participation.
    """
    serializer_class = QuestParticipantSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return QuestParticipant.objects.filter(user=self.request.user)


# Quest Submission Views
class QuestSubmissionListCreateView(generics.ListCreateAPIView):
    """
    List submissions for a quest or create a new submission.
    """
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return QuestSubmissionCreateSerializer
        return QuestSubmissionSerializer

    def get_parser_classes(self):
        # Support multipart for file upload
        from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
        if self.request.method == 'POST':
            return [MultiPartParser, FormParser, JSONParser]
        return super().get_parser_classes()
    
    def create(self, request, *args, **kwargs):
        print(f"\n===== QuestSubmissionListCreateView.create =====")
        print(f"User: {request.user}")
        print(f"Quest slug: {kwargs.get('quest_slug')}")
        print(f"Request data: {request.data}")
        print(f"Request FILES: {request.FILES}")
        print("===============================================\n")
        return super().create(request, *args, **kwargs)

    def get_queryset(self):
        quest_slug = self.kwargs.get('quest_slug')
        quest = get_object_or_404(Quest, slug=quest_slug)
        
        # Quest creators can see all submissions
        if quest.creator == self.request.user:
            return QuestSubmission.objects.filter(
                quest_participant__quest=quest
            )
        
        # Participants can only see their own submissions
        return QuestSubmission.objects.filter(
            quest_participant__quest=quest,
            quest_participant__user=self.request.user
        )


class QuestSubmissionDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Manage individual quest submissions.
    """
    serializer_class = QuestSubmissionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return QuestSubmission.objects.filter(
            quest_participant__user=self.request.user
        )


class QuestSubmissionReviewViewSet(viewsets.ModelViewSet):
    """
    ViewSet for quest creators to review submissions with different actions.
    """
    serializer_class = QuestSubmissionReviewSerializer
    permission_classes = [IsAuthenticated, IsQuestCreatorForReview]
    
    def get_queryset(self):
        return QuestSubmission.objects.filter(
            quest_participant__quest__creator=self.request.user
        )

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Mark submission as approved and complete the participant, using robust reward/logging system"""
        submission = self.get_object()
        feedback = request.data.get('feedback', '')
        participant = submission.quest_participant
        quest = participant.quest
        adventurer = participant.user

        # Prevent double reward using QuestCompletionLog
        from .models import QuestCompletionLog
        if QuestCompletionLog.objects.filter(quest=quest, adventurer=adventurer).exists():
            return Response({'detail': 'Reward already granted for this quest and adventurer.'}, status=status.HTTP_400_BAD_REQUEST)

        # Approve the submission
        submission.status = 'approved'
        submission.feedback = feedback
        submission.reviewed_at = timezone.now()
        submission.reviewed_by = request.user
        submission.save()

        # Mark participant as completed
        participant.status = 'completed'
        participant.completed_at = timezone.now()
        participant.save()

        # XP and Gold transactions are now handled in QuestCompletionLog.save()

        # Update adventurer's level if needed
        adventurer.refresh_from_db()
        import math
        new_level = int(math.floor(adventurer.xp / 100))
        if adventurer.level != new_level:
            adventurer.level = new_level
            adventurer.save()

        # Create QuestCompletionLog with debug logging and update adventurer's xp/gold
        try:
            log = QuestCompletionLog.objects.create(
                quest=quest,
                adventurer=adventurer,
                xp_earned=xp_awarded,
                gold_earned=gold_awarded,
                completed_at=timezone.now()
            )
            # Add XP and gold to adventurer from log
            adventurer.xp = getattr(adventurer, 'xp', 0) + xp_awarded
            adventurer.gold = getattr(adventurer, 'gold', 0) + gold_awarded
            # Update level if needed
            import math
            new_level = int(math.floor(adventurer.xp / 100))
            if adventurer.level != new_level:
                adventurer.level = new_level
            adventurer.save()
            print(f"[DEBUG] QuestCompletionLog created: id={log.id}, quest={quest.id}, adventurer={adventurer.id}, xp={xp_awarded}, gold={gold_awarded}")
        except Exception as e:
            print(f"[ERROR] Failed to create QuestCompletionLog: {e}")
            import traceback
            print(traceback.format_exc())
            raise

        # Update the corresponding Application status to 'approved'
        from applications.models import Application
        try:
            application = Application.objects.get(
                quest=quest,
                applicant=adventurer,
                status='approved'  # Should already be approved when they became a participant
            )
            # Application is already approved, no need to change
        except Application.DoesNotExist:
            # If no application found, create or update one to show completion
            application, created = Application.objects.get_or_create(
                quest=quest,
                applicant=adventurer,
                defaults={
                    'status': 'approved',
                    'applied_at': participant.joined_at,
                    'reviewed_by': quest.creator,
                    'reviewed_at': timezone.now(),
                    'review_notes': f'Quest completed - submission approved: {feedback}'
                }
            )
            if not created:
                application.status = 'approved'
                application.reviewed_by = quest.creator
                application.reviewed_at = timezone.now()
                application.review_notes = f'Quest completed - submission approved: {feedback}'
                application.save()

        return Response({
            'status': 'approved',
            'message': 'Submission approved and participant completed',
            'xp_transaction': {'id': xp_tx.id, 'amount': xp_tx.amount, 'reason': xp_tx.reason},
            'gold_transaction': {'id': gold_tx.id, 'amount': gold_tx.amount, 'reason': gold_tx.reason},
            'rewards': {
                'xp_awarded': xp_awarded,
                'gold_awarded': gold_awarded
            },
            'completion_log_id': log.id
        })

    @action(detail=True, methods=['post'])
    def needs_revision(self, request, pk=None):
        """Mark submission as needing revision - participant can resubmit"""
        submission = self.get_object()
        feedback = request.data.get('feedback', '')
        
        submission.status = 'needs_revision'
        submission.feedback = feedback
        submission.reviewed_at = timezone.now()
        submission.reviewed_by = request.user
        submission.save()
        
        # Keep participant status as 'in_progress' so they can continue working
        participant = submission.quest_participant
        if participant.status != 'in_progress':
            participant.status = 'in_progress'
            participant.save()
        
        return Response({
            'status': 'needs_revision',
            'message': 'Submission marked as needing revision - participant can resubmit'
        })


# Statistics and Dashboard Views
class QuestStatsView(generics.GenericAPIView):
    """
    Get quest statistics for dashboard.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # User's quest statistics
        created_quests = Quest.objects.filter(creator=user).count()
        participating_quests = QuestParticipant.objects.filter(user=user).count()
        completed_quests = QuestParticipant.objects.filter(
            user=user, status='completed'
        ).count()
        
        # Total XP earned from completed quests
        total_xp_earned = sum([
            participant.quest.xp_reward 
            for participant in QuestParticipant.objects.filter(
                user=user, status='completed'
            )
        ])
        
        # Total gold earned from completed quests
        total_gold_earned = sum([
            participant.quest.gold_reward 
            for participant in QuestParticipant.objects.filter(
                user=user, status='completed'
            )
        ])
        
        # Get user's gold balance
        from transactions.transaction_utils import get_user_balance, get_available_balance
        total_gold_balance = get_user_balance(user)
        available_gold_balance = get_available_balance(user)
        reserved_gold = total_gold_balance - available_gold_balance
        
        return Response({
            'created_quests': created_quests,
            'participating_quests': participating_quests,
            'completed_quests': completed_quests,
            'total_xp_earned': total_xp_earned,
            'total_gold_earned': total_gold_earned,
            'total_gold_balance': total_gold_balance,
            'available_gold_balance': available_gold_balance,
            'reserved_gold': reserved_gold
        })


# Admin Views for Quest Management
class AdminQuestListView(generics.ListAPIView):
    """
    Admin view to list all quests with full details.
    """
    queryset = Quest.objects.all()
    serializer_class = QuestDetailSerializer
    permission_classes = [IsAuthenticated]  # Add admin permission in production
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'creator__username']
    ordering_fields = ['created_at', 'status', 'participant_count']


class AdminQuestDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Admin view for detailed quest management.
    """
    queryset = Quest.objects.all()
    serializer_class = QuestDetailSerializer
    permission_classes = [IsAuthenticated]  # Add admin permission in production
    lookup_field = 'slug'

    def destroy(self, request, *args, **kwargs):
        """
        Override destroy to prevent deletion of in-progress quests.
        Only allow deletion of quests that are still 'open' (no participants assigned).
        """
        quest = self.get_object()
        
        # Check if user is the quest creator or an admin
        if quest.creator != request.user and not (request.user.is_staff or request.user.is_superuser):
            return Response(
                {'error': 'You can only delete your own quests.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if quest is in progress
        if quest.status == 'in-progress':
            return Response(
                {'error': 'Cannot delete a quest that is already in progress. Please complete or cancel the quest first.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if quest has been completed
        if quest.status == 'completed':
            return Response(
                {'error': 'Cannot delete a completed quest.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Refund gold when quest is deleted
        from transactions.transaction_utils import refund_gold_for_quest_deletion
        refund_result = refund_gold_for_quest_deletion(quest)

        if refund_result["success"]:
            print(f"✅ Refunded {refund_result['amount_refunded']} gold to {quest.creator.username} for quest deletion")
            
            # Create notification for quest creator about deletion
            from notifications.models import Notification
            if request.user != quest.creator:  # Only notify if admin deleted it, not self-deletion
                Notification.objects.create(
                    user=quest.creator,
                    notif_type="quest_deleted",
                    title="Quest Deleted by Admin",
                    message=f"Your quest '{quest.title}' has been deleted by an administrator. {refund_result['amount_refunded']} gold has been refunded to your account.",
                    quest_id=quest.id,
                    quest_title=quest.title
                )
            
            # Soft delete the quest instead of hard delete
            quest.delete()  # This now sets is_deleted=True
            # Return refund info and new balance
            return Response({
                'success': True,
                'amount_refunded': refund_result['amount_refunded'],
                'new_balance': refund_result['new_balance'] if 'new_balance' in refund_result else None,
                'message': f"Quest deleted. {refund_result['amount_refunded']} gold (quest reward only) refunded. Commission fee is non-refundable."
            }, status=status.HTTP_200_OK)
        else:
            print(f"⚠️ Failed to refund gold for quest deletion: {refund_result.get('error', 'Unknown error')}")
            return Response({'error': refund_result.get('error', 'Refund failed')}, status=status.HTTP_400_BAD_REQUEST)


class QuestSubmissionFileDownloadView(generics.GenericAPIView):
    """
    Serve a file from a QuestSubmission as an attachment, preserving the original filename.
    Only the quest creator or the participant who made the submission can download.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, submission_id, file_index):
        submission = get_object_or_404(QuestSubmission, id=submission_id)
        user = request.user
        quest = submission.quest_participant.quest
        participant = submission.quest_participant.user
        # Only quest creator or participant can download
        if not (user == quest.creator or user == participant):
            return Response({'error': 'Permission denied.'}, status=403)
        files = submission.submission_files or []
        try:
            file_obj = files[file_index]
            file_url = file_obj.get('file')
            orig_name = file_obj.get('name', 'submission_file')
        except (IndexError, AttributeError, KeyError, TypeError):
            raise Http404('File not found in submission.')
        # Restrict allowed file types
        allowed_exts = {'.jpg', '.jpeg', '.png', '.pdf', '.doc', '.txt'}
        _, ext = os.path.splitext(orig_name.lower())
        if ext not in allowed_exts:
            return Response({'error': f'File type {ext} is not allowed.'}, status=403)
        # file_url is relative to MEDIA_URL, get absolute path
        print(f"[DOWNLOAD DEBUG] file_url: {file_url}")
        if file_url.startswith(settings.MEDIA_URL):
            rel_path = file_url[len(settings.MEDIA_URL):]
        else:
            rel_path = file_url
        rel_path = urllib.parse.unquote(rel_path)  # Decode URL-encoded characters
        print(f"[DOWNLOAD DEBUG] rel_path: {rel_path}")
        abs_path = os.path.join(settings.MEDIA_ROOT, rel_path)
        print(f"[DOWNLOAD DEBUG] abs_path: {abs_path}")
        if not os.path.exists(abs_path):
            print(f"[DOWNLOAD DEBUG] File does not exist at: {abs_path}")
            raise Http404('File does not exist.')
        # Guess content type
        content_type, _ = mimetypes.guess_type(orig_name)
        # Always set Content-Type to application/pdf for PDFs
        if ext == '.pdf':
            content_type = 'application/pdf'
        response = FileResponse(open(abs_path, 'rb'), as_attachment=True, filename=orig_name)
        if content_type:
            response['Content-Type'] = content_type
        return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_submission_count(request, quest_slug):
    user = request.user
    participant = QuestParticipant.objects.filter(user=user, quest__slug=quest_slug).first()
    if not participant:
        return Response({'submissions_used': 0, 'submission_limit': 5})
    # Use the new model for counting attempts
    attempt_count = QuestSubmissionAttempt.objects.filter(participant=participant, quest__slug=quest_slug, user=user).count()
    return Response({'submissions_used': attempt_count, 'submission_limit': 5})


class KickParticipantView(generics.DestroyAPIView):
    queryset = QuestParticipant.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk, *args, **kwargs):
        participant = self.get_object()
        # Only quest owner can kick
        if participant.quest.creator != request.user:
            return Response({'detail': 'Only the quest owner can remove participants.'}, status=status.HTTP_403_FORBIDDEN)
        participant.delete()
        return Response({'detail': 'Participant removed.'}, status=status.HTTP_204_NO_CONTENT)


from rest_framework.views import APIView

class CompleteQuestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        quest_id = request.data.get('quest_id')
        submission_id = request.data.get('submission_id')
        if not quest_id or not submission_id:
            return Response({'detail': 'quest_id and submission_id are required.'}, status=status.HTTP_400_BAD_REQUEST)

        quest = get_object_or_404(Quest, id=quest_id)
        submission = get_object_or_404(QuestSubmission, id=submission_id)
        adventurer = submission.quest_participant.user

        # 1. Verify the requesting user is the Quest creator.
        if quest.creator != user:
            return Response({'detail': 'Only the quest creator can complete this quest.'}, status=status.HTTP_403_FORBIDDEN)

        # 2. Validate the submission is for the given quest and not already approved.
        if submission.quest_participant.quest.id != quest.id:
            return Response({'detail': 'Submission does not belong to this quest.'}, status=status.HTTP_400_BAD_REQUEST)
        if submission.status == 'approved':
            return Response({'detail': 'Submission already approved.'}, status=status.HTTP_400_BAD_REQUEST)

        # 3. Prevent double reward using QuestCompletionLog.
        if QuestCompletionLog.objects.filter(quest=quest, adventurer=adventurer).exists():
            return Response({'detail': 'Reward already granted for this quest and adventurer.'}, status=status.HTTP_400_BAD_REQUEST)

        # 4. Approve the submission and mark the quest as 'completed'.
        submission.status = 'approved'
        submission.reviewed_at = timezone.now()
        submission.reviewed_by = user
        submission.save()
        quest.status = 'completed'
        quest.completed_at = timezone.now()
        quest.save()

        # 5. Grant rewards
        xp = getattr(quest, 'xp_reward', getattr(quest, 'reward_xp', 0))
        gold = getattr(quest, 'gold_reward', getattr(quest, 'reward_gold', 0))
        adventurer.xp = getattr(adventurer, 'xp', 0) + xp
        adventurer.gold = getattr(adventurer, 'gold', 0) + gold
        # 6. Update level if XP thresholds are passed
        adventurer.level = int(math.floor(adventurer.xp / 100))
        adventurer.save()

        # 7. Create QuestCompletionLog
        log = QuestCompletionLog.objects.create(
            quest=quest,
            adventurer=adventurer,
            xp_earned=xp,
            gold_earned=gold,
            completed_at=timezone.now()
        )

        # 8. Return updated user profile and success message
        return Response({
            'adventurer': {
                'id': adventurer.id,
                'username': adventurer.username,
                'level': adventurer.level,
                'xp': adventurer.xp,
                'gold': adventurer.gold,
            },
            'xp_earned': xp,
            'gold_earned': gold,
            'log_id': log.id,
            'detail': f"{adventurer.username} earned {xp} XP and {gold} gold!"
        }, status=status.HTTP_200_OK)


# Quest Completion Log Views
class QuestCompletionLogListView(generics.ListAPIView):
    """
    List quest completion logs with optional filtering by quest and adventurer username.
    """
    serializer_class = QuestCompletionLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        quest_id = self.request.query_params.get('quest')
        adventurer_username = self.request.query_params.get('adventurer')
        queryset = QuestCompletionLog.objects.all()
        print(f"[DEBUG] QuestCompletionLogListView.get_queryset called with quest_id={quest_id}, adventurer_username={adventurer_username}")
        if quest_id:
            queryset = queryset.filter(quest_id=quest_id)
        if adventurer_username:
            queryset = queryset.filter(adventurer__username=adventurer_username)
        print(f"[DEBUG] QuestCompletionLogListView returning {queryset.count()} logs")
        return queryset
