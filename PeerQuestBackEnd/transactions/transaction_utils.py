from django.db import transaction as db_transaction, models
from .models import Transaction, UserBalance, TransactionType
from decimal import Decimal

def get_user_balance(user):
    """
    Get a user's current gold balance
    
    Args:
        user: The user to get the balance for
        
    Returns:
        Decimal: The user's current gold balance
    """
    try:
        balance = UserBalance.objects.get(user=user)
        return balance.gold_balance
    except UserBalance.DoesNotExist:
        # Create a new balance record with zero gold
        balance = UserBalance.objects.create(user=user, gold_balance=Decimal('0.00'))
        return balance.gold_balance

def get_available_balance(user):
    """
    Get a user's available gold balance (total minus reserved)
    
    Args:
        user: The user to get the balance for
        
    Returns:
        Decimal: The user's available gold balance
    """
    from .gold_reservation_models import QuestGoldReservation
    
    # Get total balance
    total_balance = get_user_balance(user)
    
    # Calculate reserved gold (for active quests created by this user)
    reserved_gold = Decimal('0.00')
    quests_with_reservations = QuestGoldReservation.objects.filter(quest__creator=user, quest__status__in=['open', 'in-progress'])
    
    if quests_with_reservations.exists():
        reserved_gold = quests_with_reservations.aggregate(models.Sum('amount'))['amount__sum'] or Decimal('0.00')
    
    # Return available balance
    return total_balance - reserved_gold

def reserve_gold_for_quest(quest, amount):
    """
    Reserve gold for a quest
    
    Args:
        quest: The quest to reserve gold for
        amount: The amount of gold to reserve
        
    Returns:
        bool: True if successful, False if not enough available balance
    """
    from .gold_reservation_models import QuestGoldReservation
    
    if not isinstance(amount, Decimal):
        amount = Decimal(str(amount))
    
    user = quest.creator
    available_balance = get_available_balance(user)
    
    # Check if there's enough available balance
    if amount > available_balance:
        return False
    
    with db_transaction.atomic():
        # Create or update the reservation
        reservation, created = QuestGoldReservation.objects.update_or_create(
            quest=quest,
            defaults={'amount': amount}
        )
    
    return True

def release_gold_reservation(quest):
    """
    Release gold reservation for a quest
    
    Args:
        quest: The quest to release gold reservation for
        
    Returns:
        Decimal: The amount of gold that was released
    """
    from .gold_reservation_models import QuestGoldReservation
    
    try:
        reservation = QuestGoldReservation.objects.get(quest=quest)
        amount = reservation.amount
        reservation.delete()
        return amount
    except QuestGoldReservation.DoesNotExist:
        return Decimal('0.00')

def award_gold(user, amount, description=None, quest=None, transaction_type=TransactionType.QUEST_REWARD):
    """
    Award gold to a user and create a transaction record
    
    Args:
        user: The user to award gold to
        amount: The amount of gold to award (positive number)
        description: Optional description of the transaction
        quest: Optional Quest object associated with the transaction
        transaction_type: Transaction type (default: QUEST_REWARD)
        
    Returns:
        dict: Result of the transaction with transaction_id and updated_balance
    """
    # Validate amount is positive
    if amount <= 0:
        return {"success": False, "error": "Gold amount must be positive"}
    
    # Convert to Decimal for consistency with model
    if not isinstance(amount, Decimal):
        amount = Decimal(str(amount))
    
    with db_transaction.atomic():
        # Create or get user balance
        balance, created = UserBalance.objects.get_or_create(user=user)
        
        # Create the transaction record
        transaction = Transaction.objects.create(
            user=user,
            type=transaction_type,
            amount=amount,
            description=description,
            quest=quest
        )
        
        # Update the user balance
        previous_balance = balance.gold_balance
        balance.gold_balance += amount
        balance.save()
        
        # Also update the user model gold_balance field to keep both in sync
        user.gold_balance = balance.gold_balance
        user.save(update_fields=['gold_balance'])
        
        return {
            "success": True,
            "transaction_id": transaction.transaction_id,
            "previous_balance": previous_balance,
            "new_balance": balance.gold_balance,
            "amount": amount
        }
