from pathlib import Path
import os
from dotenv import load_dotenv
from corsheaders.defaults import default_headers

# Load environment variables from .env file
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'your-secret-key'
DEBUG = True
ALLOWED_HOSTS = ['localhost', '127.0.0.1', 'testserver']

# Installed Apps
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # OAuth2 and social auth
    'oauth2_provider',
    'social_django',
    'drf_social_oauth2',
    
    'quests.apps.QuestsConfig',
    'drf_yasg',
    'users',
    'guilds',
    'notifications',
    'messaging',
    'applications',
    'xp',
    'payments',
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_filters',
    'transactions',
]

# Middleware
# Middleware order is important: Security first, then session, then CORS, then common/csrf/auth, then JWT last
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.locale.LocaleMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'users.token_middleware.TokenBlacklistMiddleware',
    'users.middleware.JWTAuthMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'users.email_verification_middleware.EmailVerificationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# URL Configuration
ROOT_URLCONF = 'core.urls'

# Templates
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'

# Database (SQLite for dev)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Enhanced Password validation with superadmin exemption
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'users.password_validators.EnhancedMinimumLengthValidator',
        'OPTIONS': {
            'min_length': 12,
            'exempt_superadmin': True,
        }
    },
    {
        'NAME': 'users.password_validators.ComplexityValidator',
        'OPTIONS': {
            'require_uppercase': True,
            'require_lowercase': True,
            'require_numbers': True,
            'require_symbols': True,
            'exempt_superadmin': True,
        }
    },
    {
        'NAME': 'users.password_validators.PasswordHistoryValidator',
        'OPTIONS': {
            'history_count': 5,
            'exempt_superadmin': True,
        }
    },
    {
        'NAME': 'users.password_validators.PersonalInfoValidator',
        'OPTIONS': {
            'exempt_superadmin': True,
        }
    },
    {
        'NAME': 'users.password_validators.SequentialCharacterValidator',
        'OPTIONS': {
            'max_sequential': 3,
            'exempt_superadmin': True,
        }
    },
    # {
    #     'NAME': 'users.password_validators.CommonPasswordValidatorEnhanced',
    #     'OPTIONS': {
    #         'exempt_superadmin': True,
    #         'password_list_path': str(BASE_DIR / 'users' / 'common-passwords.txt.gz'),
    #     }
    # },
    # Keep the original Django validators as fallback
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 8,
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Manila'
USE_I18N = True
USE_L10N = True
USE_TZ = True

# Supported languages
LANGUAGES = [
    ('en', 'English'),
    ('es', 'Español'),
    ('fr', 'Français'),
    ('de', 'Deutsch'),
    ('ja', '日本語'),
]

# Locale paths for Django translations
LOCALE_PATHS = [
    BASE_DIR / 'locale',
]

# Static and Media
STATIC_URL = 'static/'
STATICFILES_DIRS = [BASE_DIR / "static"]
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Google OAuth2 Configuration
GOOGLE_OAUTH2_CLIENT_ID = os.environ.get('GOOGLE_OAUTH2_CLIENT_ID')
GOOGLE_OAUTH2_CLIENT_SECRET = os.environ.get('GOOGLE_OAUTH2_CLIENT_SECRET')
GOOGLE_ACCESS_TOKEN_OBTAIN_URL = 'https://oauth2.googleapis.com/token'
GOOGLE_USER_INFO_URL = 'https://www.googleapis.com/oauth2/v1/userinfo'

# Additional scopes for birthday and gender (if user consents)
GOOGLE_OAUTH2_SCOPES = [
    'openid',
    'email',
    'profile',
    'https://www.googleapis.com/auth/user.birthday.read',
    'https://www.googleapis.com/auth/user.gender.read',
]

# Authentication backends
AUTHENTICATION_BACKENDS = (
    'django.contrib.auth.backends.ModelBackend',              # Default Django
)


# DRF Settings - Session Authentication only
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": (
        "common.not_banned_permission.NotBannedPermission",
    ),
    'EXCEPTION_HANDLER': 'core.exception_handler.custom_exception_handler',
}

AUTH_USER_MODEL = "users.user"

from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'UPDATE_LAST_LOGIN': True,
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}


# CORS
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3002",
    "http://localhost:3003",
    "http://127.0.0.1:3003",
]
CORS_ALLOW_HEADERS = list(default_headers) + [
    'X-Requested-With',
    'Authorization',
    'Cache-Control',
    'Pragma',
]
CORS_ALLOW_METHODS = [
    "DELETE",
    "GET",
    "OPTIONS",
    "PATCH",
    "POST",
    "PUT",
]
CORS_EXPOSE_HEADERS = [
    'Content-Type',
    'X-CSRFToken',
]

# Add CORS_ALLOW_ALL_ORIGINS = False for explicitness
CORS_ALLOW_ALL_ORIGINS = False

# Optional: disable token model warnings
DJRESTAUTH_TOKEN_MODEL = None

# Default primary key type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# OAuth2 Provider models (fixes makemigrations error)
OAUTH2_PROVIDER_ACCESS_TOKEN_MODEL = 'oauth2_provider.AccessToken'
OAUTH2_PROVIDER_APPLICATION_MODEL = 'oauth2_provider.Application'
OAUTH2_PROVIDER_ID_TOKEN_MODEL = 'oauth2_provider.IDToken'
OAUTH2_PROVIDER_GRANT_MODEL = 'oauth2_provider.Grant'
OAUTH2_PROVIDER_REFRESH_TOKEN_MODEL = 'oauth2_provider.RefreshToken'

# Add CSRF trusted origins for frontend
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Session cookie settings for cross-origin authentication
SESSION_COOKIE_SAMESITE = "Lax"  # Use "None" if using HTTPS and cross-site
SESSION_COOKIE_SECURE = False     # Set to True if using HTTPS
CSRF_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SECURE = False

# Email settings - Use environment variables for flexibility
EMAIL_BACKEND = os.environ.get('EMAIL_BACKEND', 'django.core.mail.backends.smtp.EmailBackend')
EMAIL_HOST = os.environ.get('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.environ.get('EMAIL_PORT', '587'))
EMAIL_USE_TLS = os.environ.get('EMAIL_USE_TLS', 'True').lower() == 'true'
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD')

# Development alternatives (uncomment one if needed):
# EMAIL_BACKEND = 'django.core.mail.backends.filebased.EmailBackend'  # Saves emails to files
# EMAIL_FILE_PATH = BASE_DIR / 'sent_emails'  # Directory to save emails
# EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'  # Shows emails in console

DEFAULT_FROM_EMAIL = 'PeerQuest <noreply@peerquest.com>'
FRONTEND_URL = 'http://localhost:3000'  # Frontend URL for verification links
