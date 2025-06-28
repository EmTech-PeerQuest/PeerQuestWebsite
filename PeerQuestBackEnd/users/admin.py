from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    model = User
    list_display = ('email', 'username', 'is_staff', 'is_active', 'level')
    list_filter = ('is_staff', 'is_active', 'level')
    search_fields = ('email', 'username')
    ordering = ('email',)

    fieldsets = (
        (None, {'fields': ('email', 'username', 'password')}),
        ('Permissions', {'fields': ('is_staff', 'is_active', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
        ('Gamification', {'fields': ('xp', 'level', 'avatar')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'password1', 'password2', 'is_staff', 'is_active')}
        ),
    )

    actions = ['delete_selected']

    def has_delete_permission(self, request, obj=None):
        # Allow admin users to delete any user
        return request.user.is_superuser or request.user.is_staff

    def get_actions(self, request):
        actions = super().get_actions(request)
        if self.has_delete_permission(request):
            return actions
        # Remove delete_selected if not allowed
        if 'delete_selected' in actions:
            del actions['delete_selected']
        return actions

# To add CRUD for other apps, import and register their models here when they exist.
