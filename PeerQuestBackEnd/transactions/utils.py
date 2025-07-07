from decimal import Decimal
from django.contrib.auth import get_user_model
from django.db import transaction as db_transaction

from .models import Transaction, UserBalance, TransactionType

User = get_user_model()

def add_gold_to_user(user, amount, transaction_type=TransactionType.PURCHASE, description=None, quest=None):
    """
    Add gold to a user's balance and create a transaction record.
    
    Args:
        user: User instance or user ID
        amount: Decimal or float amount to add (can be negative for deductions)
        transaction_type: Type of transaction from TransactionType
        description: Optional description of the transaction
        quest: Optional related quest
    
    Returns:
        tuple: (transaction, user_balance)
    """
    # Ensure we have a user object
    if not isinstance(user, User):
        user = User.objects.get(id=user)
    
    # Convert amount to Decimal
    amount = Decimal(str(amount))
    
    with db_transaction.atomic():
        # Create the transaction
        transaction_record = Transaction.objects.create(
            user=user,
            type=transaction_type,
            amount=amount,
            description=description,
            quest=quest
        )
        
        # Get the user balance (will be updated by the signal)
        balance, created = UserBalance.objects.get_or_create(user=user)
        
        return transaction_record, balance
        
        return transaction, balance

def reward_quest_completion(user, quest, amount, bonus=0, description=None):
    """
    Reward a user for completing a quest.
    
    Args:
        user: User instance or user ID
        quest: Quest instance
        amount: Base reward amount
        bonus: Optional bonus amount
        description: Optional description (defaults to quest title)
    
    Returns:
        tuple: (transaction, user_balance)
    """
    # Ensure we have a user object
    if not isinstance(user, User):
        user = User.objects.get(id=user)
    
    # Set default description
    if description is None:
        description = f"Reward for completing: {quest.title}"
    
    # Add base reward
    transaction1, balance = add_gold_to_user(
        user=user,
        amount=amount,
        transaction_type=TransactionType.REWARD,  # Changed from QUEST_REWARD to REWARD
        description=description,
        quest=quest
    )
    
    # Add bonus if specified
    if bonus > 0:
        transaction2, balance = add_gold_to_user(
            user=user,
            amount=bonus,
            transaction_type=TransactionType.REWARD,  # Changed from QUEST_BONUS to REWARD (since QUEST_BONUS doesn't exist in new enum)
            description=f"Bonus for: {quest.title}",
            quest=quest
        )
        
    return transaction1, balance

def get_user_balance(user):
    """
    Get a user's current gold balance.
    
    Args:
        user: User instance or user ID
    
    Returns:
        UserBalance: The user's balance object
    """
    # Ensure we have a user object
    if not isinstance(user, User):
        user = User.objects.get(id=user)
        
    balance, created = UserBalance.objects.get_or_create(user=user)
    return balance
