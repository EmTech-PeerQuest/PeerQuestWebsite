#!/usr/bin/env python3
"""
Test script to verify transactions can display payment status correctly.
This checks if payment submissions appear in the user's transaction history.
"""

import requests
import json
import os
from io import BytesIO
from PIL import Image

# Configuration
API_BASE = "http://localhost:8000/api"
USERNAME = "admin"  # Change to your test username
PASSWORD = "admin123"  # Change to your test password

def get_auth_token():
    """Get JWT token for authentication"""
    url = f"{API_BASE}/token/"
    data = {
        "username": USERNAME,
        "password": PASSWORD
    }
    
    response = requests.post(url, json=data)
    if response.status_code == 200:
        result = response.json()
        return result.get('access')
    else:
        print(f"Authentication failed: {response.status_code}")
        print(response.text)
        return None

def test_transaction_history():
    """Test getting transaction history to see if payment submissions appear"""
    # Get authentication token
    token = get_auth_token()
    if not token:
        print("❌ Failed to authenticate")
        return
    
    print("✅ Authentication successful")
    
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    # Get transaction history
    url = f"{API_BASE}/transactions/transactions/my_transactions/"
    response = requests.get(url, headers=headers)
    
    print(f"\n📄 Transaction history response ({response.status_code}):")
    print("=" * 50)
    
    if response.status_code == 200:
        result = response.json()
        print("✅ Transaction history fetched successfully!")
        
        if 'transactions' in result:
            transactions = result['transactions']
            print(f"📊 Found {len(transactions)} transactions")
            
            # Look for recent payment submissions
            payment_transactions = [t for t in transactions if t.get('type') == 'PURCHASE' and 'gold' in t.get('description', '').lower()]
            
            if payment_transactions:
                print(f"\n💰 Found {len(payment_transactions)} gold purchase transactions:")
                for transaction in payment_transactions[:3]:  # Show last 3
                    print(f"   • {transaction.get('description')} - {transaction.get('amount')} gold")
                    print(f"     Date: {transaction.get('created_at')}")
                    print(f"     Type: {transaction.get('type_display', transaction.get('type'))}")
            else:
                print("\n💡 No gold purchase transactions found yet")
                print("   (Payment submissions should appear as PURCHASE type transactions)")
        else:
            print("⚠️ Warning: No transactions array in response")
            
    else:
        print("❌ Failed to fetch transaction history!")
        print(f"📄 Response: {response.text}")

if __name__ == "__main__":
    print("🧪 Testing PeerQuest Transaction History")
    print("=" * 50)
    test_transaction_history()
