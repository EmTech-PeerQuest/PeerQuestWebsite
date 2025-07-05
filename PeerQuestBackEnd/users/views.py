

import traceback
import unicodedata
from itertools import product

print("USERS.VIEWS.PY LOADED")

from rest_framework.generics import RetrieveUpdateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import serializers, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import UserProfileSerializer, RegisterSerializer, UserInfoUpdateSerializer
from django.contrib.auth.password_validation import validate_password
from .models import User
from .services import google_get_access_token, google_get_user_info, create_user_and_token
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
    """Handles user registration with user-friendly error messages."""
    permission_classes = [AllowAny]
    def post(self, request):
        try:
            serializer = RegisterSerializer(data=request.data)
            if serializer.is_valid():
                user = serializer.save()
                return Response({
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                        "avatar_url": user.avatar_url,
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
