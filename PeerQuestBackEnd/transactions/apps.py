from django.apps import AppConfig


class TransactionsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'transactions'
    
    def ready(self):
        import transactions.signals  # noqa
        try:
            import transactions.quest_integration  # noqa
        except ImportError:
            # Quest models might not be available during migration
            pass
