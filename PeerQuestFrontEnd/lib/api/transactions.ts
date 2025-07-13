import { fetchWithAuth } from '@/lib/api/auth'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
console.log('🔧 Transactions API_BASE_URL:', API_BASE_URL); // Debug log

export interface UserBalance {
  user: number
  username: string
  gold_balance: number
  last_updated: string
}

export interface Transaction {
  transaction_id: number
  user: number
  username: string
  type: string
  type_display: string
  amount: number
  description: string
  quest?: number
  quest_title?: string
  created_at: string
}

export interface CashoutRequest {
  id: number
  user: number
  username: string
  amount_gold: number
  amount_php: number
  exchange_rate: number
  method: string
  method_display: string
  payment_details?: string
  status: string
  status_display: string
  notes?: string
  transaction?: number
  created_at: string
  processed_at?: string
  can_be_cancelled: boolean
}

export const TransactionAPI = {
  /**
   * Get the current user's balance with enhanced debugging
   */
  getMyBalance: async function (): Promise<UserBalance> {
    try {
      console.log('🔍 Fetching user balance...');
      
      // Check if we have a token AND refresh token before making the request
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
      
      if (!token && !refreshToken) {
        console.warn('⚠️ No auth tokens available, returning default balance');
        return {
          user: 0,
          username: '',
          gold_balance: 0,
          last_updated: new Date().toISOString()
        };
      }
      
      if (!token) {
        console.warn('⚠️ No access token but refresh token exists');
      } else {
        console.log('🔑 Using token for balance request:', token.substring(0, 10) + '...');
      }
      
      // Add cache busting to prevent stale data
      const timestamp = Date.now();
      const response = await fetchWithAuth(
        `${API_BASE_URL}/transactions/balances/my_balance/?t=${timestamp}`, 
        { 
          method: 'GET',
          headers: { 
            'Accept': 'application/json'
          }
        }
      );

      // If fetchWithAuth returns null (no token), return default balance
      if (!response) {
        console.warn('⚠️ fetchWithAuth returned null (likely not logged in), returning default balance');
        return {
          user: 0,
          username: '',
          gold_balance: 0,
          last_updated: new Date().toISOString()
        };
      }

      if (!response.ok) {
        console.error('Failed to fetch balance:', response.status, response.statusText);
        return {
          user: 0,
          username: '',
          gold_balance: 0,
          last_updated: new Date().toISOString()
        };
      }

      const data = await response.json();
      let goldBalance = 0;
      if (typeof data.gold_balance === 'number') {
        goldBalance = data.gold_balance;
      } else if (typeof data.gold_balance === 'string') {
        goldBalance = parseFloat(data.gold_balance);
      } else {
        goldBalance = Number(data.gold_balance || 0);
      }
      return {
        user: data.user || 0,
        username: data.username || '',
        gold_balance: goldBalance,
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Balance fetch error:', error);
      throw error;
    }
  },

  /**
   * Get the user's transactions
   */
  getMyTransactions: async function (): Promise<Transaction[]> {
    try {
      console.log('🔍 Fetching user transactions...');
      const response = await fetchWithAuth(`${API_BASE_URL}/transactions/transactions/my_transactions/`);
      const text = await response.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (jsonError) {
        console.error('Failed to parse transactions response as JSON:', jsonError);
      }
      if (!response.ok) {
        handleApiError(response, text, 'view your transactions');
        return [];
      }
      // Backend returns array directly, not wrapped in {transactions: [...]}
      if (data && Array.isArray(data)) {
        return data;
      }
      // Fallback: check if it's wrapped in transactions object (for compatibility)
      if (data && Array.isArray(data.transactions)) {
        return data.transactions;
      }
      return [];
    } catch (error) {
      console.error('Transactions fetch error:', error);
      throw error;
    }
  },

  /**
   * Get quest rewards
   */
  getQuestRewards: async function (): Promise<Transaction[]> {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/transactions/transactions/quest_rewards/`);
      const text = await response.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (jsonError) {
        console.error('Failed to parse quest rewards response as JSON:', jsonError);
      }
      if (!response.ok) {
        handleApiError(response, text, 'view quest rewards');
        return [];
      }
      if (data && Array.isArray(data.transactions)) {
        return data.transactions;
      }
      return [];
    } catch (error) {
      console.error('Quest rewards fetch error:', error);
      throw error;
    }
  },

  /**
   * Get user's cashout requests
   */
  getMyCashouts: async function (): Promise<CashoutRequest[]> {
    try {
      console.log('🔍 Fetching user cashout requests...');
      const response = await fetchWithAuth(`${API_BASE_URL}/transactions/cashouts/`);
      const text = await response.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (jsonError) {
        console.error('Failed to parse cashouts response as JSON:', jsonError);
      }
      if (!response.ok) {
        handleApiError(response, text, 'view your cashout requests');
        return [];
      }
      if (data && Array.isArray(data.cashouts)) {
        return data.cashouts;
      }
      return [];
    } catch (error) {
      console.error('Cashouts fetch error:', error);
      throw error;
    }
  },

  /**
   * Request a new cashout
   */
  requestCashout: async function (amount_gold: number, method: string, payment_details?: string): Promise<any> {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/transactions/cashouts/request_cashout/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount_gold,
          method,
          payment_details
        })
      });
      
      const text = await response.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (jsonError) {
        console.error('Failed to parse cashout request response as JSON:', jsonError);
      }
      
      if (!response.ok) {
        handleApiError(response, text, 'request cashout');
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Cashout request error:', error);
      throw error;
    }
  },

  /**
   * Cancel a cashout request
   */
  cancelCashout: async function (cashoutId: number): Promise<any> {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/transactions/cashouts/${cashoutId}/cancel_cashout/`, {
        method: 'POST'
      });
      
      const text = await response.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (jsonError) {
        console.error('Failed to parse cashout cancellation response as JSON:', jsonError);
      }
      
      if (!response.ok) {
        handleApiError(response, text, 'cancel cashout');
        return null;
      }
      
      console.log('✅ Cashout cancellation successful:', data);
      return data;
    } catch (error) {
      console.error('Cashout cancellation error:', error);
      throw error;
    }
  },

  /**
   * Get the gold balance from the user profile
   */
  getUserProfileGold: async function (): Promise<{gold_balance: number, success: boolean}> {
    try {
      console.log('🔍 Getting gold balance from user profile...');
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      
      if (!token) {
        console.warn('⚠️ No auth token available for profile request');
        return { gold_balance: 0, success: false };
      }
      
      const response = await fetchWithAuth(`${API_BASE_URL}/users/profile/`);
      
      if (!response.ok) {
        console.error(`Failed to get user profile: ${response.status}`);
        return { gold_balance: 0, success: false };
      }
      
      const userData = await response.json();
      console.log('✅ User profile data:', userData);
      
      if (userData.gold_balance !== undefined) {
        console.log('💰 User profile gold_balance:', userData.gold_balance);
        return { 
          gold_balance: Number(userData.gold_balance),
          success: true
        };
      }
      
      return { gold_balance: 0, success: false };
    } catch (error) {
      console.error('Error getting user profile gold:', error);
      return { gold_balance: 0, success: false };
    }
  }
}

