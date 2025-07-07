#!/usr/bin/env python
"""
Check commission statistics.
"""

import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from transactions.transaction_utils import get_commission_statistics
from transactions.models import Transaction, TransactionType
import json
from decimal import Decimal

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

def main():
    print("Commission Statistics Report")
    print("="*40)
    
    # Get all-time commission stats
    stats = get_commission_statistics()
    
    print(f"📊 COMMISSION SUMMARY")
    print(f"   Total Revenue: {stats['summary']['total_commission_revenue']} gold")
    print(f"   Commission Rate: {stats['summary']['commission_rate']}")
    print(f"   Average per Quest: {stats['summary']['average_commission_per_quest']:.2f} gold")
    
    print(f"\n💰 COMMISSION INCOME")
    print(f"   Total Transactions: {stats['commission_income']['transaction_count']}")
    print(f"   Total Amount: {stats['commission_income']['total_amount']} gold")
    
    print(f"\n🎯 QUEST COMMISSIONS")
    print(f"   Quests with Commission: {stats['quest_commissions']['quest_count']}")
    print(f"   Total Fees Collected: {stats['quest_commissions']['total_fees_collected']} gold")
    print(f"   Total Quest Value: {stats['quest_commissions']['total_quest_value']} gold")
    
    # Show recent commission transactions
    print(f"\n📋 RECENT COMMISSION TRANSACTIONS")
    recent_commissions = Transaction.objects.filter(
        type=TransactionType.COMMISSION
    ).order_by('-created_at')[:5]
    
    if recent_commissions.exists():
        for tx in recent_commissions:
            print(f"   {tx.created_at.strftime('%Y-%m-%d %H:%M')} | {tx.amount} gold | Quest: {tx.quest.title if tx.quest else 'N/A'}")
    else:
        print("   No commission transactions found")
    
    print(f"\n📋 RECENT QUEST TRANSACTIONS WITH COMMISSIONS")
    recent_quest_tx = Transaction.objects.filter(
        commission_fee__gt=0
    ).exclude(type=TransactionType.COMMISSION).order_by('-created_at')[:5]
    
    if recent_quest_tx.exists():
        for tx in recent_quest_tx:
            print(f"   {tx.created_at.strftime('%Y-%m-%d %H:%M')} | User: {tx.user.username} | Base: {tx.base_amount} | Commission: {tx.commission_fee}")
    else:
        print("   No quest transactions with commissions found")

if __name__ == '__main__':
    main()
