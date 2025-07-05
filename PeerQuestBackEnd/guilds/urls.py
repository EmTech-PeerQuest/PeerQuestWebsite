# filepath: PeerQuestBackEnd/guilds/urls.py
from django.urls import path
from .views import GuildCreateView, GuildListView

urlpatterns = [
    path('guilds/', GuildListView.as_view(), name='guild-list'),
    path('guilds/create/', GuildCreateView.as_view(), name='guild-create'),
]