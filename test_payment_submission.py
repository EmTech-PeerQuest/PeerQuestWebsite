#!/usr/bin/env python3
"""
Test script to verify payment submission API works correctly.
This simulates the frontend API call to test the batch system.
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

def test_payment_submission():
    """Test the payment proof submission endpoint"""
    # Get authentication token
    token = get_auth_token()
    if not token:
        print("❌ Failed to authenticate")
        return
    
    print("✅ Authentication successful")
    
    # Prepare test data
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    # Create a proper test image using Pillow
    img = Image.new('RGB', (100, 100), color='white')
    img_buffer = BytesIO()
    img.save(img_buffer, format='PNG')
    img_buffer.seek(0)
    img_buffer.name = "test_receipt.png"
    
    data = {
        'payment_reference': 'TEST-' + str(int(os.urandom(4).hex(), 16)),
        'package_amount': 100,
        'package_price': 50.00,
        'bonus': 'Test bonus'
    }
    
    files = {
        'receipt': img_buffer
    }
    
    # Submit payment proof
    url = f"{API_BASE}/payments/submit-proof/"
    response = requests.post(url, data=data, files=files, headers=headers)
    
    print(f"\n📤 Payment submission response ({response.status_code}):")
    print("=" * 50)
    
    if response.status_code == 201:
        result = response.json()
        print("✅ Payment submission successful!")
        print(f"📄 Response: {json.dumps(result, indent=2)}")
        
        # Check if batch_info is present
        if 'batch_info' in result:
            batch_info = result['batch_info']
            print(f"\n🔧 Batch Info:")
            print(f"   Batch Name: {batch_info.get('batch_name')}")
            print(f"   Processing Time: {batch_info.get('processing_time')}")
            print(f"   Batch ID: {batch_info.get('batch_id')}")
        else:
            print("⚠️  Warning: No batch_info in response")
            
    else:
        print("❌ Payment submission failed!")
        print(f"📄 Response: {response.text}")
        
        # Check if it's an HTML error page
        if 'html' in response.headers.get('content-type', '').lower():
            print("🚨 Server returned HTML error page - Django might not be configured correctly")

if __name__ == "__main__":
    print("🧪 Testing PeerQuest Payment Submission API")
    print("=" * 50)
    test_payment_submission()
