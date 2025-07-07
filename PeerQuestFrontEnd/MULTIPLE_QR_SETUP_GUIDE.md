# 🎯 OPTION 2: Multiple Static QR Codes Setup Guide

## ✅ System Configured!

I've set up your system to use **different QR codes for each gold package**. Here's what you need to do:

## 📱 Step 1: Create 4 Different QR Codes in GCash

You need to create **4 separate QR codes** in your GCash app, each with a different preset amount:

### QR Code 1: ₱70 (500 Gold Package)
1. Open **GCash app**
2. Go to **"Receive Money"** or **"QR Code"**
3. Set amount to: **₱70.00**
4. Save/screenshot this QR code
5. Name it: `gcash-qr-70.png`

### QR Code 2: ₱350 (2800 Gold Package) 
1. Create another QR code
2. Set amount to: **₱350.00**
3. Save/screenshot this QR code
4. Name it: `gcash-qr-350.png`

### QR Code 3: ₱700 (6500 Gold Package)
1. Create another QR code
2. Set amount to: **₱700.00**  
3. Save/screenshot this QR code
4. Name it: `gcash-qr-700.png`

### QR Code 4: ₱1500 (14500 Gold Package)
1. Create another QR code
2. Set amount to: **₱1500.00**
3. Save/screenshot this QR code  
4. Name it: `gcash-qr-1500.png`

## 📁 Step 2: Save All QR Images

Save all 4 QR code images to this folder:
```
c:\Users\Mark\Desktop\PeerQuestWebsite\PeerQuestFrontEnd\public\images\payment\
```

### Required Filenames:
- `gcash-qr-70.png` (exactly this name)
- `gcash-qr-350.png` (exactly this name)
- `gcash-qr-700.png` (exactly this name)
- `gcash-qr-1500.png` (exactly this name)

## 🎯 How It Works

### Package Selection → Specific QR Code:

| Gold Package | Price | QR Code File | User Experience |
|-------------|-------|--------------|-----------------|
| **500 Gold** | ₱70 | `gcash-qr-70.png` | Scans → ₱70 auto-filled |
| **2800 Gold** | ₱350 | `gcash-qr-350.png` | Scans → ₱350 auto-filled |
| **6500 Gold** | ₱700 | `gcash-qr-700.png` | Scans → ₱700 auto-filled |
| **14500 Gold** | ₱1500 | `gcash-qr-1500.png` | Scans → ₱1500 auto-filled |

## ✅ System Configuration (Already Set):

```typescript
USE_STATIC_GCASH_QR: true  // ✅ Using multiple static QRs
GCASH_QR_PATHS: {
  70: '/images/payment/gcash-qr-70.png',     // 500 Gold
  350: '/images/payment/gcash-qr-350.png',   // 2800 Gold  
  700: '/images/payment/gcash-qr-700.png',   // 6500 Gold
  1500: '/images/payment/gcash-qr-1500.png', // 14500 Gold
}
```

## 🎮 User Experience:

1. **User selects 2800 Gold Package (₱350)**
2. **System shows `gcash-qr-350.png`** (your QR with ₱350 preset)
3. **User scans QR code**
4. **GCash app opens with ₱350 already filled in**
5. **User just taps "Pay" to complete**

## 🔧 Advantages of This Setup:

✅ **Each package has its own preset QR**  
✅ **Amount auto-fills when scanned**  
✅ **No manual typing required**  
✅ **Uses your exact GCash account**  
✅ **Professional user experience**  

## 🚨 Important Notes:

- **All QR codes must point to your same GCash account**
- **Each QR should have the exact amount preset**
- **Filenames must match exactly** (case-sensitive)
- **All files must be PNG format**

## 📋 Next Steps:

1. ✅ **System is configured** (done)
2. 📱 **Create 4 QR codes in GCash** (your task)
3. 💾 **Save them with correct filenames** (your task)
4. 🔄 **Refresh webpage** (to see new QRs)

**Once you create and save all 4 QR codes, each gold package will show its own specific QR code with the correct amount preset!** 🎉
