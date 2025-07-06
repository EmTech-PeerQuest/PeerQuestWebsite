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
    # First get basic user info from Google OAuth2
    response = requests.get(
        settings.GOOGLE_USER_INFO_URL,
        params={'access_token': access_token}
    )
    if not response.ok:
        raise ValidationError('Failed to obtain user info from Google.')
    
    user_data = response.json()
    
    # Try to get additional user data from People API (birthday, gender)
    try:
        people_response = requests.get(
            'https://people.googleapis.com/v1/people/me',
            params={
                'personFields': 'birthdays,genders',
                'access_token': access_token
            }
        )
        
        if people_response.ok:
            people_data = people_response.json()
            
            # Extract birthday if available
            if 'birthdays' in people_data:
                for birthday in people_data['birthdays']:
                    if birthday.get('metadata', {}).get('primary'):
                        date_info = birthday.get('date', {})
                        if all(k in date_info for k in ['year', 'month', 'day']):
                            user_data['birthday'] = f"{date_info['year']}-{date_info['month']:02d}-{date_info['day']:02d}"
                        break
            
            # Extract gender if available
            if 'genders' in people_data:
                for gender in people_data['genders']:
                    if gender.get('metadata', {}).get('primary'):
                        gender_value = gender.get('value', '').lower()
                        if gender_value in ['male', 'female']:
                            user_data['gender'] = gender_value
                        break
                        
    except Exception as e:
        # If People API fails, just continue with basic user data
        print(f"People API request failed: {e}")
    
    return user_data

def create_user_and_token(user_data: Dict[str, Any]) -> Dict[str, Any]:
    User = get_user_model()
    
    # Prepare user defaults including birthday and gender if available
    user_defaults = {
        'username': user_data.get('username', user_data['email']),
        'first_name': user_data.get('first_name', user_data.get('given_name', '')),
        'last_name': user_data.get('last_name', user_data.get('family_name', '')),
        'avatar_url': user_data.get('avatar_url', ''),
        'email_verified': True,  # Google users are already email-verified
    }
    
    # Add birthday if available
    if 'birthday' in user_data:
        user_defaults['birthday'] = user_data['birthday']
    
    # Add gender if available
    if 'gender' in user_data:
        user_defaults['gender'] = user_data['gender']
    
    user, created = User.objects.get_or_create(
        email=user_data['email'],
        defaults=user_defaults
    )
    
    # If user already exists, update with new data if available
    if not created:
        updated = False
        # Ensure email is verified for Google users
        if not user.email_verified:
            user.email_verified = True
            updated = True
        if 'birthday' in user_data and not user.birthday:
            user.birthday = user_data['birthday']
            updated = True
        if 'gender' in user_data and not user.gender:
            user.gender = user_data['gender']
            updated = True
        if updated:
            user.save()
    
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
            'birthday': getattr(user, 'birthday', None),
            'gender': getattr(user, 'gender', ''),
        }
    }
