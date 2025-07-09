// Get API base URL from env
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";
/**
 * Utility functions for API error handling
 */

export interface ApiErrorResponse {
  detail?: string
  error?: string
  message?: string
  non_field_errors?: string[]
  [key: string]: any  // Allow for field-specific errors
}

/**
 * Handle API response errors with proper JSON/HTML error handling
 */
export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `Request failed: ${response.status} ${response.statusText}`
    
    try {
      // Clone the response so we can read the body multiple times if needed
      const responseClone = response.clone()
      const contentType = response.headers.get('content-type')
      
      if (contentType && contentType.includes('application/json')) {
        const errorData: ApiErrorResponse = await response.json()
        
        // Handle different error formats from Django REST Framework
        if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors)) {
          // DRF validation errors with non_field_errors
          errorMessage = errorData.non_field_errors[0]
        } else if (errorData.detail) {
          // Standard DRF error detail
          errorMessage = errorData.detail
        } else if (errorData.error) {
          // Custom error field
          errorMessage = errorData.error
        } else if (errorData.message) {
          // Custom message field
          errorMessage = errorData.message
        } else {
          // Check for field-specific errors
          const fieldErrors = Object.keys(errorData)
            .filter(key => key !== 'status_code' && Array.isArray(errorData[key]))
            .map(key => `${key}: ${errorData[key][0]}`)
          
          if (fieldErrors.length > 0) {
            errorMessage = fieldErrors[0]
          }
        }
      } else {
        // If response is not JSON (e.g., HTML error page), get the text
        const errorText = await responseClone.text()
        console.error('Non-JSON error response:', errorText.substring(0, 200) + '...')
        
        // Check if it's an HTML error page (Django error page)
        if (errorText.includes('<!DOCTYPE') || errorText.includes('<html')) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        } else {
          errorMessage = errorText.substring(0, 100) || errorMessage
        }
      }
    } catch (error) {
      console.error('Failed to read error response:', error)
    }
    
    throw new Error(errorMessage)
  }
  
  return response.json()
}

/**
 * Enhanced auth headers with better debugging
 */
export function getAuthHeaders(): { [key: string]: string } {
  const headers: { [key: string]: string } = {
    'Content-Type': 'application/json',
  }
  
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token')
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
      console.log('Authorization header set with token:', token.substring(0, 20) + '...')
    } else {
      console.warn('No access token found in localStorage')
    }
  }
  
  return headers
}
