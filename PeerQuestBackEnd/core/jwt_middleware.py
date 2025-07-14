from urllib.parse import parse_qs
from channels.middleware import BaseMiddleware
import logging
from asgiref.sync import sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.db import close_old_connections

logger = logging.getLogger("django")

class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        query_string = scope.get('query_string', b'').decode()
        token = parse_qs(query_string).get('token')
        token = token[0] if token else None

        if token:
            try:
                jwt_auth = JWTAuthentication()
                validated_token = await sync_to_async(jwt_auth.get_validated_token)(token)
                user = await sync_to_async(jwt_auth.get_user)(validated_token)
                logger.info(f"✅ WebSocket user authenticated: {user} (is_authenticated={user.is_authenticated})")
                scope['user'] = user
            except Exception as e:
                logger.warning(f"❌ WebSocket JWT authentication failed: {e}")
                import traceback
                logger.debug(traceback.format_exc())

                await send({
                    'type': 'websocket.close',
                    'code': 4001
                })
                return
        else:
            logger.warning("❌ No JWT token provided in WebSocket URL")
            await send({
                'type': 'websocket.close',
                'code': 4002
            })
            return

        close_old_connections()
        return await super().__call__(scope, receive, send)
