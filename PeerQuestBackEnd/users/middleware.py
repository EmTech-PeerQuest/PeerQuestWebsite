import jwt
from django.conf import settings
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth import get_user_model
from django.utils.functional import SimpleLazyObject
from rest_framework.request import Request
from urllib.parse import urlparse

User = get_user_model()

def get_user_from_token(request):
    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    token = ''
    if auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
    if not token:
        return AnonymousUser()
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        return AnonymousUser()
    except Exception:
        return AnonymousUser()
    user = User.objects.filter(username=payload.get('sub')).first()
    return user or AnonymousUser()

def is_public_path(path):
    # Allow all variations of the callback and register endpoints (with or without trailing slash)
    return path.rstrip('/').startswith('/api/google-login-callback') or path.rstrip('/').startswith('/api/users/register')

class JWTAuthMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
    def __call__(self, request: Request):
        if request.path.startswith('/api/') and not is_public_path(request.path):
            request.user = SimpleLazyObject(lambda: get_user_from_token(request))
        else:
            # Explicitly set AnonymousUser for public paths
            request.user = AnonymousUser()
        return self.get_response(request)
