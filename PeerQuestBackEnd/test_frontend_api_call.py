#!/usr/bin/env python
"""
Test frontend-style API call to verify error handling
"""
import requests
import json

def test_frontend_api_call():
    """Test API call like the frontend would make it"""
    
    # Get the quest that user 'amry' has exhausted attempts on
    print("=== FRONTEND-STYLE API TEST ===\n")
    
    # First, get auth token for admin 
    auth_response = requests.post('http://localhost:8000/api/token/', {
        'username': 'admin',
        'password': 'admin123'  # Standard admin password
    })
    
    if auth_response.status_code == 200:
        auth_data = auth_response.json()
        access_token = auth_data['access']
        print(f"✅ Authentication successful for admin")
    else:
        print(f"❌ Authentication failed: {auth_response.status_code}")
        print(f"Response: {auth_response.text}")
        return
    
    # Find the quest that amry has 4 attempts on
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }
    
    # Try to apply to the quest (should fail)
    quest_id = 4  # Based on the previous output
    apply_response = requests.post('http://localhost:8000/api/applications/', 
        json={'quest': quest_id},
        headers=headers
    )
    
    print(f"Application Response Status: {apply_response.status_code}")
    print(f"Application Response Headers: {dict(apply_response.headers)}")
    
    try:
        response_data = apply_response.json()
        print(f"Application Response JSON:")
        print(json.dumps(response_data, indent=2))
        
        # Test what the updated frontend error handler would extract
        if 'non_field_errors' in response_data and isinstance(response_data['non_field_errors'], list):
            error_message = response_data['non_field_errors'][0]
            print(f"\\n🎯 Extracted Error Message: '{error_message}'")
            print(f"✅ This should be displayed to the user in the frontend!")
        else:
            print(f"\\n❌ No non_field_errors found in response")
            
    except Exception as e:
        print(f"❌ Could not parse JSON response: {e}")
        print(f"Response text: {apply_response.text}")

if __name__ == "__main__":
    test_frontend_api_call()
