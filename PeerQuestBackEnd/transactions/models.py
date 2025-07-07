from django.db import models
from django.conf import settings
from quests.models import Quest
from .gold_reservation_models import QuestGoldReservation

class TransactionType(models.TextChoices):
    PURCHASE = 'PURCHASE', 'Purchase'
    REWARD = 'REWARD', 'Reward'
    TRANSFER = 'TRANSFER', 'Transfer'
    REFUND = 'REFUND', 'Refund'
    CASHOUT = 'CASHOUT', 'Cashout'

class Transaction(models.Model):
    transaction_id = models.AutoField(primary_key=True, help_text='Primary key, auto-increment')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, 
                             related_name='transactions', help_text='Transaction user')
    type = models.CharField(
        max_length=20,
        choices=TransactionType.choices,
        default=TransactionType.PURCHASE,
        help_text='Transaction type'
    )
    amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        help_text='Transaction amount'
    )
    # Commission fee tracking field
    commission_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text='Commission fee amount (if applicable)'
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


class CashoutStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    COMPLETED = 'COMPLETED', 'Completed'
    REJECTED = 'REJECTED', 'Rejected'


class CashoutMethod(models.TextChoices):
    GCASH = 'GCASH', 'GCash'
    PAYMAYA = 'PAYMAYA', 'PayMaya'
    BANK = 'BANK', 'Bank Transfer'


class CashoutRequest(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='cashout_requests',
        help_text='User requesting cashout'
    )
    amount_gold = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text='Amount of gold to cash out'
    )
    amount_php = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text='Equivalent amount in PHP (calculated at time of request)'
    )
    exchange_rate = models.DecimalField(
        max_digits=6,
        decimal_places=4,
        default=0.0700,
        help_text='Exchange rate used (gold to PHP)'
    )
    method = models.CharField(
        max_length=20,
        choices=CashoutMethod.choices,
        help_text='Cashout method'
    )
    payment_details = models.TextField(
        help_text='Payment details (account number, etc.)',
        blank=True,
        null=True
    )
    status = models.CharField(
        max_length=20,
        choices=CashoutStatus.choices,
        default=CashoutStatus.PENDING,
        help_text='Cashout status'
    )
    notes = models.TextField(
        help_text='Admin notes or rejection reason',
        blank=True,
        null=True
    )
    transaction = models.OneToOneField(
        Transaction,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cashout_request',
        help_text='Associated transaction record'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text='Request creation time'
    )
    processed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Time when request was processed'
    )

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Cashout Request'
        verbose_name_plural = 'Cashout Requests'

    def __str__(self):
        return f"{self.user.username} - {self.amount_gold} gold (₱{self.amount_php}) - {self.status}"

    @property
    def is_pending(self):
        return self.status == CashoutStatus.PENDING

    @property
    def can_be_cancelled(self):
        return self.status == CashoutStatus.PENDING
