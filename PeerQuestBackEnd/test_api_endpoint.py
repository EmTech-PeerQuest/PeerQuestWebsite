#!/usr/bin/env python
"""Test script to check admin reports API endpoint"""

import os
import sys
import django

# Add the project directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.test import Client
from django.contrib.auth import get_user_model
from users.models import GuildReport

def test_api_endpoints():
    User = get_user_model()
    client = Client()

    # Get or create a staff user
    staff_user = User.objects.filter(is_staff=True).first()
    if not staff_user:
        staff_user = User.objects.create_user(
            email='admin@test.com',
            username='admin',
            password='admin123',
            is_staff=True,
            is_superuser=True
        )

    # Force login
    client.force_login(staff_user)

    print('=== Testing Admin Reports API Endpoint ===')

    # Test general reports endpoint
    response = client.get('/api/users/admin/reports/')
    print(f'Admin reports endpoint status: {response.status_code}')

    if response.status_code == 200:
        data = response.json()
        print(f'Total reports returned: {len(data)}')
        
        # Check for guild reports
        guild_reports = [r for r in data if r.get('type') == 'guild' or r.get('report_type') == 'guild']
        print(f'Guild reports found: {len(guild_reports)}')
        
        if guild_reports:
            print('Guild reports details:')
            for report in guild_reports:
                print(f'  - ID: {report.get("id")}, Type: {report.get("type")}/{report.get("report_type")}, Guild: {report.get("reported_guild_name")}')
        else:
            print('No guild reports found in API response')
            print('Sample report structure:')
            if data:
                print(f'  First report keys: {list(data[0].keys())}')
                print(f'  First report: {data[0]}')
    else:
        print(f'API Error: {response.content.decode()[:200]}')

    # Check if the API endpoint exists and what it returns
    print('\n=== Direct Database Query for Comparison ===')
    guild_reports = GuildReport.objects.all()
    print(f'Guild reports in database: {guild_reports.count()}')
    
    for report in guild_reports:
        print(f'  - ID: {report.id}, Guild: {report.reported_guild.name if report.reported_guild else "None"}, Reason: {report.reason}')

if __name__ == '__main__':
    test_api_endpoints()
