import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.utils import timezone
from django.contrib.auth import get_user_model
from channels.db import database_sync_to_async
import logging
import uuid
from messaging.serializers import MessageSerializer

# Import your models. Adjust these imports if your models are in a different path.
from messaging.models import Message, Conversation, UserPresence 
# Import xp.utils.award_xp. Ensure this module and function exists.
from xp.utils import award_xp

# Use a specific logger for this module for better log management
logger = logging.getLogger(__name__)

# --- Database Async Helper Functions ---

@database_sync_to_async
def create_message(conversation_id, sender_id, content, message_type='text'):
    """
    Creates and saves a new message to the database.
    
    Args:
        conversation_id (uuid.UUID): The ID of the conversation the message belongs to.
        sender_id (uuid.UUID): The ID of the user who sent the message.
        content (str): The text content of the message.
        message_type (str, optional): The type of message (e.g., 'text'). Defaults to 'text'.

    Returns:
        messaging.models.Message: The created Message object, or None if an error occurred.
    """
    try:
        logger.info(f"[CREATE_MESSAGE] Starting with conversation_id={conversation_id}, sender_id={sender_id}, content='{content}'")
        
        conversation = Conversation.objects.get(id=conversation_id)
        logger.info(f"[CREATE_MESSAGE] Found conversation: {conversation}")
        
        # Get the recipient (the other participant in the conversation)
        participants = conversation.participants.all()
        recipient = participants.exclude(id=sender_id).first()
        
        if not recipient:
            logger.error(f"[CREATE_MESSAGE] Could not determine recipient for conversation {conversation_id}")
            return None
        
        logger.info(f"[CREATE_MESSAGE] Determined recipient: {recipient.username} (ID: {recipient.id})")
        
        message = Message.objects.create(
            conversation=conversation,
            sender_id=sender_id,
            recipient_id=recipient.id,  # This was missing!
            content=content,
            message_type=message_type,
        )
        logger.info(f"[CREATE_MESSAGE] Message created successfully: ID={message.id}")
        return message
        
    except Conversation.DoesNotExist:
        logger.error(f"[CREATE_MESSAGE] Conversation with ID {conversation_id} does not exist.")
        return None
    except Exception as e:
        logger.exception(f"[CREATE_MESSAGE] Error creating message: {e}")
        return None
    
@database_sync_to_async
def mark_message_as_read(message_id):
    """
    Marks a message as read in the database.
    
    Args:
        message_id (uuid.UUID): The ID of the message to mark as read.

    Returns:
        bool: True if the message was found and marked, False otherwise.
    """
    try:
        message = Message.objects.get(id=message_id)
        # Assuming your Message model has a mark_as_read method that updates status, etc.
        message.mark_as_read() 
        logger.info(f"[DB] Message {message_id} marked as read.")
        return True
    except Message.DoesNotExist:
        logger.warning(f"[DB] Message {message_id} not found for read receipt.")
        return False
    except Exception as e:
        logger.exception(f"[DB] Error marking message {message_id} as read: {e}")
        return False

@database_sync_to_async
def mark_message_as_delivered(message_id):
    """
    Marks a message as delivered in the database, if it hasn't been read yet.
    
    Args:
        message_id (uuid.UUID): The ID of the message to mark as delivered.

    Returns:
        bool: True if the message was found and marked, False otherwise.
    """
    try:
        message = Message.objects.get(id=message_id)
        if message.status != "read": # Only mark as delivered if not already read
            message.status = "delivered"
            message.save(update_fields=["status"])
            logger.info(f"[DB] Message {message_id} marked as delivered.")
        return True
    except Message.DoesNotExist:
        logger.warning(f"[DB] Message {message_id} not found for delivered status.")
        return False
    except Exception as e:
        logger.exception(f"[DB] Error marking message {message_id} as delivered: {e}")
        return False

@database_sync_to_async
def get_user_by_id(user_id):
    """
    Fetches a User object by its ID.
    
    Args:
        user_id (uuid.UUID): The ID of the user to fetch.

    Returns:
        django.contrib.auth.models.User: The User object, or None if not found.
    """
    User = get_user_model()
    try:
        return User.objects.get(id=user_id)
    except User.DoesNotExist:
        logger.warning(f"[DB] User with ID {user_id} not found.")
        return None
    except Exception as e:
        logger.exception(f"[DB] Error fetching user {user_id}: {e}")
        return None

