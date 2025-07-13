"""
ASGI config for core project.
"""

import os
import django
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from core.jwt_middleware import JWTAuthMiddleware  # Your custom JWT WebSocket auth middleware

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.core.asgi import get_asgi_application
django_asgi_app = get_asgi_application()

# Import WebSocket routing
import messaging.routing
import guilds.routing  # ✅ NEW

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AllowedHostsOriginValidator(
        JWTAuthMiddleware(
            URLRouter(
                messaging.routing.websocket_urlpatterns +  # ✅ Messaging WS routes
                guilds.routing.websocket_urlpatterns        # ✅ Guild WS routes
            )
        )
    ),
})
