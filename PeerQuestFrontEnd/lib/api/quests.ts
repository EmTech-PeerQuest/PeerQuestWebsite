import { Quest } from '@/lib/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

// Helper function to get headers with authentication
const getAuthHeaders = () => {
  const headers: { [key: string]: string } = {
    'Content-Type': 'application/json',
  }
  
  // Add authentication token if available
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token')
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }
  
  return headers
}

// Types for API responses
export interface QuestListResponse {
  results: Quest[]
  count: number
  next: string | null
  previous: string | null
}

export interface QuestCategory {
  id: number
  name: string
  description?: string
  created_at: string
}

export interface QuestParticipant {
  id: number
  user: {
    id: number
    username: string
    email: string
    level?: number
    xp?: number
  }
  quest_title: string
  status: 'joined' | 'in_progress' | 'completed' | 'dropped'
  joined_at: string
  completed_at?: string
  progress_notes: string
}

export interface QuestSubmission {
  id: number
  participant_username: string
  quest_title: string
  submission_text: string
  submission_files: string[]
  status: 'pending' | 'approved' | 'rejected' | 'needs_revision'
  feedback: string
  submitted_at: string
  reviewed_at?: string
  reviewed_by_username?: string
}

export interface QuestFilters {
  search?: string
  category?: string | number
  difficulty?: string
  status?: string
  creator?: string | number
  available_only?: boolean
}

export interface CreateQuestData {
  title: string
  description: string
  category: number
  difficulty: 'easy' | 'medium' | 'hard'
  estimated_time: number
  max_participants: number
  due_date?: string
  requirements?: string
  resources?: string
}

export interface UpdateQuestData extends Partial<CreateQuestData> {
  status?: 'open' | 'in-progress' | 'completed'
}

// Quest API Service
export const QuestAPI = {
  // Quest CRUD operations
  async getQuests(filters: QuestFilters = {}): Promise<QuestListResponse> {
    const searchParams = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString())
      }
    })

    const response = await fetch(
      `${API_BASE_URL}/quests/quests/?${searchParams}`,
      {
        headers: getAuthHeaders(),
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch quests: ${response.statusText}`)
    }

    return response.json()
  },

  async getQuest(slug: string): Promise<Quest> {
    const response = await fetch(`${API_BASE_URL}/quests/quests/${slug}/`, {
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch quest: ${response.statusText}`)
    }

    return response.json()
  },

  async createQuest(questData: CreateQuestData): Promise<Quest> {
    const response = await fetch(`${API_BASE_URL}/quests/quests/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(questData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to create quest: ${error.detail || response.statusText}`)
    }

    return response.json()
  },

  async updateQuest(slug: string, questData: UpdateQuestData): Promise<Quest> {
    const response = await fetch(`${API_BASE_URL}/quests/quests/${slug}/`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(questData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to update quest: ${error.detail || response.statusText}`)
    }

    return response.json()
  },

  async deleteQuest(slug: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/quests/quests/${slug}/`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to delete quest: ${response.statusText}`)
    }
  },

  // Quest participation
  async joinQuest(slug: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/quests/quests/${slug}/join_quest/`, {
      method: 'POST',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to join quest: ${error.detail || error.error || response.statusText}`)
    }

    return response.json()
  },

  async leaveQuest(slug: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/quests/quests/${slug}/leave_quest/`, {
      method: 'POST',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to leave quest: ${error.detail || error.error || response.statusText}`)
    }

    return response.json()
  },

  // User's quests
  async getMyQuests(type: 'all' | 'created' | 'participating' = 'all'): Promise<Quest[]> {
    const response = await fetch(`${API_BASE_URL}/quests/quests/my_quests/?type=${type}`, {
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch my quests: ${response.statusText}`)
    }

    return response.json()
  },

  // Quest categories
  async getCategories(): Promise<QuestCategory[]> {
    const response = await fetch(`${API_BASE_URL}/quests/categories/`, {
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.statusText}`)
    }

    return response.json()
  },

  async createCategory(categoryData: { name: string; description?: string }): Promise<QuestCategory> {
    const response = await fetch(`${API_BASE_URL}/quests/categories/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(categoryData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to create category: ${error.detail || response.statusText}`)
    }

    return response.json()
  },

  // Quest participants
  async getQuestParticipants(slug: string): Promise<QuestParticipant[]> {
    const response = await fetch(`${API_BASE_URL}/quests/quests/${slug}/participants/`, {
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch quest participants: ${response.statusText}`)
    }

    return response.json()
  },

  // Quest submissions
  async getQuestSubmissions(slug: string): Promise<QuestSubmission[]> {
    const response = await fetch(`${API_BASE_URL}/quests/quests/${slug}/submissions/`, {
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch quest submissions: ${response.statusText}`)
    }

    return response.json()
  },

  async createQuestSubmission(
    slug: string,
    submissionData: { quest_participant: number; submission_text: string; submission_files?: string[] }
  ): Promise<QuestSubmission> {
    const response = await fetch(`${API_BASE_URL}/quests/quests/${slug}/submissions/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(submissionData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to create submission: ${error.detail || response.statusText}`)
    }

    return response.json()
  },

  async reviewSubmission(
    submissionId: number,
    reviewData: { status: 'approved' | 'rejected' | 'needs_revision'; feedback: string }
  ): Promise<QuestSubmission> {
    const response = await fetch(`${API_BASE_URL}/quests/submissions/${submissionId}/review/`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(reviewData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to review submission: ${error.detail || response.statusText}`)
    }

    return response.json()
  },

  // Quest search
  async searchQuests(searchParams: {
    search?: string
    available_only?: boolean
  }): Promise<Quest[]> {
    const params = new URLSearchParams()
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString())
      }
    })

    const response = await fetch(`${API_BASE_URL}/quests/search/?${params}`, {
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to search quests: ${response.statusText}`)
    }

    return response.json()
  },

  // Quest statistics
  async getQuestStats(): Promise<{
    created_quests: number
    participating_quests: number
    completed_quests: number
    total_xp_earned: number
  }> {
    const response = await fetch(`${API_BASE_URL}/quests/stats/`, {
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch quest stats: ${response.statusText}`)
    }

    return response.json()
  },
}
