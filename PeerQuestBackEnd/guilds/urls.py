from django.urls import path
from .views import (
    GuildListView, GuildDetailView, GuildCreateView, GuildUpdateView, 
    GuildDeleteView, MyGuildsView, GuildMembersView, join_guild, 
    leave_guild, guild_join_requests, process_join_request, kick_member,
    my_join_requests
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
    path('<uuid:guild_id>/kick/<int:user_id>/', kick_member, name='kick-member'),
    
    # Join requests management
    path('<uuid:guild_id>/join-requests/', guild_join_requests, name='guild-join-requests'),
    path('<uuid:guild_id>/join-requests/<int:request_id>/process/', 
         process_join_request, name='process-join-request'),
]
