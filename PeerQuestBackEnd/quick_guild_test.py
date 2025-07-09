#!/usr/bin/env python
"""
Quick Guild Database Test Script
================================

A simple script to quickly test your guild database functionality.
Run this script to verify that your guild system is working correctly.

Usage: python quick_guild_test.py
"""

import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from guilds.models import Guild, GuildMembership, GuildJoinRequest, GuildTag
from django.db import transaction

User = get_user_model()


def print_success(message):
    print(f"✅ {message}")


def print_error(message):
    print(f"❌ {message}")


def print_info(message):
    print(f"ℹ️  {message}")


def test_database_connection():
    """Test basic database connectivity"""
    try:
        guild_count = Guild.objects.count()
        user_count = User.objects.count()
        print_success(f"Database connected. Found {guild_count} guilds and {user_count} users.")
        return True
    except Exception as e:
        print_error(f"Database connection failed: {e}")
        return False


def test_user_creation():
    """Test creating a user"""
    try:
        user = User.objects.create_user(
            email='quicktest@example.com',
            user_name='quicktest',
            first_name='QuickTest',
            password='testpass123'
        )
        print_success(f"Created test user: {user.user_name}")
        return user
    except Exception as e:
        print_error(f"User creation failed: {e}")
        return None


def test_guild_creation(user):
    """Test creating a guild"""
    try:
        guild = Guild.objects.create(
            name='Quick Test Guild',
            description='A guild created by the quick test script',
            specialization='development',
            owner=user
        )
        print_success(f"Created test guild: {guild.name}")
        return guild
    except Exception as e:
        print_error(f"Guild creation failed: {e}")
        return None


def test_membership_creation(guild, user):
    """Test creating a membership"""
    try:
        membership = GuildMembership.objects.create(
            guild=guild,
            user=user,
            role='owner',
            status='approved',
            is_active=True
        )
        print_success(f"Created membership for {user.user_name} in {guild.name}")
        return membership
    except Exception as e:
        print_error(f"Membership creation failed: {e}")
        return None


def test_guild_methods(guild, user):
    """Test guild methods"""
    try:
        is_member = guild.is_member(user)
        is_owner = guild.is_owner(user)
        is_admin = guild.is_admin(user)
        
        print_success(f"is_member({user.user_name}): {is_member}")
        print_success(f"is_owner({user.user_name}): {is_owner}")
        print_success(f"is_admin({user.user_name}): {is_admin}")
        
        if is_member and is_owner:
            print_success("Guild methods working correctly!")
            return True
        else:
            print_error("Guild methods not working as expected")
            return False
    except Exception as e:
        print_error(f"Guild methods test failed: {e}")
        return False


def test_tags_and_relationships(guild):
    """Test tags and related models"""
    try:
        # Create tags
        tag1 = GuildTag.objects.create(guild=guild, tag='testing')
        tag2 = GuildTag.objects.create(guild=guild, tag='django')
        
        # Test relationships
        tag_count = guild.tags.count()
        print_success(f"Created {tag_count} tags for guild")
        
        if tag_count == 2:
            print_success("Tag relationships working correctly!")
            return True
        else:
            print_error(f"Expected 2 tags, got {tag_count}")
            return False
    except Exception as e:
        print_error(f"Tags test failed: {e}")
        return False


def test_join_request_workflow(guild):
    """Test join request functionality"""
    try:
        # Create another user
        applicant = User.objects.create_user(
            email='applicant@example.com',
            user_name='applicant',
            first_name='Applicant',
            password='testpass123'
        )
        
        # Create join request
        join_request = GuildJoinRequest.objects.create(
            guild=guild,
            user=applicant,
            message='Test join request'
        )
        
        print_success(f"Created join request from {applicant.user_name}")
        
        # Test approval workflow
        join_request.is_approved = True
        join_request.processed_by = guild.owner
        join_request.save()
        
        # Create membership
        membership = GuildMembership.objects.create(
            guild=guild,
            user=applicant,
            role='member',
            status='approved',
            is_active=True
        )
        
        print_success(f"Approved join request and created membership")
        
        # Test that user is now a member
        if guild.is_member(applicant):
            print_success("Join request workflow working correctly!")
            return True
        else:
            print_error("User is not a member after approval")
            return False
            
    except Exception as e:
        print_error(f"Join request test failed: {e}")
        return False


def cleanup_test_data():
    """Clean up test data"""
    try:
        # Delete test guilds and users
        Guild.objects.filter(name__contains='Quick Test').delete()
        User.objects.filter(user_name__in=['quicktest', 'applicant']).delete()
        print_success("Cleaned up test data")
    except Exception as e:
        print_error(f"Cleanup failed: {e}")


def main():
    """Main test function"""
    print("🚀 Quick Guild Database Test")
    print("=" * 40)
    
    # Track test results
    tests_passed = 0
    total_tests = 6
    
    # Test 1: Database connection
    print_info("Test 1: Database Connection")
    if test_database_connection():
        tests_passed += 1
    print()
    
    # Use transaction to rollback changes if any test fails
    try:
        with transaction.atomic():
            # Test 2: User creation
            print_info("Test 2: User Creation")
            user = test_user_creation()
            if user:
                tests_passed += 1
            print()
            
            # Test 3: Guild creation
            print_info("Test 3: Guild Creation")
            guild = test_guild_creation(user) if user else None
            if guild:
                tests_passed += 1
            print()
            
            # Test 4: Membership creation
            print_info("Test 4: Membership Creation")
            membership = test_membership_creation(guild, user) if guild and user else None
            if membership:
                tests_passed += 1
            print()
            
            # Test 5: Guild methods
            print_info("Test 5: Guild Methods")
            if guild and user and test_guild_methods(guild, user):
                tests_passed += 1
            print()
            
            # Test 6: Tags and relationships
            print_info("Test 6: Tags and Relationships")
            if guild and test_tags_and_relationships(guild):
                tests_passed += 1
            print()
            
            # Test 7: Join request workflow (bonus test)
            print_info("Bonus Test: Join Request Workflow")
            if guild and test_join_request_workflow(guild):
                total_tests += 1
                tests_passed += 1
            print()
            
            # Rollback transaction to clean up
            raise transaction.TransactionManagementError("Rolling back test transaction")
            
    except transaction.TransactionManagementError:
        # This is expected - we're rolling back on purpose
        pass
    except Exception as e:
        print_error(f"Unexpected error during testing: {e}")
    
    # Display results
    print("=" * 40)
    print(f"📊 Test Results: {tests_passed}/{total_tests} tests passed")
    
    if tests_passed == total_tests:
        print_success("🎉 All tests passed! Your guild database is working perfectly!")
    elif tests_passed > total_tests * 0.7:
        print_info("⚠️  Most tests passed, but some issues were found. Check the output above.")
    else:
        print_error("❌ Multiple tests failed. There are significant issues with the guild database.")
    
    print("\n🔧 For comprehensive testing, run:")
    print("   python manage.py test guilds.tests")
    print("   python test_guild_database.py --all")


if __name__ == '__main__':
    main()
