from django.contrib import admin
from .models import Conversation, Message, MessageAttachment, MessageReaction, UserPresence

@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ['id', 'is_group', 'name', 'participant_count', 'created_at', 'updated_at']
    list_filter = ['is_group', 'created_at']
    search_fields = ['name', 'participants__username']
    readonly_fields = ['id', 'created_at', 'updated_at']
    filter_horizontal = ['participants']
    date_hierarchy = 'created_at'
    ordering = ['-updated_at']

    def participant_count(self, obj):
        return obj.participants.count()
    participant_count.short_description = 'Participants'


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'sender', 'recipient', 'conversation', 'message_type', 'is_read', 'timestamp']
    list_filter = ['message_type', 'is_read', 'timestamp', 'priority']
    search_fields = ['content', 'sender__username', 'recipient__username']
    readonly_fields = ['id', 'timestamp', 'read_at']
    raw_id_fields = ['sender', 'recipient', 'conversation', 'reply_to']
    date_hierarchy = 'timestamp'
    ordering = ['-timestamp']


@admin.register(MessageAttachment)
class MessageAttachmentAdmin(admin.ModelAdmin):
    list_display = ['id', 'message', 'filename', 'content_type', 'file_size_human', 'uploaded_at']
    list_filter = ['content_type', 'uploaded_at']
    search_fields = ['filename', 'message__content']
    readonly_fields = ['id', 'uploaded_at', 'file_size_human']
    raw_id_fields = ['message']
    date_hierarchy = 'uploaded_at'
    ordering = ['-uploaded_at']


@admin.register(MessageReaction)
class MessageReactionAdmin(admin.ModelAdmin):
    list_display = ['id', 'message', 'user', 'reaction', 'created_at']
    list_filter = ['reaction', 'created_at']
    search_fields = ['user__username', 'message__content']
    readonly_fields = ['id', 'created_at']
    raw_id_fields = ['message', 'user']
    date_hierarchy = 'created_at'
    ordering = ['-created_at']


@admin.register(UserPresence)
class UserPresenceAdmin(admin.ModelAdmin):
    list_display = ['user', 'is_online', 'last_seen', 'last_activity']
    list_filter = ['is_online', 'last_seen']
    search_fields = ['user__username']
    readonly_fields = ['last_seen', 'last_activity']
    raw_id_fields = ['user']
    date_hierarchy = 'last_seen'
    ordering = ['-last_seen']
