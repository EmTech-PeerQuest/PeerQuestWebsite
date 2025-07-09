#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

def check_users():
    print("=== All Users ===")
    users = User.objects.all()
    for user in users:
        print(f"Username: {user.username}, Email Verified: {getattr(user, 'email_verified', 'N/A')}, Is Active: {user.is_active}")

if __name__ == "__main__":
    check_users()
