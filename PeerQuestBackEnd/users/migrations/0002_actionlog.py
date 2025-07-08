from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    dependencies = [
        ("users", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="ActionLog",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("action", models.CharField(max_length=32, choices=[
                    ("ban_lifted", "Ban Lifted"),
                    ("ban_dismissed", "Ban Appeal Dismissed"),
                    ("ban_resolved", "Ban Appeal Resolved"),
                    ("user_banned", "User Banned"),
                    ("user_unbanned", "User Unbanned"),
                    ("user_deleted", "User Deleted"),
                ])),
                ("details", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("admin", models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="admin_actions", to="users.user")),
                ("target_user", models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="targeted_actions", to="users.user")),
            ],
        ),
    ]
