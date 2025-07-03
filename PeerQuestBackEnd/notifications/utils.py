from .models import Notification
from users.models import User
from .websocket_notify import send_notification_ws

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

def create_application_accepted_notification(user: User, quest_title: str):
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
    })

def create_application_rejected_notification(user: User, quest_title: str):
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
    })
