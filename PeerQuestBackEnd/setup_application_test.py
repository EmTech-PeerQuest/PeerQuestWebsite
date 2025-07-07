#!/usr/bin/env python
"""
Create a test scenario for testing application attempts in the frontend
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from quests.models import Quest
from applications.models import Application, ApplicationAttempt
from django.contrib.auth import get_user_model

User = get_user_model()

def setup_application_test():
    """Create a test scenario for application attempts"""
    print("=== SETTING UP APPLICATION ATTEMPT TEST ===\\n")
    
    # Get admin user
    admin_user = User.objects.filter(is_superuser=True).first()
    
    # Create test user  
    test_user, created = User.objects.get_or_create(
        username='app_test_user',
        defaults={'email': 'apptest@example.com'}
    )
    if created:
        test_user.set_password('test123')
        test_user.save()
        print(f"✅ Created test user: {test_user.username} (password: test123)")
    else:
        # Clear existing attempts for clean test
        ApplicationAttempt.objects.filter(applicant=test_user).delete()
        Application.objects.filter(applicant=test_user).delete()
        print(f"✅ Cleared existing data for user: {test_user.username}")
    
    # Create test quest
    quest = Quest.objects.create(
        title='Application Limit Test Quest',
        description='A quest for testing application attempt limits',
        creator=admin_user,
        xp_reward=150,
        status='open',
        difficulty='easy'
    )
    print(f"✅ Created test quest: {quest.title} (ID: {quest.id})")
    
    # Create 3 rejected applications using the proper flow
    for i in range(3):
        # Create application (this will trigger save() and create ApplicationAttempt)
        app = Application(
            quest=quest,
            applicant=test_user,
            status='pending'  # Start as pending
        )
        app.save()  # This will create the ApplicationAttempt record
        
        # Then reject it
        app.status = 'rejected'
        app.reviewed_by = admin_user
        app.save()
        
        print(f"  Created and rejected application #{i+1}")
    
    # Check state
    attempt_count = ApplicationAttempt.get_attempt_count(quest, test_user)
    can_apply, reason = ApplicationAttempt.can_apply_again(quest, test_user)
    
    print(f"\\n📊 Current State:")
    print(f"  Attempts used: {attempt_count}/4")
    print(f"  Can still apply: {can_apply}")
    print(f"  Reason: {reason}")
    
    print(f"\\n🧪 TEST PLAN:")
    print(f"  1. Login as: {test_user.username} / test123")
    print(f"  2. Apply to quest: '{quest.title}'")
    print(f"  3. This will be attempt 4/4 - should succeed")
    print(f"  4. Reject this application (as admin)")
    print(f"  5. Try to apply again - should show error message")
    
    return quest.id, test_user.username

if __name__ == "__main__":
    quest_id, username = setup_application_test()
    print(f"\\n✅ Test ready! Quest ID: {quest_id}, User: {username}")
