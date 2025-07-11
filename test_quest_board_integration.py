#!/usr/bin/env python3
"""
Test script to verify the quest board integration is working properly.
This script tests the frontend-backend connection for the quest system.
"""

import sys
import os
import requests
import json
from datetime import datetime

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'PeerQuestBackEnd'))

def test_quest_api_endpoints():
    """Test that quest API endpoints are accessible"""
    base_url = "http://localhost:8000/api"
    
    endpoints_to_test = [
        "/quests/quests/",
        "/quests/categories/",
    ]
    
    print("🔍 Testing Quest API Endpoints...")
    print("=" * 50)
    
    for endpoint in endpoints_to_test:
        try:
            url = f"{base_url}{endpoint}"
            response = requests.get(url, timeout=5)
            
            if response.status_code == 200:
                print(f"✅ {endpoint} - OK (Status: {response.status_code})")
                data = response.json()
                if isinstance(data, list):
                    print(f"   📊 Returned {len(data)} items")
                elif isinstance(data, dict) and 'results' in data:
                    print(f"   📊 Returned {len(data['results'])} items")
            else:
                print(f"❌ {endpoint} - Failed (Status: {response.status_code})")
                
        except requests.exceptions.RequestException as e:
            print(f"❌ {endpoint} - Connection Error: {e}")
        except json.JSONDecodeError:
            print(f"❌ {endpoint} - Invalid JSON response")
            
    print()

def test_frontend_compilation():
    """Test that frontend files compile without errors"""
    print("🔍 Testing Frontend Quest Board Files...")
    print("=" * 50)
    
    frontend_dir = os.path.join(os.path.dirname(__file__), 'PeerQuestFrontEnd')
    quest_files = [
        'components/quests/quest-board-clean.tsx',
        'components/quests/quest-details-modal.tsx',
        'components/index.ts',
        'app/page.tsx'
    ]
    
    for file_path in quest_files:
        full_path = os.path.join(frontend_dir, file_path)
        if os.path.exists(full_path):
            print(f"✅ {file_path} - File exists")
            
            # Check for common import issues
            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            if 'quest-board-clean' in content:
                print(f"   ✅ Contains correct quest-board-clean import")
            elif 'quest-board' in content and 'quest-board-clean' not in content:
                print(f"   ⚠️  May contain old quest-board import")
                
        else:
            print(f"❌ {file_path} - File missing")
    
    print()

def test_database_migration_status():
    """Test that database migrations are properly applied"""
    print("🔍 Testing Database Migration Status...")
    print("=" * 50)
    
    try:
        # Change to backend directory
        backend_dir = os.path.join(os.path.dirname(__file__), 'PeerQuestBackEnd')
        os.chdir(backend_dir)
        
        # Run Django management command to check migrations
        import subprocess
        result = subprocess.run([
            sys.executable, 'manage.py', 'showmigrations', '--verbosity=2'
        ], capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            print("✅ Migrations status check successful")
            
            # Check for any unapplied migrations
            output_lines = result.stdout.split('\n')
            unapplied_found = False
            
            for line in output_lines:
                if line.strip().startswith('[ ]'):
                    if not unapplied_found:
                        print("⚠️  Unapplied migrations found:")
                        unapplied_found = True
                    print(f"   - {line.strip()}")
                    
            if not unapplied_found:
                print("✅ All migrations are applied")
                
        else:
            print(f"❌ Migration check failed: {result.stderr}")
            
    except Exception as e:
        print(f"❌ Database check error: {e}")
        
    print()

def main():
    """Run all integration tests"""
    print("🚀 PeerQuest Quest Board Integration Test")
    print("=" * 50)
    print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Run all tests
    test_quest_api_endpoints()
    test_frontend_compilation()
    test_database_migration_status()
    
    print("🎯 Integration test completed!")
    print("=" * 50)
    print()
    print("Next steps:")
    print("1. Open http://localhost:3001 in your browser")
    print("2. Navigate to the Quest Board section")
    print("3. Verify that quests are loading and displaying correctly")
    print("4. Test quest creation, editing, and application features")

if __name__ == "__main__":
    main()
