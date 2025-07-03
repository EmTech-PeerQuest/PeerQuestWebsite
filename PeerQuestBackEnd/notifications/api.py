from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Notification

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def clear_notifications(request):
    user = request.user
    Notification.objects.filter(user=user).delete()
    return Response({'status': 'success', 'message': 'All notifications cleared.'})
