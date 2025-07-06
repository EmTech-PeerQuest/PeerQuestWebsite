from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from rest_framework import status


class EmailVerificationMiddleware(MiddlewareMixin):
    """
    Middleware to restrict access for unverified users.
    Allows access to verification endpoints and basic auth endpoints.
    """
    
    # URLs that don't require email verification
    ALLOWED_UNVERIFIED_URLS = [
        '/api/users/register/',
        '/api/users/verify-email/',
        '/api/users/resend-verification/',
        '/api/users/google-login-callback/',
        '/api/auth/password-reset/',  # Allow password reset for unverified users
        '/api/token/refresh/',  # Allow token refresh (user already authenticated)
        '/admin/',
        '/api/docs/',
        '/api/swagger/',
        '/api/redoc/',
    ]
    
    def process_request(self, request):
        # Skip middleware for certain URLs
        if any(request.path.startswith(url) for url in self.ALLOWED_UNVERIFIED_URLS):
            return None
        
        # Skip middleware for static files and media
        if request.path.startswith('/static/') or request.path.startswith('/media/'):
            return None
        
        # Skip middleware for non-API endpoints
        if not request.path.startswith('/api/'):
            return None
        
        # Skip middleware for anonymous users
        if not hasattr(request, 'user') or not request.user.is_authenticated:
            return None
        
        # Check if user's email is verified (skip for superusers)
        # Superusers are exempt from email verification requirements
        if not request.user.email_verified and not request.user.is_superuser:
            return JsonResponse({
                'errors': ['Please verify your email address before accessing this resource.'],
                'verification_required': True
            }, status=status.HTTP_403_FORBIDDEN)
        
        return None
