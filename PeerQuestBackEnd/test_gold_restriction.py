#!/usr/bin/env python3
"""
Test script to verify that gold reward editing restrictions work correctly for in-progress quests.
"""

import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from quests.models import Quest, QuestCategory
from quests.serializers import QuestCreateUpdateSerializer
from django.test import RequestFactory
from datetime import datetime, timedelta

User = get_user_model()

def test_in_progress_quest_gold_restriction():
    """Test that gold rewards cannot be modified for in-progress quests"""
    print("🧪 Testing In-Progress Quest Gold Reward Restriction")
    print("=" * 60)
    
    # Get or create test user
    user, created = User.objects.get_or_create(
        username='testuser_gold_restriction',
        defaults={'email': 'test@example.com'}
    )
    if created:
        user.set_password('testpass123')
        user.save()
        print(f"✅ Created test user: {user.username}")
    else:
        print(f"✅ Using existing test user: {user.username}")
    
    # Get or create test category
    category, created = QuestCategory.objects.get_or_create(
        name='Test Category',
        defaults={'description': 'Test category for gold restriction testing'}
    )
    print(f"✅ Using category: {category.name}")
    
    # Create a test quest
    quest = Quest.objects.create(
        title='Test Gold Restriction Quest',
        description='This quest is for testing gold reward restrictions.',
        creator=user,
        category=category,
        difficulty='initiate',
        status='open',  # Start as open
        xp_reward=25,
        gold_reward=50,  # Initial gold reward
        due_date=datetime.now().date() + timedelta(days=7)
    )
    print(f"✅ Created test quest: {quest.title} (ID: {quest.id})")
    print(f"   Initial status: {quest.status}")
    print(f"   Initial gold reward: {quest.gold_reward}")
    
    # Create mock request
    factory = RequestFactory()
    request = factory.patch('/test/')
    request.user = user
    
    # Test 1: Try to update gold reward while quest is OPEN (should work)
    print("\n📝 Test 1: Updating gold reward while quest is OPEN")
    serializer = QuestCreateUpdateSerializer(
        instance=quest,
        data={'gold_reward': 75},
        context={'request': request},
        partial=True
    )
    
    if serializer.is_valid():
        print("✅ Quest gold reward update allowed while quest is OPEN")
    else:
        print(f"❌ Unexpected validation error while quest is OPEN: {serializer.errors}")
    
    # Change quest status to in-progress
    quest.status = 'in-progress'
    quest.save()
    print(f"\n🔄 Changed quest status to: {quest.status}")
    
    # Test 2: Try to update gold reward while quest is IN-PROGRESS (should fail)
    print("\n📝 Test 2: Updating gold reward while quest is IN-PROGRESS")
    serializer = QuestCreateUpdateSerializer(
        instance=quest,
        data={'gold_reward': 100},
        context={'request': request},
        partial=True
    )
    
    if not serializer.is_valid():
        print("✅ Quest gold reward update correctly blocked while quest is IN-PROGRESS")
        print(f"   Error message: {serializer.errors.get('gold_reward', ['No error message'])[0]}")
    else:
        print("❌ Quest gold reward update should have been blocked while quest is IN-PROGRESS!")
    
    # Test 3: Try to update with same gold reward (should work even if in-progress)
    print("\n📝 Test 3: Updating with SAME gold reward while quest is IN-PROGRESS")
    serializer = QuestCreateUpdateSerializer(
        instance=quest,
        data={'gold_reward': quest.gold_reward},  # Same value
        context={'request': request},
        partial=True
    )
    
    if serializer.is_valid():
        print("✅ Quest update with same gold reward allowed while quest is IN-PROGRESS")
    else:
        print(f"❌ Quest update with same gold reward should be allowed: {serializer.errors}")
    
    # Test 4: Try to update other fields while quest is IN-PROGRESS (should work)
    print("\n📝 Test 4: Updating other fields while quest is IN-PROGRESS")
    serializer = QuestCreateUpdateSerializer(
        instance=quest,
        data={'description': 'Updated description for in-progress quest'},
        context={'request': request},
        partial=True
    )
    
    if serializer.is_valid():
        print("✅ Quest other field updates allowed while quest is IN-PROGRESS")
    else:
        print(f"❌ Quest other field updates should be allowed: {serializer.errors}")
    
    # Cleanup
    quest.delete()
    if created:  # Only delete if we created the user
        user.delete()
    print(f"\n🧹 Cleaned up test data")
    
    print("\n" + "=" * 60)
    print("🎉 Gold restriction test completed!")

if __name__ == '__main__':
    test_in_progress_quest_gold_restriction()
