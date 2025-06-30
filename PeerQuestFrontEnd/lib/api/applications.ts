import { Application } from '@/lib/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

// Helper function to get headers with authentication
const getAuthHeaders = () => {
  const headers: { [key: string]: string } = {
    'Content-Type': 'application/json',
  }
  
  // Add authentication token if available
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token')
    console.log('Auth token found:', token ? 'Yes' : 'No')
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }
  
  return headers
}

export interface ApplicationListResponse {
  results: Application[]
  count: number
  next: string | null
  previous: string | null
}

// Get all applications (user's own applications)
export const getMyApplications = async (): Promise<Application[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/applications/my_applications/`, {
      headers: getAuthHeaders(),
    })
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in.')
      }
      throw new Error(`Failed to fetch applications: ${response.status} ${response.statusText}`)
    }
    
    const data: ApplicationListResponse = await response.json()
    return data.results
  } catch (error) {
    console.error('Error fetching my applications:', error)
    throw error
  }
}

// Get applications to user's quests
export const getApplicationsToMyQuests = async (): Promise<Application[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/applications/to_my_quests/`, {
      headers: getAuthHeaders(),
    })
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in.')
      }
      throw new Error(`Failed to fetch applications to my quests: ${response.status} ${response.statusText}`)
    }
    
    const data: ApplicationListResponse = await response.json()
    return data.results
  } catch (error) {
    console.error('Error fetching applications to my quests:', error)
    throw error
  }
}

// Create a new application
export const createApplication = async (questId: number, message: string): Promise<Application> => {
  try {
    const response = await fetch(`${API_BASE_URL}/applications/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        quest: questId,
        message: message,
      }),
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || `Failed to create application: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error creating application:', error)
    throw error
  }
}

// Approve an application
export const approveApplication = async (applicationId: number): Promise<Application> => {
  try {
    const response = await fetch(`${API_BASE_URL}/applications/${applicationId}/approve/`, {
      method: 'POST',
      headers: getAuthHeaders(),
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || `Failed to approve application: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error approving application:', error)
    throw error
  }
}

// Reject an application
export const rejectApplication = async (applicationId: number): Promise<Application> => {
  try {
    const response = await fetch(`${API_BASE_URL}/applications/${applicationId}/reject/`, {
      method: 'POST',
      headers: getAuthHeaders(),
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || `Failed to reject application: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error rejecting application:', error)
    throw error
  }
}
