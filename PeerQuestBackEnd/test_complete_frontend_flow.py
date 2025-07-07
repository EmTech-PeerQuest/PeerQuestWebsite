#!/usr/bin/env python
"""
Test the complete frontend flow with a user who exhausts their attempts
"""
import requests
import json

def test_complete_frontend_flow():
    """Test the complete flow: create user, exhaust attempts, verify error"""
    
    print("=== COMPLETE FRONTEND FLOW TEST ===\n")
    
    base_url = 'http://localhost:8000/api'
    
    # 1. Create a test user through the API (if it doesn't exist)
    print("1. Setting up test user...")
    
    # Try to authenticate as admin first
    admin_auth = requests.post(f'{base_url}/token/', {
        'username': 'admin',
        'password': 'admin123'
    })
    
    if admin_auth.status_code != 200:
        print(f"❌ Admin auth failed: {admin_auth.status_code}")
        return
    
    admin_token = admin_auth.json()['access']
    admin_headers = {
        'Authorization': f'Bearer {admin_token}',
        'Content-Type': 'application/json'
    }
    
    # 2. Create a test quest
    print("2. Creating test quest...")
    quest_response = requests.post(f'{base_url}/quests/', 
        json={
            'title': 'Frontend Flow Test Quest',
            'description': 'A quest to test the frontend flow',
            'difficulty': 'easy',
            'xp_reward': 100,
            'status': 'open'
        },
        headers=admin_headers
    )
    
    if quest_response.status_code == 201:
        quest_data = quest_response.json()
        quest_id = quest_data['id']
        print(f"✅ Test quest created: ID {quest_id}")
    else:
        print(f"❌ Quest creation failed: {quest_response.status_code}")
        print(quest_response.text)
        return
    
    # 3. Create a test user (via Django shell since user creation API might not exist)
    import os
    import django
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
    django.setup()
    
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    test_user, created = User.objects.get_or_create(
        username='frontend_flow_test',
        defaults={
            'email': 'frontendtest@example.com',
            'password': 'testpass123'
        }
    )
    if created:
        test_user.set_password('testpass123')
        test_user.save()
        print(f"✅ Test user created: {test_user.username}")
    else:
        print(f"✅ Test user exists: {test_user.username}")
    
    # 4. Authenticate as the test user
    print("3. Authenticating as test user...")
    user_auth = requests.post(f'{base_url}/token/', {
        'username': 'frontend_flow_test',
        'password': 'testpass123'
    })
    
    if user_auth.status_code != 200:
        print(f"❌ User auth failed: {user_auth.status_code}")
        print(user_auth.text)
        return
    
    user_token = user_auth.json()['access']
    user_headers = {
        'Authorization': f'Bearer {user_token}',
        'Content-Type': 'application/json'
    }
    print(f"✅ User authenticated successfully")
    
    # 5. Apply to quest 4 times (exhaust attempts)
    print("4. Exhausting application attempts...")
    for attempt in range(1, 5):
        # Apply to quest
        apply_response = requests.post(f'{base_url}/applications/', 
            json={'quest': quest_id},
            headers=user_headers
        )
        
        if apply_response.status_code == 201:
            print(f"  Attempt {attempt}: ✅ Application created")
            
            # Get the application ID to reject it
            apps_response = requests.get(f'{base_url}/applications/my_applications/', headers=user_headers)
            if apps_response.status_code == 200:
                apps_data = apps_response.json()
                latest_app = apps_data['results'][0]  # Most recent first
                app_id = latest_app['id']
                
                # Reject the application (as admin)
                reject_response = requests.post(f'{base_url}/applications/{app_id}/reject/', 
                    headers=admin_headers
                )
                if reject_response.status_code == 200:
                    print(f"    Application {app_id} rejected")
                else:
                    print(f"    ❌ Failed to reject application: {reject_response.status_code}")
            
        else:
            print(f"  Attempt {attempt}: ❌ Failed - {apply_response.status_code}")
            print(f"    Response: {apply_response.text}")
    
    # 6. Try the 5th attempt (should fail)
    print("5. Testing 5th attempt (should fail)...")
    final_response = requests.post(f'{base_url}/applications/', 
        json={'quest': quest_id},
        headers=user_headers
    )
    
    print(f"Final Response Status: {final_response.status_code}")
    
    if final_response.status_code == 400:
        try:
            error_data = final_response.json()
            print(f"Final Response JSON:")
            print(json.dumps(error_data, indent=2))
            
            # Test the error extraction logic
            if 'non_field_errors' in error_data and isinstance(error_data['non_field_errors'], list):
                error_message = error_data['non_field_errors'][0]
                print(f"\\n🎯 EXTRACTED ERROR MESSAGE: '{error_message}'")
                print(f"✅ This error message should be displayed to the user!")
                
                if "Maximum application attempts" in error_message:
                    print(f"✅ Error message contains expected text")
                else:
                    print(f"❌ Error message doesn't contain expected text")
            else:
                print(f"❌ No non_field_errors found in response")
        except Exception as e:
            print(f"❌ Could not parse error response: {e}")
    else:
        print(f"❌ Expected 400 error, got {final_response.status_code}")
        print(f"Response: {final_response.text}")
    
    # 7. Cleanup
    print("\\n6. Cleaning up...")
    delete_response = requests.delete(f'{base_url}/quests/{quest_id}/', headers=admin_headers)
    if delete_response.status_code == 204:
        print(f"✅ Test quest deleted")
    
    if created:
        test_user.delete()
        print(f"✅ Test user deleted")

if __name__ == "__main__":
    test_complete_frontend_flow()
