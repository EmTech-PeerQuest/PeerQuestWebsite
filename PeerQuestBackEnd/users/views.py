# users/views.py

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import NewUser
from .serializers import CustomUserSerializer, UpdateProfileSerializer, PublicUserSerializer


class RegisterView(APIView):
    """
    Register a new user and return an authentication token.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')

        # Validate required fields
        if not all([username, email, password]):
            return Response(
                {'error': 'Username, email, and password are required.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if user already exists
        if NewUser.objects.filter(username=username).exists():
            return Response(
                {'error': 'Username already exists.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        if NewUser.objects.filter(email=email).exists():
            return Response(
                {'error': 'Email already exists.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate password
        try:
            validate_password(password)
        except ValidationError as e:
            return Response(
                {'error': list(e.messages)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create user
        user = NewUser.objects.create_user(
            username=username,
            email=email,
            password=password
        )

        # Create token
        token, created = Token.objects.get_or_create(user=user)

        # Return user data and token
        serializer = CustomUserSerializer(user)
        return Response({
            'user': serializer.data,
            'token': token.key
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """
    Authenticate user and return token.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response(
                {'error': 'Username and password are required.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Authenticate user
        user = authenticate(username=username, password=password)
        
        if user is None:
            return Response(
                {'error': 'Invalid credentials.'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.is_active:
            return Response(
                {'error': 'Account is disabled.'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Get or create token
        token, created = Token.objects.get_or_create(user=user)

        # Return user data and token
        serializer = CustomUserSerializer(user)
        return Response({
            'user': serializer.data,
            'token': token.key
        })


class LogoutView(APIView):
    """
    Logout user by deleting their token.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            # Delete the user's token
            request.user.auth_token.delete()
            return Response({'message': 'Successfully logged out.'})
        except Token.DoesNotExist:
            return Response({'message': 'Already logged out.'})

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
    queryset = NewUser.objects.all()
    serializer_class = UpdateProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

class PublicProfileView(generics.RetrieveAPIView):
    queryset = NewUser.objects.all()
    serializer_class = PublicUserSerializer
    lookup_field = 'username'