from django.urls import re_path
from .consumers import GuildChatConsumer
from .presence_consumer import PresenceConsumer
from django.urls import re_path

websocket_urlpatterns = [
    re_path(r"ws/guild/(?P<guild_id>[0-9a-f-]+)/$", GuildChatConsumer.as_asgi()),
    re_path(r"ws/presence/$", PresenceConsumer.as_asgi()),
]
