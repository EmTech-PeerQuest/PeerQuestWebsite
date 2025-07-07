#!/usr/bin/env python
"""
Debug the specific quest that's not reverting to 'open' status.
"""

import os
import sys
import django

# Set up Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from applications.models import Application
from quests.models import Quest, QuestParticipant

print("Debugging quest status reversion issue...")

# Find the quest that's still 'in-progress'
in_progress_quests = Quest.objects.filter(status='in-progress')
print(f"Quests with 'in-progress' status: {in_progress_quests.count()}")

for quest in in_progress_quests:
    print(f"\n🔍 Quest: {quest.title} (ID: {quest.id})")
    print(f"   Status: {quest.status}")
    
    # Check applications
    all_apps = Application.objects.filter(quest=quest)
    approved_apps = all_apps.filter(status='approved')
    kicked_apps = all_apps.filter(status='kicked')
    
    print(f"   Applications:")
    print(f"     Total: {all_apps.count()}")
    print(f"     Approved: {approved_apps.count()}")
    print(f"     Kicked: {kicked_apps.count()}")
    
    for app in all_apps:
        print(f"       - {app.applicant.username}: {app.status}")
    
    # Check quest participants  
    all_participants = QuestParticipant.objects.filter(quest=quest)
    active_participants = all_participants.filter(status__in=['joined', 'in_progress', 'completed'])
    dropped_participants = all_participants.filter(status='dropped')
    
    print(f"   Quest Participants:")
    print(f"     Total: {all_participants.count()}")
    print(f"     Active: {active_participants.count()}")
    print(f"     Dropped: {dropped_participants.count()}")
    
    for participant in all_participants:
        print(f"       - {participant.user.username}: {participant.status}")
    
    # Suggest what should happen
    should_revert = (approved_apps.count() == 0 and active_participants.count() == 0)
    print(f"\n   Should revert to 'open'? {should_revert}")
    if should_revert:
        print("   ❌ This quest should be 'open' but is still 'in-progress'")
        print("   This indicates the backend logic may have missed this case")
    else:
        print("   ✅ Quest correctly remains 'in-progress' due to active participants")

print(f"\n✅ Debug complete!")
