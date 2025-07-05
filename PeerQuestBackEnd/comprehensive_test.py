#!/usr/bin/env python
"""
Comprehensive test to validate the gold balance fix.
"""

import os
import sys
import django
import json

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from transactions.models import UserBalance, Transaction
from django.test import Client
from rest_framework_simplejwt.tokens import RefreshToken

def comprehensive_balance_test():
    print("🧪 COMPREHENSIVE GOLD BALANCE TEST")
    print("=" * 50)
    
    User = get_user_model()
    admin_user = User.objects.filter(is_superuser=True).first()
    
    if not admin_user:
        print("❌ No admin user found")
        return False
    
    print(f"✅ Admin user found: {admin_user.username}")
    print(f"   User ID: {admin_user.id}")
    print(f"   Is Superuser: {admin_user.is_superuser}")
    
    # Test 1: Direct database check
    print("\n📊 TEST 1: Direct Database Check")
    balance_record = UserBalance.objects.filter(user=admin_user).first()
    if balance_record:
        db_balance = float(balance_record.gold_balance)
        print(f"✅ Database balance: {db_balance} gold")
        if db_balance == 100.0:
            print("✅ Database balance is correct (100 gold)")
        else:
            print(f"❌ Database balance is incorrect! Expected 100, got {db_balance}")
            return False
    else:
        print("❌ No balance record found in database")
        return False
    
    # Test 2: API endpoint test
    print("\n🔗 TEST 2: API Endpoint Test")
    refresh = RefreshToken.for_user(admin_user)
    access_token = str(refresh.access_token)
    
    client = Client()
    response = client.get(
        '/api/transactions/balances/my_balance/',
        HTTP_AUTHORIZATION=f'Bearer {access_token}',
        HTTP_ACCEPT='application/json'
    )
    
    if response.status_code == 200:
        data = response.json()
        api_balance = float(data.get('gold_balance', 0))
        print(f"✅ API response status: {response.status_code}")
        print(f"✅ API balance: {api_balance} gold")
        print(f"✅ API username: {data.get('username')}")
        
        if api_balance == 100.0:
            print("✅ API balance is correct (100 gold)")
        else:
            print(f"❌ API balance is incorrect! Expected 100, got {api_balance}")
            return False
    else:
        print(f"❌ API error: {response.status_code}")
        print(f"❌ Response: {response.content}")
        return False
    
    # Test 3: Transaction consistency check
    print("\n💸 TEST 3: Transaction Consistency Check")
    transactions = Transaction.objects.filter(user=admin_user)
    if transactions.exists():
        total_from_transactions = sum(float(tx.amount) for tx in transactions)
        print(f"📝 Found {transactions.count()} transactions")
        print(f"🧮 Calculated balance from transactions: {total_from_transactions}")
        
        if abs(total_from_transactions - db_balance) < 0.01:
            print("✅ Transaction history matches balance record")
        else:
            print(f"⚠️  Transaction total ({total_from_transactions}) doesn't match balance ({db_balance})")
    else:
        print("📝 No transactions found (clean 100 gold starting balance)")
        if db_balance == 100.0:
            print("✅ Clean starting balance of 100 gold confirmed")
    
    # Test 4: Token generation test
    print("\n🔑 TEST 4: Token Generation Test")
    try:
        new_refresh = RefreshToken.for_user(admin_user)
        new_access = str(new_refresh.access_token)
        print(f"✅ Fresh token generated: {new_access[:20]}...")
        
        # Test with fresh token
        fresh_response = client.get(
            '/api/transactions/balances/my_balance/',
            HTTP_AUTHORIZATION=f'Bearer {new_access}',
            HTTP_ACCEPT='application/json'
        )
        
        if fresh_response.status_code == 200:
            fresh_data = fresh_response.json()
            fresh_balance = float(fresh_data.get('gold_balance', 0))
            print(f"✅ Fresh token API call successful: {fresh_balance} gold")
        else:
            print(f"❌ Fresh token API call failed: {fresh_response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Token generation failed: {e}")
        return False
    
    print("\n🎉 ALL TESTS PASSED!")
    print("✅ Backend is correctly returning 100 gold for admin user")
    print("✅ API endpoint is working properly")
    print("✅ Authentication is functioning correctly")
    print("\n📋 NEXT STEPS:")
    print("1. Open the frontend application at http://localhost:3002")
    print("2. Log in as admin user")
    print("3. Try to create a new quest")
    print("4. Check the debug panel for balance information")
    print("5. The balance should now show 100 gold instead of 26")
    
    return True

if __name__ == '__main__':
    success = comprehensive_balance_test()
    if not success:
        sys.exit(1)
