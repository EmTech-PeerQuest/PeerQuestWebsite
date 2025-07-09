from .models import Notification
from users.models import User
from .websocket_notify import send_notification_ws
import logging
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

def create_welcome_notification(user: User):
    Notification.objects.create(
        user=user,
        type="welcome to the peerquest tavern, your account has been created!",
        title="Welcome!",
        message="Welcome to the PeerQuest Tavern, Your Account has been Created!"
    )

def create_welcome_back_notification(user: User):
    Notification.objects.create(
        user=user,
        type="welcome back to the peerquest tavern",
        title="Welcome Back!",
        message="Welcome Back to the PeerQuest Tavern"
    )

def create_application_accepted_notification(user: User, quest_title: str, quest_id: int):
    notif = Notification.objects.create(
        user=user,
        type="accepted",
        title="Application Accepted",
        message=f"Your application for '{quest_title}' was accepted!"
    )
    send_notification_ws(user.id, {
        'title': notif.title,
        'message': notif.message,
        'type': notif.type,
        'created_at': notif.created_at.isoformat(),
        'id': notif.notification_id,
        'quest_id': quest_id,
    })

def create_application_rejected_notification(user: User, quest_title: str, quest_id: int):
    notif = Notification.objects.create(
        user=user,
        type="rejected",
        title="Application Rejected",
        message=f"Your application for '{quest_title}' was rejected."
    )
    send_notification_ws(user.id, {
        'title': notif.title,
        'message': notif.message,
        'type': notif.type,
        'created_at': notif.created_at.isoformat(),
        'id': notif.notification_id,
        'quest_id': quest_id,
    })

def create_application_submitted_notification(quest_maker, applicant_name, quest_title, quest_id):
    logger = logging.getLogger(__name__)
    logger.info(f"Creating notification for quest maker {quest_maker} from applicant {applicant_name} for quest '{quest_title}' at {timezone.now()}")
    notif = Notification.objects.create(
        user=quest_maker,
        type="quest_application",
        title="New Quest Application",
        message=f"{applicant_name} has applied for your quest '{quest_title}'!"
    )
    send_notification_ws(quest_maker.id, {
        'title': notif.title,
        'message': notif.message,
        'type': notif.type,
        'created_at': notif.created_at.isoformat(),
        'id': notif.notification_id,
        'quest_id': quest_id,
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def debug_list_notifications(request):
    """Return all notifications for the current user (debug only)"""
    notifications = Notification.objects.filter(user=request.user).order_by('-created_at')
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
