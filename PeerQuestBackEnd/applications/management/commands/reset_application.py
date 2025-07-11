from django.core.management.base import BaseCommand, CommandError
from applications.models import Application

class Command(BaseCommand):
    help = 'Reset an application status to pending for testing'

    def add_arguments(self, parser):
        parser.add_argument('application_id', type=int, help='ID of the application to reset')

    def handle(self, *args, **options):
        app_id = options['application_id']
        # Bypass clean() validation by using update()
        updated = Application.objects.filter(pk=app_id).update(
            status='pending',
            reviewed_by=None,
            reviewed_at=None
        )
        if not updated:
            raise CommandError(f"Application with ID {app_id} does not exist.")
        self.stdout.write(self.style.SUCCESS(f"Application {app_id} status reset to 'pending'."))
