#!/usr/bin/env python
"""
Test the fixed application attempt validation through the API
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

def test_api_application_attempts():
    """Test application attempts through the API (like frontend would)"""
    print("=== TESTING API APPLICATION ATTEMPTS ===\n")
    
    # Create test user and quest
    admin_user = User.objects.filter(is_superuser=True).first()
    test_user, created = User.objects.get_or_create(
        username='api_test_user',
        defaults={'email': 'apitest@example.com'}
    )
    if created:
        test_user.set_password('testpass123')
        test_user.save()
    
    quest = Quest.objects.create(
        title='API Test Quest - Rejection Limits',
        description='Test quest for API rejection limits',
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
    
    print(f"\n--- TESTING API APPLICATION LIMITS ---")
    
    # Test multiple applications through API
    for attempt in range(1, 6):
        print(f"\nAPI Attempt #{attempt}:")
        
        # Make API call to create application
        response = client.post('/api/applications/', {
            'quest': quest.id
        }, format='json')
        
        print(f"  Response status: {response.status_code}")
        
        if response.status_code == 201:
            # Success
            app_data = response.json()
            print(f"  ✅ Application created successfully")
            print(f"  Response data: {app_data}")
            
            # Find the created application
            app = Application.objects.filter(quest=quest, applicant=test_user).order_by('-applied_at').first()
            if app:
                print(f"  Application ID: {app.id}")
                # Reject the application for testing
                app.status = 'rejected'
                app.reviewed_by = admin_user
                app.save()
                print(f"  Application rejected for testing")
            else:
                print(f"  ❌ Could not find created application")
            
        elif response.status_code == 400:
            # Validation error (expected after 4 attempts)
            error_data = response.json()
            print(f"  ❌ Validation error: {error_data}")
            break
        else:
            print(f"  ❌ Unexpected response: {response.status_code}")
            print(f"  Response: {response.json()}")
    
    # Check final attempt count
    final_attempts = ApplicationAttempt.get_attempt_count(quest, test_user)
    print(f"\nFinal attempt count: {final_attempts}")
    
    # Test eligibility check
    can_apply, reason = ApplicationAttempt.can_apply_again(quest, test_user)
    print(f"Can apply again: {can_apply}")
    print(f"Reason: {reason}")
    
    # Test kicked user scenario
    print(f"\n--- TESTING KICKED USER UNLIMITED ATTEMPTS ---")
    
    kicked_user, created = User.objects.get_or_create(
        username='api_kicked_user',
        defaults={'email': 'apikicked@example.com'}
    )
    if created:
        kicked_user.set_password('testpass123')
        kicked_user.save()
    
    client.force_authenticate(user=kicked_user)
    
    # Test kicked user unlimited attempts
    for attempt in range(1, 4):  # Test 3 kicked attempts
        print(f"\nKicked user API attempt #{attempt}:")
        
        # Create application
        response = client.post('/api/applications/', {
            'quest': quest.id
        }, format='json')
        
        if response.status_code == 201:
            app_data = response.json()
            print(f"  ✅ Application created successfully")
            print(f"  Response data: {app_data}")
            
            # Find the created application
            app = Application.objects.filter(quest=quest, applicant=kicked_user).order_by('-applied_at').first()
            if app:
                print(f"  Application ID: {app.id}")
                # Approve then kick for testing
                app.status = 'approved'
                app.reviewed_by = admin_user
                app.save()
                app.kick(admin_user)
                print(f"  Application approved then kicked for testing")
            else:
                print(f"  ❌ Could not find created application")
            
        else:
            print(f"  ❌ Unexpected response: {response.status_code}")
            print(f"  Response: {response.json()}")
    
    # Check kicked user eligibility
    kicked_attempts = ApplicationAttempt.get_attempt_count(quest, kicked_user)
    can_kicked_apply, kicked_reason = ApplicationAttempt.can_apply_again(quest, kicked_user)
    
    print(f"\nKicked user attempts: {kicked_attempts}")
    print(f"Kicked user can apply: {can_kicked_apply}")
    print(f"Kicked user reason: {kicked_reason}")
    
    # Cleanup
    print(f"\n--- CLEANUP ---")
    quest.delete()
    if created:
        test_user.delete()
        kicked_user.delete()
    print("Test data cleaned up")

if __name__ == "__main__":
    test_api_application_attempts()
