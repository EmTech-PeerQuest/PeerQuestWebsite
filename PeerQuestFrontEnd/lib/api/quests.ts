import { Quest } from '@/lib/types'
import { fetchWithAuth } from '@/lib/api/auth'

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL + '/api';

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
  id: number;
  participant_username: string;
  quest_title: string;
  description: string;
  link?: string;
  submission_files: (string | { file: string })[];
  status: 'pending' | 'approved' | 'rejected' | 'needs_revision';
  feedback: string;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by_username?: string;
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
  gold_budget?: number // <-- Added for full deduction logic
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
    description: string;
    link?: string;
    files?: File[];
  }): Promise<QuestCompletionResult> {
    const { questSlug, questParticipantId, applicationId, description, link, files = [] } = params;
    
    console.log('submitQuestWork called with params:', params);
    
    if (!questSlug || typeof questSlug !== 'string' || !questSlug.trim()) {
      throw new Error('Quest slug is missing or invalid. Please contact support.');
    }
    const formData = new FormData();
    // Only send one of quest_participant, application, or quest_slug
    if (questParticipantId) {
      console.log('Adding quest_participant:', questParticipantId);
      formData.append("quest_participant", String(questParticipantId));
    } else if (applicationId) {
      console.log('Adding application:', applicationId);
      formData.append("application", String(applicationId));
    } else {
      console.log('Adding quest_slug fallback:', questSlug);
      formData.append("quest_slug", questSlug);
    }
    
    // Always add description - it's required
    if (description && description.trim()) {
      formData.append("description", description.trim());
    } else {
      throw new Error('Description is required for submission.');
    }
    
    if (link && link.trim()) {
      formData.append("link", link.trim());
    }
    files.forEach((file) => formData.append("files", file));
    
    // Debug: Log what's in the FormData
    console.log('FormData contents:');
    for (let [key, value] of formData.entries()) {
      console.log(key, ':', value instanceof File ? `File: ${value.name}` : value);
    }
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    
    console.log('Making API request to:', `${API_BASE_URL}/quests/quests/${questSlug}/submissions/`);
    console.log('Request headers:', token ? { Authorization: `Bearer ${token}` } : 'No auth token');
    
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
      // console.error("Backend submission error:", errorObj);
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
      let errorText = '';
      try {
        errorText = await response.text();
      } catch {}
      throw new Error(`Failed to fetch quests: ${response.statusText || errorText || 'Unknown error'}`);
    }

    return response.json();
  },

  async getQuest(slug: string): Promise<Quest> {
    const response = await fetchWithAuth(`${API_BASE_URL}/quests/quests/${slug}/`, {
      headers: getAuthHeaders(),
    })

    if (!response) {
      throw new Error('Authentication required')
    }

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
      
      console.log('🔍 Frontend: Creating quest with original data:', questData)
      console.log('🔍 Frontend: Creating quest with formatted data:', formattedData)
      console.log('🔍 Frontend: Data keys:', Object.keys(formattedData))
      console.log('🔍 Frontend: Category value:', formattedData.category, typeof formattedData.category)
      console.log('🔍 Frontend: Gold reward value:', formattedData.gold_reward, typeof formattedData.gold_reward)
      console.log('🔍 Frontend: Due date value:', formattedData.due_date, typeof formattedData.due_date)
      console.log('🔍 Frontend: Title value:', formattedData.title?.length, 'chars')
      console.log('🔍 Frontend: Description value:', formattedData.description?.length, 'chars')
      
      const response = await fetchWithAuth(`${API_BASE_URL}/quests/quests/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(formattedData),
      })

      if (!response) {
        throw new Error('Authentication required')
      }

      if (!response.ok) {
        // Try to parse the error response
        let errorData;
        try {
          // Try .json() if available, else .data, else text
          if (typeof response.json === 'function') {
            errorData = await response.json();
          } else if ('data' in response) {
            errorData = response.data;
          } else if (typeof response.text === 'function') {
            errorData = await response.text();
          } else {
            errorData = undefined;
          }
          console.error('🔍 Frontend: Quest creation error response:', errorData, 'Status:', response.status)
        } catch (parseError) {
          console.error('🔍 Frontend: Could not parse error response:', parseError)
          errorData = undefined;
        }
        // Format error messages for field-specific errors
        if (typeof errorData === 'object' && errorData !== null) {
          if (Object.keys(errorData).length === 0) {
            throw new Error(`Failed to create quest: Server returned ${response.status} ${response.statusText} with empty error response`)
          }
          Object.keys(errorData).forEach(field => {
            console.error(`🔍 Frontend: Field error - ${field}:`, errorData[field])
          })
          if (errorData.gold_reward) {
            const goldError = Array.isArray(errorData.gold_reward) 
              ? errorData.gold_reward[0] 
              : errorData.gold_reward
            throw new Error(`Gold Balance Error: ${goldError}`)
          }
          throw new Error(`Failed to create quest: ${JSON.stringify(errorData)}`)
        } else if (typeof errorData === 'string' && errorData.trim().length > 0) {
          throw new Error(`Failed to create quest: ${errorData}`);
        } else {
          throw new Error(`Failed to create quest: Server returned ${response.status} ${response.statusText}`);
        }
      }

      // Use .json() if available, else .data (for Axios)
      let responseData;
      if (typeof response.json === 'function') {
        responseData = await response.json();
      } else if ('data' in response) {
        responseData = response.data;
      } else {
        responseData = response;
      }
      console.log('✅ Frontend: Quest created successfully:', responseData)
      return responseData
    } catch (error: any) {
      console.error('❌ Frontend: Quest creation failed:', error)
      // Try to extract a meaningful error message
      let message =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        error?.message ||
        (typeof error === 'string' ? error : null) ||
        'Unknown error occurred while creating quest.';
      throw new Error(message);
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

  async deleteQuest(slug: string): Promise<{ amount_refunded?: number, new_balance?: number, message?: string }> {
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
      } catch (e) {}
      throw new Error(errorMessage)
    }
    // Return the backend's refund and balance info
    return response.json()
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
  async updateQuestStatus(questSlug: string, status: 'open' | 'in-progress' | 'completed' | 'failed'): Promise<Quest> {
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

  /**
   * Get the number of submissions used and the submission limit for a quest
   */
  async getSubmissionCount(questSlug: string): Promise<{ submissions_used: number, submission_limit: number }> {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/quests/quests/${questSlug}/submission_count/`,
      { method: 'GET' }
    );
    if (!response.ok) {
      return { submissions_used: 0, submission_limit: 5 }; // fallback
    }
    return response.json();
  },

  /**
   * Approve a submission
   */
  async approveSubmission(submissionId: number, feedback?: string): Promise<any> {
    const response = await fetchWithAuth(`${API_BASE_URL}/quests/submissions/${submissionId}/approve/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ feedback: feedback || '' }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to approve submission: ${error.detail || response.statusText}`);
    }
    return response.json();
  },

  /**
   * Mark submission as needing revision
   */
  async markSubmissionNeedsRevision(submissionId: number, feedback?: string): Promise<any> {
    const response = await fetchWithAuth(`${API_BASE_URL}/quests/submissions/${submissionId}/needs_revision/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ feedback: feedback || '' }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to mark submission as needing revision: ${error.detail || response.statusText}`);
    }
    return response.json();
  },

  // Quest completion
  async completeQuest(questSlug: string, completionData: {
    completion_reason: string;
    participant_results: Array<{
      user: string;
      xp_awarded: number;
      gold_awarded: number;
    }>;
    admin_award?: {
      user: string;
      xp_awarded: number;
      gold_awarded: number;
    };
  }): Promise<QuestCompletionResult> {
    const response = await fetchWithAuth(`${API_BASE_URL}/quests/quests/${questSlug}/complete/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(completionData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to complete quest: ${error.detail || response.statusText}`);
    }

    return response.json();
  },
}

// Participant management
export async function kickParticipant(participantId: number) {
  const res = await fetch(`/api/quests/participants/${participantId}/kick/`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to remove participant');
  return res.json();
}

export interface QuestCompletionResult {
  quest_title: string;
  completion_reason: string;
  participants_completed: number;
  xp_per_participant: number;
  gold_per_participant: number;
  total_xp_awarded: number;
  total_gold_awarded: number;
  participant_results: Array<{
    user: string;
    xp_awarded: number;
    gold_awarded: number;
  }>;
  admin_award?: {
    user: string;
    xp_awarded: number;
    gold_awarded: number;
  };
  admin_balance?: {
    username: string;
    xp: number;
    gold: number;
  };
  // Legacy fields for backward compatibility
  xp?: number;
  gold?: number;
}
