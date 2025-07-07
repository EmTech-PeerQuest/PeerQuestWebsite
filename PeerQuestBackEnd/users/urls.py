from django.urls import path
from .views import (
    UserProfileView, RegisterView, GoogleLoginCallbackView, 
    UserInfoSettingsView, PasswordChangeView, EmailVerificationView, 
    ResendVerificationView, PasswordResetView, PasswordResetConfirmView,
    LogoutView, LogoutAllView, UserSessionsView, RevokeSessionView,
    PasswordStrengthCheckView, UserSearchView, SkillsListView,
    UserSkillsView, UserListForFrontendView
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
    path("password-strength-check/", PasswordStrengthCheckView.as_view(), name="password-strength-check"),
    path("search/", UserSearchView.as_view(), name="user-search"),
    
    # Skills management
    path("skills/", SkillsListView.as_view(), name="skills-list"),
    path("skills/my-skills/", UserSkillsView.as_view(), name="user-skills"),
    # path("skills/recommendations/", SkillRecommendationsView.as_view(), name="skill-recommendations"),
    
    # Token/Session management
    path("logout/", LogoutView.as_view(), name="logout"),
    path("logout-all/", LogoutAllView.as_view(), name="logout-all"),
    path("sessions/", UserSessionsView.as_view(), name="user-sessions"),
    path("revoke-session/", RevokeSessionView.as_view(), name="revoke-session"),

    # PeerQuest frontend user list endpoint
    path("api/users/", UserListForFrontendView.as_view(), name="frontend-user-list"),
]
