# GCash QR Configuration Guide

## Quick Setup for Businesses Without Merchant Category Code

### Step 1: Update Your GCash Information

Edit `/lib/payment/gcash-qr.ts` and update these values:

```typescript
export const GCASH_QR_CONFIGS = {
  production: {
    merchantName: "YOUR_BUSINESS_NAME",           // Your actual business name
    merchantAccount: "09XXXXXXXXX",               // Your GCash number
    merchantCity: "YOUR_CITY",                    // Your business city
    countryCode: "PH",                           // Keep as PH
    merchantCategoryCode: "0000"                 // Safe default - works for all
  }
}
```

### Step 2: Replace These Values

| Field | What to Replace | Example |
|-------|----------------|---------|
| `merchantName` | "PEERQUEST" | "YOUR BUSINESS NAME" |
| `merchantAccount` | "09123456789" | Your actual GCash number |
| `merchantCity` | "MANILA" | Your business city |
| `merchantCategoryCode` | "0000" | Keep as "0000" (safe default) |

### Step 3: Test Configuration

Run the test to verify your setup:
```bash
node test-gcash-qr.js
```

## Merchant Category Codes Explained

### What is MCC?
Merchant Category Code (MCC) is a 4-digit number that classifies your business type. It's used by payment processors to categorize transactions.

### Safe Options When You Don't Have One:

✅ **"0000" - General/Unspecified**
- Works for any business type
- Safe default choice
- No restrictions

✅ **"5999" - Miscellaneous Retail**
- Good for e-commerce/online stores
- Covers general retail activities

✅ **"7372" - Computer Programming Services**
- Perfect for software/web services
- Good for digital platforms

### How to Get Your Official MCC:

1. **Contact GCash Business Support**
   - Email: business@gcash.com
   - Call: (02) 8-7777
   - Request your official merchant category

2. **Provide Business Documents**
   - Business registration
   - DTI/SEC certificate
   - Description of services

3. **Update Configuration**
   - Once you get your official MCC
   - Update the `merchantCategoryCode` value
   - Re-test the QR generation

## Current Configuration Status

✅ **Ready to Use**: With "0000" merchant category code  
✅ **Auto-Fill Amount**: Fully functional  
✅ **EMVCo Compliant**: Follows international standards  
⚠️ **Action Needed**: Update with your actual GCash number  

## Testing Your Setup

1. **Generate Test QR Code**:
   ```javascript
   const qrData = generateGCashQRData({
     merchantName: 'YOUR_BUSINESS_NAME',
     merchantAccount: '09XXXXXXXXX',
     amount: 100,
     reference: 'TEST123'
   })
   ```

2. **Test with GCash App**:
   - Scan the generated QR code
   - Verify amount auto-fills (₱100)
   - Check merchant name displays correctly

3. **Validate Format**:
   ```javascript
   const isValid = validateGCashQR(qrData)
   console.log('QR is valid:', isValid)
   ```

## Important Notes

- ⚠️ **Security**: Never commit real GCash numbers to public repositories
- 💡 **Environment**: Use different numbers for development/staging/production
- 🔄 **Updates**: You can change MCC later without affecting existing QR codes
- 📱 **Testing**: Always test with actual GCash app before going live

## Need Help?

1. **Technical Issues**: Check console logs for error messages
2. **GCash Questions**: Contact GCash business support
3. **Implementation**: Review the documentation in `/PROJECT_DOCUMENTATION/`

---

**Status**: ✅ Configuration Updated for Businesses Without MCC  
**Next Step**: Update with your actual GCash business number  
**Default MCC**: "0000" (General/Safe for all businesses)
