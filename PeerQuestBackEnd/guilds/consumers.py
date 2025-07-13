import json
import uuid
from datetime import datetime, timezone

from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from guilds.models import Guild
from guilds.models import GuildMembership

User = get_user_model()

class GuildChatConsumer(AsyncJsonWebsocketConsumer):
    # Maintain online users per guild in memory (not persistent, resets on server restart)
    online_users_per_guild = {}

    async def connect(self):
        self.guild_id = self.scope['url_route']['kwargs']['guild_id']
        self.user = self.scope["user"]

        if not self.user.is_authenticated:
            await self.close()
            return

        self.group_name = f"guild_{self.guild_id}"

        is_member = await self.is_guild_member(self.user.id, self.guild_id)
        if not is_member:
            await self.close()
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        # Add user to online set for this guild
        online_set = GuildChatConsumer.online_users_per_guild.setdefault(self.guild_id, set())
        online_set.add(str(self.user.id))

        # Send the current online users list to the newly connected user
        await self.send_json({
            "type": "online_users",
            "user_ids": list(online_set),
        })

        # Broadcast presence update for this user
        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "presence_update",
                "user_id": str(self.user.id),
                "is_online": True,
            }
        )

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
        # Remove user from online set for this guild
        online_set = GuildChatConsumer.online_users_per_guild.setdefault(self.guild_id, set())
        online_set.discard(str(self.user.id))
        # Broadcast presence update for this user
        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "presence_update",
                "user_id": str(self.user.id),
                "is_online": False,
            }
        )

    async def presence_update(self, event):
        await self.send_json({
            "type": "presence_update",
            "user_id": event["user_id"],
            "is_online": event["is_online"],
        })

    async def receive_json(self, content):
        try:
            msg_type = content.get("type")

            if msg_type == "send_message":
                content_text = content.get("content", "").strip()

                # Save to DB and get the message instance
                message_instance = await self.save_guild_message_instance(content_text)

                # Serialize the message using DRF serializer for consistency
                from guilds.serializers import GuildChatMessageSerializer
                serializer = GuildChatMessageSerializer(message_instance)
                serialized_message = serializer.data

                await self.channel_layer.group_send(
                    self.group_name,
                    {
                        "type": "new_message",
                        "message": serialized_message,
                    }
                )
        except Exception as e:
            await self.send_json({
                "type": "error",
                "error": str(e)
            })

    async def new_message(self, event):
        await self.send_json({
            "type": "new_message",
            "message": event["message"]
        })

    @database_sync_to_async
    def is_guild_member(self, user_id, guild_id):
        try:
            print("🔍 Checking membership for user_id=", user_id, "guild_id=", guild_id)
            match = GuildMembership.objects.filter(
                guild__guild_id=guild_id,
                user__id=user_id,
                status="approved",
                is_active=True
            ).exists()
            print("✅ Membership exists:", match)
            return match
        except Exception as e:
            print("❌ Error checking membership:", e)
            return False

    @database_sync_to_async
    def save_guild_message_instance(self, content_text):
        from guilds.models import GuildChatMessage, Guild
        guild = Guild.objects.get(guild_id=self.guild_id)
        message = GuildChatMessage.objects.create(
            guild=guild,
            sender=self.user,
            content=content_text,
        )
        return message
