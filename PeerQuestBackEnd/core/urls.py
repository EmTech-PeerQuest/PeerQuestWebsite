from django.contrib import admin
from django.urls import path, include
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from django.views.decorators.csrf import ensure_csrf_cookie
from django.http import JsonResponse

from django.utils import timezone
from users.views import GoogleLoginCallbackView, EmailVerifiedTokenObtainPairView
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)
from messaging.views import StartConversationView  # Add this import

schema_view = get_schema_view(
    openapi.Info(
        title="PeerQuest API",
        default_version='v1',
        description="API documentation for PeerQuest platform",
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)


def csrf(request):
    return JsonResponse({'csrfToken': request.META.get('CSRF_COOKIE', '')})

urlpatterns = [
    path('', TemplateView.as_view(template_name="blog/index.html")),
    path('admin/', admin.site.urls),
    # JWT Auth endpoints
    path('api/token/', EmailVerifiedTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),


    # Users app
    path('api/users/', include('users.urls')),
    # Direct Google login callback for /api/google-login-callback/
    path('api/google-login-callback/', GoogleLoginCallbackView.as_view(), name='google-login-callback'),
    
    # Guilds API
    path('api/guilds/', include('guilds.urls')),
    # Applications API
    path('api/', include('applications.urls')),
    # Transactions API
    path('api/transactions/', include('transactions.urls')),

    # Payments API
    path('api/payments/', include('payments.urls')),
    # Quests API
    path('api/quests/', include('quests.urls')),
    # Messaging app
    path('api/messages/', include('messaging.urls')),
    path('api/conversations/', include('messaging.urls')),
    # Start conversation endpoint (to match frontend expectation)
    path('api/conversations/start/', StartConversationView.as_view(), name='start-conversation'),
    # Notifications API
    path('api/notifications/', include('notifications.urls')),

    # API Docs (Swagger + Redoc)
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
    path('docs/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    path('schema/', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    # CSRF protection
    path('api/csrf/', ensure_csrf_cookie(csrf)),
    path("api/conversations/", include("messaging.urls")),

    # Test endpoint to verify backend is working
    path('test/', lambda request: JsonResponse({'status': 'Backend is working'}), name='test'),

    # Test Google callback endpoint
    path('test-google/', lambda request: JsonResponse({'status': 'Google callback endpoint accessible'}), name='test-google'),
    
    # AI Chat endpoint - the route your frontend expects
    path('api/chat/', __import__('users.ai_chatbot_proxy').ai_chatbot_proxy.AIChatbotProxyView.as_view(), name='ai-chat'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)