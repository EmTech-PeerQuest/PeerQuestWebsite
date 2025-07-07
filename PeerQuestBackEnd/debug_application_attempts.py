#!/usr/bin/env python
"""
Debug script to test application attempt validation in real scenario
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from quests.models import Quest
from applications.models import Application, ApplicationAttempt
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError

User = get_user_model()

def debug_application_attempts():
    """Debug application attempts with real data"""
    print("=== DEBUGGING APPLICATION ATTEMPTS ===\n")
    
    # Find existing users and quests
    users = User.objects.all()
    quests = Quest.objects.filter(status='open')
    
    if not users.exists() or not quests.exists():
        print("No users or open quests found")
        return
    
    user = users[0]
    quest = quests[0]
    
    print(f"Testing with User: {user.username}")
    print(f"Testing with Quest: {quest.title} (ID: {quest.id})")
    
    # Check existing applications
    existing_apps = Application.objects.filter(quest=quest, applicant=user)
    print(f"Existing applications: {existing_apps.count()}")
    
    for app in existing_apps:
        print(f"  - App ID {app.id}: {app.status} (applied: {app.applied_at})")
    
    # Check existing attempts
    existing_attempts = ApplicationAttempt.objects.filter(quest=quest, applicant=user)
    print(f"Existing attempts: {existing_attempts.count()}")
    
    for attempt in existing_attempts:
        print(f"  - Attempt #{attempt.attempt_number}: {attempt.timestamp}")
    
    # Test eligibility check
    can_apply, reason = ApplicationAttempt.can_apply_again(quest, user)
    print(f"\nCan apply: {can_apply}")
    print(f"Reason: {reason}")
    
    # Try to create a new application if possible
    if can_apply:
        print(f"\nTrying to create new application...")
        try:
            new_app = Application(
                quest=quest,
                applicant=user,
                status='pending'
            )
            new_app.clean()  # This should trigger validation
            new_app.save()   # This should record the attempt
            print(f"✅ Application created successfully: ID {new_app.id}")
            
            # Check if attempt was recorded
            new_attempts = ApplicationAttempt.objects.filter(quest=quest, applicant=user)
            print(f"Total attempts after creation: {new_attempts.count()}")
            
        except ValidationError as e:
            print(f"❌ Validation error: {e}")
        except Exception as e:
            print(f"❌ Other error: {e}")
    else:
        print(f"\n❌ Cannot apply: {reason}")
    
    # Test frontend API simulation
    print(f"\n--- TESTING FRONTEND API SIMULATION ---")
    
    # Simulate what happens when frontend calls createApplication
    print("Simulating frontend application creation...")
    
    try:
        # Check eligibility first (what frontend should do)
        can_apply, reason = ApplicationAttempt.can_apply_again(quest, user)
        print(f"Pre-check - Can apply: {can_apply}, Reason: {reason}")
        
        if can_apply:
            # Try to create application
            test_app = Application.objects.create(
                quest=quest,
                applicant=user,
                status='pending'
            )
            print(f"✅ API simulation successful: App ID {test_app.id}")
        else:
            print(f"❌ API simulation blocked: {reason}")
            
    except ValidationError as e:
        print(f"❌ API validation error: {e}")
    except Exception as e:
        print(f"❌ API other error: {e}")

if __name__ == "__main__":
    debug_application_attempts()
