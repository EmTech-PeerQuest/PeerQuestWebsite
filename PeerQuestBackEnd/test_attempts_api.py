#!/usr/bin/env python
"""
Test the new application attempts API endpoint
"""
import requests
import json

def test_attempts_api():
    """Test the new attempts API endpoint"""
    print("=== TESTING ATTEMPTS API ENDPOINT ===\n")
    
    # Setup test environment
    import os
    import django
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
    django.setup()
    
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    # Create a test user with known attempts
    test_user = User.objects.get(username='app_test_user')
    print(f"Using test user: {test_user.username}")
    
    # Authenticate
    auth_response = requests.post('http://localhost:8000/api/token/', {
        'username': 'app_test_user',
        'password': 'testpass123'
    })
    
    if auth_response.status_code != 200:
        print(f"❌ Authentication failed: {auth_response.status_code}")
        print(auth_response.text)
        return
    
    token = auth_response.json()['access']
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    print(f"✅ Authentication successful")
    
    # Test the attempts endpoint
    quest_id = 4  # The quest that app_test_user has attempts on
    response = requests.get(f'http://localhost:8000/api/applications/check_attempts/?quest_id={quest_id}', 
                           headers=headers)
    
    print(f"\\nAttempts API Response:")
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Response Data:")
        print(json.dumps(data, indent=2))
        
        # Verify the data makes sense
        print(f"\\n📊 Analysis:")
        print(f"Quest ID: {data['quest_id']}")
        print(f"Attempts: {data['attempt_count']}/{data['max_attempts'] or 'unlimited'}")
        print(f"Can Apply: {data['can_apply']}")
        print(f"Reason: {data['reason']}")
        print(f"Last Status: {data['last_application_status']}")
        
    else:
        print(f"❌ API call failed")
        print(f"Response: {response.text}")

if __name__ == "__main__":
    test_attempts_api()
