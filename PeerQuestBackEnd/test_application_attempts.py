#!/usr/bin/env python
"""
Test script for the new application attempt system
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from quests.models import Quest, QuestParticipant
from applications.models import Application, ApplicationAttempt
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError

User = get_user_model()

def test_application_attempts():
    """Test the new application attempt system"""
    print("=== TESTING APPLICATION ATTEMPT SYSTEM ===\n")
    
    # Find admin user
    admin_user = User.objects.filter(is_superuser=True).first()
    if not admin_user:
        print("No admin user found")
        return
    
    # Find or create a test user
    test_user, created = User.objects.get_or_create(
        username='test_applicant',
        defaults={'email': 'applicant@example.com'}
    )
    if created:
        test_user.set_password('testpass123')
        test_user.save()
        print(f"Created test user: {test_user.username}")
    
    # Create a test quest
    quest = Quest.objects.create(
        title='Application Attempts Test Quest',
        description='A test quest for application attempt limits',
        creator=admin_user,
        xp_reward=100,
        status='open',
        difficulty='medium'
    )
    print(f"Created test quest: {quest.title} (ID: {quest.id})")
    
    print("\n--- TESTING REJECTION LIMITS ---")
    
    # Test rejected user limits (should allow 4 total attempts)
    for attempt in range(1, 6):  # Try 5 attempts
        print(f"\nAttempt #{attempt}:")
        
        # Check if user can apply
        can_apply, reason = ApplicationAttempt.can_apply_again(quest, test_user)
        print(f"  Can apply: {can_apply}, Reason: {reason}")
        
        if not can_apply:
            print(f"  >>> Correctly blocked application attempt #{attempt}")
            break
        
        try:
            # Create application
            application = Application.objects.create(
                quest=quest,
                applicant=test_user,
                status='pending'
            )
            print(f"  Application created: ID {application.id}")
            
            # Check attempt count
            attempt_count = ApplicationAttempt.get_attempt_count(quest, test_user)
            print(f"  Total attempts recorded: {attempt_count}")
            
            # Reject the application (except maybe the last one)
            if attempt < 5:
                application.status = 'rejected'
                application.reviewed_by = admin_user
                application.save()
                print(f"  Application rejected")
            else:
                print(f"  Application left pending")
                
        except ValidationError as e:
            print(f"  >>> Validation error (expected): {e}")
            break
        except Exception as e:
            print(f"  Error: {e}")
    
    print("\n--- TESTING KICKED USER UNLIMITED ATTEMPTS ---")
    
    # Create another test user for kicked user test
    kicked_user, created = User.objects.get_or_create(
        username='test_kicked_user',
        defaults={'email': 'kicked@example.com'}
    )
    if created:
        kicked_user.set_password('testpass123')
        kicked_user.save()
        print(f"Created kicked test user: {kicked_user.username}")
    
    # Test kicked user (should allow unlimited attempts)
    for attempt in range(1, 6):  # Try 5 attempts
        print(f"\nKicked user attempt #{attempt}:")
        
        # Check if user can apply
        can_apply, reason = ApplicationAttempt.can_apply_again(quest, kicked_user)
        print(f"  Can apply: {can_apply}, Reason: {reason}")
        
        try:
            # Create application
            application = Application.objects.create(
                quest=quest,
                applicant=kicked_user,
                status='pending'
            )
            print(f"  Application created: ID {application.id}")
            
            # Approve then kick the user
            application.status = 'approved'
            application.reviewed_by = admin_user
            application.save()
            print(f"  Application approved")
            
            # Kick the user
            application.kick(admin_user)
            print(f"  User kicked")
            
            # Check attempt count
            attempt_count = ApplicationAttempt.get_attempt_count(quest, kicked_user)
            print(f"  Total attempts recorded: {attempt_count}")
            
        except ValidationError as e:
            print(f"  >>> Unexpected validation error: {e}")
            break
        except Exception as e:
            print(f"  Error: {e}")
            break
    
    # Final summary
    print(f"\n--- FINAL SUMMARY ---")
    
    # Check final attempt counts
    rejected_attempts = ApplicationAttempt.get_attempt_count(quest, test_user)
    kicked_attempts = ApplicationAttempt.get_attempt_count(quest, kicked_user)
    
    print(f"Rejected user attempts: {rejected_attempts}")
    print(f"Kicked user attempts: {kicked_attempts}")
    
    # Check final eligibility
    can_rejected_apply, rejected_reason = ApplicationAttempt.can_apply_again(quest, test_user)
    can_kicked_apply, kicked_reason = ApplicationAttempt.can_apply_again(quest, kicked_user)
    
    print(f"Rejected user can apply: {can_rejected_apply} ({rejected_reason})")
    print(f"Kicked user can apply: {can_kicked_apply} ({kicked_reason})")
    
    # Clean up
    print(f"\n--- CLEANING UP ---")
    quest.delete()
    if created:
        test_user.delete()
        kicked_user.delete()
    print("Test quest and users deleted")

if __name__ == "__main__":
    test_application_attempts()
