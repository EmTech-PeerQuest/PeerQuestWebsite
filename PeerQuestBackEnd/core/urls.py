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
    # Quests and Guilds APIs
    path('api/quests/', include('quests.urls')),
    path('api/guilds/', include('guilds.urls')),

    # API Docs (Swagger + Redoc)
    path('', include('blog.urls', namespace='blog')),
    path('api/', include('blog_api.urls', namespace='blog_api')),
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
    path('user/', include('users.urls')),
    path('api/user/', include('users.urls', namespace='users')),
    path('api/guilds/', include('guilds.urls')),
    path('docs/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    path('schema/', schema_view.without_ui(cache_timeout=0), name='schema-json'),

    # CSRF protection
    path('api/csrf/', ensure_csrf_cookie(csrf)),

    # Test endpoint to verify backend is working
    path('test/', lambda request: JsonResponse({'status': 'Backend is working'}), name='test'),

    # Test Google callback endpoint
    path('test-google/', lambda request: JsonResponse({'status': 'Google callback endpoint accessible'}), name='test-google'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
