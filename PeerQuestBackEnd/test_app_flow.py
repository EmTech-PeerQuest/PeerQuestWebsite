#!/usr/bin/env python
import os
import sys
import django
import requests
import json

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
sys.path.append('.')
django.setup()

from django.contrib.auth import get_user_model
from quests.models import Quest
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

def get_auth_token(username):
    """Get JWT token for a user"""
    try:
        user = User.objects.get(username=username)
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    except User.DoesNotExist:
        return None

def test_application_flow():
    """Test the complete application flow"""
    
    # API base URL
    base_url = "http://localhost:8000/api"
    
    print("Testing Complete Application Flow...")
    
    # Get authentication token for student1
    token = get_auth_token('student1')
    if not token:
        print("Could not get auth token for student1")
        return
    
    print(f"✓ Got auth token for student1")
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
    
    # Test 1: Get applications made by student1
    try:
        response = requests.get(f"{base_url}/applications/my_applications/", headers=headers)
        print(f"✓ GET my_applications - Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"  Student1 has {data.get('count', 0)} applications")
    except Exception as e:
        print(f"✗ Error getting my applications: {e}")
    
    # Test 2: Get applications to admin's quests
    admin_token = get_auth_token('admin')
    if admin_token:
        admin_headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {admin_token}"
        }
        
        try:
            response = requests.get(f"{base_url}/applications/to_my_quests/", headers=admin_headers)
            print(f"✓ GET to_my_quests - Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"  Admin has {data.get('count', 0)} applications to their quests")
                if data.get('results'):
                    print(f"  Sample application: {data['results'][0]['applicant']['username']} applied to {data['results'][0]['quest']['title']}")
        except Exception as e:
            print(f"✗ Error getting applications to admin's quests: {e}")
    
    # Test 3: Try to create a new application
    admin_quest = Quest.objects.filter(creator__username='admin').first()
    if admin_quest:
        print(f"✓ Found quest to apply to: {admin_quest.title} (id: {admin_quest.id})")
        
        try:
            test_data = {
                "quest": admin_quest.id,
                "message": "Test application from API script"
            }
            
            response = requests.post(
                f"{base_url}/applications/",
                json=test_data,
                headers=headers
            )
            print(f"✓ POST application - Status: {response.status_code}")
            
            if response.status_code == 201:
                data = response.json()
                print(f"  Application created successfully!")
                print(f"  Quest: {data.get('quest')}, Message: {data.get('message')}")
            elif response.status_code == 400:
                error_data = response.json()
                print(f"  Application failed (expected if already applied): {error_data}")
            else:
                print(f"  Unexpected response: {response.text}")
            
        except Exception as e:
            print(f"✗ Error creating application: {e}")
    
    print("\n" + "="*50)
    print("Application Flow Test Complete!")

if __name__ == "__main__":
    test_application_flow()
