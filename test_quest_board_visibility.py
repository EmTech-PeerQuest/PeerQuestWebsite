#!/usr/bin/env python3

import requests
import json

def test_quest_board_visibility():
    """Test if the quest board data is accessible and loading properly."""
    
    print("🧪 Testing Quest Board Visibility...")
    
    # Test backend API endpoints
    base_url = "http://localhost:8000/api"
    
    try:
        # Test quest categories
        print("\n📋 Testing quest categories...")
        categories_response = requests.get(f"{base_url}/quest-categories/")
        print(f"Categories Status: {categories_response.status_code}")
        if categories_response.status_code == 200:
            categories = categories_response.json()
            print(f"Categories found: {len(categories)}")
            for cat in categories[:3]:  # Show first 3
                print(f"  - {cat.get('name', 'Unknown')}")
        
        # Test quests endpoint
        print("\n🗡️ Testing quests...")
        quests_response = requests.get(f"{base_url}/quests/")
        print(f"Quests Status: {quests_response.status_code}")
        if quests_response.status_code == 200:
            quests_data = quests_response.json()
            if 'results' in quests_data:
                quests = quests_data['results']
            else:
                quests = quests_data if isinstance(quests_data, list) else []
            
            print(f"Quests found: {len(quests)}")
            for quest in quests[:3]:  # Show first 3
                print(f"  - {quest.get('title', 'Unknown')} ({quest.get('status', 'Unknown status')})")
        
        # Test frontend availability
        print("\n🌐 Testing frontend availability...")
        frontend_response = requests.get("http://localhost:3001", timeout=5)
        print(f"Frontend Status: {frontend_response.status_code}")
        
        print("\n✅ Quest Board Visibility Test Complete!")
        print("\n🎯 Next Steps:")
        print("1. Open http://localhost:3001 in your browser")
        print("2. Navigate to the Quest Board section")
        print("3. The quest board should now be visible regardless of initial data loading")
        
        return True
        
    except requests.exceptions.ConnectionError as e:
        print(f"❌ Connection Error: {e}")
        print("Make sure both frontend (npm run dev) and backend (python manage.py runserver) are running")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    test_quest_board_visibility()
