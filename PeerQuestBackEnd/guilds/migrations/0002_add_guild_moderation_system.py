# Generated by Django 5.2.3 on 2025-07-12 08:01

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('guilds', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='guild',
            name='disable_reason',
            field=models.TextField(blank=True, max_length=500),
        ),
        migrations.AddField(
            model_name='guild',
            name='disabled_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='guild',
            name='disabled_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='disabled_guilds', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='guild',
            name='is_disabled',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='guild',
            name='warning_count',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.CreateModel(
            name='GuildWarning',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('reason', models.TextField(max_length=500)),
                ('issued_at', models.DateTimeField(auto_now_add=True)),
                ('dismissed_at', models.DateTimeField(blank=True, null=True)),
                ('dismissed_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='dismissed_guild_warnings', to=settings.AUTH_USER_MODEL)),
                ('guild', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='warnings', to='guilds.guild')),
                ('issued_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='issued_guild_warnings', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-issued_at'],
            },
        ),
    ]
