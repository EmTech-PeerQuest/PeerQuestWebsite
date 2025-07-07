#!/usr/bin/env python
"""
Simple test to verify application attempt limits work
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

def test_simple_attempt_flow():
    """Simple test to verify the application attempt system works"""
    print("=== SIMPLE APPLICATION ATTEMPT TEST ===\\n")
    
    # Get admin user
    admin_user = User.objects.filter(is_superuser=True).first()
    if not admin_user:
        print("❌ No admin user found")
        return
    
    # Create or get test user
    test_user, created = User.objects.get_or_create(
        username='simple_test_user',
        defaults={'email': 'simpletest@example.com'}
    )
    if created:
        test_user.set_password('testpass123')
        test_user.save()
        print(f"✅ Created test user: {test_user.username}")
    else:
        print(f"✅ Using existing test user: {test_user.username}")
    
    # Create test quest
    quest = Quest.objects.create(
        title='Simple Test Quest - Application Attempts',
        description='Test quest for simple application attempts',
        creator=admin_user,
        xp_reward=100,
        status='open',
        difficulty='easy'
    )
    print(f"✅ Created test quest: {quest.title} (ID: {quest.id})")
    
    # Setup API client
    client = APIClient()
    client.force_authenticate(user=test_user)
    
    # Test 4 applications (should all succeed)
    for attempt in range(1, 5):
        print(f"\\nAttempt #{attempt}:")
        response = client.post('/api/applications/', {'quest': quest.id}, format='json')
        
        if response.status_code == 201:
            print(f"  ✅ Application created successfully")
            
            # Reject the application
            app = Application.objects.filter(quest=quest, applicant=test_user).order_by('-applied_at').first()
            app.status = 'rejected'
            app.reviewed_by = admin_user
            app.save()
            print(f"  Application {app.id} rejected for testing")
            
        else:
            print(f"  ❌ Application failed: {response.status_code}")
            try:
                error_data = response.json()
                print(f"  Error: {error_data}")
            except:
                print(f"  Error text: {response.content.decode()}")
    
    # Test 5th attempt (should fail)
    print(f"\\nAttempt #5 (should fail):")
    response = client.post('/api/applications/', {'quest': quest.id}, format='json')
    
    print(f"Response Status: {response.status_code}")
    
    if response.status_code == 400:
        try:
            error_data = response.json()
            print(f"Error Response:")
            print(json.dumps(error_data, indent=2))
            
            # Test error extraction like frontend would do
            if 'non_field_errors' in error_data and isinstance(error_data['non_field_errors'], list):
                extracted_error = error_data['non_field_errors'][0]
                print(f"\\n🎯 Frontend would extract: '{extracted_error}'")
                
                if "Maximum application attempts" in extracted_error:
                    print(f"✅ SUCCESS: Error message is correct and extractable!")
                    print(f"✅ The frontend should now display this error to the user")
                else:
                    print(f"❌ Error message doesn't contain expected text")
            else:
                print(f"❌ Error response doesn't have non_field_errors")
                
        except Exception as e:
            print(f"❌ Could not parse error response: {e}")
    else:
        print(f"❌ Expected 400 status, got {response.status_code}")
    
    # Check current attempt count
    attempt_count = ApplicationAttempt.get_attempt_count(quest, test_user)
    can_apply, reason = ApplicationAttempt.can_apply_again(quest, test_user)
    
    print(f"\\nFinal State:")
    print(f"  Attempt Count: {attempt_count}")
    print(f"  Can Apply: {can_apply}")
    print(f"  Reason: {reason}")
    
    # Cleanup
    quest.delete()
    if created:
        test_user.delete()
    print(f"\\n✅ Test completed and cleaned up")

if __name__ == "__main__":
    test_simple_attempt_flow()
