from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from .guild_applications import GuildApplication
from .guild_application_serializers import (
    GuildApplicationCreateSerializer,
    GuildApplicationListSerializer,
    GuildApplicationDetailSerializer
)

class GuildApplicationViewSet(viewsets.ModelViewSet):
    queryset = GuildApplication.objects.all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return GuildApplicationCreateSerializer
        elif self.action in ['list', 'retrieve']:
            return GuildApplicationListSerializer
        return GuildApplicationDetailSerializer

    def perform_create(self, serializer):
        serializer.save()

    def approve(self, request, pk=None):
        application = self.get_object()
        if request.user not in application.guild.owner.all() and not request.user.is_superuser:
            return Response({'detail': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)
        application.approve(request.user)
        return Response({'detail': 'Application approved.'})

    def reject(self, request, pk=None):
        application = self.get_object()
        if request.user not in application.guild.owner.all() and not request.user.is_superuser:
            return Response({'detail': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)
        application.reject(request.user)
        return Response({'detail': 'Application rejected.'})
