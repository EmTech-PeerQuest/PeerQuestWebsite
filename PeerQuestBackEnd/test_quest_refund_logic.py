#!/usr/bin/env python3
"""
Test script to validate quest deletion only refunds gold_reward, not commission_fee.
"""
import os
import sys
import django
from decimal import Decimal

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from quests.models import Quest, QuestCategory
from transactions.models import Transaction, TransactionType, UserBalance
from transactions.transaction_utils import refund_gold_for_quest_deletion, deduct_gold_for_quest_creation

User = get_user_model()

def test_quest_deletion_refund():
    print("🧪 Testing quest deletion refund logic...")
    # Setup test user and category
    user, _ = User.objects.get_or_create(username='test_refund_user', defaults={'email': 'refund@example.com'})
    category, _ = QuestCategory.objects.get_or_create(name='Test Category')

    # Set initial balance
    balance, _ = UserBalance.objects.get_or_create(user=user)
    balance.gold_balance = Decimal('200')
    balance.save()
    # UserBalance is now the single source of truth for gold balance

    # Create quest with commission_fee=5, gold_reward=95
    quest = Quest.objects.create(
        creator=user,
        title='Refund Test Quest',
        description='Testing refund logic',
        category=category,
        commission_fee=5,
        gold_reward=95,
        status='open'
    )

    # Deduct gold for quest creation (should deduct 100)
    deduct_gold_for_quest_creation(quest, Decimal('100'))
    balance.refresh_from_db()
    print(f"Balance after quest creation: {balance.gold_balance}")

    # Delete quest and refund
    result = refund_gold_for_quest_deletion(quest)
    balance.refresh_from_db()
    print(f"Refund result: {result}")
    print(f"Balance after refund: {balance.gold_balance}")

    # Validate only gold_reward refunded, not commission_fee
    expected_balance = Decimal('200') - Decimal('100') + Decimal('95')
    assert balance.gold_balance == expected_balance, (
        f"Refund logic error: expected {expected_balance}, got {balance.gold_balance}")
    print("✅ Only gold_reward refunded, commission_fee not refunded.")

    # Cleanup
    Transaction.objects.filter(user=user).delete()
    quest.delete()
    user.delete()
    print("🧹 Cleaned up test data.")

if __name__ == '__main__':
    test_quest_deletion_refund()
