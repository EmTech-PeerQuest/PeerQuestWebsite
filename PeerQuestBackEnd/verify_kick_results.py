#!/usr/bin/env python
"""
Quick verification of the kick functionality results.
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

print("Checking kick functionality results...")

# Check the application that was kicked
kicked_apps = Application.objects.filter(status='kicked')
print(f"Kicked applications: {kicked_apps.count()}")

for app in kicked_apps:
    print(f"  - {app.applicant.username} -> {app.quest.title} (kicked by {app.reviewed_by.username})")
    
    # Check if participant was removed from quest
    participants = QuestParticipant.objects.filter(quest=app.quest, user=app.applicant)
    print(f"    Remaining participants for this user in the quest: {participants.count()}")
    
    # Check quest status
    print(f"    Quest status: {app.quest.status}")
    
    # Check remaining approved applications for this quest
    approved_apps = Application.objects.filter(quest=app.quest, status='approved')
    print(f"    Remaining approved applications for this quest: {approved_apps.count()}")

print("\n✅ Kick functionality verification complete!")
