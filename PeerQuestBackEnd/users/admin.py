from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from .models import User
from django.contrib import messages

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    model = User
    list_display = [
        'id', 'email', 'username', 'first_name', 'last_name', 'is_staff', 
        'is_active', 'level', 'experience_points', 'gold_balance', 'quest_stats', 
        'date_joined', 'last_login'
    ]
    list_filter = [
        'is_staff', 'is_active', 'level', 'date_joined', 'last_login',
        'is_superuser'
    ]
    search_fields = ['email', 'username', 'first_name', 'last_name']
    ordering = ['email']
    readonly_fields = [
        'date_joined', 'last_login', 'quest_statistics', 'application_statistics', 
        'participation_statistics'
    ]
    list_per_page = 50
    date_hierarchy = 'date_joined'

    fieldsets = (
        (None, {'fields': ('email', 'username', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name')}),
        ('Permissions', {
            'fields': ('is_staff', 'is_active', 'is_superuser', 'groups', 'user_permissions')
        }),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
        ('Gamification', {'fields': ('experience_points', 'level', 'gold_balance', 'avatar_url')}),
        ('Quest Statistics', {
            'fields': ('quest_statistics',),
            'classes': ('collapse',)
        }),
        ('Application Statistics', {
            'fields': ('application_statistics',),
            'classes': ('collapse',)
        }),
        ('Participation Statistics', {
            'fields': ('participation_statistics',),
            'classes': ('collapse',)
        })
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'password1', 'password2', 'is_staff', 'is_active')}
        ),
    )

    def quest_stats(self, obj):
        created_quests = obj.created_quests.count()
        assigned_quests = obj.assigned_quests.count()
        participated_quests = obj.quest_participations.count()
        return f"Created: {created_quests} | Assigned: {assigned_quests} | Participated: {participated_quests}"
    quest_stats.short_description = 'Quest Stats'

    def quest_statistics(self, obj):
        created_quests = obj.created_quests.all()
        assigned_quests = obj.assigned_quests.all()
        
        total_created = created_quests.count()
        created_open = created_quests.filter(status='open').count()
        created_in_progress = created_quests.filter(status='in-progress').count()
        created_completed = created_quests.filter(status='completed').count()
        
        total_assigned = assigned_quests.count()
        assigned_open = assigned_quests.filter(status='open').count()
        assigned_in_progress = assigned_quests.filter(status='in-progress').count()
        assigned_completed = assigned_quests.filter(status='completed').count()
        
        return format_html("""
            <h4>Created Quests ({})</h4>
            <ul>
                <li>Open: {}</li>
                <li>In Progress: {}</li>
                <li>Completed: {}</li>
            </ul>
            <h4>Assigned Quests ({})</h4>
            <ul>
                <li>Open: {}</li>
                <li>In Progress: {}</li>
                <li>Completed: {}</li>
            </ul>
        """, 
            total_created, created_open, created_in_progress, created_completed,
            total_assigned, assigned_open, assigned_in_progress, assigned_completed
        )
    quest_statistics.short_description = 'Quest Statistics'

    def application_statistics(self, obj):
        applications = obj.quest_applications.all()
        total_applications = applications.count()
        pending_applications = applications.filter(status='pending').count()
        approved_applications = applications.filter(status='approved').count()
        rejected_applications = applications.filter(status='rejected').count()
        
        return format_html("""
            <h4>Applications Submitted ({})</h4>
            <ul>
                <li>Pending: {}</li>
                <li>Approved: {}</li>
                <li>Rejected: {}</li>
            </ul>
        """, 
            total_applications, pending_applications, approved_applications, rejected_applications
        )
    application_statistics.short_description = 'Application Statistics'

    def participation_statistics(self, obj):
        participations = obj.quest_participations.all()
        total_participations = participations.count()
        active_participations = participations.filter(status='active').count()
        completed_participations = participations.filter(status='completed').count()
        
        return format_html("""
            <h4>Quest Participations ({})</h4>
            <ul>
                <li>Active: {}</li>
                <li>Completed: {}</li>
            </ul>
        """, 
            total_participations, active_participations, completed_participations
        )
    participation_statistics.short_description = 'Participation Statistics'

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
