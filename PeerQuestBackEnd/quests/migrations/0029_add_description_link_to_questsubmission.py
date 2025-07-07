from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ("quests", "0028_delete_questsubmissionfile"),
    ]

    operations = [
        migrations.AddField(
            model_name="questsubmission",
            name="description",
            field=models.TextField(blank=True, help_text="Text description of the submission"),
        ),
        migrations.AddField(
            model_name="questsubmission",
            name="link",
            field=models.URLField(blank=True, null=True, help_text="Optional link to submitted work"),
        ),
    ]
