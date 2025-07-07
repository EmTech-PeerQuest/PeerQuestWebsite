#!/usr/bin/env python3
"""
Comprehensive Test for Submission Status Review System

This test verifies the complete submission review workflow:
1. Creating test data with quest and submissions
2. Testing the three new submission actions (approve, reject, needs_revision)
3. Verifying correct behavior for each action
4. Testing frontend integration endpoints
"""

import os
import sys
import django
from django.test import Client
from django.contrib.auth import get_user_model

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from quests.models import Quest, QuestCategory, QuestParticipant, QuestSubmission
from applications.models import Application, ApplicationAttempt

class SubmissionReviewTester:
    def __init__(self):
        self.client = Client()
        self.cleanup_data = []
        
    def cleanup(self):
        """Clean up test data"""
        for model, ids in reversed(self.cleanup_data):
            model.objects.filter(id__in=ids).delete()
        print("✓ Cleanup completed")
        
    def create_test_data(self):
        """Create test users, quest, participants, and submissions"""
        print("Creating test data...")
        
        # Create users
        creator = User.objects.create_user(
            username='questcreator',
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
            title='Test Quest for Submission Review',
            description='A quest to test submission review functionality',
            category=category,
            creator=creator,
            difficulty='adventurer',
            status='in-progress',
            xp_reward=50,
            gold_reward=25
        )
        self.cleanup_data.append((Quest, [quest.id]))
        
        # Create quest participants
        participant_1 = QuestParticipant.objects.create(
            quest=quest,
            user=participant1,
            status='joined'
        )
        
        participant_2 = QuestParticipant.objects.create(
            quest=quest,
            user=participant2,
            status='joined'
        )
        
        self.cleanup_data.append((QuestParticipant, [participant_1.id, participant_2.id]))
        
        # Create applications for attempt tracking
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
        
        # Create application attempts for testing reset functionality
        attempt1 = ApplicationAttempt.objects.create(
            application=app1,
            attempt_number=1,
            status='pending'
        )
        
        attempt2 = ApplicationAttempt.objects.create(
            application=app2,
            attempt_number=1,
            status='pending'
        )
        
        attempt3 = ApplicationAttempt.objects.create(
            application=app2,
            attempt_number=2,
            status='rejected'
        )
        
        self.cleanup_data.append((ApplicationAttempt, [attempt1.id, attempt2.id, attempt3.id]))
        
        # Create test submissions
        submission1 = QuestSubmission.objects.create(
            quest_participant=participant_1,
            description='This is my first submission attempt',
            status='pending'
        )
        
        submission2 = QuestSubmission.objects.create(
            quest_participant=participant_2,
            description='This is my second submission attempt',
            status='pending'
        )
        
        submission3 = QuestSubmission.objects.create(
            quest_participant=participant_1,
            description='This is my revised submission',
            status='needs_revision'
        )
        
        self.cleanup_data.append((QuestSubmission, [submission1.id, submission2.id, submission3.id]))
        
        return {
            'creator': creator,
            'participant1': participant1,
            'participant2': participant2,
            'quest': quest,
            'participants': [participant_1, participant_2],
            'applications': [app1, app2],
            'attempts': [attempt1, attempt2, attempt3],
            'submissions': [submission1, submission2, submission3]
        }
        
    def test_authentication(self, creator):
        """Test API authentication"""
        print("\n1. Testing API authentication...")
        
        login_response = self.client.post('/api/auth/login/', {
            'username': 'questcreator',
            'password': 'testpass123'
        })
        
        if login_response.status_code == 200:
            print("✓ Login successful")
            return True
        else:
            print(f"✗ Login failed: {login_response.status_code}")
            return False
            
    def test_submission_approve(self, submission, quest):
        """Test approving a submission"""
        print("\n2. Testing submission approval...")
        
        # Check participant status before approval
        participant = submission.quest_participant
        initial_status = participant.status
        print(f"  - Participant initial status: {initial_status}")
        
        # Test approve endpoint
        response = self.client.post(f'/api/quests/submissions/{submission.id}/approve/', {
            'feedback': 'Great work! Approved.'
        }, content_type='application/json')
        
        if response.status_code == 200:
            result = response.json()
            print(f"✓ Submission approved successfully")
            print(f"  - Response: {result}")
            
            # Verify submission status changed
            submission.refresh_from_db()
            if submission.status == 'approved':
                print("✓ Submission status updated to 'approved'")
            else:
                print(f"✗ Submission status not updated correctly: {submission.status}")
                return False
                
            # Verify participant status changed to completed
            participant.refresh_from_db()
            if participant.status == 'completed':
                print("✓ Participant status updated to 'completed'")
            else:
                print(f"✗ Participant status not updated correctly: {participant.status}")
                return False
                
            # Verify feedback was saved
            if submission.feedback == 'Great work! Approved.':
                print("✓ Feedback saved correctly")
            else:
                print(f"✗ Feedback not saved correctly: {submission.feedback}")
                return False
                
        else:
            print(f"✗ Submission approval failed: {response.status_code}")
            print(f"Response: {response.content.decode()}")
            return False
            
        return True
        
    def test_submission_reject(self, submission, quest):
        """Test rejecting a submission"""
        print("\n3. Testing submission rejection...")
        
        participant = submission.quest_participant
        user = participant.user
        
        # Check attempts before rejection
        attempts_before = ApplicationAttempt.objects.filter(quest=quest, user=user).count()
        print(f"  - Attempts before rejection: {attempts_before}")
        
        # Test reject endpoint
        response = self.client.post(f'/api/quests/submissions/{submission.id}/reject/', {
            'feedback': 'Please revise and resubmit.'
        }, content_type='application/json')
        
        if response.status_code == 200:
            result = response.json()
            print(f"✓ Submission rejected successfully")
            print(f"  - Response: {result}")
            
            # Verify submission status changed
            submission.refresh_from_db()
            if submission.status == 'rejected':
                print("✓ Submission status updated to 'rejected'")
            else:
                print(f"✗ Submission status not updated correctly: {submission.status}")
                return False
                
            # Verify attempts were reset
            attempts_after = ApplicationAttempt.objects.filter(quest=quest, user=user).count()
            print(f"  - Attempts after rejection: {attempts_after}")
            
            if attempts_after == 0:
                print("✓ Application attempts reset successfully")
            else:
                print(f"✗ Application attempts not reset: {attempts_after} remaining")
                return False
                
            # Verify feedback was saved
            if submission.feedback == 'Please revise and resubmit.':
                print("✓ Feedback saved correctly")
            else:
                print(f"✗ Feedback not saved correctly: {submission.feedback}")
                return False
                
        else:
            print(f"✗ Submission rejection failed: {response.status_code}")
            print(f"Response: {response.content.decode()}")
            return False
            
        return True
        
    def test_submission_needs_revision(self, submission):
        """Test marking submission as needing revision"""
        print("\n4. Testing submission needs revision...")
        
        # Test needs_revision endpoint
        response = self.client.post(f'/api/quests/submissions/{submission.id}/needs_revision/', {
            'feedback': 'Good start, but needs some improvements.'
        }, content_type='application/json')
        
        if response.status_code == 200:
            result = response.json()
            print(f"✓ Submission marked as needs revision successfully")
            print(f"  - Response: {result}")
            
            # Verify submission status changed
            submission.refresh_from_db()
            if submission.status == 'needs_revision':
                print("✓ Submission status updated to 'needs_revision'")
            else:
                print(f"✗ Submission status not updated correctly: {submission.status}")
                return False
                
            # Verify feedback was saved
            if submission.feedback == 'Good start, but needs some improvements.':
                print("✓ Feedback saved correctly")
            else:
                print(f"✗ Feedback not saved correctly: {submission.feedback}")
                return False
                
            # Verify participant can still resubmit (status should remain as joined/in_progress)
            participant = submission.quest_participant
            if participant.status in ['joined', 'in_progress']:
                print("✓ Participant can still resubmit")
            else:
                print(f"✗ Participant status changed unexpectedly: {participant.status}")
                return False
                
        else:
            print(f"✗ Marking submission as needs revision failed: {response.status_code}")
            print(f"Response: {response.content.decode()}")
            return False
            
        return True
        
    def test_permission_checks(self, submission, participant1):
        """Test permission checks for submission review"""
        print("\n5. Testing permission checks...")
        
        # Logout current user and login as participant (non-creator)
        self.client.logout()
        login_response = self.client.post('/api/auth/login/', {
            'username': 'participant1',
            'password': 'testpass123'
        })
        
        if login_response.status_code != 200:
            print("✗ Failed to login as participant")
            return False
            
        # Try to approve submission (should fail)
        response = self.client.post(f'/api/quests/submissions/{submission.id}/approve/', {
            'feedback': 'Unauthorized attempt'
        }, content_type='application/json')
        
        if response.status_code == 403:
            print("✓ Permission check works - Non-creator cannot review submissions")
        else:
            print(f"✗ Permission check failed: {response.status_code}")
            return False
            
        # Login back as creator
        self.client.logout()
        login_response = self.client.post('/api/auth/login/', {
            'username': 'questcreator',
            'password': 'testpass123'
        })
        
        return login_response.status_code == 200
        
    def test_frontend_api_structure(self, quest):
        """Test that API returns data in correct format for frontend"""
        print("\n6. Testing frontend API structure...")
        
        # Test quest submissions endpoint
        response = self.client.get(f'/api/quests/quests/{quest.slug}/submissions/')
        if response.status_code != 200:
            print("✗ Failed to get quest submissions")
            return False
            
        submissions_data = response.json()
        
        if isinstance(submissions_data, list) and len(submissions_data) > 0:
            submission = submissions_data[0]
            required_fields = ['id', 'status', 'description', 'submitted_at', 'participant_username']
            missing_fields = [field for field in required_fields if field not in submission]
            
            if missing_fields:
                print(f"✗ Missing required fields in submission data: {missing_fields}")
                return False
            else:
                print("✓ All required fields present in submission data")
                
            # Check status values are correct
            valid_statuses = ['pending', 'approved', 'rejected', 'needs_revision']
            if submission['status'] in valid_statuses:
                print(f"✓ Submission status is valid: {submission['status']}")
            else:
                print(f"✗ Invalid submission status: {submission['status']}")
                return False
        else:
            print("✓ Submissions endpoint returns list (empty is OK for this test)")
            
        return True
        
    def run_comprehensive_test(self):
        """Run all tests in sequence"""
        print("=== Comprehensive Submission Review System Test ===\n")
        
        try:
            # Create test data
            test_data = self.create_test_data()
            creator = test_data['creator']
            participant1 = test_data['participant1']
            quest = test_data['quest']
            submissions = test_data['submissions']
            
            # Run test sequence
            tests = [
                (self.test_authentication, [creator]),
                (self.test_frontend_api_structure, [quest]),
                (self.test_submission_approve, [submissions[0], quest]),
                (self.test_submission_reject, [submissions[1], quest]),
                (self.test_submission_needs_revision, [submissions[2]]),
                (self.test_permission_checks, [submissions[2], participant1]),
            ]
            
            all_passed = True
            for test_func, args in tests:
                try:
                    if not test_func(*args):
                        all_passed = False
                        break
                except Exception as e:
                    print(f"✗ Test {test_func.__name__} failed with exception: {e}")
                    import traceback
                    traceback.print_exc()
                    all_passed = False
                    break
                    
            if all_passed:
                print("\n🎉 All submission review tests PASSED!")
                print("\nThe Submission Review System is working correctly:")
                print("1. ✓ Approve submission - marks participant as completed")
                print("2. ✓ Reject submission - resets attempt counter")
                print("3. ✓ Needs revision - allows participant to resubmit")
                print("4. ✓ Proper permission checks in place")
                print("5. ✓ API returns correct data structure for frontend")
                print("\nNext steps:")
                print("- Start frontend development server")
                print("- Test the three submission review buttons in the UI")
                print("- Verify submission status changes and feedback display")
                print("- Test the complete user workflow from submission to review")
            else:
                print("\n❌ Some tests failed. Please check the errors above.")
                
        except Exception as e:
            print(f"\n💥 Test setup failed: {e}")
            import traceback
            traceback.print_exc()
        finally:
            self.cleanup()

if __name__ == '__main__':
    tester = SubmissionReviewTester()
    tester.run_comprehensive_test()
