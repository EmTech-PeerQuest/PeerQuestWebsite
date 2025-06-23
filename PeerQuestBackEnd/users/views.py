# users/views.py

from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import NewUser
from .serializers import CustomUserSerializer, UpdateProfileSerializer, PublicUserSerializer


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