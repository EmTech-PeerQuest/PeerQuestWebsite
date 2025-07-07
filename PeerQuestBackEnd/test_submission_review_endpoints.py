#!/usr/bin/env python
"""
Test submission review endpoints functionality.
"""
import os
import sys
import django
from django.test import Client
from django.contrib.auth import get_user_model
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.test import TestCase
from quests.models import Quest, QuestCategory, QuestParticipant, QuestSubmission
from applications.models import Application

User = get_user_model()

def test_submission_review_endpoints():
    """Test the approve and needs_revision endpoints"""
    
    # Create or get test users
    creator, created = User.objects.get_or_create(
        username='quest_creator_test',
        defaults={
            'email': 'creator_test@test.com',
            'password': 'testpass123'
        }
    )
    if created:
        creator.set_password('testpass123')
        creator.save()
    
    participant, created = User.objects.get_or_create(
        username='participant_test',
        defaults={
            'email': 'participant_test@test.com',
            'password': 'testpass123'
        }
    )
    if created:
        participant.set_password('testpass123')
        participant.save()
    
    # Create test category
    category, _ = QuestCategory.objects.get_or_create(
        name='Test Category for Review Testing',
        defaults={'description': 'Test category for review testing'}
    )
    
    # Create test quest
    quest = Quest.objects.create(
        title='Test Quest for Review',
        description='A test quest to verify submission review functionality',
        category=category,
        creator=creator,
        difficulty='initiate',
        xp_reward=100,
        gold_reward=50,
        status='in-progress'
    )
    
    # Create quest participant
    quest_participant = QuestParticipant.objects.create(
        quest=quest,
        user=participant,
        status='in_progress'
    )
    
    # Create submission
    submission = QuestSubmission.objects.create(
        quest_participant=quest_participant,
        description='My test submission',
        status='pending'
    )
    
    # Create application record (representing that user was approved to join)
    application = Application.objects.create(
        quest=quest,
        applicant=participant,
        status='approved',
        reviewed_by=creator
    )
    
    print(f"Created test data:")
    print(f"- Quest: {quest.title} (ID: {quest.id})")
    print(f"- Participant: {participant.username} (ID: {participant.id})")
    print(f"- Submission: {submission.id} (Status: {submission.status})")
    print(f"- Application: {application.id} (Status: {application.status})")
    
    # Test client
    client = Client()
    
    # Get JWT token for authentication
    token_response = client.post('/api/token/', {
        'username': 'quest_creator_test',
        'password': 'testpass123'
    })
    
    print(f"\nToken response status: {token_response.status_code}")
    if token_response.status_code == 200:
        token_data = token_response.json()
        access_token = token_data['access']
        print(f"Got access token")
    else:
        print(f"Failed to get token: {token_response.content}")
        return
    
    # Test approve endpoint
    print(f"\n=== Testing APPROVE endpoint ===")
    approve_url = f'/api/quests/submissions/{submission.id}/approve/'
    print(f"POST to: {approve_url}")
    
    approve_data = {'feedback': 'Great work! Approved.'}
    approve_response = client.post(
        approve_url,
        data=json.dumps(approve_data),
        content_type='application/json',
        HTTP_AUTHORIZATION=f'Bearer {access_token}'
    )
    
    print(f"Approve response status: {approve_response.status_code}")
    if approve_response.status_code == 200:
        response_data = approve_response.json()
        print(f"Approve response data: {response_data}")
    else:
        print(f"Approve response content: {approve_response.content}")
    
    # Check updated submission status
    submission.refresh_from_db()
    quest_participant.refresh_from_db()
    print(f"Updated submission status: {submission.status}")
    print(f"Updated participant status: {quest_participant.status}")
    print(f"Participant completed_at: {quest_participant.completed_at}")
    
    # Create a new submission to test needs_revision
    submission2 = QuestSubmission.objects.create(
        quest_participant=quest_participant,
        description='Another test submission',
        status='pending'
    )
    
    print(f"\n=== Testing NEEDS_REVISION endpoint ===")
    needs_revision_url = f'/api/quests/submissions/{submission2.id}/needs_revision/'
    print(f"POST to: {needs_revision_url}")
    
    needs_revision_data = {'feedback': 'Please revise this work.'}
    needs_revision_response = client.post(
        needs_revision_url,
        data=json.dumps(needs_revision_data),
        content_type='application/json',
        HTTP_AUTHORIZATION=f'Bearer {access_token}'
    )
    
    print(f"Needs revision response status: {needs_revision_response.status_code}")
    if needs_revision_response.status_code == 200:
        response_data = needs_revision_response.json()
        print(f"Needs revision response data: {response_data}")
    else:
        print(f"Needs revision response content: {needs_revision_response.content}")
    
    # Check updated submission status
    submission2.refresh_from_db()
    quest_participant.refresh_from_db()
    print(f"Updated submission2 status: {submission2.status}")
    print(f"Updated participant status: {quest_participant.status}")

if __name__ == '__main__':
    test_submission_review_endpoints()
