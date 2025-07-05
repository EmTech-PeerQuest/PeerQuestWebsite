# filepath: PeerQuestBackEnd/guilds/views.py
from rest_framework import generics
from .models import Guild
from .serializers import GuildSerializer
from rest_framework.parsers import MultiPartParser, FormParser


class GuildCreateView(generics.CreateAPIView):
    queryset = Guild.objects.all()
    serializer_class = GuildSerializer
    parser_classes = (MultiPartParser, FormParser)

# List all guilds
from rest_framework import generics
class GuildListView(generics.ListAPIView):
    queryset = Guild.objects.all()
    serializer_class = GuildSerializer