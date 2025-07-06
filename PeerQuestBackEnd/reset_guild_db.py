#!/usr/bin/env python
"""
Database Reset Script for Guild System
======================================

This script helps reset the database to fix schema mismatches.
Use this if your database schema doesn't match your models.
"""

import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.core.management import execute_from_command_line
from django.db import connection


def print_success(message):
    print(f"✅ {message}")


def print_error(message):
    print(f"❌ {message}")


def print_info(message):
    print(f"ℹ️  {message}")


def check_database_schema():
    """Check if database schema matches models"""
    print_info("Checking database schema...")
    
    try:
        with connection.cursor() as cursor:
            # Check if guilds_guild table exists and has the right columns
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='guilds_guild';")
            table_exists = cursor.fetchone()
            
            if not table_exists:
                print_error("Guild table does not exist")
                return False
            
            # Check table schema
            cursor.execute("PRAGMA table_info(guilds_guild);")
            columns = [row[1] for row in cursor.fetchall()]
            
            required_columns = [
                'guild_id', 'name', 'description', 'specialization', 
                'custom_emblem', 'preset_emblem', 'privacy', 'owner_id'
            ]
            
            missing_columns = [col for col in required_columns if col not in columns]
            
            if missing_columns:
                print_error(f"Missing columns: {missing_columns}")
                print_info(f"Current columns: {columns}")
                return False
            else:
                print_success("Database schema looks correct")
                return True
                
    except Exception as e:
        print_error(f"Error checking schema: {e}")
        return False


def reset_database():
    """Reset the database by dropping and recreating tables"""
    print_info("Resetting database...")
    
    try:
        # Drop all guild-related tables
        with connection.cursor() as cursor:
            guild_tables = [
                'guilds_guild',
                'guilds_guildmembership', 
                'guilds_guildjoinrequest',
                'guilds_guildtag',
                'guilds_guildsociallink'
            ]
            
            for table in guild_tables:
                try:
                    cursor.execute(f"DROP TABLE IF EXISTS {table};")
                    print_info(f"Dropped table {table}")
                except Exception as e:
                    print_info(f"Table {table} doesn't exist or couldn't be dropped: {e}")
        
        print_success("Dropped existing guild tables")
        
        # Reset migrations
        print_info("Resetting migrations...")
        os.system('python manage.py migrate guilds zero --fake')
        
        # Run migrations again
        print_info("Running migrations...")
        os.system('python manage.py migrate guilds')
        
        print_success("Database reset completed!")
        return True
        
    except Exception as e:
        print_error(f"Error resetting database: {e}")
        return False


def verify_reset():
    """Verify that the reset worked"""
    print_info("Verifying database reset...")
    
    try:
        from guilds.models import Guild
        from django.contrib.auth import get_user_model
        
        User = get_user_model()
        
        # Try to create a test guild
        user = User.objects.first()
        if not user:
            user = User.objects.create_user(
                email='test@example.com',
                user_name='testuser',
                first_name='Test',
                password='testpass123'
            )
        
        guild = Guild.objects.create(
            name='Test Guild Verification',
            description='Testing database reset',
            specialization='development',
            owner=user
        )
        
        print_success("Successfully created test guild")
        
        # Clean up
        guild.delete()
        if user.user_name == 'testuser':
            user.delete()
        
        return True
        
    except Exception as e:
        print_error(f"Verification failed: {e}")
        return False


def main():
    """Main function"""
    print("🔄 Guild Database Reset Script")
    print("=" * 40)
    
    # Check current schema
    if check_database_schema():
        print_success("Database schema is correct. No reset needed.")
        return
    
    print_info("Database schema issues detected. Proceeding with reset...")
    
    # Ask for confirmation
    response = input("\n⚠️  This will delete all guild data. Continue? (yes/no): ")
    if response.lower() not in ['yes', 'y']:
        print_info("Reset cancelled.")
        return
    
    # Perform reset
    if reset_database():
        if verify_reset():
            print_success("🎉 Database reset completed successfully!")
            print_info("You can now run: python quick_guild_test.py")
        else:
            print_error("Reset completed but verification failed.")
    else:
        print_error("Database reset failed.")


if __name__ == '__main__':
    main()
