#!/usr/bin/env python3
"""
Test script to verify that the new transaction types are working correctly.
"""

import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from transactions.models import Transaction, TransactionType
from transactions.transaction_utils import award_gold, deduct_gold_for_quest_creation
from quests.models import Quest, QuestCategory
from datetime import datetime, timedelta

User = get_user_model()

def test_new_transaction_types():
    """Test that all new transaction types work correctly"""
    print("🧪 Testing New Transaction Types")
    print("=" * 50)
    
    # Test all transaction types
    expected_types = ['PURCHASE', 'REWARD', 'TRANSFER', 'REFUND']
    actual_types = [choice[0] for choice in TransactionType.choices]
    
    print(f"✅ Expected transaction types: {expected_types}")
    print(f"✅ Actual transaction types: {actual_types}")
    
    if set(expected_types) == set(actual_types):
        print("✅ Transaction types match specification!")
    else:
        print("❌ Transaction types don't match specification!")
        return False
    
    # Test creating transactions with new types
    user, created = User.objects.get_or_create(
        username='test_transaction_types',
        defaults={'email': 'test@example.com'}
    )
    
    print(f"\n📝 Testing transaction creation with new types:")
    
    # Test PURCHASE type
    transaction = Transaction.objects.create(
        user=user,
        type=TransactionType.PURCHASE,
        amount=100,
        description="Test purchase transaction"
    )
    print(f"✅ PURCHASE transaction created: ID {transaction.transaction_id}")
    
    # Test REWARD type  
    transaction = Transaction.objects.create(
        user=user,
        type=TransactionType.REWARD,
        amount=50,
        description="Test reward transaction"
    )
    print(f"✅ REWARD transaction created: ID {transaction.transaction_id}")
    
    # Test TRANSFER type
    transaction = Transaction.objects.create(
        user=user,
        type=TransactionType.TRANSFER,
        amount=25,
        description="Test transfer transaction"
    )
    print(f"✅ TRANSFER transaction created: ID {transaction.transaction_id}")
    
    # Test REFUND type
    transaction = Transaction.objects.create(
        user=user,
        type=TransactionType.REFUND,
        amount=10,
        description="Test refund transaction"
    )
    print(f"✅ REFUND transaction created: ID {transaction.transaction_id}")
    
    print(f"\n📊 Transaction summary for {user.username}:")
    transactions = Transaction.objects.filter(user=user).order_by('-created_at')
    for t in transactions:
        print(f"   {t.get_type_display()}: {t.amount} - {t.description}")
    
    # Test award_gold function with new REWARD type
    print(f"\n🎁 Testing award_gold function:")
    result = award_gold(user, 30, "Test gold award")
    if result.get('success'):
        print(f"✅ Award gold successful: {result}")
    else:
        print(f"❌ Award gold failed: {result}")
    
    # Cleanup
    Transaction.objects.filter(user=user).delete()
    if created:
        user.delete()
    
    print(f"\n🧹 Cleaned up test data")
    print("=" * 50)
    print("🎉 Transaction types test completed successfully!")
    return True

if __name__ == '__main__':
    test_new_transaction_types()
