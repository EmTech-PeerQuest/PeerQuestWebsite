# Automated Batch Processing Setup Guide

## Overview
This guide shows you how to set up automated batch processing that runs at the scheduled times (9 AM, 2 PM, 7 PM, 11 PM) to process payments automatically, similar to Roblox's system.

## Option 1: Linux/Mac Cron Job Setup

### 1. Make the script executable:
```bash
chmod +x /path/to/PeerQuestBackEnd/auto_batch_process.sh
```

### 2. Edit your crontab:
```bash
crontab -e
```

### 3. Add these cron job entries:
```bash
# PeerQuest Batch Processing - 4 times daily
# Morning batch at 9:00 AM
0 9 * * * /path/to/PeerQuestBackEnd/auto_batch_process.sh >> /var/log/peerquest_batch.log 2>&1

# Afternoon batch at 2:00 PM
0 14 * * * /path/to/PeerQuestBackEnd/auto_batch_process.sh >> /var/log/peerquest_batch.log 2>&1

# Evening batch at 7:00 PM
0 19 * * * /path/to/PeerQuestBackEnd/auto_batch_process.sh >> /var/log/peerquest_batch.log 2>&1

# Night batch at 11:00 PM
0 23 * * * /path/to/PeerQuestBackEnd/auto_batch_process.sh >> /var/log/peerquest_batch.log 2>&1
```

### 4. Update the script path:
Edit `auto_batch_process.sh` and change the path:
```bash
cd /your/actual/path/to/PeerQuestBackEnd
```

## Option 2: Windows Task Scheduler Setup

### 1. Open Task Scheduler:
- Press `Win + R`, type `taskschd.msc`, press Enter

### 2. Create Basic Task:
- Click "Create Basic Task" in the right panel
- Name: "PeerQuest Morning Batch"
- Description: "Process morning batch payments"

### 3. Set Trigger:
- Trigger: Daily
- Start: 9:00 AM
- Recur every: 1 days

### 4. Set Action:
- Action: Start a program
- Program: `C:\Users\Mark\Desktop\PeerQuestWebsite\PeerQuestBackEnd\auto_batch_process.bat`
- Start in: `C:\Users\Mark\Desktop\PeerQuestWebsite\PeerQuestBackEnd`

### 5. Repeat for other batch times:
Create 3 more tasks for:
- "PeerQuest Afternoon Batch" at 2:00 PM
- "PeerQuest Evening Batch" at 7:00 PM  
- "PeerQuest Night Batch" at 11:00 PM

## Option 3: Django Management Command (Recommended)

### 1. Create a Django management command:
Create file: `payments/management/commands/process_batch.py`

```python
from django.core.management.base import BaseCommand
from payments.models import PaymentProof
from django.utils import timezone

class Command(BaseCommand):
    help = 'Process current batch of payments'

    def add_arguments(self, parser):
        parser.add_argument(
            '--auto-only',
            action='store_true',
            help='Only auto-approve eligible payments',
        )

    def handle(self, *args, **options):
        self.stdout.write(f"Starting batch processing at {timezone.now()}")
        
        # Auto-approve eligible payments
        ready_payments = PaymentProof.get_current_batch_payments()
        auto_approved = 0
        
        for payment in ready_payments:
            if payment.auto_approve_if_eligible():
                auto_approved += 1
                self.stdout.write(f"Auto-approved: {payment.payment_reference}")
        
        if not options['auto_only']:
            # Start batch processing for manual review
            count, message = PaymentProof.start_batch_processing()
            self.stdout.write(message)
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully processed batch: {auto_approved} auto-approved'
            )
        )
```

### 2. Create the management directory structure:
```bash
mkdir -p payments/management/commands
touch payments/management/__init__.py
touch payments/management/commands/__init__.py
```

### 3. Use in cron job:
```bash
# Cron entry using Django command
0 9,14,19,23 * * * cd /path/to/PeerQuestBackEnd && python manage.py process_batch >> /var/log/peerquest_batch.log 2>&1
```

