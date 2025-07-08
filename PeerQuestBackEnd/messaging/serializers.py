from rest_framework import serializers
from .models import Message, Conversation, MessageAttachment, UserPresence
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    is_online = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'avatar', 'is_online']
    
    def get_is_online(self, obj):
        try:
            return obj.presence.is_online
        except UserPresence.DoesNotExist:
            return False
    
    def get_avatar(self, obj):
        if hasattr(obj, 'avatar') and obj.avatar:
            try:
                return obj.avatar.url
            except ValueError:
                return None
        return None

class MessageAttachmentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()
    
    class Meta:
        model = MessageAttachment
        fields = ['id', 'filename', 'file_size_human', 'content_type', 'file_url', 'thumbnail_url', 'is_image']
    
    def get_file_url(self, obj):
        return obj.file.url if obj.file else None
    
    def get_thumbnail_url(self, obj):
        return obj.thumbnail.url if obj.thumbnail else None

class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    receiver = UserSerializer(source='recipient', read_only=True)
    created_at = serializers.DateTimeField(source='timestamp', read_only=True)
    read = serializers.BooleanField(source='is_read', read_only=True)
    attachments = MessageAttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'sender', 'receiver', 'content', 'message_type', 'attachments', 'created_at', 'read']

class ConversationSerializer(serializers.ModelSerializer):
    participants = UserSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = ['id', 'participants', 'last_message', 'unread_count', 'is_group', 'name', 'updated_at']
    
    def get_last_message(self, obj):
        last_msg = obj.get_last_message()
        return last_msg.content if last_msg else ''
    
    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return Message.objects.filter(
                conversation=obj,
                recipient=request.user,
                is_read=False
            ).count()
        return 0
