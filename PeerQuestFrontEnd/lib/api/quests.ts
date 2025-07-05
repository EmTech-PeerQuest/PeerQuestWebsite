
import { Quest } from '@/lib/types'
import { fetchWithAuth } from '@/lib/auth'

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

export interface QuestListResponse {
  results?: Quest[]
  value?: Quest[]
  count: number
  next?: string | null
  previous?: string | null
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

export type DifficultyTier = 'initiate' | 'adventurer' | 'champion' | 'mythic';
export interface CreateQuestData {
  title: string
  description: string
  category: number
  difficulty: DifficultyTier
  due_date?: string
  requirements?: string
  resources?: string
  gold_reward?: number
}

export interface UpdateQuestData extends Partial<CreateQuestData> {
  status?: 'open' | 'in-progress' | 'completed'
}

// Quest API Service
export const QuestAPI = {
  // Quest CRUD operations
  // Duplicate getQuests removed

  /**
   * Submit completed work for a quest (adventurer submission)
   * @param params Object containing questParticipantId, submissionText, submissionLink, files
   */
  async submitQuestWork(params: {
    questSlug: string;
    questParticipantId?: number;
    applicationId?: number;
    submissionText: string;
    submissionLink?: string;
    files?: File[];
  }): Promise<QuestSubmission> {
    const { questSlug, questParticipantId, applicationId, submissionText, submissionLink, files = [] } = params;
    const formData = new FormData();
    if (questParticipantId) {
      formData.append("quest_participant", String(questParticipantId));
    }
    if (applicationId) {
      formData.append("application", String(applicationId));
    }
    // Combine text and link if link is provided
    let text = submissionText;
    if (submissionLink) {
      text = text ? text + "\nLink: " + submissionLink : submissionLink;
    }
    formData.append("submission_text", text);
    files.forEach((file) => formData.append("files", file));
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const response = await fetchWithAuth(
      `${API_BASE_URL}/quests/quests/${questSlug}/submissions/`,
      {
        method: "POST",
        body: formData,
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }
    );
    if (!response.ok) {
      let errorMsg = "Failed to submit work.";
      let errorObj: any = {};
      try {
        // Try to parse JSON error
        const err = await response.json();
        // If the error object is empty, set a user-friendly message
        if (err && Object.keys(err).length === 0) {
          errorMsg = "Submission failed. The server did not return details. Please check your files and try again, or contact support if the problem persists.";
          errorObj = { detail: errorMsg };
        } else {
          errorMsg = err?.detail || errorMsg;
          errorObj = err;
        }
      } catch (jsonErr) {
        // If not JSON, try to get text
        try {
          const text = await response.text();
          if (text && text.trim().length > 0) {
            errorMsg = text;
            errorObj = { detail: text };
          } else {
            errorMsg = "Submission failed. The server did not return details. Please check your files and try again, or contact support if the problem persists.";
            errorObj = { detail: errorMsg };
          }
        } catch {
          errorMsg = "Submission failed due to an unknown error. Please try again or contact support.";
          errorObj = { detail: errorMsg };
        }
      }
      // Log full backend error for debugging
      // eslint-disable-next-line no-console
      console.error("Backend submission error:", errorObj);
      // Throw the full error object for the modal to handle
      const error = new Error(errorMsg);
      (error as any).backend = errorObj;
      throw error;
    }
    return response.json();
  },
  // Quest CRUD operations
  async getQuests(filters: QuestFilters = {}): Promise<QuestListResponse> {
    const searchParams = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString())
      }
    })

    const response = await fetchWithAuth(
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
    const response = await fetchWithAuth(`${API_BASE_URL}/quests/quests/${slug}/`, {
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch quest: ${response.statusText}`)
    }

    return response.json()
  },

  async createQuest(questData: CreateQuestData): Promise<Quest> {
    try {
      // Ensure gold_reward is properly formatted as a number
      const formattedData = {
        ...questData,
        gold_reward: questData.gold_reward != null ? Number(questData.gold_reward) : 0
      };
      
      console.log('Creating quest with formatted data:', formattedData)
      
      const response = await fetchWithAuth(`${API_BASE_URL}/quests/quests/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(formattedData),
      })

      if (!response.ok) {
        // Try to parse the error response
        let errorData;
        try {
          errorData = await response.json()
          console.error('Quest creation error response:', errorData, 'Status:', response.status)
        } catch (parseError) {
          console.error('Could not parse error response:', parseError)
          throw new Error(`Failed to create quest: Server returned ${response.status} ${response.statusText}`)
        }
        
        // Format error messages for field-specific errors
        if (typeof errorData === 'object') {
          // Return the error directly so the component can handle specific field errors
          throw new Error(`Failed to create quest: ${JSON.stringify(errorData)}`)
        } else {
          throw new Error(`Failed to create quest: ${JSON.stringify(errorData)}`)
        }
      }

      return response.json()
    } catch (error) {
      console.error('Quest creation failed:', error)
      throw error
    }
  },

  async updateQuest(slug: string, questData: UpdateQuestData): Promise<Quest> {
    const response = await fetchWithAuth(`${API_BASE_URL}/quests/quests/${slug}/`, {
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
    const response = await fetchWithAuth(`${API_BASE_URL}/quests/quests/${slug}/`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      let errorMessage = `Failed to delete quest: ${response.statusText}`
      
      try {
        const errorData = await response.json()
        if (errorData.error) {
          errorMessage = errorData.error
        }
      } catch (e) {
        // If response doesn't contain JSON, use the status text
      }
      
      throw new Error(errorMessage)
    }
  },

  // Quest participation
  async joinQuest(slug: string): Promise<{ message: string }> {
    const response = await fetchWithAuth(`${API_BASE_URL}/quests/quests/${slug}/join_quest/`, {
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
    const response = await fetchWithAuth(`${API_BASE_URL}/quests/quests/${slug}/leave_quest/`, {
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
    const response = await fetchWithAuth(`${API_BASE_URL}/quests/quests/my_quests/?type=${type}`, {
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
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Don't include auth headers for categories since it's public
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.status} ${response.statusText}`)
    }

    return response.json()
  },

  async createCategory(categoryData: { name: string; description?: string }): Promise<QuestCategory> {
    const response = await fetchWithAuth(`${API_BASE_URL}/quests/categories/`, {
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
    const response = await fetchWithAuth(`${API_BASE_URL}/quests/quests/${slug}/participants/`, {
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch quest participants: ${response.statusText}`)
    }

    return response.json()
  },

  // Quest submissions
  async getQuestSubmissions(slug: string): Promise<QuestSubmission[]> {
    const response = await fetchWithAuth(`${API_BASE_URL}/quests/quests/${slug}/submissions/`, {
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
    const response = await fetchWithAuth(`${API_BASE_URL}/quests/quests/${slug}/submissions/`, {
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
    const response = await fetchWithAuth(`${API_BASE_URL}/quests/submissions/${submissionId}/review/`, {
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

    const response = await fetchWithAuth(`${API_BASE_URL}/quests/search/?${params}`, {
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
    const response = await fetchWithAuth(`${API_BASE_URL}/quests/stats/`, {
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch quest stats: ${response.statusText}`)
    }

    return response.json()
  },

  /**
   * Update quest status by quest ID
   */
  async updateQuestStatus(questSlug: string, status: 'open' | 'in-progress' | 'completed'): Promise<Quest> {
    const response = await fetchWithAuth(`${API_BASE_URL}/quests/quests/${questSlug}/`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to update quest status: ${error.detail || response.statusText}`);
    }
    return response.json();
  },
}
