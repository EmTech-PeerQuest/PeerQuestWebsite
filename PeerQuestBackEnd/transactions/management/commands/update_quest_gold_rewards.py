from django.core.management.base import BaseCommand
from quests.models import Quest
import random


class Command(BaseCommand):
    help = 'Initialize or update gold rewards for quests based on difficulty'

    def add_arguments(self, parser):
        parser.add_argument(
            '--all',
            action='store_true',
            help='Update all quests, even those with existing gold rewards'
        )

    def handle(self, *args, **options):
        # Define gold reward ranges by difficulty
        gold_rewards = {
            'initiate': (10, 30),      # 10-30 gold
            'adventurer': (30, 60),    # 30-60 gold
            'champion': (60, 120),     # 60-120 gold
            'mythic': (120, 200),      # 120-200 gold
        }

        update_all = options['all']
        updated = 0
        skipped = 0

        quests = Quest.objects.all()
        self.stdout.write(f"Found {quests.count()} quests")

        for quest in quests:
            if not update_all and quest.gold_reward > 0:
                skipped += 1
                continue

            difficulty = quest.difficulty
            if difficulty in gold_rewards:
                min_gold, max_gold = gold_rewards[difficulty]
                # Generate a gold reward based on difficulty range
                # Make it a multiple of 5 for nicer numbers
                gold_amount = random.randrange(min_gold, max_gold + 1)
                gold_amount = (gold_amount // 5) * 5  # Round to nearest multiple of 5
                
                quest.gold_reward = gold_amount
                quest.save(update_fields=['gold_reward'])
                updated += 1

        self.stdout.write(self.style.SUCCESS(
            f"Successfully updated gold rewards for {updated} quests ({skipped} skipped with existing rewards)"
        ))
