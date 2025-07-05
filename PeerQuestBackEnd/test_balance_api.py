#!/usr/bin/env python
"""
Test the balance API endpoint directly.
"""

import os
import sys
import django
import requests
import json
from django.contrib.auth import get_user_model

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.test import Client
from rest_framework_simplejwt.tokens import RefreshToken

def test_balance_api():
    User = get_user_model()
    admin_user = User.objects.filter(is_superuser=True).first()
    
    if not admin_user:
        print("❌ No admin user found")
        return
    
    print(f"✅ Testing balance API for admin user: {admin_user.username}")
    
    # Generate JWT token for the admin user
    refresh = RefreshToken.for_user(admin_user)
    access_token = str(refresh.access_token)
    
    print(f"🔑 Generated access token: {access_token[:20]}...")
    
    # Test the API endpoint using Django test client
    client = Client()
    
    # Test using the API endpoint
    response = client.get(
        '/api/transactions/balances/my_balance/',
        HTTP_AUTHORIZATION=f'Bearer {access_token}',
        HTTP_ACCEPT='application/json'
    )
    
    print(f"🔄 API Response Status: {response.status_code}")
    print(f"🔄 API Response Content-Type: {response.get('Content-Type', 'Unknown')}")
    
    if response.status_code == 200:
        try:
            data = response.json()
            print(f"✅ API Response Data: {json.dumps(data, indent=2)}")
            print(f"✅ Gold Balance: {data.get('gold_balance')}")
        except Exception as e:
            print(f"❌ Failed to parse JSON response: {e}")
            print(f"❌ Raw response content: {response.content}")
    else:
        print(f"❌ API Error: {response.status_code}")
        print(f"❌ Response content: {response.content}")

if __name__ == '__main__':
    test_balance_api()
