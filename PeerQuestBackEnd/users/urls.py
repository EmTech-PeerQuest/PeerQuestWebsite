from django.urls import path
from .views import (
    UserProfileView, RegisterView, GoogleLoginCallbackView, 
    UserInfoSettingsView, PasswordChangeView, EmailVerificationView, 
    ResendVerificationView, PasswordResetView, PasswordResetConfirmView
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("profile/", UserProfileView.as_view(), name="profile"),
    path("google-login-callback/", GoogleLoginCallbackView.as_view(), name="google-login-callback"),
    path("settings/", UserInfoSettingsView.as_view(), name="user-settings"),
    path("change-password/", PasswordChangeView.as_view(), name="change-password"),
    path("verify-email/", EmailVerificationView.as_view(), name="verify-email"),
    path("resend-verification/", ResendVerificationView.as_view(), name="resend-verification"),
    path("password-reset/", PasswordResetView.as_view(), name="password-reset"),
    path("password-reset-confirm/", PasswordResetConfirmView.as_view(), name="password-reset-confirm"),
]
