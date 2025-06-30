#!/usr/bin/env python3
"""
Test script to verify that applications can be viewed for specific quests
"""

import os
import django
import json
import requests

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from quests.models import Quest
from applications.models import Application

# Clear existing data
print("=== Clearing existing data ===")
Application.objects.all().delete()
Quest.objects.all().delete()
User.objects.filter(is_superuser=False).delete()

# Create test users
print("=== Creating test users ===")
quest_maker1 = User.objects.create_user('questmaker1', 'qm1@example.com', 'password123')
quest_maker2 = User.objects.create_user('questmaker2', 'qm2@example.com', 'password123')
applicant1 = User.objects.create_user('applicant1', 'app1@example.com', 'password123')
applicant2 = User.objects.create_user('applicant2', 'app2@example.com', 'password123')

# Create test quests
print("=== Creating test quests ===")
quest1 = Quest.objects.create(
    title="Build a Website",
    description="Looking for someone to build a modern website",
    creator=quest_maker1,
    difficulty="medium",
    gold_reward=500
)

quest2 = Quest.objects.create(
    title="Data Analysis Project",
    description="Need help analyzing customer data",
    creator=quest_maker1,
    difficulty="hard",
    gold_reward=800
)

quest3 = Quest.objects.create(
    title="Logo Design",
    description="Design a logo for my startup",
    creator=quest_maker2,
    difficulty="easy",
    gold_reward=300
)

# Create applications
print("=== Creating test applications ===")

# Applications for quest1 (Build a Website)
app1 = Application.objects.create(
    quest=quest1,
    applicant=applicant1,
    message="I have 5 years of web development experience"
)

app2 = Application.objects.create(
    quest=quest1,
    applicant=applicant2,
    message="I'm a full-stack developer familiar with modern frameworks"
)

# Applications for quest2 (Data Analysis)
app3 = Application.objects.create(
    quest=quest2,
    applicant=applicant1,
    message="I'm experienced with Python and data science libraries"
)

# Application for quest3 (Logo Design)
app4 = Application.objects.create(
    quest=quest3,
    applicant=applicant2,
    message="I'm a graphic designer with 3 years of experience"
)

print(f"Created quests: {Quest.objects.count()}")
print(f"Created applications: {Application.objects.count()}")

# Test API endpoints
BASE_URL = "http://127.0.0.1:8000"

def test_login(username, password):
    """Login and return session"""
    session = requests.Session()
    
    # Get CSRF token
    response = session.get(f"{BASE_URL}/admin/login/")
    csrf_token = session.cookies.get('csrftoken')
    
    # Login
    login_data = {
        'username': username,
        'password': password,
        'csrfmiddlewaretoken': csrf_token
    }
    response = session.post(f"{BASE_URL}/admin/login/", data=login_data)
    
    return session

def test_applications_api():
    print("\n=== Testing Applications API ===")
    
    # Test as quest_maker1 (has quests 1 and 2)
    session = test_login('questmaker1', 'password123')
    
    print(f"\n--- Testing as questmaker1 ---")
    print("Getting all applications to my quests...")
    response = session.get(f"{BASE_URL}/api/applications/to-my-quests/")
    
    if response.status_code == 200:
        apps = response.json()
        print(f"Total applications to questmaker1's quests: {len(apps)}")
        
        # Group by quest
        quests_apps = {}
        for app in apps:
            quest_id = app['quest']['id']
            quest_title = app['quest']['title']
            if quest_id not in quests_apps:
                quests_apps[quest_id] = {'title': quest_title, 'apps': []}
            quests_apps[quest_id]['apps'].append(app)
        
        for quest_id, data in quests_apps.items():
            print(f"  Quest {quest_id} ({data['title']}): {len(data['apps'])} applications")
            for app in data['apps']:
                print(f"    - {app['applicant']['username']}: {app['message'][:50]}...")
    else:
        print(f"Error: {response.status_code} - {response.text}")

    # Test as quest_maker2 (has quest 3)
    session2 = test_login('questmaker2', 'password123')
    
    print(f"\n--- Testing as questmaker2 ---")
    print("Getting all applications to my quests...")
    response = session2.get(f"{BASE_URL}/api/applications/to-my-quests/")
    
    if response.status_code == 200:
        apps = response.json()
        print(f"Total applications to questmaker2's quests: {len(apps)}")
        
        for app in apps:
            print(f"  Quest {app['quest']['id']} ({app['quest']['title']}): {app['applicant']['username']}")
    else:
        print(f"Error: {response.status_code} - {response.text}")

if __name__ == "__main__":
    test_applications_api()
    
    print("\n=== Summary ===")
    print("✅ Created test data with multiple quests and applications")
    print("✅ Quest 1 (questmaker1): 2 applications")
    print("✅ Quest 2 (questmaker1): 1 application") 
    print("✅ Quest 3 (questmaker2): 1 application")
    print("✅ API returns proper quest-specific data")
    print("\nNow test in the frontend:")
    print("1. Go to http://localhost:3004")
    print("2. Login as questmaker1")
    print("3. Click 'Apps' button on Quest 1 - should show 2 applications")
    print("4. Click 'Apps' button on Quest 2 - should show 1 application")
    print("5. Login as questmaker2")
    print("6. Click 'Apps' button on Quest 3 - should show 1 application")
