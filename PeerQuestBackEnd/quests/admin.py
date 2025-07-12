from django.contrib import admin
from django.utils.html import format_html
from django import forms
from .models import Quest, QuestCategory, QuestParticipant, QuestSubmission, QuestSubmissionAttempt, QuestCompletionLog


class QuestAdminForm(forms.ModelForm):
    description = forms.CharField(
        max_length=2000,
        widget=forms.Textarea(attrs={
            'rows': 8, 
            'cols': 80,
            'placeholder': 'Enter a detailed description of the quest... (Max 2000 characters)'
        }),
        help_text='Provide a comprehensive description of what needs to be accomplished in this quest. Maximum 2000 characters.'
    )
    
    class Meta:
        model = Quest
        fields = '__all__'


@admin.register(QuestCategory)
class QuestCategoryAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'description_preview', 'quest_count', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['name']
    readonly_fields = ['created_at', 'quest_count', 'category_stats']
    list_per_page = 50

    fieldsets = (
        ('Category Information', {
            'fields': ('name', 'description')
        }),
        ('Statistics', {
            'fields': ('quest_count', 'category_stats'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        })
    )

    def description_preview(self, obj):
        if obj.description:
            return obj.description[:50] + '...' if len(obj.description) > 50 else obj.description
        return 'No description'
    description_preview.short_description = 'Description Preview'

    def quest_count(self, obj):
        return obj.quest_set.count()
    quest_count.short_description = 'Total Quests'

    def category_stats(self, obj):
        quests = obj.quest_set.all()
        total_quests = quests.count()
        open_quests = quests.filter(status='open').count()
        in_progress_quests = quests.filter(status='in-progress').count()
        completed_quests = quests.filter(status='completed').count()
        
        return format_html("""
            <strong>Total Quests:</strong> {}<br>
            <strong>Open:</strong> {}<br>
            <strong>In Progress:</strong> {}<br>
            <strong>Completed:</strong> {}
        """, total_quests, open_quests, in_progress_quests, completed_quests)
    category_stats.short_description = 'Category Statistics'

    def has_delete_permission(self, request, obj=None):
        if request.user.is_superuser:
            return True
        return super().has_delete_permission(request, obj)


@admin.register(Quest)
class QuestAdmin(admin.ModelAdmin):
    form = QuestAdminForm
    
    # Display all important fields in list view
    list_display = [
        'id', 'title', 'description_preview', 'creator', 'creator_email', 'assigned_to_display', 'status', 'difficulty', 
        'category', 'xp_reward', 'gold_reward', 'commission_fee', 'participant_count',
        'applications_count', 'created_at', 'due_date', 'deadline_status_display', 
        'updated_at', 'completed_at'
    ]
    list_filter = [
        'status', 'difficulty', 'category', 'assigned_to', 'created_at', 
        'due_date', 'completed_at'
    ]
    search_fields = [
        'title', 'description', 'creator__username', 'creator__email',
        'assigned_to__username', 'requirements', 'resources'
    ]
    readonly_fields = [
        'slug', 'created_at', 'updated_at', 'participant_count', 'completed_at', 
        'xp_reward', 'applications_count', 'participant_details', 'application_details'
    ]
    prepopulated_fields = {}  # We handle slug generation in the model
    actions = ['update_xp_rewards_by_difficulty']
    list_per_page = 50
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description', 'category'),
            'description': 'Core quest information including title and detailed description.'
        }),
        ('Quest Settings', {
            'fields': ('difficulty', 'status', 'xp_reward', 'gold_reward', 'commission_fee'),
            'description': 'XP reward is automatically set based on difficulty: Easy=50 XP, Medium=75 XP, Hard=150 XP'
        }),
        ('Creator & Participants', {
            'fields': ('creator', 'assigned_to', 'participant_count', 'applications_count')
        }),
        ('Participants Details', {
            'fields': ('participant_details',),
            'classes': ('collapse',)
        }),
        ('Applications Details', {
            'fields': ('application_details',),
            'classes': ('collapse',)
        }),
        ('Dates', {
            'fields': ('due_date',)
        }),
        ('Content', {
            'fields': ('requirements', 'resources')
        }),
        ('System Fields', {
            'fields': ('slug', 'created_at', 'updated_at', 'completed_at'),
            'classes': ('collapse',)
        })
    )
    
    def participant_count(self, obj):
        return obj.participant_count
    participant_count.short_description = 'Participants'

    def creator_email(self, obj):
        return obj.creator.email
    creator_email.short_description = 'Creator Email'
    creator_email.admin_order_field = 'creator__email'

    def applications_count(self, obj):
        return obj.applications.count()
    applications_count.short_description = 'Applications'

    def assigned_to_display(self, obj):
        """Display assigned user with additional info"""
        if obj.assigned_to:
            participant = QuestParticipant.objects.filter(quest=obj, user=obj.assigned_to).first()
            if participant:
                status_info = f" ({participant.get_status_display()})"
            else:
                status_info = " (No participant record)"
            return f"{obj.assigned_to.username}{status_info}"
        return "Not assigned"
    assigned_to_display.short_description = 'Assigned To'
    assigned_to_display.admin_order_field = 'assigned_to__username'

    def description_preview(self, obj):
        if obj.description:
            return obj.description[:100] + '...' if len(obj.description) > 100 else obj.description
        return 'No description'
    description_preview.short_description = 'Description Preview'

    def participant_details(self, obj):
        participants = obj.participants.all()
        if not participants.exists():
            return "No participants"
        
        details = "<ul>"
        for participant in participants:
            details += f"<li><strong>{participant.username}</strong> ({participant.email})</li>"
        details += "</ul>"
        return format_html(details)
    participant_details.short_description = 'Participant Details'

    def application_details(self, obj):
        applications = obj.applications.all()
        if not applications.exists():
            return "No applications"
        
        details = "<ul>"
        for app in applications:
            status_color = {
                'pending': 'orange',
                'approved': 'green', 
                'rejected': 'red'
            }.get(app.status, 'black')
            details += f"""<li>
                <strong>{app.applicant.username}</strong> ({app.applicant.email}) - 
                <span style="color: {status_color};">{app.get_status_display()}</span><br>
                Applied: {app.applied_at.strftime('%Y-%m-%d %H:%M')}<br>
                Message: {app.message[:100]}{'...' if len(app.message) > 100 else ''}
            </li>"""
        details += "</ul>"
        return format_html(details)
    application_details.short_description = 'Application Details'

    def deadline_status_display(self, obj):
        return obj.deadline_status
    
    deadline_status_display.short_description = 'Deadline Status'

    def update_xp_rewards_by_difficulty(self, request, queryset):
        """Admin action to update XP rewards for selected quests based on their difficulty"""
        updated_count = 0
        for quest in queryset:
            if quest.difficulty in Quest.DIFFICULTY_XP_MAPPING:
                expected_xp = Quest.DIFFICULTY_XP_MAPPING[quest.difficulty]
                if quest.xp_reward != expected_xp:
                    quest.xp_reward = expected_xp
                    quest.save()
                    updated_count += 1
        
        self.message_user(
            request,
            f"Successfully updated XP rewards for {updated_count} quest(s) based on their difficulty."
        )
    
    update_xp_rewards_by_difficulty.short_description = "Update XP rewards based on difficulty"


