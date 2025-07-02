from django.urls import path
from .views import UserProfileView, RegisterView, LoginView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("profile/", UserProfileView.as_view(), name="profile"),
    path("login/", LoginView.as_view(), name="login"),
]
