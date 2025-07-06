from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    dependencies = [
        ("quests", "0025_quest_is_deleted"),
    ]

    operations = [
        migrations.CreateModel(
            name="QuestSubmissionFile",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("file", models.FileField(upload_to="submissions/")),
                ("submission", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="files", to="quests.questsubmission")),
            ],
        ),
    ]
