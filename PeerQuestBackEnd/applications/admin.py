from django.contrib import admin
from django.utils.html import format_html
from .models import Application


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = [
        'applicant', 'quest_title', 'status', 'applied_at', 
        'reviewed_at', 'reviewed_by', 'application_actions'
    ]
    list_filter = ['status', 'applied_at', 'reviewed_at']
    search_fields = [
        'applicant__username', 'quest__title', 'message', 
        'reviewed_by__username'
    ]
    readonly_fields = ['applied_at', 'reviewed_at']
    actions = ['approve_applications', 'reject_applications']

    fieldsets = (
        ('Application Details', {
            'fields': ('quest', 'applicant', 'message', 'status')
        }),
        ('Review Information', {
            'fields': ('reviewed_by', 'reviewed_at')
        }),
        ('Timestamps', {
            'fields': ('applied_at',),
            'classes': ('collapse',)
        })
    )

    def quest_title(self, obj):
        return obj.quest.title
    quest_title.short_description = 'Quest'
    quest_title.admin_order_field = 'quest__title'

    def application_actions(self, obj):
        if obj.status == 'pending':
            return format_html(
                '<span style="color: orange;">⏳ Pending Review</span>'
            )
        elif obj.status == 'approved':
            return format_html(
                '<span style="color: green;">✅ Approved</span>'
            )
        elif obj.status == 'rejected':
            return format_html(
                '<span style="color: red;">❌ Rejected</span>'
            )
        return obj.get_status_display()
    application_actions.short_description = 'Actions'

    def approve_applications(self, request, queryset):
        updated = 0
        for application in queryset.filter(status='pending'):
            application.approve(request.user)
            updated += 1
        
        self.message_user(
            request,
            f'{updated} application(s) were successfully approved.'
        )
    approve_applications.short_description = "Approve selected applications"

    def reject_applications(self, request, queryset):
        updated = 0
        for application in queryset.filter(status='pending'):
            application.reject(request.user)
            updated += 1
        
        self.message_user(
            request,
            f'{updated} application(s) were successfully rejected.'
        )
    reject_applications.short_description = "Reject selected applications"
