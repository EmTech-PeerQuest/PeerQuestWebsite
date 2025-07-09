#!/usr/bin/env python3
"""
Test Frontend Guild Creation
Simulates what the frontend should send to the backend API
"""

import requests
import json

def test_frontend_guild_creation():
    """Test guild creation from frontend perspective"""
    print("🎮 TESTING FRONTEND GUILD CREATION")
    print("=" * 50)
    
    # Data that frontend would send (matching the form fields)
    guild_data = {
        "name": "Frontend Test Guild",
        "description": "This guild was created from the frontend interface",
        "specialization": "development",
        "preset_emblem": "🖥️",
        "privacy": "public",
        "welcome_message": "Welcome to our frontend test guild!",
        "require_approval": False,
        "minimum_level": 1,
        "allow_discovery": True,
        "show_on_home_page": True,
        "who_can_post_quests": "all_members",
        "who_can_invite_members": "all_members",
        "tags": ["frontend", "testing"],
        "social_links": [
            {
                "platform_name": "GitHub",
                "url": "https://github.com/test"
            }
        ]
    }
    
    try:
        print(f"📤 Sending request to: http://localhost:8000/api/guilds/create/")
        print(f"📋 Data: {json.dumps(guild_data, indent=2)}")
        
        response = requests.post(
            "http://localhost:8000/api/guilds/create/",
            json=guild_data,
            headers={
                "Content-Type": "application/json"
            }
        )
        
        print(f"\n📥 Response Status: {response.status_code}")
        
        if response.status_code == 201:
            result = response.json()
            print("✅ SUCCESS! Guild created successfully!")
            print(f"   Guild ID: {result.get('guild_id')}")
            print(f"   Name: {result.get('name')}")
            print(f"   Owner: {result.get('owner', {}).get('user_name')}")
            print(f"   Tags: {result.get('tags', [])}")
            print(f"   Social Links: {len(result.get('social_links', []))}")
            return True
        else:
            print(f"❌ Failed with status {response.status_code}")
            try:
                error_data = response.json()
                print(f"   Error: {json.dumps(error_data, indent=2)}")
            except:
                print(f"   Raw response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_guild_list():
    """Test that the new guild appears in the list"""
    print("\n🔍 TESTING GUILD LIST RETRIEVAL")
    print("=" * 50)
    
    try:
        response = requests.get("http://localhost:8000/api/guilds/")
        
        if response.status_code == 200:
            guilds = response.json()
            print(f"✅ Retrieved {len(guilds)} guilds")
            
            # Find our test guild
            test_guild = None
            for guild in guilds:
                if guild.get('name') == "Frontend Test Guild":
                    test_guild = guild
                    break
            
            if test_guild:
                print("✅ Frontend Test Guild found in list!")
                print(f"   Description: {test_guild.get('description')}")
                print(f"   Members: {test_guild.get('member_count')}")
            else:
                print("❌ Frontend Test Guild not found in list")
                
            return True
        else:
            print(f"❌ Failed to get guild list: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 FRONTEND GUILD CREATION TEST")
    print("Testing the guild creation flow that the frontend will use")
    print()
    
    success = test_frontend_guild_creation()
    if success:
        test_guild_list()
    
    print("\n" + "=" * 50)
    if success:
        print("🎉 FRONTEND INTEGRATION READY!")
        print("The frontend can now successfully create guilds!")
    else:
        print("❌ Issues detected - check the output above")
