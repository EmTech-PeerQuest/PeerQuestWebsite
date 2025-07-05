from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import transaction as db_transaction
from django.conf import settings
import logging

from quests.models import QuestParticipant
from .utils import reward_quest_completion

logger = logging.getLogger(__name__)

@receiver(post_save, sender=QuestParticipant)
def award_gold_on_quest_completion(sender, instance, **kwargs):
    """
    Signal handler to award gold when a quest participant status changes to completed.
    """
    # Only award gold when:
    # 1. The participant status is 'completed' and has a completion timestamp
    # 2. The quest status is also 'completed'
    if instance.status != 'completed':
        logger.debug(f"Gold not awarded: Participant status is {instance.status}, not 'completed'")
        return
    if not instance.completed_at:
        logger.debug(f"Gold not awarded: Participant has no completion timestamp")
        return
    if instance.quest.status != 'completed':
        logger.debug(f"Gold not awarded: Quest status is {instance.quest.status}, not 'completed'")
        return
        
    logger.info(f"Processing gold reward for user {instance.user.username} on quest '{instance.quest.title}'")
        
    # Get the gold reward amount from the quest, defaulting to 0
    gold_reward = getattr(instance.quest, 'gold_reward', 0)
    
    if gold_reward <= 0:
        return
        
    # Check if the user already received a gold reward for this quest completion
    from transactions.models import Transaction, TransactionType
    existing_reward = Transaction.objects.filter(
        user=instance.user,
        quest=instance.quest,
        type=TransactionType.QUEST_REWARD
    ).exists()
    
    if existing_reward:
        # User already received a reward for this quest
        logger.debug(f"Gold not awarded: User {instance.user.username} already received a reward for quest '{instance.quest.title}'")
        return
    
    # No bonus for now - we could add this based on quest criteria if needed
    bonus = 0
    
    logger.info(f"Awarding {gold_reward} gold to user {instance.user.username} for quest '{instance.quest.title}'")
        
    try:
        with db_transaction.atomic():
            # Award gold to the user
            transaction, balance = reward_quest_completion(
                user=instance.user,
                quest=instance.quest,
                amount=gold_reward,
                bonus=bonus,
                description=f"Reward for completing: {instance.quest.title}"
            )
            logger.info(f"Gold reward successful: {gold_reward} gold awarded to {instance.user.username}. New balance: {balance.gold_balance}")
    except Exception as e:
        logger.error(f"Failed to award gold: {str(e)}")
