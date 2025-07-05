#!/usr/bin/env python

import os
import sys
import django

# Add the project directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from transactions.models import Transaction, TransactionType

print("Fixing quest-related transaction types...")

# Find all PURCHASE transactions that are quest-related (not actual gold purchases)
quest_related_purchases = Transaction.objects.filter(
    type=TransactionType.PURCHASE,
    description__icontains="Quest creation:"
)

print(f"Found {quest_related_purchases.count()} quest creation transactions to update")

# Update them to REWARD type
updated_count = quest_related_purchases.update(type=TransactionType.REWARD)

print(f"Updated {updated_count} quest creation transactions from PURCHASE to REWARD")

print("\nUpdated transaction counts by type:")
from django.db.models import Count
counts = Transaction.objects.values('type').annotate(count=Count('type')).order_by('type')
for c in counts:
    print(f"{c['type']}: {c['count']}")

print("\nSample transactions by type:")
for transaction_type in ['PURCHASE', 'REWARD', 'TRANSFER', 'REFUND']:
    print(f"\n--- {transaction_type} transactions ---")
    samples = Transaction.objects.filter(type=transaction_type)[:3]
    for sample in samples:
        print(f"  {sample.description} (Amount: {sample.amount})")
