#!/usr/bin/env python
"""
Check all users and their gold balances.
"""

import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from transactions.models import UserBalance

def check_all_users():
    User = get_user_model()
    users = User.objects.all()
    
    print("🔍 All users and their gold balances:")
    print("=" * 50)
    
    for user in users:
        balance = UserBalance.objects.filter(user=user).first()
        gold_balance = balance.gold_balance if balance else "No balance record"
        
        print(f"👤 User: {user.username}")
        print(f"   ID: {user.id}")
        print(f"   Is Admin: {user.is_superuser}")
        print(f"   Is Staff: {user.is_staff}")
        print(f"   Gold Balance: {gold_balance}")
        print("-" * 30)

if __name__ == '__main__':
    check_all_users()
