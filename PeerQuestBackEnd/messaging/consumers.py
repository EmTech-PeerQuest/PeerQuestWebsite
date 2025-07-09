import json
import logging
import uuid

from urllib.parse import parse_qs
from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.db import close_old_connections
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.contrib.auth.models import AnonymousUser
from messaging.models import Message, Conversation, UserPresence
from messaging.serializers import MessageSerializer
from xp.utils import award_xp

logger = logging.getLogger(__name__)
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
    return list(Conversation.objects.get(id=conversation_id).participants.values_list("id", flat=True))

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
def mark_message_read(message_id):
    msg = Message.objects.get(id=message_id)
    msg.mark_as_read()
    return True

@database_sync_to_async
def fetch_initial_messages(conversation_id, limit=50):
    msgs = Message.objects.filter(conversation_id=conversation_id).order_by("timestamp")[:limit]
    return MessageSerializer(msgs, many=True).data

@database_sync_to_async
def award_xp_sync(user, amount, reason):
    award_xp(user, amount=amount, reason=reason)

@database_sync_to_async
def serialize_message(message):
    # <— this moves DRF serialization off the async loop
    return MessageSerializer(message).data


# --- Consumer —----------------------------------------

class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        user = self.scope["user"]
        if not user or not user.is_authenticated:
            await self.close(code=4001)
            return

        user = self.scope["user"]
        if not (user and user.is_authenticated):
            await self.close(code=4001)
            return

        self.conversation_id = self.scope["url_route"]["kwargs"]["conversation_id"]
        # check membership
        if not await user_in_conversation(user.id, self.conversation_id):
            await self.close(code=4003)
            return

        await mark_user_online(user)
        self.room_group = f"chat_{self.conversation_id}"
        await self.channel_layer.group_add(self.room_group, self.channel_name)
        await self.accept()

        # send initial messages
        initial = await fetch_initial_messages(self.conversation_id)
        await self.send_json({"type": "initial_messages", "messages": initial})

        # broadcast presence to other participants
        pids = await get_participant_ids(self.conversation_id)
        for pid in pids:
            if str(pid) != str(user.id):
                await self.channel_layer.group_send(
                    f"user_{pid}",
                    {"type": "presence_update", "user_id": str(user.id), "is_online": True},
                )

    async def disconnect(self, code):
        user = self.scope["user"]
        if user and user.is_authenticated:
            await mark_user_offline(user)
            await self.channel_layer.group_discard(self.room_group, self.channel_name)

            pids = await get_participant_ids(self.conversation_id)
            for pid in pids:
                if str(pid) != str(user.id):
                    await self.channel_layer.group_send(
                        f"user_{pid}",
                        {"type": "presence_update", "user_id": str(user.id), "is_online": False},
                    )

    async def receive(self, text_data):
        data = json.loads(text_data)
        typ = data.get("type")

        if typ in ("send_message", "chat_message"):
            await self.handle_chat_message(data)
        elif typ == "typing":
            await self.handle_typing(data)
        elif typ == "read_receipt":
            await self.handle_read_receipt(data)

    async def handle_chat_message(self, data):
        user = self.scope["user"]
        content = data.get("content", "").strip()
        temp_id = data.get("temp_id")  # Get temp_id from frontend
        
        if not content:
            return

        # create & persist the message
        msg = await create_message(self.conversation_id, str(user.id), content)
        if not msg:
            return

        # award XP
        await award_xp_sync(user, amount=10, reason="chat message")

        # serialize in a thread
        serialized = await serialize_message(msg)

        # broadcast new_message with temp_id
        await self.channel_layer.group_send(
            self.room_group,
            {
                "type": "chat.message", 
                "message": serialized,
                "temp_id": temp_id,  # Include temp_id in the broadcast
            },
        )

        # update each user's conversation preview
        pids = await get_participant_ids(self.conversation_id)
        for pid in pids:
            await self.channel_layer.group_send(
                f"user_{pid}",
                {
                    "type": "conversation_update",
                    "conversation_id": str(self.conversation_id),
                    "last_message": serialized,
                },
            )

    async def handle_typing(self, data):
        user = self.scope["user"]
        await self.channel_layer.group_send(
            self.room_group,
            {
                "type": "typing.indicator",
                "user_id": str(user.id),
                "username": user.username,
            },
        )

    async def handle_read_receipt(self, data):
        mid = data.get("message_id")
        success = await mark_message_read(mid)
        if success:
            await self.channel_layer.group_send(
                self.room_group,
                {"type": "message.read", "message_id": mid},
            )

    # — Event handlers for group_send —

    async def chat_message(self, event):
        user = self.scope["user"]
        message_data = event["message"]
        recipient_id = message_data["receiver"]["id"]
        temp_id = event.get("temp_id")

        # If current user is recipient, mark as delivered
        if str(user.id) == str(recipient_id):
            updated_msg = await mark_message_delivered(message_data["id"])
            message_data = await serialize_message(updated_msg)

        response_data = {
            "type": "new_message",
            "message": message_data
        }

        if temp_id:
            response_data["temp_id"] = temp_id

        await self.send_json(response_data)


    async def presence_update(self, event):
        if str(event["user_id"]) != str(self.scope["user"].id):
            await self.send_json(
                {"type": "presence_update", "user_id": event["user_id"], "is_online": event["is_online"]}
            )

    async def typing_indicator(self, event):
        if str(event["user_id"]) != str(self.scope["user"].id):
            await self.send_json(
                {"type": "typing", "user_id": event["user_id"], "username": event["username"]}
            )

    async def conversation_update(self, event):
        await self.send_json(
            {
                "type": "conversation_update",
                "conversation_id": event["conversation_id"],
                "last_message": event["last_message"],
            }
        )

    async def message_read(self, event):
        await self.send_json({"type": "message_read_update", "message_id": event["message_id"]})