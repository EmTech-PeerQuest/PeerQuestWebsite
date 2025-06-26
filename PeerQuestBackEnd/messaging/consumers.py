import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.utils import timezone
from messaging.models import Message
from xp.utils import award_xp
from django.contrib.auth import get_user_model

# PeerQuestBackEnd/messaging/consumers.py
class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_group_name = "global_chat"  # Can be dynamic later
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        sender_id = data['sender_id']
        recipient_id = data['recipient_id']
        content = data['content']

        # Save message to DB
        message = Message.objects.create(
            sender_id=sender_id,
            recipient_id=recipient_id,
            content=content,
            sent_at=timezone.now()
        )

        # Award XP (imported from xp/utils.py)
        User = get_user_model()
        sender = User.objects.get(id=sender_id)
        await award_xp(sender, amount=10, reason='Chat message')

        # Broadcast to everyone (or only recipient if private)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': {
                    'sender_id': sender_id,
                    'recipient_id': recipient_id,
                    'content': content,
                    'sent_at': str(message.sent_at),
                }
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event['message']))