#!/usr/bin/env python
"""
Test what error format the frontend receives when application attempts are exhausted
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from quests.models import Quest
from applications.models import Application, ApplicationAttempt
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
import json

User = get_user_model()

def test_frontend_error_format():
    """Test the exact error format that frontend receives"""
    print("=== TESTING FRONTEND ERROR FORMAT ===\n")
    
    # Create test user and quest
    admin_user = User.objects.filter(is_superuser=True).first()
    test_user, created = User.objects.get_or_create(
        username='error_format_test_user',
        defaults={'email': 'errortest@example.com'}
    )
    if created:
        test_user.set_password('testpass123')
        test_user.save()
    
    quest = Quest.objects.create(
        title='Error Format Test Quest',
        description='Test quest for error format',
        creator=admin_user,
        xp_reward=100,
        status='open',
        difficulty='easy'
    )
    
    print(f"Created test user: {test_user.username}")
    print(f"Created test quest: {quest.title} (ID: {quest.id})")
    
    # Setup API client
    client = APIClient()
    client.force_authenticate(user=test_user)
    
    # Exhaust the user's attempts
    for attempt in range(1, 5):  # 4 attempts
        response = client.post('/api/applications/', {
            'quest': quest.id
        }, format='json')
        
        if response.status_code == 201:
            app = Application.objects.filter(quest=quest, applicant=test_user).order_by('-applied_at').first()
            app.status = 'rejected'
            app.reviewed_by = admin_user
            app.save()
            print(f"Attempt {attempt}: Application created and rejected")
        else:
            print(f"Attempt {attempt}: Failed - {response.status_code}")
    
    # Now test the 5th attempt - this should fail
    print(f"\n--- TESTING 5TH ATTEMPT (SHOULD FAIL) ---")
    response = client.post('/api/applications/', {
        'quest': quest.id
    }, format='json')
    
    print(f"Response Status Code: {response.status_code}")
    print(f"Response Headers: {dict(response.items())}")
    
    try:
        response_data = response.json()
        print(f"Response JSON: {json.dumps(response_data, indent=2)}")
    except:
        print(f"Response Text: {response.content.decode()}")
    
    # Check response details
    content_type = response.get('Content-Type')
    print(f"Content-Type: {content_type}")
    
    # Cleanup
    quest.delete()
    if created:
        test_user.delete()
    print(f"\nTest data cleaned up")

if __name__ == "__main__":
    test_frontend_error_format()
