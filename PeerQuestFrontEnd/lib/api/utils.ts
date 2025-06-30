/**
 * Utility functions for API error handling
 */

export interface ApiErrorResponse {
  detail?: string
  error?: string
  message?: string
}

/**
 * Handle API response errors with proper JSON/HTML error handling
 */
export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `Request failed: ${response.status} ${response.statusText}`
    
    try {
      const errorData: ApiErrorResponse = await response.json()
      errorMessage = errorData.detail || errorData.error || errorData.message || errorMessage
    } catch (jsonError) {
      // If response is not JSON (e.g., HTML error page), get the text
      try {
        const errorText = await response.text()
        console.error('Non-JSON error response:', errorText.substring(0, 200) + '...')
        
        // Check if it's an HTML error page (Django error page)
        if (errorText.includes('<!DOCTYPE') || errorText.includes('<html')) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        } else {
          errorMessage = errorText.substring(0, 100) || errorMessage
        }
      } catch (textError) {
        console.error('Failed to read error response:', textError)
      }
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
