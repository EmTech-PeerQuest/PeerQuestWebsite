import jwt
from django.conf import settings
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from rest_framework import status
from .models import BlacklistedToken

class TokenBlacklistMiddleware(MiddlewareMixin):
    """
    Middleware to check if JWT tokens are blacklisted
    """
    
    def process_request(self, request):
        # Skip for non-API endpoints and public endpoints
        if not request.path.startswith('/api/'):
            return None
            
        # Skip for endpoints that don't require authentication
        public_endpoints = [
            '/api/token/',
            '/api/users/register/',
            '/api/google-login-callback/',
            '/api/users/verify-email/',
            '/api/users/resend-verification/',
            '/api/auth/password-reset/',
        ]
        
        if any(request.path.startswith(endpoint) for endpoint in public_endpoints):
            return None
        
        # Get the Authorization header
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if not auth_header or not auth_header.startswith('Bearer '):
            return None
        
        try:
            # Extract the token
            token = auth_header.split(' ')[1]
            
            # Decode the token to get the JTI (JWT ID)
            decoded_token = jwt.decode(
                token, 
                settings.SECRET_KEY, 
                algorithms=['HS256'],
                options={"verify_signature": False}  # We're just extracting JTI
            )
            
            token_jti = decoded_token.get('jti')
            if not token_jti:
                return None
            
            # Check if token is blacklisted
            if BlacklistedToken.objects.filter(token_jti=token_jti).exists():
                return JsonResponse({
                    'error': 'Token has been revoked',
                    'code': 'TOKEN_BLACKLISTED'
                }, status=status.HTTP_401_UNAUTHORIZED)
                
        except jwt.InvalidTokenError:
            # Token is invalid anyway, let the authentication backend handle it
            pass
        except Exception as e:
            # Log the error but don't block the request
            # Error logged to system logs instead of console
            pass
        return None
