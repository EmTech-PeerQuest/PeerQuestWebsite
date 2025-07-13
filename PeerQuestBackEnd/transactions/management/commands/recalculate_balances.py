from django.core.management.base import BaseCommand
from django.db import transaction
from transactions.models import Transaction
from django.db.models import Sum
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Recalculate user balances from transaction history'

    def handle(self, *args, **options):
        from transactions.models import UserBalance
        
        users = User.objects.all()
        updated = 0
        created = 0
        
        with transaction.atomic():
            for user in users:
                # Calculate total from transactions
                total = Transaction.objects.filter(user=user).aggregate(
                    total=Sum('amount')
                )['total'] or 0
                
                # Update or create balance
                balance, is_new = UserBalance.objects.update_or_create(
                    user=user,
                    defaults={'gold_balance': total}
                )
                
                if is_new:
                    created += 1
                else:
                    updated += 1
        
        self.stdout.write(self.style.SUCCESS(
            f"Successfully recalculated balances: {updated} updated, {created} created"
        ))
