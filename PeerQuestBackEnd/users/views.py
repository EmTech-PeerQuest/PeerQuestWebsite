from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.permissions import IsAuthenticated
from .serializers import UserProfileSerializer
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import User
from rest_framework.permissions import AllowAny
from notifications.utils import create_welcome_notification, create_welcome_back_notification
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken

class UserProfileView(RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    class Meta:
        model = User
        fields = ("username", "email", "password")

    def create(self, validated_data):
        user = User(
            username=validated_data["username"],
            email=validated_data["email"]
        )
        validate_password(validated_data["password"], user)
        user.set_password(validated_data["password"])
        user.save()
        return user

class RegisterView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        try:
            serializer = RegisterSerializer(data=request.data)
            if serializer.is_valid():
                user = serializer.save()
                # Create welcome notification
                create_welcome_notification(user)
                return Response({
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                        "avatar_url": user.avatar_url,
                    },
                    "notification": {
                        "type": "success",
                        "message": "Welcome to the PeerQuest Tavern, Your Account has been Created!"
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

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        user = authenticate(username=username, password=password)
        if user is not None:
            create_welcome_back_notification(user)
            refresh = RefreshToken.for_user(user)
            return Response({
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                },
                "token": str(refresh.access_token),
                "notification": {
                    "type": "success",
                    "message": "Welcome Back to the PeerQuest Tavern"
                }
            }, status=status.HTTP_200_OK)
        else:
            return Response({"errors": ["Invalid credentials."]}, status=status.HTTP_400_BAD_REQUEST)
