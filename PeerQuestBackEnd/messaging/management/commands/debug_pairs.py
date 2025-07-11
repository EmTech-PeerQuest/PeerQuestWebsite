from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from messaging.models import Message, Conversation
from django.db.models import Q

User = get_user_model()

class Command(BaseCommand):
    help = 'Debug conversation pair detection'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('=== PAIR DETECTION DEBUG ===\n'))
        
        # Get all messages
        messages = Message.objects.all().order_by('timestamp')
        self.stdout.write(f'📧 Total messages: {messages.count()}')
        
        # Show each message and its pair
        conversation_pairs = set()
        pair_details = {}
        
        for message in messages:
            sender_id = message.sender.id
            recipient_id = message.recipient.id
            
            # Create sorted pair
            pair = tuple(sorted([sender_id, recipient_id]))
            conversation_pairs.add(pair)
            
            # Track details for each pair
            if pair not in pair_details:
                pair_details[pair] = {
                    'messages': [],
                    'users': set([sender_id, recipient_id])
                }
            
            pair_details[pair]['messages'].append({
                'sender': message.sender.username,
                'recipient': message.recipient.username,
                'content': message.content[:20] + '...',
                'conversation': message.conversation_id
            })
        
        self.stdout.write(f'\n🔍 Unique pairs found: {len(conversation_pairs)}')
        
        # Show details for each pair
        for i, pair in enumerate(conversation_pairs, 1):
            user1_id, user2_id = pair
            user1 = User.objects.get(id=user1_id)
            user2 = User.objects.get(id=user2_id)
            
            details = pair_details[pair]
            
            self.stdout.write(f'\n📋 Pair {i}: {user1.username} ↔ {user2.username}')
            self.stdout.write(f'   Users: {user1_id} & {user2_id}')
            self.stdout.write(f'   Messages: {len(details["messages"])}')
            
            # Count messages in each direction
            user1_to_user2 = sum(1 for msg in details['messages'] if msg['sender'] == user1.username)
            user2_to_user1 = sum(1 for msg in details['messages'] if msg['sender'] == user2.username)
            
            self.stdout.write(f'   Direction: {user1.username} → {user2.username}: {user1_to_user2}')
            self.stdout.write(f'   Direction: {user2.username} → {user1.username}: {user2_to_user1}')
            
            # Show first few messages
            self.stdout.write(f'   Sample messages:')
            for msg in details['messages'][:3]:
                self.stdout.write(f'     • {msg["sender"]} → {msg["recipient"]}: {msg["content"]} (Conv: {msg["conversation"]})')
            
            if len(details['messages']) > 3:
                self.stdout.write(f'     • ... and {len(details["messages"]) - 3} more')
        
        # Check for any issues
        self.stdout.write(f'\n🔧 ANALYSIS:')
        
        if len(conversation_pairs) == 2:
            self.stdout.write('✅ Correct: Found 2 unique pairs as expected')
        else:
            self.stdout.write(f'❌ Issue: Expected 2 pairs, found {len(conversation_pairs)}')
            
            # Let's manually check what should be there
            self.stdout.write('\n🔍 Manual check:')
            
            # Check user1 → user2 messages
            user1 = User.objects.get(username='user1')
            user2 = User.objects.get(username='user2')
            user3 = User.objects.get(username='user3')
            
            u1_to_u2 = Message.objects.filter(sender=user1, recipient=user2).count()
            u2_to_u1 = Message.objects.filter(sender=user2, recipient=user1).count()
            u1_to_u3 = Message.objects.filter(sender=user1, recipient=user3).count()
            u3_to_u1 = Message.objects.filter(sender=user3, recipient=user1).count()
            
            self.stdout.write(f'   user1 → user2: {u1_to_u2} messages')
            self.stdout.write(f'   user2 → user1: {u2_to_u1} messages')
            self.stdout.write(f'   user1 → user3: {u1_to_u3} messages')
            self.stdout.write(f'   user3 → user1: {u3_to_u1} messages')
            
            if u1_to_u2 > 0 or u2_to_u1 > 0:
                self.stdout.write('   → Should have user1 ↔ user2 conversation')
            if u1_to_u3 > 0 or u3_to_u1 > 0:
                self.stdout.write('   → Should have user1 ↔ user3 conversation')
