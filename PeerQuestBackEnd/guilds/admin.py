from django.contrib import admin
from .models import (
    Guild, GuildTag, GuildSocialLink,
    GuildMembership, GuildJoinRequest,
    GuildChatMessage,  # ✅ Import GuildChatMessage
)


class GuildTagInline(admin.TabularInline):
    model = GuildTag
    extra = 1
    max_num = 5


class GuildSocialLinkInline(admin.TabularInline):
    model = GuildSocialLink
    extra = 1


class GuildMembershipInline(admin.TabularInline):
    model = GuildMembership
    extra = 0
    readonly_fields = ['joined_at', 'approved_at', 'left_at']


class GuildChatMessageInline(admin.TabularInline):  # ✅ Optional: inline display of messages
    model = GuildChatMessage
    extra = 0
    readonly_fields = ['sender', 'content', 'created_at']
    show_change_link = True
    can_delete = True


@admin.register(Guild)
class GuildAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'specialization', 'privacy', 'owner', 
        'member_count', 'created_at', 'allow_discovery'
    ]
    list_filter = [
        'specialization', 'privacy', 'require_approval', 
        'allow_discovery', 'show_on_home_page', 'created_at'
    ]
    search_fields = ['name', 'description', 'owner__username']
    readonly_fields = ['guild_id', 'created_at', 'updated_at', 'member_count']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('guild_id', 'name', 'description', 'specialization', 'welcome_message', 'owner')
        }),
        ('Customization', {
            'fields': ('custom_emblem', 'preset_emblem'),
            'classes': ('collapse',)
        }),
        ('Guild Settings', {
            'fields': ('privacy', 'require_approval', 'minimum_level'),
        }),
        ('Visibility', {
            'fields': ('allow_discovery', 'show_on_home_page'),
        }),
        ('Permissions', {
            'fields': ('who_can_post_quests', 'who_can_invite_members'),
        }),
        ('Meta Information', {
            'fields': ('member_count', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    inlines = [
        GuildTagInline,
        GuildSocialLinkInline,
        GuildMembershipInline,
        GuildChatMessageInline  # ✅ Inline messages
    ]


@admin.register(GuildMembership)
class GuildMembershipAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'guild', 'role', 'status', 'is_active', 
        'joined_at', 'approved_by'
    ]
    list_filter = ['role', 'status', 'is_active', 'joined_at']
    search_fields = ['user__username', 'guild__name']
    readonly_fields = ['joined_at', 'approved_at', 'left_at']


@admin.register(GuildJoinRequest)
class GuildJoinRequestAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'guild', 'created_at', 'is_approved', 
        'processed_by', 'processed_at'
    ]
    list_filter = ['is_approved', 'created_at', 'processed_at']
    search_fields = ['user__username', 'guild__name']
    readonly_fields = ['created_at', 'processed_at']


@admin.register(GuildTag)
class GuildTagAdmin(admin.ModelAdmin):
    list_display = ['guild', 'tag']
    list_filter = ['tag']
    search_fields = ['guild__name', 'tag']


@admin.register(GuildSocialLink)
class GuildSocialLinkAdmin(admin.ModelAdmin):
    list_display = ['guild', 'platform_name', 'url', 'created_at']
    list_filter = ['platform_name', 'created_at']
    search_fields = ['guild__name', 'platform_name']


@admin.register(GuildChatMessage)
class GuildChatMessageAdmin(admin.ModelAdmin):
    list_display = ['guild', 'sender', 'short_content', 'created_at']
    list_filter = ['guild', 'created_at']
    search_fields = ['guild__name', 'sender__username', 'content']
    readonly_fields = ['guild', 'sender', 'content', 'created_at']
    ordering = ['-created_at']
    actions = ['export_as_csv']

    def short_content(self, obj):
        return (obj.content[:50] + '...') if len(obj.content) > 50 else obj.content
    short_content.short_description = 'Message'

    def export_as_csv(self, request, queryset):
        import csv
        from django.http import HttpResponse

        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = "attachment; filename=guild_chat_messages.csv"

        writer = csv.writer(response)
        writer.writerow(["Guild", "Sender", "Content", "Created At"])

        for msg in queryset:
            writer.writerow([msg.guild.name, msg.sender.username, msg.content, msg.created_at])

        return response
    export_as_csv.short_description = "Export Selected Messages as CSV"
