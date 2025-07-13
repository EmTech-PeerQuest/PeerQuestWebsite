from channels.generic.websocket import AsyncJsonWebsocketConsumer

class PresenceConsumer(AsyncJsonWebsocketConsumer):
    active_users = set()

    async def connect(self):
        self.user = self.scope["user"]
        if not self.user.is_authenticated:
            await self.close()
            return
        await self.accept()
        PresenceConsumer.active_users.add(self.user.id)
        await self.channel_layer.group_add("presence", self.channel_name)
        await self.broadcast_presence(self.user.id, True)

    async def disconnect(self, close_code):
        if hasattr(self, "user") and self.user.is_authenticated:
            PresenceConsumer.active_users.discard(self.user.id)
            await self.broadcast_presence(self.user.id, False)
        await self.channel_layer.group_discard("presence", self.channel_name)

    async def broadcast_presence(self, user_id, is_online):
        await self.channel_layer.group_send(
            "presence",
            {
                "type": "presence_update",
                "user_id": str(user_id),
                "is_online": is_online,
            }
        )

    async def presence_update(self, event):
        await self.send_json({
            "type": "presence_update",
            "user_id": event["user_id"],
            "is_online": event["is_online"],
        })
