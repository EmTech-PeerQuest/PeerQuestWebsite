#!/usr/bin/env python
"""
Debug quest creation issue.
"""

import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from quests.serializers import QuestCreateUpdateSerializer
from django.test import RequestFactory

def test_quest_creation():
    User = get_user_model()
    admin_user = User.objects.filter(is_superuser=True).first()
    
    if not admin_user:
        print("❌ No admin user found")
        return
    
    print(f"✅ Testing with user: {admin_user.username}")
    
    # Create a mock request
    factory = RequestFactory()
    request = factory.post('/test/')
    request.user = admin_user
    
    # Quest data (similar to what frontend would send)
    quest_data = {
        'title': 'Test Quest Creation',
        'description': 'Testing quest creation functionality',
        'difficulty': 'initiate',  # Valid choice: initiate, adventurer, champion, mythic
        'due_date': '2025-08-01',
        'gold_reward': 50,
        'xp_reward': 25,
        'category': 1,  # Use existing category ID
        'status': 'open'
    }
    
    print(f"🔍 Quest data: {quest_data}")
    
    try:
        # Test serializer validation and creation
        serializer = QuestCreateUpdateSerializer(data=quest_data, context={'request': request})
        
        print("🔍 Testing validation...")
        if serializer.is_valid():
            print("✅ Validation passed")
            print("🔍 Testing quest creation...")
            quest = serializer.save()
            print(f"✅ Quest created successfully: {quest.id} - {quest.title}")
        else:
            print(f"❌ Validation failed: {serializer.errors}")
            
    except Exception as e:
        print(f"❌ Exception occurred: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_quest_creation()
