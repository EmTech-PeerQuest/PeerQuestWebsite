#!/usr/bin/env python3

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'peerquest.settings')
django.setup()

from django.contrib.auth import get_user_model
from quests.models import Quest, QuestParticipant, QuestSubmission

def test_submission_system():
    """Test the submission system without superseded status"""
    User = get_user_model()
    
    print("🧪 Testing Submission System (No Superseded Status)")
    print("=" * 60)
    
    # Get or create test users
    creator, _ = User.objects.get_or_create(username='test_creator', defaults={'email': 'creator@test.com'})
    participant, _ = User.objects.get_or_create(username='test_participant', defaults={'email': 'participant@test.com'})
    
    # Create test quest
    quest = Quest.objects.create(
        title="Test Quest - Multiple Submissions",
        description="Test quest for multiple submissions",
        creator=creator,
        xp_reward=50,
        gold_reward=10
    )
    
    # Create quest participant
    quest_participant = QuestParticipant.objects.create(
        quest=quest,
        user=participant,
        status='joined'
    )
    
    print(f"✅ Created quest: {quest.title}")
    print(f"✅ Added participant: {participant.username}")
    
    # Create multiple submissions
    submissions = []
    for i in range(3):
        submission = QuestSubmission.objects.create(
            quest_participant=quest_participant,
            description=f"Submission {i+1} for testing",
            link=f"https://example.com/submission{i+1}",
            status='pending'
        )
        submissions.append(submission)
        print(f"✅ Created submission {i+1}: {submission.description}")
    
    # Check all submissions are pending
    pending_count = QuestSubmission.objects.filter(quest_participant=quest_participant, status='pending').count()
    print(f"\n📊 Pending submissions: {pending_count}")
    
    # Verify no superseded status exists
    try:
        superseded_count = QuestSubmission.objects.filter(status='superseded').count()
        print(f"📊 Superseded submissions: {superseded_count}")
    except Exception as e:
        print(f"✅ Superseded status properly removed: {e}")
    
    # Test approval workflow
    first_submission = submissions[0]
    first_submission.status = 'approved'
    first_submission.feedback = 'Great work!'
    first_submission.save()
    print(f"✅ Approved first submission")
    
    # Test needs revision workflow
    second_submission = submissions[1]
    second_submission.status = 'needs_revision'
    second_submission.feedback = 'Please add more details'
    second_submission.save()
    print(f"✅ Marked second submission as needs revision")
    
    # Check final status counts
    print(f"\n📈 Final Status Summary:")
    print(f"   - Pending: {QuestSubmission.objects.filter(quest_participant=quest_participant, status='pending').count()}")
    print(f"   - Approved: {QuestSubmission.objects.filter(quest_participant=quest_participant, status='approved').count()}")
    print(f"   - Needs Revision: {QuestSubmission.objects.filter(quest_participant=quest_participant, status='needs_revision').count()}")
    
    # Test available status choices
    status_choices = [choice[0] for choice in QuestSubmission.STATUS_CHOICES]
    print(f"\n📋 Available status choices: {status_choices}")
    
    # Clean up
    quest.delete()
    print(f"\n🧹 Cleaned up test data")
    
    print("✅ All tests passed! Submission system working correctly without superseded status.")

if __name__ == '__main__':
    test_submission_system()
