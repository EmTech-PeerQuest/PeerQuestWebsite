from django.apps import AppConfig


class QuestsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'quests'

    def ready(self):
        import quests.signals
