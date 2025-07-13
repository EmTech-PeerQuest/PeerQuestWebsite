from django.contrib import admin
from .models import Guild, GuildTag, GuildSocialLink, GuildMembership, GuildJoinRequest, GuildWarning


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


@admin.register(Guild)
class GuildAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'specialization', 'privacy', 'owner', 
        'member_count', 'warning_count', 'is_disabled', 'created_at', 'allow_discovery'
    ]
    list_filter = [
        'specialization', 'privacy', 'require_approval', 
        'allow_discovery', 'show_on_home_page', 'is_disabled', 'created_at'
    ]
    search_fields = ['name', 'description', 'owner__username']
    readonly_fields = ['guild_id', 'created_at', 'updated_at', 'member_count', 'warning_count']
    
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
        ('Moderation', {
            'fields': ('is_disabled', 'warning_count', 'disabled_at', 'disabled_by', 'disable_reason'),
            'classes': ('collapse',)
        }),
        ('Meta Information', {
            'fields': ('member_count', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [GuildTagInline, GuildSocialLinkInline, GuildMembershipInline]

    actions = ['re_enable_and_reset_warnings']

    def re_enable_and_reset_warnings(self, request, queryset):
        for guild in queryset:
            guild.enable_guild()
            guild.reset_warnings()
        self.message_user(request, f"Selected guilds have been re-enabled and their warnings reset.")
    re_enable_and_reset_warnings.short_description = "Re-enable selected guilds and reset warnings"


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


@admin.register(GuildWarning)
class GuildWarningAdmin(admin.ModelAdmin):
    list_display = ['guild', 'reason', 'issued_by', 'issued_at', 'dismissed_at', 'is_active']
    list_filter = ['issued_at', 'dismissed_at']
    search_fields = ['guild__name', 'reason', 'issued_by__username']
    readonly_fields = ['issued_at', 'dismissed_at']
    
    def is_active(self, obj):
        return obj.is_active()
    is_active.boolean = True
    is_active.short_description = 'Active'
