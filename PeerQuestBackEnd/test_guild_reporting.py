#!/usr/bin/env python3
"""
Test script to verify guild reporting functionality
"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_guild_endpoints():
    """Test the guild reporting endpoints"""
    
    print("🧪 Testing Guild Reporting Endpoints")
    print("=" * 50)
    
    # Test 1: Check if guild reports endpoint exists
    print("\n1. Testing admin guild reports endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/users/admin/guild-reports/")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Admin guild reports endpoint is accessible")
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
        elif response.status_code == 401:
            print("⚠️  Endpoint exists but requires authentication (expected)")
        elif response.status_code == 403:
            print("⚠️  Endpoint exists but requires admin permissions (expected)")
        else:
            print(f"❌ Unexpected status code: {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
    
    # Test 2: Check if guild report creation endpoint exists
    print("\n2. Testing guild report creation endpoint...")
    try:
        response = requests.post(f"{BASE_URL}/api/users/guild-report/", 
                               json={"test": "data"})
        print(f"Status Code: {response.status_code}")
        
        if response.status_code in [400, 401, 403]:
            print("✅ Guild report creation endpoint is accessible (authentication/validation error expected)")
        elif response.status_code == 404:
            print("❌ Guild report creation endpoint not found")
        else:
            print(f"Status: {response.status_code} - {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
    
    # Test 3: Check notifications endpoint
    print("\n3. Testing notifications endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/notifications/")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code in [200, 401, 403]:
            print("✅ Notifications endpoint is accessible")
        elif response.status_code == 404:
            print("❌ Notifications endpoint not found")
        else:
            print(f"Status: {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")

if __name__ == "__main__":
    test_guild_endpoints()
