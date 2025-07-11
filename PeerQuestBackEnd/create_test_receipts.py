#!/usr/bin/env python
"""
Script to create test payment receipts for testing the admin panel
"""
import os
import django
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from payments.models import PaymentProof, GoldPackage
from django.core.files.base import ContentFile
from django.utils import timezone
import datetime

User = get_user_model()

def create_test_receipts():
    # Get or create test users
    try:
        user1 = User.objects.get(username='testuser1')
    except User.DoesNotExist:
        user1 = User.objects.create_user(
            username='testuser1',
            email='testuser1@example.com',
            password='testpass123'
        )
    
    try:
        user2 = User.objects.get(username='testuser2')
    except User.DoesNotExist:
        user2 = User.objects.create_user(
            username='testuser2',
            email='testuser2@example.com',
            password='testpass123'
        )
    
    # Get gold packages
    packages = list(GoldPackage.objects.all())
    if not packages:
        print("No gold packages found. Please run 'python manage.py setup_gold_packages' first.")
        return
    
    # Create test receipts
    test_receipts = [
        {
            'user': user1,
            'payment_reference': 'REF001',
            'gold_package': packages[0],  # Starter Pack
            'status': 'queued',
        },
        {
            'user': user2,
            'payment_reference': 'REF002',
            'gold_package': packages[1] if len(packages) > 1 else packages[0],  # Popular Pack
            'status': 'processing',
        },
        {
            'user': user1,
            'payment_reference': 'REF003',
            'gold_package': packages[2] if len(packages) > 2 else packages[0],  # Value Pack
            'status': 'verified',
        },
        {
            'user': user2,
            'payment_reference': 'REF004',
            'gold_package': packages[0],
            'status': 'rejected',
        },
    ]
    
    created_count = 0
    for receipt_data in test_receipts:
        # Check if receipt with this reference already exists
        if not PaymentProof.objects.filter(payment_reference=receipt_data['payment_reference']).exists():
            gold_package = receipt_data['gold_package']
            
            receipt = PaymentProof.objects.create(
                user=receipt_data['user'],
                payment_reference=receipt_data['payment_reference'],
                gold_package=gold_package,
                package_amount=gold_package.gold_amount,
                package_price=gold_package.price_php,
                bonus=gold_package.formatted_bonus,
                receipt_image='payment_receipts/test_receipt.jpg',  # Placeholder
                status=receipt_data['status'],
                created_at=timezone.now() - datetime.timedelta(days=created_count),
            )
            
            # Assign to batch if queued
            if receipt.status == 'queued':
                receipt.assign_to_next_batch()
            
            created_count += 1
            print(f"Created test receipt: {receipt.payment_reference} - {receipt.status}")
    
    print(f"\nCreated {created_count} test receipts")
    print(f"Total PaymentProof records: {PaymentProof.objects.count()}")

if __name__ == '__main__':
    create_test_receipts()
