#!/usr/bin/env python
"""
Check admin user's transactions to understand balance history.
"""

import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from transactions.models import Transaction, UserBalance

def check_admin_transactions():
    User = get_user_model()
    admin_user = User.objects.filter(is_superuser=True).first()
    
    if not admin_user:
        print("❌ No admin user found")
        return
    
    print(f"🔍 Transaction history for admin user: {admin_user.username}")
    print("=" * 60)
    
    transactions = Transaction.objects.filter(user=admin_user).order_by('-created_at')
    
    if not transactions:
        print("📝 No transactions found for admin user")
    else:
        total = 0
        for tx in transactions:
            total += tx.amount
            print(f"💰 {tx.created_at.strftime('%Y-%m-%d %H:%M')} | {tx.type} | {tx.amount:+.2f} | Running Total: {total:.2f}")
            print(f"   📝 {tx.description}")
            print("-" * 40)
    
    # Check current balance record
    balance = UserBalance.objects.filter(user=admin_user).first()
    if balance:
        print(f"\n💼 Current Balance Record:")
        print(f"   Gold: {balance.gold_balance}")
        print(f"   Last Updated: {balance.last_updated}")
        
        # Compare with calculated total
        if transactions:
            print(f"\n🧮 Calculated from transactions: {total:.2f}")
            print(f"🧮 Stored balance: {balance.gold_balance}")
            if abs(float(balance.gold_balance) - total) > 0.01:
                print("⚠️  Balance mismatch detected!")
            else:
                print("✅ Balance matches transaction history")

if __name__ == '__main__':
    check_admin_transactions()
