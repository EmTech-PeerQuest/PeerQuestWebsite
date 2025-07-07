from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db import transaction as db_transaction

from .models import Transaction, UserBalance

# Import quest integration signals
try:
    from .quest_integration import award_gold_on_quest_completion
except ImportError:
    # If the quest models aren't available yet, we'll skip this integration
    pass

@receiver(post_save, sender=Transaction)
def update_user_balance_on_transaction(sender, instance, created, **kwargs):
    """
    Signal to update user balance when a transaction is created or updated.
    For updates, we need to calculate the difference and apply it.
    """
    if not created:
        # This is handled in the transaction viewset's perform_create method
        return

    with db_transaction.atomic():
        # Get or create user balance
        user_balance, created = UserBalance.objects.get_or_create(user=instance.user)
        
        # Update balance based on transaction amount
        user_balance.gold_balance += instance.amount
        user_balance.save()

@receiver(post_delete, sender=Transaction)
def revert_balance_on_transaction_delete(sender, instance, **kwargs):
    """
    Signal to revert user balance when a transaction is deleted.
    """
    with db_transaction.atomic():
        try:
            user_balance = UserBalance.objects.get(user=instance.user)
            # Subtract the deleted transaction amount from the balance
            user_balance.gold_balance -= instance.amount
            user_balance.save()
        except UserBalance.DoesNotExist:
            # No balance to update
            pass
