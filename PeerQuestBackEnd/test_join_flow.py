#!/usr/bin/env python
import os
import django
import requests
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from guilds.models import Guild, GuildJoinRequest

User = get_user_model()

def test_join_request():
    print("=== Testing Join Request Flow ===")
    
    # Get or create test users
    try:
        test_user = User.objects.get(username='test_verified_user')
        print(f"Found existing test user: {test_user.username}")
    except User.DoesNotExist:
        test_user = User.objects.create_user(
            username='test_verified_user',
            email='test_verified@example.com',
            password='testpass123'
        )
        test_user.email_verified = True
        test_user.save()
        print(f"Created new verified test user: {test_user.username}")
    
    # Get a guild that requires approval
    guild = Guild.objects.filter(require_approval=True).first()
    if not guild:
        print("No guild found that requires approval!")
        return
    
    print(f"Testing with guild: {guild.name} (ID: {guild.guild_id})")
    print(f"Guild requires approval: {guild.require_approval}")
    print(f"Guild owner: {guild.owner}")
    
    # Get authentication token
    try:
        response = requests.post('http://localhost:8000/api/token/', {
            'username': 'test_verified_user',
            'password': 'testpass123'
        })
        
        if response.status_code == 200:
            auth_data = response.json()
            token = auth_data.get('access')
            print(f"Successfully authenticated. Token: {token[:50]}...")
            
            # Now try to join the guild
            headers = {
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json'
            }
            
            join_data = {'message': 'Test join request from script'}
            
            join_response = requests.post(
                f'http://localhost:8000/api/guilds/{guild.guild_id}/join/',
                headers=headers,
                json=join_data
            )
            
            print(f"Join request status: {join_response.status_code}")
            print(f"Join request response: {join_response.text}")
            
            # Check if join request was created in database
            join_requests = GuildJoinRequest.objects.filter(guild=guild, user=test_user)
            print(f"Join requests in database: {join_requests.count()}")
            for req in join_requests:
                print(f"  - Request ID: {req.id}, Approved: {req.is_approved}, Message: {req.message}")
                
        else:
            print(f"Authentication failed: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"Error during testing: {e}")

if __name__ == "__main__":
    test_join_request()
