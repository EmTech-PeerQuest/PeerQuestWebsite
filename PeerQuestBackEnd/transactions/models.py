from django.db import models
from django.conf import settings
from quests.models import Quest
from .gold_reservation_models import QuestGoldReservation

class TransactionType(models.TextChoices):
    QUEST_REWARD = 'QUEST_REWARD', 'Quest Reward'
    QUEST_CREATION = 'QUEST_CREATION', 'Quest Creation'
    QUEST_REFUND = 'QUEST_REFUND', 'Quest Refund'
    PURCHASE = 'PURCHASE', 'Purchase'
    ADMIN_ADJUSTMENT = 'ADMIN_ADJUSTMENT', 'Admin Adjustment'
    GIFT = 'GIFT', 'Gift'
    OTHER = 'OTHER', 'Other'

class Transaction(models.Model):
    transaction_id = models.AutoField(primary_key=True, help_text='Primary key, auto-increment')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, 
                             related_name='transactions', help_text='Transaction user')
    type = models.CharField(
        max_length=20,
        choices=TransactionType.choices,
        default=TransactionType.OTHER,
        help_text='Transaction type'
    )
    amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        help_text='Transaction amount'
    )
    description = models.CharField(
        max_length=255, 
        blank=True, 
        null=True,
        help_text='Transaction description'
    )
    quest = models.ForeignKey(
        Quest, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='transactions',
        help_text='Related quest (if applicable)'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text='Transaction time'
    )

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Transaction'
        verbose_name_plural = 'Transactions'

    def __str__(self):
        return f"{self.get_type_display()} - {self.amount} - {self.user.username}"

# User balance model that keeps track of the current gold balance
class UserBalance(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='balance',
        help_text='User'
    )
    gold_balance = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=0.00,
        help_text='Current gold balance'
    )
    last_updated = models.DateTimeField(
        auto_now=True,
        help_text='Last update timestamp'
    )

    def __str__(self):
        return f"{self.user.username} - {self.gold_balance} gold"
