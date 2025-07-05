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

from .models import Application
from .serializers import (
    ApplicationListSerializer,
    ApplicationDetailSerializer,
    ApplicationCreateSerializer
)


class ApplicationViewSet(ModelViewSet):
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
        """Approve an application"""
        application = get_object_or_404(Application, pk=pk)
        
        # Check if user is the quest creator
        if application.quest.creator != request.user:
            return Response(
                {'error': 'You can only approve applications to your own quests.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if application is pending
        if application.status != 'pending':
            return Response(
                {'error': 'Application is not pending.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Approve the application with proper error handling
        try:
            logger.info(f"Attempting to approve application: {application.applicant.username} -> Quest '{application.quest.title}' (ID: {application.quest.id})")
            result = application.approve(request.user)
            
            if result:
                logger.info(f"Application approved successfully: {application.applicant.username} -> Quest '{application.quest.title}'")
                serializer = self.get_serializer(application)
                return Response({
                    'message': 'Application approved successfully',
                    'data': serializer.data
                })
            else:
                logger.error(f"Application approval returned False: {application.applicant.username} -> Quest '{application.quest.title}'")
                return Response(
                    {'error': 'Failed to approve application - unknown error.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        except Exception as e:
            logger.error(f"Application approval failed with exception: {application.applicant.username} -> Quest '{application.quest.title}': {str(e)}")
            return Response(
                {
                    'error': 'Failed to approve application due to system error.',
                    'details': str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject an application"""
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
                {'error': 'Application is not pending.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Reject the application
        result = application.reject(request.user)
        if result:
            serializer = self.get_serializer(application)
            return Response(serializer.data)
        else:
            return Response(
                {'error': 'Failed to reject application.'},
                status=status.HTTP_400_BAD_REQUEST
            )

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
