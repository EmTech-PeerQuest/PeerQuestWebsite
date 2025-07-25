from rest_framework import generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet
from django.utils import timezone
from django.shortcuts import get_object_or_404
import logging

logger = logging.getLogger(__name__)
from rest_framework import generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet
from django.utils import timezone
from django.shortcuts import get_object_or_404
import logging

logger = logging.getLogger(__name__)

from .models import Application, ApplicationAttempt
from .serializers import (
    ApplicationListSerializer,
    ApplicationDetailSerializer,
    ApplicationCreateSerializer
)


class ApplicationViewSet(ModelViewSet):
    @action(detail=True, methods=['post'])
    def kick(self, request, pk=None):
        """Kick a participant from a quest (quest owner only). This removes approved participants and reverts quest status if needed."""
        application = get_object_or_404(Application, pk=pk)
        
        # Only quest creator can kick
        if application.quest.creator != request.user:
            return Response({'error': 'You can only kick participants from your own quests.'}, status=status.HTTP_403_FORBIDDEN)
        
        # Only allow kicking approved participants (not pending/rejected/already kicked)
        if application.status != 'approved':
            return Response({'error': 'Only approved participants can be kicked.'}, status=status.HTTP_400_BAD_REQUEST)
        
        reason = request.data.get('reason', '')
        
        # Kick the participant
        try:
            result = application.kick(request.user)
            if result:
                logger.info(f"Participant {application.applicant.username} kicked from quest '{application.quest.title}' by {request.user.username}. Reason: {reason}")
                serializer = self.get_serializer(application)
                return Response({
                    'message': 'Participant kicked successfully.',
                    'reason': reason,
                    'data': serializer.data
                })
            else:
                return Response({'error': 'Failed to kick participant.'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error kicking participant: {str(e)}")
            return Response({'error': f'Failed to kick participant: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def remove(self, request, pk=None):
        """Remove (kick) an applicant from a quest (quest owner only). Optionally provide a reason."""
        application = get_object_or_404(Application, pk=pk)
        # Only quest creator can remove
        if application.quest.creator != request.user:
            return Response({'error': 'You can only remove applicants from your own quests.'}, status=status.HTTP_403_FORBIDDEN)
        # Only allow removing pending or approved applicants
        if application.status not in ['pending', 'approved']:
            return Response({'error': 'Only pending or approved applicants can be removed.'}, status=status.HTTP_400_BAD_REQUEST)
        reason = request.data.get('reason', '')
        # Mark as rejected and log reason
        application.status = 'rejected'
        application.reviewed_by = request.user
        application.reviewed_at = timezone.now()
        application.save()
        logger.info(f"Applicant {application.applicant.username} removed from quest '{application.quest.title}' by {request.user.username}. Reason: {reason}")
        return Response({'message': 'Applicant removed successfully.', 'reason': reason})
    """ViewSet for managing applications"""
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ApplicationCreateSerializer
        elif self.action in ['list', 'retrieve']:
            return ApplicationListSerializer
        return ApplicationDetailSerializer
    
    def create(self, request, *args, **kwargs):
        """Create a new application with debug logging"""
        logger.info(f"Application create request from user: {request.user}")
        logger.info(f"Request data: {request.data}")
        
        try:
            response = super().create(request, *args, **kwargs)
            logger.info(f"Application created successfully: {response.data}")
            return response
        except Exception as e:
            logger.error(f"Error creating application: {str(e)}")
            logger.error(f"Exception type: {type(e)}")
            raise
    
    def get_queryset(self):
        """Return applications based on the action"""
        user = self.request.user
        if self.action == 'my_applications':
            # Applications made by the current user
            return Application.objects.filter(applicant=user).order_by('-applied_at')
        elif self.action == 'to_my_quests':
            # Applications to quests created by the current user
            return Application.objects.filter(quest__creator=user).order_by('-applied_at')
        else:
            # For regular CRUD operations, only show user's own applications
            return Application.objects.filter(applicant=user).order_by('-applied_at')
    
    @action(detail=False, methods=['get'])
    def my_applications(self, request):
        """Get applications made by the current user"""
        try:
            applications = Application.objects.filter(applicant=request.user).order_by('-applied_at')
            serializer = self.get_serializer(applications, many=True)
            return Response({
                'results': serializer.data,
                'count': applications.count()
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def to_my_quests(self, request):
        """Get applications to quests created by the current user"""
        try:
            applications = Application.objects.filter(quest__creator=request.user).order_by('-applied_at')
            serializer = self.get_serializer(applications, many=True)
            return Response({
                'results': serializer.data,
                'count': applications.count()
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve an application with detailed error logging and user info"""
        try:
            application = get_object_or_404(Application, pk=pk)
            debug_info = {
                'request_user_id': getattr(request.user, 'id', None),
                'request_user_username': getattr(request.user, 'username', None),
                'quest_creator_id': getattr(application.quest.creator, 'id', None),
                'quest_creator_username': getattr(application.quest.creator, 'username', None),
                'application_status': application.status,
            }
            logger.error(f"[DEBUG] Approve called. Debug info: {debug_info}")
            # Check if user is the quest creator
            if application.quest.creator != request.user:
                logger.error(f"[DEBUG] User is not quest creator. request.user={request.user}, quest.creator={application.quest.creator}")
                return Response(
                    {'error': 'You can only approve applications to your own quests.', 'debug': debug_info},
                    status=status.HTTP_403_FORBIDDEN
                )
            # Check if application is pending
            if application.status != 'pending':
                logger.error(f"[DEBUG] Application is not pending. Status: {application.status}")
                return Response(
                    {'error': 'Application is not pending.', 'current_status': application.status, 'debug': debug_info},
                    status=status.HTTP_400_BAD_REQUEST
                )
            logger.info(f"Attempting to approve application: {application.applicant.username} -> Quest '{application.quest.title}' (ID: {application.quest.id})")
            result = application.approve(request.user)
            if result:
                logger.info(f"Application approved successfully: {application.applicant.username} -> Quest '{application.quest.title}'")
                serializer = self.get_serializer(application)
                return Response({
                    'message': 'Application approved successfully',
                    'data': serializer.data,
                    'debug': debug_info
                })
            else:
                logger.error(f"Application approval returned False: {application.applicant.username} -> Quest '{application.quest.title}'")
                return Response(
                    {'error': 'Failed to approve application - unknown error.', 'debug': debug_info},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        except Exception as e:
            import traceback
            tb = traceback.format_exc()
            logger.error(f"Application approval failed with exception: {e}\nTraceback:\n{tb}")
            return Response(
                {
                    'error': 'Failed to approve application due to system error.',
                    'details': str(e),
                    'traceback': tb
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject an application with detailed error logging"""
        try:
            application = get_object_or_404(Application, pk=pk)
            # Check if user is the quest creator
            if application.quest.creator != request.user:
                return Response(
                    {'error': 'You can only reject applications to your own quests.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            # Check if application is pending
            if application.status != 'pending':
                return Response(
                    {'error': 'Application is not pending.', 'current_status': application.status},
                    status=status.HTTP_400_BAD_REQUEST
                )
            result = application.reject(request.user)
            if result:
                serializer = self.get_serializer(application)
                return Response(serializer.data)
            else:
                return Response(
                    {'error': 'Failed to reject application.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Exception as e:
            import traceback
            tb = traceback.format_exc()
            logger.error(f"Application rejection failed with exception: {e}\nTraceback:\n{tb}")
            return Response(
                {
                    'error': 'Failed to reject application due to system error.',
                    'details': str(e),
                    'traceback': tb
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def check_attempts(self, request):
        """Check application attempt count for a specific quest"""
        quest_id = request.query_params.get('quest_id')
        
        if not quest_id:
            return Response(
                {'error': 'quest_id parameter is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            quest_id = int(quest_id)
        except ValueError:
            return Response(
                {'error': 'quest_id must be a valid integer'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Import here to avoid circular imports
        from quests.models import Quest
        from .models import ApplicationAttempt
        
        try:
            quest = Quest.objects.get(id=quest_id)
        except Quest.DoesNotExist:
            return Response(
                {'error': 'Quest not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get attempt information with detailed logging
        logger.info(f"Checking attempts for user {request.user.username} on quest {quest_id}")
        
        attempt_count = ApplicationAttempt.get_attempt_count(quest, request.user)
        can_apply, reason = ApplicationAttempt.can_apply_again(quest, request.user)
        
        # Get status of last application if any
        last_application = Application.objects.filter(
            quest=quest, 
            applicant=request.user
        ).order_by('-applied_at').first()
        
        last_status = last_application.status if last_application else None
        
        # Determine max attempts based on user's history
        max_attempts = 4  # Default for rejected users
        if last_status == 'kicked':
            max_attempts = None  # Unlimited for kicked users
        
        result = {
            'quest_id': quest_id,
            'attempt_count': attempt_count,
            'max_attempts': max_attempts,
            'can_apply': can_apply,
            'reason': reason,
            'last_application_status': last_status
        }
        
        logger.info(f"Attempt check result for user {request.user.username} on quest {quest_id}: {result}")
        
        return Response(result)

# Temporary test views for debugging
from rest_framework.decorators import api_view, permission_classes

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def test_my_applications(request):
    """Test endpoint for my applications"""
    applications = Application.objects.filter(applicant=request.user).order_by('-applied_at')
    serializer = ApplicationListSerializer(applications, many=True)
    return Response({
        'results': serializer.data,
        'count': applications.count(),
        'message': 'Test endpoint working'
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def test_to_my_quests(request):
    """Test endpoint for applications to my quests"""
    applications = Application.objects.filter(quest__creator=request.user).order_by('-applied_at')
    serializer = ApplicationListSerializer(applications, many=True)
    return Response({
        'results': serializer.data,
        'count': applications.count(),
        'message': 'Test endpoint working'
    })

# End of test views
