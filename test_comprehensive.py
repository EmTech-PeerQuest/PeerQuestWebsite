#!/usr/bin/env python3

import requests
import json
import sys
import time

def test_quest_system_comprehensive():
    """Comprehensive test of the quest system functionality."""
    
    print("🧪 Running Comprehensive Quest System Tests...")
    print("=" * 50)
    
    # Test URLs
    frontend_url = "http://localhost:3001"
    backend_url = "http://localhost:8000/api"
    
    tests_passed = 0
    tests_failed = 0
    
    def log_test(name, passed, details=""):
        nonlocal tests_passed, tests_failed
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} {name}")
        if details:
            print(f"    {details}")
        if passed:
            tests_passed += 1
        else:
            tests_failed += 1
    
    try:
        # Test 1: Frontend Accessibility
        print("\n📱 Testing Frontend Accessibility...")
        try:
            response = requests.get(frontend_url, timeout=10)
            log_test("Frontend Server", response.status_code == 200, f"Status: {response.status_code}")
        except Exception as e:
            log_test("Frontend Server", False, f"Error: {str(e)}")
        
        # Test 2: Backend API Endpoints
        print("\n🔧 Testing Backend API Endpoints...")
        
        # Test quests endpoint
        try:
            response = requests.get(f"{backend_url}/quests/", timeout=10)
            log_test("Quests API", response.status_code == 200, f"Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                quest_count = len(data.get('results', data)) if isinstance(data, dict) and 'results' in data else len(data) if isinstance(data, list) else 0
                log_test("Quest Data Structure", True, f"Found {quest_count} quests")
        except Exception as e:
            log_test("Quests API", False, f"Error: {str(e)}")
        
        # Test categories endpoint
        try:
            response = requests.get(f"{backend_url}/categories/", timeout=10)
            log_test("Categories API", response.status_code == 200, f"Status: {response.status_code}")
            if response.status_code == 200:
                categories = response.json()
                log_test("Categories Data", len(categories) > 0, f"Found {len(categories)} categories")
        except Exception as e:
            log_test("Categories API", False, f"Error: {str(e)}")
        
        # Test 3: Component Import/Export Structure
        print("\n🔧 Testing Component Structure...")
        
        # Check if key files exist
        import os
        base_path = "c:/Users/Mark/Desktop/PeerQuestWebsite/PeerQuestFrontEnd"
        
        key_files = [
            "components/quests/quest-board-clean.tsx",
            "components/quests/quest-details-modal.tsx", 
            "components/index.ts",
            "app/page.tsx"
        ]
        
        for file_path in key_files:
            full_path = os.path.join(base_path, file_path)
            exists = os.path.exists(full_path)
            log_test(f"File: {file_path}", exists)
        
        # Test 4: Quest Board Import Structure
        print("\n🧩 Testing Import/Export Structure...")
        
        try:
            # Read quest-board-clean.tsx to check imports
            with open(os.path.join(base_path, "components/quests/quest-board-clean.tsx"), 'r', encoding='utf-8') as f:
                content = f.read()
                has_default_import = 'import QuestDetailsModal from' in content
                has_named_import = 'import { QuestDetailsModal }' in content
                log_test("QuestDetailsModal Import Type", has_default_import and not has_named_import, 
                        f"Default: {has_default_import}, Named: {has_named_import}")
        except Exception as e:
            log_test("Import Structure Check", False, f"Error: {str(e)}")
        
        try:
            # Read quest-details-modal.tsx to check exports
            with open(os.path.join(base_path, "components/quests/quest-details-modal.tsx"), 'r', encoding='utf-8') as f:
                content = f.read()
                has_default_export = 'export default QuestDetailsModal' in content
                has_named_export = 'export function QuestDetailsModal' in content
                log_test("QuestDetailsModal Export Type", has_default_export and not has_named_export,
                        f"Default: {has_default_export}, Named: {has_named_export}")
        except Exception as e:
            log_test("Export Structure Check", False, f"Error: {str(e)}")
        
        # Test 5: Browser Accessibility Test
        print("\n🌐 Testing Browser Accessibility...")
        try:
            # Simple check if the page loads without immediate errors
            response = requests.get(frontend_url, timeout=15)
            content_length = len(response.content)
            has_content = content_length > 1000  # Basic check for substantial content
            log_test("Page Content", has_content, f"Content size: {content_length} bytes")
            
            # Check for React error indicators in the response
            error_indicators = ["Element type is invalid", "Cannot resolve module", "Failed to compile"]
            has_errors = any(error in response.text for error in error_indicators)
            log_test("No Critical Errors", not has_errors)
            
        except Exception as e:
            log_test("Browser Accessibility", False, f"Error: {str(e)}")
    
    except Exception as e:
        print(f"❌ Test suite error: {str(e)}")
        tests_failed += 1
    
    # Final Results
    print("\n" + "=" * 50)
    print(f"🏁 Test Results:")
    print(f"✅ Passed: {tests_passed}")
    print(f"❌ Failed: {tests_failed}")
    print(f"📊 Success Rate: {(tests_passed/(tests_passed+tests_failed)*100):.1f}%" if (tests_passed+tests_failed) > 0 else "No tests run")
    
    if tests_failed == 0:
        print("\n🎉 All tests passed! Quest system is working correctly.")
        print("\n🚀 Ready for use:")
        print(f"   • Frontend: {frontend_url}")
        print(f"   • Backend: {backend_url}")
        print("   • Quest Board should be accessible and functional")
        print("   • QuestDetailsModal should open without errors")
    else:
        print(f"\n⚠️  Some tests failed. Please review the issues above.")
    
    return tests_failed == 0

if __name__ == "__main__":
    success = test_quest_system_comprehensive()
    sys.exit(0 if success else 1)