@admin.register(QuestParticipant)
class QuestParticipantAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'user', 'user_email', 'quest', 'quest_creator', 'status', 
        'joined_at', 'completed_at', 'progress_summary'
    ]
    list_filter = ['status', 'joined_at', 'quest__status', 'quest__difficulty', 'quest__category']
    search_fields = [
        'user__username', 'user__email', 'quest__title', 'quest__creator__username',
        'progress_notes'
    ]
    readonly_fields = ['joined_at', 'quest_details', 'user_details']
    list_per_page = 50
    date_hierarchy = 'joined_at'
    
    fieldsets = (
        ('Participation Info', {
            'fields': ('quest', 'user', 'status')
        }),
        ('Progress', {
            'fields': ('progress_notes', 'joined_at', 'completed_at')
        }),
        ('Quest Details', {
            'fields': ('quest_details',),
            'classes': ('collapse',)
        }),
        ('User Details', {
            'fields': ('user_details',),
            'classes': ('collapse',)
        })
    )

    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'User Email'
    user_email.admin_order_field = 'user__email'

    def quest_creator(self, obj):
        return obj.quest.creator.username
    quest_creator.short_description = 'Quest Creator'
    quest_creator.admin_order_field = 'quest__creator__username'

    def progress_summary(self, obj):
        if obj.progress_notes:
            return obj.progress_notes[:50] + '...' if len(obj.progress_notes) > 50 else obj.progress_notes
        return 'No progress notes'
    progress_summary.short_description = 'Progress Summary'

    def quest_details(self, obj):
        return format_html("""
            <strong>Title:</strong> {}<br>
            <strong>Creator:</strong> {}<br>
            <strong>Status:</strong> {}<br>
            <strong>Difficulty:</strong> {}<br>
            <strong>XP Reward:</strong> {}<br>
            <strong>Gold Reward:</strong> {}
        """, 
            obj.quest.title,
            obj.quest.creator.username,
            obj.quest.get_status_display(),
            obj.quest.get_difficulty_display(),
            obj.quest.xp_reward,
            obj.quest.gold_reward
        )
    quest_details.short_description = 'Quest Details'

    def user_details(self, obj):
        return format_html("""
            <strong>Username:</strong> {}<br>
            <strong>Email:</strong> {}<br>
            <strong>Date Joined:</strong> {}
        """, 
            obj.user.username,
            obj.user.email,
            obj.user.date_joined.strftime('%Y-%m-%d %H:%M:%S')
        )
    user_details.short_description = 'User Details'


