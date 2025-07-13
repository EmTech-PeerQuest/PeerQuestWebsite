/**
 * GCash QR Code Generator
 * 
 * This module implements the GCash QR Ph standard for generating QR codes
 * that automatically fill in payment amounts when scanned by GCash app.
 * 
 * GCash QR Ph Format:
 * - Follows EMVCo QR Code Specification
 * - Uses specific data elements for merchant info and transaction details
 * - Auto-fills amount when scanned by GCash
 */

interface GCashQRData {
  merchantName: string
  merchantAccount: string
  amount: number
  currency?: string
  reference?: string
  description?: string
}

interface GCashQRConfig {
  merchantName: string
  merchantAccount: string
  merchantCity: string
  countryCode: string
  merchantCategoryCode: string
}

// Default GCash configuration
const DEFAULT_GCASH_CONFIG: GCashQRConfig = {
  merchantName: "MARK JOHN WATEY", // Your actual GCash account name (unmasked version)
  merchantAccount: "09951723524", // Your actual GCash merchant number
  merchantCity: "MANILA",
  countryCode: "PH",
  merchantCategoryCode: "0000" // General/Unspecified - Safe default for any business
}

/**
 * Merchant Category Codes (MCC) Reference
 * 
 * Common codes you can use based on your business type:
 * - "0000" - General/Unspecified (Safe default for any business)
 * - "5999" - Miscellaneous Retail Stores
 * - "7372" - Computer Programming Services  
 * - "7379" - Computer Maintenance & Repair Services
 * - "5815" - Digital Goods/Gaming (if you have gaming license)
 * - "5734" - Computer Software Stores
 * - "8999" - Professional Services
 * 
 * Note: If you don't have a specific MCC from GCash, use "0000" which works for all businesses.
 * You can update this later when you get your official merchant category from GCash.
 */

/**
 * Calculates CRC16 checksum for EMVCo QR standard
 */
function calculateCRC16(data: string): string {
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

/**
 * Formats data with length prefix as required by EMVCo standard
 */
function formatDataElement(id: string, value: string): string {
  const length = value.length.toString().padStart(2, '0')
  return `${id}${length}${value}`
}

/**
 * Generates GCash QR Ph compliant QR code data
 */
export function generateGCashQRData(
  paymentData: GCashQRData,
  config: Partial<GCashQRConfig> = {}
): string {
  const gcashConfig = { ...DEFAULT_GCASH_CONFIG, ...config }
  
  // EMVCo QR Code Data Elements
  let qrData = ''
  
  // Payload Format Indicator (00)
  qrData += formatDataElement('00', '01')
  
  // Point of Initiation Method (01) - Static QR
  qrData += formatDataElement('01', '11')
  
  // Merchant Account Information (26-51 range for domestic)
  // Using 26 for GCash Philippines
  const merchantInfo = 
    formatDataElement('00', 'PH.QR.INSTAPAY') + // Domain
    formatDataElement('01', gcashConfig.merchantAccount) + // Mobile number
    formatDataElement('02', paymentData.merchantName || gcashConfig.merchantName) // Merchant name
  
  qrData += formatDataElement('26', merchantInfo)
  
  // Merchant Category Code (52)
  qrData += formatDataElement('52', gcashConfig.merchantCategoryCode)
  
  // Transaction Currency (53) - PHP = 608
  qrData += formatDataElement('53', '608')
  
  // Transaction Amount (54) - Include if amount is specified
  if (paymentData.amount && paymentData.amount > 0) {
    // Format amount with exactly 2 decimal places for consistency
    const formattedAmount = Math.round(paymentData.amount * 100) / 100
    qrData += formatDataElement('54', formattedAmount.toFixed(2))
  }
  
  // Country Code (58)
  qrData += formatDataElement('58', gcashConfig.countryCode)
  
  // Merchant Name (59)
  qrData += formatDataElement('59', paymentData.merchantName || gcashConfig.merchantName)
  
  // Merchant City (60)
  qrData += formatDataElement('60', gcashConfig.merchantCity)
  
  // Additional Data Field Template (62) - Optional fields
  let additionalData = ''
  
  if (paymentData.reference) {
    // Bill Number/Reference (01)
    additionalData += formatDataElement('01', paymentData.reference)
  }
  
  if (paymentData.description) {
    // Purpose of Transaction (08)
    additionalData += formatDataElement('08', paymentData.description.substring(0, 25))
  }
  
  if (additionalData) {
    qrData += formatDataElement('62', additionalData)
  }
  
  // CRC (63) - Must be calculated last
  const dataWithoutCRC = qrData + '6304'
  const crc = calculateCRC16(dataWithoutCRC)
  qrData += `63${crc.length.toString().padStart(2, '0')}${crc}`
  
  return qrData
}

/**
 * Validates if a string is a valid GCash QR Ph format
 */
export function validateGCashQR(qrData: string): boolean {
  try {
    // Basic format validation
    if (!qrData || qrData.length < 50) return false
    
    // Check for required elements
    const hasPayloadFormat = qrData.includes('0002')
    const hasPointOfInitiation = qrData.includes('0102')
    const hasMerchantInfo = qrData.includes('26')
    const hasCountryCode = qrData.includes('58')
    const hasCRC = qrData.includes('63')
    
    return hasPayloadFormat && hasPointOfInitiation && hasMerchantInfo && hasCountryCode && hasCRC
  } catch {
    return false
  }
}

/**
 * Extracts payment amount from GCash QR code if present
 */
export function extractAmountFromGCashQR(qrData: string): number | null {
  try {
    // Look for transaction amount field (54)
    const amountMatch = qrData.match(/54\d{2}(\d+\.?\d*)/)
    if (amountMatch && amountMatch[1]) {
      return parseFloat(amountMatch[1])
    }
    return null
  } catch {
    return null
  }
}

/**
 * Configuration for different environments
 */
export const GCASH_QR_CONFIGS = {
  production: {
    merchantName: "PEERQUEST",
    merchantAccount: "09123456789", // Your actual GCash business number
    merchantCity: "MANILA",
    countryCode: "PH",
    merchantCategoryCode: "0000" // General/Unspecified - Safe default
  },
  staging: {
    merchantName: "PEERQUEST-TEST",
    merchantAccount: "09123456789",
    merchantCity: "MANILA", 
    countryCode: "PH",
    merchantCategoryCode: "0000" // General/Unspecified - Safe default
  },
  development: {
    merchantName: "PEERQUEST-DEV",
    merchantAccount: "09123456789",
    merchantCity: "MANILA",
    countryCode: "PH", 
    merchantCategoryCode: "0000" // General/Unspecified - Safe default
  }
}

/**
 * Gets the appropriate config based on environment
 */
export function getGCashConfig(): GCashQRConfig {
  const env = process.env.NODE_ENV || 'development'
  return GCASH_QR_CONFIGS[env as keyof typeof GCASH_QR_CONFIGS] || GCASH_QR_CONFIGS.development
}
