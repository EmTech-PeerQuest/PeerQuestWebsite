#!/usr/bin/env python
"""Test script to check admin reports API endpoint with JWT authentication"""

import os
import sys
import django
from datetime import timedelta

# Add the project directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.test import Client
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from users.models import GuildReport
import json

def test_api_with_jwt():
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

    # Generate JWT token for the staff user
    refresh = RefreshToken.for_user(staff_user)
    access_token = str(refresh.access_token)

    print('=== Testing Admin Reports API Endpoint with JWT ===')
    print(f'Staff user: {staff_user.username} (is_staff: {staff_user.is_staff}, is_superuser: {staff_user.is_superuser})')

    # Test general reports endpoint with JWT
    response = client.get('/api/users/admin/reports/', HTTP_AUTHORIZATION=f'Bearer {access_token}')
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
            if data:
                print('Sample report structure (first report):')
                print(f'  Keys: {list(data[0].keys())}')
                print(f'  Sample data: {json.dumps(data[0], indent=2)[:300]}...')
    else:
        print(f'API Error: {response.content.decode()[:200]}')

    # Check if the API endpoint exists and what it returns
    print('\n=== Direct Database Query for Comparison ===')
    guild_reports = GuildReport.objects.all()
    print(f'Guild reports in database: {guild_reports.count()}')
    
    for report in guild_reports:
        print(f'  - ID: {report.id}, Guild: {report.reported_guild.name if report.reported_guild else "None"}, Reason: {report.reason}')

    # Also test the specific guild reports endpoint
    print('\n=== Testing Guild-Specific Reports Endpoint ===')
    response = client.get('/api/users/admin/guild-reports/', HTTP_AUTHORIZATION=f'Bearer {access_token}')
    print(f'Guild reports endpoint status: {response.status_code}')
    
    if response.status_code == 200:
        data = response.json()
        print(f'Guild reports returned: {len(data)}')
        if data:
            for report in data:
                print(f'  - ID: {report.get("id")}, Guild: {report.get("reported_guild_name")}, Reason: {report.get("reason")}')
    else:
        print(f'Guild reports API Error: {response.content.decode()[:200]}')

if __name__ == '__main__':
    test_api_with_jwt()
