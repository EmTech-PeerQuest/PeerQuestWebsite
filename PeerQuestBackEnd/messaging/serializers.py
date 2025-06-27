from rest_framework import serializers
from .models import Message

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['id', 'sender', 'recipient', 'content', 'timestamp', 'subject', 'is_read', 'sent_at', 'read_at']
        read_only_fields = ['id', 'sender', 'timestamp', 'sent_at', 'read_at']

class ConversationSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    participants = serializers.ListField(child=serializers.CharField())
    last_message = serializers.CharField()
    last_timestamp = serializers.DateTimeField()
