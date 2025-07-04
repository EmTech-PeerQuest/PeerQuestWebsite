from rest_framework import serializers
from .models import Message
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    receiver = UserSerializer(source='recipient', read_only=True)
    created_at = serializers.DateTimeField(source='timestamp', read_only=True)
    read = serializers.BooleanField(source='is_read', read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'sender', 'receiver', 'content', 'created_at', 'read']
