#!/usr/bin/env python3

import os
import sys
import django

# Add the project root to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from quests.models import QuestCategory

def create_default_categories():
    """Create default quest categories if they don't exist."""
    
    default_categories = [
        {
            "name": "Design",
            "description": "Visual design, UX/UI, graphic design, and creative projects"
        },
        {
            "name": "Development", 
            "description": "Programming, software development, web development, and technical projects"
        },
        {
            "name": "Writing",
            "description": "Content creation, copywriting, documentation, and written communication"
        },
        {
            "name": "Music",
            "description": "Music composition, audio production, sound design, and musical projects"
        },
        {
            "name": "Art",
            "description": "Traditional and digital art, illustration, photography, and artistic endeavors"
        },
        {
            "name": "Marketing",
            "description": "Digital marketing, social media, SEO, advertising, and promotional activities"
        },
        {
            "name": "Research",
            "description": "Data analysis, market research, academic research, and investigative projects"
        }
    ]
    
    created_count = 0
    existing_count = 0
    
    for category_data in default_categories:
        category, created = QuestCategory.objects.get_or_create(
            name=category_data["name"],
            defaults={"description": category_data["description"]}
        )
        
        if created:
            created_count += 1
            print(f"✅ Created category: {category.name}")
        else:
            existing_count += 1
            print(f"ℹ️  Category already exists: {category.name}")
    
    print(f"\n📊 Summary:")
    print(f"   Created: {created_count} categories")
    print(f"   Existing: {existing_count} categories")
    print(f"   Total: {QuestCategory.objects.count()} categories")
    
    return created_count

if __name__ == "__main__":
    print("🗂️  Creating default quest categories...")
    created = create_default_categories()
    
    if created > 0:
        print(f"\n🎉 Successfully created {created} new categories!")
    else:
        print("\n✅ All categories already exist!")
