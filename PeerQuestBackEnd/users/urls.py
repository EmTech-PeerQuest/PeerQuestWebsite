from django.urls import path
<<<<<<< HEAD
from .views import (
    CurrentUserView,
    UpdateProfileView,         # <-- corrected name
    PublicProfileView,
    RegisterUserView           # <-- added import for registration view
)

urlpatterns = [
    # Authenticated user endpoints
    path('me/', CurrentUserView.as_view(), name='user-detail'),
    path('me/update/', UpdateProfileView.as_view(), name='user-update'),  # <-- corrected class

    # Public profile view by username
    path('profile/<str:username>/', PublicProfileView.as_view(), name='public-profile'),

    # Registration endpoint
    path('register/', RegisterUserView.as_view(), name='user-register'),
=======
from .views import UserProfileView, RegisterView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("profile/", UserProfileView.as_view(), name="profile"),
>>>>>>> origin/dev_Esteron/AuthProfile
]
