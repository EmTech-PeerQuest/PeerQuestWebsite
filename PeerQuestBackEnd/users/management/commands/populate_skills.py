from django.core.management.base import BaseCommand
from users.models import Skill, COLLEGE_SKILLS


class Command(BaseCommand):
    help = 'Populate the database with predefined skills'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting to populate skills...'))
        
        created_count = 0
        updated_count = 0
        
        for category, skills in COLLEGE_SKILLS.items():
            for skill_name in skills:
                skill, created = Skill.objects.get_or_create(
                    name=skill_name,
                    defaults={
                        'category': category,
                        'description': f'{skill_name} skill in {category}',
                        'is_active': True
                    }
                )
                
                if created:
                    created_count += 1
                else:
                    # Update category if it changed
                    if skill.category != category:
                        skill.category = category
                        skill.save()
                        updated_count += 1
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully populated skills: {created_count} created, {updated_count} updated'
            )
        )
