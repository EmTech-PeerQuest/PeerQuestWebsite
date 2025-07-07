#!/usr/bin/env python
"""
Test script to simulate kicking the last participant from a quest
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from quests.models import Quest, QuestParticipant
from applications.models import Application
from django.contrib.auth import get_user_model

User = get_user_model()

def test_kick_last_participant():
    """Test kicking the last participant and verify quest status reverts to open"""
    print("=== TESTING KICK LAST PARTICIPANT ===\n")
    
    # Find a quest with participants to test with
    quest = Quest.objects.filter(status='in-progress').first()
    
    if not quest:
        print("No in-progress quests found to test with.")
        return
    
    print(f"Testing with Quest ID {quest.id}: '{quest.title}'")
    print(f"Current quest status: {quest.status}")
    
    # Find approved application to kick
    approved_app = Application.objects.filter(quest=quest, status='approved').first()
    
    if not approved_app:
        print("No approved applications found to kick.")
        # Let's check participants without approved applications
        participants = QuestParticipant.objects.filter(quest=quest, status__in=['joined', 'in_progress', 'completed'])
        print(f"Found {participants.count()} active participants without approved applications:")
        for p in participants:
            print(f"  - {p.user.username} (status: {p.status})")
        return
    
    print(f"Found approved application to kick: {approved_app.applicant.username}")
    
    # Check current state before kick
    print("\nBEFORE KICK:")
    print(f"  Quest status: {quest.status}")
    approved_apps = Application.objects.filter(quest=quest, status='approved')
    active_participants = QuestParticipant.objects.filter(quest=quest, status__in=['joined', 'in_progress', 'completed'])
    print(f"  Approved applications: {approved_apps.count()}")
    print(f"  Active participants: {active_participants.count()}")
    
    # Simulate kick by admin user
    admin_user = User.objects.filter(is_superuser=True).first()
    if not admin_user:
        admin_user = quest.creator
    
    print(f"\nKicking participant {approved_app.applicant.username} as user {admin_user.username}...")
    
    try:
        result = approved_app.kick(admin_user)
        print(f"Kick result: {result}")
        
        # Refresh quest from database
        quest.refresh_from_db()
        
        print("\nAFTER KICK:")
        print(f"  Quest status: {quest.status}")
        approved_apps = Application.objects.filter(quest=quest, status='approved')
        kicked_apps = Application.objects.filter(quest=quest, status='kicked')
        active_participants = QuestParticipant.objects.filter(quest=quest, status__in=['joined', 'in_progress', 'completed'])
        dropped_participants = QuestParticipant.objects.filter(quest=quest, status='dropped')
        print(f"  Approved applications: {approved_apps.count()}")
        print(f"  Kicked applications: {kicked_apps.count()}")
        print(f"  Active participants: {active_participants.count()}")
        print(f"  Dropped participants: {dropped_participants.count()}")
        
        # Check if quest should be open now
        should_be_open = (approved_apps.count() == 0 and active_participants.count() == 0)
        print(f"  Should quest be 'open'? {should_be_open}")
        
        if should_be_open and quest.status != 'open':
            print(f"  >>> ISSUE: Quest should be 'open' but is '{quest.status}'!")
        elif should_be_open and quest.status == 'open':
            print(f"  >>> SUCCESS: Quest correctly reverted to 'open' status!")
        
    except Exception as e:
        print(f"Error during kick: {e}")

if __name__ == "__main__":
    test_kick_last_participant()
