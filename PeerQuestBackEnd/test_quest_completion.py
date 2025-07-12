import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from quests.models import Quest
from users.models import User
from users.models_reward import XPTransaction, GoldTransaction

# --- CONFIG ---
QUEST_SLUG = input('Enter quest slug to test completion: ').strip()

# --- TEST SCRIPT ---
def print_user_balances(users):
    for user in users:
        print(f"User: {user.username} | XP: {user.xp} | Gold: {user.gold}")

def main():
    try:
        quest = Quest.objects.get(slug=QUEST_SLUG)
    except Quest.DoesNotExist:
        print(f"Quest with slug '{QUEST_SLUG}' not found.")
        return
    print(f"Testing quest completion for: {quest.title} (slug: {quest.slug})")
    participants = [p.user for p in quest.participants.all()]
    print("Balances BEFORE completion:")
    print_user_balances(participants)
    print("--- Completing quest ---")
    result = quest.complete_quest(completion_reason="Test script completion")
    print("Result:", result)
    print("Balances AFTER completion:")
    # Refresh users
    for user in participants:
        user.refresh_from_db()
    print_user_balances(participants)
    # Show transactions
    print("\nXP Transactions:")
    for t in XPTransaction.objects.filter(quest=quest):
        print(f"{t.user.username}: {t.amount} ({t.reason})")
    print("\nGold Transactions:")
    for t in GoldTransaction.objects.filter(quest=quest):
        print(f"{t.user.username}: {t.amount} ({t.reason})")

if __name__ == "__main__":
    main()