@database_sync_to_async
def set_user_online(user):
    """Sets a user's presence status to online."""
    if user:
        logger.debug(f"[DB] Setting user {user.username} (ID: {user.id}) online.")
        UserPresence.set_user_online(user)

@database_sync_to_async
def set_user_offline(user):
    """Sets a user's presence status to offline."""
    if user:
        logger.debug(f"[DB] Setting user {user.username} (ID: {user.id}) offline.")
        UserPresence.set_user_offline(user)

@database_sync_to_async
def get_conversation_participants(conversation_id):
    """
    Gets the IDs of all participants in a given conversation.
    
    Args:
        conversation_id (uuid.UUID): The ID of the conversation.

    Returns:
        list: A list of UUIDs (or strings) of participant IDs.
    """
    try:
        conversation = Conversation.objects.get(id=conversation_id)
        return list(conversation.participants.values_list('id', flat=True))
    except Conversation.DoesNotExist:
        logger.warning(f"[DB] Conversation {conversation_id} not found for participant retrieval.")
        return []
    except Exception as e:
        logger.exception(f"[DB] Error getting conversation participants for {conversation_id}: {e}")
        return []

@database_sync_to_async
def is_user_in_conversation(user_id, conversation_id):
    """
    Checks if a user is a participant in the given conversation.
    
    Args:
        user_id (uuid.UUID): The ID of the user.
        conversation_id (uuid.UUID): The ID of the conversation.

    Returns:
        bool: True if the user is a participant, False otherwise.
    """
    try:
        return Conversation.objects.filter(id=conversation_id, participants__id=user_id).exists()
    except Exception as e:
        logger.exception(f"[DB] Error checking user {user_id} in conversation {conversation_id}: {e}")
        return False

@database_sync_to_async
def get_conversation_messages(conversation_id, limit=50):
    """
    Fetches recent messages for a conversation, ordered by timestamp.
    
    Args:
        conversation_id (uuid.UUID): The ID of the conversation.
        limit (int, optional): The maximum number of messages to fetch. Defaults to 50.

    Returns:
        list: A list of dictionaries, where each dictionary represents a message.
    """
    try:
        messages_queryset = Message.objects.filter(
            conversation__id=conversation_id
        ).order_by('timestamp')[:limit] 
        
        serialized_messages = []
        for msg in messages_queryset:
            sender_username = msg.sender.username if msg.sender else 'Unknown'
            sender_avatar = getattr(msg.sender, 'avatar', None)
            sender_avatar_url = None
            if sender_avatar:
                try:
                    sender_avatar_url = sender_avatar.url
                except ValueError:
                    logger.warning(f"Avatar for user {msg.sender_id} is corrupted or missing URL.")
                    sender_avatar_url = None
            
            serialized_messages.append({
                'id': str(msg.id),
                'conversation_id': str(msg.conversation.id),
                'sender': {
                    'id': str(msg.sender_id),
                    'username': sender_username,
                    'avatar': sender_avatar_url,
                },
                'recipient_id': str(msg.recipient_id) if msg.recipient_id else None,
                'content': msg.content,
                'message_type': msg.message_type,
                'timestamp': msg.timestamp.isoformat(),
                'status': msg.status,
                'is_read': msg.is_read,
            })
        logger.debug(f"[DB] Fetched {len(serialized_messages)} messages for conversation {conversation_id}.")
        return serialized_messages
    except Conversation.DoesNotExist:
        logger.warning(f"[DB] Conversation {conversation_id} not found when fetching messages.")
        return []
    except Exception as e:
        logger.exception(f"[DB] Error fetching conversation messages for {conversation_id}: {e}")
        return []

@database_sync_to_async
def award_xp_async(user, amount, reason):
    """
    Async wrapper for the XP award function.
    
    Args:
        user: The user object to award XP to
        amount: The amount of XP to award
        reason: The reason for the XP award
    """
    try:
        award_xp(user, amount=amount, reason=reason)
        logger.debug(f"[XP] XP awarded to {user.username}.")
    except Exception as e:
        logger.warning(f"[XP] XP award failed for {user.username}: {e}")

# --- Chat Consumer Class ---

class ChatConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time chat functionality.
    Handles connection, disconnection, and various message types (chat, typing, read receipts).
    """
    async def connect(self):
        """
        Handles new WebSocket connections.
        Authenticates the user and joins them to relevant chat groups.
        """
        try:
            # Extract conversation ID from URL routing
            self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
            self.room_group_name = f"chat_{self.conversation_id}"
            self.user_group_name = None

            user = self.scope.get('user')
            
            logger.info(f"[CONNECT] Attempting connection. User: {user} | Authenticated: {user.is_authenticated if user else 'None'} | Room: {self.room_group_name}")

            # Check if user is authenticated
            if user and user.is_authenticated:
                # CRITICAL SECURITY CHECK: Verify the user is a participant in this conversation
                is_participant = await is_user_in_conversation(user.id, self.conversation_id)
                if not is_participant:
                    logger.warning(f"[CONNECT] User {user.username} (ID: {user.id}) is NOT a participant in conversation {self.conversation_id}. Denying connection.")
                    await self.close(code=4003)
                    return

                # Mark user as online in the UserPresence system
                await set_user_online(user)
                
                # Add user's channel to the conversation-specific group
                await self.channel_layer.group_add(
                    self.room_group_name,
                    self.channel_name
                )
                
                # Add user's channel to their personal group for direct notifications
                self.user_group_name = f"user_{user.id}"
                await self.channel_layer.group_add(
                    self.user_group_name,
                    self.channel_name
                )
                
                # Accept the WebSocket connection
                await self.accept()
                logger.info(f"[CONNECT] WebSocket accepted for user {user.username} (ID: {user.id}) in room {self.room_group_name}")
                
                # Send a connection confirmation message back to the client
                await self.send(text_data=json.dumps({
                    'type': 'connection_status',
                    'message': 'Connected successfully',
                    'conversation_id': str(self.conversation_id),
                    'user_id': str(user.id) 
                }))
                
                # Send initial historical messages for this conversation
                initial_messages = await get_conversation_messages(self.conversation_id)
                logger.debug(f"[CONNECT] Sending {len(initial_messages)} initial messages for conversation {self.conversation_id} to user {user.username}.")
                await self.send(text_data=json.dumps({
                    'type': 'initial_messages',
                    'messages': initial_messages
                }))

                # Notify other participants that this user is now online
                participants = await get_conversation_participants(self.conversation_id)
                for participant_id in participants:
                    if str(participant_id) != str(user.id):
                        await self.channel_layer.group_send(
                            f"user_{participant_id}",
                            {
                                'type': 'user_presence_update',
                                'user_id': str(user.id),
                                'username': user.username,
                                'is_online': True,
                            }
                        )
            else:
                logger.warning("[CONNECT] WebSocket rejected: User not authenticated or user object is None.")
                await self.close(code=4001)
        except KeyError:
            logger.error(f"[CONNECT ERROR] 'conversation_id' not found in URL route kwargs for connection attempt. Close code 4000.")
            await self.close(code=4000)
        except Exception as e:
            logger.exception(f"[CONNECT ERROR] Unhandled exception during WebSocket connection: {e}. Close code 4000.")
            await self.close(code=4000)

    async def disconnect(self, close_code):
        """
        Handles WebSocket disconnections.
        Removes the user from chat groups and updates their presence status.
        """
        try:
            user = self.scope.get('user')
            
            if user and user.is_authenticated:
                # Mark user as offline
                await set_user_offline(user)
                
                # Leave conversation room
                if hasattr(self, 'room_group_name') and self.room_group_name:
                    await self.channel_layer.group_discard(
                        self.room_group_name,
                        self.channel_name
                    )
                
                # Leave user's personal room
                if hasattr(self, 'user_group_name') and self.user_group_name:
                    await self.channel_layer.group_discard(
                        self.user_group_name,
                        self.channel_name
                    )
                
                # Notify other participants that user is offline
                if hasattr(self, 'conversation_id') and self.conversation_id:
                    participants = await get_conversation_participants(self.conversation_id)
                    for participant_id in participants:
                        if str(participant_id) != str(user.id):
                            await self.channel_layer.group_send(
                                f"user_{participant_id}",
                                {
                                    'type': 'user_presence_update',
                                    'user_id': str(user.id),
                                    'username': user.username,
                                    'is_online': False,
                                }
                            )
            
            logger.info(f"[DISCONNECT] WebSocket disconnected (Code: {close_code}) for user {user.username if user else 'N/A'}. Room: {getattr(self, 'room_group_name', 'N/A')}")
        except Exception as e:
            logger.exception(f"[DISCONNECT ERROR] Unhandled exception during WebSocket disconnection: {e}")

    async def receive(self, text_data):
        """
        Receives messages from the WebSocket and dispatches them to appropriate handlers.
        """
        try:
            logger.info(f"[RECEIVE] Raw text data: {text_data}")
            data = json.loads(text_data)
            
            logger.info(f"[RECEIVE] Parsed data: {data}")
            logger.info(f"[RECEIVE] Message type: {data.get('type')}")

            message_type = data.get('type')
            
            if message_type == 'send_message':
                logger.info(f"[RECEIVE] Calling handle_chat_message for send_message")
                await self.handle_chat_message(data)
            elif message_type == 'chat_message':
                logger.info(f"[RECEIVE] Calling handle_chat_message for chat_message")
                await self.handle_chat_message(data)
            elif message_type == 'typing':
                logger.info(f"[RECEIVE] Calling handle_typing")
                await self.handle_typing(data)
            elif message_type == 'read_receipt':
                logger.info(f"[RECEIVE] Calling handle_read_receipt")
                await self.handle_read_receipt(data)
            else:
                logger.warning(f"[RECEIVE] Unrecognized message type received: '{message_type}'")
                logger.warning(f"[RECEIVE] Full data received: {data}")

        except json.JSONDecodeError as e:
            logger.error(f"[RECEIVE ERROR] Invalid JSON received: {e}. Data: '{text_data}'")
        except Exception as e:
            logger.exception(f"[RECEIVE ERROR] Unhandled exception during message reception: {e}")

    async def handle_chat_message(self, data):
        """
        Handles incoming 'chat_message' type messages.
        Authenticates sender, saves message to DB, awards XP, and broadcasts.
        """
        user = self.scope.get('user')
        if not (user and user.is_authenticated):
            logger.warning("[HANDLE_CHAT_MESSAGE] Unauthenticated user attempted to send chat message.")
            return

        sender_id = str(user.id)
        content = data.get('content', '').strip()
        recipient_id = data.get('recipient_id')

        logger.info(f"[HANDLE_CHAT_MESSAGE] Processing message. Sender: {sender_id}, Content: '{content[:50]}...'")

        if not content:
            logger.warning("[HANDLE_CHAT_MESSAGE] Message content is empty. Ignoring.")
            return

        # Security check: Ensure the sender is actually part of this conversation
        is_participant = await is_user_in_conversation(sender_id, self.conversation_id)
        if not is_participant:
            logger.warning(f"[HANDLE_CHAT_MESSAGE] User {sender_id} attempted to send message to conversation {self.conversation_id} but is not a participant. Message ignored.")
            return 

        # Create message in database
        message = await create_message(self.conversation_id, sender_id, content) 
        if not message:
            logger.error(f"[HANDLE_CHAT_MESSAGE] Failed to create message for conversation {self.conversation_id}, sender {sender_id}.")
            return
            
        logger.info(f"[HANDLE_CHAT_MESSAGE] Message saved to DB with ID: {message.id}")

        # Get sender info
        sender = await get_user_by_id(sender_id)
        if not sender:
            logger.error(f"[HANDLE_CHAT_MESSAGE] Sender with ID {sender_id} not found after message creation. This is unexpected.")
            return

        # Award XP (optional)
        await award_xp_async(sender, amount=10, reason='Chat message')

        # Prepare message data for broadcasting to clients
        sender_avatar_url = None
        if getattr(sender, 'avatar', None):
            try:
                sender_avatar_url = sender.avatar.url
            except ValueError:
                logger.warning(f"Could not get avatar URL for user {sender.id}.")
                sender_avatar_url = None

        # Serialize the message
        message_serialized = MessageSerializer(message).data

        # Broadcast the message using the full serializer
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message_serialized
            }
        )

        # Broadcast the new message to all connected clients in this conversation's room
        logger.debug(f"[HANDLE_CHAT_MESSAGE] Broadcasting message {message.id} to room {self.room_group_name}.")
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message_serialized
            }
        )


        # Send conversation update to all participants
        participants_ids = await get_conversation_participants(self.conversation_id)
        for participant_id in participants_ids:
            await self.channel_layer.group_send(
                f"user_{participant_id}",
                {
                    'type': 'conversation_update',
                    'conversation_id': str(self.conversation_id),
                    'last_message': message_serialized,
                }
            )

    async def handle_typing(self, data):
        """
        Handles incoming 'typing' status updates and broadcasts them.
        """
        user = self.scope.get('user')
        if not (user and user.is_authenticated):
            logger.warning("[HANDLE_TYPING] Unauthenticated user attempted to send typing indicator.")
            return

        is_typing = data.get('is_typing', False)
        logger.debug(f"[HANDLE_TYPING] Typing indicator from {user.username} (ID: {user.id}): {is_typing}")

        # Broadcast typing status to everyone in the room except the sender
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'typing_indicator', 
                'user_id': str(user.id),
                'username': user.username,
                'is_typing': is_typing,
            }
        )

    async def handle_read_receipt(self, data):
        """
        Handles incoming 'read_receipt' messages to mark messages as read.
        """
        user = self.scope.get('user')
        if not (user and user.is_authenticated):
            logger.warning("[HANDLE_READ_RECEIPT] Unauthenticated user attempted to send read receipt.")
            return
            
        message_id = data.get('message_id')
        if not message_id:
            logger.warning("[HANDLE_READ_RECEIPT] Missing 'message_id' in read receipt data.")
            return

        logger.info(f"[HANDLE_READ_RECEIPT] User {user.username} (ID: {user.id}) attempting to mark message {message_id} as read.")

        success = await mark_message_as_read(message_id)
        if success:
            # Broadcast the read update to all participants in the conversation
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'message_read_update', 
                    'message_id': message_id,
                    'user_id': str(user.id),
                }
            )
        else:
            logger.warning(f"[HANDLE_READ_RECEIPT] Failed to mark message {message_id} as read.")

    # --- WebSocket Event Handlers ---

    async def chat_message(self, event):
        """
        Receives a 'chat_message' event from the channel layer and sends it to the client.
        """
        try:
            logger.info(f"[SEND_WS] *** chat_message method called ***")
            logger.info(f"[SEND_WS] Event data: {event}")
            
            # Send the message to the WebSocket client
            message_data = {
                'type': 'new_message',  # Frontend expects 'new_message' type
                'message': event['message']
            }
            
            logger.info(f"[SEND_WS] Sending to client: {message_data}")
            await self.send(text_data=json.dumps(message_data))
            logger.info(f"[SEND_WS] Message sent successfully to client")
            
        except Exception as e:
            logger.exception(f"[SEND_WS_ERROR - chat_message] Failed to send chat message to client: {e}")

    async def user_presence_update(self, event):
        """
        Receives a 'user_presence_update' event from the channel layer and sends it to the client.
        """
        try:
            # Filter to prevent sending updates about one's own presence
            if str(event['user_id']) != str(self.scope["user"].id): 
                logger.debug(f"[SEND_WS] Sending presence_update for user {event['user_id']}: {event['is_online']}")
                await self.send(text_data=json.dumps({
                    'type': 'presence_update',
                    'user_id': event['user_id'],
                    'username': event['username'],
                    'is_online': event['is_online'],
                }))
        except Exception as e:
            logger.exception(f"[SEND_WS_ERROR - user_presence_update] Failed to send user presence update: {e}")

    async def conversation_update(self, event):
        """
        Receives a 'conversation_update' event from the channel layer and sends it to the client.
        """
        try:
            logger.debug(f"[SEND_WS] Sending conversation_update for conversation {event['conversation_id']}")
            await self.send(text_data=json.dumps({
                'type': 'conversation_update',
                'conversation_id': event['conversation_id'],
                'last_message': event['last_message'],
                'timestamp': event['timestamp'],
                'last_sender_id': event.get('last_sender_id') 
            }))
        except Exception as e:
            logger.exception(f"[SEND_WS_ERROR - conversation_update] Failed to send conversation update: {e}")

    async def typing_indicator(self, event):
        """
        Receives a 'typing_indicator' event from the channel layer and sends it to the client.
        """
        try:
            # Only send typing update if it's from another user
            if str(event['user_id']) != str(self.scope["user"].id):
                logger.debug(f"[SEND_WS] Sending typing_indicator from user {event['user_id']}: {event['is_typing']}")
                await self.send(text_data=json.dumps({
                    'type': 'typing',
                    'user_id': event['user_id'],
                    'username': event['username'],
                    'is_typing': event['is_typing'],
                }))
        except Exception as e:
            logger.exception(f"[SEND_WS_ERROR - typing_indicator] Failed to send typing indicator: {e}")

    async def message_read_update(self, event):
        """
        Receives a 'message_read_update' event from the channel layer and sends it to the client.
        """
        try:
            logger.debug(f"[SEND_WS] Message {event['message_id']} read by user {event['user_id']}")
            await self.send(text_data=json.dumps({
                'type': 'message_read_update',
                'message_id': event['message_id'],
                'user_id': event['user_id'],
            }))
        except Exception as e:
            logger.exception(f"[SEND_WS_ERROR - message_read_update] Failed to send message read update: {e}")