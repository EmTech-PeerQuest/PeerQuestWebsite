
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            notifications = Notification.objects.filter(user=request.user)
            serializer = NotificationSerializer(notifications, many=True)
            return Response(serializer.data)
        except Exception as e:
            print("NotificationListView error:", str(e))
            return Response({'error': 'Server error', 'details': str(e)}, status=500)
    
    def post(self, request):
        """Create a new notification (admin only)"""
        if not request.user.is_staff:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = NotificationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class NotificationClearAllView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Notification.objects.filter(user=request.user).delete()
        return Response({'detail': 'All notifications cleared.'}, status=status.HTTP_204_NO_CONTENT)


class NotificationReadView(APIView):
    """Mark a single notification as read"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk=None):
        notif = get_object_or_404(Notification, pk=pk, user=request.user)
        notif.read = True
        notif.save()
        serializer = NotificationSerializer(notif)
        return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def unread_count(request):
    """Get count of unread notifications for current user"""
    count = Notification.objects.filter(user=request.user, read=False).count()
    return Response({'count': count})