## Option 4: Celery Periodic Tasks (Advanced)

If you're using Celery for background tasks:

### 1. Install Celery Beat:
```bash
pip install celery django-celery-beat
```

### 2. Add to INSTALLED_APPS:
```python
INSTALLED_APPS = [
    # ...
    'django_celery_beat',
]
```

### 3. Create Celery task:
```python
# tasks.py
from celery import shared_task
from .models import PaymentProof

@shared_task
def process_payment_batch():
    """Process current batch of payments"""
    ready_payments = PaymentProof.get_current_batch_payments()
    auto_approved = 0
    
    for payment in ready_payments:
        if payment.auto_approve_if_eligible():
            auto_approved += 1
    
    # Start batch processing
    count, message = PaymentProof.start_batch_processing()
    
    return f"Processed batch: {auto_approved} auto-approved, {count} total"
```

### 4. Configure periodic task:
```python
# settings.py
from celery.schedules import crontab

CELERY_BEAT_SCHEDULE = {
    'process-payment-batches': {
        'task': 'payments.tasks.process_payment_batch',
        'schedule': crontab(hour=[9, 14, 19, 23], minute=0),
    },
}
```

## Testing the Automation

### 1. Test the script manually:
```bash
# Linux/Mac
./auto_batch_process.sh

# Windows
auto_batch_process.bat

# Django command
python manage.py process_batch
```

### 2. Check logs:
```bash
tail -f /var/log/peerquest_batch.log
```

### 3. Verify in admin:
- Go to Django Admin → Payment Proofs
- Check that payments are being processed
- Look for auto-approved payments

## Monitoring and Alerts

### 1. Log Monitoring:
Create a log rotation setup:
```bash
# /etc/logrotate.d/peerquest
/var/log/peerquest_batch.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
}
```

### 2. Email Notifications:
Add email alerts for failed processing:
```python
# In your batch processing script
import smtplib
from email.mime.text import MIMEText

def send_alert(message):
    msg = MIMEText(f"PeerQuest Batch Processing Alert: {message}")
    msg['Subject'] = 'PeerQuest Batch Processing Alert'
    msg['From'] = 'system@peerquest.com'
    msg['To'] = 'admin@peerquest.com'
    
    server = smtplib.SMTP('localhost')
    server.send_message(msg)
    server.quit()
```

### 3. Health Check Endpoint:
Create an endpoint to check batch system health:
```python
@api_view(['GET'])
def batch_health_check(request):
    """Check if batch processing is working correctly"""
    last_batch = PaymentProof.objects.filter(
        status='processing',
        processed_at__gte=timezone.now() - timedelta(hours=6)
    ).exists()
    
    ready_count = PaymentProof.get_current_batch_payments().count()
    
    return Response({
        'healthy': last_batch or ready_count == 0,
        'last_processing': last_batch,
        'ready_payments': ready_count,
        'next_batch': PaymentProof.get_next_batch_time()[0].isoformat()
    })
```

## Troubleshooting

### Common Issues:

1. **Cron job not running:**
   - Check cron service: `sudo service cron status`
   - Verify cron entries: `crontab -l`
   - Check logs: `grep CRON /var/log/syslog`

2. **Permission errors:**
   - Ensure script is executable: `chmod +x script.sh`
   - Check file ownership: `chown user:group script.sh`

3. **Environment issues:**
   - Use full paths in scripts
   - Set environment variables explicitly
   - Test script manually first

4. **Django errors:**
   - Check Django settings are correct
   - Verify database connectivity
   - Ensure all dependencies are installed

### Testing Checklist:

- [ ] Script runs manually without errors
- [ ] Cron job/task scheduler is configured correctly
- [ ] Logs are being created and rotated
- [ ] Email notifications work (if configured)
- [ ] Payments are being processed as expected
- [ ] Auto-approval is working for eligible payments
- [ ] Manual review queue is populated correctly

---

**Remember:** Always test the automation thoroughly in a development environment before deploying to production!
