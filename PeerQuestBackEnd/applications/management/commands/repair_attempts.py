from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from applications.models import Application, ApplicationAttempt
from django.db import transaction

User = get_user_model()


class Command(BaseCommand):
    help = 'Repair missing ApplicationAttempt records for existing applications'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true', 
                          help='Show what would be done without actually doing it')

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No changes will be made'))
        
        # Find applications without ApplicationAttempt records
        applications_without_attempts = []
        
        for app in Application.objects.all().order_by('applied_at'):
            if not ApplicationAttempt.objects.filter(application=app).exists():
                applications_without_attempts.append(app)
        
        if not applications_without_attempts:
            self.stdout.write(self.style.SUCCESS('No missing ApplicationAttempt records found'))
            return
        
        self.stdout.write(f'Found {len(applications_without_attempts)} applications without ApplicationAttempt records:')
        
        for app in applications_without_attempts:
            self.stdout.write(f'  App ID: {app.id}, User: {app.applicant.username}, Quest: {app.quest.title}, Status: {app.status}')
        
        if not dry_run:
            self.stdout.write('\nCreating missing ApplicationAttempt records...')
            
            # First, let's clear all existing ApplicationAttempt records and recreate them properly
            self.stdout.write('Clearing existing ApplicationAttempt records to rebuild properly...')
            ApplicationAttempt.objects.all().delete()
            
            # Group applications by user+quest to determine correct attempt numbers
            user_quest_apps = {}
            
            # Get all applications grouped by user and quest
            for app in Application.objects.all().order_by('applied_at'):
                key = (app.applicant.id, app.quest.id)
                if key not in user_quest_apps:
                    user_quest_apps[key] = []
                user_quest_apps[key].append(app)
            
            created_count = 0
            
            with transaction.atomic():
                for (user_id, quest_id), apps in user_quest_apps.items():
                    # Sort applications by creation time
                    apps.sort(key=lambda x: x.applied_at)
                    
                    for i, app in enumerate(apps, 1):
                        # Create ApplicationAttempt with correct attempt number
                        ApplicationAttempt.objects.create(
                            quest=app.quest,
                            applicant=app.applicant,
                            application=app,
                            attempt_number=i
                        )
                        created_count += 1
                        self.stdout.write(f'  Created attempt #{i} for App ID {app.id}')
            
            self.stdout.write(
                self.style.SUCCESS(f'Successfully created {created_count} ApplicationAttempt records')
            )
            
            # Verify the fix
            self.stdout.write('\nVerifying fix...')
            remaining_missing = []
            for app in Application.objects.all():
                if not ApplicationAttempt.objects.filter(application=app).exists():
                    remaining_missing.append(app)
            
            if remaining_missing:
                self.stdout.write(
                    self.style.ERROR(f'Still missing {len(remaining_missing)} ApplicationAttempt records')
                )
            else:
                self.stdout.write(
                    self.style.SUCCESS('All applications now have ApplicationAttempt records!')
                )
        else:
            self.stdout.write('\nUse --dry-run=false to actually create the missing records')
