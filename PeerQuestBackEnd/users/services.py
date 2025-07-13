import requests
from django.conf import settings
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from typing import Dict, Any
from rest_framework_simplejwt.tokens import RefreshToken
from datetime import datetime, timedelta
from django.utils import timezone
import jwt

# Token Management Functions
class TokenManager:
    """Centralized token management service"""
    
    @staticmethod
    def create_tokens_for_user(user, request=None):
        """Create new access and refresh tokens for a user"""
        from .models import UserSession
        
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
        from .models import BlacklistedToken
        
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
        from .models import UserSession
        
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
        from .models import UserSession
        
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
        from .models import BlacklistedToken, UserSession
        
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
        from .models import UserSession
        return UserSession.objects.filter(user=user, is_active=True).order_by('-last_activity')
    
    @staticmethod
    def revoke_session(session_id, user):
        """Revoke a specific user session"""
        from .models import UserSession
        
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

def google_get_access_token(code: str, redirect_uri: str) -> str:
    data = {
        'code': code,
        'client_id': settings.GOOGLE_OAUTH2_CLIENT_ID,
        'client_secret': settings.GOOGLE_OAUTH2_CLIENT_SECRET,
        'redirect_uri': redirect_uri,
        'grant_type': 'authorization_code'
    }
    response = requests.post(settings.GOOGLE_ACCESS_TOKEN_OBTAIN_URL, data=data)
    if not response.ok:
        raise ValidationError('Failed to obtain access token from Google.')
    access_token = response.json().get('access_token')
    return access_token

def google_get_user_info(access_token: str) -> Dict[str, Any]:
    # First get basic user info from Google OAuth2
    response = requests.get(
        settings.GOOGLE_USER_INFO_URL,
        params={'access_token': access_token}
    )
    if not response.ok:
        raise ValidationError('Failed to obtain user info from Google.')
    
    user_data = response.json()
    
    # Try to get additional user data from People API (birthday, gender)
    try:
        people_response = requests.get(
            'https://people.googleapis.com/v1/people/me',
            params={
                'personFields': 'birthdays,genders',
                'access_token': access_token
            }
        )
        
        if people_response.ok:
            people_data = people_response.json()
            
            # Extract birthday if available
            if 'birthdays' in people_data:
                for birthday in people_data['birthdays']:
                    if birthday.get('metadata', {}).get('primary'):
                        date_info = birthday.get('date', {})
                        if all(k in date_info for k in ['year', 'month', 'day']):
                            user_data['birthday'] = f"{date_info['year']}-{date_info['month']:02d}-{date_info['day']:02d}"
                        break
            
            # Extract gender if available
            if 'genders' in people_data:
                for gender in people_data['genders']:
                    if gender.get('metadata', {}).get('primary'):
                        gender_value = gender.get('value', '').lower()
                        if gender_value in ['male', 'female']:
                            user_data['gender'] = gender_value
                        break
                        
    except Exception as e:
        # If People API fails, just continue with basic user data
        # People API request failed
        pass
    
    return user_data

def create_user_and_token(user_data: Dict[str, Any], request=None) -> Dict[str, Any]:
    User = get_user_model()
    email = user_data.get('email')
    username = user_data.get('username')
    
    if not email:
        raise ValidationError('Email is required')
    
    try:
        user = User.objects.get(email=email)
        # Check if user is banned (permanent or temporary)
        if user.is_banned:
            from django.utils import timezone
            if user.ban_expires_at:
                if timezone.now() < user.ban_expires_at:
                    raise ValidationError({
                        'detail': f'Your account is temporarily banned until {user.ban_expires_at}. Reason: {user.ban_reason}',
                        'banned': True,
                        'ban_expires_at': user.ban_expires_at,
                        'ban_reason': user.ban_reason,
                    })
                else:
                    # Ban expired, auto-unban
                    user.is_banned = False
                    user.ban_reason = None
                    user.ban_expires_at = None
                    user.save()
            else:
                raise ValidationError({
                    'detail': f'Your account is permanently banned. Reason: {user.ban_reason}',
                    'banned': True,
                    'ban_reason': user.ban_reason,
                })
        # Check if user is active, reactivate if needed
        if not user.is_active:
            user.is_active = True
            user.email_verified = True  # Ensure Google users are verified
            user.save()
    except User.DoesNotExist:
        # Double-check for any existing users with this email or username
        existing_by_email = User.objects.filter(email=email).first()
        target_username = username or email.split('@')[0]
        existing_by_username = User.objects.filter(username=target_username).first()
        try:
            # Since user was deleted, create with original username
            target_username = username or email.split('@')[0]
            user = User.objects.create_user(
                username=target_username,
                email=email,
                first_name=user_data.get('first_name', ''),
                last_name=user_data.get('last_name', ''),
                avatar_url=user_data.get('avatar_url', ''),
                birthday=user_data.get('birthday'),
                gender=user_data.get('gender', ''),  # Provide empty string as default
                email_verified=True,  # Google users are pre-verified
                is_active=True,
            )
        except Exception as e:
            # Check for specific constraint violations
            if 'UNIQUE constraint failed' in str(e):
                if 'username' in str(e):
                    raise ValidationError(f'Username already exists')
                elif 'email' in str(e):
                    raise ValidationError(f'Email already exists')
            elif 'NOT NULL constraint failed' in str(e):
                raise ValidationError(f'Required field missing')
            raise ValidationError(f'Failed to create user: {str(e)}')
    try:
        # Generate JWT tokens using TokenManager
        # Use TokenManager to create tokens and session
        tokens = TokenManager.create_tokens_for_user(user, request)
        result = {
            'access': tokens['access'],
            'refresh': tokens['refresh'],
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'avatar_url': user.avatar_url,
                'birthday': user.birthday,
                'gender': user.gender,
                'email_verified': user.email_verified,
                'is_active': user.is_active,
            }
        }
        return result
    except Exception as e:
        raise ValidationError(f'Failed to generate tokens: {str(e)}')
