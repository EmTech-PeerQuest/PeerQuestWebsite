#!/usr/bin/env python3
"""
Test script to verify Google OAuth2 configuration
Run this to check if your Google OAuth2 settings are properly configured
"""
import os
import sys
import django
from django.conf import settings

# Add the Django project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

def test_google_oauth_config():
    """Test Google OAuth2 configuration"""
    print("🔍 Testing Google OAuth2 Configuration...")
    print("=" * 50)
    
    # Check if Google OAuth2 client ID is configured
    client_id = getattr(settings, 'GOOGLE_OAUTH2_CLIENT_ID', None)
    client_secret = getattr(settings, 'GOOGLE_OAUTH2_CLIENT_SECRET', None)
    
    print(f"✅ GOOGLE_OAUTH2_CLIENT_ID: {'✓ Configured' if client_id else '❌ Not configured'}")
    print(f"✅ GOOGLE_OAUTH2_CLIENT_SECRET: {'✓ Configured' if client_secret else '❌ Not configured'}")
    
    if client_id:
        print(f"   Client ID: {client_id[:20]}...")
    
    # Check URLs
    access_token_url = getattr(settings, 'GOOGLE_ACCESS_TOKEN_OBTAIN_URL', None)
    user_info_url = getattr(settings, 'GOOGLE_USER_INFO_URL', None)
    
    print(f"✅ GOOGLE_ACCESS_TOKEN_OBTAIN_URL: {access_token_url}")
    print(f"✅ GOOGLE_USER_INFO_URL: {user_info_url}")
    
    # Check email settings
    email_backend = getattr(settings, 'EMAIL_BACKEND', None)
    email_host = getattr(settings, 'EMAIL_HOST', None)
    default_from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', None)
    
    print("\n🔍 Email Configuration:")
    print(f"✅ EMAIL_BACKEND: {email_backend}")
    print(f"✅ EMAIL_HOST: {email_host}")
    print(f"✅ DEFAULT_FROM_EMAIL: {default_from_email}")
    
    # Test if we can import required modules
    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests
        print("\n✅ Google OAuth2 libraries are properly installed")
    except ImportError as e:
        print(f"\n❌ Google OAuth2 libraries not installed: {e}")
        print("   Run: pip install google-auth google-auth-oauthlib")
    
    # Check if middleware is configured
    middleware = getattr(settings, 'MIDDLEWARE', [])
    email_middleware = any('email_verification_middleware' in m for m in middleware)
    print(f"\n✅ Email verification middleware: {'✓ Configured' if email_middleware else '❌ Not configured'}")
    
    print("\n" + "=" * 50)
    if client_id and client_secret:
        print("🎉 Google OAuth2 appears to be configured correctly!")
        print("   If you're still getting errors, check the server logs for more details.")
    else:
        print("⚠️  Google OAuth2 configuration incomplete!")
        print("   Please set GOOGLE_OAUTH2_CLIENT_ID and GOOGLE_OAUTH2_CLIENT_SECRET")
        print("   in your environment variables or .env file.")
    
    return client_id and client_secret

if __name__ == "__main__":
    test_google_oauth_config()
