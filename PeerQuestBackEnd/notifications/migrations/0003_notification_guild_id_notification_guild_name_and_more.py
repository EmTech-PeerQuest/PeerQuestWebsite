# Generated by Django 5.2.3 on 2025-07-12 12:40

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('notifications', '0002_notification_application_id'),
    ]

    operations = [
        migrations.AddField(
            model_name='notification',
            name='guild_id',
            field=models.IntegerField(blank=True, help_text='Related Guild ID', null=True),
        ),
        migrations.AddField(
            model_name='notification',
            name='guild_name',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AlterField(
            model_name='notification',
            name='notif_type',
            field=models.CharField(choices=[('quest_application', 'Quest Application'), ('quest_application_result', 'Quest Application Result'), ('kicked_from_quest', 'Kicked From Quest'), ('quest_disabled', 'Quest Disabled'), ('quest_deleted', 'Quest Deleted'), ('guild_event', 'Guild Notification')], max_length=32),
        ),
    ]
