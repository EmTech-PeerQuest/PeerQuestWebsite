from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from messaging.models import Message, Conversation
from django.db.models import Q

User = get_user_model()

class Command(BaseCommand):
    help = 'Fix conversation creation issues'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Delete all conversations and recreate them',
        )

    def handle(self, *args, **options):
        reset = options['reset']
        
        if reset:
            self.stdout.write(self.style.WARNING('🗑️  Deleting all existing conversations...'))
            Conversation.objects.all().delete()
            # Reset conversation field in messages
            Message.objects.all().update(conversation=None)
        
        # Find all unique sender/recipient pairs
        messages = Message.objects.all()
        conversation_pairs = set()
        
        for message in messages:
            pair = tuple(sorted([message.sender.id, message.recipient.id]))
            conversation_pairs.add(pair)
        
        self.stdout.write(f'🔍 Found {len(conversation_pairs)} unique conversation pairs')
        
        conversations_created = 0
        
        for sender_id, recipient_id in conversation_pairs:
            sender = User.objects.get(id=sender_id)
            recipient = User.objects.get(id=recipient_id)
            
            # Check if conversation already exists between exactly these two users
            existing_conv = None
            for conv in Conversation.objects.filter(participants=sender).filter(participants=recipient):
                # Check if this conversation has exactly 2 participants (sender and recipient)
                if conv.participants.count() == 2:
                    existing_conv = conv
                    break

            if not existing_conv:
                # Create new conversation
                conversation = Conversation.objects.create()
                conversation.participants.add(sender, recipient)
                conversations_created += 1
                
                self.stdout.write(f'✅ Created conversation between {sender.username} and {recipient.username}')
            else:
                conversation = existing_conv
                self.stdout.write(f'ℹ️  Using existing conversation between {sender.username} and {recipient.username}')
            
            # Link messages to this conversation
            messages_to_update = Message.objects.filter(
                Q(sender=sender, recipient=recipient) | Q(sender=recipient, recipient=sender),
                conversation__isnull=True
            )
            
            updated_count = messages_to_update.update(conversation=conversation)
            if updated_count > 0:
                self.stdout.write(f'   └─ Linked {updated_count} messages')
        
        self.stdout.write(self.style.SUCCESS(f'\n🎉 Summary: Created {conversations_created} new conversations'))
        
        # Final verification
        total_conversations = Conversation.objects.count()
        orphaned_messages = Message.objects.filter(conversation__isnull=True).count()
        
        self.stdout.write(f'📊 Total conversations: {total_conversations}')
        self.stdout.write(f'📊 Orphaned messages: {orphaned_messages}')
