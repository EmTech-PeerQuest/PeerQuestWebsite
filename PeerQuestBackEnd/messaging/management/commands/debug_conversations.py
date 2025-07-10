from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from messaging.models import Message, Conversation
from django.db.models import Q

User = get_user_model()

class Command(BaseCommand):
    help = 'Debug conversation creation and show detailed analysis'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('=== CONVERSATION DEBUG ANALYSIS ===\n'))
        
        # 1. Show all users
        users = User.objects.all()
        self.stdout.write('👥 USERS:')
        for user in users:
            self.stdout.write(f'  - {user.username} (ID: {user.id})')
        
        # 2. Show all messages with sender/recipient
        messages = Message.objects.all().order_by('timestamp')
        self.stdout.write(f'\n💬 MESSAGES ({messages.count()} total):')
        for msg in messages:
            self.stdout.write(f'  - {msg.sender.username} → {msg.recipient.username}: "{msg.content[:30]}..." (Conversation: {msg.conversation_id})')
        
        # 3. Analyze unique conversation pairs
        self.stdout.write(f'\n🔍 UNIQUE CONVERSATION PAIRS:')
        conversation_pairs = set()
        
        for message in messages:
            # Create a sorted tuple to ensure (user1, user2) and (user2, user1) are treated as the same
            pair = tuple(sorted([message.sender.id, message.recipient.id]))
            conversation_pairs.add(pair)
        
        for sender_id, recipient_id in conversation_pairs:
            sender = User.objects.get(id=sender_id)
            recipient = User.objects.get(id=recipient_id)
            
            # Count messages in each direction
            messages_a_to_b = Message.objects.filter(sender=sender, recipient=recipient).count()
            messages_b_to_a = Message.objects.filter(sender=recipient, recipient=sender).count()
            
            direction = "↔" if messages_a_to_b > 0 and messages_b_to_a > 0 else "→"
            
            self.stdout.write(f'  - {sender.username} {direction} {recipient.username}')
            self.stdout.write(f'    └─ {sender.username} → {recipient.username}: {messages_a_to_b} messages')
            self.stdout.write(f'    └─ {recipient.username} → {sender.username}: {messages_b_to_a} messages')
        
        self.stdout.write(f'\n📊 EXPECTED: {len(conversation_pairs)} conversations')
        
        # 4. Show actual conversations
        conversations = Conversation.objects.all()
        self.stdout.write(f'\n💾 ACTUAL CONVERSATIONS ({conversations.count()} total):')
        
        for conv in conversations:
            participants = list(conv.participants.all())
            participant_names = [p.username for p in participants]
            
            self.stdout.write(f'  - Conversation {conv.id}:')
            self.stdout.write(f'    └─ Participants: {", ".join(participant_names)} ({len(participants)} users)')
            
            # Show messages in this conversation
            conv_messages = conv.messages.all().order_by('timestamp')
            self.stdout.write(f'    └─ Messages: {conv_messages.count()}')
            
            for msg in conv_messages[:3]:  # Show first 3 messages
                self.stdout.write(f'       • {msg.sender.username} → {msg.recipient.username}: "{msg.content[:20]}..."')
            
            if conv_messages.count() > 3:
                self.stdout.write(f'       • ... and {conv_messages.count() - 3} more')
        
        # 5. Check for orphaned messages
        orphaned_messages = Message.objects.filter(conversation__isnull=True)
        if orphaned_messages.exists():
            self.stdout.write(f'\n⚠️  ORPHANED MESSAGES ({orphaned_messages.count()}):')
            for msg in orphaned_messages:
                self.stdout.write(f'  - {msg.sender.username} → {msg.recipient.username}: "{msg.content[:30]}..."')
        
        # 6. Recommendations
        self.stdout.write(f'\n🔧 RECOMMENDATIONS:')
        if conversations.count() != len(conversation_pairs):
            self.stdout.write(f'  ❌ Mismatch: Expected {len(conversation_pairs)} conversations, found {conversations.count()}')
            self.stdout.write(f'  💡 Run: python manage.py fix_conversations')
        else:
            self.stdout.write(f'  ✅ Conversation count matches expected pairs')
        
        if orphaned_messages.exists():
            self.stdout.write(f'  ❌ Found {orphaned_messages.count()} messages without conversations')
            self.stdout.write(f'  💡 Run: python manage.py populate_conversations')
        else:
            self.stdout.write(f'  ✅ All messages are linked to conversations')
