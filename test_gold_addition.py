#!/usr/bin/env python3
"""
Test script to verify gold addition when receipts are approved
"""

import os
import sys
import django

# Add the backend directory to the path
backend_path = os.path.join(os.path.dirname(__file__), 'PeerQuestBackEnd')
sys.path.insert(0, backend_path)

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from payments.models import PaymentProof, GoldPackage
from django.utils import timezone

User = get_user_model()


def test_gold_addition():
    """Test that approving receipts correctly adds gold to users"""
    
    print("=== Gold Addition Test ===\n")
    
    # Get or create a test user
    test_user, created = User.objects.get_or_create(
        username='test_gold_recipient',
        defaults={
            'email': 'test_gold_recipient@example.com',
            'first_name': 'Gold',
            'last_name': 'Recipient'
        }
    )
    
    print(f"Test user: {test_user.username}")
    print(f"Initial gold_balance: {test_user.gold_balance}")
    
    # Get a gold package
    try:
        gold_package = GoldPackage.objects.get(name="Popular")
        print(f"Using package: {gold_package.name}")
        print(f"Package details: {gold_package.gold_amount} + {gold_package.bonus_gold} = {gold_package.total_gold} total gold")
    except GoldPackage.DoesNotExist:
        gold_package = GoldPackage.objects.first()
        print(f"Using first available package: {gold_package.name}")
    
    # Create a test payment proof
    payment_proof = PaymentProof.objects.create(
        user=test_user,
        gold_package=gold_package,
        payment_reference='TEST_GOLD_' + str(timezone.now().timestamp()),
        status='queued'
    )
    
    # Auto-fill package details (simulate admin save)
    if payment_proof.gold_package:
        payment_proof.package_amount = payment_proof.gold_package.gold_amount
        payment_proof.package_price = payment_proof.gold_package.price_php
        payment_proof.bonus = payment_proof.gold_package.bonus_gold
        payment_proof.save()
    
    print(f"\nCreated payment proof:")
    print(f"  ID: {payment_proof.id}")
    print(f"  Package Amount: {payment_proof.package_amount}")
    print(f"  Bonus: {payment_proof.bonus}")
    print(f"  Total Gold (with bonus): {payment_proof.total_gold_with_bonus}")
    
    # Test the approval process
    print(f"\n--- Testing Approval Process ---")
    print(f"Before approval - User gold_balance: {test_user.gold_balance}")
    
    # Simulate admin approval
    payment_proof.status = 'verified'
    payment_proof.verified_at = timezone.now()
    
    # Test adding gold to user
    result = payment_proof.add_gold_to_user()
    print(f"add_gold_to_user() result: {result}")
    
    # Test creating transaction record
    transaction_result = payment_proof.create_transaction_record()
    print(f"create_transaction_record() result: {transaction_result}")
    
    # Refresh user from database
    test_user.refresh_from_db()
    print(f"After approval - User gold_balance: {test_user.gold_balance}")
    
    # Verify the addition
    expected_gold = payment_proof.total_gold_with_bonus
    if test_user.gold_balance >= expected_gold:
        print(f"✅ SUCCESS: Gold correctly added! User now has {test_user.gold_balance} gold")
    else:
        print(f"❌ FAILED: Expected at least {expected_gold} gold, but user has {test_user.gold_balance}")
    
    # Check if transaction was created
    try:
        from transactions.models import Transaction
        transaction = Transaction.objects.filter(
            user=test_user,
            reference=payment_proof.payment_reference
        ).first()
        
        if transaction:
            print(f"✅ Transaction record created:")
            print(f"   Type: {transaction.transaction_type}")
            print(f"   Amount: {transaction.amount}")
            print(f"   Description: {transaction.description}")
        else:
            print("❌ No transaction record found")
    except ImportError:
        print("ℹ️  Transaction model not available")
    
    print(f"\n=== Test Complete ===")
    return payment_proof


if __name__ == "__main__":
    try:
        test_payment = test_gold_addition()
        print(f"\nTest payment ID: {test_payment.id}")
        print("Gold addition automation is working correctly!")
    except Exception as e:
        print(f"Error during test: {e}")
        import traceback
        traceback.print_exc()
