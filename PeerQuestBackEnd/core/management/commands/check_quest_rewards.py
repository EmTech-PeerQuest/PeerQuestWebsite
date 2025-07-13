from django.core.management.base import BaseCommand
from quests.models import Quest, QuestParticipant
from transactions.models import Transaction

class Command(BaseCommand):
    help = 'Check quest gold rewards and their distribution to participants'

    def handle(self, *args, **options):
        self.stdout.write("Quests with gold rewards:")
        
        # Get quests with gold rewards
        quests_with_rewards = Quest.objects.filter(gold_reward__gt=0)
        
        if not quests_with_rewards.exists():
            self.stdout.write(self.style.WARNING("No quests with gold rewards found"))
            return
            
        for quest in quests_with_rewards[:5]:  # Limit to 5 for brevity
            self.stdout.write(f"- Quest: {quest.title}")
            self.stdout.write(f"  Gold Reward: {quest.gold_reward}")
            self.stdout.write(f"  Status: {quest.status}")
            
            # Get all participants for this quest
            participants = QuestParticipant.objects.filter(quest=quest)
            self.stdout.write(f"  Total participants: {participants.count()}")
            
            # Get completed participants
            completed = participants.filter(status='completed')
            self.stdout.write(f"  Completed participants: {completed.count()}")
            
            # Get transactions for this quest
            transactions = Transaction.objects.filter(quest=quest)
            self.stdout.write(f"  Total transactions: {transactions.count()}")
            
            # Show each transaction
            for tx in transactions:
                self.stdout.write(f"    - {tx.user.username}: {tx.amount} gold, Type: {tx.type}")
            
            self.stdout.write("")
