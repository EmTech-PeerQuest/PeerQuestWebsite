from rest_framework import serializers
from django.contrib.auth import get_user_model
from .guild_applications import GuildApplication
from guilds.models import Guild

User = get_user_model()

class GuildApplicationCreateSerializer(serializers.ModelSerializer):
    applicant = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = GuildApplication
        fields = ['guild', 'applicant', 'skills', 'experience', 'portfolio_url', 'statement_of_intent']

    def validate(self, data):
        guild = data['guild']
        applicant = data['applicant']
        if GuildApplication.objects.filter(guild=guild, applicant=applicant, status='pending').exists():
            raise serializers.ValidationError("You already have a pending application for this guild.")
        if guild.members.filter(id=applicant.id).exists():
            raise serializers.ValidationError("You are already a member of this guild.")
        return data

class GuildApplicationListSerializer(serializers.ModelSerializer):
    guild = serializers.StringRelatedField()
    applicant = serializers.StringRelatedField()
    class Meta:
        model = GuildApplication
        fields = ['id', 'guild', 'applicant', 'status', 'applied_at', 'reviewed_at', 'reviewed_by']

class GuildApplicationDetailSerializer(serializers.ModelSerializer):
    guild = serializers.StringRelatedField()
    applicant = serializers.StringRelatedField()
    reviewed_by = serializers.StringRelatedField()
    class Meta:
        model = GuildApplication
        fields = ['id', 'guild', 'applicant', 'skills', 'experience', 'portfolio_url', 'statement_of_intent', 'status', 'applied_at', 'reviewed_at', 'reviewed_by']
