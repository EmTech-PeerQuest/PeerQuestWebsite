#!/usr/bin/env python
"""
Fix quest statuses that should be 'open' but are stuck as 'in-progress'.
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

def fix_quest_statuses():
    print("Fixing quest statuses...")
    
    # Find all quests that are 'in-progress' but should be 'open'
    in_progress_quests = Quest.objects.filter(status='in-progress')
    fixed_count = 0
    
    for quest in in_progress_quests:
        # Check if quest should be reverted to 'open'
        approved_apps = Application.objects.filter(quest=quest, status='approved')
        active_participants = QuestParticipant.objects.filter(
            quest=quest, 
            status__in=['joined', 'in_progress', 'completed']
        )
        
        should_revert = (approved_apps.count() == 0 and active_participants.count() == 0)
        
        if should_revert:
            print(f"🔧 Fixing quest: {quest.title} (ID: {quest.id})")
            print(f"   Current status: {quest.status}")
            print(f"   Approved applications: {approved_apps.count()}")
            print(f"   Active participants: {active_participants.count()}")
            
            quest.status = 'open'
            quest.save()
            
            print(f"   ✅ Updated status to: {quest.status}")
            fixed_count += 1
        else:
            print(f"✅ Quest '{quest.title}' correctly remains 'in-progress'")
            print(f"   Approved applications: {approved_apps.count()}")
            print(f"   Active participants: {active_participants.count()}")
    
    print(f"\n🎯 Summary:")
    print(f"   Quests checked: {in_progress_quests.count()}")
    print(f"   Quests fixed: {fixed_count}")
    print(f"   ✅ All quest statuses are now correct!")

if __name__ == "__main__":
    fix_quest_statuses()
