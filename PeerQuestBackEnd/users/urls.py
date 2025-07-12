from django.urls import path
from .views import (
    UserProfileView, RegisterView, GoogleLoginCallbackView, 
    UserInfoSettingsView, PasswordChangeView, EmailVerificationView, 
    ResendVerificationView, PasswordResetView, PasswordResetConfirmView,
    LogoutView, LogoutAllView, UserSessionsView, RevokeSessionView,
    PasswordStrengthCheckView, UserSearchView, SkillsListView,
    UserSkillsView, UserListForFrontendView, UserReportView, QuestReportView,
    CurrentUserView  # <-- Add this import
)
from .admin_views import AdminUserListView, AdminUserBanView, AdminUserUnbanView, AdminUserDeleteView, AdminReportsListView
from .ban_appeal_views import BanAppealSubmitView, BanAppealListView, BanAppealReviewView
from .action_log_views import ActionLogListView
from .ai_chatbot_proxy import AIChatbotProxyView
from .achievement_views import UserAchievementsView  # <-- New import
from .achievement_full_api import UserAchievementsFullView  # <-- New import for full achievements

urlpatterns = [
    # Authenticated user endpoints
    path('me/', CurrentUserView.as_view(), name='user-detail'),
    # path('me/update/', UpdateProfileView.as_view(), name='user-update'),  # Commented out, use UserProfileView for updates

    # Public profile view by username
    # path('profile/<str:username>/', PublicProfileView.as_view(), name='public-profile'),  # Commented out, not implemented

    # Registration endpoint
    # path('register/', RegisterUserView.as_view(), name='user-register'),  # Commented out, not implemented
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
    # User Report API
    path("user-report/", UserReportView.as_view(), name="user-report"),
    path("quest-report/", QuestReportView.as_view(), name="quest-report"),
    # Admin Panel API
    path("admin/users/", AdminUserListView.as_view(), name="admin-user-list"),
    path("admin/users/<uuid:user_id>/ban/", AdminUserBanView.as_view(), name="admin-user-ban"),
    path("admin/users/<uuid:user_id>/unban/", AdminUserUnbanView.as_view(), name="admin-user-unban"),
    path("admin/users/<uuid:user_id>/delete/", AdminUserDeleteView.as_view(), name="admin-user-delete"),
    path("admin/reports/", AdminReportsListView.as_view(), name="admin-reports-list"),
    path("admin/reports/<int:report_id>/resolve/", AdminReportsListView.as_view(), name="admin-report-resolve"),
    # Ban Appeal API
    path("ban-appeal/submit/", BanAppealSubmitView.as_view(), name="ban-appeal-submit"),
    path("ban-appeal/list/", BanAppealListView.as_view(), name="ban-appeal-list"),
    path("ban-appeals/", BanAppealListView.as_view(), name="ban-appeals-list-alias"),
    path("ban-appeal/<int:appeal_id>/review/", BanAppealReviewView.as_view(), name="ban-appeal-review"),
    # Action Log API
    path("action-log/", ActionLogListView.as_view(), name="action-log-list"),
    # AI Chatbot API (Proxy)
    path("ai-chat/", AIChatbotProxyView.as_view(), name="ai-chatbot-proxy"),
    # User Achievements API
    path('<uuid:user_id>/achievements/', UserAchievementsView.as_view(), name='user-achievements'),
    path('<uuid:user_id>/achievements-full/', UserAchievementsFullView.as_view(), name='user-achievements-full'),  # <-- New endpoint for full achievements
]