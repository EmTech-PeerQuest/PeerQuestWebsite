# Generated by Django 5.2.3 on 2025-07-12 09:38

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('guilds', '0002_add_guild_moderation_system'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='GuildReport',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('reason', models.CharField(choices=[('inappropriate_name', 'Inappropriate Guild Name'), ('inappropriate_description', 'Inappropriate Description'), ('spam', 'Spam or Promotional Content'), ('harassment', 'Harassment of Members'), ('offensive_content', 'Offensive Content'), ('fake_guild', 'Fake or Misleading Guild'), ('other', 'Other Violation')], max_length=50)),
                ('message', models.TextField(blank=True, max_length=500)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('resolved', models.BooleanField(default=False)),
                ('resolved_at', models.DateTimeField(blank=True, null=True)),
                ('admin_notes', models.TextField(blank=True, help_text='Internal notes for admins')),
                ('reported_guild', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='reports_against', to='guilds.guild')),
                ('reporter', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='guild_reports_made', to=settings.AUTH_USER_MODEL)),
                ('resolved_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='resolved_guild_reports', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
                'unique_together': {('reported_guild', 'reporter')},
            },
        ),
    ]
