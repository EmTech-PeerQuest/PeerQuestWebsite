#!/usr/bin/env python3
"""
Comprehensive Frontend Integration Test for Mark as Failed Feature

This test verifies the complete integration between frontend and backend
for the Mark as Failed functionality, including:
1. Creating test data
2. Verifying API endpoints work correctly
3. Testing error conditions
4. Verifying the complete user flow
"""

import os
import sys
import django
import requests
import json
from django.test import Client
from django.contrib.auth import get_user_model

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from quests.models import Quest, QuestCategory
from applications.models import Application, ApplicationAttempt

class FrontendIntegrationTester:
    def __init__(self):
        self.client = Client()
        self.api_base = 'http://localhost:8000/api'
        self.cleanup_data = []
        
    def cleanup(self):
        """Clean up test data"""
        for model, ids in reversed(self.cleanup_data):
            model.objects.filter(id__in=ids).delete()
        print("✓ Cleanup completed")
        
    def create_test_data(self):
        """Create test users, quest, and applications"""
        print("Creating test data...")
        
        # Create users
        creator = User.objects.create_user(
            username='testcreator',
            email='creator@test.com',
            password='testpass123'
        )
        
        participant1 = User.objects.create_user(
            username='participant1',
            email='p1@test.com',
            password='testpass123'
        )
        
        participant2 = User.objects.create_user(
            username='participant2',
            email='p2@test.com',
            password='testpass123'
        )
        
        self.cleanup_data.append((User, [creator.id, participant1.id, participant2.id]))
        
        # Create category
        category = QuestCategory.objects.create(
            name='Test Category',
            description='Category for testing'
        )
        self.cleanup_data.append((QuestCategory, [category.id]))
        
        # Create quest
        quest = Quest.objects.create(
            title='Test Quest for Mark Failed',
            description='A quest to test mark as failed functionality',
            category=category,
            creator=creator,
            difficulty='medium',
            status='in-progress',
            xp_reward=100,
            gold_reward=50
        )
        self.cleanup_data.append((Quest, [quest.id]))
        
        # Create applications
        app1 = Application.objects.create(
            quest=quest,
            user=participant1,
            status='accepted'
        )
        
        app2 = Application.objects.create(
            quest=quest,
            user=participant2,
            status='accepted'
        )
        
        self.cleanup_data.append((Application, [app1.id, app2.id]))
        
        # Create application attempts to test reset functionality
        attempt1 = ApplicationAttempt.objects.create(
            application=app1,
            attempt_number=1,
            status='pending'
        )
        
        attempt2 = ApplicationAttempt.objects.create(
            application=app1,
            attempt_number=2,
            status='rejected'
        )
        
        attempt3 = ApplicationAttempt.objects.create(
            application=app2,
            attempt_number=1,
            status='pending'
        )
        
        self.cleanup_data.append((ApplicationAttempt, [attempt1.id, attempt2.id, attempt3.id]))
        
        return {
            'creator': creator,
            'participant1': participant1,
            'participant2': participant2,
            'quest': quest,
            'applications': [app1, app2],
            'attempts': [attempt1, attempt2, attempt3]
        }
        
    def test_api_authentication(self, creator):
        """Test API authentication works"""
        print("\n1. Testing API authentication...")
        
        # Login via API
        login_response = self.client.post('/api/auth/login/', {
            'username': 'testcreator',
            'password': 'testpass123'
        })
        
        if login_response.status_code == 200:
            print("✓ Login successful")
            return True
        else:
            print(f"✗ Login failed: {login_response.status_code}")
            print(f"Response: {login_response.content.decode()}")
            return False
            
    def test_quest_api_endpoints(self, quest):
        """Test quest API endpoints"""
        print("\n2. Testing quest API endpoints...")
        
        # Test quest detail endpoint
        response = self.client.get(f'/api/quests/quests/{quest.slug}/')
        if response.status_code == 200:
            quest_data = response.json()
            print(f"✓ Quest detail API works - Status: {quest_data.get('status')}")
        else:
            print(f"✗ Quest detail API failed: {response.status_code}")
            return False
            
        # Test quest list endpoint
        response = self.client.get('/api/quests/quests/')
        if response.status_code == 200:
            print("✓ Quest list API works")
        else:
            print(f"✗ Quest list API failed: {response.status_code}")
            return False
            
        return True
        
    def test_mark_failed_api(self, quest):
        """Test the mark as failed API endpoint"""
        print("\n3. Testing mark as failed API...")
        
        # Verify attempts exist before marking failed
        attempts_before = ApplicationAttempt.objects.filter(application__quest=quest).count()
        print(f"  - Attempts before: {attempts_before}")
        
        # Test mark as failed endpoint
        response = self.client.post(f'/api/quests/quests/{quest.slug}/mark-failed/')
        
        if response.status_code == 200:
            quest_data = response.json()
            print(f"✓ Mark as failed API successful - New status: {quest_data.get('status')}")
            
            # Verify quest status changed
            quest.refresh_from_db()
            if quest.status == 'failed':
                print("✓ Quest status updated to 'failed'")
            else:
                print(f"✗ Quest status not updated correctly: {quest.status}")
                return False
                
            # Verify attempts were reset
            attempts_after = ApplicationAttempt.objects.filter(application__quest=quest).count()
            print(f"  - Attempts after: {attempts_after}")
            
            if attempts_after == 0:
                print("✓ Application attempts reset successfully")
            else:
                print(f"✗ Application attempts not reset: {attempts_after} remaining")
                return False
                
        else:
            print(f"✗ Mark as failed API failed: {response.status_code}")
            print(f"Response: {response.content.decode()}")
            return False
            
        return True
        
    def test_permission_checks(self, quest, participant1):
        """Test permission checks for mark as failed"""
        print("\n4. Testing permission checks...")
        
        # Logout current user and login as participant (non-creator)
        self.client.logout()
        login_response = self.client.post('/api/auth/login/', {
            'username': 'participant1',
            'password': 'testpass123'
        })
        
        if login_response.status_code != 200:
            print("✗ Failed to login as participant")
            return False
            
        # Try to mark quest as failed (should fail)
        response = self.client.post(f'/api/quests/quests/{quest.slug}/mark-failed/')
        
        if response.status_code == 403:
            print("✓ Permission check works - Non-creator cannot mark as failed")
        else:
            print(f"✗ Permission check failed: {response.status_code}")
            print(f"Response: {response.content.decode()}")
            return False
            
        # Login back as creator
        self.client.logout()
        login_response = self.client.post('/api/auth/login/', {
            'username': 'testcreator',
            'password': 'testpass123'
        })
        
        return login_response.status_code == 200
        
    def test_quest_status_restrictions(self, quest):
        """Test that only appropriate quest statuses can be marked as failed"""
        print("\n5. Testing quest status restrictions...")
        
        # First, test with completed quest
        quest.status = 'completed'
        quest.save()
        
        response = self.client.post(f'/api/quests/quests/{quest.slug}/mark-failed/')
        
        if response.status_code == 400:
            print("✓ Cannot mark completed quest as failed")
        else:
            print(f"✗ Status restriction failed for completed quest: {response.status_code}")
            return False
            
        # Test with open quest
        quest.status = 'open'
        quest.save()
        
        response = self.client.post(f'/api/quests/quests/{quest.slug}/mark-failed/')
        
        if response.status_code == 400:
            print("✓ Cannot mark open quest as failed")
        else:
            print(f"✗ Status restriction failed for open quest: {response.status_code}")
            return False
            
        # Reset to in-progress for further tests
        quest.status = 'in-progress'
        quest.save()
        
        return True
        
    def test_frontend_data_structure(self, quest):
        """Test that the API returns data in the format expected by frontend"""
        print("\n6. Testing frontend data structure...")
        
        # Test quest detail response structure
        response = self.client.get(f'/api/quests/quests/{quest.slug}/')
        if response.status_code != 200:
            print("✗ Failed to get quest details")
            return False
            
        quest_data = response.json()
        
        # Check required fields for frontend
        required_fields = ['id', 'title', 'description', 'status', 'slug', 'creator']
        missing_fields = [field for field in required_fields if field not in quest_data]
        
        if missing_fields:
            print(f"✗ Missing required fields: {missing_fields}")
            return False
        else:
            print("✓ All required fields present in quest data")
            
        # Check status field has correct value
        if quest_data['status'] == quest.status:
            print(f"✓ Status field correct: {quest_data['status']}")
        else:
            print(f"✗ Status field mismatch: API={quest_data['status']}, DB={quest.status}")
            return False
            
        return True
        
    def run_comprehensive_test(self):
        """Run all tests in sequence"""
        print("=== Frontend Integration Test for Mark as Failed Feature ===\n")
        
        try:
            # Create test data
            test_data = self.create_test_data()
            quest = test_data['quest']
            creator = test_data['creator']
            participant1 = test_data['participant1']
            
            # Run test sequence
            tests = [
                (self.test_api_authentication, [creator]),
                (self.test_quest_api_endpoints, [quest]),
                (self.test_frontend_data_structure, [quest]),
                (self.test_permission_checks, [quest, participant1]),
                (self.test_quest_status_restrictions, [quest]),
                (self.test_mark_failed_api, [quest]),
            ]
            
            all_passed = True
            for test_func, args in tests:
                try:
                    if not test_func(*args):
                        all_passed = False
                        break
                except Exception as e:
                    print(f"✗ Test {test_func.__name__} failed with exception: {e}")
                    all_passed = False
                    break
                    
            if all_passed:
                print("\n🎉 All frontend integration tests PASSED!")
                print("\nThe Mark as Failed feature is ready for frontend testing:")
                print("1. ✓ Backend API endpoints work correctly")
                print("2. ✓ Authentication and permissions are enforced")
                print("3. ✓ Quest status restrictions are working")
                print("4. ✓ Application attempts are reset properly")
                print("5. ✓ Data structure matches frontend expectations")
                print("\nNext steps:")
                print("- Start the development server")
                print("- Test the UI manually in the browser")
                print("- Verify the mark as failed button appears for quest creators")
                print("- Test the complete user flow from UI to backend")
            else:
                print("\n❌ Some tests failed. Please check the errors above.")
                
        except Exception as e:
            print(f"\n💥 Test setup failed: {e}")
            import traceback
            traceback.print_exc()
        finally:
            self.cleanup()

if __name__ == '__main__':
    tester = FrontendIntegrationTester()
    tester.run_comprehensive_test()
