from django.core.management.base import BaseCommand
from payments.models import GoldPackage


class Command(BaseCommand):
    help = 'Setup predefined gold packages with fixed pricing'

    def handle(self, *args, **options):
        self.stdout.write('Setting up predefined gold packages...')
        
        # Clear existing packages
        GoldPackage.objects.all().delete()
        
        # Create the predefined packages based on your gold system modal
        packages = [
            {
                'name': 'Starter Pack',
                'gold_amount': 500,
                'price_php': 70.00,
                'bonus_gold': 0,
                'bonus_description': '',
            },
            {
                'name': 'Popular Pack',
                'gold_amount': 2800,
                'price_php': 350.00,
                'bonus_gold': 300,
                'bonus_description': '+300 bonus coins',
            },
            {
                'name': 'Value Pack',
                'gold_amount': 6500,
                'price_php': 700.00,
                'bonus_gold': 1000,
                'bonus_description': '+1000 bonus coins',
            },
            {
                'name': 'Premium Pack',
                'gold_amount': 14500,
                'price_php': 1500.00,
                'bonus_gold': 2500,
                'bonus_description': '+2500 bonus coins',
            },
        ]
        
        for package_data in packages:
            package = GoldPackage.objects.create(**package_data)
            self.stdout.write(
                self.style.SUCCESS(
                    f'Created package: {package.name} - {package.gold_amount} gold '
                    f'(+{package.bonus_gold} bonus) for ₱{package.price_php}'
                )
            )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created {len(packages)} gold packages!'
            )
        )
