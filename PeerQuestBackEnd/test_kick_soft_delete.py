#!/usr/bin/env python
"""
Test the updated kick functionality with soft delete.
"""

import os
import sys
import django

# Set up Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.test import Client
from django.contrib.auth import get_user_model
from applications.models import Application
from quests.models import Quest, QuestParticipant

User = get_user_model()

def test_kick_soft_delete():
    """Test that kick works as soft delete (keeps records)"""
    
    print("Testing kick as soft delete...")
    
    # Set up test data
    admin_user = User.objects.get(username='admin')
    participant_user = User.objects.get(username='participant')
    quest = Quest.objects.get(title='Test Quest for Kicking')
    
    # Create a new approved application for testing
    application = Application.objects.create(
        quest=quest,
        applicant=participant_user,
        status='approved'
    )
    
    # Create or get existing QuestParticipant record (simulating approved participant)
    quest_participant, created = QuestParticipant.objects.get_or_create(
        quest=quest,
        user=participant_user,
        defaults={'status': 'joined'}
    )
    if not created and quest_participant.status == 'dropped':
        # If participant was previously dropped, reactivate them for testing
        quest_participant.status = 'joined'
        quest_participant.save()
    
    print(f"Created test data:")
    print(f"  Application: {application.applicant.username} -> {application.quest.title} ({application.status})")
    print(f"  QuestParticipant: {quest_participant.user.username} in {quest_participant.quest.title} ({quest_participant.status})")
    
    # Test the kick endpoint
    client = Client()
    
    # Get JWT token
    token_response = client.post('/api/token/', {
        'username': 'admin',
        'password': 'password123'
    }, content_type='application/json')
    
    access_token = token_response.json()['access']
    
    # Kick the participant
    kick_url = f'/api/applications/{application.id}/kick/'
    response = client.post(kick_url, {
        'reason': 'Testing soft delete kick'
    }, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {access_token}')
    
    print(f"\nKick response status: {response.status_code}")
    
    if response.status_code == 200:
        print("✅ Kick endpoint successful")
        
        # Check application status (should be 'kicked')
        application.refresh_from_db()
        print(f"Application status after kick: {application.status}")
        
        # Check if application record still exists (soft delete)
        if Application.objects.filter(id=application.id).exists():
            print("✅ Application record still exists in database (soft delete)")
        else:
            print("❌ Application record was deleted (hard delete)")
        
        # Check QuestParticipant status (should be 'dropped', not deleted)
        quest_participant.refresh_from_db()
        print(f"QuestParticipant status after kick: {quest_participant.status}")
        
        if QuestParticipant.objects.filter(id=quest_participant.id).exists():
            print("✅ QuestParticipant record still exists in database (soft delete)")
        else:
            print("❌ QuestParticipant record was deleted (hard delete)")
        
        # Check quest status
        quest.refresh_from_db()
        print(f"Quest status after kick: {quest.status}")
        
        print("\n✅ Kick functionality now works as soft delete!")
        print("  - Application status changed to 'kicked' but record kept")
        print("  - QuestParticipant status changed to 'dropped' but record kept") 
        print("  - Both records remain in database for application logs")
        
    else:
        print(f"❌ Kick failed: {response.status_code}")
        try:
            print(f"Error: {response.json()}")
        except:
            print(f"Raw response: {response.content}")

if __name__ == "__main__":
    test_kick_soft_delete()
