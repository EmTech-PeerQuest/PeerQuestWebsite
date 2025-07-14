from pathlib import Path
import os
from dotenv import load_dotenv
from corsheaders.defaults import default_headers
from datetime import timedelta # Moved import to top for consistency

# Load environment variables from .env file
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'your-secret-key' # IMPORTANT: Change this to a strong, random key in production!
DEBUG = True

ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    'testserver',
    'backend',
    'peerquestadmin.up.railway.app',
    'www.peerquestadmin.up.railway.app',
    "peerquest.up.railway.app",   # ✅ Add this
    "www.peerquest.up.railway.app",
]

# Installed Apps
INSTALLED_APPS = [
    'daphne',  # Add Daphne at the top for WebSocket support
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Django Channels
    'channels', 

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
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.locale.LocaleMiddleware',
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


# Channels/ASGI Configuration
# This specifies the entry point for Django Channels
WSGI_APPLICATION = 'core.wsgi.application' # Standard WSGI for HTTP requests
ASGI_APPLICATION = 'core.asgi.application'

# Channel Layers for WebSocket support (using in-memory for development)
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer'
    }
}

# For production with Redis:
# CHANNEL_LAYERS = {
#     'default': {
#         'BACKEND': 'channels_redis.core.RedisChannelLayer',
#         'CONFIG': {
#             "hosts": [('127.0.0.1', 6379)],
#         },
#     },
# }


# --- Railway/Docker Compose Production-Ready Channel Layers & Celery/Database Config ---
import dj_database_url

# Redis/Channels config (use REDIS_URL if set, fallback to Docker Compose default)
REDIS_URL = os.environ.get('REDIS_URL', 'redis://redis:6379/0')
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [REDIS_URL],
        },
    },
}

# Celery config (use REDIS_URL if set)
CELERY_BROKER_URL = REDIS_URL

# Database config (use DATABASE_URL if set, fallback to Docker Compose/MySQL env vars)
DATABASE_URL = os.environ.get('DATABASE_URL')
if DATABASE_URL:
    DATABASES = {
        'default': dj_database_url.parse(DATABASE_URL, conn_max_age=600, ssl_require=False)
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': os.environ.get('MYSQLDATABASE', 'railway'),
            'USER': os.environ.get('MYSQLUSER', 'root'),
            'PASSWORD': os.environ.get('MYSQLPASSWORD'),
            'HOST': os.environ.get('MYSQLHOST', 'mysql.railway.internal'),
            'PORT': os.environ.get('MYSQLPORT', '3306'),
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
TIME_ZONE = 'Asia/Manila' # Correct timezone for your location
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

# Static and Media Files Configuration
STATIC_URL = '/static/'
STATICFILES_DIRS = [BASE_DIR / "static"] # Directory for collectstatic to gather static files from
STATIC_ROOT = BASE_DIR / "staticfiles" # Where 'collectstatic' will put all static files

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
    'django.contrib.auth.backends.ModelBackend', # Default Django ModelBackend
)


# DRF Settings - JWT Authentication only, no session redirects for APIs
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": (
        "common.not_banned_permission.NotBannedPermission",
    ),
    'EXCEPTION_HANDLER': 'core.exception_handler.custom_exception_handler',
    "DEFAULT_FILTER_BACKENDS": ( # Add if you plan to use django-filter extensively
        "django_filters.rest_framework.DjangoFilterBackend",
    ),
    'UNAUTHENTICATED_USER': None,
    'UNAUTHENTICATED_TOKEN': None,
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
    "http://localhost:8000",  # Add backend URL for WebSocket testing
    "http://127.0.0.1:8000",
    "https://peerquestadmin.up.railway.app",
    "https://www.peerquestadmin.up.railway.app",
    "https://peerquest.up.railway.app",   # ✅ Add this
    "https://www.peerquest.up.railway.app",
]
CORS_ALLOW_HEADERS = list(default_headers) + [
    'X-Requested-With',
    'authorization',
    'cache-control',
    'pragma',
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
    # Add any custom headers your backend might send that frontend needs to read
]

# Explicitly disable CORS_ALLOW_ALL_ORIGINS if you are listing allowed origins
CORS_ALLOW_ALL_ORIGINS = False 

# Optional: disable token model warnings (if you don't use Django Rest Auth Token models)
DJRESTAUTH_TOKEN_MODEL = None

# Default primary key type for models introduced in Django 3.2+
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# OAuth2 Provider models (fixes makemigrations error)
OAUTH2_PROVIDER_ACCESS_TOKEN_MODEL = 'oauth2_provider.AccessToken'
OAUTH2_PROVIDER_APPLICATION_MODEL = 'oauth2_provider.Application'
OAUTH2_PROVIDER_ID_TOKEN_MODEL = 'oauth2_provider.IDToken'
OAUTH2_PROVIDER_GRANT_MODEL = 'oauth2_provider.Grant'
OAUTH2_PROVIDER_REFRESH_TOKEN_MODEL = 'oauth2_provider.RefreshToken'

# CSRF Trusted Origins for frontend (useful for AJAX requests from different origins)
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://peerquestadmin.up.railway.app",
    "https://peerquest.up.railway.app",   
    "https://www.peerquest.up.railway.app",
]

# Session and CSRF cookie settings for cross-origin authentication
# IMPORTANT: Adjust SESSION_COOKIE_SECURE and CSRF_COOKIE_SECURE to True in production with HTTPS!
SESSION_COOKIE_SAMESITE = "Lax" 
SESSION_COOKIE_SECURE = False
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
