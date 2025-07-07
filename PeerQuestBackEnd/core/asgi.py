"""
ASGI config for core project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os
import django
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator # Import this
from core.jwt_middleware import JWTAuthMiddleware  # Import your JWT middleware

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

# Get Django's ASGI application for HTTP requests
from django.core.asgi import get_asgi_application
django_asgi_app = get_asgi_application()

# Import websocket routing after Django setup ensures Django's app registry is ready
import messaging.routing

application = ProtocolTypeRouter({
    "http": django_asgi_app,  # Handles traditional HTTP requests
    "websocket": AllowedHostsOriginValidator( # Protects against Cross-Site WebSocket Hijacking
        JWTAuthMiddleware(  # Handles WebSocket connections with JWT authentication
            URLRouter(
                messaging.routing.websocket_urlpatterns  # Your websocket URL patterns
            )
        )
    ),
})