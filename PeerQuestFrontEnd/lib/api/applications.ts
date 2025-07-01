import { Application } from '@/lib/types'
import { handleApiResponse, getAuthHeaders } from './utils'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

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
    
    if (response.status === 401) {
      throw new Error('Authentication required. Please log in.')
    }
    
    const data: ApplicationListResponse = await handleApiResponse<ApplicationListResponse>(response)
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
    
    if (response.status === 401) {
      throw new Error('Authentication required. Please log in.')
    }
    
    const data: ApplicationListResponse = await handleApiResponse<ApplicationListResponse>(response)
    return data.results
  } catch (error) {
    console.error('Error fetching applications to my quests:', error)
    throw error
  }
}

// Create a new application
export const createApplication = async (questId: number): Promise<Application> => {
  try {
    console.log('📤 API Call - Creating application:', {
      questId: questId,
      apiUrl: `${API_BASE_URL}/applications/`
    })
    
    const response = await fetch(`${API_BASE_URL}/applications/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        quest: questId,
      }),
    })
    
    const result = await handleApiResponse<Application>(response)
    console.log('✅ API Response - Application created:', result)
    return result
  } catch (error) {
    console.error('❌ API Error - Failed to create application:', error)
    throw error
  }
}

// Approve an application
export const approveApplication = async (applicationId: number): Promise<Application> => {
  try {
    console.log('🟢 API: Approving application', applicationId)
    const response = await fetch(`${API_BASE_URL}/applications/${applicationId}/approve/`, {
      method: 'POST',
      headers: getAuthHeaders(),
    })
    
    const result = await handleApiResponse<Application>(response)
    console.log('✅ API: Application approved successfully', result)
    return result
  } catch (error) {
    console.error('❌ API: Error approving application:', error)
    throw error
  }
}

// Reject an application
export const rejectApplication = async (applicationId: number): Promise<Application> => {
  try {
    console.log('🔴 API: Rejecting application', applicationId)
    const response = await fetch(`${API_BASE_URL}/applications/${applicationId}/reject/`, {
      method: 'POST',
      headers: getAuthHeaders(),
    })
    
    const result = await handleApiResponse<Application>(response)
    console.log('✅ API: Application rejected successfully', result)
    return result
  } catch (error) {
    console.error('❌ API: Error rejecting application:', error)
    throw error
  }
}
