from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from messaging.models import Message, Conversation
from django.utils import timezone

User = get_user_model()

class Command(BaseCommand):
    help = 'Test conversation timestamp updating'

    def handle(self, *args, **options):
        try:
            user1 = User.objects.get(username='user1')
            user2 = User.objects.get(username='user2')
        except User.DoesNotExist as e:
            self.stdout.write(self.style.ERROR(f'User not found: {e}'))
            return

        # Find the conversation between user1 and user2
        conversation = Conversation.objects.filter(
            participants=user1
        ).filter(
            participants=user2
        ).first()

        if not conversation:
            self.stdout.write(self.style.ERROR('No conversation found between user1 and user2'))
            return

        self.stdout.write(f'📋 Testing conversation {conversation.id}')
        self.stdout.write(f'   Participants: {[p.username for p in conversation.participants.all()]}')
        
        # Show current timestamp
        old_timestamp = conversation.updated_at
        self.stdout.write(f'   Current updated_at: {old_timestamp}')

        # Create a test message
        self.stdout.write('📝 Creating test message...')
        message = Message.objects.create(
            sender=user1,
            recipient=user2,
            content=f'Test message at {timezone.now()}',
            conversation=conversation
        )

        # Refresh conversation from database
        conversation.refresh_from_db()
        new_timestamp = conversation.updated_at

        self.stdout.write(f'✅ Message created with ID: {message.id}')
        self.stdout.write(f'   Message timestamp: {message.timestamp}')
        self.stdout.write(f'   Old conversation updated_at: {old_timestamp}')
        self.stdout.write(f'   New conversation updated_at: {new_timestamp}')

        if new_timestamp > old_timestamp:
            self.stdout.write(self.style.SUCCESS('✅ SUCCESS: Conversation timestamp updated!'))
        else:
            self.stdout.write(self.style.ERROR('❌ FAILED: Conversation timestamp not updated'))
            
            # Try manual update
            self.stdout.write('🔧 Trying manual update...')
            conversation.update_timestamp()
            conversation.refresh_from_db()
            manual_timestamp = conversation.updated_at
            
            self.stdout.write(f'   Manual updated_at: {manual_timestamp}')
            
            if manual_timestamp > old_timestamp:
                self.stdout.write(self.style.WARNING('⚠️  Manual update works, but automatic update failed'))
            else:
                self.stdout.write(self.style.ERROR('❌ Even manual update failed'))
