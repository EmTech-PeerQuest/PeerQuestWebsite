# WebSocket Implementation for Real-time Applications

## Backend (Django Channels)

### 1. Install Dependencies
```bash
pip install channels redis channels-redis
```

### 2. Configure WebSocket Settings
```python
# core/settings.py
INSTALLED_APPS = [
    # ... existing apps
    'channels',
]

ASGI_APPLICATION = 'core.asgi.application'

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [('127.0.0.1', 6379)],
        },
    },
}
```

### 3. WebSocket Consumer
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
        
        # Join user-specific group
        self.user_group = f"user_{self.user.id}"
        await self.channel_layer.group_add(self.user_group, self.channel_name)
        
        # Join quest-specific groups for quests user created
        user_quests = await self.get_user_quests()
        for quest_id in user_quests:
            quest_group = f"quest_{quest_id}"
            await self.channel_layer.group_add(quest_group, self.channel_name)
        
        await self.accept()
    
    async def disconnect(self, close_code):
        # Leave groups
        await self.channel_layer.group_discard(self.user_group, self.channel_name)
        user_quests = await self.get_user_quests()
        for quest_id in user_quests:
            quest_group = f"quest_{quest_id}"
            await self.channel_layer.group_discard(quest_group, self.channel_name)
    
    async def receive(self, text_data):
        # Handle incoming WebSocket messages if needed
        pass
    
    # Send application status update
    async def application_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'application_update',
            'data': event['data']
        }))
    
    # Send new application notification
    async def new_application(self, event):
        await self.send(text_data=json.dumps({
            'type': 'new_application', 
            'data': event['data']
        }))
    
    @database_sync_to_async
    def get_user_quests(self):
        from quests.models import Quest
        return list(Quest.objects.filter(creator=self.user).values_list('id', flat=True))
```

### 4. WebSocket Routing
```python
# core/routing.py
from django.urls import re_path
from applications import consumers

websocket_urlpatterns = [
    re_path(r'ws/applications/$', consumers.ApplicationConsumer.as_asgi()),
]
```

### 5. ASGI Configuration
```python
# core/asgi.py
import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from . import routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(routing.websocket_urlpatterns)
    ),
})
```

### 6. Signal Handlers for Real-time Updates
```python
# applications/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Application

channel_layer = get_channel_layer()

@receiver(post_save, sender=Application)
def application_status_changed(sender, instance, created, **kwargs):
    if created:
        # New application created
        async_to_sync(channel_layer.group_send)(
            f"quest_{instance.quest.id}",
            {
                "type": "new_application",
                "data": {
                    "application_id": instance.id,
                    "applicant": instance.applicant.username,
                    "quest_title": instance.quest.title,
                    "status": instance.status
                }
            }
        )
    else:
        # Application status updated
        async_to_sync(channel_layer.group_send)(
            f"user_{instance.applicant.id}",
            {
                "type": "application_update", 
                "data": {
                    "application_id": instance.id,
                    "quest_title": instance.quest.title,
                    "status": instance.status,
                    "updated_at": instance.updated_at.isoformat()
                }
            }
        )
```

## Frontend (React WebSocket)

### 1. WebSocket Hook
```typescript
// hooks/useWebSocket.ts
import { useEffect, useRef, useState } from 'react';

export const useApplicationWebSocket = (onMessage: (data: any) => void) => {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const wsUrl = `ws://localhost:8000/ws/applications/?token=${token}`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };

    ws.current.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.current?.close();
    };
  }, [onMessage]);

  return isConnected;
};
```

### 2. Real-time Application Updates
```typescript
// components/ApplicationManager.tsx
import { useApplicationWebSocket } from '@/hooks/useWebSocket';

export const ApplicationManager = () => {
  const [applications, setApplications] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const handleWebSocketMessage = useCallback((data) => {
    switch (data.type) {
      case 'new_application':
        setNotifications(prev => [...prev, {
          id: Date.now(),
          type: 'info',
          message: `New application from ${data.data.applicant} for ${data.data.quest_title}`
        }]);
        // Refresh applications list
        fetchApplications();
        break;
        
      case 'application_update':
        setNotifications(prev => [...prev, {
          id: Date.now(),
          type: data.data.status === 'approved' ? 'success' : 'warning',
          message: `Your application for ${data.data.quest_title} was ${data.data.status}`
        }]);
        // Update specific application in state
        setApplications(prev => prev.map(app => 
          app.id === data.data.application_id 
            ? { ...app, status: data.data.status }
            : app
        ));
        break;
    }
  }, []);

  const isConnected = useApplicationWebSocket(handleWebSocketMessage);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span>Real-time updates {isConnected ? 'enabled' : 'disabled'}</span>
      </div>
      
      {/* Notifications */}
      {notifications.map(notification => (
        <div key={notification.id} className="alert">
          {notification.message}
        </div>
      ))}
      
      {/* Applications list */}
      {/* ... */}
    </div>
  );
};
```

## Benefits:
1. **Instant feedback** on application status changes
2. **Real-time notifications** for quest creators
3. **Better UX** with live updates
4. **Reduced server load** (no polling needed)

## Alternative (Simpler):
If WebSockets seem complex, you could use **Server-Sent Events (SSE)** or **periodic polling** for now, then upgrade to WebSockets later.

Would you like me to implement this WebSocket system for your application?
