from django.urls import path
from .views import UserProfileView, RegisterView, GoogleLoginCallbackView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("profile/", UserProfileView.as_view(), name="profile"),
    path("google-login-callback/", GoogleLoginCallbackView.as_view(), name="google-login-callback"),
]
