from django.core.management.base import BaseCommand
from quests.models import Quest


class Command(BaseCommand):
    help = 'Update XP rewards for all existing quests based on their difficulty level'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be updated without making actual changes',
        )

    def handle(self, *args, **options):
        self.stdout.write("Starting XP reward update based on difficulty...")
        
        # Get all quests
        all_quests = Quest.objects.all()
        total_quests = all_quests.count()
        
        if total_quests == 0:
            self.stdout.write(self.style.WARNING("No quests found."))
            return

        self.stdout.write(f"Found {total_quests} quest(s) to check.")

        updates_needed = []
        
        # Check which quests need updating
        for quest in all_quests:
            if quest.difficulty in Quest.DIFFICULTY_XP_MAPPING:
                expected_xp = Quest.DIFFICULTY_XP_MAPPING[quest.difficulty]
                if quest.xp_reward != expected_xp:
                    updates_needed.append({
                        'quest': quest,
                        'current_xp': quest.xp_reward,
                        'expected_xp': expected_xp
                    })

        if not updates_needed:
            self.stdout.write(
                self.style.SUCCESS("All quests already have correct XP rewards for their difficulty level.")
            )
            return

        self.stdout.write(f"Found {len(updates_needed)} quest(s) that need XP reward updates:")
        
        # Show what will be updated
        for update in updates_needed:
            quest = update['quest']
            self.stdout.write(
                f"  - '{quest.title}' ({quest.difficulty.title()}): "
                f"{update['current_xp']} XP → {update['expected_xp']} XP"
            )

        if options['dry_run']:
            self.stdout.write(
                self.style.WARNING("\nDry run mode - no changes were made.")
            )
            self.stdout.write(
                f"Run without --dry-run to apply {len(updates_needed)} update(s)."
            )
            return

        # Apply updates
        updated_count = 0
        for update in updates_needed:
            quest = update['quest']
            quest.xp_reward = update['expected_xp']
            quest.save()
            updated_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"\nSuccessfully updated XP rewards for {updated_count} quest(s)!"
            )
        )
        
        # Show the mapping for reference
        self.stdout.write("\nDifficulty → XP Mapping:")
        for difficulty, xp in Quest.DIFFICULTY_XP_MAPPING.items():
            self.stdout.write(f"  - {difficulty.title()}: {xp} XP")
