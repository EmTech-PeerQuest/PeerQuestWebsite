import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.utils import timezone
from messaging.models import Message
from xp.utils import award_xp
from django.contrib.auth import get_user_model

# PeerQuestBackEnd/messaging/consumers.py
class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Use room_name from the URL for per-room chat
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f"chat_{self.room_name}"

        # Optionally, check authentication (JWT in query string or headers)
        user = self.scope.get('user')
        if user and user.is_authenticated:
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            await self.accept()
        else:
            # Optionally, close connection if not authenticated
            await self.close()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        sender_id = data.get('sender_id') or data.get('sender')
        recipient_id = data.get('recipient_id')
        content = data.get('content') or data.get('message')

        # Optionally, get user from scope for extra security
        user = self.scope.get('user')
        if user and user.is_authenticated:
            sender_id = user.id

        # Save message to DB if all info is present
        if sender_id and recipient_id and content:
            message = Message.objects.create(
                sender_id=sender_id,
                recipient_id=recipient_id,
                content=content,
                sent_at=timezone.now()
            )
            # Award XP (imported from xp/utils.py)
            User = get_user_model()
            try:
                sender = User.objects.get(id=sender_id)
                await award_xp(sender, amount=10, reason='Chat message')
            except Exception:
                pass
            sent_at = str(message.sent_at)
        else:
            sent_at = str(timezone.now())

        # Broadcast to everyone in the room
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

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event['message']))