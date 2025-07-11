import uuid
from django.core.management.base import BaseCommand
from users.models import Skill, COLLEGE_SKILLS
from django.db import transaction

# Use the same namespace as in your fallback UUID logic (should match backend logic)
UUID_NAMESPACE = uuid.UUID("b7e6e6e2-7e7e-4e7e-8e7e-7e7e7e7e7e7e")

def deterministic_skill_uuid(name):
    return uuid.uuid5(UUID_NAMESPACE, name)

class Command(BaseCommand):
    help = 'Seed the Skill table with all fallback COLLEGE_SKILLS (with deterministic UUIDs)'

    def handle(self, *args, **options):
        created = 0
        updated = 0
        with transaction.atomic():
            for category, skills in COLLEGE_SKILLS.items():
                for skill_name in skills:
                    skill_uuid = deterministic_skill_uuid(skill_name)
                    obj, was_created = Skill.objects.update_or_create(
                        id=skill_uuid,
                        defaults={
                            'name': skill_name,
                            'category': category,
                            'description': f"Auto-seeded fallback skill: {skill_name}",
                            'is_active': True,
                        }
                    )
                    if was_created:
                        created += 1
                    else:
                        updated += 1
        self.stdout.write(self.style.SUCCESS(f"Seeded {created} new skills, updated {updated} existing skills."))
