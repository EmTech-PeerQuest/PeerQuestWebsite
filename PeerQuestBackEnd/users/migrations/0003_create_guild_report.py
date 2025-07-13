# Generated migration for GuildReport model

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_guildreport'),
        ('guilds', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='GuildReportNew',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('reason', models.CharField(max_length=255)),
                ('message', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('resolved', models.BooleanField(default=False)),
                ('resolved_at', models.DateTimeField(blank=True, null=True)),
                ('reported_guild', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='reports_against', to='guilds.guild')),
                ('reporter', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='guild_reports_made', to='users.user')),
                ('resolved_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='resolved_guild_reports', to='users.user')),
            ],
            options={
                'db_table': 'users_guildreport',
            },
        ),
    ]
