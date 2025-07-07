#!/usr/bin/env python

import os
import sys
import django

# Add the project directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from quests.models import Quest, QuestParticipant

print("Quest and QuestParticipant status:")
print("\n--- Quests ---")
quests = Quest.objects.all()
for quest in quests:
    print(f"Quest: {quest.title} - Status: {quest.status}")
    participants = QuestParticipant.objects.filter(quest=quest)
    for participant in participants:
        print(f"  Participant: {participant.user.username} - Status: {participant.status} - Completed: {participant.completed_at}")

print(f"\nTotal quests: {Quest.objects.count()}")
print(f"Total participants: {QuestParticipant.objects.count()}")
print(f"Completed participants: {QuestParticipant.objects.filter(status='completed').count()}")
print(f"Completed quests: {Quest.objects.filter(status='completed').count()}")
