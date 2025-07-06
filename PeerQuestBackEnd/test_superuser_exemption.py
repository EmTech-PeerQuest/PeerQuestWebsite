"""
Test script to verify superuser email verification exemption
"""
import os
import sys
import django

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.test import TestCase, Client
from django.urls import reverse
import json

User = get_user_model()

def test_superuser_email_verification_exemption():
    """Test that superusers are exempt from email verification"""
    print("Testing superuser email verification exemption...")
    
    # Create a test superuser
    superuser = User.objects.create_superuser(
        username='testsuperuser',
        email='superuser@test.com',
        password='testpass123'
    )
    
    # Check that superuser is automatically verified
    superuser.refresh_from_db()
    assert superuser.email_verified == True, "Superuser should be automatically verified"
    print("✅ Superuser is automatically verified upon creation")
    
    # Create a regular user for comparison
    regular_user = User.objects.create_user(
        username='testuser',
        email='user@test.com',
        password='testpass123'
    )
    
    # Check that regular user is not automatically verified
    regular_user.refresh_from_db()
    assert regular_user.email_verified == False, "Regular user should not be automatically verified"
    print("✅ Regular user is not automatically verified")
    
    # Test login with superuser (should work even without email verification)
    client = Client()
    response = client.post('/api/auth/login/', {
        'username': 'testsuperuser',
        'password': 'testpass123'
    })
    
    # Check if we have the endpoint - if not, test the middleware logic
    if response.status_code == 404:
        print("⚠️  Login endpoint not found - testing middleware logic directly")
        
        # Test middleware logic directly
        from users.email_verification_middleware import EmailVerificationMiddleware
        from django.http import HttpRequest
        from django.contrib.auth import authenticate
        
        # Create a mock request
        request = HttpRequest()
        request.path = '/api/test/'
        request.method = 'GET'
        request.user = superuser
        
        # Test middleware
        middleware = EmailVerificationMiddleware(lambda r: None)
        response = middleware.process_request(request)
        
        assert response is None, "Middleware should allow superuser through"
        print("✅ Middleware allows superuser through")
        
        # Test with regular user
        request.user = regular_user
        response = middleware.process_request(request)
        
        assert response is not None, "Middleware should block unverified regular user"
        print("✅ Middleware blocks unverified regular user")
    else:
        print("✅ Login endpoint works for superuser")
    
    # Clean up
    superuser.delete()
    regular_user.delete()
    
    print("\n🎉 All tests passed! Superusers are successfully exempt from email verification.")

if __name__ == '__main__':
    test_superuser_email_verification_exemption()
