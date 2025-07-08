from django.utils import timezone
from django.shortcuts import get_object_or_404
from .models import BanAppeal, ActionLog
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
# --- Ban Appeal Review View for Admins ---
class BanAppealReviewView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, appeal_id):
        if not (request.user.is_superuser or request.user.is_staff):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        appeal = get_object_or_404(BanAppeal, id=appeal_id)
        decision = request.data.get('decision')
        if decision not in ['dismissed', 'lifted']:
            return Response({'detail': 'Invalid decision'}, status=status.HTTP_400_BAD_REQUEST)
        # Mark as reviewed
        appeal.reviewed = True
        appeal.reviewed_by = request.user
        appeal.reviewed_at = timezone.now()
        appeal.review_decision = decision
        appeal.save()
        # If lifting ban, unban the user
        if decision == 'lifted':
            user = appeal.user
            user.is_banned = False
            user.ban_reason = ''
            user.ban_expires_at = None
            user.save()
        # Log the action
        ActionLog.objects.create(
            action=f"ban_{'lifted' if decision == 'lifted' else 'dismissed'}",
            admin=request.user,
            target_user=appeal.user,
            details=f'Ban appeal {decision} for user {appeal.user.email} (appeal id {appeal.id})',
        )
        return Response({'detail': f'Appeal {decision}.'}, status=status.HTTP_200_OK)
import traceback
import unicodedata
from itertools import product
from datetime import timedelta
from django.utils import timezone
from django.shortcuts import redirect

# Users views module loaded

from rest_framework.generics import RetrieveUpdateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import serializers, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.core.exceptions import ValidationError
from .serializers import UserProfileSerializer, RegisterSerializer, UserInfoUpdateSerializer
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.shortcuts import redirect
from .models import User, UserSession, BlacklistedToken
from .services import google_get_access_token, google_get_user_info, create_user_and_token, TokenManager
from .email_utils import send_verification_email, generate_verification_token
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .validators import PROFANITY_LIST, LEET_MAP, levenshtein, normalize_username
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
import jwt

class LogoutView(APIView):
    """Handle user logout and token blacklisting"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            # Get the refresh token from request
            refresh_token = request.data.get('refresh_token')
            
            if refresh_token:
                try:
                    # Decode the refresh token to get JTI
                    decoded_token = jwt.decode(
                        refresh_token, 
                        settings.SECRET_KEY, 
                        algorithms=['HS256'],
                        options={"verify_signature": False}
                    )
                    refresh_jti = decoded_token.get('jti')
                    
                    # Blacklist the specific refresh token
                    if refresh_jti:
                        TokenManager.blacklist_token(
                            refresh_jti, 
                            request.user, 
                            'refresh', 
                            'logout'
                        )
                        
                        # Deactivate the session
                        UserSession.objects.filter(
                            refresh_token_jti=refresh_jti,
                            user=request.user
                        ).update(is_active=False)
                        
                except jwt.InvalidTokenError:
                    # Token is invalid, but that's okay for logout
                    pass
            
            # Also blacklist the current access token
            auth_header = request.META.get('HTTP_AUTHORIZATION')
            if auth_header and auth_header.startswith('Bearer '):
                access_token = auth_header.split(' ')[1]
                try:
                    decoded_access = jwt.decode(
                        access_token, 
                        settings.SECRET_KEY, 
                        algorithms=['HS256'],
                        options={"verify_signature": False}
                    )
                    access_jti = decoded_access.get('jti')
                    if access_jti:
                        TokenManager.blacklist_token(
                            access_jti, 
                            request.user, 
                            'access', 
                            'logout'
                        )
                except jwt.InvalidTokenError:
                    pass
            
            # User logged out successfully
            return Response({'message': 'Logout successful'}, status=status.HTTP_200_OK)
            
        except Exception as e:
            # Logout error occurred
            return Response({'error': 'Logout failed'}, status=status.HTTP_400_BAD_REQUEST)

class LogoutAllView(APIView):
    """Logout from all sessions (blacklist all user tokens)"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            # Blacklist all tokens for this user
            TokenManager.blacklist_user_tokens(request.user, 'logout')
            
            # All sessions terminated successfully
            return Response({'message': 'All sessions logged out successfully'}, status=status.HTTP_200_OK)
            
        except Exception as e:
            # Logout all error occurred
            return Response({'error': 'Logout all failed'}, status=status.HTTP_400_BAD_REQUEST)

