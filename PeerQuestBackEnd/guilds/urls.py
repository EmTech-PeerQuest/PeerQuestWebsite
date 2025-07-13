from django.urls import path, include
from .views import (
    GuildListView, GuildDetailView, GuildCreateView, GuildUpdateView, 
    GuildDeleteView, MyGuildsView, GuildMembersView, join_guild, 
    leave_guild, guild_join_requests, process_join_request, kick_member,
    my_join_requests, update_member_role, warn_guild, disable_guild,
    enable_guild, dismiss_warning, guild_warnings, reset_warnings
)

app_name = 'guilds'

urlpatterns = [
    # Guild CRUD operations
    path('', GuildListView.as_view(), name='guild-list'),  # Guild Hall
    path('create/', GuildCreateView.as_view(), name='guild-create'),
    path('<uuid:guild_id>/', GuildDetailView.as_view(), name='guild-detail'),
    path('<uuid:guild_id>/update/', GuildUpdateView.as_view(), name='guild-update'),
    path('<uuid:guild_id>/delete/', GuildDeleteView.as_view(), name='guild-delete'),
    
    # User's guilds
    path('my-guilds/', MyGuildsView.as_view(), name='my-guilds'),
    
    # Guild membership
    path('<uuid:guild_id>/members/', GuildMembersView.as_view(), name='guild-members'),
    path('<uuid:guild_id>/join/', join_guild, name='join-guild'),
    path('<uuid:guild_id>/leave/', leave_guild, name='leave-guild'),
    path('<uuid:guild_id>/kick/<uuid:user_id>/', kick_member, name='kick-member'),
    path('<uuid:guild_id>/members/<uuid:user_id>/role/', update_member_role, name='update-member-role'),
    
    # Join requests management
    path('<uuid:guild_id>/join-requests/', guild_join_requests, name='guild-join-requests'),
    path('<uuid:guild_id>/join-requests/<int:request_id>/process/', 
         process_join_request, name='process-join-request'),
    
    # Guild moderation (admin only)
    path('<uuid:guild_id>/warn/', warn_guild, name='warn-guild'),
    path('<uuid:guild_id>/disable/', disable_guild, name='disable-guild'),
    path('<uuid:guild_id>/enable/', enable_guild, name='enable-guild'),
    path('<uuid:guild_id>/warnings/', guild_warnings, name='guild-warnings'),
    path('<uuid:guild_id>/warnings/<int:warning_id>/dismiss/', dismiss_warning, name='dismiss-warning'),
    path('<uuid:guild_id>/reset-warnings/', reset_warnings, name='reset-warnings'),
]
