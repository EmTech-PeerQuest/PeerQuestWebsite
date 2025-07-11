#!/usr/bin/env python3
"""
Test script to verify guild creation API endpoint
"""
import requests
import json

# API endpoint
API_URL = "http://localhost:8000/api/guilds/create/"

# Test guild data
test_guild_data = {
    "name": "Test Guild from API",
    "description": "This is a test guild created via the API",
    "specialization": "development",
    "preset_emblem": "💻",
    "privacy": "public",
    "welcome_message": "Welcome to our test guild!",
    "require_approval": True,
    "minimum_level": 1,
    "allow_discovery": True,
    "show_on_home_page": True,
    "who_can_post_quests": "all_members",
    "who_can_invite_members": "all_members",
    "tags": ["test", "development"],
    "social_links": [
        {
            "platform_name": "Discord",
            "url": "https://discord.gg/testguild"
        }
    ]
}

def test_guild_creation():
    print("Testing guild creation...")
    print(f"POST to: {API_URL}")
    print(f"Data: {json.dumps(test_guild_data, indent=2)}")
    
    try:
        response = requests.post(
            API_URL,
            json=test_guild_data,
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"\nResponse Status: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 201:
            created_guild = response.json()
            print(f"\n✅ Guild created successfully!")
            print(f"Guild ID: {created_guild.get('guild_id')}")
            print(f"Guild Name: {created_guild.get('name')}")
            print(f"Full Response: {json.dumps(created_guild, indent=2)}")
        else:
            print(f"\n❌ Failed to create guild")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to Django server. Make sure it's running on port 8000.")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_guild_list():
    print("\n" + "="*50)
    print("Testing guild list...")
    
    try:
        response = requests.get("http://localhost:8000/api/guilds/")
        print(f"Response Status: {response.status_code}")
        
        if response.status_code == 200:
            guilds = response.json()
            print(f"✅ Found {len(guilds)} guilds")
            for guild in guilds:
                print(f"  - {guild.get('name')} (ID: {guild.get('guild_id')})")
        else:
            print(f"❌ Failed to get guilds: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("🧪 PeerQuest Guild API Test")
    print("="*50)
    
    # Test guild creation
    test_guild_creation()
    
    # Test guild list to see if our guild appears
    test_guild_list()
    
    print("\n" + "="*50)
    print("Test completed!")
