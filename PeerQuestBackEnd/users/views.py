import os
import requests
def ai_check_username_profanity(username):
    """
    Uses the Groq LLM to check if a username is appropriate.
    Returns True if clean, False if inappropriate/profane.
    """
    GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
    GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
    prompt = f"Is the following username appropriate and free of profanity or offensive language? Only answer 'yes' or 'no'. Username: '{username}'"
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": "You are a moderation assistant that only answers 'yes' or 'no'."},
            {"role": "user", "content": prompt}
        ],
        "max_tokens": 5,
    }
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    try:
        r = requests.post(GROQ_API_URL, json=payload, headers=headers, timeout=15)
        r.raise_for_status()
        data = r.json()
        reply = data["choices"][0]["message"]["content"].strip().lower()
        return reply.startswith('yes')
    except Exception as e:
        # If the AI check fails, default to allowing (or you can default to block)
        return True
# User Report API
from .models import UserReport
from .serializers import UserReportSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

class UserReportView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data.copy()
        data['reporter'] = request.user.id

        # Prevent self-reporting
        if str(data.get('reported_user')) == str(request.user.id):
            return Response({'success': False, 'message': 'You cannot report yourself.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if reported user is staff or superuser
        from .models import User
        try:
            reported_user = User.objects.get(id=data.get('reported_user'))
        except User.DoesNotExist:
            return Response({'success': False, 'message': 'Reported user not found.'}, status=status.HTTP_404_NOT_FOUND)
        if reported_user.is_superuser or reported_user.is_staff:
            return Response({'success': False, 'message': 'You cannot report staff or superusers.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = UserReportSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response({'success': True, 'message': 'User reported successfully.'}, status=status.HTTP_201_CREATED)
        return Response({'success': False, 'errors': serializer.errors, 'message': 'Failed to report user.'}, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk=None):
        # Mark a user report as resolved (admin only)
        if not (request.user.is_superuser or request.user.is_staff):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        report_id = pk or request.data.get('id')
        if not report_id:
            return Response({'detail': 'Report ID required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            report = UserReport.objects.get(id=report_id)
        except UserReport.DoesNotExist:
            return Response({'detail': 'Report not found.'}, status=status.HTTP_404_NOT_FOUND)
        report.status = 'resolved'
        report.save()
        return Response({'success': True, 'message': 'User report resolved.'}, status=status.HTTP_200_OK)

    def delete(self, request, pk=None):
        # Allow admin to delete a user report
        if not (request.user.is_superuser or request.user.is_staff):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        report_id = pk or request.data.get('id')
        if not report_id:
            return Response({'detail': 'Report ID required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            report = UserReport.objects.get(id=report_id)
        except UserReport.DoesNotExist:
            return Response({'detail': 'Report not found.'}, status=status.HTTP_404_NOT_FOUND)
        report.delete()
        return Response({'success': True, 'message': 'User report deleted.'}, status=status.HTTP_200_OK)

# Quest Report API
from .models import QuestReport
from .serializers import QuestReportSerializer
from quests.models import Quest

class QuestReportView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data.copy()
        data['reporter'] = request.user.id

        # Prevent reporting own quest
        try:
            quest = Quest.objects.get(id=data.get('reported_quest'))
        except Quest.DoesNotExist:
            return Response({'success': False, 'message': 'Reported quest not found.'}, status=status.HTTP_404_NOT_FOUND)
        if str(quest.creator.id) == str(request.user.id):
            return Response({'success': False, 'message': 'You cannot report your own quest.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = QuestReportSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response({'success': True, 'message': 'Quest reported successfully.'}, status=status.HTTP_201_CREATED)
        return Response({'success': False, 'errors': serializer.errors, 'message': 'Failed to report quest.'}, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk=None):
        # Mark a quest report as resolved (admin only)
        if not (request.user.is_superuser or request.user.is_staff):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        report_id = pk or request.data.get('id')
        if not report_id:
            return Response({'detail': 'Report ID required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            report = QuestReport.objects.get(id=report_id)
        except QuestReport.DoesNotExist:
            return Response({'detail': 'Report not found.'}, status=status.HTTP_404_NOT_FOUND)
        report.status = 'resolved'
        report.save()
        return Response({'success': True, 'message': 'Quest report resolved.'}, status=status.HTTP_200_OK)

    def delete(self, request, pk=None):
        # Allow admin to delete a quest report
        if not (request.user.is_superuser or request.user.is_staff):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        report_id = pk or request.data.get('id')
        if not report_id:
            return Response({'detail': 'Report ID required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            report = QuestReport.objects.get(id=report_id)
        except QuestReport.DoesNotExist:
            return Response({'detail': 'Report not found.'}, status=status.HTTP_404_NOT_FOUND)
        report.delete()
        return Response({'success': True, 'message': 'Quest report deleted.'}, status=status.HTTP_200_OK)
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
from .serializers import (
    UserProfileSerializer, RegisterSerializer, UserInfoUpdateSerializer,
    UserSkillSerializer, SkillsManagementSerializer, UserSearchSerializer
)
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.shortcuts import redirect
from .models import User, UserSession, BlacklistedToken, COLLEGE_SKILLS, Skill, UserSkill, Skill, UserSkill
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
from .password_validators import PasswordStrengthChecker
import re
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
            username = request.data.get('username', '')
            if username and not ai_check_username_profanity(username):
                return Response({'error': 'Username contains inappropriate language.'}, status=status.HTTP_400_BAD_REQUEST)
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
                # Return detailed validation errors
                print("Registration validation errors:", serializer.errors)  # Debug logging
                return Response({
                    'error': 'Registration failed',
                    'details': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            print(f"Registration error: {e}")  # Debug logging
            import traceback
            traceback.print_exc()
            return Response({
                'error': 'Registration failed',
                'detail': str(e)
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
            # Log failed password change attempt
            self._log_security_event(
                user, 
                'failed_password_change', 
                request,
                {'reason': 'incorrect_current_password'}
            )
            return Response({
                "errors": ["Current password is incorrect."]
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Check if user is superadmin
            if user.is_superuser:
                # Superadmins have relaxed password requirements
                if len(new_password) < 8:
                    return Response({
                        "errors": ["Password must be at least 8 characters long."]
                    }, status=status.HTTP_400_BAD_REQUEST)
            else:
                # Regular users must meet all password requirements
                validate_password(new_password, user)
            
            # Set new password (this will also update last_password_change)
            user.set_password(new_password)
            user.save()
            
            # Log successful password change
            self._log_security_event(
                user, 
                'password_change', 
                request,
                {'initiated_by': 'user'}
            )
            
            return Response({
                "detail": "Password changed successfully.",
                "security_notice": "Your password has been changed successfully. All other sessions have been terminated." if not user.is_superuser else "Password changed successfully."
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            # Log failed password change attempt
            self._log_security_event(
                user, 
                'failed_password_change', 
                request,
                {'reason': 'validation_error', 'error': str(e)}
            )
            return Response({
                "errors": [str(e)]
            }, status=status.HTTP_400_BAD_REQUEST)
    
    def _log_security_event(self, user, event_type, request, details=None):
        """Log security events."""
        from .models import SecurityEvent
        
        ip_address = self._get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        SecurityEvent.objects.create(
            user=user,
            event_type=event_type,
            ip_address=ip_address,
            user_agent=user_agent,
            details=details or {}
        )
    
    def _get_client_ip(self, request):
        """Get client IP address."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


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
        
        # Validate the new password with security exemption for superadmins
        try:
            if user.is_superuser:
                # Superadmins have relaxed password requirements
                if len(new_password) < 8:
                    return Response({
                        'new_password': ['Password must be at least 8 characters long.']
                    }, status=status.HTTP_400_BAD_REQUEST)
            else:
                # Regular users must meet all password requirements
                validate_password(new_password, user)
        except serializers.ValidationError as e:
            return Response({
                'new_password': e.messages
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Set the new password
        user.set_password(new_password)
        user.save()
        
        # Log security event
        self._log_security_event(
            user, 
            'password_reset', 
            request,
            {'initiated_by': 'password_reset_link'}
        )
        
        return Response({
            'detail': 'Password has been reset successfully.',
            'security_notice': 'Your password has been reset successfully. Please log in with your new password.' if not user.is_superuser else 'Password reset successfully.'
        }, status=status.HTTP_200_OK)
    
    def _log_security_event(self, user, event_type, request, details=None):
        """Log security events."""
        from .models import SecurityEvent
        
        ip_address = self._get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        SecurityEvent.objects.create(
            user=user,
            event_type=event_type,
            ip_address=ip_address,
            user_agent=user_agent,
            details=details or {}
        )
    
    def _get_client_ip(self, request):
        """Get client IP address."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class PasswordStrengthCheckView(APIView):
    """
    Enhanced real-time password strength checking with detailed feedback.
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        password = request.data.get('password', '')
        username = request.data.get('username', '')
        email = request.data.get('email', '')
        
        if not password:
            return Response({
                'success': False,
                'error': 'Password is required.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Create a temporary user object for personal info checking
            temp_user = None
            if username or email:
                temp_user = type('TempUser', (), {
                    'username': username,
                    'email': email,
                    'display_name': username,
                    'is_superuser': False
                })()
            
            # Check if this is likely a superuser
            is_likely_superuser = username and username.lower() in ['admin', 'superadmin', 'root', 'administrator']
            
            # Use our enhanced password strength checker
            strength_checker = PasswordStrengthChecker()
            result = strength_checker.check_password_strength(password, temp_user)
            
            # Add superuser exemption logic
            if is_likely_superuser:
                result['is_superuser_exempt'] = True
                if len(password) >= 8:
                    result['strength'] = 'adequate_for_admin'
                    result['feedback'].append("Password meets minimum requirements for admin users.")
                    result['errors'] = []  # Clear errors for superusers
                else:
                    result['errors'] = ["Password must be at least 8 characters long for admin users."]
            else:
                result['is_superuser_exempt'] = False
            
            return Response({
                'success': True,
                'data': result
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

class PasswordStrengthView(APIView):
    """
    API endpoint for real-time password strength checking.
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        """
        Check password strength and return detailed feedback.
        """
        try:
            password = request.data.get('password', '')
            username = request.data.get('username', '')
            email = request.data.get('email', '')
            
            # Create a temporary user object for personal info checking
            temp_user = None
            if username or email:
                temp_user = type('TempUser', (), {
                    'username': username,
                    'email': email,
                    'display_name': username,
                    'is_superuser': False
                })()
            
            # Check password strength
            strength_checker = PasswordStrengthChecker()
            result = strength_checker.check_password_strength(password, temp_user)
            
            return Response({
                'success': True,
                'data': result
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

class UserSearchView(APIView):
    """Search for users by username, skills, or location"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Get search parameters
            query = request.GET.get('q', '').strip()
            skills = request.GET.get('skills', '').strip()
            location = request.GET.get('location', '').strip()
            min_level = request.GET.get('min_level', '')
            max_level = request.GET.get('max_level', '')
            
            # Build the search query
            from django.db.models import Q
            from .models import UserSkill
            
            search_query = Q()
            
            # Search by username or display name
            if query:
                search_query |= Q(username__icontains=query) | Q(display_name__icontains=query)
            
            # Search by location
            if location:
                search_query &= Q(location__icontains=location)
            
            # Search by level range
            if min_level:
                try:
                    search_query &= Q(level__gte=int(min_level))
                except ValueError:
                    pass
                    
            if max_level:
                try:
                    search_query &= Q(level__lte=int(max_level))
                except ValueError:
                    pass
            
            # Get base users
            users = User.objects.filter(search_query).exclude(id=request.user.id)
            
            # Filter by skills if provided
            if skills:
                skill_list = [skill.strip() for skill in skills.split(',') if skill.strip()]
                if skill_list:
                    # Get users who have any of the specified skills
                    users_with_skills = UserSkill.objects.filter(
                        skill__name__in=skill_list
                    ).values_list('user_id', flat=True)
                    users = users.filter(id__in=users_with_skills)
            
            # Limit results and serialize
            users = users[:50]  # Limit to 50 results
            serializer = UserSearchSerializer(users, many=True)
            
            return Response({
                'success': True,
                'results': serializer.data,
                'count': len(serializer.data)
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

class SkillsListView(APIView):
    """List all available skills organized by category"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Get skills from database
            skills = Skill.objects.filter(is_active=True).order_by('category', 'name')

            # Organize by category
            skills_by_category = {}
            for skill in skills:
                if skill.category not in skills_by_category:
                    skills_by_category[skill.category] = []
                skills_by_category[skill.category].append({
                    'id': str(skill.id),
                    'name': skill.name,
                    'description': skill.description
                })

            # If no skills in database, return predefined skills as objects with fake UUIDs
            import uuid
            if not skills_by_category:
                for cat, arr in COLLEGE_SKILLS.items():
                    skills_by_category[cat] = [
                        {'id': str(uuid.uuid5(uuid.NAMESPACE_DNS, name)), 'name': name, 'description': ''}
                        for name in arr
                    ]

            return Response({
                'success': True,
                'skills_by_category': skills_by_category
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

class UserSkillsView(APIView):
    """Manage user skills"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get user's current skills"""
        try:
            print("[DEBUG] User in request:", request.user)
            if not request.user or not request.user.is_authenticated:
                print("[DEBUG] User is not authenticated!")
                return Response({
                    'success': False,
                    'error': 'Authentication required.'
                }, status=status.HTTP_401_UNAUTHORIZED)

            user_skills = UserSkill.objects.filter(user=request.user).select_related('skill')
            print(f"[DEBUG] Found {user_skills.count()} user skills for user {request.user}")
            serializer = UserSkillSerializer(user_skills, many=True)
            print(f"[DEBUG] Serialized data: {serializer.data}")
            return Response({
                'success': True,
                'skills': serializer.data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            import traceback
            print("[DEBUG] Exception in UserSkillsView.get:", str(e))
            traceback.print_exc()
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    def post(self, request):
        """Add or update user skills"""
        try:
            print("[DEBUG] Incoming data:", request.data)
            serializer = SkillsManagementSerializer(data=request.data, context={'request': request})
            if serializer.is_valid():
                serializer.save()
                print("[DEBUG] Skills updated successfully.")
                return Response({
                    'success': True,
                    'message': 'Skills updated successfully'
                }, status=status.HTTP_200_OK)
            else:
                print("[DEBUG] Serializer errors:", serializer.errors)
                return Response({
                    'success': False,
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print("[DEBUG] Exception in UserSkillsView.post:", str(e))
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


# --- API endpoint: List all users for frontend user search ---
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import User, UserSkill, Skill
from django.db.models import Prefetch

class UserListForFrontendView(APIView):
    """
    API endpoint to list all users in a format compatible with the frontend user search.
    Returns: id, username, displayName, avatar, level, completedQuests, guilds, skills, bio, roleDisplay, badges, etc.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            # Optionally: add filters here (e.g., search, pagination)
            users = User.objects.all()[:100]  # Limit to 100 users for performance
            user_ids = [user.id for user in users]
            # Get all user skills in one query
            user_skills = UserSkill.objects.filter(user_id__in=user_ids).select_related('skill')
            skills_by_user = {}
            for us in user_skills:
                if us.user_id not in skills_by_user:
                    skills_by_user[us.user_id] = []
                if us.skill:
                    skills_by_user[us.user_id].append({
                        'id': us.skill.id,
                        'name': us.skill.name,
                        'description': us.skill.description
                    })
            user_list = []
            for user in users:
                # Serialize guilds as list of objects with id and name, ensure unique ids
                guilds = []
                if hasattr(user, 'guilds') and hasattr(user.guilds, 'all'):
                    seen_guild_ids = set()
                    for g in user.guilds.all():
                        if g.id not in seen_guild_ids:
                            guilds.append({'id': str(g.id), 'name': g.name})
                            seen_guild_ids.add(g.id)
                # Serialize badges as list of objects with id and name, ensure unique ids
                badges = []
                if hasattr(user, 'badges') and hasattr(user.badges, 'all'):
                    seen_badge_ids = set()
                    for b in user.badges.all():
                        if b.id not in seen_badge_ids:
                            badges.append({'id': str(b.id), 'name': b.name})
                            seen_badge_ids.add(b.id)
                # Serialize skills as list of objects with id and name, ensure unique ids
                skills = []
                seen_skill_ids = set()
                for s in skills_by_user.get(user.id, []):
                    if s['id'] not in seen_skill_ids:
                        skills.append({'id': str(s['id']), 'name': s['name'], 'description': s.get('description', '')})
                        seen_skill_ids.add(s['id'])
                user_list.append({
                    'id': str(user.id),
                    'username': user.username,
                    'displayName': getattr(user, 'display_name', user.username),
                    'avatar': getattr(user, 'avatar_url', None),
                    'level': getattr(user, 'level', 1),
                    'completedQuests': getattr(user, 'completed_quests', 0),
                    'guilds': guilds,
                    'skills': skills,
                    'bio': getattr(user, 'bio', ''),
                    'roleDisplay': getattr(user, 'role_display', ''),
                    'badges': badges,
                })
            return Response(user_list, status=200)
        except Exception as e:
            return Response({'error': str(e)}, status=500)

from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        # You can use a serializer if you want more fields or custom formatting
        data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': getattr(user, 'first_name', ''),
            'last_name': getattr(user, 'last_name', ''),
            # Add more fields as needed
        }
        return Response(data)

class UpdateProfileView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        return Response({'message': 'UpdateProfileView placeholder'}, status=200)

class PublicProfileView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, username=None):
        return Response({'message': f'PublicProfileView placeholder for {username}'}, status=200)

class RegisterUserView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        return Response({'message': 'RegisterUserView placeholder'}, status=200)

# Guild Report API
from .models import GuildReport
from .serializers import GuildReportSerializer

class GuildReportView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data.copy()
        data['reporter'] = request.user.id

        # Check if guild exists
        from guilds.models import Guild
        try:
            # Handle both 'reported_guild' and 'reportedGuild' field names
            guild_id = data.get('reported_guild') or data.get('reportedGuild')
            if not guild_id:
                return Response({'success': False, 'message': 'Guild ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
            reported_guild = Guild.objects.get(guild_id=guild_id)
        except Guild.DoesNotExist:
            return Response({'success': False, 'message': 'Guild not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Prevent reporting own guild
        if reported_guild.owner_id == request.user.id:
            return Response({'success': False, 'message': 'You cannot report your own guild.'}, status=status.HTTP_400_BAD_REQUEST)

        # Map frontend field names to backend field names
        data['reported_guild'] = reported_guild.guild_id
        data['reason'] = data.get('reason', '')

        serializer = GuildReportSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response({'success': True, 'message': 'Guild reported successfully.'}, status=status.HTTP_201_CREATED)
        return Response({'success': False, 'errors': serializer.errors, 'message': 'Failed to report guild.'}, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk=None):
        # Mark a guild report as resolved (admin only)
        if not (request.user.is_superuser or request.user.is_staff):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        report_id = pk or request.data.get('id')
        if not report_id:
            return Response({'detail': 'Report ID required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            report = GuildReport.objects.get(id=report_id)
        except GuildReport.DoesNotExist:
            return Response({'detail': 'Report not found.'}, status=status.HTTP_404_NOT_FOUND)
        report.resolved = True
        report.resolved_by = request.user
        from django.utils import timezone
        report.resolved_at = timezone.now()
        report.save()
        return Response({'success': True, 'message': 'Guild report resolved.'}, status=status.HTTP_200_OK)

    def delete(self, request, pk=None):
        # Allow admin to delete a guild report
        if not (request.user.is_superuser or request.user.is_staff):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        report_id = pk or request.data.get('id')
        if not report_id:
            return Response({'detail': 'Report ID required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            report = GuildReport.objects.get(id=report_id)
        except GuildReport.DoesNotExist:
            return Response({'detail': 'Report not found.'}, status=status.HTTP_404_NOT_FOUND)
        report.delete()
        return Response({'success': True, 'message': 'Guild report deleted.'}, status=status.HTTP_200_OK)
