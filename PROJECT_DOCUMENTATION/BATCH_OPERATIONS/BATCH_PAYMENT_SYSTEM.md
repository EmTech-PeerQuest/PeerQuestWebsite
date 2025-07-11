# Batch Payment Screening System - Roblox Style
## 📋 Overview

PeerQuest now implements a **batch payment screening system** similar to Roblox's approach, where payments are processed in scheduled batches rather than individually. This provides better security, efficiency, and fraud prevention.

## 🕐 Batch Processing Schedule

Payments are processed **4 times daily** at scheduled intervals:

- **🌅 Morning Batch**: 9:00 AM
- **🌞 Afternoon Batch**: 2:00 PM  
- **🌆 Evening Batch**: 7:00 PM
- **🌙 Night Batch**: 11:00 PM

## 🔄 Payment Flow

### For Users:
1. **Purchase Gold** → Select package and proceed to payment
2. **Make Payment** → Pay via GCash using provided QR code
3. **Upload Receipt** → Submit payment proof (screenshot/photo)
4. **Queue Assignment** → Payment automatically assigned to next batch
5. **Batch Processing** → Wait for scheduled batch verification
6. **Gold Delivered** → Receive gold coins once verified

### For Admins:
1. **Batch Preparation** → System queues payments for processing
2. **Manual Review** → Admin verifies receipts during batch time
3. **Auto-Approval** → Small amounts (₱70) auto-approved with receipt
4. **Manual Verification** → Larger amounts require human review
5. **Gold Distribution** → Verified payments automatically add gold to accounts

## 🤖 Manual Verification System

**All Payments Require Manual Review:**
- ₱70 packages (500 Gold)
- ₱350 packages (2,800 Gold + 300 bonus)
- ₱700 packages (6,500 Gold + 1,500 bonus)  
- ₱1,500 packages (14,500 Gold + 5,500 bonus)

**Manual Verification Process:**
- All payments must have valid receipt uploaded
- Admin reviews each payment during scheduled batch times
- No automatic approvals - human verification required
- Admins verify receipt authenticity and payment details

## 🛡️ Security Features

### Fraud Prevention:
- **Receipt Verification** → All payments require photo evidence
- **Batch Review** → Multiple payments reviewed together for patterns
- **Reference Tracking** → Unique payment references prevent duplicates
- **Amount Validation** → System validates payment amounts against packages
- **Time Windows** → Payments processed in controlled time windows

### Payment Validation:
- **Image Requirements** → Receipt must be clear, readable image
- **File Size Limits** → Max 5MB upload size
- **Format Validation** → Only image files accepted
- **Reference Matching** → Payment reference must match GCash transaction

## 🔧 Admin Tools

### Django Admin Interface:
- **Batch Processing Actions** → Process entire batches with one click
- **Auto-Approval Actions** → Automatically approve eligible payments
- **Manual Verification** → Review and approve individual payments
- **Batch Assignment** → Assign payments to specific batches
- **Status Tracking** → Monitor payment progress through stages

### Management Script:
```bash
# Check current batch status
python manage_batch_payments.py status

# Process current batch
python manage_batch_payments.py process

# Start manual processing for current batch  
python manage_batch_payments.py manual

# View processing schedule
python manage_batch_payments.py schedule
```

## 📊 Payment Statuses

| Status | Description | Action Required |
|--------|-------------|-----------------|
| **pending** | Just submitted, awaiting batch assignment | System auto-assigns |
| **queued** | Assigned to batch, waiting for processing time | Wait for batch time |
| **processing** | Batch started, under admin review | Admin verification |
| **verified** | Payment approved, gold being added | System processes |
| **completed** | Gold added to account, transaction recorded | None |
| **rejected** | Payment rejected by admin | User may resubmit |

## 💰 Package Configuration

| Package | Price | Gold | Bonus | Processing |
|---------|-------|------|-------|------------|
| Starter | ₱70 | 500 | - | Manual Review |
| Popular | ₱350 | 2,800 | +300 | Manual Review |
| Premium | ₱700 | 6,500 | +1,500 | Manual Review |
| Ultimate | ₱1,500 | 14,500 | +5,500 | Manual Review |

## 🚀 Quick Start Guide

### Setting Up Batch Processing:

1. **Run Migrations:**
```bash
cd PeerQuestBackEnd
python manage.py makemigrations payments
python manage.py migrate
```

