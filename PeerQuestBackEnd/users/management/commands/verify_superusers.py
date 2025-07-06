from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Automatically verify all existing superusers'

    def handle(self, *args, **options):
        unverified_superusers = User.objects.filter(is_superuser=True, email_verified=False)
        count = unverified_superusers.count()
        
        if count == 0:
            self.stdout.write(
                self.style.SUCCESS('No unverified superusers found. All superusers are already verified.')
            )
            return
        
        # Update all unverified superusers
        unverified_superusers.update(email_verified=True)
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully verified {count} superuser(s).')
        )
        
        # List the verified superusers
        for user in unverified_superusers:
            self.stdout.write(f'  - {user.username} ({user.email})')
