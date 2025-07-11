# 📸 How to Save Your GCash QR Code Image

## Step-by-Step Instructions:

### 1. Save the Image
- **Right-click** on your GCash QR code image (the blue one you just shared)
- Select **"Save image as..."** or **"Save picture as..."**

### 2. Navigate to the Correct Folder
Navigate to this exact folder:
```
c:\Users\Mark\Desktop\PeerQuestWebsite\PeerQuestFrontEnd\public\images\payment\
```

### 3. Save with Exact Filename
- **Filename**: `gcash-qr.png` (exactly this name, lowercase)
- **File type**: PNG image
- Click **Save**

## ✅ Alternative Method:

1. **Copy** the image (Ctrl+C or right-click → Copy image)
2. **Navigate** to: `PeerQuestFrontEnd\public\images\payment\`
3. **Paste** the image (Ctrl+V)
4. **Rename** to: `gcash-qr.png`

## 🎯 After Saving:

Your gold purchase modal will show:
- ✅ Your actual blue GCash QR code
- ✅ Your name: MA*K JO*N WA**E Y.
- ✅ Your number: 099****524
- ✅ Your User ID: WMHFTN

## 🔧 System Status:

The configuration is already set up correctly:
```typescript
USE_STATIC_GCASH_QR: true  // ✅ Ready to use your QR
GCASH_QR_IMAGE_PATH: '/images/payment/gcash-qr.png'  // ✅ Correct path
```

**Once you save the image file, refresh your webpage and your personal GCash QR will appear!** 🎉
