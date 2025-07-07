#!/usr/bin/env python
"""
Test the authentication flow and token generation.
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
from rest_framework_simplejwt.tokens import RefreshToken
from django.test import Client

def test_auth_flow():
    print("🔐 AUTHENTICATION FLOW TEST")
    print("=" * 50)
    
    User = get_user_model()
    admin_user = User.objects.filter(is_superuser=True).first()
    
    if not admin_user:
        print("❌ No admin user found")
        return False
    
    print(f"✅ Admin user: {admin_user.username}")
    
    # Test 1: Login via API
    print("\n🔑 TEST 1: Login API")
    client = Client()
    login_response = client.post(
        '/api/token/',
        data=json.dumps({'username': admin_user.username, 'password': 'admin123'}),
        content_type='application/json'
    )
    
    print(f"Login response status: {login_response.status_code}")
    if login_response.status_code == 200:
        login_data = login_response.json()
        access_token = login_data.get('access')
        refresh_token = login_data.get('refresh')
        print(f"✅ Access token: {access_token[:20]}...")
        print(f"✅ Refresh token: {refresh_token[:20]}...")
    else:
        print(f"❌ Login failed: {login_response.content}")
        
        # Try with manual token generation
        print("\n🔑 Fallback: Manual token generation")
        refresh = RefreshToken.for_user(admin_user)
        access_token = str(refresh.access_token)
        print(f"✅ Manual access token: {access_token[:20]}...")
    
    # Test 2: Balance API with token
    print("\n💰 TEST 2: Balance API with token")
    balance_response = client.get(
        '/api/transactions/balances/my_balance/',
        HTTP_AUTHORIZATION=f'Bearer {access_token}',
        HTTP_ACCEPT='application/json'
    )
    
    print(f"Balance response status: {balance_response.status_code}")
    if balance_response.status_code == 200:
        balance_data = balance_response.json()
        print(f"✅ Balance data: {json.dumps(balance_data, indent=2)}")
    else:
        print(f"❌ Balance API failed: {balance_response.content}")
    
    # Test 3: CORS headers check
    print("\n🌐 TEST 3: CORS Headers")
    cors_response = client.options(
        '/api/transactions/balances/my_balance/',
        HTTP_ORIGIN='http://localhost:3002',
        HTTP_ACCESS_CONTROL_REQUEST_METHOD='GET',
        HTTP_ACCESS_CONTROL_REQUEST_HEADERS='authorization'
    )
    
    print(f"CORS preflight status: {cors_response.status_code}")
    print(f"CORS headers: {dict(cors_response.headers)}")
    
    return True

if __name__ == '__main__':
    test_auth_flow()
