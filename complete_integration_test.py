#!/usr/bin/env python3
"""
Complete Frontend-Backend Guild Creation Test
Tests the end-to-end guild creation flow
"""

import requests
import time
import json

def test_backend_status():
    """Ensure backend is running and responsive"""
    print("🔧 Testing Backend Status...")
    
    try:
        response = requests.get("http://localhost:8000/api/guilds/", timeout=5)
        if response.status_code == 200:
            guilds = response.json()
            print(f"✅ Backend is running - {len(guilds)} guilds in database")
            return True
        else:
            print(f"❌ Backend returned status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend connection failed: {e}")
        return False

def test_frontend_status():
    """Ensure frontend is running and accessible"""
    print("🔧 Testing Frontend Status...")
    
    try:
        response = requests.get("http://localhost:3000", timeout=5)
        if response.status_code == 200:
            print("✅ Frontend is running on localhost:3000")
            
            # Test guild page specifically
            guild_response = requests.get("http://localhost:3000/guilds", timeout=5)
            if guild_response.status_code == 200:
                print("✅ Guild page is accessible at /guilds")
                return True
            else:
                print(f"❌ Guild page returned status {guild_response.status_code}")
                return False
        else:
            print(f"❌ Frontend returned status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Frontend connection failed: {e}")
        return False

def create_test_guild_via_api():
    """Create a test guild to verify the API works"""
    print("🧪 Creating Test Guild via API...")
    
    guild_data = {
        "name": f"API Test Guild {int(time.time())}",
        "description": "Created via direct API call for testing",
        "specialization": "development",
        "preset_emblem": "🧪",
        "privacy": "public",
        "welcome_message": "Welcome to our API test guild!",
        "require_approval": False,
        "minimum_level": 1,
        "allow_discovery": True,
        "show_on_home_page": True,
        "who_can_post_quests": "all_members",
        "who_can_invite_members": "all_members",
        "tags": ["api", "test"],
        "social_links": []
    }
    
    try:
        response = requests.post(
            "http://localhost:8000/api/guilds/create/",
            json=guild_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 201:
            result = response.json()
            print(f"✅ API guild creation successful!")
            print(f"   Guild: {result.get('name')}")
            print(f"   ID: {result.get('guild_id')}")
            return result.get('guild_id')
        else:
            print(f"❌ API guild creation failed: {response.status_code}")
            try:
                error = response.json()
                print(f"   Error: {error}")
            except:
                print(f"   Raw response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ API call failed: {e}")
        return None

def print_frontend_instructions():
    """Print instructions for manual frontend testing"""
    print("\n" + "="*60)
    print("🎯 MANUAL FRONTEND TESTING INSTRUCTIONS")
    print("="*60)
    
    print("""
📝 STEPS TO TEST FRONTEND GUILD CREATION:

1. 🌐 Open your browser and go to:
   http://localhost:3000/guilds

2. 🏰 You should see the Guild Hall with existing guilds

3. ➕ Click the "Create Guild" or "+" button to open the creation modal

4. 📋 Fill out the form:
   Step 1 - Basic Info:
   - Guild Name: "My Frontend Test Guild" 
   - Description: "Testing frontend to backend integration"
   - Specialization: Choose "Development"
   - Emblem: Keep default or choose another

   Step 2 - Settings:
   - Privacy: Select "Public" 
   - Enable "Allow Discovery"
   - Enable "Show on Home Page"
   - Set Minimum Level: 1

   Step 3 - Optional:
   - Add tags: "frontend", "test"
   - Add social links (optional)

5. ✅ Click "Create Guild" on the final step

6. 🎉 You should see:
   - Success message/toast
   - Guild appears in the guild list immediately
   - Page refreshes showing your new guild

7. ✔️ Verify the guild was saved by refreshing the page
   - Your guild should still be there
   - It should show correct member count (1)
   - All details should match what you entered

🚨 TROUBLESHOOTING:
- If creation fails, check browser console (F12) for errors
- Make sure both servers are running (see status above)
- Try refreshing the page and attempting again
""")

def run_complete_test():
    """Run all tests and provide comprehensive status"""
    print("🚀 COMPLETE FRONTEND-BACKEND INTEGRATION TEST")
    print("="*60)
    
    backend_ok = test_backend_status()
    frontend_ok = test_frontend_status()
    
    if backend_ok and frontend_ok:
        print("\n🔗 TESTING API INTEGRATION...")
        guild_id = create_test_guild_via_api()
        
        if guild_id:
            print("\n✅ SYSTEM STATUS: ALL SYSTEMS GO! 🚀")
            print(f"""
🎯 READY FOR FRONTEND TESTING:
   - Backend: ✅ Running (localhost:8000)
   - Frontend: ✅ Running (localhost:3000) 
   - API: ✅ Working (guild creation tested)
   - Database: ✅ Accepting new guilds

🎮 FRONTEND GUILD CREATION IS READY TO TEST!
""")
            print_frontend_instructions()
            return True
        else:
            print("\n❌ API integration has issues - check backend logs")
            return False
    else:
        print("\n❌ SYSTEM STATUS: Issues detected")
        if not backend_ok:
            print("   - Backend server needs to be started")
        if not frontend_ok:
            print("   - Frontend server needs to be started")
        return False

if __name__ == "__main__":
    success = run_complete_test()
    
    print("\n" + "="*60)
    if success:
        print("🎉 READY TO TEST! Open http://localhost:3000/guilds and create a guild!")
    else:
        print("❌ Fix the issues above before testing frontend guild creation")
    print("="*60)
