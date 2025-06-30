from django.urls import path
from .views import (
    CurrentUserView,
    UpdateProfileView,
    PublicProfileView,
    RegisterUserView,
    UserProfileView,
    RegisterView
)

urlpatterns = [
    # Authenticated user endpoints
    path('me/', CurrentUserView.as_view(), name='user-detail'),
    path('me/update/', UpdateProfileView.as_view(), name='user-update'),

    # Public profile view by username
    path('profile/<str:username>/', PublicProfileView.as_view(), name='public-profile'),

    # Registration endpoint
    path('register/', RegisterUserView.as_view(), name='user-register'),
    # Additional endpoints from other branch
    path("register/", RegisterView.as_view(), name="register"),
    path("profile/", UserProfileView.as_view(), name="profile"),
]
