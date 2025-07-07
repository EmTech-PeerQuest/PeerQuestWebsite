#!/usr/bin/env python
"""
Test the new check_attempts API endpoint
"""
import requests
import json

def test_check_attempts_api():
    """Test the check_attempts API endpoint"""
    print("=== TESTING CHECK_ATTEMPTS API ===\\n")
    
    # Set up test data
    import os
    import django
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
    django.setup()
    
    from quests.models import Quest
    from applications.models import Application, ApplicationAttempt
    from django.contrib.auth import get_user_model
    
    User = get_user_model()
    
    # Get existing test data
    user = User.objects.get(username='app_test_user')
    quest = Quest.objects.filter(title='Application Limit Test Quest').order_by('-id').first()
    
    print(f"Testing with user: {user.username}")
    print(f"Testing with quest: {quest.title} (ID: {quest.id})")
    
    # Authenticate
    auth_response = requests.post('http://localhost:8000/api/token/', {
        'username': 'app_test_user',
        'password': 'test123'
    })
    
    if auth_response.status_code == 200:
        token = auth_response.json()['access']
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        print(f"✅ Authenticated successfully")
    else:
        print(f"❌ Authentication failed: {auth_response.status_code}")
        return
    
    # Test the check_attempts endpoint
    response = requests.get(
        f'http://localhost:8000/api/applications/check_attempts/?quest_id={quest.id}',
        headers=headers
    )
    
    print(f"\\nAPI Response Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"API Response Data:")
        print(json.dumps(data, indent=2))
        
        # Verify the data structure matches what frontend expects
        expected_fields = ['quest_id', 'attempt_count', 'max_attempts', 'can_apply', 'reason', 'last_application_status']
        missing_fields = [field for field in expected_fields if field not in data]
        
        if missing_fields:
            print(f"❌ Missing fields: {missing_fields}")
        else:
            print(f"✅ All expected fields present")
            
        # Test data makes sense
        if data['attempt_count'] >= 0:
            print(f"✅ Attempt count is valid: {data['attempt_count']}")
        else:
            print(f"❌ Invalid attempt count: {data['attempt_count']}")
            
        if isinstance(data['can_apply'], bool):
            print(f"✅ can_apply is boolean: {data['can_apply']}")
        else:
            print(f"❌ can_apply is not boolean: {data['can_apply']}")
            
    else:
        print(f"❌ API call failed")
        print(f"Response: {response.text}")

if __name__ == "__main__":
    test_check_attempts_api()
