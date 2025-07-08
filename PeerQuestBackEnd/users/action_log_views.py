from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import ActionLog
from django.contrib.auth import get_user_model

User = get_user_model()

class ActionLogListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not (request.user.is_superuser or request.user.is_staff):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        logs = ActionLog.objects.select_related('admin', 'target_user').order_by('-created_at')[:200]
        data = [
            {
                'id': log.id,
                'action': log.action,
                'admin': log.admin.username if log.admin else None,
                'target_user': log.target_user.username if log.target_user else None,
                'details': log.details,
                'created_at': log.created_at,
            }
            for log in logs
        ]
        return Response(data)
