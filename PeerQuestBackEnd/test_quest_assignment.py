#!/usr/bin/env python3
"""
Test script to verify quest assignment functionality in Django admin.
"""

import os
import sys
import django
from django.conf import settings

# Add the project root to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from quests.models import Quest, QuestCategory, QuestParticipant
from applications.models import Application

User = get_user_model()

def test_quest_assignment():
    """Test that quest assignment works properly."""
    
    print("🧪 Testing Quest Assignment Functionality")
    print("=" * 50)
    
    # Clean up any existing test data
    User.objects.filter(username__in=['test_creator', 'test_applicant1', 'test_applicant2']).delete()
    QuestCategory.objects.filter(name='Assignment Test Category').delete()
    
    # Create test users
    creator = User.objects.create_user(
        username='test_creator',
        email='creator@example.com',
        password='testpass123'
    )
    
    applicant1 = User.objects.create_user(
        username='test_applicant1',
        email='applicant1@example.com',
        password='testpass123'
    )
    
    applicant2 = User.objects.create_user(
        username='test_applicant2',
        email='applicant2@example.com',
        password='testpass123'
    )
    
    # Create test category
    category = QuestCategory.objects.create(
        name='Assignment Test Category',
        description='Category for testing assignments'
    )
    
    # Create test quest
    quest = Quest.objects.create(
        title='Assignment Test Quest',
        description='Testing quest assignment functionality',
        creator=creator,
        category=category,
        xp_reward=100,
        difficulty='medium',
        status='open'
    )
    
    print(f"✅ Created quest: {quest.title}")
    print(f"   - Status: {quest.status}")
    print(f"   - Assigned to: {quest.assigned_to}")
    
    # Test 1: Create applications
    app1 = Application.objects.create(
        quest=quest,
        applicant=applicant1
    )
    
    app2 = Application.objects.create(
        quest=quest,
        applicant=applicant2
    )
    
    print(f"\n🧪 Test 1: Created applications")
    print(f"   - Application 1: {app1.applicant.username} -> {app1.status}")
    print(f"   - Application 2: {app2.applicant.username} -> {app2.status}")
    print(f"   - Quest assigned to: {quest.assigned_to}")
    
    # Test 2: Approve first application
    print(f"\n🧪 Test 2: Approving application 1")
    app1.approve(creator)
    
    # Refresh quest from database
    quest.refresh_from_db()
    
    print(f"   - Application 1 status: {app1.status}")
    print(f"   - Quest assigned to: {quest.assigned_to}")
    print(f"   - Quest status: {quest.status}")
    
    # Check QuestParticipant was created
    participants = QuestParticipant.objects.filter(quest=quest)
    print(f"   - Participants: {[p.user.username for p in participants]}")
    
    # Check other application was auto-rejected
    app2.refresh_from_db()
    print(f"   - Application 2 status: {app2.status}")
    
    # Test 3: Check assignment in admin context
    print(f"\n🧪 Test 3: Checking assignment details")
    
    if quest.assigned_to:
        print(f"✅ Quest properly assigned to: {quest.assigned_to.username}")
    else:
        print(f"❌ Quest assignment failed!")
    
    # Test 4: Participant drops out
    print(f"\n🧪 Test 4: Participant drops out")
    participant = participants.first()
    if participant:
        print(f"   - Before: Quest assigned to {quest.assigned_to}")
        participant.status = 'dropped'
        participant.save()
        
        quest.refresh_from_db()
        print(f"   - After: Quest assigned to {quest.assigned_to}")
        
        if quest.assigned_to is None:
            print("✅ Assignment correctly cleared when participant dropped out")
        else:
            print("❌ Assignment should have been cleared!")
    
    # Clean up
    quest.delete()
    creator.delete()
    applicant1.delete()
    applicant2.delete()
    category.delete()
    
    print(f"\n🧹 Cleanup completed")
    print("=" * 50)
    print("✅ Quest assignment test completed!")

if __name__ == '__main__':
    test_quest_assignment()
