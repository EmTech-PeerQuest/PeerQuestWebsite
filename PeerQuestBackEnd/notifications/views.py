
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifications = Notification.objects.filter(user=request.user)
        # Always refresh related application status if present
        # (Assumes NotificationSerializer includes application/quest info)
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data)


# New endpoint to clear all notifications for the current user
from rest_framework import status

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
    
class NotificationReadView(APIView):
    """Mark a single notification as read"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk=None):
        notif = get_object_or_404(Notification, pk=pk, user=request.user)
        notif.read = True
        notif.save()
        serializer = NotificationSerializer(notif)
        return Response(serializer.data)
