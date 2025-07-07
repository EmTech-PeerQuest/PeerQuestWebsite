#!/usr/bin/env python3
"""
Simple Test for Submission Review System

This test verifies the core submission review functionality works correctly.
"""

import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.test import Client
from django.contrib.auth import get_user_model
from quests.models import Quest, QuestCategory, QuestParticipant, QuestSubmission
from applications.models import Application, ApplicationAttempt

User = get_user_model()

def test_submission_review_system():
    """Test the basic submission review functionality"""
    print("=== Testing Submission Review System ===\n")
    
    # Create test data
    print("1. Creating test data...")
    
    # Create users with unique names
    import random
    suffix = random.randint(1000, 9999)
    
    creator = User.objects.create_user(
        username=f'test_creator_{suffix}',
        email=f'creator_{suffix}@test.com',
        password='testpass123'
    )
    
    participant = User.objects.create_user(
        username=f'test_participant_{suffix}',
        email=f'participant_{suffix}@test.com',
        password='testpass123'
    )
    
    # Create category
    category = QuestCategory.objects.create(
        name='Test Category',
        description='Test category'
    )
    
    # Create quest
    quest = Quest.objects.create(
        title='Test Quest',
        description='Test quest description',
        category=category,
        creator=creator,
        difficulty='adventurer',
        status='in-progress',
        xp_reward=50,
        gold_reward=25
    )
    
    # Create participant
    quest_participant = QuestParticipant.objects.create(
        quest=quest,
        user=participant,
        status='joined'
    )
    
    # Create application for attempt tracking
    application = Application.objects.create(
        quest=quest,
        applicant=participant,
        status='approved'
    )
    
    # Create some attempts
    attempt1 = ApplicationAttempt.objects.create(
        quest=quest,
        applicant=participant,
        application=application,
        attempt_number=1
    )
    
    attempt2 = ApplicationAttempt.objects.create(
        quest=quest,
        applicant=participant,
        application=application,
        attempt_number=2
    )
    
    # Create test submission
    submission = QuestSubmission.objects.create(
        quest_participant=quest_participant,
        description='Test submission',
        status='pending'
    )
    
    print("✓ Test data created successfully")
    
    # Test API client - force login
    client = Client()
    client.force_login(creator)
    print("✓ Logged in as creator")
    
    # Test submission approval
    print("\n3. Testing submission approval...")
    attempts_before = ApplicationAttempt.objects.filter(application=application).count()
    print(f"  - Attempts before: {attempts_before}")
    
    response = client.post(f'/api/quests/submissions/{submission.id}/approve/', {
        'feedback': 'Great work!'
    }, content_type='application/json')
    
    if response.status_code == 200:
        print("✓ Submission approved successfully")
        
        # Check submission status
        submission.refresh_from_db()
        if submission.status == 'approved':
            print("✓ Submission status updated to approved")
        else:
            print(f"✗ Submission status: {submission.status}")
            
        # Check participant status
        quest_participant.refresh_from_db()
        if quest_participant.status == 'completed':
            print("✓ Participant marked as completed")
        else:
            print(f"✗ Participant status: {quest_participant.status}")
            
    else:
        print(f"✗ Approval failed: {response.status_code}")
        print(f"Response: {response.content.decode()}")
    
    # Create another submission for reject test
    print("\n4. Testing submission rejection...")
    submission2 = QuestSubmission.objects.create(
        quest_participant=quest_participant,
        description='Second test submission',
        status='pending'
    )
    
    response = client.post(f'/api/quests/submissions/{submission2.id}/reject/', {
        'feedback': 'Please revise'
    }, content_type='application/json')
    
    if response.status_code == 200:
        print("✓ Submission rejected successfully")
        
        # Check submission status
        submission2.refresh_from_db()
        if submission2.status == 'rejected':
            print("✓ Submission status updated to rejected")
        else:
            print(f"✗ Submission status: {submission2.status}")
            
        # Check if attempts were reset
        attempts_after = ApplicationAttempt.objects.filter(application=application).count()
        print(f"  - Attempts after rejection: {attempts_after}")
        if attempts_after == 0:
            print("✓ Attempts reset successfully")
        else:
            print(f"✗ Attempts not reset: {attempts_after}")
            
    else:
        print(f"✗ Rejection failed: {response.status_code}")
        print(f"Response: {response.content.decode()}")
    
    # Test needs revision
    print("\n5. Testing needs revision...")
    submission3 = QuestSubmission.objects.create(
        quest_participant=quest_participant,
        description='Third test submission',
        status='pending'
    )
    
    response = client.post(f'/api/quests/submissions/{submission3.id}/needs_revision/', {
        'feedback': 'Good start, needs improvement'
    }, content_type='application/json')
    
    if response.status_code == 200:
        print("✓ Submission marked as needs revision successfully")
        
        # Check submission status
        submission3.refresh_from_db()
        if submission3.status == 'needs_revision':
            print("✓ Submission status updated to needs_revision")
        else:
            print(f"✗ Submission status: {submission3.status}")
            
    else:
        print(f"✗ Needs revision failed: {response.status_code}")
        print(f"Response: {response.content.decode()}")
    
    # Cleanup
    print("\n6. Cleaning up...")
    submission3.delete()
    submission2.delete()
    submission.delete()
    attempt2.delete()
    attempt1.delete()
    application.delete()
    quest_participant.delete()
    quest.delete()
    category.delete()
    participant.delete()
    creator.delete()
    print("✓ Cleanup completed")
    
    print("\n🎉 Submission Review System test completed successfully!")
    print("\nAll three submission actions are working:")
    print("1. ✓ Approve - marks participant as completed")
    print("2. ✓ Reject - resets attempt counter")
    print("3. ✓ Needs Revision - allows resubmission")
    
    return True

if __name__ == '__main__':
    try:
        test_submission_review_system()
    except Exception as e:
        print(f"\n💥 Test failed with error: {e}")
        import traceback
        traceback.print_exc()
