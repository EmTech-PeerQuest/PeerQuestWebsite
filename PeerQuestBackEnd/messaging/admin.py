from django.contrib import admin
from .models import Message, Conversation, MessageAttachment, MessageReaction

@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ('id', 'get_participants', 'created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('participants__username',)
    filter_horizontal = ('participants',)
    
    def get_participants(self, obj):
        return ", ".join([user.username for user in obj.participants.all()])
    get_participants.short_description = 'Participants'

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'sender', 'recipient', 'get_content_preview', 'message_type', 'timestamp', 'is_read')
    list_filter = ('is_read', 'message_type', 'priority', 'timestamp')
    search_fields = ('sender__username', 'recipient__username', 'content')
    ordering = ('-timestamp',)
    readonly_fields = ('timestamp', 'read_at')
    
    def get_content_preview(self, obj):
        return obj.get_preview(30)
    get_content_preview.short_description = 'Content Preview'

@admin.register(MessageAttachment)
class MessageAttachmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'message', 'filename', 'file_size_human', 'content_type', 'uploaded_at')
    list_filter = ('content_type', 'uploaded_at')
    search_fields = ('filename', 'message__content')

@admin.register(MessageReaction)
class MessageReactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'message', 'user', 'reaction', 'created_at')
    list_filter = ('reaction', 'created_at')
    search_fields = ('user__username', 'message__content')
