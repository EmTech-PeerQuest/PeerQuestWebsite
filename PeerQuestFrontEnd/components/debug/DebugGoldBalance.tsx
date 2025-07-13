'use client';

import { useEffect, useState } from 'react';
import { TransactionAPI } from '@/lib/api/transactions';

export function DebugGoldBalance() {
  const [status, setStatus] = useState('Not started');
  const [balance, setBalance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testBalance = async () => {
    setStatus('Testing...');
    setError(null);
    
    try {
      console.log('🧪 Manual balance test starting...');
      const result = await TransactionAPI.getMyBalance();
      console.log('🧪 Manual balance test result:', result);
      setBalance(result.gold_balance);
      setStatus('Success');
    } catch (err) {
      console.error('🧪 Manual balance test failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStatus('Failed');
    }
  };

  useEffect(() => {
    console.log('🧪 DebugGoldBalance component mounted');
    
    // Small delay to ensure everything is loaded
    const timer = setTimeout(() => {
      console.log('🧪 Starting automatic test after delay');
      testBalance();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="p-4 border border-blue-300 bg-blue-50 rounded">
      <h3 className="font-bold text-blue-800">Gold Balance Debug</h3>
      <p>Status: {status}</p>
      {balance !== null && <p>Balance: {balance} gold</p>}
      {error && <p className="text-red-600">Error: {error}</p>}
      <button 
        onClick={testBalance}
        className="mt-2 px-3 py-1 bg-blue-500 text-white rounded"
      >
        Test Balance
      </button>
    </div>
  );
}
