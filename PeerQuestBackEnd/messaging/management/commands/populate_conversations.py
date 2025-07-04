from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from messaging.models import Message, Conversation
from django.db.models import Q
from django.utils import timezone

User = get_user_model()

class Command(BaseCommand):
    help = 'Populate Conversations table based on existing messages'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without actually doing it',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No changes will be made'))
        
        # Get all messages that don't have a conversation assigned
        messages_without_conversation = Message.objects.filter(conversation__isnull=True)
        
        self.stdout.write(f'Found {messages_without_conversation.count()} messages without conversations')
        
        # Find all unique sender/recipient pairs
        conversation_pairs = set()
        
        for message in messages_without_conversation:
            # Create a sorted tuple to ensure (user1, user2) and (user2, user1) are treated as the same conversation
            pair = tuple(sorted([message.sender.id, message.recipient.id]))
            conversation_pairs.add(pair)
        
        self.stdout.write(f'Found {len(conversation_pairs)} unique conversation pairs')
        
        conversations_created = 0
        messages_updated = 0
        
        for sender_id, recipient_id in conversation_pairs:
            try:
                sender = User.objects.get(id=sender_id)
                recipient = User.objects.get(id=recipient_id)
                
                self.stdout.write(f'Processing conversation between {sender.username} and {recipient.username}')
                
                if not dry_run:
                    # Create or get the conversation
                    conversation, created = Conversation.objects.get_or_create(
                        defaults={'created_at': timezone.now()}
                    )
                    
                    # Add participants
                    conversation.participants.add(sender, recipient)
                    
                    if created:
                        conversations_created += 1
                        self.stdout.write(f'  ✓ Created new conversation (ID: {conversation.id})')
                    else:
                        self.stdout.write(f'  → Using existing conversation (ID: {conversation.id})')
                    
                    # Find all messages between these two users
                    messages_to_update = Message.objects.filter(
                        Q(sender=sender, recipient=recipient) | Q(sender=recipient, recipient=sender),
                        conversation__isnull=True
                    )
                    
                    # Update messages to link to this conversation
                    updated_count = messages_to_update.update(conversation=conversation)
                    messages_updated += updated_count
                    
                    # Update conversation's updated_at to match the latest message
                    latest_message = messages_to_update.order_by('-timestamp').first()
                    if latest_message:
                        conversation.updated_at = latest_message.timestamp
                        conversation.save(update_fields=['updated_at'])
                    
                    self.stdout.write(f'  ✓ Updated {updated_count} messages')
                else:
                    # Dry run - just count what would be updated
                    messages_count = Message.objects.filter(
                        Q(sender_id=sender_id, recipient_id=recipient_id) | 
                        Q(sender_id=recipient_id, recipient_id=sender_id),
                        conversation__isnull=True
                    ).count()
                    
                    self.stdout.write(f'  → Would create conversation and update {messages_count} messages')
                    conversations_created += 1
                    messages_updated += messages_count
                    
            except User.DoesNotExist as e:
                self.stdout.write(self.style.ERROR(f'User not found: {e}'))
                continue
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error processing pair {sender_id}, {recipient_id}: {e}'))
                continue
        
        # Summary
        if dry_run:
            self.stdout.write(self.style.SUCCESS(f'\nDRY RUN SUMMARY:'))
            self.stdout.write(f'Would create: {conversations_created} conversations')
            self.stdout.write(f'Would update: {messages_updated} messages')
            self.stdout.write(f'\nRun without --dry-run to apply changes')
        else:
            self.stdout.write(self.style.SUCCESS(f'\nSUMMARY:'))
            self.stdout.write(f'Created: {conversations_created} conversations')
            self.stdout.write(f'Updated: {messages_updated} messages')
            
            # Verify results
            remaining_messages = Message.objects.filter(conversation__isnull=True).count()
            total_conversations = Conversation.objects.count()
            
            self.stdout.write(f'Remaining messages without conversation: {remaining_messages}')
            self.stdout.write(f'Total conversations in database: {total_conversations}')
            
            if remaining_messages == 0:
                self.stdout.write(self.style.SUCCESS('✓ All messages now have conversations!'))
            else:
                self.stdout.write(self.style.WARNING(f'⚠ {remaining_messages} messages still need conversations'))
