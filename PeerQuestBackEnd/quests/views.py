from rest_framework import generics, viewsets, filters, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, SAFE_METHODS, BasePermission
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q, Count, F
from .models import Quest, QuestCategory, QuestParticipant, QuestSubmission
from .serializers import (
    QuestListSerializer, QuestDetailSerializer, QuestCreateUpdateSerializer,
    QuestCategorySerializer, QuestParticipantSerializer, QuestParticipantCreateSerializer,
    QuestSubmissionSerializer, QuestSubmissionCreateSerializer, QuestSubmissionReviewSerializer
)


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
        # Allow all users to access quests (no authentication required)
        return [AllowAny()]

    def get_queryset(self):
        queryset = Quest.objects.all()
        
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
        
        # Filter by available spots
        available_only = self.request.query_params.get('available_only', None)
        if available_only == 'true':
            queryset = queryset.annotate(
                current_participants=Count('participants')
            ).filter(current_participants__lt=F('max_participants'))
        
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


class QuestSubmissionReviewView(generics.UpdateAPIView):
    """
    Allow quest creators to review submissions.
    """
    serializer_class = QuestSubmissionReviewSerializer
    permission_classes = [IsAuthenticated, IsQuestCreatorForReview]
    
    def get_queryset(self):
        return QuestSubmission.objects.filter(
            quest_participant__quest__creator=self.request.user
        )

    def perform_update(self, serializer):
        serializer.save(reviewed_at=timezone.now())
        
        # If approved, mark participant as completed
        if serializer.validated_data['status'] == 'approved':
            submission = serializer.instance
            participant = submission.quest_participant
            participant.status = 'completed'
            participant.completed_at = timezone.now()
            participant.save()


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
        
        return Response({
            'created_quests': created_quests,
            'participating_quests': participating_quests,
            'completed_quests': completed_quests,
            'total_xp_earned': total_xp_earned,
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
