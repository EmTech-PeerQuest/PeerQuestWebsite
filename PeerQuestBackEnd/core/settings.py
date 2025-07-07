from pathlib import Path
import os
from corsheaders.defaults import default_headers
from datetime import timedelta # Moved import to top for consistency

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'your-secret-key' # IMPORTANT: Change this to a strong, random key in production!
DEBUG = True
ALLOWED_HOSTS = ['127.0.0.1', 'localhost'] 

# Installed Apps
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Django Channels
    'channels', 

    # Swagger/DRF API Docs
    'drf_yasg', 
    
    # Your project specific apps
    'messaging',
    'xp',
    'users', # Assuming 'users' app contains your custom User model

    # DRF and related tools
    'rest_framework',
    'corsheaders',
    'django_filters',
    'rest_framework_simplejwt', # Add this for JWT authentication
]

# Middleware
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
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


# Channels/ASGI Configuration
# This specifies the entry point for Django Channels
ASGI_APPLICATION = 'core.asgi.application' 
WSGI_APPLICATION = 'core.wsgi.application' # Standard WSGI for HTTP requests

# Channel Layers (using Redis for development)
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [("127.0.0.1", 6379)], 
        },
    },
}

# Database (SQLite for development)
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
TIME_ZONE = 'Asia/Manila' # Correct timezone for your location
USE_I18N = True
USE_L10N = True # Deprecated in Django 4.0+, USE_TZ covers most cases now. Keep for older versions.
USE_TZ = True # Use timezone-aware datetimes

# Static and Media Files Configuration
STATIC_URL = '/static/'
STATICFILES_DIRS = [BASE_DIR / "static"] # Directory for collectstatic to gather static files from
STATIC_ROOT = BASE_DIR / "staticfiles" # Where 'collectstatic' will put all static files

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media' # Where user-uploaded media files will be stored

# Authentication backends
AUTHENTICATION_BACKENDS = (
    'django.contrib.auth.backends.ModelBackend', # Default Django ModelBackend
)

# Django REST Framework Settings
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        "rest_framework.authentication.SessionAuthentication", # Add SessionAuthentication for browsable API/admin
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.AllowAny", # Adjust this to IsAuthenticated for production APIs
    ],
    "DEFAULT_FILTER_BACKENDS": ( # Add if you plan to use django-filter extensively
        "django_filters.rest_framework.DjangoFilterBackend",
    ),
}

# Custom User Model
AUTH_USER_MODEL = "users.user"

# Django REST Framework Simple JWT Settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True, # Important for better security with refresh tokens
    'UPDATE_LAST_LOGIN': True, # Updates last_login field on user model
    'USER_ID_FIELD': 'id', # Your custom user model likely uses 'id' (UUID)
    'USER_ID_CLAIM': 'user_id', # Claim name in JWT payload for user ID
    
    # Recommended additions for JWT (security/best practices)
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUDIENCE': None,
    'ISSUER': None,
    'JWK_URL': None,
    'LEEWAY': 0,

    'AUTH_HEADER_TYPES': ('Bearer',), # Common practice
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_AUTHENTICATION_RULE': 'rest_framework_simplejwt.authentication.default_user_authentication_rule',

    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    'TOKEN_USER_CLASS': 'rest_framework_simplejwt.models.TokenUser',

    'JTI_CLAIM': 'jti',

    'SLIDING_TOKEN_LIFETIME': timedelta(minutes=5),
    'SLIDING_TOKEN_REFRESH_LIFETIME': timedelta(days=1),
}


# CORS Headers Configuration
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
CORS_ALLOW_HEADERS = list(default_headers) + [
    'X-Requested-With',
    # Add any custom headers your frontend might send (e.g., 'X-Auth-Token', 'x-custom-header')
]
CORS_EXPOSE_HEADERS = [
    'Content-Type',
    'X-CSRFToken',
    # Add any custom headers your backend might send that frontend needs to read
]

# Explicitly disable CORS_ALLOW_ALL_ORIGINS if you are listing allowed origins
CORS_ALLOW_ALL_ORIGINS = False 

# Optional: disable token model warnings (if you don't use Django Rest Auth Token models)
DJRESTAUTH_TOKEN_MODEL = None

# Default primary key type for models introduced in Django 3.2+
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# CSRF Trusted Origins for frontend (useful for AJAX requests from different origins)
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Session and CSRF cookie settings for cross-origin authentication
# IMPORTANT: Adjust SESSION_COOKIE_SECURE and CSRF_COOKIE_SECURE to True in production with HTTPS!
SESSION_COOKIE_SAMESITE = "Lax" 
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SECURE = False

# Prevent Django from appending a slash to URLs that don't have one
# This is often helpful when working with frontends that expect exact API paths.
APPEND_SLASH = False

# --- LOGGING CONFIGURATION (Added/Updated) ---
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
        'channels': { # Dedicated formatter for Channels logs
            'format': '[{levelname}] {asctime} {pathname} {message}',
            'style': '{',
            'datefmt': '%Y-%m-%d %H:%M:%S',
        },
    },
    'handlers': {
        'console': {
            'level': 'DEBUG', # Set to DEBUG to see all log levels in console during development
            'class': 'logging.StreamHandler',
            'formatter': 'verbose'
        },
        # Optional: File handler for persistent logs (uncomment and configure for production)
        # 'file': {
        #     'level': 'INFO', # Adjust level as needed for file output (INFO or WARNING in prod)
        #     'class': 'logging.FileHandler',
        #     'filename': os.path.join(BASE_DIR, 'logs', 'django_channels_debug.log'), # Ensure 'logs' dir exists
        #     'formatter': 'channels',
        # },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO', # General Django logging level
            'propagate': False,
        },
        'messaging.consumers': { # IMPORTANT: Your specific consumer logger
            'handlers': ['console'], # Add 'file' if you enabled it above
            'level': 'DEBUG', # VERY IMPORTANT: Set this to DEBUG to see all your new consumer logs
            'propagate': False,
        },
        'channels': { # Channels internal logs
            'handlers': ['console'],
            'level': 'INFO', # Usually INFO is sufficient for Channels itself
            'propagate': False,
        },
        # You can add loggers for other apps if you want specific log levels for them
        # 'users': {
        #     'handlers': ['console'],
        #     'level': 'INFO',
        #     'propagate': False,
        # },
        # 'xp': {
        #     'handlers': ['console'],
        #     'level': 'INFO',
        #     'propagate': False,
        # },
    },
}