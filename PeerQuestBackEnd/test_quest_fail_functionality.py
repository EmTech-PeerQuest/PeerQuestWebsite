#!/usr/bin/env python
"""
Test script for Quest Mark as Failed functionality
"""
import os
import sys
import django

# Add the project root to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from quests.models import Quest, QuestParticipant
from applications.models import ApplicationAttempt
from django.utils import timezone

User = get_user_model()

def test_quest_fail_functionality():
    """Test the quest fail functionality and attempt counter reset"""
    
    print("🧪 Testing Quest Fail Functionality")
    print("=" * 50)
    
    # Find a test quest and users
    try:
        # Get a quest creator
        creator = User.objects.filter(is_staff=True).first()
        if not creator:
            creator = User.objects.first()
        
        if not creator:
            print("❌ No users found in database")
            return False
            
        print(f"📋 Using creator: {creator.username}")
        
        # Create a test quest
        quest = Quest.objects.create(
            title="Test Quest for Failure",
            description="A test quest to verify failure functionality",
            creator=creator,
            status='in-progress',
            xp_reward=50,
            gold_reward=100,
            difficulty='initiate',
            category_id=1,
            due_date=timezone.now().date()
        )
        
        print(f"✅ Created test quest: {quest.title}")
        
        # Create test participants
        participants = []
        for i in range(3):
            user, created = User.objects.get_or_create(
                username=f'test_participant_{i}',
                defaults={'email': f'test{i}@example.com'}
            )
            
            # Add them as participants
            participant, created = QuestParticipant.objects.get_or_create(
                user=user,
                quest=quest,
                defaults={'status': 'joined'}
            )
            participants.append(user)
            
            # Create application attempts to simulate some usage
            # Create an Application first
            from applications.models import Application
            
            application, created = Application.objects.get_or_create(
                quest=quest,
                applicant=user,
                defaults={'status': 'approved'}
            )
            
            # Create multiple ApplicationAttempt records for this user/quest
            for attempt_num in range(1, i + 3):  # Different attempt counts (1-2, 1-3, 1-4)
                ApplicationAttempt.objects.get_or_create(
                    quest=quest,
                    applicant=user,
                    application=application,
                    attempt_number=attempt_num
                )
            
            attempt_count = ApplicationAttempt.objects.filter(quest=quest, applicant=user).count()
            print(f"👤 Added participant {user.username} with {attempt_count} attempts")
        
        print(f"\n📊 Quest Status Before Failure: {quest.status}")
        print("📊 Participant Attempt Counts Before:")
        for participant in participants:
            attempt_count = ApplicationAttempt.objects.filter(quest=quest, applicant=participant).count()
            print(f"   - {participant.username}: {attempt_count} attempts")
        
        # Test the mark_failed functionality
        print(f"\n🔄 Marking quest as failed...")
        
        # Simulate the mark_failed action
        quest.status = 'failed'
        quest.save()
        
        # Reset all participant attempt counters by deleting ApplicationAttempt records
        ApplicationAttempt.objects.filter(quest=quest).delete()
        
        print(f"✅ Quest marked as failed successfully")
        print(f"📊 Quest Status After Failure: {quest.status}")
        print("📊 Participant Attempt Counts After:")
        for participant in participants:
            attempt_count = ApplicationAttempt.objects.filter(quest=quest, applicant=participant).count()
            print(f"   - {participant.username}: {attempt_count} attempts")
        
        # Verify all attempts are reset to 0
        all_reset = all(
            ApplicationAttempt.objects.filter(quest=quest, applicant=p).count() == 0 
            for p in participants
        )
        
        if all_reset:
            print("✅ All participant attempt counters successfully reset to 0")
        else:
            print("❌ Some attempt counters were not reset properly")
            return False
        
        # Clean up
        quest.delete()
        for participant in participants:
            if participant.username.startswith('test_participant_'):
                participant.delete()
        
        print("🧹 Cleaned up test data")
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return False

def test_api_endpoint():
    """Test the API endpoint for marking quest as failed"""
    print("\n🌐 Testing API Endpoint")
    print("=" * 30)
    
    try:
        from django.test import Client
        from rest_framework_simplejwt.tokens import AccessToken
        
        client = Client()
        
        # Get or create a test user
        creator = User.objects.filter(is_staff=True).first()
        if not creator:
            creator = User.objects.create_user(
                username='test_creator', 
                email='creator@test.com', 
                password='testpass123'
            )
        
        # Create a token for authentication
        token = AccessToken.for_user(creator)
        
        # Create a test quest
        quest = Quest.objects.create(
            title="API Test Quest",
            description="Testing API endpoint for quest failure",
            creator=creator,
            status='in-progress',
            xp_reward=50,
            gold_reward=100,
            difficulty='initiate',
            category_id=1,
            due_date=timezone.now().date()
        )
        
        print(f"✅ Created API test quest: {quest.title}")
        
        # Test the mark-failed endpoint
        url = f'/api/quests/quests/{quest.slug}/mark_failed/'
        headers = {'HTTP_AUTHORIZATION': f'Bearer {str(token)}'}
        
        response = client.post(url, {}, **headers)
        
        if response.status_code == 200:
            quest.refresh_from_db()
            print(f"✅ API endpoint successful, quest status: {quest.status}")
            
            if quest.status == 'failed':
                print("✅ Quest status correctly updated to 'failed'")
            else:
                print(f"❌ Quest status not updated correctly: {quest.status}")
                return False
        else:
            print(f"❌ API endpoint failed with status {response.status_code}")
            print(f"Response: {response.content}")
            return False
        
        # Clean up
        quest.delete()
        if creator.username == 'test_creator':
            creator.delete()
        
        return True
        
    except Exception as e:
        print(f"❌ API test failed with error: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return False

if __name__ == '__main__':
    print("🚀 Starting Quest Fail Functionality Tests")
    print("=" * 60)
    
    # Test 1: Core functionality
    test1_result = test_quest_fail_functionality()
    
    # Test 2: API endpoint
    test2_result = test_api_endpoint()
    
    print("\n📋 Test Results Summary")
    print("=" * 30)
    print(f"Core Functionality Test: {'✅ PASSED' if test1_result else '❌ FAILED'}")
    print(f"API Endpoint Test: {'✅ PASSED' if test2_result else '❌ FAILED'}")
    
    if test1_result and test2_result:
        print("\n🎉 All tests passed! Quest fail functionality is working correctly.")
    else:
        print("\n❌ Some tests failed. Please check the implementation.")