/**
 * Standardized error handling for API responses
 */
function handleApiError(response: Response, text: string, context: string): never {
  console.error(`${context}: ${response.status} ${response.statusText}`, text);
  
  // Handle specific HTTP status codes
  if (response.status === 401) {
    throw new Error(`Authentication required. Please log in to ${context.toLowerCase()}.`);
  }
  
  if (response.status === 403) {
    throw new Error(`Access denied. You do not have permission to ${context.toLowerCase()}.`);
  }
  
  if (response.status >= 500) {
    throw new Error('Server error. Please try again later.');
  }
  
  // Try to parse error response for better messages
  try {
    const errorJson = JSON.parse(text);
    
    // Handle Django REST framework error formats
    if (errorJson.detail) {
      if (errorJson.detail.includes('Authentication') || errorJson.detail.includes('credentials')) {
        throw new Error(`Authentication required. Please log in to ${context.toLowerCase()}.`);
      }
      throw new Error(`Error: ${errorJson.detail}`);
    }
    
    // Handle field validation errors
    if (errorJson.non_field_errors) {
      throw new Error(`Error: ${errorJson.non_field_errors.join(', ')}`);
    }
    
    // Generic error with parsed JSON
    throw new Error(`Request failed: ${JSON.stringify(errorJson)}`);
  } catch (parseError) {
    // If JSON parsing fails, check for authentication keywords
    if (text.toLowerCase().includes('authentication') || text.toLowerCase().includes('credentials')) {
      throw new Error(`Authentication required. Please log in to ${context.toLowerCase()}.`);
    }
    throw new Error(`Request failed with status ${response.status}. Please try again.`);
  }
}
