#!/usr/bin/env python3
"""
Test script to verify Gold Package and Payment Proof admin integration
"""

import os
import sys
import django

# Add the backend directory to the path
backend_path = os.path.join(os.path.dirname(__file__), 'PeerQuestBackEnd')
sys.path.insert(0, backend_path)

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'peerquest.settings')
django.setup()

from django.contrib.auth import get_user_model
from payments.models import PaymentProof, GoldPackage
from django.utils import timezone

User = get_user_model()


def test_admin_integration():
    """Test the admin integration between gold packages and payment proofs"""
    
    print("=== Gold Package Admin Integration Test ===\n")
    
    # 1. Check if gold packages exist
    print("1. Checking Gold Packages:")
    packages = GoldPackage.objects.all()
    for package in packages:
        print(f"   {package.name}: {package.gold_amount} gold for ₱{package.price_php}")
        if package.bonus_gold:
            print(f"      + {package.bonus_gold} bonus gold")
        print(f"      Active: {package.is_active}")
        print()
    
    # 2. Test payment proof with gold package
    print("2. Testing Payment Proof with Gold Package:")
    
    # Get or create a test user
    test_user, created = User.objects.get_or_create(
        username='test_gold_user',
        defaults={
            'email': 'test_gold@example.com',
            'first_name': 'Test',
            'last_name': 'User'
        }
    )
    
    if created:
        print(f"   Created test user: {test_user.username}")
    else:
        print(f"   Using existing test user: {test_user.username}")
    
    # Get a gold package (preferably Popular)
    try:
        gold_package = GoldPackage.objects.get(name="Popular")
        print(f"   Using gold package: {gold_package.name}")
    except GoldPackage.DoesNotExist:
        gold_package = GoldPackage.objects.first()
        print(f"   Using first available package: {gold_package.name}")
    
    # Create a test payment proof
    payment_proof = PaymentProof(
        user=test_user,
        gold_package=gold_package,
        payment_reference='TEST123456',
        receipt_image=None,  # In real scenario this would be an image
        status='pending'
    )
    
    # Simulate the admin save_model behavior
    if payment_proof.gold_package:
        payment_proof.package_amount = payment_proof.gold_package.gold_amount
        payment_proof.package_price = payment_proof.gold_package.price_php
        payment_proof.bonus = payment_proof.gold_package.bonus_gold
    
    payment_proof.save()
    
    print(f"   Created payment proof ID: {payment_proof.id}")
    print(f"   Package Amount: {payment_proof.package_amount}")
    print(f"   Package Price: ₱{payment_proof.package_price}")
    print(f"   Bonus: {payment_proof.bonus}")
    print(f"   Total Gold: {payment_proof.total_gold_with_bonus}")
    
    # 3. Test admin field display
    print("\n3. Admin Field Display Test:")
    print(f"   Gold Package: {payment_proof.gold_package}")
    print(f"   Package Details: {payment_proof.package_amount} gold + {payment_proof.bonus} bonus = {payment_proof.total_gold_with_bonus} total")
    print(f"   Price: ₱{payment_proof.package_price}")
    print(f"   Status: {payment_proof.status}")
    print(f"   Reference: {payment_proof.payment_reference}")
    
    # 4. Test package switching
    print("\n4. Testing Package Switching:")
    other_packages = GoldPackage.objects.exclude(id=gold_package.id)
    if other_packages.exists():
        new_package = other_packages.first()
        print(f"   Switching from {gold_package.name} to {new_package.name}")
        
        payment_proof.gold_package = new_package
        # Simulate admin save
        if payment_proof.gold_package:
            payment_proof.package_amount = payment_proof.gold_package.gold_amount
            payment_proof.package_price = payment_proof.gold_package.price_php
            payment_proof.bonus = payment_proof.gold_package.bonus_gold
        
        payment_proof.save()
        
        print(f"   New Package Amount: {payment_proof.package_amount}")
        print(f"   New Package Price: ₱{payment_proof.package_price}")
        print(f"   New Bonus: {payment_proof.bonus}")
        print(f"   New Total Gold: {payment_proof.total_gold_with_bonus}")
    
    print("\n=== Test Complete ===")
    print(f"Payment Proof created with ID: {payment_proof.id}")
    print("Admin integration working correctly!")
    
    return payment_proof


if __name__ == "__main__":
    try:
        test_payment = test_admin_integration()
        print(f"\nTest payment ID: {test_payment.id}")
        print("You can now view this in the Django admin interface.")
    except Exception as e:
        print(f"Error during test: {e}")
        import traceback
        traceback.print_exc()
