#!/usr/bin/env python3
"""
Comprehensive test to verify the Django admin assignment functionality.
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
from quests.admin import QuestAdmin

User = get_user_model()

def test_admin_assignment_display():
    """Test that the Django admin displays assignment information correctly."""
    
    print("🧪 Testing Django Admin Assignment Display")
    print("=" * 50)
    
    # Clean up any existing test data
    User.objects.filter(username__in=['admin_test_creator', 'admin_test_user']).delete()
    QuestCategory.objects.filter(name='Admin Test Category').delete()
    
    # Create test users
    creator = User.objects.create_user(
        username='admin_test_creator',
        email='admincreator@example.com',
        password='testpass123'
    )
    
    user = User.objects.create_user(
        username='admin_test_user',
        email='adminuser@example.com',
        password='testpass123'
    )
    
    # Create test category
    category = QuestCategory.objects.create(
        name='Admin Test Category',
        description='Category for testing admin display'
    )
    
    # Create test quest
    quest = Quest.objects.create(
        title='Admin Test Quest',
        description='Testing admin assignment display',
        creator=creator,
        category=category,
        xp_reward=100,
        difficulty='medium',
        status='open'
    )
    
    print(f"✅ Created quest: {quest.title}")
    
    # Test admin display methods
    admin = QuestAdmin(Quest, None)
    
    # Test 1: Quest with no assignment
    print(f"\n🧪 Test 1: Quest with no assignment")
    assigned_display = admin.assigned_to_display(quest)
    print(f"   - Assigned to display: '{assigned_display}'")
    
    if assigned_display == "Not assigned":
        print("✅ Correctly shows 'Not assigned' for unassigned quest")
    else:
        print(f"❌ Expected 'Not assigned', got '{assigned_display}'")
    
    # Test 2: Assign quest to user
    print(f"\n🧪 Test 2: Assigning quest to user")
    quest.assign_to_user(user)
    quest.refresh_from_db()
    
    assigned_display = admin.assigned_to_display(quest)
    print(f"   - Assigned to display: '{assigned_display}'")
    
    if user.username in assigned_display and "Joined" in assigned_display:
        print("✅ Correctly shows assigned user with participant status")
    else:
        print(f"❌ Expected user with status, got '{assigned_display}'")
    
    # Test 3: Check participant count
    print(f"\n🧪 Test 3: Checking participant count")
    participant_count = admin.participant_count(quest)
    print(f"   - Participant count: {participant_count}")
    
    if participant_count == 1:
        print("✅ Correctly shows 1 participant")
    else:
        print(f"❌ Expected 1 participant, got {participant_count}")
    
    # Test 4: Check applications count
    print(f"\n🧪 Test 4: Creating application and checking count")
    
    # Create another user for application
    applicant = User.objects.create_user(
        username='admin_test_applicant',
        email='adminapplicant@example.com',
        password='testpass123'
    )
    
    app = Application.objects.create(
        quest=quest,
        applicant=applicant
    )
    
    applications_count = admin.applications_count(quest)
    print(f"   - Applications count: {applications_count}")
    
    if applications_count == 1:
        print("✅ Correctly shows 1 application")
    else:
        print(f"❌ Expected 1 application, got {applications_count}")
    
    # Test 5: Check creator email display
    print(f"\n🧪 Test 5: Checking creator email display")
    creator_email = admin.creator_email(quest)
    print(f"   - Creator email: {creator_email}")
    
    if creator_email == creator.email:
        print("✅ Correctly shows creator email")
    else:
        print(f"❌ Expected {creator.email}, got {creator_email}")
    
    # Test 6: Participant drops out
    print(f"\n🧪 Test 6: Participant drops out")
    participant = QuestParticipant.objects.filter(quest=quest, user=user).first()
    if participant:
        participant.status = 'dropped'
        participant.save()
        
        quest.refresh_from_db()
        assigned_display = admin.assigned_to_display(quest)
        print(f"   - Assigned to display after drop: '{assigned_display}'")
        
        if assigned_display == "Not assigned":
            print("✅ Correctly cleared assignment when participant dropped")
        else:
            print(f"❌ Expected 'Not assigned', got '{assigned_display}'")
    
    # Clean up
    quest.delete()
    creator.delete()
    user.delete()
    applicant.delete()
    category.delete()
    
    print(f"\n🧹 Cleanup completed")
    print("=" * 50)
    print("✅ Django admin assignment display test completed!")

if __name__ == '__main__':
    test_admin_assignment_display()
