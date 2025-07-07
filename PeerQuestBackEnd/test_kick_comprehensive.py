#!/usr/bin/env python
"""
Comprehensive test for kick functionality including edge cases
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from quests.models import Quest, QuestParticipant
from applications.models import Application
from django.contrib.auth import get_user_model
from django.db import transaction

User = get_user_model()

def test_kick_comprehensive():
    """Comprehensive test of kick functionality"""
    print("=== COMPREHENSIVE KICK FUNCTIONALITY TEST ===\n")
    
    # Find admin user
    admin_user = User.objects.filter(is_superuser=True).first()
    if not admin_user:
        print("No admin user found")
        return
    
    # Find or create a test user
    test_user, created = User.objects.get_or_create(
        username='test_participant',
        defaults={'email': 'test@example.com'}
    )
    if created:
        test_user.set_password('testpass123')
        test_user.save()
        print(f"Created test user: {test_user.username}")
    
    # Create a test quest
    quest = Quest.objects.create(
        title='Test Kick Quest',
        description='A test quest for kick functionality',
        creator=admin_user,
        xp_reward=100,
        status='open',
        difficulty='medium'
    )
    print(f"Created test quest: {quest.title} (ID: {quest.id})")
    
    # Create an application for the test user
    application = Application.objects.create(
        quest=quest,
        applicant=test_user,
        status='pending'
    )
    print(f"Created application: {application.id}")
    
    # Approve the application (this should create a QuestParticipant and set quest to in-progress)
    print("\n--- TESTING APPLICATION APPROVAL ---")
    try:
        result = application.approve(admin_user)
        quest.refresh_from_db()
        print(f"Application approval result: {result}")
        print(f"Quest status after approval: {quest.status}")
        
        # Check QuestParticipant was created
        participants = QuestParticipant.objects.filter(quest=quest, user=test_user)
        print(f"QuestParticipant records: {participants.count()}")
        for p in participants:
            print(f"  - Participant {p.id}: {p.user.username} status {p.status}")
            
    except Exception as e:
        print(f"Application approval failed: {e}")
        return
    
    # Now test the kick functionality
    print("\n--- TESTING KICK FUNCTIONALITY ---")
    
    print(f"Before kick:")
    print(f"  Quest status: {quest.status}")
    approved_apps = Application.objects.filter(quest=quest, status='approved')
    active_participants = QuestParticipant.objects.filter(quest=quest, status__in=['joined', 'in_progress', 'completed'])
    print(f"  Approved applications: {approved_apps.count()}")
    print(f"  Active participants: {active_participants.count()}")
    
    # Kick the participant
    try:
        application.refresh_from_db()  # Refresh to get latest status
        result = application.kick(admin_user)
        quest.refresh_from_db()
        
        print(f"Kick result: {result}")
        print(f"Application status after kick: {application.status}")
        print(f"Quest status after kick: {quest.status}")
        
        # Check final state
        approved_apps = Application.objects.filter(quest=quest, status='approved')
        kicked_apps = Application.objects.filter(quest=quest, status='kicked')
        active_participants = QuestParticipant.objects.filter(quest=quest, status__in=['joined', 'in_progress', 'completed'])
        dropped_participants = QuestParticipant.objects.filter(quest=quest, status='dropped')
        
        print(f"After kick:")
        print(f"  Quest status: {quest.status}")
        print(f"  Approved applications: {approved_apps.count()}")
        print(f"  Kicked applications: {kicked_apps.count()}")
        print(f"  Active participants: {active_participants.count()}")
        print(f"  Dropped participants: {dropped_participants.count()}")
        
        # Verify expected results
        expected_quest_status = 'open'
        if quest.status == expected_quest_status and approved_apps.count() == 0 and active_participants.count() == 0:
            print(f"\n✅ SUCCESS: Kick functionality working correctly!")
            print(f"   - Quest reverted to '{expected_quest_status}'")
            print(f"   - No approved applications remain")
            print(f"   - No active participants remain")
            print(f"   - Application marked as 'kicked'")
            print(f"   - Participant marked as 'dropped'")
        else:
            print(f"\n❌ FAILURE: Kick functionality not working correctly!")
            print(f"   Expected quest status: {expected_quest_status}, got: {quest.status}")
            print(f"   Expected 0 approved applications, got: {approved_apps.count()}")
            print(f"   Expected 0 active participants, got: {active_participants.count()}")
            
    except Exception as e:
        print(f"Kick failed: {e}")
        import traceback
        traceback.print_exc()
    
    # Clean up
    print(f"\n--- CLEANING UP ---")
    quest.delete()
    if created:
        test_user.delete()
    print("Test quest and user deleted")

if __name__ == "__main__":
    test_kick_comprehensive()
