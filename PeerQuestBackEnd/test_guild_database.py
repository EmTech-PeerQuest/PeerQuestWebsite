#!/usr/bin/env python
"""
Guild Database Testing Script
=============================

This script provides various ways to test your guild database functionality.

Usage Examples:
  python test_guild_database.py --all
  python test_guild_database.py --models
  python test_guild_database.py --api
  python test_guild_database.py --performance
"""

import os
import sys
import django
from django.conf import settings
from django.test.utils import get_runner

# Add the parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.core.management import execute_from_command_line
from django.test import TestCase
from django.contrib.auth import get_user_model
from guilds.models import Guild, GuildMembership, GuildJoinRequest

User = get_user_model()


def run_unit_tests():
    """Run all guild-related unit tests"""
    print("🧪 Running Guild Unit Tests...")
    print("=" * 50)
    
    # Run the tests
    exit_code = os.system('python manage.py test guilds.tests -v 2')
    
    if exit_code == 0:
        print("✅ All unit tests passed!")
    else:
        print("❌ Some unit tests failed!")
    
    return exit_code == 0


def run_model_tests():
    """Run model-specific tests"""
    print("🏗️  Running Model Tests...")
    print("=" * 50)
    
    exit_code = os.system('python manage.py test guilds.tests.GuildModelTest guilds.tests.GuildMembershipTest -v 2')
    
    if exit_code == 0:
        print("✅ All model tests passed!")
    else:
        print("❌ Some model tests failed!")
    
    return exit_code == 0


def run_api_tests():
    """Run API-specific tests"""
    print("🌐 Running API Tests...")
    print("=" * 50)
    
    exit_code = os.system('python manage.py test guilds.tests.GuildAPITest -v 2')
    
    if exit_code == 0:
        print("✅ All API tests passed!")
    else:
        print("❌ Some API tests failed!")
    
    return exit_code == 0


def run_integration_tests():
    """Run comprehensive integration tests"""
    print("🔗 Running Integration Tests...")
    print("=" * 50)
    
    exit_code = os.system('python manage.py test guilds.tests.GuildDatabaseIntegrationTest -v 2')
    
    if exit_code == 0:
        print("✅ All integration tests passed!")
    else:
        print("❌ Some integration tests failed!")
    
    return exit_code == 0


def run_performance_tests():
    """Run performance tests"""
    print("⚡ Running Performance Tests...")
    print("=" * 50)
    
    exit_code = os.system('python manage.py test guilds.tests.GuildPerformanceTest -v 2')
    
    if exit_code == 0:
        print("✅ All performance tests passed!")
    else:
        print("❌ Some performance tests failed!")
    
    return exit_code == 0


def quick_database_check():
    """Perform a quick database integrity check"""
    print("🔍 Quick Database Check...")
    print("=" * 50)
    
    try:
        # Check basic counts
        guild_count = Guild.objects.count()
        membership_count = GuildMembership.objects.count()
        join_request_count = GuildJoinRequest.objects.count()
        
        print(f"📊 Database Status:")
        print(f"   Guilds: {guild_count}")
        print(f"   Memberships: {membership_count}")
        print(f"   Join Requests: {join_request_count}")
        
        # Check for basic data integrity
        issues = []
        
        # Check if all guilds have owners
        guilds_without_owners = Guild.objects.filter(owner__isnull=True)
        if guilds_without_owners.exists():
            issues.append(f"{guilds_without_owners.count()} guilds without owners")
        
        # Check for orphaned memberships
        orphaned_memberships = GuildMembership.objects.filter(guild__isnull=True)
        if orphaned_memberships.exists():
            issues.append(f"{orphaned_memberships.count()} orphaned memberships")
        
        if issues:
            print("⚠️  Issues found:")
            for issue in issues:
                print(f"   - {issue}")
        else:
            print("✅ No obvious issues found!")
        
        return len(issues) == 0
        
    except Exception as e:
        print(f"❌ Error during database check: {e}")
        return False


def create_test_data():
    """Create sample test data"""
    print("🏗️  Creating Test Data...")
    print("=" * 50)
    
    exit_code = os.system('python manage.py test_guild_db --create-sample-data')
    
    if exit_code == 0:
        print("✅ Test data created successfully!")
    else:
        print("❌ Failed to create test data!")
    
    return exit_code == 0


def cleanup_test_data():
    """Clean up test data"""
    print("🧹 Cleaning up test data...")
    print("=" * 50)
    
    exit_code = os.system('python manage.py test_guild_db --cleanup')
    
    if exit_code == 0:
        print("✅ Test data cleaned up successfully!")
    else:
        print("❌ Failed to clean up test data!")
    
    return exit_code == 0


def run_comprehensive_tests():
    """Run all database tests"""
    print("🎯 Running Comprehensive Database Tests...")
    print("=" * 50)
    
    exit_code = os.system('python manage.py test_guild_db --run-database-tests')
    
    if exit_code == 0:
        print("✅ All comprehensive tests passed!")
    else:
        print("❌ Some comprehensive tests failed!")
    
    return exit_code == 0


def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Test Guild Database Functionality')
    parser.add_argument('--all', action='store_true', help='Run all tests')
    parser.add_argument('--models', action='store_true', help='Run model tests only')
    parser.add_argument('--api', action='store_true', help='Run API tests only')
    parser.add_argument('--integration', action='store_true', help='Run integration tests')
    parser.add_argument('--performance', action='store_true', help='Run performance tests')
    parser.add_argument('--quick-check', action='store_true', help='Quick database check')
    parser.add_argument('--create-data', action='store_true', help='Create test data')
    parser.add_argument('--cleanup', action='store_true', help='Clean up test data')
    parser.add_argument('--comprehensive', action='store_true', help='Run comprehensive database tests')
    
    args = parser.parse_args()
    
    if not any(vars(args).values()):
        # No arguments provided, show help and run quick check
        parser.print_help()
        print("\n" + "=" * 50)
        quick_database_check()
        return
    
    success = True
    
    if args.cleanup:
        success &= cleanup_test_data()
    
    if args.create_data:
        success &= create_test_data()
    
    if args.quick_check:
        success &= quick_database_check()
    
    if args.models:
        success &= run_model_tests()
    
    if args.api:
        success &= run_api_tests()
    
    if args.integration:
        success &= run_integration_tests()
    
    if args.performance:
        success &= run_performance_tests()
    
    if args.comprehensive:
        success &= run_comprehensive_tests()
    
    if args.all:
        print("🎯 Running ALL Tests...")
        print("=" * 70)
        success &= run_model_tests()
        print("\n")
        success &= run_api_tests()
        print("\n")
        success &= run_integration_tests()
        print("\n")
        success &= run_performance_tests()
        print("\n")
        success &= run_comprehensive_tests()
    
    print("\n" + "=" * 70)
    if success:
        print("🎉 All tests completed successfully!")
    else:
        print("⚠️  Some tests failed. Check the output above for details.")
    
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
