#!/usr/bin/env python
import sqlite3
import os

def add_missing_columns():
    # Connect to the database
    conn = sqlite3.connect('db.sqlite3')
    cursor = conn.cursor()

    try:
        # Check what columns exist
        cursor.execute('PRAGMA table_info(users_user)')
        columns = [column[1] for column in cursor.fetchall()]
        print('Current columns in users_user table:', columns)

        # List of columns that should exist based on the model
        required_columns = [
            ('role', 'VARCHAR(20) DEFAULT "quest_maker"'),
            ('is_banned', 'BOOLEAN DEFAULT 0'),
            ('ban_reason', 'VARCHAR(255)'),
            ('ban_expires_at', 'DATETIME'),
        ]

        for column_name, column_def in required_columns:
            if column_name not in columns:
                print(f'Adding {column_name} column...')
                cursor.execute(f'ALTER TABLE users_user ADD COLUMN {column_name} {column_def}')
                conn.commit()
                print(f'{column_name} column added successfully!')
            else:
                print(f'{column_name} column already exists')

    except Exception as e:
        print(f'Error: {e}')
    finally:
        conn.close()

if __name__ == '__main__':
    add_missing_columns()
