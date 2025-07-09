#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

def verify_existing_users():
    print("=== Verifying Existing Users ===")
    
    # Make some existing users verified so they can test the frontend
    usernames_to_verify = ['amry0_0', 'amry3', 'amry4', 'frontend_test']
    
    for username in usernames_to_verify:
        try:
            user = User.objects.get(username=username)
            user.email_verified = True
            user.is_active = True
            user.save()
            print(f"✓ Verified user: {username}")
        except User.DoesNotExist:
            print(f"✗ User not found: {username}")
    
    # Also set a known password for amry0_0 for testing
    try:
        user = User.objects.get(username='amry0_0')
        user.set_password('testpass123')  # Set a known password
        user.save()
        print(f"✓ Set password for {user.username}")
    except User.DoesNotExist:
        print("✗ User amry0_0 not found")

if __name__ == "__main__":
    verify_existing_users()
