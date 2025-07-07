import { fetchWithAuth } from '@/lib/auth'

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
  async getMyBalance(): Promise<UserBalance> {
    try {
      console.log('🔍 Fetching user balance...');
      
      // Check if we have a token AND refresh token before making the request
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
      
      if (!token && !refreshToken) {
        console.warn('⚠️ No auth tokens available, returning default balance');
        // If no tokens at all, return early with default
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
      
      console.log('🔄 Balance API Response Status:', response.status, response.statusText);
      console.log('🔄 Balance API Response Headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        console.error(`Failed to get balance: ${response.status} ${response.statusText}`);
        
        // Handle authentication errors specifically
        if (response.status === 401 || response.status === 403) {
          console.error('❌ Authentication error when fetching balance - clearing tokens');
          // Remove tokens to prevent further failed requests
          if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
          }
          
          // Throw an authentication error
          throw new Error('Authentication required. Please log in again.');
        }
        
        const text = await response.text();
        console.error('🔄 Error response body:', text);
        try {
          // Try to parse as JSON first
          const errorJson = JSON.parse(text);
          throw new Error(`Failed to get balance: ${JSON.stringify(errorJson)}`);
        } catch (parseError) {
          // If not valid JSON, throw with text preview
          throw new Error(`Failed to get balance: ${text.substring(0, 100)}...`);
        }
      }
      
      // Parse response safely
      try {
        const data = await response.json();
        console.log('✅ Raw Balance API Response:', JSON.stringify(data, null, 2));
        console.log('✅ Raw gold_balance from API:', data.gold_balance, typeof data.gold_balance);
        console.log('✅ Raw user from API:', data.user, typeof data.user);
        console.log('✅ Raw username from API:', data.username);
        
        // Ensure gold_balance is a number
        let goldBalance = 0;
        if (typeof data.gold_balance === 'number') {
          goldBalance = data.gold_balance;
        } else if (typeof data.gold_balance === 'string') {
          goldBalance = parseFloat(data.gold_balance);
        } else {
          goldBalance = Number(data.gold_balance || 0);
        }
        
        console.log('✅ Processed gold balance:', goldBalance, typeof goldBalance);
        
        const result = {
          ...data,
          gold_balance: goldBalance
        };
        
        console.log('✅ Final balance result:', JSON.stringify(result, null, 2));
          
        return result;
      } catch (parseError) {
        console.error('❌ Failed to parse balance response:', parseError);
        throw new Error('Invalid response format from balance API');
      }
    } catch (error) {
      console.error('❌ Balance fetch error:', error);
      // Return a default balance instead of throwing
      return {
        user: 0,
        username: '',
        gold_balance: 0,
        last_updated: new Date().toISOString()
      };
    }
  },
  
  /**
   * Get the current user's transactions
   */
  async getMyTransactions(): Promise<Transaction[]> {
    try {
      console.log('🔍 Fetching user transactions...');
      
      // Use the main transactions endpoint which already filters by user
      const response = await fetchWithAuth(`${API_BASE_URL}/transactions/transactions/`)
      
      console.log('🔄 Transactions API Response Status:', response.status, response.statusText);
      
      if (!response.ok) {
        const text = await response.text();
        handleApiError(response, text, 'view your transactions');
      }
      
      const data = await response.json()
      console.log('✅ Transactions data:', data);
      
      // Handle both paginated and non-paginated responses
      const transactions = data.results || data || []
      console.log('✅ Processed transactions:', transactions.length, 'items');
      
      return transactions
    } catch (error) {
      console.error('Transactions fetch error:', error);
      
      // Re-throw the error so the frontend can handle it properly
      // Don't return empty array, let the frontend decide how to handle the error
      throw error;
    }
  },
  
  /**
   * Get quest rewards
   */
  async getQuestRewards(): Promise<Transaction[]> {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/transactions/transactions/quest_rewards/`)
      
      if (!response.ok) {
        const text = await response.text();
        handleApiError(response, text, 'view quest rewards');
      }
      
      return await response.json()
    } catch (error) {
      console.error('Quest rewards fetch error:', error);
      // Re-throw the error so the frontend can handle it properly
      throw error;
    }
  },
  
  /**
   * Get the gold balance from the user profile
   */
  async getUserProfileGold(): Promise<{gold_balance: number, success: boolean}> {
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
      console.error('❌ Error fetching user profile gold:', error);
      return { gold_balance: 0, success: false };
    }
  },

  /**
   * Cashout API endpoints
   */
  
  /**
   * Get user's cashout requests
   */
  async getMyCashouts(): Promise<CashoutRequest[]> {
    try {
      console.log('🔍 Fetching user cashout requests...');
      
      const response = await fetchWithAuth(`${API_BASE_URL}/transactions/cashouts/my_cashouts/`)
      
      if (!response.ok) {
        const text = await response.text();
        handleApiError(response, text, 'view your cashout requests');
      }
      
      const data = await response.json()
      console.log('✅ Cashout requests data:', data);
      
      // Handle both paginated and non-paginated responses
      return data.results || data || []
    } catch (error) {
      console.error('Cashout requests fetch error:', error);
      throw error;
    }
  },

  /**
   * Request a cashout
   */
  async requestCashout(amount_gold: number, method: string, payment_details: string = ''): Promise<{message: string, cashout_request: CashoutRequest}> {
    try {
      console.log('🔍 Requesting cashout:', { amount_gold, method, payment_details });
      
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
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        const errorMessage = data.error || data.detail || 'Failed to request cashout';
        throw new Error(errorMessage);
      }
      
      console.log('✅ Cashout request successful:', data);
      return data;
    } catch (error) {
      console.error('Cashout request error:', error);
      throw error;
    }
  },

  /**
   * Cancel a cashout request
   */
  async cancelCashout(cashoutId: number): Promise<{message: string, cashout_request: CashoutRequest}> {
    try {
      console.log('🔍 Cancelling cashout:', cashoutId);
      
      const response = await fetchWithAuth(`${API_BASE_URL}/transactions/cashouts/${cashoutId}/cancel_cashout/`, {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        const errorMessage = data.error || data.detail || 'Failed to cancel cashout';
        throw new Error(errorMessage);
      }
      
      console.log('✅ Cashout cancellation successful:', data);
      return data;
    } catch (error) {
      console.error('Cashout cancellation error:', error);
      throw error;
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
