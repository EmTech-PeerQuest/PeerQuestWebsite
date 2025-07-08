from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, BanAppeal, BanAppealFile
# BanAppeal admin registration
@admin.register(BanAppeal)
class BanAppealAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'created_at', 'reviewed', 'review_decision', 'reviewed_by', 'reviewed_at')
    list_filter = ('reviewed', 'review_decision', 'created_at')
    search_fields = ('user__username', 'user__email', 'message')
    date_hierarchy = 'created_at'
    readonly_fields = ('created_at',)

# BanAppealFile admin registration (optional, for file management)
@admin.register(BanAppealFile)
class BanAppealFileAdmin(admin.ModelAdmin):
    list_display = ('id', 'appeal', 'file', 'uploaded_at')
    list_filter = ('uploaded_at',)
    search_fields = ('appeal__user__username', 'file')
    date_hierarchy = 'uploaded_at'
    readonly_fields = ('uploaded_at',)
from django.contrib import messages

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    model = User
    list_display = ('email', 'username', 'is_staff', 'is_active', 'is_banned', 'ban_reason', 'ban_expires_at', 'level')
    list_filter = ('is_staff', 'is_active', 'level')
    search_fields = ('email', 'username')
    ordering = ('email',)

    fieldsets = (
        (None, {'fields': ('email', 'username', 'password')}),
        ('Permissions', {'fields': ('is_staff', 'is_active', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
        ('Gamification', {'fields': ('xp', 'level', 'avatar')}),
        ('Ban Info', {'fields': ('is_banned', 'ban_reason', 'ban_expires_at')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'password1', 'password2', 'is_staff', 'is_active')}
        ),
    )

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser or request.user.is_staff

    def has_module_permission(self, request):
        # Ensure the Users module is always visible
        return True

    def has_view_permission(self, request, obj=None):
        return True

    def has_change_permission(self, request, obj=None):
        return request.user.is_superuser or request.user.is_staff

    def has_add_permission(self, request):
        return request.user.is_superuser or request.user.is_staff

# To add CRUD for other apps, import and register their models here when they exist.
