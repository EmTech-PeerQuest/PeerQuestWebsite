from urllib.parse import parse_qs
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.authentication import JWTAuthentication
from asgiref.sync import sync_to_async
from django.db import close_old_connections
import logging

logger = logging.getLogger("django")


class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode()
        token_list = parse_qs(query_string).get("token", [])
        token = token_list[0] if token_list else None

        if token:
            try:
                jwt_auth = JWTAuthentication()
                validated_token = await sync_to_async(jwt_auth.get_validated_token)(token)
                user = await sync_to_async(jwt_auth.get_user)(validated_token)
                scope["user"] = user
                logger.info(f"✅ WebSocket authenticated: {user} (authenticated={user.is_authenticated})")
            except Exception as e:
                logger.warning(f"❌ JWT WebSocket auth failed: {e}")
                close_old_connections()

                # Close the connection properly
                try:
                    await send({
                        "type": "websocket.close",
                        "code": 4001
                    })
                except Exception as send_error:
                    logger.error(f"Failed to send websocket.close: {send_error}")
                return
        else:
            logger.warning("❌ No JWT token provided")
            try:
                await send({
                    "type": "websocket.close",
                    "code": 4002
                })
            except Exception as send_error:
                logger.error(f"Failed to send websocket.close: {send_error}")
            return

        close_old_connections()
        return await super().__call__(scope, receive, send)
