#!/usr/bin/env python
"""
Integration test to verify end-to-end quest application restrictions.
Run this script from the PeerQuestBackEnd directory.
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
from applications.models import Application
from applications.serializers import ApplicationCreateSerializer
from rest_framework.test import APIRequestFactory

User = get_user_model()

def test_application_workflow():
    print("🔄 Testing Quest Application Workflow with In-Progress Restrictions...")
    
    # Create test users
    creator, created = User.objects.get_or_create(
        username='workflow_creator',
        defaults={'email': 'creator@workflow.com'}
    )
    if created:
        creator.set_password('testpass123')
        creator.save()
    
    applicant1, created = User.objects.get_or_create(
        username='workflow_applicant1',
        defaults={'email': 'applicant1@workflow.com'}
    )
    if created:
        applicant1.set_password('testpass123')
        applicant1.save()
    
    applicant2, created = User.objects.get_or_create(
        username='workflow_applicant2',
        defaults={'email': 'applicant2@workflow.com'}
    )
    if created:
        applicant2.set_password('testpass123')
        applicant2.save()
    
    # Get or create a category
    category, created = QuestCategory.objects.get_or_create(
        name='Workflow Test Category',
        defaults={'description': 'A test category for workflow testing'}
    )
    
    # Create a test quest
    quest = Quest.objects.create(
        title='Workflow Test Quest',
        description='This is a test quest for workflow testing.',
        creator=creator,
        category=category,
        difficulty='easy',
        status='open',
        xp_reward=50
    )
    
    print(f"✅ Created test quest: {quest.title} (Status: {quest.status})")
    
    # Step 1: First applicant applies successfully
    print("\n📝 Step 1: First applicant applies to OPEN quest...")
    factory = APIRequestFactory()
    request = factory.post('/applications/', {'quest': quest.id})
    request.user = applicant1
    
    serializer = ApplicationCreateSerializer(
        data={'quest': quest.id},
        context={'request': request}
    )
    
    if serializer.is_valid():
        application1 = serializer.save()
        print(f"✅ First application created successfully: {application1}")
    else:
        print(f"❌ First application failed: {serializer.errors}")
        return
    
    # Step 2: Approve the first application (quest becomes in-progress)
    print("\n📝 Step 2: Approving first application...")
    try:
        approval_result = application1.approve(creator)
        quest.refresh_from_db()  # Refresh to get updated status
        print(f"✅ Application approved. Quest status: {quest.status}")
        print(f"✅ Quest assigned to: {quest.assigned_to}")
    except Exception as e:
        print(f"❌ Failed to approve application: {e}")
        return
    
    # Step 3: Second applicant tries to apply to in-progress quest
    print("\n📝 Step 3: Second applicant tries to apply to IN-PROGRESS quest...")
    request2 = factory.post('/applications/', {'quest': quest.id})
    request2.user = applicant2
    
    serializer2 = ApplicationCreateSerializer(
        data={'quest': quest.id},
        context={'request': request2}
    )
    
    if not serializer2.is_valid():
        error_messages = []
        for field, errors in serializer2.errors.items():
            for error in errors:
                error_messages.append(str(error))
        print(f"✅ Second application correctly blocked: {'; '.join(error_messages)}")
    else:
        print("❌ Second application should have been blocked!")
    
    # Step 4: Test the join quest method as well
    print("\n📝 Step 4: Testing direct quest join for in-progress quest...")
    from quests.serializers import QuestParticipantCreateSerializer
    
    join_serializer = QuestParticipantCreateSerializer(
        data={'quest': quest.id},
        context={'request': request2}
    )
    
    if not join_serializer.is_valid():
        error_messages = []
        for field, errors in join_serializer.errors.items():
            for error in errors:
                error_messages.append(str(error))
        print(f"✅ Direct quest join correctly blocked: {'; '.join(error_messages)}")
    else:
        print("❌ Direct quest join should have been blocked!")
    
    # Cleanup
    print("\n🧹 Cleaning up test data...")
    Application.objects.filter(quest=quest).delete()
    QuestParticipant.objects.filter(quest=quest).delete()
    quest.delete()
    print("✅ Workflow test completed successfully!")

if __name__ == '__main__':
    test_application_workflow()
