from django.core.management.base import BaseCommand
from users.models import User

class Command(BaseCommand):
    help = 'Add XP to a user by username or id.'

    def add_arguments(self, parser):
        parser.add_argument('user', type=str, help='Username or user id')
        parser.add_argument('xp', type=int, help='XP to add')

    def handle(self, *args, **options):
        user_identifier = options['user']
        xp_to_add = options['xp']
        try:
            user = User.objects.filter(username=user_identifier).first() or User.objects.filter(id=user_identifier).first()
            if not user:
                self.stdout.write(self.style.ERROR(f'User not found: {user_identifier}'))
                return
            user.experience_points = (user.experience_points or 0) + xp_to_add
            user.save()
            self.stdout.write(self.style.SUCCESS(f'Added {xp_to_add} XP to {user.username}. New XP: {user.experience_points}'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error: {e}'))
