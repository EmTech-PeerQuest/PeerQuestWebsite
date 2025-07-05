from django.core.management.base import BaseCommand
from transactions.models import Transaction, UserBalance
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Reset all transaction and balance data (use with caution - for testing only)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--yes-im-sure',
            action='store_true',
            help='Confirm that you want to delete all transaction data'
        )

    def handle(self, *args, **options):
        if not options['yes_im_sure']:
            self.stdout.write(self.style.WARNING(
                "This will delete ALL transaction and balance data. "
                "Use --yes-im-sure to confirm."
            ))
            return

        transaction_count = Transaction.objects.count()
        Transaction.objects.all().delete()
        
        balance_count = UserBalance.objects.count()
        UserBalance.objects.all().delete()
        
        self.stdout.write(self.style.SUCCESS(
            f"Successfully deleted {transaction_count} transactions and {balance_count} balance records."
        ))
