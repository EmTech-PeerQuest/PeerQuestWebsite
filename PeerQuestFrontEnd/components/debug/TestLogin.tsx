'use client';

import { useState } from 'react';
import { login } from '@/lib/api/auth';

export function TestLogin() {
  const [status, setStatus] = useState('Ready');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');

  const testLogin = async () => {
    setStatus('Logging in...');
    try {
      console.log('🔐 Testing login with:', { username, password: '***' });
      const response = await login(username, password);
      console.log('✅ Login successful:', response.data);
      
      // Store tokens
      if (response.data.access && response.data.refresh) {
        localStorage.setItem('access_token', response.data.access);
        localStorage.setItem('refresh_token', response.data.refresh);
        setStatus('Login successful! Tokens stored.');
      } else {
        setStatus('Login response missing tokens');
      }
    } catch (error) {
      console.error('❌ Login failed:', error);
      setStatus(`Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const checkTokens = () => {
    const access = localStorage.getItem('access_token');
    const refresh = localStorage.getItem('refresh_token');
    
    if (access && refresh) {
      setStatus(`Tokens exist. Access: ${access.substring(0, 20)}..., Refresh: ${refresh.substring(0, 20)}...`);
    } else {
      setStatus('No tokens found in localStorage');
    }
  };

  const clearTokens = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setStatus('Tokens cleared');
  };

  return (
    <div className="p-4 border border-green-300 bg-green-50 rounded mb-4">
      <h3 className="font-bold text-green-800 mb-2">Login Test</h3>
      
      <div className="mb-2">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mr-2 px-2 py-1 border rounded"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mr-2 px-2 py-1 border rounded"
        />
      </div>
      
      <div className="space-x-2 mb-2">
        <button 
          onClick={testLogin}
          className="px-3 py-1 bg-green-500 text-white rounded"
        >
          Test Login
        </button>
        <button 
          onClick={checkTokens}
          className="px-3 py-1 bg-blue-500 text-white rounded"
        >
          Check Tokens
        </button>
        <button 
          onClick={clearTokens}
          className="px-3 py-1 bg-red-500 text-white rounded"
        >
          Clear Tokens
        </button>
      </div>
      
      <p className="text-sm">Status: {status}</p>
    </div>
  );
}
