from django.urls import path
from .views import (
    CurrentUserView,
    UpdateProfileView,
    PublicProfileView,
    RegisterView,
    LoginView,
    LogoutView,
)

urlpatterns = [
    # Authentication endpoints
    path('register/', RegisterView.as_view(), name='user-register'),
    path('login/', LoginView.as_view(), name='user-login'),
    path('logout/', LogoutView.as_view(), name='user-logout'),

    # Authenticated user endpoints
    path('me/', CurrentUserView.as_view(), name='user-detail'),
    path('me/update/', UpdateProfileView.as_view(), name='user-update'),

    # Public profile view by username
    path('profile/<str:username>/', PublicProfileView.as_view(), name='public-profile'),
]
