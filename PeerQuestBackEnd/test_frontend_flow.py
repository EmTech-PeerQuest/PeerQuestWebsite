#!/usr/bin/env python
import os
import django
import requests
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from guilds.models import Guild, GuildJoinRequest
from django.contrib.auth import get_user_model

User = get_user_model()

def test_frontend_flow():
    print("=== Testing Complete Frontend Flow ===")
    
    # Get the guild from the screenshot (dkahkd)
    try:
        guild = Guild.objects.get(name='dkahkd')
        print(f"✅ Found guild: {guild.name} (ID: {guild.guild_id})")
        print(f"   Requires approval: {guild.require_approval}")
        print(f"   Owner: {guild.owner.username}")
    except Guild.DoesNotExist:
        print("❌ Guild 'dkahkd' not found")
        return
    
    # Test with frontend_test_user
    username = 'frontend_test_user'
    password = 'testpass123'
    
    print(f"\n=== Testing API Flow for {username} ===")
    
    # 1. Login to get token
    login_response = requests.post('http://localhost:8000/api/token/', {
        'username': username,
        'password': password
    })
    
    if login_response.status_code == 200:
        token_data = login_response.json()
        access_token = token_data['access']
        print(f"✅ Login successful, token: {access_token[:50]}...")
        
        # 2. Try to join the guild
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        join_data = {'message': 'Test from frontend flow - wanna join'}
        
        join_response = requests.post(
            f'http://localhost:8000/api/guilds/{guild.guild_id}/join/',
            headers=headers,
            json=join_data
        )
        
        print(f"✅ Join request status: {join_response.status_code}")
        
        if join_response.status_code == 201:
            result = join_response.json()
            print(f"✅ Join request successful!")
            print(f"   Message: {result.get('message')}")
            if result.get('join_request'):
                print(f"   Join request ID: {result['join_request']['id']}")
            
            # 3. Check database
            user = User.objects.get(username=username)
            requests_count = GuildJoinRequest.objects.filter(guild=guild, user=user).count()
            print(f"✅ Join requests in database: {requests_count}")
            
            # 4. List all join requests for this guild
            all_requests = GuildJoinRequest.objects.filter(guild=guild)
            print(f"\n=== All Join Requests for {guild.name} ===")
            for req in all_requests:
                print(f"   ID: {req.id}, User: {req.user.username}, Status: {req.is_approved}, Message: '{req.message}'")
                
        else:
            print(f"❌ Join request failed: {join_response.text}")
    else:
        print(f"❌ Login failed: {login_response.status_code} - {login_response.text}")

if __name__ == "__main__":
    test_frontend_flow()
