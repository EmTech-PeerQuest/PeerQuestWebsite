import { fetchWithAuth } from '@/lib/auth'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

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

export const TransactionAPI = {
  /**
   * Get the current user's balance
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
      
      const response = await fetchWithAuth(
        `${API_BASE_URL}/transactions/balances/my_balance/`, 
        { 
          credentials: 'include',
          headers: { 
            'Accept': 'application/json'
          }
        }
      );
      
      console.log('🔄 Balance API Response Status:', response.status, response.statusText);
      
      if (!response.ok) {
        console.error(`Failed to get balance: ${response.status} ${response.statusText}`);
        if (response.status === 401) {
          console.error('Authentication error when fetching balance');
          // Remove tokens to prevent further failed requests
          if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
          }
          return {
            user: 0,
            username: '',
            gold_balance: 0,
            last_updated: new Date().toISOString()
          };
        }
        
        const text = await response.text();
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
        console.log('✅ Balance fetched successfully:', data);
        console.log('✅ Raw gold_balance from API:', data.gold_balance, typeof data.gold_balance);
        
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
          
        return {
          ...data,
          gold_balance: goldBalance
        };
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
      const response = await fetchWithAuth(`${API_BASE_URL}/transactions/transactions/my_transactions/`)
      
      if (!response.ok) {
        console.error(`Failed to get transactions: ${response.status} ${response.statusText}`);
        const text = await response.text();
        try {
          // Try to parse as JSON first
          const errorJson = JSON.parse(text);
          throw new Error(`Failed to get transactions: ${JSON.stringify(errorJson)}`);
        } catch (parseError) {
          // If not valid JSON, throw with text preview
          throw new Error(`Failed to get transactions: ${text.substring(0, 100)}...`);
        }
      }
      
      return await response.json()
    } catch (error) {
      console.error('Transactions fetch error:', error);
      return []; // Return empty array on error
    }
  },
  
  /**
   * Get quest rewards
   */
  async getQuestRewards(): Promise<Transaction[]> {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/transactions/transactions/quest_rewards/`)
      
      if (!response.ok) {
        console.error(`Failed to get quest rewards: ${response.status} ${response.statusText}`);
        const text = await response.text();
        try {
          // Try to parse as JSON first
          const errorJson = JSON.parse(text);
          throw new Error(`Failed to get quest rewards: ${JSON.stringify(errorJson)}`);
        } catch (parseError) {
          // If not valid JSON, throw with text preview
          throw new Error(`Failed to get quest rewards: ${text.substring(0, 100)}...`);
        }
      }
      
      return await response.json()
    } catch (error) {
      console.error('Quest rewards fetch error:', error);
      return []; // Return empty array on error
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
}
