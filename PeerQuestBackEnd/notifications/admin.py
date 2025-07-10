from django.contrib import admin
from .models import Notification

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("user", "notif_type", "title", "read", "created_at")
    list_filter = ("notif_type", "read", "created_at")
    search_fields = ("title", "message", "user__username", "quest_title")
