#!/usr/bin/env python
"""
Guild Database Schema Migration Script
=====================================

This script migrates the existing guild table to the new schema.
"""

import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.db import connection, transaction
from django.contrib.auth import get_user_model

User = get_user_model()


def print_success(message):
    print(f"✅ {message}")


def print_error(message):
    print(f"❌ {message}")


def print_info(message):
    print(f"ℹ️  {message}")


def check_current_schema():
    """Check the current table schema"""
    print_info("Checking current guild table schema...")
    
    with connection.cursor() as cursor:
        cursor.execute("PRAGMA table_info(guilds_guild);")
        columns = cursor.fetchall()
        
        print_info("Current columns:")
        for col in columns:
            print(f"  - {col[1]} ({col[2]})")
        
        return [col[1] for col in columns]


def backup_existing_data():
    """Backup existing guild data"""
    print_info("Backing up existing data...")
    
    with connection.cursor() as cursor:
        # Check if there's any data to backup
        cursor.execute("SELECT COUNT(*) FROM guilds_guild;")
        count = cursor.fetchone()[0]
        
        if count == 0:
            print_info("No existing data to backup")
            return []
        
        print_info(f"Found {count} guilds to backup")
        
        # Backup the data
        cursor.execute("SELECT * FROM guilds_guild;")
        data = cursor.fetchall()
        
        return data


def create_new_schema():
    """Create the new guild table schema"""
    print_info("Creating new guild table schema...")
    
    with connection.cursor() as cursor:
        # Drop the old table
        cursor.execute("DROP TABLE IF EXISTS guilds_guild_old;")
        cursor.execute("ALTER TABLE guilds_guild RENAME TO guilds_guild_old;")
        
        # Create new table with correct schema
        create_sql = """
        CREATE TABLE "guilds_guild" (
            "guild_id" char(32) NOT NULL PRIMARY KEY,
            "name" varchar(100) NOT NULL UNIQUE,
            "description" text NOT NULL,
            "specialization" varchar(20) NOT NULL,
            "welcome_message" text NOT NULL,
            "custom_emblem" varchar(100) NULL,
            "preset_emblem" varchar(50) NOT NULL,
            "privacy" varchar(10) NOT NULL,
            "require_approval" bool NOT NULL,
            "minimum_level" integer unsigned NOT NULL CHECK ("minimum_level" >= 0),
            "allow_discovery" bool NOT NULL,
            "show_on_home_page" bool NOT NULL,
            "who_can_post_quests" varchar(15) NOT NULL,
            "who_can_invite_members" varchar(15) NOT NULL,
            "owner_id" bigint NOT NULL,
            "created_at" datetime NOT NULL,
            "updated_at" datetime NOT NULL,
            "member_count" integer unsigned NOT NULL CHECK ("member_count" >= 0),
            FOREIGN KEY ("owner_id") REFERENCES "users_newuser" ("id") DEFERRABLE INITIALLY DEFERRED
        );
        """
        
        cursor.execute(create_sql)
        print_success("Created new guild table schema")


def migrate_data():
    """Migrate data from old schema to new schema"""
    print_info("Migrating data to new schema...")
    
    with connection.cursor() as cursor:
        # Check if old table exists and has data
        try:
            cursor.execute("SELECT COUNT(*) FROM guilds_guild_old;")
            count = cursor.fetchone()[0]
            
            if count == 0:
                print_info("No data to migrate")
                return
                
            print_info(f"Migrating {count} guilds...")
            
            # Get the first user to be the owner of any guilds without valid owners
            cursor.execute("SELECT id FROM users_newuser LIMIT 1;")
            default_owner = cursor.fetchone()
            
            if not default_owner:
                print_error("No users found. Please create a user first.")
                return
                
            default_owner_id = default_owner[0]
            
            # Migrate the data with proper field mapping
            migrate_sql = """
            INSERT INTO guilds_guild (
                guild_id, name, description, specialization, welcome_message,
                custom_emblem, preset_emblem, privacy, require_approval, minimum_level,
                allow_discovery, show_on_home_page, who_can_post_quests, who_can_invite_members,
                owner_id, created_at, updated_at, member_count
            )
            SELECT 
                LOWER(HEX(RANDOMBLOB(16))), -- Generate UUID-like string
                name,
                description,
                specialization,
                welcome_message,
                NULL, -- custom_emblem (new field)
                COALESCE(preset_emblem, ''), -- preset_emblem
                privacy,
                require_approval,
                min_level, -- old column name
                allow_discovery,
                show_on_home, -- old column name
                COALESCE(who_can_post_quests, 'all_members'),
                COALESCE(who_can_invite, 'all_members'), -- old column name
                ?, -- default owner
                created_at,
                updated_at,
                1 -- default member count
            FROM guilds_guild_old;
            """
            
            cursor.execute(migrate_sql, [default_owner_id])
            print_success(f"Migrated {cursor.rowcount} guilds")
            
        except Exception as e:
            print_info(f"No old data to migrate: {e}")


def cleanup_old_tables():
    """Clean up old tables"""
    print_info("Cleaning up old tables...")
    
    with connection.cursor() as cursor:
        # Drop other guild-related tables to avoid conflicts
        tables_to_drop = [
            'guilds_guild_old',
            'guilds_guildmembership',
            'guilds_guildjoinrequest', 
            'guilds_guildtag',
            'guilds_guildsociallink'
        ]
        
        for table in tables_to_drop:
            try:
                cursor.execute(f"DROP TABLE IF EXISTS {table};")
                print_info(f"Dropped table {table}")
            except Exception as e:
                print_info(f"Table {table} doesn't exist: {e}")


def reset_migrations():
    """Reset migrations"""
    print_info("Resetting migrations...")
    
    with connection.cursor() as cursor:
        # Update migration tracking
        cursor.execute("""
            DELETE FROM django_migrations 
            WHERE app = 'guilds'
        """)
        
        print_success("Reset guild migrations")


def apply_migrations():
    """Apply migrations"""
    print_info("Applying migrations...")
    
    os.system('python manage.py migrate guilds')
    print_success("Applied guild migrations")


def main():
    """Main migration function"""
    print("🔄 Guild Database Schema Migration")
    print("=" * 50)
    
    try:
        with transaction.atomic():
            # Step 1: Check current schema
            current_columns = check_current_schema()
            
            # Check if we need to migrate
            required_columns = ['custom_emblem', 'minimum_level', 'show_on_home_page', 'owner_id']
            missing_columns = [col for col in required_columns if col not in current_columns]
            
            if not missing_columns:
                print_success("Schema is already correct!")
                return
            
            print_info(f"Missing columns: {missing_columns}")
            
            # Ask for confirmation
            response = input("\n⚠️  This will modify the database structure. Continue? (yes/no): ")
            if response.lower() not in ['yes', 'y']:
                print_info("Migration cancelled.")
                return
            
            # Step 2: Backup existing data
            backup_data = backup_existing_data()
            
            # Step 3: Create new schema
            create_new_schema()
            
            # Step 4: Migrate data
            migrate_data()
            
            # Step 5: Clean up old tables
            cleanup_old_tables()
            
            # Step 6: Reset and apply migrations
            reset_migrations()
            
            print_success("✨ Schema migration completed successfully!")
            print_info("Now run: python manage.py migrate guilds")
            
    except Exception as e:
        print_error(f"Migration failed: {e}")
        print_info("Database changes have been rolled back.")


if __name__ == '__main__':
    main()
