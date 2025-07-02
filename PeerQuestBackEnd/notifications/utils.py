from .models import Notification
from users.models import User

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
