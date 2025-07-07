# Sample script to test the XP difficulty system

from django.core.management.base import BaseCommand
from quests.models import Quest
from users.models import NewUser
from xp.utils import award_xp, get_difficulty_xp_reward


class Command(BaseCommand):
    help = 'Test the XP reward system with sample data'

    def handle(self, *args, **options):
        self.stdout.write("Testing XP reward system...")
        
        # Show current difficulty-XP mapping
        self.stdout.write("\n=== Difficulty-XP Mapping ===")
        for difficulty, xp in Quest.DIFFICULTY_XP_MAPPING.items():
            self.stdout.write(f"{difficulty.title()}: {xp} XP")
        
        # Test XP calculation functions
        self.stdout.write("\n=== Testing XP Utility Functions ===")
        
        for difficulty in ['easy', 'medium', 'hard']:
            xp = get_difficulty_xp_reward(difficulty)
            self.stdout.write(f"XP for {difficulty} quest: {xp}")
        
        # Show existing quests and their XP rewards
        quests = Quest.objects.all()[:5]  # Show first 5 quests
        
        if quests:
            self.stdout.write("\n=== Sample Existing Quests ===")
            for quest in quests:
                expected_xp = Quest.DIFFICULTY_XP_MAPPING.get(quest.difficulty, 50)
                status = "✓" if quest.xp_reward == expected_xp else "✗"
                self.stdout.write(
                    f"{status} '{quest.title}' - {quest.difficulty} "
                    f"(Current: {quest.xp_reward} XP, Expected: {expected_xp} XP)"
                )
        
        # Test user XP functions
        if NewUser.objects.exists():
            user = NewUser.objects.first()
            self.stdout.write(f"\n=== Testing with User: {user.username} ===")
            self.stdout.write(f"Current XP: {user.xp}")
            self.stdout.write(f"Current Level: {user.level}")
            
            # Simulate awarding XP
            from xp.utils import calculate_level, get_xp_for_next_level, get_level_progress
            
            self.stdout.write(f"XP needed for next level: {get_xp_for_next_level(user.xp)}")
            self.stdout.write(f"Progress to next level: {get_level_progress(user.xp):.1f}%")
        
        self.stdout.write(
            self.style.SUCCESS("\nXP system test completed successfully!")
        )
