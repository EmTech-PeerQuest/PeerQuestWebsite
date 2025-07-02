from django.contrib import admin
from django.utils.html import format_html
from .models import Application


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    # Display all important fields in list view
    list_display = [
        'id', 'applicant', 'applicant_email', 'quest_title', 'quest_creator', 
        'status', 'applied_at', 'reviewed_at', 'reviewed_by'
    ]
    list_filter = [
        'status', 'applied_at', 'reviewed_at', 'quest__category', 
        'quest__difficulty', 'quest__status'
    ]
    search_fields = [
        'applicant__username', 'applicant__email', 'quest__title', 
        'reviewed_by__username', 'quest__creator__username'
    ]
    readonly_fields = ['applied_at', 'reviewed_at', 'quest_details', 'applicant_details']
    actions = ['approve_applications', 'reject_applications']
    list_per_page = 50
    date_hierarchy = 'applied_at'
    
    # Show all fields in detail view
    fieldsets = (
        ('Application Details', {
            'fields': ('quest', 'applicant', 'status')
        }),
        ('Quest Information', {
            'fields': ('quest_details',),
            'classes': ('collapse',)
        }),
        ('Applicant Information', {
            'fields': ('applicant_details',),
            'classes': ('collapse',)
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

    def quest_creator(self, obj):
        return obj.quest.creator.username
    quest_creator.short_description = 'Quest Creator'
    quest_creator.admin_order_field = 'quest__creator__username'

    def applicant_email(self, obj):
        return obj.applicant.email
    applicant_email.short_description = 'Applicant Email'
    applicant_email.admin_order_field = 'applicant__email'

    def quest_details(self, obj):
        return format_html("""
            <strong>Title:</strong> {}<br>
            <strong>Creator:</strong> {}<br>
            <strong>Category:</strong> {}<br>
            <strong>Difficulty:</strong> {}<br>
            <strong>Status:</strong> {}<br>
            <strong>XP Reward:</strong> {}<br>
            <strong>Gold Reward:</strong> {}<br>
            <strong>Current Participants:</strong> {}
        """, 
            obj.quest.title,
            obj.quest.creator.username,
            obj.quest.category.name if obj.quest.category else 'No category',
            obj.quest.get_difficulty_display(),
            obj.quest.get_status_display(),
            obj.quest.xp_reward,
            obj.quest.gold_reward,
            obj.quest.participant_count
        )
    quest_details.short_description = 'Quest Details'

    def applicant_details(self, obj):
        return format_html("""
            <strong>Username:</strong> {}<br>
            <strong>Email:</strong> {}<br>
            <strong>First Name:</strong> {}<br>
            <strong>Last Name:</strong> {}<br>
            <strong>Date Joined:</strong> {}
        """, 
            obj.applicant.username,
            obj.applicant.email,
            obj.applicant.first_name or 'Not provided',
            obj.applicant.last_name or 'Not provided',
            obj.applicant.date_joined.strftime('%Y-%m-%d %H:%M:%S')
        )
    applicant_details.short_description = 'Applicant Details'

    def application_actions(self, obj):
        return obj.get_status_display()
    application_actions.short_description = 'Status'

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
