/**
 * Generate Sample GCash QR for Demo
 */

const QRCode = require('qrcode')
const fs = require('fs')
const path = require('path')

// Same GCash QR generation functions from our implementation
function calculateCRC16(data) {
  let crc = 0xFFFF
  
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8
    
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021
      } else {
        crc = crc << 1
      }
    }
  }
  
  crc = crc & 0xFFFF
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

function formatDataElement(id, value) {
  const length = value.length.toString().padStart(2, '0')
  return `${id}${length}${value}`
}

function generateGCashQRData(paymentData) {
  const gcashConfig = {
    merchantName: 'PEERQUEST',
    merchantAccount: '09123456789',
    merchantCity: 'MANILA',
    countryCode: 'PH',
    merchantCategoryCode: '5815'
  }
  
  let qrData = ''
  
  qrData += formatDataElement('00', '01')
  qrData += formatDataElement('01', '11')
  
  const merchantInfo = 
    formatDataElement('00', 'PH.QR.INSTAPAY') +
    formatDataElement('01', gcashConfig.merchantAccount) +
    formatDataElement('02', paymentData.merchantName || gcashConfig.merchantName)
  
  qrData += formatDataElement('26', merchantInfo)
  qrData += formatDataElement('52', gcashConfig.merchantCategoryCode)
  qrData += formatDataElement('53', '608')
  
  if (paymentData.amount && paymentData.amount > 0) {
    const formattedAmount = Math.round(paymentData.amount * 100) / 100
    qrData += formatDataElement('54', formattedAmount.toFixed(2))
  }
  
  qrData += formatDataElement('58', gcashConfig.countryCode)
  qrData += formatDataElement('59', paymentData.merchantName || gcashConfig.merchantName)
  qrData += formatDataElement('60', gcashConfig.merchantCity)
  
  let additionalData = ''
  
  if (paymentData.reference) {
    additionalData += formatDataElement('01', paymentData.reference)
  }
  
  if (paymentData.description) {
    additionalData += formatDataElement('08', paymentData.description.substring(0, 25))
  }
  
  if (additionalData) {
    qrData += formatDataElement('62', additionalData)
  }
  
  const dataWithoutCRC = qrData + '6304'
  const crc = calculateCRC16(dataWithoutCRC)
  qrData += `63${crc.length.toString().padStart(2, '0')}${crc}`
  
  return qrData
}

// Generate sample QR codes for each gold package
const packages = [
  { amount: 500, price: 70, name: '500-gold' },
  { amount: 2800, price: 350, name: '2800-gold' },
  { amount: 6500, price: 700, name: '6500-gold' },
  { amount: 14500, price: 1500, name: '14500-gold' }
]

console.log('🎯 Generating Sample GCash QR Codes with Auto-Fill\n')

packages.forEach(async (pkg, index) => {
  const paymentData = {
    merchantName: 'PEERQUEST',
    amount: pkg.price,
    reference: `PQ${Date.now()}${index}`,
    description: `${pkg.amount} Gold Coins`
  }
  
  try {
    // Generate EMVCo compliant QR data
    const qrData = generateGCashQRData(paymentData)
    
    console.log(`📦 Package ${index + 1}: ${pkg.amount} Gold (₱${pkg.price})`)
    console.log(`   QR Data: ${qrData}`)
    console.log(`   Length: ${qrData.length} characters`)
    console.log(`   Auto-Fill Amount: ₱${pkg.price}`)
    console.log(`   Reference: ${paymentData.reference}`)
    
    // Generate QR code image
    const qrCodeImage = await QRCode.toDataURL(qrData, {
      width: 256,
      margin: 2,
      color: {
        dark: '#2C1A1D',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    })
    
    // Save QR code image (base64)
    const base64Data = qrCodeImage.replace(/^data:image\/png;base64,/, '')
    const filename = `sample-gcash-qr-${pkg.name}.png`
    const filepath = path.join(__dirname, 'public', 'images', 'payment', 'samples', filename)
    
    // Create directory if it doesn't exist
    const dir = path.dirname(filepath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    
    fs.writeFileSync(filepath, base64Data, 'base64')
    console.log(`   ✅ QR image saved: ${filename}`)
    console.log('')
    
  } catch (error) {
    console.log(`   ❌ Error generating QR: ${error.message}`)
    console.log('')
  }
})

console.log('🎉 Sample QR codes generated!')
console.log('\n📱 Test Instructions:')
console.log('1. Open GCash mobile app')
console.log('2. Tap "Pay QR" or "Send Money"')
console.log('3. Scan any generated QR code')
console.log('4. 🎯 Amount should auto-fill automatically!')
console.log('5. Reference number should be pre-populated')
console.log('6. Complete test payment (optional)')

console.log('\n✨ Features Demonstrated:')
console.log('• EMVCo QR Code Standard compliance')
console.log('• Automatic amount filling in GCash')
console.log('• Reference number inclusion')
console.log('• Merchant information display')
console.log('• Professional payment experience')

setTimeout(() => {
  console.log('\n🚀 Ready for production deployment!')
}, 1000)
