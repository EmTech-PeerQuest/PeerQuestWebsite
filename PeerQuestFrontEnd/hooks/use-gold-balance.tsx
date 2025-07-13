'use client';

import { useState, useEffect, useCallback } from 'react';
import { TransactionAPI } from '@/lib/api/transactions';

export function useGoldBalance() {
  const [goldBalance, setGoldBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());

  const fetchBalance = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if we have a token before attempting to fetch
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (!token) {
        console.warn('No auth token available - setting balance to 0');
        setGoldBalance(0);
        setLoading(false);
        return;
      }
      
      const balanceData = await TransactionAPI.getMyBalance();
      setGoldBalance(balanceData.gold_balance);
    } catch (err) {
      console.error('Error fetching gold balance:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch gold balance'));
      // Don't reset gold balance on error to keep last known value
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshBalance = useCallback(() => {
    setLastUpdated(Date.now());
  }, []);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance, lastUpdated]);

  return { 
    goldBalance, 
    loading, 
    error, 
    refreshBalance,
    formatGold: (amount: number) => `${amount.toLocaleString()} Gold`
  };
}
