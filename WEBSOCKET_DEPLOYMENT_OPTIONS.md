# WebSocket Implementation with Deployment Options

## 1. Install Dependencies

```bash
# For Daphne (Django's official ASGI server)
pip install channels daphne redis channels-redis

# Alternative: Uvicorn (faster, more modern)
# pip install channels uvicorn[standard] redis channels-redis
```

## 2. Update Django Settings

```python
# core/settings.py
INSTALLED_APPS = [
    'daphne',  # Add this FIRST in the list
    'django.contrib.admin',
    'django.contrib.auth',
    # ... your existing apps
    'channels',
    'applications',
    'quests',
]

# ASGI configuration
ASGI_APPLICATION = 'core.asgi.application'

# Channel layers (Redis for production, In-memory for development)
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [('127.0.0.1', 6379)],
        },
    },
}

# For development without Redis, use in-memory channel layer:
# CHANNEL_LAYERS = {
#     'default': {
#         'BACKEND': 'channels.layers.InMemoryChannelLayer'
#     }
# }
```

## 3. ASGI Configuration

```python
# core/asgi.py
import os
import django
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from channels.security.websocket import AllowedHostsOriginValidator
from applications.routing import websocket_urlpatterns

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            URLRouter(websocket_urlpatterns)
        )
    ),
})
```

## 4. WebSocket Consumer

```python
# applications/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model

User = get_user_model()

class ApplicationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        
        if self.user.is_anonymous:
            await self.close()
            return
        
        # Join user-specific group for personal notifications
        self.user_group = f"user_{self.user.id}"
        await self.channel_layer.group_add(self.user_group, self.channel_name)
        
        # Join quest-specific groups for quests the user created
        user_quest_ids = await self.get_user_created_quests()
        self.quest_groups = []
        for quest_id in user_quest_ids:
            quest_group = f"quest_{quest_id}_creator"
            self.quest_groups.append(quest_group)
            await self.channel_layer.group_add(quest_group, self.channel_name)
        
        await self.accept()
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Real-time updates enabled'
        }))
    
    async def disconnect(self, close_code):
        # Leave user group
        await self.channel_layer.group_discard(self.user_group, self.channel_name)
        
        # Leave quest groups
        for quest_group in getattr(self, 'quest_groups', []):
            await self.channel_layer.group_discard(quest_group, self.channel_name)
    
    # Handle different message types
    async def application_status_update(self, event):
        """Send application status updates to applicant"""
        await self.send(text_data=json.dumps({
            'type': 'application_status_update',
            'data': event['data']
        }))
    
    async def new_application_notification(self, event):
        """Send new application notifications to quest creator"""
        await self.send(text_data=json.dumps({
            'type': 'new_application',
            'data': event['data']
        }))
    
    async def quest_status_update(self, event):
        """Send quest status updates"""
        await self.send(text_data=json.dumps({
            'type': 'quest_status_update',
            'data': event['data']
        }))
    
    async def application_count_update(self, event):
        """Send updated application count for quest cards"""
        await self.send(text_data=json.dumps({
            'type': 'application_count_update',
            'data': event['data']
        }))
    
    @database_sync_to_async
    def get_user_created_quests(self):
        """Get list of quest IDs created by this user"""
        from quests.models import Quest
        return list(Quest.objects.filter(creator=self.user).values_list('id', flat=True))
```

## 5. WebSocket Routing

```python
# applications/routing.py
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/applications/$', consumers.ApplicationConsumer.as_asgi()),
]
```

## 6. Signal Handlers for Real-time Updates

```python
# applications/signals.py
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Application

channel_layer = get_channel_layer()

@receiver(post_save, sender=Application)
def application_updated(sender, instance, created, **kwargs):
    """Send real-time updates when application status changes"""
    
    if created:
        # New application - notify quest creator
        async_to_sync(channel_layer.group_send)(
            f"quest_{instance.quest.id}_creator",
            {
                "type": "new_application_notification",
                "data": {
                    "application_id": instance.id,
                    "applicant_username": instance.applicant.username,
                    "quest_id": instance.quest.id,
                    "quest_title": instance.quest.title,
                    "quest_slug": instance.quest.slug,
                    "status": instance.status,
                    "created_at": instance.created_at.isoformat()
                }
            }
        )
        
        # Update application count for all users viewing this quest
        from .models import Application
        total_applications = Application.objects.filter(quest=instance.quest).count()
        async_to_sync(channel_layer.group_send)(
            f"quest_{instance.quest.id}_viewers",
            {
                "type": "application_count_update",
                "data": {
                    "quest_id": instance.quest.id,
                    "quest_slug": instance.quest.slug,
                    "application_count": total_applications
                }
            }
        )
    
    else:
        # Application status updated - notify applicant
        if instance.status in ['approved', 'rejected', 'kicked']:
            async_to_sync(channel_layer.group_send)(
                f"user_{instance.applicant.id}",
                {
                    "type": "application_status_update",
                    "data": {
                        "application_id": instance.id,
                        "quest_id": instance.quest.id,
                        "quest_title": instance.quest.title,
                        "quest_slug": instance.quest.slug,
                        "status": instance.status,
                        "updated_at": instance.updated_at.isoformat()
                    }
                }
            )

# Also add signal for Quest status updates
from quests.models import Quest

@receiver(post_save, sender=Quest)
def quest_status_updated(sender, instance, created, **kwargs):
    """Send real-time updates when quest status changes"""
    if not created:  # Only for updates, not new quests
        # Notify all participants and applicants
        async_to_sync(channel_layer.group_send)(
            f"quest_{instance.id}_participants",
            {
                "type": "quest_status_update",
                "data": {
                    "quest_id": instance.id,
                    "quest_slug": instance.slug,
                    "quest_title": instance.title,
                    "status": instance.status,
                    "updated_at": instance.updated_at.isoformat()
                }
            }
        )
```

## 7. Frontend WebSocket Hook

```typescript
# Frontend implementation will go in the React components
```

## Deployment Options:

### Option 1: Daphne (Django Official)
```bash
# Development
daphne -p 8001 core.asgi:application

# Production with systemd service
# /etc/systemd/system/daphne.service
```

### Option 2: Uvicorn (Faster, Modern)
```bash
# Development  
uvicorn core.asgi:application --host 127.0.0.1 --port 8001 --reload

# Production
uvicorn core.asgi:application --host 0.0.0.0 --port 8001 --workers 4
```

### Option 3: Gunicorn + Uvicorn Workers
```bash
# Production
gunicorn core.asgi:application -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8001
```

## Which should you use?

- **Development**: Either Daphne or Uvicorn with `--reload`
- **Production**: Uvicorn or Gunicorn+Uvicorn (faster than Daphne)
- **Simple deployment**: Daphne (easier Django integration)

Would you like me to implement this step by step, starting with the basic setup?
