#!/usr/bin/env python
"""
Test script to verify quest application restrictions for in-progress quests.
Run this script from the PeerQuestBackEnd directory after setting up Django environment.
"""

import os
import sys
import django

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from quests.models import Quest, QuestParticipant, QuestCategory
from quests.serializers import QuestParticipantCreateSerializer

User = get_user_model()

def test_quest_application_restrictions():
    print("🧪 Testing Quest Application Restrictions...")
    
    # Create test users
    creator, created = User.objects.get_or_create(
        username='quest_creator',
        defaults={'email': 'creator@test.com'}
    )
    if created:
        creator.set_password('testpass123')
        creator.save()
    
    applicant, created = User.objects.get_or_create(
        username='quest_applicant',
        defaults={'email': 'applicant@test.com'}
    )
    if created:
        applicant.set_password('testpass123')
        applicant.save()
    
    # Get or create a category
    category, created = QuestCategory.objects.get_or_create(
        name='Test Category',
        defaults={'description': 'A test category'}
    )
    
    # Create a test quest
    quest = Quest.objects.create(
        title='Test Quest for Application Restrictions',
        description='This is a test quest to verify application restrictions.',
        creator=creator,
        category=category,
        difficulty='easy',
        status='open',
        xp_reward=50
    )
    
    print(f"✅ Created test quest: {quest.title} (Status: {quest.status})")
    
    # Test 1: Application to open quest should work
    print("\n📝 Test 1: Applying to OPEN quest...")
    serializer = QuestParticipantCreateSerializer(
        data={'quest': quest.id},
        context={'request': type('MockRequest', (), {'user': applicant})()}
    )
    
    if serializer.is_valid():
        print("✅ Application to open quest is allowed")
    else:
        print(f"❌ Application to open quest failed: {serializer.errors}")
    
    # Test 2: Change quest to in-progress and try to apply
    print("\n📝 Test 2: Applying to IN-PROGRESS quest...")
    quest.status = 'in-progress'
    quest.save()
    
    serializer = QuestParticipantCreateSerializer(
        data={'quest': quest.id},
        context={'request': type('MockRequest', (), {'user': applicant})()}
    )
    
    if not serializer.is_valid():
        error_messages = []
        for field, errors in serializer.errors.items():
            for error in errors:
                error_messages.append(str(error))
        print(f"✅ Application to in-progress quest correctly blocked: {'; '.join(error_messages)}")
    else:
        print("❌ Application to in-progress quest should have been blocked!")
    
    # Test 3: Change quest to completed and try to apply
    print("\n📝 Test 3: Applying to COMPLETED quest...")
    quest.status = 'completed'
    quest.save()
    
    serializer = QuestParticipantCreateSerializer(
        data={'quest': quest.id},
        context={'request': type('MockRequest', (), {'user': applicant})()}
    )
    
    if not serializer.is_valid():
        error_messages = []
        for field, errors in serializer.errors.items():
            for error in errors:
                error_messages.append(str(error))
        print(f"✅ Application to completed quest correctly blocked: {'; '.join(error_messages)}")
    else:
        print("❌ Application to completed quest should have been blocked!")
    
    # Test 4: Check can_accept_participants property
    print("\n📝 Test 4: Testing can_accept_participants property...")
    
    quest.status = 'open'
    quest.save()
    print(f"Open quest can_accept_participants: {quest.can_accept_participants}")
    
    quest.status = 'in-progress'
    quest.save()
    print(f"In-progress quest can_accept_participants: {quest.can_accept_participants}")
    
    quest.status = 'completed'
    quest.save()
    print(f"Completed quest can_accept_participants: {quest.can_accept_participants}")
    
    # Cleanup
    print("\n🧹 Cleaning up test data...")
    quest.delete()
    print("✅ Test completed successfully!")

if __name__ == '__main__':
    test_quest_application_restrictions()
