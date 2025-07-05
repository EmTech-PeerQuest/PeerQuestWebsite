import requests
from django.conf import settings
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from typing import Dict, Any
from rest_framework_simplejwt.tokens import RefreshToken

def google_get_access_token(code: str, redirect_uri: str) -> str:
    data = {
        'code': code,
        'client_id': settings.GOOGLE_OAUTH2_CLIENT_ID,
        'client_secret': settings.GOOGLE_OAUTH2_CLIENT_SECRET,
        'redirect_uri': redirect_uri,
        'grant_type': 'authorization_code'
    }
    response = requests.post(settings.GOOGLE_ACCESS_TOKEN_OBTAIN_URL, data=data)
    if not response.ok:
        raise ValidationError('Failed to obtain access token from Google.')
    access_token = response.json().get('access_token')
    return access_token

def google_get_user_info(access_token: str) -> Dict[str, Any]:
    response = requests.get(
        settings.GOOGLE_USER_INFO_URL,
        params={'access_token': access_token}
    )
    if not response.ok:
        raise ValidationError('Failed to obtain user info from Google.')
    return response.json()

def create_user_and_token(user_data: Dict[str, Any]) -> Dict[str, Any]:
    User = get_user_model()
    user, created = User.objects.get_or_create(
        email=user_data['email'],
        defaults={
            'username': user_data.get('username', user_data['email']),
            'first_name': user_data.get('first_name', user_data.get('given_name', '')),
            'last_name': user_data.get('last_name', user_data.get('family_name', '')),
            'avatar_url': user_data.get('avatar_url', ''),
        }
    )
    # Issue JWT using SimpleJWT
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'avatar_url': getattr(user, 'avatar_url', ''),
            'first_name': user.first_name,
            'last_name': user.last_name,
        }
    }
