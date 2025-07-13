from django.test import TestCase
from django.contrib.auth import get_user_model
from payments.models import PaymentProof, GoldPackage
from transactions.models import UserBalance, Transaction

class PaymentProofGoldAwardTest(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username='testuser', password='testpass')
        self.package = GoldPackage.objects.create(
            name="Test Pack", gold_amount=1000, price_php=100, bonus_gold=100
        )
        self.payment = PaymentProof.objects.create(
            user=self.user,
            payment_reference="REF123",
            gold_package=self.package,
            package_amount=self.package.gold_amount,
            package_price=self.package.price_php,
            bonus=self.package.formatted_bonus,
            receipt_image="test.jpg"
        )

    def test_add_gold_and_create_transaction(self):
        # Award gold
        result = self.payment.add_gold_to_user()
        self.assertTrue(result)
        # Check UserBalance
        balance = UserBalance.objects.get(user=self.user)
        self.assertEqual(balance.gold_balance, self.package.total_gold)
        # Create transaction
        result = self.payment.create_transaction_record()
        self.assertTrue(result)
        # Check Transaction
        tx = Transaction.objects.filter(user=self.user, type='PURCHASE').first()
        self.assertIsNotNone(tx)
        self.assertEqual(tx.amount, self.package.total_gold)

    def test_duplicate_gold_award_prevention(self):
        """Test that gold cannot be awarded twice for the same payment proof."""
        # First award should succeed
        result1 = self.payment.add_gold_to_user()
        self.assertTrue(result1)
        balance1 = UserBalance.objects.get(user=self.user)
        self.assertEqual(balance1.gold_balance, self.package.total_gold)
        # Second award should fail and not change balance
        result2 = self.payment.add_gold_to_user()
        self.assertFalse(result2)
        balance2 = UserBalance.objects.get(user=self.user)
        self.assertEqual(balance2.gold_balance, self.package.total_gold)

    def test_concurrent_gold_award(self):
        """Test that concurrent attempts to award gold do not result in duplicates (simulate race condition)."""
        import threading
        results = []
        def try_award():
            results.append(self.payment.add_gold_to_user())
        threads = [threading.Thread(target=try_award) for _ in range(5)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()
        # Only one should succeed
        self.assertEqual(results.count(True), 1)
        self.assertEqual(results.count(False), 4)
        balance = UserBalance.objects.get(user=self.user)
        self.assertEqual(balance.gold_balance, self.package.total_gold)

    def test_batch_gold_award(self):
        """Test awarding gold to multiple users in a batch scenario."""
        users = [self.user]
        payments = [self.payment]
        for i in range(2, 6):
            user = get_user_model().objects.create_user(
                username=f'user{i}',
                email=f'user{i}@example.com',  # Ensure unique email
                password='testpass'
            )
            users.append(user)
            payment = PaymentProof.objects.create(
                user=user,
                payment_reference=f"REF{i}",
                gold_package=self.package,
                package_amount=self.package.gold_amount,
                package_price=self.package.price_php,
                bonus=self.package.formatted_bonus,
                receipt_image="test.jpg"
            )
            payments.append(payment)
        # Award gold to all
        for payment in payments:
            result = payment.add_gold_to_user()
            self.assertTrue(result)
        # Check all balances
        for user in users:
            balance = UserBalance.objects.get(user=user)
            self.assertEqual(balance.gold_balance, self.package.total_gold)