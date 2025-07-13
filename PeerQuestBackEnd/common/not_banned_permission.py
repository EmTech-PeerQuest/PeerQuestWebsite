from rest_framework.permissions import BasePermission
from django.urls import resolve

class NotBannedPermission(BasePermission):
    """
    Deny access to banned users except for allowed endpoints (login, logout, ban appeal).
    """
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return True  # Let authentication handle it
        # Allow ban appeal and logout endpoints (adjust as needed)
        allowed_names = [
            'banappeal-list',  # DRF view name for ban appeal
            'banappeal-create',
            'logout',
            'login',
        ]
        try:
            match = resolve(request.path)
            if match.url_name in allowed_names:
                return True
        except Exception:
            pass
        if getattr(user, 'is_banned', False):
            return False
        return True
