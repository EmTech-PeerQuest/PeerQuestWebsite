from django.core.management.base import BaseCommand
from messaging.models import Conversation
from django.db.models import Max

class Command(BaseCommand):
    help = 'Fix conversation timestamps based on their latest messages'

    def handle(self, *args, **options):
        conversations = Conversation.objects.all()
        
        self.stdout.write(f'Fixing timestamps for {conversations.count()} conversations...')
        
        updated_count = 0
        
        for conversation in conversations:
            # Get the latest message timestamp
            latest_message_time = conversation.messages.aggregate(
                latest=Max('timestamp')
            )['latest']
            
            if latest_message_time:
                # Get the earliest message timestamp for created_at
                earliest_message_time = conversation.messages.order_by('timestamp').first()
                
                if earliest_message_time:
                    conversation.created_at = earliest_message_time.timestamp
                
                conversation.updated_at = latest_message_time
                conversation.save(update_fields=['created_at', 'updated_at'])
                updated_count += 1
                
                participants = [p.username for p in conversation.participants.all()]
                self.stdout.write(f'✓ Updated conversation between {", ".join(participants)}')
        
        self.stdout.write(self.style.SUCCESS(f'Updated {updated_count} conversations'))
