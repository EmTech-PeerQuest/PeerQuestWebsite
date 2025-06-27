from django.contrib import admin
from django.utils.html import format_html
from .models import Quest, QuestCategory, QuestParticipant, QuestSubmission


@admin.register(QuestCategory)
class QuestCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'description', 'created_at']
    search_fields = ['name']
    ordering = ['name']


@admin.register(Quest)
class QuestAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'creator', 'status', 'difficulty', 'category', 
        'xp_reward', 'gold_reward', 'participant_count', 'created_at', 'due_date', 'deadline_status_display', 'completed_at'
    ]
    list_filter = ['status', 'difficulty', 'category', 'created_at']
    search_fields = ['title', 'description', 'creator__username']
    readonly_fields = ['slug', 'created_at', 'updated_at', 'participant_count', 'completed_at', 'xp_reward']
    prepopulated_fields = {}  # We handle slug generation in the model
    actions = ['update_xp_rewards_by_difficulty']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description', 'category')
        }),
        ('Quest Settings', {
            'fields': ('difficulty', 'status', 'xp_reward', 'gold_reward', 'estimated_time', 'max_participants'),
            'description': 'XP reward is automatically set based on difficulty: Easy=50 XP, Medium=75 XP, Hard=150 XP'
        }),
        ('Creator & Participants', {
            'fields': ('creator', 'participant_count')
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
    list_display = ['user', 'quest', 'status', 'joined_at', 'completed_at']
    list_filter = ['status', 'joined_at', 'quest__status']
    search_fields = ['user__username', 'quest__title']
    readonly_fields = ['joined_at']
    
    fieldsets = (
        ('Participation Info', {
            'fields': ('quest', 'user', 'status')
        }),
        ('Progress', {
            'fields': ('progress_notes', 'joined_at', 'completed_at')
        })
    )


@admin.register(QuestSubmission)
class QuestSubmissionAdmin(admin.ModelAdmin):
    list_display = [
        'quest_participant', 'status', 'submitted_at', 
        'reviewed_at', 'reviewed_by'
    ]
    list_filter = ['status', 'submitted_at', 'reviewed_at']
    search_fields = [
        'quest_participant__user__username', 
        'quest_participant__quest__title'
    ]
    readonly_fields = ['submitted_at']
    
    fieldsets = (
        ('Submission Info', {
            'fields': ('quest_participant', 'submission_text', 'submission_files')
        }),
        ('Review', {
            'fields': ('status', 'feedback', 'reviewed_by', 'reviewed_at')
        }),
        ('Timestamps', {
            'fields': ('submitted_at',),
            'classes': ('collapse',)
        })
    )
