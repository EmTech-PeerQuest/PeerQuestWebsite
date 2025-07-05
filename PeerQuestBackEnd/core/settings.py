from pathlib import Path
import os
from corsheaders.defaults import default_headers

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
    'drf_yasg',

    # Your apps
    'users',
    'quests',
    'applications',
    'xp',
    'guilds',
    'transactions',

    # DRF and tools
    'rest_framework',
    'corsheaders',
    'django_filters',
]

# Middleware
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
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

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
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

# Static and Media
STATIC_URL = 'static/'
STATICFILES_DIRS = [BASE_DIR / "static"]
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Authentication backends
AUTHENTICATION_BACKENDS = (
    'django.contrib.auth.backends.ModelBackend',              # Default Django
)

# DRF Settings - Session Authentication only
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.AllowAny",  # Or IsAuthenticated for protected endpoints
    ],
    'EXCEPTION_HANDLER': 'core.exception_handler.custom_exception_handler',
}

AUTH_USER_MODEL = "users.User"

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
