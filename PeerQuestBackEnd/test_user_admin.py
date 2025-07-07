#!/usr/bin/env python
"""
Test script to verify user admin relationships are working.
"""

import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model

def test_user_relationships():
    print("🧪 Testing User Model Relationships...")
    
    User = get_user_model()
    user = User.objects.first()
    
    if not user:
        print("❌ No users found in database")
        return
    
    print(f"Testing relationships for user: {user.username}")
    
    try:
        created_count = user.created_quests.count()
        print(f"✅ created_quests: {created_count}")
    except Exception as e:
        print(f"❌ created_quests failed: {e}")
    
    try:
        assigned_count = user.assigned_quests.count()
        print(f"✅ assigned_quests: {assigned_count}")
    except Exception as e:
        print(f"❌ assigned_quests failed: {e}")
    
    try:
        participations_count = user.quest_participations.count()
        print(f"✅ quest_participations: {participations_count}")
    except Exception as e:
        print(f"❌ quest_participations failed: {e}")
    
    try:
        applications_count = user.quest_applications.count()
        print(f"✅ quest_applications: {applications_count}")
    except Exception as e:
        print(f"❌ quest_applications failed: {e}")
    
    print("✅ User relationships test completed!")

if __name__ == '__main__':
    test_user_relationships()
