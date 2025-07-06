import secrets
import uuid
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from django.utils import timezone
from .models import User

def generate_verification_token():
    """Generate a secure verification token."""
    return secrets.token_urlsafe(32)

def send_verification_email(user):
    """Send email verification email to user."""
    try:
        # Generate verification token
        verification_token = generate_verification_token()
        
        # Save token to user
        user.email_verification_token = verification_token
        user.email_verification_sent_at = timezone.now()
        user.save()
        
        # Create verification URL - point to backend GET endpoint
        verification_url = f"http://localhost:8000/api/users/verify-email/?token={verification_token}"
        
        # Email context
        context = {
            'user': user,
            'verification_url': verification_url,
            'frontend_url': settings.FRONTEND_URL,
        }
        
        # Render email templates
        html_message = render_to_string('emails/verify_email.html', context)
        plain_message = strip_tags(html_message)
        
        # Send email
        send_mail(
            subject='Verify your PeerQuest account',
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        
        return True
        
    except Exception as e:
        print(f"Error sending verification email to {user.email}: {str(e)}")
        return False

def send_password_reset_email(user, reset_url):
    """Send password reset email to user."""
    try:
        context = {
            'user': user,
            'reset_url': reset_url,
            'frontend_url': settings.FRONTEND_URL,
        }
        
        html_message = render_to_string('emails/password_reset.html', context)
        plain_message = strip_tags(html_message)
        
        send_mail(
            subject='Reset your PeerQuest password',
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        
        return True
        
    except Exception as e:
        # Error sending password reset email
        pass
        return False
