from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView
)

from .views import (
    GoogleLoginView,
    UserProfileView,
    UserSkillViewSet,
    UserAchievementViewSet,
    ALLUserProfileView
)
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'skills', UserSkillViewSet, basename='skill')
router.register(r'achievements', UserAchievementViewSet, basename='achievement')

urlpatterns = [
    path('google/', GoogleLoginView.as_view(), name='google_login'),
    path('profile/', UserProfileView.as_view(), name='user_profile'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('allusers/', ALLUserProfileView.as_view(), name='listcreate'),
] + router.urls