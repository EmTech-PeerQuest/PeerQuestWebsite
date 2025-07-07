from django.contrib import admin
from .models import Transaction, UserBalance

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('transaction_id', 'user', 'type', 'amount', 'commission_fee', 'description', 'quest', 'created_at')
    list_filter = ('type', 'created_at')
    search_fields = ('user__username', 'description')
    autocomplete_fields = ['user', 'quest']
    readonly_fields = ('transaction_id', 'created_at')
    fieldsets = (
        ('Transaction Information', {
            'fields': ('transaction_id', 'user', 'type', 'amount')
        }),
        ('Commission Details', {
            'fields': ('commission_fee',),
            'description': 'Commission tracking for quest-related transactions'
        }),
        ('Details', {
            'fields': ('description', 'quest')
        }),
        ('Metadata', {
            'fields': ('created_at',)
        }),
    )

@admin.register(UserBalance)
class UserBalanceAdmin(admin.ModelAdmin):
    list_display = ('user', 'gold_balance', 'last_updated')
    search_fields = ('user__username',)
    autocomplete_fields = ['user']
    readonly_fields = ('last_updated',)
