from rest_framework import serializers
from .models import Message, Conversation, MessageAttachment, UserPresence
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    is_online = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_online', 'avatar_url']
    
    def get_is_online(self, obj):
        try:
            return obj.presence.is_online
        except UserPresence.DoesNotExist:
            return False
    
    def get_avatar_url(self, obj):
        try:
            # Use avatar_url field (from Google OAuth or similar)
            avatar_url = getattr(obj, 'avatar_url', None)
            if avatar_url:
                return avatar_url
            username = getattr(obj, 'username', None) or 'U'
            return f'https://ui-avatars.com/api/?name={username}&background=8b75aa&color=fff&size=128'
        except Exception as e:
            print("get_avatar_url error:", e)
            return 'https://ui-avatars.com/api/?name=U&background=8b75aa&color=fff&size=128'


class MessageAttachmentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()
    
    class Meta:
        model = MessageAttachment
        fields = ['id', 'filename', 'file_size_human', 'content_type', 'file_url', 'thumbnail_url', 'is_image']
    
    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None

    def get_thumbnail_url(self, obj):
        request = self.context.get('request')
        if obj.thumbnail and request:
            return request.build_absolute_uri(obj.thumbnail.url)
        return None


class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    receiver = UserSerializer(source='recipient', read_only=True)
    created_at = serializers.DateTimeField(source='timestamp', read_only=True)
    timestamp = serializers.DateTimeField(read_only=True)  # ⬅ Add this explicitly
    read = serializers.BooleanField(source='is_read', read_only=True)
    status = serializers.CharField(read_only=True)  # ⬅ Add this for the chat bubble + message list
    attachments = MessageAttachmentSerializer(many=True, read_only=True)
    conversation_id = serializers.UUIDField(source='conversation.id', read_only=True)  # ⬅ Needed for grouping

    class Meta:
        model = Message
        fields = [
            'id',
            'conversation_id',  # ⬅ important
            'sender',
            'receiver',
            'content',
            'message_type',
            'attachments',
            'created_at',
            'timestamp',         # ⬅ ensure both are passed for compatibility
            'read',
            'status',            # ⬅ needed for MessageBubble ticks
        ]



class ConversationSerializer(serializers.ModelSerializer):
    participants = UserSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = ['id', 'participants', 'last_message', 'unread_count', 'is_group', 'name', 'updated_at']
    
    def get_last_message(self, obj):
        
        last_msg = obj.get_last_message()
        if last_msg:
            return MessageSerializer(last_msg, context=self.context).data
        return None

    
    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return Message.objects.filter(
                conversation=obj,
                recipient=request.user,
                is_read=False
            ).count()
        return 0
