# Testing the Payment System

## 🚨 **Error Fix Applied**: "Unexpected token '<', "<!DOCTYPE "... is not valid JSON"

### ✅ **What was Fixed:**

1. **API URL Issue**: Frontend was using relative URL `/api/payments/submit-proof` instead of full backend URL
2. **Token Issue**: Was using `localStorage.getItem('token')` instead of `localStorage.getItem('access_token')`
3. **Error Handling**: Added proper detection of HTML error pages vs JSON responses
4. **PaymentAPI Module**: Created dedicated API module using same pattern as TransactionAPI

### 🔧 **Changes Made:**

1. **Created PaymentAPI module** (`lib/api/payments.ts`):
   ```typescript
   await PaymentAPI.submitPaymentProof({
     payment_reference: paymentReference,
     package_amount: selectedPackage.amount,
     package_price: selectedPackage.price,
     bonus: selectedPackage.bonus || '',
     receipt: receiptImage
   })
   ```

2. **Fixed API URL**: Now uses `process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'`

3. **Fixed Token**: Now uses `localStorage.getItem('access_token')`

4. **Better Error Handling**: Detects HTML responses and shows helpful error messages

### 🚀 **To Test:**

1. **Start Django Backend:**
   ```bash
   cd PeerQuestBackEnd
   python manage.py runserver
   ```

2. **Start Next.js Frontend:**
   ```bash
   cd PeerQuestFrontEnd
   npm run dev
   ```

3. **Test Payment Flow:**
   - Login to frontend
   - Go to Gold system
   - Select a package
   - Upload a receipt image
   - Submit for verification
   - Should see batch processing message

### 🔍 **If Still Getting Errors:**

1. **Check Backend is Running**: Visit `http://localhost:8000/admin` in browser
2. **Check Environment Variables**: Ensure `NEXT_PUBLIC_API_URL` is set correctly
3. **Check Console**: Look for detailed error messages in browser console
4. **Check Django Logs**: Look for errors in Django console where `runserver` is running

### 📋 **Expected Flow:**

1. User submits payment → Frontend calls PaymentAPI
2. PaymentAPI → `POST http://localhost:8000/api/payments/submit-proof/`
3. Django returns JSON with batch info
4. Frontend shows: "Payment queued for Afternoon Batch processing on July 6, 2025 at 2:00 PM"

The error should now be completely resolved! 🎉
