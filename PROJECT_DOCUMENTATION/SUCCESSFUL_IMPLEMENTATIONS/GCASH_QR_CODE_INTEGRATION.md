# GCash QR Code Integration Guide

## ✅ Setup Complete!

Your PeerQuest application is now configured to use your own GCash QR code for payments. Here's everything you need to know:

## 🔧 Current Configuration

The system is currently set to use your static GCash QR code:
- ✅ Static QR Code Mode: **ENABLED**
- 📁 QR Code Location: `public/images/payment/gcash-qr.png`
- 🏪 Merchant Name: **PeerQuest Philippines**
- 📱 Enhanced Instructions: **ENABLED**

## 📸 How to Replace with Your GCash QR Code

### Step 1: Get Your GCash QR Code
1. Open your **GCash app**
2. Go to **"QR Ph"** or **"Receive Money"**
3. Save or screenshot your QR code
4. Ensure it's a clear, high-quality image

### Step 2: Replace the Placeholder
1. Navigate to: `PeerQuestFrontEnd/public/images/payment/`
2. Replace `gcash-qr.png` with your actual GCash QR code
3. Keep the filename as `gcash-qr.png`

### Step 3: Update Configuration (Optional)
You can customize the merchant name and settings in `gold-system-modal.tsx`:

```typescript
const PAYMENT_CONFIG = {
  USE_STATIC_GCASH_QR: true,           // ✅ Keep as true
  GCASH_QR_IMAGE_PATH: '/images/payment/gcash-qr.png',
  GCASH_MERCHANT_NAME: 'Your Business Name Here',  // 📝 Update this
  GCASH_INSTRUCTIONS_ENABLED: true     // ✅ Keep as true
}
```

## 🎯 What Customers Will See

When customers purchase gold:

### 1. **Package Selection**
- Choose gold package amount
- See pricing and bonuses

### 2. **Payment Screen**
- Your actual GCash QR code
- Exact amount to pay: **₱{amount}**
- Unique reference number
- Step-by-step instructions

### 3. **Payment Instructions**
```
📱 GCash Payment Instructions:
1. Open your GCash app
2. Tap "Send Money" or "Pay QR"
3. Scan the QR code above
4. Enter amount: ₱{amount}
5. Add reference: {reference}
6. Complete the payment
7. Screenshot your receipt for confirmation

💡 Payment will be verified manually. Please keep your receipt.
```

### 4. **Payment Information**
- 💳 Merchant: Your Business Name
- 📋 Payment Reference: Unique ID for tracking

## 🔄 How Payments Work

### Customer Flow:
1. **Selects Package** → Clicks gold package
2. **Confirms Purchase** → Reviews details  
3. **Scans QR Code** → Uses your GCash QR
4. **Sends Payment** → Includes reference number
5. **Screenshots Receipt** → For verification

### Your Process:
1. **Receive Payment** → In your GCash account
2. **Check Reference** → Match with purchase attempt
3. **Verify Amount** → Confirm correct amount paid
4. **Process Order** → Manually add gold to customer account

## ⚙️ Configuration Options

### Option 1: Static QR Code (Current - Recommended)
```typescript
USE_STATIC_GCASH_QR: true
```
- ✅ Uses your real GCash QR code
- ✅ Payments go directly to your account
- ✅ Simple setup, no API needed
- ⚠️ Requires manual payment verification

### Option 2: Dynamic QR Code (Demo Mode)
```typescript
USE_STATIC_GCASH_QR: false
```
- 🔧 Generates demo QR codes
- 🧪 Good for testing
- ❌ Not for real payments
- 🔌 Would need GCash API integration

## 🎨 Customization Options

### Update Merchant Name
```typescript
GCASH_MERCHANT_NAME: 'Your Business Name'
```

### Change QR Code Path
```typescript
GCASH_QR_IMAGE_PATH: '/images/payment/your-qr.png'
```

### Disable Enhanced Instructions
```typescript
GCASH_INSTRUCTIONS_ENABLED: false
```

### Multiple QR Codes (Advanced)
You can set up different QR codes for different amounts:

```typescript
const getQRCodePath = (amount) => {
  if (amount >= 1000) return '/images/payment/gcash-qr-vip.png'
  return '/images/payment/gcash-qr.png'
}
```

## 📱 Testing Your Setup

### Test Steps:
1. **Open Application** → Go to http://localhost:3001
2. **Access Gold Treasury** → Click gold icon or menu
3. **Go to BUY GOLD** → Click the BUY GOLD tab
4. **Select Package** → Click any gold package
5. **Check QR Code** → Verify your QR code appears
6. **Review Instructions** → Confirm payment details are correct

### What to Verify:
- ✅ Your QR code image displays correctly
- ✅ Merchant name shows your business name
- ✅ Payment instructions are clear
- ✅ Reference numbers are generated
- ✅ Amount display is correct

## 🔒 Security Best Practices

### QR Code Security:
- 🔐 Only use your official GCash QR code
- 🏪 Consider adding your business name/logo to the QR image
- 📱 Test the QR code yourself before going live
- 🔄 Regularly verify QR code is still valid

### Payment Verification:
- 📋 Always check reference numbers match
- 💰 Verify exact amounts were paid
- 📸 Request payment screenshots from customers
- ⏰ Set payment time limits (currently 5 minutes)

## 📞 Customer Support Flow

When customers contact you about payments:

1. **Get Reference Number** → From customer
2. **Check GCash History** → Look for payment with that reference
3. **Verify Amount** → Match gold package price
4. **Process Manually** → Add gold to their account
5. **Confirm with Customer** → Let them know it's processed

## 🚀 Going Live

### Before Launch:
1. ✅ Replace placeholder QR with your real GCash QR
2. ✅ Update merchant name to your business
3. ✅ Test the entire purchase flow
4. ✅ Prepare payment verification process
5. ✅ Train support team on manual verification

### After Launch:
- 📊 Monitor payment attempts and success rates
- 📱 Collect customer feedback on payment flow
- 🔄 Consider automating payment verification
- 📈 Track conversion rates and optimize

## 🆘 Troubleshooting

### QR Code Not Showing:
- Check file path: `public/images/payment/gcash-qr.png`
- Verify file permissions
- Ensure image format is PNG/JPG
- Clear browser cache

### Payment Issues:
- Verify GCash QR code is valid
- Check merchant name is correct
- Confirm reference number system working
- Test with small amount first

### Configuration Problems:
- Check syntax in PAYMENT_CONFIG
- Verify all required fields are set
- Restart development server
- Check browser console for errors

## 📈 Future Enhancements

### Potential Improvements:
- **Automated Verification**: GCash API integration
- **Payment Status Tracking**: Real-time payment confirmation
- **Receipt Upload**: Let customers upload payment screenshots
- **Multiple Payment Methods**: PayMaya, bank transfer options
- **Payment Analytics**: Track conversion and success rates

This setup gives you a professional, working payment system using your actual GCash account while maintaining full control over the payment verification process!
