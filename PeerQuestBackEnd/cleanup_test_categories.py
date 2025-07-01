#!/usr/bin/env python3
"""
Script to delete test categories created during testing.
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

from quests.models import QuestCategory

def delete_test_categories():
    """Delete test categories created during testing."""
    
    print("🧹 Cleaning up test categories")
    print("=" * 50)
    
    # Find test categories by common test names
    test_category_names = [
        'Test Category',
        'Assignment Test Category',
        'Admin Test Category',
        'Quick Test Category'
    ]
    
    deleted_count = 0
    
    for category_name in test_category_names:
        categories = QuestCategory.objects.filter(name=category_name)
        
        if categories.exists():
            print(f"🗑️ Found test category: '{category_name}'")
            
            # Check if category has any quests
            for category in categories:
                quest_count = category.quest_set.count()
                if quest_count > 0:
                    print(f"   ⚠️ Category has {quest_count} quest(s) - deleting quests first")
                    # Delete associated quests first
                    category.quest_set.all().delete()
                
                print(f"   ✅ Deleting category: {category.name}")
                category.delete()
                deleted_count += 1
        else:
            print(f"✅ No test category found: '{category_name}'")
    
    # Also check for any categories that contain 'test' in the name (case insensitive)
    additional_test_categories = QuestCategory.objects.filter(name__icontains='test')
    
    if additional_test_categories.exists():
        print(f"\n🔍 Found {additional_test_categories.count()} additional test categories:")
        for category in additional_test_categories:
            quest_count = category.quest_set.count()
            print(f"   - {category.name} ({quest_count} quests)")
            
            if quest_count > 0:
                print(f"     🗑️ Deleting {quest_count} associated quests")
                category.quest_set.all().delete()
            
            print(f"     ✅ Deleting category: {category.name}")
            category.delete()
            deleted_count += 1
    
    print("=" * 50)
    print(f"✅ Cleanup completed! Deleted {deleted_count} test categories.")
    
    # Show remaining categories
    remaining_categories = QuestCategory.objects.all()
    print(f"\n📋 Remaining categories ({remaining_categories.count()}):")
    for category in remaining_categories:
        quest_count = category.quest_set.count()
        print(f"   - {category.name} ({quest_count} quests)")

if __name__ == '__main__':
    delete_test_categories()
