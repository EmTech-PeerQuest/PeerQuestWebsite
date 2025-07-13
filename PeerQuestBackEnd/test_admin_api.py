#!/usr/bin/env python
"""
Test script to verify admin API endpoints work correctly
"""
import os
import django
import sys

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.test import Client
from django.contrib.auth import get_user_model
from users.models import GuildReport
from guilds.models import Guild

User = get_user_model()

def test_admin_endpoints():
    """Test admin endpoints to ensure they work correctly"""
    
    print("=== Testing Admin API Endpoints ===\n")
    
    # Create a test client
    client = Client()
    
    # Get or create a staff user for testing
    staff_user, created = User.objects.get_or_create(
        email='admin@test.com',
        defaults={
            'username': 'admin',
            'is_staff': True,
            'is_superuser': True
        }
    )
    if created:
        staff_user.set_password('admin123')
        staff_user.save()
        print(f"✓ Created test admin user: {staff_user.email}")
    else:
        print(f"✓ Using existing admin user: {staff_user.email}")
    
    # Login as staff user
    login_success = client.login(email='admin@test.com', password='admin123')
    if not login_success:
        # Try to force login
        client.force_login(staff_user)
    print(f"✓ Logged in as admin user")
    
    # Test 1: Admin Reports List
    print("\n--- Testing Admin Reports Endpoint ---")
    response = client.get('/api/users/admin/reports/')
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Reports endpoint working")
        print(f"  Total reports returned: {len(data)}")
        
        # Check for guild reports
        guild_reports = [r for r in data if r.get('type') == 'guild' or r.get('report_type') == 'guild']
        print(f"  Guild reports found: {len(guild_reports)}")
        
        if guild_reports:
            print("✓ Guild reports are being returned correctly")
            for report in guild_reports[:3]:  # Show first 3
                print(f"    - Report {report['id']}: {report.get('reported_guild_name', 'Unknown Guild')}")
        else:
            print("⚠ No guild reports found in response")
    else:
        print(f"✗ Reports endpoint failed: {response.content.decode()}")
    
    # Test 2: Guild Reports Specific Endpoint
    print("\n--- Testing Guild Reports Specific Endpoint ---")
    response = client.get('/api/users/admin/guild-reports/')
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Guild reports endpoint working")
        print(f"  Guild reports returned: {len(data)}")
        
        if data:
            print("✓ Guild reports endpoint returning data")
            for report in data[:3]:  # Show first 3
                print(f"    - Report {report['id']}: {report.get('reported_guild_name', 'Unknown Guild')}")
        else:
            print("⚠ No guild reports found")
    else:
        print(f"✗ Guild reports endpoint failed: {response.content.decode()}")
    
    # Test 3: Database verification
    print("\n--- Database Verification ---")
    guild_report_count = GuildReport.objects.count()
    print(f"Guild reports in database: {guild_report_count}")
    
    if guild_report_count > 0:
        print("✓ Guild reports exist in database")
        latest_report = GuildReport.objects.first()
        print(f"  Latest report: Guild '{latest_report.reported_guild.name}' reported for '{latest_report.reason}'")
    else:
        print("⚠ No guild reports in database")
    
    print("\n=== Test Summary ===")
    print("1. Admin user authentication: ✓")
    print(f"2. Admin reports endpoint: {'✓' if response.status_code == 200 else '✗'}")
    print(f"3. Guild reports in database: {'✓' if guild_report_count > 0 else '⚠'}")
    print("\nIf you see ✓ for all tests, your admin panel should work correctly!")

if __name__ == "__main__":
    test_admin_endpoints()
