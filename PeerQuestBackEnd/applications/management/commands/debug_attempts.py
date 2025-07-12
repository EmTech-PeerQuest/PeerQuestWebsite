from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from applications.models import Application, ApplicationAttempt
from quests.models import Quest
from django.db import transaction

User = get_user_model()


class Command(BaseCommand):
    help = 'Debug application attempts in the database'

    def add_arguments(self, parser):
        parser.add_argument('--user', type=str, help='Username to debug')
        parser.add_argument('--quest', type=int, help='Quest ID to debug')
        parser.add_argument('--clear', action='store_true', help='Clear all application attempts for testing')
        parser.add_argument('--test', action='store_true', help='Run test application creation')

    def handle(self, *args, **options):
        if options['clear']:
            self.clear_attempts()
            return

        if options['test']:
            self.test_application_creation()
            return

        username = options.get('user')
        quest_id = options.get('quest')

        if username and quest_id:
            self.debug_specific_user_quest(username, quest_id)
        elif username:
            self.debug_user(username)
        elif quest_id:
            self.debug_quest(quest_id)
        else:
            self.debug_all()

    def clear_attempts(self):
        """Clear all application attempts for testing"""
        count = ApplicationAttempt.objects.count()
        ApplicationAttempt.objects.all().delete()
        self.stdout.write(
            self.style.SUCCESS(f'Cleared {count} application attempts from database')
        )

    def test_application_creation(self):
        """Test application creation to see if attempts are recorded"""
        # Get first user and quest for testing
        user = User.objects.first()
        quest = Quest.objects.filter(status='open').first()
        
        if not user or not quest:
            self.stdout.write(
                self.style.ERROR('No user or open quest found for testing')
            )
            return

        self.stdout.write(f'Testing application creation:')
        self.stdout.write(f'User: {user.username}')
        self.stdout.write(f'Quest: {quest.title} (ID: {quest.id})')

        # Check initial attempt count
        initial_count = ApplicationAttempt.get_attempt_count(quest, user)
        self.stdout.write(f'Initial attempt count: {initial_count}')

        # Create application
        try:
            with transaction.atomic():
                application = Application.objects.create(
                    quest=quest,
                    applicant=user,
                    status='pending'
                )
                self.stdout.write(f'Created application: {application.id}')
                
                # Check if attempt was recorded
                new_count = ApplicationAttempt.get_attempt_count(quest, user)
                self.stdout.write(f'New attempt count: {new_count}')
                
                # Check ApplicationAttempt records
                attempts = ApplicationAttempt.objects.filter(quest=quest, applicant=user)
                self.stdout.write(f'ApplicationAttempt records: {attempts.count()}')
                
                for attempt in attempts:
                    self.stdout.write(f'  - Attempt #{attempt.attempt_number}, App ID: {attempt.application.id}')

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error creating application: {e}')
            )

    def debug_specific_user_quest(self, username, quest_id):
        """Debug specific user-quest combination"""
        try:
            user = User.objects.get(username=username)
            quest = Quest.objects.get(id=quest_id)
        except (User.DoesNotExist, Quest.DoesNotExist) as e:
            self.stdout.write(self.style.ERROR(f'Error: {e}'))
            return

        self.stdout.write(f'\n=== Debugging {username} - Quest {quest_id} ({quest.title}) ===')
        
        # Applications
        applications = Application.objects.filter(quest=quest, applicant=user).order_by('-applied_at')
        self.stdout.write(f'\nApplications ({applications.count()}):')
        for app in applications:
            self.stdout.write(f'  ID: {app.id}, Status: {app.status}, Applied: {app.applied_at}')

        # Application Attempts
        attempts = ApplicationAttempt.objects.filter(quest=quest, applicant=user).order_by('-timestamp')
        self.stdout.write(f'\nApplication Attempts ({attempts.count()}):')
        for attempt in attempts:
            self.stdout.write(f'  Attempt #{attempt.attempt_number}, App ID: {attempt.application.id}, Time: {attempt.timestamp}')

        # Check attempt count method
        attempt_count = ApplicationAttempt.get_attempt_count(quest, user)
        self.stdout.write(f'\nget_attempt_count() result: {attempt_count}')

        # Check can_apply_again
        can_apply, reason = ApplicationAttempt.can_apply_again(quest, user)
        self.stdout.write(f'can_apply_again(): {can_apply}, reason: {reason}')

    def debug_user(self, username):
        """Debug all applications for a user"""
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'User {username} not found'))
            return

        self.stdout.write(f'\n=== Debugging User: {username} ===')
        
        # All applications
        applications = Application.objects.filter(applicant=user).order_by('-applied_at')
        self.stdout.write(f'\nTotal Applications: {applications.count()}')
        
        for app in applications:
            self.stdout.write(f'  Quest: {app.quest.title} (ID: {app.quest.id})')
            self.stdout.write(f'    Status: {app.status}, Applied: {app.applied_at}')
            
            # Check attempts for this quest
            attempts = ApplicationAttempt.objects.filter(quest=app.quest, applicant=user)
            self.stdout.write(f'    Attempts: {attempts.count()}')

    def debug_quest(self, quest_id):
        """Debug all applications for a quest"""
        try:
            quest = Quest.objects.get(id=quest_id)
        except Quest.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'Quest {quest_id} not found'))
            return

        self.stdout.write(f'\n=== Debugging Quest: {quest.title} (ID: {quest_id}) ===')
        
        # All applications
        applications = Application.objects.filter(quest=quest).order_by('-applied_at')
        self.stdout.write(f'\nTotal Applications: {applications.count()}')
        
        for app in applications:
            self.stdout.write(f'  User: {app.applicant.username}')
            self.stdout.write(f'    Status: {app.status}, Applied: {app.applied_at}')
            
            # Check attempts for this user
            attempts = ApplicationAttempt.objects.filter(quest=quest, applicant=app.applicant)
            self.stdout.write(f'    Attempts: {attempts.count()}')

    def debug_all(self):
        """Debug overview of all applications and attempts"""
        self.stdout.write('\n=== Database Overview ===')
        
        total_applications = Application.objects.count()
        total_attempts = ApplicationAttempt.objects.count()
        
        self.stdout.write(f'Total Applications: {total_applications}')
        self.stdout.write(f'Total Application Attempts: {total_attempts}')
        
        # Check for applications without attempts
        apps_without_attempts = []
        for app in Application.objects.all():
            if not ApplicationAttempt.objects.filter(application=app).exists():
                apps_without_attempts.append(app)
        
        if apps_without_attempts:
            self.stdout.write(f'\nApplications WITHOUT ApplicationAttempt records: {len(apps_without_attempts)}')
            for app in apps_without_attempts[:10]:  # Show first 10
                self.stdout.write(f'  App ID: {app.id}, User: {app.applicant.username}, Quest: {app.quest.title}, Status: {app.status}')
        
        # Check for orphaned attempts
        orphaned_attempts = ApplicationAttempt.objects.filter(application__isnull=True)
        if orphaned_attempts.exists():
            self.stdout.write(f'\nOrphaned ApplicationAttempt records: {orphaned_attempts.count()}')
        
        # Recent applications and their attempts
        recent_apps = Application.objects.order_by('-applied_at')[:5]
        self.stdout.write(f'\nRecent Applications:')
        for app in recent_apps:
            attempts = ApplicationAttempt.objects.filter(application=app)
            self.stdout.write(f'  App ID: {app.id}, User: {app.applicant.username}, Attempts: {attempts.count()}')