2. **Configure Media Settings:**
```python
# In settings.py
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
```

3. **Add URL Configuration:**
```python
# In core/urls.py
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # ... your existing URLs
    path('api/payments/', include('payments.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

4. **Create Superuser (if needed):**
```bash
python manage.py createsuperuser
```

5. **Start Processing Batches:**
```bash
# Check what's ready
python manage_batch_payments.py status

# Process current batch
python manage_batch_payments.py process
```

## 📱 User Experience

### Payment Instructions Shown to Users:
1. **Scan QR Code** → Use GCash app to scan provided QR code
2. **Pay Exact Amount** → Ensure payment amount matches package price exactly
3. **Save Receipt** → Take screenshot of successful payment confirmation
4. **Upload Proof** → Submit receipt image through PeerQuest interface
5. **Wait for Batch** → Payment queued for next processing batch
6. **Receive Gold** → Gold coins added once payment verified

### User Feedback:
- **Batch Assignment** → "Payment queued for Afternoon Batch processing on July 6, 2025 at 2:00 PM"
- **Auto-Approval** → "Payment auto-approved! 500 gold coins added to your account"
- **Manual Review** → "Payment submitted for manual verification. You'll be notified within 24 hours"

## 🔒 API Endpoints

### User Endpoints:
- `POST /api/payments/submit-proof/` → Submit payment receipt
- `GET /api/payments/my-payments/` → View payment history
- `GET /api/payments/status/{reference}/` → Check specific payment status

### Admin Endpoints:
- `GET /api/payments/batch-status/` → Current batch information
- `POST /api/payments/start-batch/` → Start batch processing
- `POST /api/payments/auto-process/` → Auto-approve eligible payments

## 📈 Benefits of Batch Processing

### For Users:
- **Predictable Processing** → Know exactly when payment will be reviewed
- **Faster Small Payments** → ₱70 packages approved immediately
- **Clear Communication** → Always know payment status and next steps
- **Secure Process** → Multiple validation layers prevent issues

### For Admins:
- **Efficient Review** → Process multiple payments at once
- **Pattern Detection** → Easier to spot fraudulent activities
- **Workload Management** → Controlled, predictable verification times
- **Reduced Errors** → Systematic batch processing reduces mistakes

### For Platform:
- **Fraud Prevention** → Batch review helps identify suspicious patterns
- **Resource Optimization** → Scheduled processing uses resources efficiently
- **Audit Trail** → Complete tracking of all payment processing
- **Scalability** → System can handle high payment volumes

## 🛠️ Customization Options

### Batch Times:
Modify batch schedule in `models.py`:
```python
BATCH_SCHEDULE_CHOICES = [
    ('morning', '9:00 AM Batch'),
    ('afternoon', '2:00 PM Batch'),
    ('evening', '7:00 PM Batch'),
    ('late_night', '11:00 PM Batch'),
]
```

### Auto-Approval Rules:
Adjust auto-approval criteria in `models.py`:
```python
def is_eligible_for_auto_approval(self):
    # Modify these amounts as needed
    auto_approve_amounts = [70.00]  # Add more amounts if needed
    return (
        float(self.package_price) in auto_approve_amounts and
        self.receipt_image and
        self.status in ['queued', 'processing']
    )
```

### Package Configuration:
Update packages in frontend `gold-system-modal.tsx`:
```typescript
const goldPackages = [
  { amount: 500, price: 70, bonus: null },
  { amount: 2800, price: 350, bonus: "+300 bonus coins", popular: true },
  // Add or modify packages as needed
]
```

## 📞 Support and Troubleshooting

### Common Issues:

**Payments Stuck in Queue:**
- Check if batch processing is running
- Verify batch times are configured correctly
- Run manual batch processing if needed

**Auto-Approval Not Working:**
- Ensure receipt image is uploaded
- Check if amount qualifies for auto-approval
- Verify payment status is 'queued' or 'processing'

**Manual Verification Delays:**
- Admin should process batches during scheduled times
- Use admin interface to bulk verify payments
- Check for admin notifications/emails

### Getting Help:
1. Check admin interface for payment status
2. Use management script to diagnose issues
3. Review Django logs for error messages
4. Contact technical support with payment reference

---

**Last Updated:** July 6, 2025  
**Version:** 1.0  
**System:** PeerQuest Batch Payment Processing
