from django.apps import AppConfig
import logging


class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'users'
    verbose_name= 'Accounts'

    def ready(self):
        # Auto-seed fallback skills on app startup, but only if DB is ready
        try:
            from users.models import COLLEGE_SKILLS, Skill
            import uuid
            from django.db import transaction
            from django.db.utils import OperationalError, ProgrammingError
            UUID_NAMESPACE = uuid.UUID("b7e6e6e2-7e7e-4e7e-8e7e-7e7e7e7e7e7e")
            def deterministic_skill_uuid(name):
                return uuid.uuid5(UUID_NAMESPACE, name)
            with transaction.atomic():
                for category, skills in COLLEGE_SKILLS.items():
                    for skill_name in skills:
                        skill_uuid = deterministic_skill_uuid(skill_name)
                        Skill.objects.update_or_create(
                            id=skill_uuid,
                            defaults={
                                'name': skill_name,
                                'category': category,
                                'description': f"Auto-seeded fallback skill: {skill_name}",
                                'is_active': True,
                            }
                        )
        except (OperationalError, ProgrammingError) as e:
            # Table doesn't exist yet, skip seeding
            pass
        except Exception as e:
            logging.getLogger("users.apps").warning(f"Could not auto-seed fallback skills: {e}")
