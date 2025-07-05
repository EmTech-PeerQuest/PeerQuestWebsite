import traceback
import unicodedata
from itertools import product
from datetime import timedelta
from django.utils import timezone
from django.shortcuts import redirect

print("USERS.VIEWS.PY LOADED")

from rest_framework.generics import RetrieveUpdateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import serializers, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import UserProfileSerializer, RegisterSerializer, UserInfoUpdateSerializer
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.shortcuts import redirect
from .models import User
from .services import google_get_access_token, google_get_user_info, create_user_and_token
from .email_utils import send_verification_email, generate_verification_token
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .validators import PROFANITY_LIST, LEET_MAP, levenshtein, normalize_username


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
        print("DISPATCH CALLED FOR GOOGLELOGINCALLBACKVIEW", request.method, request.path)
        print("request.user:", request.user)
        return super().dispatch(request, *args, **kwargs)

    def post(self, request):
        #print("GOOGLE LOGIN CALLBACK VIEW REACHED (POST)")  # DEBUG
        #print("POST DATA:", request.data)
        # Accept Google ID token from frontend
        credential = request.data.get('credential')
        if not credential:
            print("NO CREDENTIAL FOUND IN POST DATA")
            return Response({'error': 'Missing Google credential.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            # Verify the token with Google
            idinfo = id_token.verify_oauth2_token(
                credential,
                google_requests.Request(),
                settings.GOOGLE_OAUTH2_CLIENT_ID
            )
            # idinfo contains user's Google profile info
            user_data = {
                'email': idinfo.get('email'),
                'username': idinfo.get('email').split('@')[0],
                'avatar_url': idinfo.get('picture'),
                'first_name': idinfo.get('given_name', ''),
                'last_name': idinfo.get('family_name', ''),
            }
            token_data = create_user_and_token(user_data)
            #print("GOOGLE LOGIN TOKEN DATA:", token_data)  # DEBUG PRINT
            return Response(token_data)
        except Exception as e:
            #print("GOOGLE LOGIN ERROR:", str(e))  # DEBUG PRINT
            #traceback.print_exc()  # Print full traceback for debugging
            return Response({'error': str(e) or 'Failed to verify Google credential.'}, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request):
        print("GOOGLE LOGIN CALLBACK VIEW REACHED (GET)")  # DEBUG
        print("GET DATA:", request.GET)
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
    """Handles user registration with email verification."""
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            serializer = RegisterSerializer(data=request.data)
            if serializer.is_valid():
                user = serializer.save()
                
                # Send verification email
                if send_verification_email(user):
                    return Response({
                        "message": "Registration successful! Please check your email to verify your account.",
                        "user": {
                            "id": user.id,
                            "username": user.username,
                            "email": user.email,
                            "email_verified": user.email_verified,
                        }
                    }, status=status.HTTP_201_CREATED)
                else:
                    return Response({
                        "message": "Registration successful, but there was an issue sending the verification email. Please try to resend it.",
                        "user": {
                            "id": user.id,
                            "username": user.username,
                            "email": user.email,
                            "email_verified": user.email_verified,
                        }
                    }, status=status.HTTP_201_CREATED)
            
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
                error_list = ["Registration failed. Please check your input and try again."]
            return Response({"errors": error_list}, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            return Response({"errors": [str(e) or "An unexpected error occurred during registration."]}, status=status.HTTP_400_BAD_REQUEST)


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
