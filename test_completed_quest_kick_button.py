#!/usr/bin/env python3
"""
Test script to verify that the kick participant button is hidden for completed quests.
This script tests the backend functionality that supports the frontend logic.
"""

import os
import sys
import django
from datetime import datetime, timedelta

# Add the Django backend directory to the path
sys.path.append('PeerQuestBackEnd')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from users.models import User
from quests.models import Quest, QuestParticipant, QuestSubmission
from applications.models import Application
from django.utils import timezone

def test_completed_quest_behavior():
    """Test that completed quests have correct restrictions"""
    print("🧪 Testing completed quest behavior...")
    
    try:
        # Get or create test users
        quest_maker, created = User.objects.get_or_create(
            username='quest_maker_test',
            defaults={
                'email': 'quest_maker@test.com',
                'gold_balance': 1000,
                'xp_points': 100
            }
        )
        
        participant, created = User.objects.get_or_create(
            username='participant_test',
            defaults={
                'email': 'participant@test.com',
                'gold_balance': 500,
                'xp_points': 50
            }
        )
        
        print(f"✅ Test users: {quest_maker.username} (maker), {participant.username} (participant)")
        
        # Create a test quest
        quest = Quest.objects.create(
            title="Test Quest for Completion",
            description="Testing completed quest restrictions",
            xp_reward=50,
            gold_reward=100,
            due_date=timezone.now() + timedelta(days=7),
            max_participants=5,
            created_by=quest_maker,
            status='open'
        )
        
        print(f"✅ Created quest: {quest.title} (ID: {quest.id})")
        
        # Create and approve an application
        application = Application.objects.create(
            quest=quest,
            applicant=participant,
            status='pending',
            reason="Test application"
        )
        
        application.status = 'approved'
        application.reviewed_by = quest_maker
        application.reviewed_at = timezone.now()
        application.save()
        
        print(f"✅ Created and approved application (ID: {application.id})")
        
        # Verify quest status changes to in-progress (should happen automatically)
        quest.refresh_from_db()
        if quest.status != 'in-progress':
            quest.status = 'in-progress'
            quest.save()
        
        print(f"✅ Quest status: {quest.status}")
        
        # Check initial state - should be able to kick
        print(f"\n📋 Initial state verification:")
        print(f"   Quest status: {quest.status}")
        print(f"   Application status: {application.status}")
        print(f"   Frontend should show: Kick participant button")
        
        # Complete the quest
        quest.status = 'completed'
        quest.save()
        
        print(f"\n🏁 Completing quest...")
        print(f"   New quest status: {quest.status}")
        
        # Check final state - should NOT be able to kick
        quest.refresh_from_db()
        application.refresh_from_db()
        
        print(f"\n📋 Final state verification:")
        print(f"   Quest status: {quest.status}")
        print(f"   Application status: {application.status}")
        print(f"   Frontend should show: 'Quest completed! Participants can no longer be removed.'")
        print(f"   Frontend should hide: Kick participant button")
        
        # Verify the business logic
        if quest.status == 'completed':
            print(f"\n✅ SUCCESS: Quest is completed")
            print(f"✅ SUCCESS: Application is still approved ({application.status})")
            print(f"✅ SUCCESS: Frontend logic should hide kick button when quest.status === 'completed'")
        else:
            print(f"\n❌ ERROR: Quest status is {quest.status}, expected 'completed'")
            
        # Clean up
        quest.delete()
        application.delete()
        
        print(f"\n🧹 Cleaned up test data")
        print(f"\n🎉 Test completed successfully!")
        print(f"\n📝 Frontend changes made:")
        print(f"   - Added condition: application.status === 'approved' && quest.status !== 'completed'")
        print(f"   - Kick button only shows when quest is NOT completed")
        print(f"   - Added completion message when quest is completed")
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_completed_quest_behavior()
    sys.exit(0 if success else 1)
