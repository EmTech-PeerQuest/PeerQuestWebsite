"""
WebSocket URL routing for the PeerQuest application.
"""

from django.urls import re_path
from quests import consumers

websocket_urlpatterns = [
    re_path(r'ws/quests/$', consumers.QuestConsumer.as_asgi()),
    re_path(r'ws/applications/$', consumers.ApplicationConsumer.as_asgi()),
    re_path(r'ws/notifications/$', consumers.NotificationConsumer.as_asgi()),
]