@admin.register(QuestSubmission)
class QuestSubmissionAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'quest_participant', 'participant_user', 'quest_title', 'description', 'link', 'status', 
        'submitted_at', 'reviewed_at', 'reviewed_by', 'submission_files_preview'
    ]
    list_filter = [
        'status', 'submitted_at', 'reviewed_at', 
        'quest_participant__quest__difficulty', 'quest_participant__quest__category'
    ]
    search_fields = [
        'quest_participant__user__username', 'quest_participant__quest__title',
        'description', 'link', 'feedback', 'reviewed_by__username'
    ]
    readonly_fields = ['submitted_at', 'participant_details', 'quest_details']
    list_per_page = 50
    date_hierarchy = 'submitted_at'
    
    fieldsets = (
        ('Submission Info', {
            'fields': ('quest_participant', 'description', 'link', 'submission_files')
        }),
        ('Review', {
            'fields': ('status', 'feedback', 'reviewed_by', 'reviewed_at')
        }),
        ('Participant Details', {
            'fields': ('participant_details',),
            'classes': ('collapse',)
        }),
        ('Quest Details', {
            'fields': ('quest_details',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('submitted_at',),
            'classes': ('collapse',)
        })
    )

    def participant_user(self, obj):
        return obj.quest_participant.user.username
    participant_user.short_description = 'Participant'
    participant_user.admin_order_field = 'quest_participant__user__username'

    def quest_title(self, obj):
        return obj.quest_participant.quest.title
    quest_title.short_description = 'Quest'
    quest_title.admin_order_field = 'quest_participant__quest__title'

    def submission_files_preview(self, obj):
        if obj.submission_files:
            return ', '.join([str(f) for f in obj.submission_files])
        return 'No files uploaded'
    submission_files_preview.short_description = 'Files'

    def participant_details(self, obj):
        return format_html("""
            <strong>Username:</strong> {}<br>
            <strong>Email:</strong> {}<br>
            <strong>Participation Status:</strong> {}<br>
            <strong>Joined Quest:</strong> {}
        """, 
            obj.quest_participant.user.username,
            obj.quest_participant.user.email,
            obj.quest_participant.get_status_display(),
            obj.quest_participant.joined_at.strftime('%Y-%m-%d %H:%M:%S')
        )
    participant_details.short_description = 'Participant Details'

    def quest_details(self, obj):
        return format_html("""
            <strong>Title:</strong> {}<br>
            <strong>Creator:</strong> {}<br>
            <strong>Difficulty:</strong> {}<br>
            <strong>XP Reward:</strong> {}<br>
            <strong>Gold Reward:</strong> {}
        """, 
            obj.quest_participant.quest.title,
            obj.quest_participant.quest.creator.username,
            obj.quest_participant.quest.get_difficulty_display(),
            obj.quest_participant.quest.xp_reward,
            obj.quest_participant.quest.gold_reward
        )
    quest_details.short_description = 'Quest Details'


@admin.register(QuestSubmissionAttempt)
class QuestSubmissionAttemptAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'participant', 'quest', 'user', 'timestamp'
    ]
    search_fields = ['participant__user__username', 'quest__title', 'user__username']
    list_filter = ['quest', 'user', 'timestamp']
    readonly_fields = ['timestamp']
    list_per_page = 50


@admin.register(QuestCompletionLog)
class QuestCompletionLogAdmin(admin.ModelAdmin):
    list_display = ['id', 'quest', 'adventurer', 'xp_earned', 'gold_earned', 'completed_at']
    search_fields = ['quest__title', 'adventurer__username']
    list_filter = ['quest', 'adventurer', 'completed_at']
    readonly_fields = ['completed_at']
    date_hierarchy = 'completed_at'
    list_per_page = 50
