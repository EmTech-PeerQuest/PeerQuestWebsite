from urllib.parse import parse_qs
from channels.middleware import BaseMiddleware
import logging
from asgiref.sync import sync_to_async

logger = logging.getLogger("django")

class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        from django.contrib.auth.models import AnonymousUser
        from rest_framework_simplejwt.tokens import UntypedToken
        from rest_framework_simplejwt.authentication import JWTAuthentication
        from django.db import close_old_connections

        query_string = scope.get('query_string', b'').decode()
        token = parse_qs(query_string).get('token')
        logger.info(f"WebSocket token received: {token[0][:8]+'...' if token else None}")
        
        scope['user'] = AnonymousUser()
        if token:
            token = token[0]
            try:
                validated_token = UntypedToken(token)
                user = await sync_to_async(JWTAuthentication().get_user)(validated_token)
                logger.info(f"WebSocket user authenticated: {user} (is_authenticated={user.is_authenticated})")
                scope['user'] = user
            except Exception as e:
                logger.warning(f"WebSocket JWT authentication failed: {e}")
        
        close_old_connections()
        return await super().__call__(scope, receive, send)
