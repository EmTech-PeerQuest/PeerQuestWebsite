#!/usr/bin/env python
"""
Reset admin user password to a known value.
"""

import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model

def reset_admin_password():
    User = get_user_model()
    admin_user = User.objects.filter(is_superuser=True).first()
    
    if not admin_user:
        print("❌ No admin user found")
        return
    
    print(f"🔄 Resetting password for admin user: {admin_user.username}")
    
    # Set a known password
    admin_user.set_password('admin123')
    admin_user.save()
    
    print("✅ Admin password reset to 'admin123'")
    print("ℹ️  You can now log in with:")
    print("   Username: admin")
    print("   Password: admin123")

if __name__ == '__main__':
    reset_admin_password()
