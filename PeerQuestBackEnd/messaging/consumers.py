import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.utils import timezone
from messaging.models import Message, Conversation
from xp.utils import award_xp
from django.contrib.auth import get_user_model
from channels.db import database_sync_to_async
import logging
import uuid

logger = logging.getLogger("django")

@database_sync_to_async
def create_message(sender_id, recipient_id, content):
    from messaging.models import Message
    
    # Handle UUID conversion for both sender and recipient
    try:
        if isinstance(sender_id, str):
            sender_uuid = uuid.UUID(sender_id)
        else:
            sender_uuid = sender_id
            
        if isinstance(recipient_id, str):
            recipient_uuid = uuid.UUID(recipient_id)
        else:
            recipient_uuid = recipient_id
    except ValueError as e:
        logger.error(f"[DB] Invalid UUID format: {e}")
        return None
    
    try:
        # Create the message
        message = Message.objects.create(
            sender_id=sender_uuid,
            recipient_id=recipient_uuid,
            content=content,
        )
        
        # Find and update the conversation
        # The message should already be linked to a conversation by the views
        if not message.conversation:
            # Try to find the conversation
            try:
                conversation = Conversation.objects.filter(
                    participants=sender_uuid
                ).filter(
                    participants=recipient_uuid
                ).first()
                
                if conversation:
                    message.conversation = conversation
                    message.save(update_fields=['conversation'])
            except Exception as e:
                logger.warning(f"[DB] Could not link message to conversation: {e}")
        
        return message
        
    except Exception as e:
        logger.error(f"[DB] Error creating message: {e}")
        return None

@database_sync_to_async
def get_user_by_id(user_id):
    User = get_user_model()
    try:
        # Handle UUID conversion
        if isinstance(user_id, str):
            try:
                user_uuid = uuid.UUID(user_id)
            except ValueError:
                user_uuid = user_id
        else:
            user_uuid = user_id
            
        return User.objects.get(id=user_uuid)
    except User.DoesNotExist:
        return None

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        try:
            self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
            self.room_group_name = f"chat_{self.conversation_id}"

            user = self.scope.get('user')
            logger.info(f"[CONNECT] User: {user} | Authenticated: {user.is_authenticated if user else 'None'} | Room: {self.room_group_name}")
            logger.info(f"[CONNECT] Conversation ID: {self.conversation_id}")

            if user and user.is_authenticated:
                await self.channel_layer.group_add(
                    self.room_group_name,
                    self.channel_name
                )
                await self.accept()
                logger.info(f"WebSocket accepted for user {user} in room {self.room_group_name}")
                
                # Send a connection confirmation message
                await self.send(text_data=json.dumps({
                    'type': 'connection_status',
                    'message': 'Connected successfully',
                    'conversation_id': self.conversation_id
                }))
            else:
                logger.warning("WebSocket rejected: user not authenticated")
                await self.close(code=4001)  # Custom close code for auth failure
        except Exception as e:
            logger.error(f"WebSocket connect error: {e}")
            await self.close(code=4000)  # Custom close code for general error

    async def disconnect(self, close_code):
        try:
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
            logger.info(f"WebSocket disconnected from room {self.room_group_name}")
        except Exception as e:
            logger.error(f"WebSocket disconnect error: {e}")

    async def receive(self, text_data):
        try:
            logger.info(f"[RECEIVE] Raw text: {text_data}")
            data = json.loads(text_data)

            sender_id = data.get('sender_id')
            recipient_id = data.get('recipient_id')
            content = data.get('content', '').strip()

            user = self.scope.get('user')
            if user and user.is_authenticated:
                sender_id = str(user.id)  # Ensure it's a string

            logger.info(f"[RECEIVE] Parsed data | Sender: {sender_id}, Recipient: {recipient_id}, Content: {content}")

            if not sender_id or not recipient_id or not content:
                logger.warning("[RECEIVE] Missing required fields")
                return

            # Create message in database (this will auto-update conversation timestamp)
            message = await create_message(sender_id, recipient_id, content)
            if not message:
                logger.error("[RECEIVE] Failed to create message")
                return
                
            logger.info(f"[DB] Message saved with ID: {message.id}")

            # Get sender info
            sender = await get_user_by_id(sender_id)
            if not sender:
                logger.error(f"[ERROR] Sender with ID {sender_id} not found")
                return

            # Award XP (optional, can fail silently)
            try:
                await award_xp(sender, amount=10, reason='Chat message')
            except Exception as e:
                logger.warning(f"[XP] XP award failed: {e}")

            # Broadcast message to room
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': {
                        'id': str(message.id),
                        'conversation_id': self.conversation_id,
                        'sender': {
                            'id': str(sender.id),
                            'username': sender.username,
                        },
                        'recipient_id': str(recipient_id),
                        'content': content,
                        'timestamp': message.timestamp.isoformat(),
                    }
                }
            )

            logger.info(f"[BROADCAST] Message sent to room group: {self.room_group_name}")

        except json.JSONDecodeError as e:
            logger.error(f"[RECEIVE ERROR] Invalid JSON: {e}")
        except Exception as e:
            logger.error(f"[RECEIVE ERROR] {e}")

    async def chat_message(self, event):
        try:
            logger.info(f"[SEND] Broadcasting message: {event['message']}")
            await self.send(text_data=json.dumps(event['message']))
        except Exception as e:
            logger.error(f"[SEND ERROR] {e}")
