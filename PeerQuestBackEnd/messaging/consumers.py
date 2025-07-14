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



# --- Consumer —----------------------------------------

class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        # ✅ After token processing, proceed as before
        user = self.scope["user"]
        if not user or not user.is_authenticated:
            logger.warning(f"WebSocket connect failed: user not authenticated. Scope: {self.scope}")
            await self.close(code=4001)
            return

        self.conversation_id = self.scope["url_route"]["kwargs"].get("conversation_id")
        self.room_group = f"chat_{self.conversation_id}"

        if not await user_in_conversation(user.id, self.conversation_id):
            logger.warning(f"WebSocket connect failed: user {user.id} not in conversation {self.conversation_id}")
            await self.close(code=4003)
            return

        await mark_user_online(user)

        await self.channel_layer.group_add(f"user_{user.id}", self.channel_name)
        await self.channel_layer.group_add(self.room_group, self.channel_name)

        await self.accept()

        # ✅ Fetch and send initial messages
        try:
            initial = await fetch_initial_messages(self.conversation_id)
            await self.send_json({"type": "initial_messages", "messages": initial})
        except Exception as e:
            logger.error(f"Error fetching initial messages for conversation {self.conversation_id}: {e}")

        # ✅ Send presence info
        try:
            pids = await get_participant_ids(self.conversation_id)
            for pid in pids:
                if str(pid) != str(user.id):
                    await self.channel_layer.group_send(
                        f"user_{pid}",
                        {"type": "presence_update", "user_id": str(user.id), "is_online": True},
                    )
            for pid in pids:
                if str(pid) != str(user.id):
                    online = await is_user_online(pid)
                    await self.channel_layer.group_send(
                        f"user_{user.id}",
                        {
                            "type": "presence_update",
                            "user_id": str(pid),
                            "is_online": online,
                        },
                    )
        except Exception as e:
            logger.error(f"Error broadcasting presence for conversation {self.conversation_id}: {e}")

        await self.channel_layer.group_send(
            f"user_{user.id}",
            {
                "type": "presence_update",
                "user_id": str(user.id),
                "is_online": True,
            },
        )

        # ✅ Also send own presence status to self
        await self.channel_layer.group_send(
            f"user_{user.id}",
            {
                "type": "presence_update",
                "user_id": str(user.id),
                "is_online": True,
            },
        )




    async def disconnect(self, code):
        user = self.scope["user"]
        conv_id = getattr(self, "conversation_id", None)

        logger.warning(f"WebSocket disconnect: user={getattr(user, 'username', None)}, code={code}, conversation_id={conv_id}")

        if not user or not user.is_authenticated or not conv_id:
            logger.warning("Disconnect skipped: no user or conversation_id set.")
            return

        try:
            # ✅ Leave personal group
            await self.channel_layer.group_discard(f"user_{user.id}", self.channel_name)

            # Leave room group
            await self.channel_layer.group_discard(self.room_group, self.channel_name)

            # Mark offline
            await mark_user_offline(user)

            # Send presence update to others
            try:
                pids = await get_participant_ids(conv_id)
            except Exception as e:
                logger.error(f"Failed to get participants for conversation {conv_id}: {e}")
                return

            for pid in pids:
                if str(pid) != str(user.id):
                    await self.channel_layer.group_send(
                        f"user_{pid}",
                        {
                            "type": "presence_update",
                            "user_id": str(user.id),
                            "is_online": False,
                        },
                    )

        except Exception as e:
            logger.exception(f"Error in disconnect handler: {e}")

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            typ = data.get("type")

            if typ in ("send_message", "chat_message"):
                await self.handle_chat_message(data)
            elif typ == "typing":
                await self.handle_typing(data)
            elif typ == "read_receipt":
                await self.handle_read_receipt(data)
        except Exception as e:
            logger.error(f"Exception in receive: {e}", exc_info=True)
            # Optionally, send error to client or just log
            # await self.send_json({"type": "error", "detail": str(e)})

    async def handle_chat_message(self, data):
        try:
            user = self.scope["user"]
            content = data.get("content", "").strip()
            temp_id = data.get("temp_id")
            message_type = data.get("message_type", "text")

            # Optional: for image/file
            attachment_data = data.get("attachment")

            if message_type == "text" and not content:
                return

            if message_type in ("image", "file") and not attachment_data:
                return  # malformed

            # Choose message creation path
            if message_type in ("image", "file"):
                msg = await create_message_with_attachment(
                    self.conversation_id,
                    str(user.id),
                    content,
                    message_type,
                    attachment_data
                )
            else:
                msg = await create_message(
                    self.conversation_id,
                    str(user.id),
                    content,
                    message_type,
                )

            if not msg:
                return

            serialized = await serialize_message(msg)

            # Broadcast
            await self.channel_layer.group_send(
                self.room_group,
                {
                    "type": "chat.message",
                    "message": serialized,
                    "temp_id": temp_id,
                },
            )

            # Update conversation preview for all participants
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

            # Send message status to sender
            await self.channel_layer.group_send(
                f"user_{user.id}",
                {
                    "type": "message.status",
                    "message_id": str(msg.id),
                    "status": "sent",
                },
            )
        except Exception as e:
            logger.error(f"Exception in handle_chat_message: {e}", exc_info=True)



    async def handle_typing(self, data):
        user = self.scope["user"]
        await self.channel_layer.group_send(
            self.room_group,
            {
                "type": "typing.indicator",
                "user_id": str(user.id),
                "username": user.username,
                "sender_channel_name": self.channel_name,
            },
        )


    async def handle_read_receipt(self, data):
        mid = data.get("message_id")
        user = self.scope["user"]
        from messaging.models import Message
        try:
            msg = await sync_to_async(Message.objects.get)(id=mid)
        except Message.DoesNotExist:
            logger.warning(f"[WS] read_receipt: Message {mid} does not exist.")
            return
        if str(msg.recipient.id) != str(user.id):
            logger.warning(f"[WS] read_receipt: User {user.id} is not recipient of message {mid}.")
            return
        logger.info(f"[WS] read_receipt: User {user.id} marking message {mid} as read.")
        await mark_message_read(mid)
        sender_id = str(msg.sender.id)
        await self.channel_layer.group_send(
            f"user_{sender_id}",
            {
                "type": "message.status",
                "message_id": mid,
                "status": "read",
            },
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

        await self.channel_layer.group_send(
            f"user_{message_data['sender']['id']}",
            {
                "type": "message.status",
                "message_id": message_data["id"],
                "status": "delivered",
            },
        )


        response_data = {
            "type": "new_message",
            "message": message_data
        }

        if temp_id:
            response_data["temp_id"] = temp_id

        await self.send_json(response_data)


    async def presence_update(self, event):
        await self.send_json({
            "type": "presence_update",
            "user_id": event["user_id"],
            "is_online": event["is_online"]
        })

    async def typing_indicator(self, event):
        # 👇 This line is crucial — make sure it's here:
        if self.channel_name != event.get("sender_channel_name"):
            await self.send_json({
                "type": "typing",
                "user_id": event["user_id"],
                "username": event["username"],
            })




    async def conversation_update(self, event):
        await self.send_json(
            {
                "type": "conversation_update",
                "conversation_id": event["conversation_id"],
                "last_message": event["last_message"],
            }
        )

    async def message_status(self, event):
        await self.send_json({
            "type": "message_status",
            "message_id": event["message_id"],
            "status": event["status"],
        })