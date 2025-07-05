#!/usr/bin/env python

import os
import sys
import django

# Add the project directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from transactions.models import Transaction

print("Current transaction types in database:")
transaction_types = Transaction.objects.values_list('type', 'description').distinct()
for t in transaction_types:
    print(f"{t[0]}: {t[1]}")

print("\nTransaction counts by type:")
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
