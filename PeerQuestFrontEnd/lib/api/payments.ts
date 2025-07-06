import { fetchWithAuth } from '@/lib/auth'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

export interface PaymentProofData {
  payment_reference: string
  package_amount: number
  package_price: number
  bonus?: string
  receipt: File
}

export interface PaymentSubmissionResponse {
  success: boolean
  message: string
  batch_info?: {
    batch_name: string
    processing_time: string
    batch_id: string
  }
  payment?: any
}

export const PaymentAPI = {
  /**
   * Submit payment proof for verification
   */
  async submitPaymentProof(data: PaymentProofData): Promise<PaymentSubmissionResponse> {
    try {
      console.log('🔍 Submitting payment proof...');
      
      const formData = new FormData()
      formData.append('payment_reference', data.payment_reference)
      formData.append('package_amount', data.package_amount.toString())
      formData.append('package_price', data.package_price.toString())
      formData.append('bonus', data.bonus || '')
      formData.append('receipt', data.receipt)

      const response = await fetch(`${API_BASE_URL}/payments/submit-proof/`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Payment proof submitted successfully');
        return result
      } else {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const error = await response.json()
          throw new Error(error.message || 'Failed to submit payment proof')
        } else {
          // Handle HTML error pages (Django error pages)
          const errorText = await response.text()
          console.error('Server returned HTML error:', errorText)
          throw new Error(`Server error (${response.status}): Please ensure the Django backend is running on http://localhost:8000`)
        }
      }
    } catch (error) {
      console.error('❌ Error submitting payment proof:', error);
      throw error;
    }
  },

  /**
   * Get user's payment history
   */
  async getMyPayments(): Promise<any[]> {
    try {
      console.log('🔍 Fetching payment history...');
      
      const response = await fetchWithAuth(`${API_BASE_URL}/payments/my-payments/`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch payments: ${response.status} ${response.statusText}`)
      }
      
      const result = await response.json()
      
      if (result.payments) {
        console.log('✅ Payment history fetched successfully');
        return result.payments
      }
      
      return []
    } catch (error) {
      console.error('❌ Error fetching payment history:', error);
      throw error;
    }
  },

  /**
   * Get payment status by reference
   */
  async getPaymentStatus(paymentReference: string): Promise<any> {
    try {
      console.log('🔍 Fetching payment status for:', paymentReference);
      
      const response = await fetchWithAuth(`${API_BASE_URL}/payments/status/${paymentReference}/`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch payment status: ${response.status} ${response.statusText}`)
      }
      
      const result = await response.json()
      
      if (result.payment) {
        console.log('✅ Payment status fetched successfully');
        return result.payment
      }
      
      return null
    } catch (error) {
      console.error('❌ Error fetching payment status:', error);
      throw error;
    }
  }
}
