#!/usr/bin/env python3
"""
Test guild creation through the frontend API
"""

import requests
import json
import time

# API endpoints
BACKEND_URL = "http://127.0.0.1:8000"
FRONTEND_URL = "http://localhost:3000"

def test_backend_guild_creation():
    """Test creating a guild directly through the backend API"""
    print("🔍 Testing backend guild creation...")
    
    # Test data
    guild_data = {
        "name": "Test Frontend Guild",
        "description": "A guild created to test frontend integration",
        "specialization": "research",  # Required field
        "max_members": 25,
        "is_public": True,
        "tags": ["test", "frontend"],
        "social_links": [
            {
                "platform_name": "discord",  # Correct field name
                "url": "https://discord.gg/testguild"
            }
        ]
    }
    
    try:
        # Create guild
        response = requests.post(
            f"{BACKEND_URL}/api/guilds/create/",  # Correct endpoint
            json=guild_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 201:
            guild = response.json()
            print(f"✅ Guild created successfully!")
            print(f"   Guild ID: {guild.get('guild_id')}")
            print(f"   Name: {guild.get('name')}")
            print(f"   Members: {guild.get('member_count', 0)}")
            return guild
        else:
            print(f"❌ Failed to create guild: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error testing backend: {e}")
        return None

def test_frontend_accessibility():
    """Test if the frontend is accessible"""
    print("🔍 Testing frontend accessibility...")
    
    try:
        response = requests.get(FRONTEND_URL, timeout=10)
        print(f"Frontend Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Frontend is accessible!")
            return True
        else:
            print(f"❌ Frontend returned {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Frontend not accessible: {e}")
        return False

def list_existing_guilds():
    """List existing guilds from backend"""
    print("🔍 Listing existing guilds...")
    
    try:
        response = requests.get(f"{BACKEND_URL}/api/guilds/")
        if response.status_code == 200:
            guilds = response.json()
            print(f"✅ Found {len(guilds)} existing guilds:")
            for guild in guilds:
                print(f"   - {guild.get('name')} (ID: {guild.get('guild_id')})")
            return guilds
        else:
            print(f"❌ Failed to list guilds: {response.text}")
            return []
    except Exception as e:
        print(f"❌ Error listing guilds: {e}")
        return []

def main():
    print("🚀 Testing Guild Creation Integration")
    print("=" * 50)
    
    # Test 1: Check frontend accessibility
    frontend_ok = test_frontend_accessibility()
    
    # Test 2: List existing guilds
    existing_guilds = list_existing_guilds()
    
    # Test 3: Test backend guild creation
    new_guild = test_backend_guild_creation()
    
    # Test 4: List guilds again to confirm creation
    if new_guild:
        print("\n🔍 Verifying guild was created...")
        time.sleep(1)  # Give a moment for any async operations
        updated_guilds = list_existing_guilds()
        
        if len(updated_guilds) > len(existing_guilds):
            print("✅ Guild creation confirmed!")
        else:
            print("⚠️ Guild may not have been persisted")
    
    print("\n" + "=" * 50)
    print("📋 Summary:")
    print(f"   Frontend Accessible: {'✅' if frontend_ok else '❌'}")
    print(f"   Backend Guild API: {'✅' if new_guild else '❌'}")
    print(f"   Guild Created: {'✅' if new_guild else '❌'}")
    
    if frontend_ok and new_guild:
        print("\n🎉 Integration test successful!")
        print("💡 To test guild creation from the frontend:")
        print(f"   1. Open {FRONTEND_URL}")
        print("   2. Navigate to the Guilds section")
        print("   3. Click 'Create Guild'")
        print("   4. Fill out the form and submit")
        print("   5. Check if the guild appears in the list")
    else:
        print("\n❌ Some tests failed - check the errors above")

if __name__ == "__main__":
    main()
