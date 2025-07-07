#!/usr/bin/env python
"""
Final test to verify the frontend will receive and display the correct error
"""
import requests
import json

def test_frontend_error_display():
    """Test that the frontend will receive the correct error message"""
    print("=== FINAL FRONTEND ERROR TEST ===\\n")
    
    # Test with the user we set up who has 3/4 attempts
    username = 'app_test_user'
    password = 'test123'
    quest_id = 19  # From the setup script
    
    # 1. Authenticate
    auth_response = requests.post('http://localhost:8000/api/token/', {
        'username': username,
        'password': password
    })
    
    if auth_response.status_code == 200:
        token = auth_response.json()['access']
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        print(f"✅ Authenticated as {username}")
    else:
        print(f"❌ Authentication failed: {auth_response.status_code}")
        return
    
    # 2. Make the 4th application (should succeed)
    print(f"\\n🧪 Testing 4th application (should succeed)...")
    app_response = requests.post(f'http://localhost:8000/api/applications/', 
        json={'quest': quest_id},
        headers=headers
    )
    
    if app_response.status_code == 201:
        print(f"✅ 4th application succeeded")
        
        # 3. Reject this application (simulate admin action)
        # Get the application ID
        apps_response = requests.get(f'http://localhost:8000/api/applications/my_applications/', headers=headers)
        if apps_response.status_code == 200:
            apps = apps_response.json()['results']
            latest_app = apps[0]  # Most recent
            app_id = latest_app['id']
            
            # Reject as admin (using admin token)
            admin_auth = requests.post('http://localhost:8000/api/token/', {
                'username': 'admin',
                'password': 'admin123'
            })
            
            if admin_auth.status_code == 200:
                admin_token = admin_auth.json()['access']
                admin_headers = {
                    'Authorization': f'Bearer {admin_token}',
                    'Content-Type': 'application/json'
                }
                
                reject_response = requests.post(f'http://localhost:8000/api/applications/{app_id}/reject/', 
                    headers=admin_headers
                )
                
                if reject_response.status_code == 200:
                    print(f"✅ Application {app_id} rejected by admin")
                else:
                    print(f"❌ Failed to reject application: {reject_response.status_code}")
                    return
            else:
                print(f"❌ Admin authentication failed")
                return
        else:
            print(f"❌ Failed to get applications")
            return
    else:
        print(f"❌ 4th application failed: {app_response.status_code}")
        print(f"Response: {app_response.text}")
        return
    
    # 4. Try 5th application (should fail with proper error)
    print(f"\\n🧪 Testing 5th application (should fail with error)...")
    final_response = requests.post(f'http://localhost:8000/api/applications/', 
        json={'quest': quest_id},
        headers=headers
    )
    
    print(f"Response Status: {final_response.status_code}")
    
    if final_response.status_code == 400:
        try:
            error_data = final_response.json()
            print(f"Response JSON:")
            print(json.dumps(error_data, indent=2))
            
            # Simulate the frontend error extraction logic
            if 'non_field_errors' in error_data and isinstance(error_data['non_field_errors'], list):
                extracted_error = error_data['non_field_errors'][0]
                print(f"\\n🎯 FRONTEND WILL DISPLAY: '{extracted_error}'")
                
                if "Maximum application attempts" in extracted_error:
                    print(f"✅ SUCCESS: Frontend should now show the error message!")
                    print(f"✅ The toast notification will display: '{extracted_error}'")
                    print(f"✅ The apply button should be disabled with this message")
                else:
                    print(f"❌ Error message format unexpected")
            else:
                print(f"❌ Error format not as expected")
        except Exception as e:
            print(f"❌ Could not parse error: {e}")
    else:
        print(f"❌ Expected 400 error, got {final_response.status_code}")
        print(f"Response: {final_response.text}")

if __name__ == "__main__":
    test_frontend_error_display()
