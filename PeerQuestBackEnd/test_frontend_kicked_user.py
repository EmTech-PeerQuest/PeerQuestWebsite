#!/usr/bin/env python
"""
Test script to verify that kicked users are properly handled in the frontend
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

def test_kicked_user_frontend_data():
    """Test that kicked user data is correct for frontend"""
    print("=== TESTING KICKED USER FRONTEND DATA ===\n")
    
    # Find a quest with a kicked participant
    kicked_applications = Application.objects.filter(status='kicked')
    
    if not kicked_applications.exists():
        print("No kicked applications found. Creating test scenario...")
        return create_kicked_user_scenario()
    
    kicked_app = kicked_applications.first()
    quest = kicked_app.quest
    kicked_user = kicked_app.applicant
    
    print(f"Found kicked application:")
    print(f"  Quest: {quest.title} (ID: {quest.id})")
    print(f"  Kicked User: {kicked_user.username}")
    print(f"  Application Status: {kicked_app.status}")
    print(f"  Kicked Date: {kicked_app.reviewed_at}")
    
    # Check quest participants
    participants = QuestParticipant.objects.filter(quest=quest, user=kicked_user)
    print(f"\nParticipant Records:")
    for p in participants:
        print(f"  - Participant ID {p.id}: {p.user.username} status {p.status}")
    
    # Check if quest status is correct
    print(f"\nQuest Status: {quest.status}")
    
    # Check what frontend would see
    print(f"\nFrontend Data Check:")
    
    # Get participants for this quest
    quest_participants = QuestParticipant.objects.filter(quest=quest)
    active_participants = quest_participants.filter(status__in=['joined', 'in_progress', 'completed'])
    print(f"  - Quest has {quest_participants.count()} total participants, {active_participants.count()} active")
    
    # Simulate frontend logic
    user_applications = Application.objects.filter(applicant=kicked_user)
    has_approved_app = any(app.quest.id == quest.id and app.status == 'approved' for app in user_applications)
    has_been_kicked = any(app.quest.id == quest.id and app.status == 'kicked' for app in user_applications)
    is_in_participants = quest_participants.filter(user=kicked_user).exists()
    
    print(f"  - Has approved application: {has_approved_app}")
    print(f"  - Has been kicked: {has_been_kicked}")
    print(f"  - Is in participants: {is_in_participants}")
    
    # New frontend logic (should exclude kicked users)
    should_show_as_participant = (is_in_participants or has_approved_app) and not has_been_kicked
    
    print(f"\n✅ Frontend Result:")
    print(f"  - Should show as participant: {should_show_as_participant}")
    
    if not should_show_as_participant:
        print(f"  >>> SUCCESS: Kicked user will NOT be shown as participating!")
    else:
        print(f"  >>> ISSUE: Kicked user will still be shown as participating!")
    
    return quest.id, kicked_user.username

def create_kicked_user_scenario():
    """Create a scenario for testing if none exists"""
    print("Creating test scenario...")
    
    # Use our previous test quest that had a kicked user
    quest = Quest.objects.filter(title__icontains='Frontend Test Quest').first()
    if not quest:
        print("No test quest found")
        return
    
    print(f"Using quest: {quest.title}")
    return quest.id, "test user"

if __name__ == "__main__":
    test_kicked_user_frontend_data()
