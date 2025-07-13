'use client';

import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { TransactionAPI } from '@/lib/api/transactions';
import { useAuth } from './AuthContext';

interface GoldBalanceContextType {
  goldBalance: number;
  loading: boolean;
  error: Error | null;
  refreshBalance: () => void;
  formatGold: (amount: number) => string;
}

const defaultContext: GoldBalanceContextType = {
  goldBalance: 0,
  loading: false,
  error: null,
  refreshBalance: () => {},
  formatGold: (amount: number) => `${amount} Gold`,
};

const GoldBalanceContext = createContext<GoldBalanceContextType>(defaultContext);

export function useGoldBalance() {
  return useContext(GoldBalanceContext);
}

export function GoldBalanceProvider({ children }: { children: ReactNode }) {
  const [goldBalance, setGoldBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  const { user } = useAuth(); // Get user from auth context

  const fetchBalance = useCallback(async () => {
    // Skip if not in browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      console.warn('⚠️ Skipping balance fetch - not in browser environment');
      setLoading(false);
      return;
    }

    // Only attempt to fetch if user is logged in
    if (!user) {
      setGoldBalance(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Check if token exists to prevent unnecessary API calls
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
      
      if (!token && !refreshToken) {
        console.warn('No auth tokens available, skipping balance fetch');
        setGoldBalance(0);
        setLoading(false);
        return;
      }
      
      const balanceData = await TransactionAPI.getMyBalance();
      console.log('📊 Balance data received in context:', balanceData);
      const goldAmount = Number(balanceData.gold_balance || 0);
      console.log('📊 Setting gold balance to:', goldAmount);
      setGoldBalance(goldAmount);
    } catch (err) {
      console.error('❌ Error fetching gold balance in context:', err);
      
      // Handle specific error types
      if (err instanceof Error) {
        if (err.message.includes('Failed to refresh access token') || 
            err.message.includes('No refresh token available') ||
            err.message.includes('Authentication required')) {
          console.warn('🔑 Authentication issue, clearing balance');
          setGoldBalance(0);
        } else if (err.message.includes('Fetch failed')) {
          console.error('🌐 Network issue, keeping last known balance');
          // Don't change the balance on network errors
        } else {
          console.error('🔴 Unknown error, setting balance to 0');
          setGoldBalance(0);
        }
      } else {
        console.error('🔴 Non-Error exception, setting balance to 0');
        setGoldBalance(0);
      }
      
      // Don't set error UI if it's just an auth issue
      if (err instanceof Error && !err.message.includes('No refresh token available')) {
        setError(err);
      }
      // Keep the last known balance instead of resetting to 0
    } finally {
      setLoading(false);
    }
  }, [user]);

  const refreshBalance = useCallback(() => {
    setLastUpdated(Date.now());
  }, []);

  // Format gold display with commas for thousands
  const formatGold = useCallback((amount: number) => {
    return `${amount.toLocaleString()} Gold`;
  }, []);

  // Fetch balance when user changes or manual refresh is triggered
  useEffect(() => {
    // Add a small delay to ensure auth tokens are properly set
    if (user) {
      const timeoutId = setTimeout(() => {
        fetchBalance();
      }, 100); // 100ms delay to allow auth context to settle
      
      return () => clearTimeout(timeoutId);
    } else {
      // If no user, immediately set balance to 0
      setGoldBalance(0);
      setLoading(false);
    }
  }, [fetchBalance, user, lastUpdated]);

  const value = {
    goldBalance,
    loading,
    error,
    refreshBalance,
    formatGold
  };

  return (
    <GoldBalanceContext.Provider value={value}>
      {children}
    </GoldBalanceContext.Provider>
  );
}
