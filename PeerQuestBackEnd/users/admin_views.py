from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.utils import timezone
from django.contrib.auth import get_user_model
from .admin_serializers import AdminUserSerializer
from .validators import PROFANITY_LIST, normalize_username

User = get_user_model()

class AdminUserListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Only staff or superusers can access
        if not (request.user.is_superuser or request.user.is_staff):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        search = request.query_params.get('search', '').strip()
        # Only regular users (not staff or superusers)
        users = User.objects.filter(is_superuser=False, is_staff=False)
        if search:
            users = users.filter(username__icontains=search)
        data = AdminUserSerializer(users, many=True).data
        # Flag inappropriate usernames
        for user in data:
            normalized = normalize_username(user['username'])
            user['flagged'] = any(word in normalized for word in PROFANITY_LIST)
        return Response(data)

class AdminUserBanView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        # Only staff or superusers can ban
        if not (request.user.is_superuser or request.user.is_staff):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        # Prevent banning staff or superusers
        if user.is_superuser or user.is_staff:
            return Response({'detail': 'Cannot ban staff or superusers.'}, status=status.HTTP_400_BAD_REQUEST)
        reason = request.data.get('reason', '')
        expires_at = request.data.get('expires_at')
        if not reason:
            return Response({'detail': 'Ban reason is required.'}, status=status.HTTP_400_BAD_REQUEST)
        # Parse expires_at if present
        if expires_at:
            from django.utils.dateparse import parse_datetime
            dt = parse_datetime(expires_at)
            if not dt:
                return Response({'detail': 'Invalid expires_at datetime format.'}, status=status.HTTP_400_BAD_REQUEST)
            user.is_banned = True
            user.ban_reason = reason
            user.ban_expires_at = dt
        else:
            user.is_banned = True
            user.ban_reason = reason
            user.ban_expires_at = None
        user.save()
        return Response({'detail': 'User banned.'})

class AdminUserUnbanView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        if not request.user.is_superuser:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        user.is_banned = False
        user.ban_reason = None
        user.ban_expires_at = None
        user.save()
        return Response({'detail': 'User unbanned.'})

class AdminUserDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, user_id):
        if not request.user.is_superuser:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        user.delete()
        return Response({'detail': 'User deleted.'})
