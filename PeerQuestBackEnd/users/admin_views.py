from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.utils import timezone
from django.contrib.auth import get_user_model
from .admin_serializers import AdminUserSerializer
from .validators import PROFANITY_LIST, normalize_username
from .models import UserReport
from .serializers import UserReportSerializer

User = get_user_model()

import logging

class AdminUserListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
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
                try:
                    username = user.get('username', '')
                    if username is None:
                        username = ''
                    normalized = normalize_username(username)
                    user['flagged'] = any(word in normalized for word in PROFANITY_LIST)
                except Exception as e:
                    user['flagged'] = False
                    logging.error(f"Error normalizing username for user {user.get('id', 'unknown')}: {e}")
            return Response(data)
        except Exception as e:
            logging.error(f"AdminUserListView GET error: {e}")
            print(f"AdminUserListView GET error: {e}")
            return Response({'detail': 'Internal server error in admin user list.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# --- Safe AdminUserSerializer ---
from rest_framework import serializers

class AdminUserSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    is_active = serializers.BooleanField(default=True)
    date_joined = serializers.DateTimeField(default=None)
    is_banned = serializers.BooleanField(default=False)
    ban_reason = serializers.CharField(default='', allow_blank=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_active', 'date_joined', 'is_banned', 'ban_reason']

    def get_username(self, obj):
        return getattr(obj, 'username', '') or ''

    def get_email(self, obj):
        return getattr(obj, 'email', '') or ''

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

class AdminReportsListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Only staff or superusers can access
        if not (request.user.is_superuser or request.user.is_staff):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        # Get all user reports
        user_reports = UserReport.objects.select_related('reported_user', 'reporter', 'resolved_by').order_by('-created_at')
        # Get all quest reports
        from .models import QuestReport, GuildReport
        quest_reports = QuestReport.objects.select_related('reported_quest', 'reporter', 'resolved_by').order_by('-created_at')
        # Get all guild reports
        guild_reports = GuildReport.objects.select_related('reported_guild', 'reporter', 'resolved_by').order_by('-created_at')

        # Filter by resolved status if specified
        resolved_filter = request.query_params.get('resolved')
        if resolved_filter is not None:
            if resolved_filter.lower() in ['true', '1']:
                user_reports = user_reports.filter(resolved=True)
                quest_reports = quest_reports.filter(resolved=True)
                guild_reports = guild_reports.filter(resolved=True)
            elif resolved_filter.lower() in ['false', '0']:
                user_reports = user_reports.filter(resolved=False)
                quest_reports = quest_reports.filter(resolved=False)
                guild_reports = guild_reports.filter(resolved=False)

        # Serialize user reports
        reports_data = []
        for report in user_reports:
            reports_data.append({
                'id': report.id,
                'type': 'user',
                'reported_user': {
                    'id': str(report.reported_user.id),
                    'username': report.reported_user.username,
                    'email': report.reported_user.email,
                },
                'reporter': {
                    'id': str(report.reporter.id),
                    'username': report.reporter.username,
                    'email': report.reporter.email,
                },
                'reason': report.reason,
                'message': report.message,
                'created_at': report.created_at.isoformat(),
                'resolved': report.resolved,
                'resolved_by': {
                    'id': str(report.resolved_by.id),
                    'username': report.resolved_by.username,
                    'email': report.resolved_by.email,
                } if report.resolved_by else None,
                'resolved_at': report.resolved_at.isoformat() if report.resolved_at else None,
            })

        # Serialize quest reports
        for report in quest_reports:
            reports_data.append({
                'id': report.id,
                'type': 'quest',
                'reported_quest': str(report.reported_quest.id),
                'reported_quest_title': getattr(report.reported_quest, 'title', ''),
                'reporter': {
                    'id': str(report.reporter.id),
                    'username': report.reporter.username,
                    'email': report.reporter.email,
                },
                'reason': report.reason,
                'message': report.message,
                'created_at': report.created_at.isoformat(),
                'resolved': report.resolved,
                'resolved_by': {
                    'id': str(report.resolved_by.id),
                    'username': report.resolved_by.username,
                    'email': report.resolved_by.email,
                } if report.resolved_by else None,
                'resolved_at': report.resolved_at.isoformat() if report.resolved_at else None,
            })

        # Serialize guild reports
        for report in guild_reports:
            reports_data.append({
                'id': report.id,
                'type': 'guild',
                'report_type': 'guild',
                'reported_guild': {
                    'guild_id': str(report.reported_guild.guild_id),
                    'name': report.reported_guild.name,
                },
                'reported_guild_name': report.reported_guild.name,
                'reporter': {
                    'id': str(report.reporter.id),
                    'username': report.reporter.username,
                    'email': report.reporter.email,
                },
                'reason': report.reason,
                'message': report.message,
                'created_at': report.created_at.isoformat(),
                'resolved': report.resolved,
                'resolved_by': {
                    'id': str(report.resolved_by.id),
                    'username': report.resolved_by.username,
                    'email': report.resolved_by.email,
                } if report.resolved_by else None,
                'resolved_at': report.resolved_at.isoformat() if report.resolved_at else None,
            })

        # Sort all reports by created_at descending
        reports_data.sort(key=lambda r: r['created_at'], reverse=True)
        return Response(reports_data)

    def patch(self, request, report_id=None):
        # Only staff or superusers can resolve reports
        if not (request.user.is_superuser or request.user.is_staff):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        
        if not report_id:
            return Response({'detail': 'Report ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        from .models import QuestReport
        
        # Try to find the report in both UserReport and QuestReport models
        report = None
        report_type = None
        
        try:
            report = UserReport.objects.get(id=report_id)
            report_type = 'user'
        except UserReport.DoesNotExist:
            try:
                report = QuestReport.objects.get(id=report_id)
                report_type = 'quest'
            except QuestReport.DoesNotExist:
                return Response({'detail': 'Report not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Mark as resolved
        report.resolved = True
        report.resolved_by = request.user
        report.resolved_at = timezone.now()
        report.save()
        
        return Response({'detail': f'{report_type.title()} report resolved successfully'})

class AdminGuildReportsListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Only staff or superusers can access
        if not (request.user.is_superuser or request.user.is_staff):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        # Get all guild reports
        from .models import GuildReport
        guild_reports = GuildReport.objects.select_related('reported_guild', 'reporter', 'resolved_by').order_by('-created_at')

        # Filter by resolved status if specified
        resolved_filter = request.query_params.get('resolved')
        if resolved_filter is not None:
            if resolved_filter.lower() in ['true', '1']:
                guild_reports = guild_reports.filter(resolved=True)
            elif resolved_filter.lower() in ['false', '0']:
                guild_reports = guild_reports.filter(resolved=False)

        # Serialize guild reports
        reports_data = []
        for report in guild_reports:
            reports_data.append({
                'id': report.id,
                'type': 'guild',
                'report_type': 'guild',
                'reported_guild': {
                    'guild_id': str(report.reported_guild.guild_id),
                    'name': report.reported_guild.name,
                },
                'reported_guild_name': report.reported_guild.name,
                'reporter': {
                    'id': str(report.reporter.id),
                    'username': report.reporter.username,
                    'email': report.reporter.email,
                },
                'reason': report.reason,
                'message': report.message,
                'created_at': report.created_at.isoformat(),
                'resolved': report.resolved,
                'resolved_by': {
                    'id': str(report.resolved_by.id),
                    'username': report.resolved_by.username,
                    'email': report.resolved_by.email,
                } if report.resolved_by else None,
                'resolved_at': report.resolved_at.isoformat() if report.resolved_at else None,
            })

        return Response(reports_data)
    
    def patch(self, request, report_id=None):
        # Only staff or superusers can resolve guild reports
        if not (request.user.is_superuser or request.user.is_staff):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        if not report_id:
            return Response({'detail': 'Report ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        from .models import GuildReport
        try:
            report = GuildReport.objects.get(id=report_id)
        except GuildReport.DoesNotExist:
            return Response({'detail': 'Report not found'}, status=status.HTTP_404_NOT_FOUND)
        # Mark as resolved
        report.resolved = True
        report.resolved_by = request.user
        from django.utils import timezone
        report.resolved_at = timezone.now()
        report.save()
        return Response({'detail': 'Guild report resolved successfully'})
