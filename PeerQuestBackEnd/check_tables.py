#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.db import connection

cursor = connection.cursor()

# Check for GuildReport tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%guildreport%'")
tables = cursor.fetchall()
print("GuildReport related tables:", tables)

# Check for exact table name
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name = 'users_guildreport'")
exact_table = cursor.fetchall()
print("users_guildreport table exists:", len(exact_table) > 0)

# List all tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
all_tables = cursor.fetchall()
print("All tables:", [t[0] for t in all_tables])

# Try to access GuildReport model
try:
    from users.models import GuildReport
    print("GuildReport model imported successfully")
    print("GuildReport table name:", GuildReport._meta.db_table)
    count = GuildReport.objects.count()
    print("GuildReport count:", count)
except Exception as e:
    print("Error accessing GuildReport:", e)
