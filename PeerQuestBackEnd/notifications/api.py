from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Notification

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_notifications(request):
    user = request.user
    notifications = Notification.objects.filter(user=user).order_by('-created_at')
    data = [
        {
            'id': n.notification_id,
            'type': n.type,
            'title': n.title,
            'message': n.message,
            'is_read': n.is_read,
            'created_at': n.created_at,
        }
        for n in notifications
    ]
    return Response({'results': data, 'count': len(data)})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def clear_notifications(request):
    user = request.user
    Notification.objects.filter(user=user).delete()
    return Response({'status': 'success', 'message': 'All notifications cleared.'})
