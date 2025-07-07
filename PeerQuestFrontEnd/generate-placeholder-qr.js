const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// Sample GCash payment information - replace with your actual details
const gcashInfo = {
  name: "PeerQuest Philippines",
  number: "+63 9XX XXX XXXX", // Replace with your GCash number
  note: "PeerQuest Gold Purchase"
};

const qrData = `GCash Payment\nName: ${gcashInfo.name}\nNumber: ${gcashInfo.number}\nNote: ${gcashInfo.note}`;

// Generate placeholder QR code
QRCode.toFile(
  path.join(__dirname, 'public', 'images', 'payment', 'gcash-qr.png'),
  qrData,
  {
    width: 256,
    margin: 2,
    color: {
      dark: '#2C1A1D',
      light: '#FFFFFF'
    }
  },
  (err) => {
    if (err) {
      console.error('Error generating QR code:', err);
    } else {
      console.log('✅ Placeholder GCash QR code generated successfully!');
      console.log('📍 Location: public/images/payment/gcash-qr.png');
      console.log('📝 Replace this with your actual GCash QR code');
    }
  }
);
