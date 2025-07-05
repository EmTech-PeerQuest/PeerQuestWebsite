#!/usr/bin/env python
"""
Check admin user's gold balance.
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

def check_admin_balance():
    User = get_user_model()
    admin_user = User.objects.filter(is_superuser=True).first()
    
    if not admin_user:
        print("❌ No admin user found")
        return
    
    print(f"✅ Admin user: {admin_user.username}")
    
    balance = UserBalance.objects.filter(user=admin_user).first()
    if balance:
        print(f"✅ Gold balance: {balance.gold_balance}")
    else:
        print("❌ No balance record found for admin")

if __name__ == '__main__':
    check_admin_balance()
