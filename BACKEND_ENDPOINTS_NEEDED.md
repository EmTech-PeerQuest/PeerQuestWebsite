# Backend API Endpoints Required for Admin Panel & Notification System

## Missing Backend Endpoints

Based on the frontend implementation, the following backend endpoints need to be created or verified:

### 1. Notification System Endpoints

```python
# Django URLs needed (add to your urls.py)
urlpatterns = [
    # Notification endpoints
    path('api/notifications/', NotificationViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('api/notifications/<int:pk>/mark-read/', NotificationViewSet.as_view({'post': 'mark_read'})),
    path('api/notifications/unread-count/', NotificationViewSet.as_view({'get': 'unread_count'})),
]
```

#### Required Django Model (notifications/models.py):
```python
from django.db import models
from django.contrib.auth.models import User
from guilds.models import Guild

class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('guild_application_approved', 'Guild Application Approved'),
        ('guild_application_rejected', 'Guild Application Rejected'),
        ('guild_warned', 'Guild Warned'),
        ('guild_disabled', 'Guild Disabled'),
        ('guild_re_enabled', 'Guild Re-enabled'),
        ('warning_reset', 'Warning Reset'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    related_guild = models.ForeignKey(Guild, on_delete=models.CASCADE, null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
```

#### Required Django ViewSet (notifications/views.py):
```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Notification
from .serializers import NotificationSerializer

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'success': True})
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        count = self.get_queryset().filter(is_read=False).count()
        return Response({'count': count})
```

### 2. Guild Report System Endpoints

```python
# Add to urls.py
urlpatterns = [
    # Guild report endpoints
    path('api/users/guild-report/', GuildReportCreateView.as_view()),
    path('api/users/admin/guild-reports/', AdminGuildReportListView.as_view()),
]
```

#### Required Django Model (reports/models.py):
```python
class GuildReport(models.Model):
    REASON_CHOICES = [
        ('inappropriate_content', 'Inappropriate Content'),
        ('spam', 'Spam'),
        ('harassment', 'Harassment'),
        ('fake_information', 'Fake Information'),
        ('scam', 'Scam/Fraud'),
        ('other', 'Other'),
    ]
    
    reported_guild = models.ForeignKey(Guild, on_delete=models.CASCADE)
    reporter = models.ForeignKey(User, on_delete=models.CASCADE)
    reason = models.CharField(max_length=50, choices=REASON_CHOICES)
    message = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved = models.BooleanField(default=False)
    resolved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='resolved_guild_reports')
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ['reported_guild', 'reporter']  # One report per user per guild
```

### 3. Guild Warning System Endpoints

```python
# Add to guilds/urls.py
urlpatterns = [
    # Guild warning endpoints
    path('api/guilds/<str:guild_id>/warnings/', GuildWarningListView.as_view()),
    path('api/guilds/<str:guild_id>/warn/', WarnGuildView.as_view()),
    path('api/guilds/<str:guild_id>/reset-warnings/', ResetWarningsView.as_view()),
    path('api/guilds/<str:guild_id>/enable/', EnableGuildView.as_view()),
]
```

#### Required Django Views (guilds/views.py):
```python
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Guild, GuildWarning

class ResetWarningsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def post(self, request, guild_id):
        guild = get_object_or_404(Guild, guild_id=guild_id)
        
        # Reset warning count and clear active warnings
        guild.warning_count = 0
        guild.active_warnings.all().delete()
        guild.save()
        
        return Response({
            'success': True,
            'message': f'Warnings reset for guild {guild.name}'
        })

class EnableGuildView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def post(self, request, guild_id):
        guild = get_object_or_404(Guild, guild_id=guild_id)
        
        # Re-enable guild and reset warnings
        guild.is_disabled = False
        guild.warning_count = 0
        guild.disabled_at = None
        guild.disabled_by = None
        guild.disable_reason = None
        guild.active_warnings.all().delete()
        guild.save()
        
        return Response({
            'success': True,
            'message': f'Guild {guild.name} has been re-enabled'
        })
```

## Quick Backend Setup Script

Create this script to quickly add the missing endpoints:

```bash
# Create the files
mkdir -p notifications reports
touch notifications/__init__.py
touch notifications/models.py
touch notifications/views.py
touch notifications/serializers.py
touch notifications/urls.py
touch reports/models.py
touch reports/views.py
touch reports/serializers.py

# Add to settings.py INSTALLED_APPS
echo "Add 'notifications' and 'reports' to INSTALLED_APPS in settings.py"

# Run migrations
python manage.py makemigrations notifications
python manage.py makemigrations reports
python manage.py migrate
```

## Testing the Endpoints

Use the BackendTestComponent created in the frontend to test which endpoints are working:

1. Add the BackendTestComponent to a page
2. Run the tests to see which endpoints return 404/405 errors
3. Implement the missing endpoints in Django
4. Test again until all endpoints return 200 status

## Current Issues Summary:

1. **Guild Reports not showing**: Missing `/api/users/admin/guild-reports/` endpoint
2. **Notifications not working**: Missing notification system endpoints
3. **Reset warnings not working**: Endpoint might be `/reset_warnings/` instead of `/reset-warnings/`
4. **Warning details working**: The GuildWarningModal is already implemented and should work if backend endpoints exist

The frontend code is ready - we just need the corresponding Django backend endpoints!
