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

<<<<<<< HEAD

class CurrentUserView(APIView):
    """
    Returns the authenticated user's profile info.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = CustomUserSerializer(request.user)
        return Response(serializer.data)


class UpdateProfileView(generics.UpdateAPIView):
    """
    Allows user to update their username or avatar.
    """
    permission_classes = [permissions.IsAuthenticated]

    queryset = NewUser.objects.all()
    serializer_class = UpdateProfileSerializer
=======
class UserProfileView(RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
>>>>>>> origin/dev_Esteron/AuthProfile

    def get_object(self):
        return self.request.user

<<<<<<< HEAD
class PublicProfileView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]

    queryset = NewUser.objects.all()
    serializer_class = PublicUserSerializer
    lookup_field = 'username'

class RegisterUserView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]

    queryset = NewUser.objects.all()
    serializer_class = CustomUserSerializer
=======
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
>>>>>>> origin/dev_Esteron/AuthProfile
