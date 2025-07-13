from django.core.management.base import BaseCommand
from django.contrib import admin
from users.models import GuildReport

class Command(BaseCommand):
    help = 'Test GuildReport admin registration'

    def handle(self, *args, **options):
        self.stdout.write("Testing GuildReport admin registration...")
        
        # Check if model exists
        self.stdout.write(f"GuildReport model: {GuildReport}")
        
        # Check if registered in admin
        is_registered = admin.site.is_registered(GuildReport)
        self.stdout.write(f"GuildReport registered in admin: {is_registered}")
        
        # List all registered models
        registered_models = list(admin.site._registry.keys())
        user_models = [model for model in registered_models if 'users' in str(model._meta.app_label)]
        self.stdout.write(f"Users app models in admin: {[model.__name__ for model in user_models]}")
        
        # Check database table
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users_guildreport'")
            result = cursor.fetchone()
            self.stdout.write(f"GuildReport table exists: {result is not None}")
            
        # Try to count records
        try:
            count = GuildReport.objects.count()
            self.stdout.write(f"GuildReport records in database: {count}")
        except Exception as e:
            self.stdout.write(f"Error accessing GuildReport: {e}")
