# Email Setup Troubleshooting Guide

## Gmail App Passwords Not Visible?

### Why "App passwords" might not be visible:

1. **2-Factor Authentication (2FA) not enabled**: App passwords only appear when 2FA is turned on
2. **Personal Google Account vs Work/School Account**: Work/school accounts managed by organizations may have this disabled
3. **Advanced Protection Program**: If enrolled, app passwords are disabled for security
4. **Account type restrictions**: Some Google account types don't support app passwords
5. **Recent Google changes**: Google is phasing out app passwords for some account types

## QUICK FIX: Alternative Email Providers (Recommended)

### Option 1: Outlook/Hotmail (EASIEST)
```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your_email@outlook.com
EMAIL_HOST_PASSWORD=your_password
```

1. Create a new Outlook account at outlook.com
2. Use your regular password (no app password needed)
3. Update your `.env` file with the settings above

### Option 2: Yahoo Mail
```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your_email@yahoo.com
EMAIL_HOST_PASSWORD=your_app_password
```

1. Go to Yahoo Account Security
2. Generate an app password
3. Use the app password in your `.env`

### Option 3: Development Email Services (For Testing)

#### Mailtrap (Free Development Email Testing)
```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your_mailtrap_username
EMAIL_HOST_PASSWORD=your_mailtrap_password
```

1. Sign up at mailtrap.io (free)
2. Get your credentials from the dashboard
3. Emails will be captured in Mailtrap's inbox (won't go to real emails)

## Gmail Solutions (If you want to persist)

### Step 1: Enable 2FA
1. Go to https://myaccount.google.com/security
2. Click "2-Step Verification"
3. Follow the setup process
4. **Important**: Wait 10-15 minutes after enabling 2FA

### Step 2: Generate App Password
1. Go back to https://myaccount.google.com/security
2. Look for "App passwords" (should now be visible)
3. If still not visible, try:
   - Refresh the page
   - Clear browser cache
   - Try a different browser
   - Wait longer (sometimes takes up to 24 hours)

### Step 3: Alternative Gmail Access
If app passwords still don't appear:
1. Try using your regular Gmail password with "Less secure app access" (deprecated but sometimes works)
2. Consider using OAuth2 (more complex setup)

## Current Status Check

Your system is currently using the file email backend, which means:
- ✅ Email verification is working
- ✅ Emails are being saved to `sent_emails/` folder
- ❌ No real emails are being sent

To switch to real email delivery, update your `.env` file with one of the options above and restart your Django server.
