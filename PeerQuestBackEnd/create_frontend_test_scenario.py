#!/usr/bin/env python
"""
Create a quest scenario for testing the frontend edit button behavior
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

def create_test_scenario():
    """Create a test scenario with a quest that should have an enabled edit button"""
    print("=== CREATING TEST SCENARIO FOR FRONTEND ===\n")
    
    # Find admin user
    admin_user = User.objects.filter(is_superuser=True).first()
    if not admin_user:
        print("No admin user found")
        return
    
    # Create a quest in 'open' status with no approved applications
    quest = Quest.objects.create(
        title='Frontend Test Quest - Edit Button Enabled',
        description='This quest should have an enabled edit button because it has no approved applications and is in open status.',
        creator=admin_user,
        xp_reward=150,
        status='open',
        difficulty='easy'
    )
    print(f"Created test quest: {quest.title} (ID: {quest.id})")
    print(f"Quest status: {quest.status}")
    print(f"Quest creator: {quest.creator.username}")
    
    # Check current applications
    apps = Application.objects.filter(quest=quest)
    approved_apps = apps.filter(status='approved')
    print(f"Total applications: {apps.count()}")
    print(f"Approved applications: {approved_apps.count()}")
    
    # Check participants
    participants = QuestParticipant.objects.filter(quest=quest)
    active_participants = participants.filter(status__in=['joined', 'in_progress', 'completed'])
    print(f"Total participants: {participants.count()}")
    print(f"Active participants: {active_participants.count()}")
    
    print(f"\n✅ Edit button should be ENABLED for this quest:")
    print(f"   - Quest status is 'open': {quest.status == 'open'}")
    print(f"   - No approved applications: {approved_apps.count() == 0}")
    print(f"   - No active participants: {active_participants.count() == 0}")
    
    # Also create a quest that should have a disabled edit button
    quest2 = Quest.objects.create(
        title='Frontend Test Quest - Edit Button Disabled',
        description='This quest should have a disabled edit button because it is in-progress.',
        creator=admin_user,
        xp_reward=200,
        status='in-progress',
        difficulty='medium'
    )
    print(f"\nCreated second test quest: {quest2.title} (ID: {quest2.id})")
    print(f"Quest status: {quest2.status}")
    
    print(f"\n❌ Edit button should be DISABLED for quest {quest2.id}:")
    print(f"   - Quest status is not 'open': {quest2.status != 'open'}")
    
    return quest.id, quest2.id

if __name__ == "__main__":
    quest_id_enabled, quest_id_disabled = create_test_scenario()
    print(f"\nTEST SCENARIOS CREATED:")
    print(f"Quest {quest_id_enabled}: Edit button should be ENABLED")
    print(f"Quest {quest_id_disabled}: Edit button should be DISABLED")
