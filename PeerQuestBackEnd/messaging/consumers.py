import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.utils import timezone
from messaging.models import Message
from xp.utils import award_xp
from django.contrib.auth import get_user_model
import logging

logger = logging.getLogger("django")

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        try:
            self.room_name = self.scope['url_route']['kwargs']['room_name']
            self.room_group_name = f"chat_{self.room_name}"

            user = self.scope.get('user')
            if user and user.is_authenticated:
                await self.channel_layer.group_add(
                    self.room_group_name,
                    self.channel_name
                )
                await self.accept()
                logger.info(f"WebSocket accepted for user {user} in room {self.room_name}")
            else:
                logger.warning("WebSocket rejected: user not authenticated")
                await self.close()
        except Exception as e:
            logger.error(f"WebSocket connect error: {e}")
            await self.close()

    async def disconnect(self, close_code):
        try:
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
            logger.info(f"WebSocket disconnected from room {self.room_name}")
        except Exception as e:
            logger.error(f"WebSocket disconnect error: {e}")

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            sender_id = data.get('sender_id') or data.get('sender')
            recipient_id = data.get('recipient_id')
            content = data.get('content') or data.get('message')

            user = self.scope.get('user')
            if user and user.is_authenticated:
                sender_id = user.id

            if sender_id and recipient_id and content:
                message = Message.objects.create(
                    sender_id=sender_id,
                    recipient_id=recipient_id,
                    content=content,
                    sent_at=timezone.now()
                )
                User = get_user_model()
                try:
                    sender = User.objects.get(id=sender_id)
                    await award_xp(sender, amount=10, reason='Chat message')
                except Exception as e:
                    logger.warning(f"XP award failed: {e}")
                sent_at = str(message.sent_at)
            else:
                sent_at = str(timezone.now())

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': {
                        'sender_id': sender_id,
                        'recipient_id': recipient_id,
                        'content': content,
                        'sent_at': sent_at,
                    }
                }
            )
        except Exception as e:
            logger.error(f"WebSocket receive error: {e}")

    async def chat_message(self, event):
        try:
            await self.send(text_data=json.dumps(event['message']))
        except Exception as e:
            logger.error(f"WebSocket send error: {e}")