class UserSessionsView(APIView):
    """Get all active sessions for the current user"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            sessions = TokenManager.get_user_sessions(request.user)
            
            session_data = []
            for session in sessions:
                session_data.append({
                    'id': str(session.id),
                    'device_info': session.device_info,
                    'ip_address': session.ip_address,
                    'created_at': session.created_at,
                    'last_activity': session.last_activity,
                    'is_current': session.refresh_token_jti == self.get_current_refresh_jti(request),
                })
            
            return Response({'sessions': session_data}, status=status.HTTP_200_OK)
            
        except Exception as e:
            # Get sessions error occurred
            return Response({'error': 'Failed to get sessions'}, status=status.HTTP_400_BAD_REQUEST)
    
    def get_current_refresh_jti(self, request):
        """Helper to get current refresh token JTI from request"""
        # This would typically come from the refresh token stored on the client
        # For now, we'll return None as it's not always available
        return None

class RevokeSessionView(APIView):
    """Revoke a specific session"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            session_id = request.data.get('session_id')
            if not session_id:
                return Response({'error': 'Session ID required'}, status=status.HTTP_400_BAD_REQUEST)
            
            success = TokenManager.revoke_session(session_id, request.user)
            
            if success:
                return Response({'message': 'Session revoked successfully'}, status=status.HTTP_200_OK)
            else:
                return Response({'error': 'Session not found or already revoked'}, status=status.HTTP_404_NOT_FOUND)
                
        except Exception as e:
            # Revoke session error occurred
            return Response({'error': 'Failed to revoke session'}, status=status.HTTP_400_BAD_REQUEST)

class UserInfoSettingsView(RetrieveUpdateDestroyAPIView):
    serializer_class = UserInfoUpdateSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

