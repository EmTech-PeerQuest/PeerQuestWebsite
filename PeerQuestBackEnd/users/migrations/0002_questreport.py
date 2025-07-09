from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings

class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
        ('quests', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='QuestReport',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('reason', models.CharField(max_length=255)),
                ('message', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('resolved', models.BooleanField(default=False)),
                ('resolved_at', models.DateTimeField(blank=True, null=True)),
                ('reported_quest', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='reports_against', to='quests.quest')),
                ('reporter', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='quest_reports_made', to=settings.AUTH_USER_MODEL)),
                ('resolved_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='resolved_quest_reports', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
