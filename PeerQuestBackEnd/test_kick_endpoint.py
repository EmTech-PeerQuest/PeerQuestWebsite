#!/usr/bin/env python
"""
Test the kick endpoint directly using Django's test client.
"""

import os
import sys
import django
from django.conf import settings

# Add the current directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.test import Client
from django.contrib.auth import get_user_model
from django.urls import reverse
from applications.models import Application
from quests.models import Quest
import json

User = get_user_model()

def test_kick_endpoint():
    """Test the kick endpoint functionality"""
    
    print("Testing kick endpoint...")
    
    # Get or create test users
    admin_user, created = User.objects.get_or_create(
        username='admin',
        defaults={'email': 'admin@test.com', 'is_staff': True}
    )
    admin_user.set_password('password123')
    admin_user.save()
    print("Ensured admin user has correct password")
    
    participant_user, created = User.objects.get_or_create(
        username='participant',
        defaults={'email': 'participant@test.com'}
    )
    participant_user.set_password('password123')
    participant_user.save()
    print("Ensured participant user has correct password")
    
    # Get or create a test quest
    quest, created = Quest.objects.get_or_create(
        title='Test Quest for Kicking',
        defaults={
            'description': 'A test quest to test the kick functionality',
            'creator': admin_user,
            'status': 'open',
            'xp_reward': 100
        }
    )
    if created:
        print("Created test quest")
    
    # Create an approved application to test kicking
    application, created = Application.objects.get_or_create(
        quest=quest,
        applicant=participant_user,
        defaults={'status': 'approved'}
    )
    if created:
        print("Created test application")
    elif application.status != 'approved':
        # Update to approved for testing
        application.status = 'approved'
        application.save()
        print("Updated application to approved status")
    
    print(f"Test setup complete:")
    print(f"  Quest: {quest.title} (ID: {quest.id})")
    print(f"  Application: {application.applicant.username} -> {quest.title} ({application.status})")
    print(f"  Application ID: {application.id}")
    
    # Test the endpoint
    client = Client()
    
    # Get JWT token for admin user
    token_response = client.post('/api/token/', {
        'username': 'admin',
        'password': 'password123'
    }, content_type='application/json')
    
    if token_response.status_code != 200:
        print(f"❌ Failed to get JWT token: {token_response.status_code}")
        try:
            error_data = token_response.json()
            print(f"Token error: {error_data}")
        except:
            print(f"Token error (raw): {token_response.content}")
        return False
    
    token_data = token_response.json()
    access_token = token_data['access']
    print("✅ Got JWT access token")
    
    # Test the kick endpoint with JWT authentication
    kick_url = f'/api/applications/{application.id}/kick/'
    print(f"Testing endpoint: {kick_url}")
    
    response = client.post(kick_url, {
        'reason': 'Testing the kick functionality'
    }, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {access_token}')
    
    print(f"Response status: {response.status_code}")
    
    if response.status_code == 200:
        print("✅ Kick endpoint responded successfully")
        response_data = response.json()
        print(f"Response: {response_data}")
        
        # Verify the application was kicked
        application.refresh_from_db()
        if application.status == 'kicked':
            print("✅ Application status updated to 'kicked'")
        else:
            print(f"❌ Application status is '{application.status}', expected 'kicked'")
            return False
            
    else:
        print(f"❌ Kick endpoint failed with status {response.status_code}")
        try:
            error_data = response.json()
            print(f"Error response: {error_data}")
        except:
            print(f"Error response (raw): {response.content}")
        return False
    
    print("\n✅ All kick endpoint tests passed!")
    return True

if __name__ == "__main__":
    test_kick_endpoint()
