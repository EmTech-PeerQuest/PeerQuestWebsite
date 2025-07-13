import jwt
from datetime import datetime, timedelta
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from .models import BlacklistedToken, UserSession

User = get_user_model()

class TokenManager:
    """Centralized token management service"""
    
    @staticmethod
    def create_tokens_for_user(user, request=None):
        """Create new access and refresh tokens for a user"""
        refresh = RefreshToken.for_user(user)
        access = refresh.access_token
        
        # Create session record if request is provided
        if request:
            TokenManager.create_user_session(user, refresh, request)
        
        return {
            'access': str(access),
            'refresh': str(refresh),
            'access_expires': access['exp'],
            'refresh_expires': refresh['exp'],
        }
    
    @staticmethod
    def blacklist_token(token_jti, user, token_type='access', reason='logout'):
        """Add a token to the blacklist"""
        BlacklistedToken.objects.get_or_create(
            token_jti=token_jti,
            defaults={
                'user': user,
                'token_type': token_type,
                'reason': reason,
            }
        )
    
    @staticmethod
    def blacklist_user_tokens(user, reason='logout'):
        """Blacklist all active tokens for a user"""
        # Get all active sessions
        active_sessions = UserSession.objects.filter(user=user, is_active=True)
        
        for session in active_sessions:
            # Blacklist the refresh token
            TokenManager.blacklist_token(
                session.refresh_token_jti, 
                user, 
                'refresh', 
                reason
            )
            
            # Deactivate the session
            session.is_active = False
            session.save()
        
        # All tokens blacklisted for user
        pass
    
    @staticmethod
    def create_user_session(user, refresh_token, request):
        """Create a new user session record"""
        # Extract device info from user agent
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        ip_address = TokenManager.get_client_ip(request)
        
        # Parse basic device info
        device_info = TokenManager.parse_user_agent(user_agent)
        
        # Get the JTI from refresh token
        refresh_jti = refresh_token['jti']
        
        # Create session
        UserSession.objects.create(
            user=user,
            refresh_token_jti=refresh_jti,
            device_info=device_info,
            ip_address=ip_address,
            user_agent=user_agent,
        )
    
    @staticmethod
    def get_client_ip(request):
        """Extract the real client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip or '127.0.0.1'
    
    @staticmethod
    def parse_user_agent(user_agent):
        """Parse basic device info from user agent"""
        device_info = {
            'browser': 'Unknown',
            'os': 'Unknown',
            'device_type': 'Desktop'
        }
        
        user_agent_lower = user_agent.lower()
        
        # Detect browser
        if 'chrome' in user_agent_lower:
            device_info['browser'] = 'Chrome'
        elif 'firefox' in user_agent_lower:
            device_info['browser'] = 'Firefox'
        elif 'safari' in user_agent_lower:
            device_info['browser'] = 'Safari'
        elif 'edge' in user_agent_lower:
            device_info['browser'] = 'Edge'
        
        # Detect OS
        if 'windows' in user_agent_lower:
            device_info['os'] = 'Windows'
        elif 'mac' in user_agent_lower:
            device_info['os'] = 'macOS'
        elif 'linux' in user_agent_lower:
            device_info['os'] = 'Linux'
        elif 'android' in user_agent_lower:
            device_info['os'] = 'Android'
            device_info['device_type'] = 'Mobile'
        elif 'ios' in user_agent_lower:
            device_info['os'] = 'iOS'
            device_info['device_type'] = 'Mobile'
        
        return device_info
    
    @staticmethod
    def cleanup_expired_tokens():
        """Clean up expired blacklisted tokens and inactive sessions"""
        # Remove expired blacklisted tokens (older than 7 days)
        cutoff_date = timezone.now() - timedelta(days=7)
        BlacklistedToken.objects.filter(blacklisted_at__lt=cutoff_date).delete()
        
        # Remove inactive sessions (older than 30 days)
        session_cutoff = timezone.now() - timedelta(days=30)
        UserSession.objects.filter(
            is_active=False, 
            last_activity__lt=session_cutoff
        ).delete()
        
        # Cleaned up expired tokens and sessions
        pass
    
    @staticmethod
    def get_user_sessions(user):
        """Get all active sessions for a user"""
        return UserSession.objects.filter(user=user, is_active=True).order_by('-last_activity')
    
    @staticmethod
    def revoke_session(session_id, user):
        """Revoke a specific user session"""
        try:
            session = UserSession.objects.get(id=session_id, user=user, is_active=True)
            
            # Blacklist the refresh token
            TokenManager.blacklist_token(
                session.refresh_token_jti,
                user,
                'refresh',
                'manual_revoke'
            )
            
            # Deactivate session
            session.is_active = False
            session.save()
            
            return True
        except UserSession.DoesNotExist:
            return False
