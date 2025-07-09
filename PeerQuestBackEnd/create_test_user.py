#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

def create_frontend_test_user():
    print("=== Creating Frontend Test User ===")
    
    # Create a user that can be used for frontend testing
    username = 'frontend_test_user'
    password = 'testpass123'
    email = 'frontend_test@example.com'
    
    try:
        user = User.objects.get(username=username)
        print(f"User {username} already exists")
    except User.DoesNotExist:
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )
        print(f"Created user: {username}")
    
    # Make sure the user is verified and active
    user.email_verified = True
    user.is_active = True
    user.save()
    
    print(f"User details:")
    print(f"  Username: {user.username}")
    print(f"  Email: {user.email}")
    print(f"  Email Verified: {user.email_verified}")
    print(f"  Is Active: {user.is_active}")
    print(f"  Password: {password}")
    print(f"\nYou can use these credentials in the frontend:")
    print(f"  Username: {username}")
    print(f"  Password: {password}")

if __name__ == "__main__":
    create_frontend_test_user()
