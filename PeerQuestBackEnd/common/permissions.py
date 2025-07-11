from rest_framework import permissions
from rest_framework.permissions import BasePermission

class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object or admin users to access it
    """
    def has_object_permission(self, request, view, obj):
        # Admin permissions - can do anything
        if request.user.is_staff:
            return True
            
        # Owner permissions - can only access their own objects
        # Check if the object has a user attribute that matches the requesting user
        return hasattr(obj, 'user') and obj.user == request.user

class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow admin users to modify objects
    """
    def has_permission(self, request, view):
        # Allow all read permissions
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Require admin for write permissions
        return request.user.is_staff

class IsAdminUser(permissions.BasePermission):
    """
    Custom permission to only allow admin users
    """
    def has_permission(self, request, view):
        return request.user.is_staff

class IsSuperUser(BasePermission):
    """Allows access only to superusers."""
    def has_permission(self, request, view):
        return bool(request.user and getattr(request.user, 'is_superuser', False))
