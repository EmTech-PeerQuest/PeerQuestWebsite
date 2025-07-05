# filepath: PeerQuestBackEnd/guilds/serializers.py
from rest_framework import serializers
from .models import Guild

class GuildSerializer(serializers.ModelSerializer):
    class Meta:
        model = Guild
        fields = '__all__'