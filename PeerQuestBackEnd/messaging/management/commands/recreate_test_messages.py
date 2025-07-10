from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from messaging.models import Message
from django.utils import timezone
import random

User = get_user_model()

class Command(BaseCommand):
    help = 'Recreate test messages that were accidentally deleted'

    def handle(self, *args, **options):
        try:
            user1 = User.objects.get(username='user1')
            user2 = User.objects.get(username='user2')
            user3 = User.objects.get(username='user3')
        except User.DoesNotExist as e:
            self.stdout.write(self.style.ERROR(f'User not found: {e}'))
            return

        self.stdout.write('🔄 Recreating test messages...')

        # Messages from user1 to user2 (12 messages)
        user1_to_user2_messages = [
            "Hi",
            "Hello",
            "Tangina mowwwwww",
            "Hi",
            "ano na",
            "Yo",
            "Ano suntukan",
            "Tangina mo!!!!",
            "What the helly",
            "dfgdfgdf",
            "dfgdfgdfg",
            "fdfdfdfd"  # This one already exists
        ]

        # Messages from user2 to user1 (1 message)
        user2_to_user1_messages = [
            "Pakyu"
        ]

        # Messages from user1 to user3 (7 messages)
        user1_to_user3_messages = [
            "What the helly",
            "Nuks gumagana na",
            "Ha",
            "Haduken",
            "The helly",
            "asdsadasd",
            "asdsa"
        ]

        created_count = 0
        base_time = timezone.now() - timezone.timedelta(days=1)

        # Create user1 → user2 messages (skip the last one as it exists)
        for i, content in enumerate(user1_to_user2_messages[:-1]):
            if not Message.objects.filter(sender=user1, recipient=user2, content=content).exists():
                Message.objects.create(
                    sender=user1,
                    recipient=user2,
                    content=content,
                    timestamp=base_time + timezone.timedelta(minutes=i*10)
                )
                created_count += 1
                self.stdout.write(f'✅ Created: user1 → user2: "{content}"')

        # Create user2 → user1 messages
        for i, content in enumerate(user2_to_user1_messages):
            if not Message.objects.filter(sender=user2, recipient=user1, content=content).exists():
                Message.objects.create(
                    sender=user2,
                    recipient=user1,
                    content=content,
                    timestamp=base_time + timezone.timedelta(minutes=(len(user1_to_user2_messages) + i)*10)
                )
                created_count += 1
                self.stdout.write(f'✅ Created: user2 → user1: "{content}"')

        # Create user1 → user3 messages
        for i, content in enumerate(user1_to_user3_messages):
            if not Message.objects.filter(sender=user1, recipient=user3, content=content).exists():
                Message.objects.create(
                    sender=user1,
                    recipient=user3,
                    content=content,
                    timestamp=base_time + timezone.timedelta(minutes=(len(user1_to_user2_messages) + len(user2_to_user1_messages) + i)*10)
                )
                created_count += 1
                self.stdout.write(f'✅ Created: user1 → user3: "{content}"')

        self.stdout.write(self.style.SUCCESS(f'\n🎉 Created {created_count} messages'))
        
        # Show final count
        total_messages = Message.objects.count()
        self.stdout.write(f'📊 Total messages in database: {total_messages}')
