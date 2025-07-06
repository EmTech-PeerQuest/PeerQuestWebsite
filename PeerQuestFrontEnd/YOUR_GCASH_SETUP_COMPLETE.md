# GCash QR Code Setup Guide

## Your Personal GCash QR Integration

I've configured the system to use your personal GCash QR code. Here's what has been set up:

### ✅ Configuration Updated

**Your GCash Details:**
- **Name**: MA*K JO*N WA**E Y. (as shown on QR)
- **Number**: 09951723524 (from QR code: 099****524)
- **User ID**: WMHFTN (from your QR)

### 📱 QR Code Setup Required

**You need to manually save your QR code image:**

1. **Save the QR code image** you shared as:
   ```
   PeerQuestFrontEnd/public/images/payment/gcash-qr.png
   ```

2. **Directory already created**: `public/images/payment/`

3. **File name must be exactly**: `gcash-qr.png`

### ⚙️ Payment Configuration

**Current Settings** (in `gold-system-modal.tsx`):
```typescript
const PAYMENT_CONFIG = {
  USE_STATIC_GCASH_QR: true,  // ✅ Using your static QR
  GCASH_QR_IMAGE_PATH: '/images/payment/gcash-qr.png',
  GCASH_MERCHANT_NAME: 'MA*K JO*N WA**E Y.',
  GCASH_MERCHANT_NUMBER: '09951723524',
  // ... other settings
}
```

### 🔄 Two Payment Options Available

#### Option 1: Static QR (Currently Active)
- **Uses**: Your personal GCash QR code image
- **User Experience**: Users scan your QR and manually enter the amount
- **Pros**: Uses your exact QR code from GCash app
- **Cons**: Users must manually type the amount

#### Option 2: Dynamic QR with Auto-Fill (Recommended)
- **Uses**: Generated QR codes with embedded amounts
- **User Experience**: Amount auto-fills when scanned (₱70, ₱350, ₱700, ₱1500)
- **Pros**: Professional experience like Roblox/Steam
- **Cons**: Not your exact QR image

### 🔧 How to Switch Between Options

**To use your static QR** (current setting):
```typescript
USE_STATIC_GCASH_QR: true
```

**To use dynamic auto-fill QRs**:
```typescript
USE_STATIC_GCASH_QR: false
```

### 💡 Recommendations

**For Production Use**, I recommend:

1. **Start with Static QR** (current setup) for immediate use
2. **Test thoroughly** with small amounts first
3. **Consider Dynamic QR** later for better user experience

**For Best User Experience**:
- Dynamic QR codes provide the most professional experience
- Users don't need to type amounts manually
- Each package gets its own optimized QR code

### 🛠️ Quick Setup Steps

1. **Save your QR image**:
   - Copy the QR code image to: `public/images/payment/gcash-qr.png`

2. **Test the system**:
   ```bash
   npm run dev
   ```

3. **Verify configuration**:
   - Open the Gold Treasury modal
   - Try purchasing any package
   - Check that your QR code appears

### 📋 Payment Instructions for Users

When users see your QR code, they'll get instructions like:

```
📱 GCash Payment Instructions:
1. Open your GCash app
2. Tap "Pay QR"
3. Scan the QR code above
4. Enter amount: ₱350
5. Add reference: PQ1720279234ABC123
6. Complete the payment
7. Screenshot your receipt for confirmation
```

### 🔐 Security Notes

- Your GCash number is now properly configured
- The system generates unique references for each transaction
- All payments go directly to your GCash account (09951723524)

### 🎮 Ready for Production

Once you save the QR image, your system will be ready for real gold purchases with your personal GCash account integration!
