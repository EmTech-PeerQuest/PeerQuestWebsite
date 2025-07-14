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
                jwt_auth = JWTAuthentication()
                validated_token = await sync_to_async(jwt_auth.get_validated_token)(token)
                user = await sync_to_async(jwt_auth.get_user)(validated_token)
                logger.info(f"WebSocket user authenticated: {user} (is_authenticated={user.is_authenticated})")
                scope['user'] = user
            except Exception as e:
                logger.warning(f"WebSocket JWT authentication failed: {e}")
                # Optionally, add more details for debugging:
                import traceback
                logger.debug(traceback.format_exc())

        close_old_connections()
        return await super().__call__(scope, receive, send)


messaging/consumers.py
import json
import logging
import uuid

from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from messaging.models import Message, Conversation, UserPresence
from messaging.serializers import MessageSerializer

logger = logging.getLogger(_name_)
User = get_user_model()


# --- Helpers to move sync work off the event loop ---
# Add this near the top:
@database_sync_to_async
def mark_message_delivered(message_id):
    msg = Message.objects.get(id=message_id)
    if msg.status == "sent":
        msg.status = "delivered"
        msg.save(update_fields=["status"])
    return msg

@database_sync_to_async
def get_conversation(conversation_id):
    return Conversation.objects.get(id=conversation_id)

@database_sync_to_async
def user_in_conversation(user_id, conversation_id):
    return Conversation.objects.filter(id=conversation_id, participants__id=user_id).exists()

@database_sync_to_async
def mark_user_online(user):
    presence, _ = UserPresence.objects.get_or_create(user=user)
    UserPresence.set_user_online(user)

@database_sync_to_async
def mark_user_offline(user):
    UserPresence.set_user_offline(user)

@database_sync_to_async
def get_participant_ids(conversation_id):
    try:
        # Ensure UUID instance
        if isinstance(conversation_id, str):
            conversation_id = uuid.UUID(conversation_id)
        conv = Conversation.objects.get(id=conversation_id)
        return list(conv.participants.values_list("id", flat=True))
    except Conversation.DoesNotExist:
        logger.error(f"Conversation {conversation_id} does not exist.")
        raise
    except Exception as e:
        logger.exception(f"Unexpected error in get_participant_ids: {e}")
        raise


@database_sync_to_async
def create_message(conversation_id, sender_id, content, message_type="text"):
    conv = Conversation.objects.get(id=conversation_id)
    participants = conv.participants.all()
    recipient = participants.exclude(id=sender_id).first()
    if not recipient:
        return None
    return Message.objects.create(
        conversation=conv,
        sender_id=sender_id,
        recipient_id=recipient.id,
        content=content,
        message_type=message_type,
    )

@database_sync_to_async
def create_message_with_attachment(conversation_id, sender_id, content, message_type, attachment_data):
    """
    Create a message and attach a file (image or generic file).
    attachment_data should include:
        - file_url: path or full URL of uploaded file (already handled by frontend HTTP)
        - filename
        - file_size
        - content_type
    """
    from messaging.models import MessageAttachment

    conversation = Conversation.objects.get(id=conversation_id)
    recipient = conversation.participants.exclude(id=sender_id).first()
    if not recipient:
        return None

    message = Message.objects.create(
        conversation=conversation,
        sender_id=sender_id,
        recipient_id=recipient.id,
        content=content or "",
        message_type=message_type,
    )

    # Attach file metadata
    MessageAttachment.objects.create(
        message=message,
        file=attachment_data["file_url"],
        filename=attachment_data["filename"],
        file_size=attachment_data["file_size"],
        content_type=attachment_data["content_type"],
    )

    return message

@database_sync_to_async
def mark_message_read(message_id):
    msg = Message.objects.get(id=message_id)
    msg.mark_as_read()
    return msg

@database_sync_to_async
def fetch_initial_messages(conversation_id, limit=50):
    msgs = Message.objects.filter(conversation_id=conversation_id).order_by("timestamp")[:limit]
    return MessageSerializer(msgs, many=True).data

@database_sync_to_async
def serialize_message(message):
    # <— this moves DRF serialization off the async loop
    return MessageSerializer(message).data

@database_sync_to_async
def is_user_online(user_id):
    try:
        return UserPresence.objects.get(user_id=user_id).is_online
    except UserPresence.DoesNotExist:
        return False