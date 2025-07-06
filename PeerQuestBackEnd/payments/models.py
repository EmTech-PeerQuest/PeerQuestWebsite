from django.db import models
from django.conf import settings


class PaymentProof(models.Model):
    STATUS_CHOICES = [
        ('queued', 'Queued'),
        ('processing', 'Processing'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
    ]

    BATCH_SCHEDULE_CHOICES = [
        ('morning', 'Morning Batch'),
        ('afternoon', 'Afternoon Batch'),
        ('evening', 'Evening Batch'),
        ('late_night', 'Late Night Batch'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    payment_reference = models.CharField(max_length=50, unique=True)
    package_amount = models.IntegerField()  # Gold coins
    package_price = models.DecimalField(max_digits=10, decimal_places=2)  # PHP
    bonus = models.CharField(max_length=100, blank=True, null=True)
    receipt_image = models.ImageField(upload_to='payment_receipts/')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='queued')
    
    # Batch processing fields
    batch_id = models.CharField(max_length=50, blank=True, null=True)
    scheduled_batch = models.CharField(max_length=20, choices=BATCH_SCHEDULE_CHOICES, blank=True, null=True)
    next_processing_time = models.DateTimeField(blank=True, null=True)
    
    # Admin fields
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='verified_payments'
    )
    verification_notes = models.TextField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Payment Proof'
        verbose_name_plural = 'Payment Proofs'

    def __str__(self):
        status_text = self.get_status_display()
        batch_info = ""
        if self.scheduled_batch and self.next_processing_time:
            from django.utils import timezone
            # Convert to local timezone for display
            local_time = timezone.localtime(self.next_processing_time)
            batch_date = local_time.strftime('%m/%d')
            batch_time = local_time.strftime('%I:%M %p')
            batch_info = f" | {self.get_scheduled_batch_display()} {batch_date} {batch_time}"
        return f"{self.user.username} | {self.payment_reference} | ₱{self.package_price} | {status_text}{batch_info}"

    @classmethod
    def get_next_batch_time(cls):
        """Calculate the next batch processing time"""
        from django.utils import timezone
        import datetime
        
        now = timezone.now()
        
        # Batch processing times (9AM, 2PM, 7PM, 11PM)
        batch_times = [
            (9, 0),   # 9:00 AM
            (14, 0),  # 2:00 PM
            (19, 0),  # 7:00 PM
            (23, 0),  # 11:00 PM
        ]
        
        # Find next batch time
        today = now.date()
        for hour, minute in batch_times:
            batch_time = timezone.make_aware(
                datetime.datetime.combine(today, datetime.time(hour, minute))
            )
            if batch_time > now:
                return batch_time, cls._get_batch_name_for_hour(hour)
        
        # If no batch today, get first batch tomorrow
        tomorrow = today + datetime.timedelta(days=1)
        first_batch = timezone.make_aware(
            datetime.datetime.combine(tomorrow, datetime.time(9, 0))
        )
        return first_batch, 'morning'
    
    @staticmethod
    def _get_batch_name_for_hour(hour):
        """Get batch name for given hour"""
        if hour == 9:
            return 'morning'
        elif hour == 14:
            return 'afternoon'
        elif hour == 19:
            return 'evening'
        elif hour == 23:
            return 'late_night'
        return 'morning'
    
    def assign_to_next_batch(self):
        """Assign payment to the next available batch"""
        next_time, batch_name = self.get_next_batch_time()
        
        self.scheduled_batch = batch_name
        self.next_processing_time = next_time
        self.status = 'queued'
        
        # Generate more readable batch ID
        batch_date = next_time.strftime('%Y%m%d')  # 20250706
        batch_time = next_time.strftime('%H%M')    # 1400 for 2:00 PM
        self.batch_id = f"BATCH_{batch_date}_{batch_time}_{batch_name.upper()}"
        
        self.save()
        return next_time
    
    @classmethod
    def get_current_batch_payments(cls):
        """Get payments ready for current batch processing"""
        from django.utils import timezone
        
        now = timezone.now()
        return cls.objects.filter(
            status='queued',
            next_processing_time__lte=now
        ).order_by('created_at')
    
    @classmethod
    def start_batch_processing(cls, admin_user=None):
        """Start processing current batch of payments"""
        from django.utils import timezone
        
        payments = cls.get_current_batch_payments()
        if not payments.exists():
            return 0, "No payments ready for processing"
        
        batch_id = payments.first().batch_id
        count = payments.count()
        
        # Update status to processing
        payments.update(
            status='processing',
            processed_at=timezone.now()
        )
        
        return count, f"Started processing batch {batch_id} with {count} payments"

    @property
    def total_gold_with_bonus(self):
        """Calculate total gold including bonus"""
        base_amount = self.package_amount
        
        # Parse bonus amount from string like "+300 bonus coins"
        if self.bonus:
            try:
                bonus_text = self.bonus.replace('+', '').replace('bonus coins', '').replace('bonus coin', '').strip()
                bonus_amount = int(bonus_text) if bonus_text.isdigit() else 0
                return base_amount + bonus_amount
            except (ValueError, AttributeError):
                return base_amount
        
        return base_amount
    
    def is_eligible_for_auto_approval(self):
        """Check if payment can be auto-approved - DISABLED for manual batch processing"""
        # All payments require manual verification in batch system
        return False
    
    def auto_approve_if_eligible(self):
        """Automatically approve payment - DISABLED for manual batch processing"""
        # All payments must go through manual batch verification
        return False
    
    def add_gold_to_user(self):
        """Add gold to user account"""
        try:
            user = self.user
            if hasattr(user, 'profile'):
                # If using a profile model
                profile = user.profile
                profile.gold = (profile.gold or 0) + self.total_gold_with_bonus
                profile.save()
            else:
                # If gold is stored directly on User model
                user.gold = getattr(user, 'gold', 0) + self.total_gold_with_bonus
                user.save()
            return True
        except Exception as e:
            import logging
            logging.error(f"Error adding gold to user {self.user.username}: {str(e)}")
            return False
    
    def create_transaction_record(self):
        """Create transaction record for the payment"""
        try:
            from transactions.models import Transaction
            Transaction.objects.create(
                user=self.user,
                transaction_type='PURCHASE',
                amount=self.total_gold_with_bonus,
                description=f"Gold Package Purchase - {self.package_amount} coins (₱{self.package_price}){' + bonus' if self.bonus else ''}",
                reference=self.payment_reference
            )
            return True
        except ImportError:
            # Transaction model doesn't exist, skip
            return False
        except Exception as e:
            import logging
            logging.error(f"Error creating transaction record: {str(e)}")
            return False
