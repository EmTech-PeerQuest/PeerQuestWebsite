#!/usr/bin/env python
"""
Debug script to check quest status and participant/application relationships in detail.
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from quests.models import Quest, QuestParticipant
from applications.models import Application

def debug_quest_status():
    """Debug quest status and check for inconsistencies"""
    print("=== QUEST STATUS DEBUG ===\n")
    
    # Check all quests that are not 'open'
    non_open_quests = Quest.objects.exclude(status='open')
    
    print(f"Found {non_open_quests.count()} non-open quests:")
    for quest in non_open_quests:
        print(f"\nQuest ID {quest.id}: '{quest.title}'")
        print(f"  Current Status: {quest.status}")
        print(f"  Creator: {quest.creator.username}")
        
        # Check applications
        all_apps = Application.objects.filter(quest=quest)
        approved_apps = all_apps.filter(status='approved')
        kicked_apps = all_apps.filter(status='kicked')
        pending_apps = all_apps.filter(status='pending')
        rejected_apps = all_apps.filter(status='rejected')
        
        print(f"  Applications - Total: {all_apps.count()}, Approved: {approved_apps.count()}, Kicked: {kicked_apps.count()}, Pending: {pending_apps.count()}, Rejected: {rejected_apps.count()}")
        
        # List all applications
        for app in all_apps:
            print(f"    App ID {app.id}: {app.applicant.username} - {app.status} (applied: {app.applied_at.strftime('%Y-%m-%d %H:%M')})")
        
        # Check quest participants
        all_participants = QuestParticipant.objects.filter(quest=quest)
        active_participants = all_participants.filter(status__in=['joined', 'in_progress', 'completed'])
        dropped_participants = all_participants.filter(status='dropped')
        
        print(f"  Participants - Total: {all_participants.count()}, Active: {active_participants.count()}, Dropped: {dropped_participants.count()}")
        
        # List all participants
        for participant in all_participants:
            print(f"    Participant ID {participant.id}: {participant.user.username} - {participant.status} (joined: {participant.joined_at.strftime('%Y-%m-%d %H:%M')})")
        
        # Check if quest should be open
        should_be_open = (approved_apps.count() == 0 and active_participants.count() == 0 and quest.status in ['in-progress', 'assigned'])
        
        print(f"  Should be 'open'? {should_be_open}")
        if should_be_open:
            print(f"  >>> ISSUE: Quest should be 'open' but is '{quest.status}'!")
        
        print("-" * 60)

if __name__ == "__main__":
    debug_quest_status()