@method_decorator(csrf_exempt, name='dispatch')
class GoogleLoginCallbackView(APIView):
    """Handles Google OAuth callback, user creation, and JWT issuance."""
    permission_classes = [AllowAny]
    authentication_classes = []  # Force DRF to skip authentication for this view

    def dispatch(self, request, *args, **kwargs):
        return super().dispatch(request, *args, **kwargs)

    def post(self, request):
        # Check if Google OAuth2 settings are configured
        if not settings.GOOGLE_OAUTH2_CLIENT_ID:
            return Response({'error': 'Google OAuth2 not configured on server'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Accept Google ID token from frontend
        credential = request.data.get('credential')
        if not credential:
            return Response({'error': 'Missing Google credential.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Verify the token with Google - add clock tolerance for small time differences
            idinfo = id_token.verify_oauth2_token(
                credential,
                google_requests.Request(),
                settings.GOOGLE_OAUTH2_CLIENT_ID,
                clock_skew_in_seconds=60  # Allow up to 60 seconds clock difference
            )

            # idinfo contains user's Google profile info
            user_data = {
                'email': idinfo.get('email'),
                'username': idinfo.get('email').split('@')[0],
                'avatar_url': idinfo.get('picture'),
                'first_name': idinfo.get('given_name', ''),
                'last_name': idinfo.get('family_name', ''),
            }

            try:
                token_data = create_user_and_token(user_data, request)
            except ValidationError as ve:
                # Always return a consistent error structure for banned users
                msg = getattr(ve, 'message', None) or getattr(ve, 'message_dict', None) or str(ve)
                if isinstance(msg, dict) and msg.get('banned'):
                    # Ensure all ban info fields are present
                    ban_response = {
                        'banned': True,
                        'detail': msg.get('detail', 'Your account is banned.'),
                        'ban_reason': msg.get('ban_reason'),
                        'ban_expires_at': msg.get('ban_expires_at'),
                    }
                    return Response(ban_response, status=status.HTTP_403_FORBIDDEN)
                return Response({'error': str(ve)}, status=status.HTTP_400_BAD_REQUEST)
            return Response(token_data)

        except ValueError as e:
            return Response({'error': f'Invalid Google token: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': 'Server error occurred'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def get(self, request):
        code = request.GET.get('code')
        error = request.GET.get('error')

        if error or not code:
            return Response({'error': error or 'Missing authorization code.'}, status=status.HTTP_400_BAD_REQUEST)

        # Use HTTPS if request is secure
        domain = request.META.get('HTTP_HOST', 'localhost:8000')
        protocol = 'https' if request.is_secure() else 'http'
        redirect_uri = f'{protocol}://{domain}/api/google-login-callback/'

        try:
            access_token = google_get_access_token(code=code, redirect_uri=redirect_uri)
            user_data = google_get_user_info(access_token=access_token)
            token_data = create_user_and_token(user_data)
        except Exception as e:
            return Response({'error': str(e) or 'Failed to authenticate with Google.'}, status=status.HTTP_400_BAD_REQUEST)

        return Response(token_data)
    
class UserProfileView(APIView):
    """Returns or updates the authenticated user's profile."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        serializer = UserProfileSerializer(user)
        return Response(serializer.data)

    def patch(self, request):
        user = request.user
        serializer = UserProfileSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "detail": "Profile updated successfully.",
                "user": serializer.data
            }, status=status.HTTP_200_OK)
        # Flatten serializer errors to a readable string list
        def extract_errors(errors):
            if isinstance(errors, dict):
                result = []
                for v in errors.values():
                    result.extend(extract_errors(v))
                return result
            elif isinstance(errors, list):
                result = []
                for v in errors:
                    result.extend(extract_errors(v))
                return result
            elif isinstance(errors, str):
                return [errors]
            return []
        error_list = extract_errors(serializer.errors)
        if not error_list:
            error_list = ["Update failed. Please check your input and try again."]
        return Response({"errors": error_list}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        user = request.user
        user.delete()
        return Response({
            "detail": "Account deleted successfully."
        }, status=status.HTTP_200_OK)


class RegisterView(APIView):
    """Handle user registration"""
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        try:
            serializer = RegisterSerializer(data=request.data)
            if serializer.is_valid():
                user = serializer.save()
                
                # Automatically verify superusers
                if user.is_superuser:
                    user.email_verified = True
                    user.save()
                
                # Generate JWT tokens
                refresh = RefreshToken.for_user(user)
                access_token = str(refresh.access_token)
                refresh_token = str(refresh)
                
                # Send verification email (skip for superusers)
                email_sent = False
                if not user.is_superuser:
                    try:
                        send_verification_email(user)
                        email_sent = True
                    except Exception as e:
                        # Don't fail registration if email fails
                        pass
                
                return Response({
                    'message': 'Registration successful',
                    'user': {
                        'id': str(user.id),
                        'username': user.username,
                        'email': user.email,
                        'display_name': user.display_name,
                        'email_verified': user.email_verified,
                    },
                    'access': access_token,
                    'refresh': refresh_token,
                    'email_sent': email_sent
                }, status=status.HTTP_201_CREATED)
            else:
                # Return validation errors
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({
                'error': 'Registration failed',
                'detail': 'Server error occurred'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class EmailVerificationView(APIView):
    """Handles email verification via token."""
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Handle verification via GET request (direct link from email)."""
        token = request.query_params.get('token')
        
        if not token:
            # Redirect to frontend with error
            return redirect(f"http://localhost:3000/verify-email?error=missing-token")
        
        try:
            # Find user with this token
            user = User.objects.get(email_verification_token=token)
            
            # Check if token is still valid (24 hours)
            if user.email_verification_sent_at:
                expiry_time = user.email_verification_sent_at + timedelta(hours=24)
                if timezone.now() > expiry_time:
                    # Redirect to frontend with error
                    return redirect(f"http://localhost:3000/verify-email?error=expired&email={user.email}")
            
            # Verify the user
            user.email_verified = True
            user.email_verification_token = None
            user.email_verification_sent_at = None
            user.save()
            
            # Generate JWT tokens for automatic login
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)
            
            # Redirect to frontend with tokens
            return redirect(f"http://localhost:3000/verify-email?success=true&access_token={access_token}&refresh_token={refresh_token}")
            
        except User.DoesNotExist:
            # Redirect to frontend with error
            return redirect(f"http://localhost:3000/verify-email?error=invalid-token")
        except Exception as e:
            # Redirect to frontend with error
            return redirect(f"http://localhost:3000/verify-email?error=server-error")
    
    def post(self, request):
        """Handle verification via POST request (API call)."""
        token = request.data.get('token')
        
        if not token:
            return Response({
                "errors": ["Verification token is required."]
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Find user with this token
            user = User.objects.get(email_verification_token=token)
            
            # Check if token is still valid (24 hours)
            if user.email_verification_sent_at:
                expiry_time = user.email_verification_sent_at + timedelta(hours=24)
                if timezone.now() > expiry_time:
                    return Response({
                        "errors": ["Verification link has expired. Please request a new one."]
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            # Verify the user
            user.email_verified = True
            user.email_verification_token = None
            user.email_verification_sent_at = None
            user.save()
            
            # Generate JWT tokens for automatic login
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)
            
            return Response({
                "message": "Email verified successfully! You are now logged in.",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "email_verified": user.email_verified,
                },
                "access_token": access_token,
                "refresh_token": refresh_token,
            }, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response({
                "errors": ["Invalid verification token."]
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                "errors": [str(e) or "An error occurred during verification."]
            }, status=status.HTTP_400_BAD_REQUEST)


class ResendVerificationView(APIView):
    """Resend verification email."""
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        
        if not email:
            return Response({
                "errors": ["Email is required."]
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email.lower().strip())
            
            # Check if user is already verified
            if user.email_verified:
                return Response({
                    "errors": ["This email address is already verified."]
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if we recently sent a verification email (prevent spam)
            if user.email_verification_sent_at:
                time_since_last = timezone.now() - user.email_verification_sent_at
                if time_since_last < timedelta(minutes=5):
                    return Response({
                        "errors": ["Please wait at least 5 minutes before requesting another verification email."]
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            # Send new verification email
            if send_verification_email(user):
                return Response({
                    "message": "Verification email sent successfully! Please check your email."
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    "errors": ["Failed to send verification email. Please try again later."]
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except User.DoesNotExist:
            return Response({
                "errors": ["No account found with this email address."]
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                "errors": [str(e) or "An error occurred while sending verification email."]
            }, status=status.HTTP_400_BAD_REQUEST)


class PasswordChangeView(APIView):
    """Handles password changes for authenticated users."""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user = request.user
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        
        if not current_password or not new_password:
            return Response({
                "errors": ["Current password and new password are required."]
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify current password
        if not user.check_password(current_password):
            return Response({
                "errors": ["Current password is incorrect."]
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Validate new password
            validate_password(new_password, user)
            
            # Set new password
            user.set_password(new_password)
            user.save()
            
            return Response({
                "detail": "Password changed successfully."
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                "errors": [str(e)]
            }, status=status.HTTP_400_BAD_REQUEST)


class EmailVerifiedTokenObtainPairView(TokenObtainPairView):
    """
    Custom token view that checks email verification before issuing tokens.
    Prevents unverified users from logging in.
    """
    
    def post(self, request, *args, **kwargs):
        # First, authenticate the user
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response({
                'detail': 'Username and password are required.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Authenticate user
        user = authenticate(username=username, password=password)
        
        if user is None:
            return Response({
                'detail': 'Invalid username or password.'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Check if user is banned (permanent or temporary)
        if user.is_banned:
            # If ban is temporary, check expiration
            if user.ban_expires_at:
                if timezone.now() < user.ban_expires_at:
                    return Response({
                        'detail': f'Your account is temporarily banned until {user.ban_expires_at}. Reason: {user.ban_reason}',
                        'banned': True,
                        'ban_expires_at': user.ban_expires_at,
                        'ban_reason': user.ban_reason,
                    }, status=status.HTTP_403_FORBIDDEN)
                else:
                    # Ban expired, auto-unban
                    user.is_banned = False
                    user.ban_reason = None
                    user.ban_expires_at = None
                    user.save()
            else:
                # Permanent ban
                return Response({
                    'detail': f'Your account is permanently banned. Reason: {user.ban_reason}',
                    'banned': True,
                    'ban_reason': user.ban_reason,
                }, status=status.HTTP_403_FORBIDDEN)

        # Check if user's email is verified (skip for superusers)
        # Superusers are exempt from email verification requirements
        if not user.email_verified and not user.is_superuser:
            return Response({
                'detail': 'Please verify your email address before logging in. Check your inbox for the verification email.',
                'verification_required': True
            }, status=status.HTTP_403_FORBIDDEN)

        # If user is verified and not banned, proceed with normal token generation
        return super().post(request, *args, **kwargs)

class PasswordResetView(APIView):
    """
    Handle password reset requests.
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        
        if not email:
            return Response({
                'detail': 'Email is required.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Don't reveal whether email exists for security
            return Response({
                'detail': 'If an account with this email exists, you will receive a password reset link shortly.'
            }, status=status.HTTP_200_OK)
        
        # Generate password reset token
        token_generator = PasswordResetTokenGenerator()
        token = token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        
        # Create password reset link
        frontend_url = "http://localhost:3000"  # This should be configurable via environment variable
        reset_link = f"{frontend_url}/reset-password?uid={uid}&token={token}"
        
        # Send email (you'll need to configure email settings)
        try:
            email_subject = 'Password Reset - PeerQuest Tavern'
            email_message = f'''
Hello,

You requested a password reset for your PeerQuest Tavern account.

Click the link below to reset your password:
{reset_link}

If you didn't request this password reset, please ignore this email.

This link will expire in 24 hours for security reasons.

Best regards,
The PeerQuest Tavern Team
'''
            
            send_mail(
                subject=email_subject,
                message=email_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
        except Exception as e:
            return Response({
                'detail': 'Failed to send password reset email. Please try again later.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({
            'detail': 'If an account with this email exists, you will receive a password reset link shortly.'
        }, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    """
    Handle password reset confirmation with uid and token.
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        uid = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        
        if not uid or not token or not new_password:
            return Response({
                'detail': 'UID, token, and new password are required.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            from django.utils.http import urlsafe_base64_decode
            from django.utils.encoding import force_str
            
            # Decode the user ID
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({
                'detail': 'Invalid password reset link.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify the token
        token_generator = PasswordResetTokenGenerator()
        if not token_generator.check_token(user, token):
            return Response({
                'detail': 'Invalid or expired password reset link.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate the new password
        try:
            validate_password(new_password, user)
        except serializers.ValidationError as e:
            return Response({
                'new_password': e.messages
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Set the new password
        user.set_password(new_password)
        user.save()
        
        return Response({
            'detail': 'Password has been reset successfully.'
        }, status=status.HTTP_200_OK)
