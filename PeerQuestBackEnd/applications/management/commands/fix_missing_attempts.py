from django.core.management.base import BaseCommand
from django.db import transaction
from applications.models import Application, ApplicationAttempt

class Command(BaseCommand):
    help = 'Fix missing application attempt records for existing applications'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true', help='Show what would be fixed without making changes')

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        self.stdout.write(self.style.SUCCESS('🔧 Fixing Missing Application Attempt Records'))
        self.stdout.write('=' * 80)

        # Find applications without attempt records
        applications_without_attempts = Application.objects.exclude(
            id__in=ApplicationAttempt.objects.values_list('application_id', flat=True)
        ).order_by('applied_at')

        if not applications_without_attempts.exists():
            self.stdout.write(self.style.SUCCESS('✅ No missing attempt records found. All applications have attempts.'))
            return

        self.stdout.write(f"Found {applications_without_attempts.count()} applications missing attempt records:")
        self.stdout.write('-' * 80)

        for app in applications_without_attempts:
            self.stdout.write(f"  App ID: {app.id} | {app.applicant.username} -> {app.quest.title}")
            self.stdout.write(f"    Status: {app.status} | Applied: {app.applied_at}")

        self.stdout.write('-' * 80)

        if dry_run:
            self.stdout.write(self.style.WARNING('🏃 DRY RUN MODE - No changes will be made'))
            self.stdout.write("Would create attempt records for the above applications.")
            return

        # Create missing attempt records
        self.stdout.write("Creating missing attempt records...")
        
        with transaction.atomic():
            created_count = 0
            
            for app in applications_without_attempts:
                try:
                    # Calculate the correct attempt number for this user/quest combination
                    existing_attempts = ApplicationAttempt.objects.filter(
                        quest=app.quest,
                        applicant=app.applicant,
                        timestamp__lt=app.applied_at
                    ).count()
                    
                    attempt_number = existing_attempts + 1
                    
                    # Create the missing attempt record
                    attempt = ApplicationAttempt.objects.create(
                        quest=app.quest,
                        applicant=app.applicant,
                        application=app,
                        attempt_number=attempt_number,
                        timestamp=app.applied_at  # Use the application's timestamp
                    )
                    
                    self.stdout.write(f"  ✅ Created attempt #{attempt_number} for application {app.id}")
                    created_count += 1
                    
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"  ❌ Failed to create attempt for application {app.id}: {str(e)}"))

        self.stdout.write('-' * 80)
        self.stdout.write(self.style.SUCCESS(f'🎯 Successfully created {created_count} missing attempt records'))

        # Verify the fix
        remaining_missing = Application.objects.exclude(
            id__in=ApplicationAttempt.objects.values_list('application_id', flat=True)
        ).count()
        
        if remaining_missing == 0:
            self.stdout.write(self.style.SUCCESS('✅ All applications now have attempt records!'))
        else:
            self.stdout.write(self.style.ERROR(f'⚠️  {remaining_missing} applications still missing attempt records'))

        self.stdout.write('=' * 80)
