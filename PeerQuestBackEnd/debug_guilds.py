#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from guilds.models import Guild, GuildJoinRequest, GuildMembership
from django.contrib.auth import get_user_model

User = get_user_model()

def debug_guild_state():
    print("=== GUILDS ===")
    guilds = Guild.objects.all()
    for guild in guilds:
        print(f"ID: {guild.guild_id}, Name: {guild.name}, Require Approval: {guild.require_approval}, Owner: {guild.owner}")

    print("\n=== USERS ===")
    users = User.objects.all()
    for user in users:
        print(f"ID: {user.id}, Username: {user.username}")

    print("\n=== JOIN REQUESTS ===")
    requests = GuildJoinRequest.objects.all()
    for req in requests:
        print(f"ID: {req.id}, Guild: {req.guild.name}, User: {req.user.username}, Approved: {req.is_approved}, Created: {req.created_at}")

    print("\n=== MEMBERSHIPS ===")
    memberships = GuildMembership.objects.all()
    for member in memberships:
        print(f"Guild: {member.guild.name}, User: {member.user.username}, Role: {member.role}, Active: {member.is_active}, Status: {member.status}")

if __name__ == "__main__":
    debug_guild_state()
