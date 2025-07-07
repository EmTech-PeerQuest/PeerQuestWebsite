#!/usr/bin/env python3
"""
Batch Payment Processing Management Script for PeerQuest
========================================================

This script helps admins manage the batch payment processing system similar to Roblox's approach.
Payments are processed in scheduled batches throughout the day for efficiency and security.

Usage:
    python manage_batch_payments.py [command]

Commands:
    status      - Show current batch status and ready payments
    process     - Process current batch of ready payments
    manual      - Start manual processing for current batch
    schedule    - Show next batch processing times
    help        - Show this help message

Batch Schedule:
    • Morning Batch: 9:00 AM
    • Afternoon Batch: 2:00 PM  
    • Evening Batch: 7:00 PM
    • Night Batch: 11:00 PM

Manual Verification Process:
    • All payments require manual admin review
    • Receipts must be verified by human admins
    • Payments processed in scheduled batches
    • Admins verify and approve via Django admin interface
"""

import os
import sys
import django
from datetime import datetime, timedelta

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.utils import timezone
from payments.models import PaymentProof
from django.contrib.auth.models import User


class BatchPaymentManager:
    """Manages batch payment processing operations"""
    
    def __init__(self):
        self.batch_times = [
            (9, 0, "Morning"),
            (14, 0, "Afternoon"), 
            (19, 0, "Evening"),
            (23, 0, "Night")
        ]
    
    def show_status(self):
        """Show current batch status"""
        print("=" * 60)
        print("BATCH PAYMENT PROCESSING STATUS")
        print("=" * 60)
        
        # Current time
        now = timezone.now()
        print(f"Current Time: {now.strftime('%Y-%m-%d %H:%M:%S %Z')}")
        print()
        
        # Ready payments
        ready_payments = PaymentProof.get_current_batch_payments()
        print(f"Ready for Processing: {ready_payments.count()} payments")
        
        if ready_payments.exists():
            print("\nReady Payments:")
            for payment in ready_payments[:10]:  # Show first 10
                print(f"  📝 {payment.payment_reference} - ₱{payment.package_price} - {payment.user.username}")
            
            if ready_payments.count() > 10:
                print(f"  ... and {ready_payments.count() - 10} more")
        
        # Queued payments
        queued_payments = PaymentProof.objects.filter(status='queued')
        print(f"\nQueued for Future Batches: {queued_payments.count()} payments")
        
        # Next batch time
        next_time, batch_name = PaymentProof.get_next_batch_time()
        print(f"Next Batch: {batch_name.title()} at {next_time.strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Processing breakdown
        manual_required = ready_payments.count()
        
        print(f"\nProcessing Breakdown:")
        print(f"  👤 Manual Verification Required: {manual_required}")
        print(f"  � All payments require admin review")
        
        print("\n" + "=" * 60)
    
    def process_batch(self):
        """Process current batch of payments"""
        print("=" * 60)
        print("STARTING BATCH PROCESSING")
        print("=" * 60)
        
        try:
            count, message = PaymentProof.start_batch_processing()
            print(f"Result: {message}")
            
            if count > 0:
                print(f"\n✅ Started processing {count} payments")
                print("📝 Payments are now in 'processing' status")
                print("👨‍💼 Admins can now manually verify them in Django Admin")
                print("🔗 Admin URL: /admin/payments/paymentproof/")
            else:
                print("ℹ️ No payments ready for processing")
                
        except Exception as e:
            print(f"❌ Error: {str(e)}")
        
        print("\n" + "=" * 60)
    
    def manual_process_batch(self):
        """Start manual processing of current batch"""
        print("=" * 60)
        print("STARTING MANUAL BATCH PROCESSING")
        print("=" * 60)
        
        ready_payments = PaymentProof.get_current_batch_payments()
        total_count = ready_payments.count()
        
        if total_count == 0:
            print("ℹ️ No payments ready for processing")
            print("\n" + "=" * 60)
            return
        
        try:
            count, message = PaymentProof.start_batch_processing()
            print(f"Result: {message}")
            
            if count > 0:
                print(f"\n✅ Started processing {count} payments")
                print("📝 All payments require manual verification")
                print("👨‍💼 Admins can now verify them in Django Admin")
                print("🔗 Admin URL: /admin/payments/paymentproof/")
                print("� Filter by status: 'processing' to see payments ready for review")
            
        except Exception as e:
            print(f"❌ Error: {str(e)}")
        
        print("\n" + "=" * 60)
    
    def show_schedule(self):
        """Show next batch processing times"""
        print("=" * 60)
        print("BATCH PROCESSING SCHEDULE")
        print("=" * 60)
        
        now = timezone.now()
        today = now.date()
        
        print(f"Current Time: {now.strftime('%Y-%m-%d %H:%M:%S %Z')}")
        print()
        
        # Show today's remaining batches
        print("Today's Remaining Batches:")
        found_upcoming = False
        
        for hour, minute, name in self.batch_times:
            batch_time = timezone.make_aware(
                datetime.combine(today, datetime.time(hour, minute))
            )
            
            if batch_time > now:
                time_until = batch_time - now
                hours = int(time_until.total_seconds() // 3600)
                minutes = int((time_until.total_seconds() % 3600) // 60)
                
                print(f"  📅 {name} Batch: {batch_time.strftime('%H:%M')} (in {hours}h {minutes}m)")
                found_upcoming = True
        
        if not found_upcoming:
            print("  No more batches today")
        
        # Show tomorrow's first batch
        tomorrow = today + timedelta(days=1)
        first_batch = timezone.make_aware(
            datetime.combine(tomorrow, datetime.time(9, 0))
        )
        time_until = first_batch - now
        hours = int(time_until.total_seconds() // 3600)
        
        print(f"\nNext Day:")
        print(f"  📅 Morning Batch: {first_batch.strftime('%Y-%m-%d %H:%M')} (in {hours}h)")
        
        print(f"\n🔄 Payment Flow:")
        print(f"  1. User uploads receipt → Queued for next batch")
        print(f"  2. Batch time arrives → Admin processes batch")
        print(f"  3. All payments → Manual verification required")
        print(f"  4. Admin reviews receipts → Approves/rejects payments")
        print(f"  5. Verified payments → Gold added to user account")
        
        print("\n" + "=" * 60)
    
    def show_help(self):
        """Show help information"""
        print(__doc__)


def main():
    """Main command handler"""
    manager = BatchPaymentManager()
    
    if len(sys.argv) < 2:
        manager.show_help()
        return
    
    command = sys.argv[1].lower()
    
    if command == "status":
        manager.show_status()
    elif command == "process":
        manager.process_batch()
    elif command == "manual":
        manager.manual_process_batch()
    elif command == "schedule":
        manager.show_schedule()
    elif command == "help":
        manager.show_help()
    else:
        print(f"Unknown command: {command}")
        print("Available commands: status, process, manual, schedule, help")


if __name__ == "__main__":
    main()
