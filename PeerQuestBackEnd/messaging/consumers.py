import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.utils import timezone
from messaging.models import Message
from xp.utils import award_xp
from django.contrib.auth import get_user_model
from channels.db import database_sync_to_async
import logging

logger = logging.getLogger("django")

# This function creates a message in the database asynchronously
# It uses the database_sync_to_async decorator to ensure it runs in the database thread
# This is necessary because Django's ORM is not thread-safe and must be used in the main thread
# of the Django application, which is typically the database thread in a Channels application.
@database_sync_to_async
def create_message(sender_id, recipient_id, content):
    from messaging.models import Message
    return Message.objects.create(
        sender_id=sender_id,
        recipient_id=recipient_id,
        content=content,
    )

@database_sync_to_async
def get_user_by_id(user_id):
    User = get_user_model()
    return User.objects.get(id=user_id)

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        try:
            self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
            self.room_group_name = f"chat_{self.conversation_id}"

            user = self.scope.get('user')
            logger.info(f"[CONNECT] User: {user} | Authenticated: {user.is_authenticated if user else 'None'} | Room: {self.room_name}")

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
            logger.info(f"[RECEIVE] Raw text: {text_data}")
            data = json.loads(text_data)

            sender_id = data.get('sender_id') or data.get('sender')
            recipient_id = data.get('recipient_id')
            content = data.get('content') or data.get('message')

            user = self.scope.get('user')
            if user and user.is_authenticated:
                sender_id = user.id

            logger.info(f"[RECEIVE] Parsed data | Sender: {sender_id}, Recipient: {recipient_id}, Content: {content}")

            if sender_id and recipient_id and content:
                message = await create_message(sender_id, recipient_id, content)
                logger.info(f"[DB] Message saved with ID: {message.id}")

                try:
                    sender = await get_user_by_id(sender_id)
                    await award_xp(sender, amount=10, reason='Chat message')
                except Exception as e:
                    logger.warning(f"[XP] XP award failed: {e}")

                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'chat_message',
                        'message': {
                            'id': str(message.id),
                            'conversation_id': str(self.room_name),
                            'sender': {
                                'id': str(sender.id),
                                'username': sender.username,
                                'avatar': sender.profile.avatar.url if hasattr(sender, "profile") and sender.profile.avatar else None
                            },
                            'recipient_id': str(recipient_id),
                            'content': content,
                            'timestamp': str(message.timestamp),
                        }
                    }
                )


                logger.info(f"[BROADCAST] Message sent to room group: {self.room_group_name}")
            else:
                logger.warning("[RECEIVE] Missing fields, message not sent")

        except Exception as e:
            logger.error(f"[RECEIVE ERROR] {e}")


    async def chat_message(self, event):
        try:
            logger.info(f"[SEND] Broadcasting message: {event['message']}")
            await self.send(text_data=json.dumps(event['message']))
        except Exception as e:
            logger.error(f"[SEND ERROR] {e}")
