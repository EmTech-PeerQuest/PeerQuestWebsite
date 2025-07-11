# How to Add Your GCash QR Code

## Step 1: Prepare Your GCash QR Code
1. Open your GCash app
2. Go to "QR Ph" or "Receive Money" 
3. Take a screenshot or save your QR code image
4. Save it as a PNG or JPG file

## Step 2: Add Your QR Code to the Project
1. Copy your GCash QR code image
2. Rename it to: `gcash-qr.png`
3. Place it in this folder: `public/images/payment/gcash-qr.png`

## Step 3: Configuration (Already Done)
The code is already configured to use your static QR code. The setting is in the `generateQRCode` function:

```typescript
const useStaticQR = true; // Set to true to use your GCash QR code
```

## Features Included

### Smart Detection
- When using your static QR code, the system automatically shows enhanced payment instructions
- Displays the exact amount and reference number customers should use
- Provides step-by-step GCash payment instructions

### Payment Instructions Shown
1. Scan the QR code with GCash app
2. Enter the exact amount (₱{amount})
3. Add the payment reference number
4. Complete payment in GCash
5. Take screenshot of receipt

## Alternative Options

### Option 1: Static QR Code (Recommended)
- Use your actual GCash QR code
- Customers pay directly to your GCash account
- Manual verification of payments needed

### Option 2: Dynamic QR Code (Demo)
- Generates QR codes with payment data
- Good for testing and demonstrations
- Requires GCash API integration for real payments

### Option 3: Multiple QR Codes
You can also set up different QR codes for different amounts or purposes by modifying the code:

```typescript
// Example: Different QR codes for different amounts
const getQRCodePath = (amount: number) => {
  if (amount >= 1000) return '/images/payment/gcash-qr-large.png'
  if (amount >= 500) return '/images/payment/gcash-qr-medium.png'
  return '/images/payment/gcash-qr-small.png'
}
```

## File Structure
```
public/
  images/
    payment/
      gcash-qr.png          <- Your main GCash QR code
      gcash-qr-large.png    <- Optional: For large amounts
      gcash-qr-medium.png   <- Optional: For medium amounts
      gcash-qr-small.png    <- Optional: For small amounts
```

## Testing
1. Add your QR code image to the specified folder
2. Refresh the application
3. Go to Gold Treasury → BUY GOLD
4. Click any package to test the purchase flow
5. Verify your QR code appears in the payment step

## Security Notes
- Your QR code image should be high quality but not too large (recommended: 512x512px or smaller)
- Keep your original QR code secure and don't share it publicly outside of the payment flow
- Consider watermarking the QR code image with your business name

## Support
If you need any modifications to the payment flow or QR code display, just let me know!
