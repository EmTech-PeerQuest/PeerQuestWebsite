#!/usr/bin/env python
"""
Check transaction descriptions to ensure our filtering logic is accurate
"""
import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from transactions.models import Transaction, TransactionType

print('=== PURCHASE Transactions (should be from Buy Gold tab) ===')
purchase_transactions = Transaction.objects.filter(type=TransactionType.PURCHASE)
for t in purchase_transactions:
    print(f'ID: {t.transaction_id}, Amount: {t.amount}, Description: "{t.description}"')

print()
print('=== REWARD Transactions (should be quest-related) ===')
reward_transactions = Transaction.objects.filter(type=TransactionType.REWARD)[:5]
for t in reward_transactions:
    print(f'ID: {t.transaction_id}, Amount: {t.amount}, Description: "{t.description}"')
print(f'... and {Transaction.objects.filter(type=TransactionType.REWARD).count() - 5} more REWARD transactions')

print()
print('=== REFUND Transactions ===')
refund_transactions = Transaction.objects.filter(type=TransactionType.REFUND)[:3]
for t in refund_transactions:
    print(f'ID: {t.transaction_id}, Amount: {t.amount}, Description: "{t.description}"')
print(f'... and {Transaction.objects.filter(type=TransactionType.REFUND).count() - 3} more REFUND transactions')
