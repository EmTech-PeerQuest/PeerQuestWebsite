"use client";

import { useState } from 'react';

export function BackendTestComponent() {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const testEndpoint = async (endpoint: string, method: string = 'GET', body?: any) => {
    const token = localStorage.getItem('access_token');
    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const result = `${method} ${endpoint}: ${response.status} ${response.statusText}`;
      setResults(prev => [...prev, result]);
      
      if (response.ok) {
        try {
          const data = await response.json();
          console.log(`${endpoint} response:`, data);
        } catch (e) {
          console.log(`${endpoint} response: (not JSON)`);
        }
      } else {
        const text = await response.text();
        console.log(`${endpoint} error:`, text);
      }
    } catch (error) {
      const result = `${method} ${endpoint}: ERROR - ${error}`;
      setResults(prev => [...prev, result]);
    }
  };

  const runTests = async () => {
    setLoading(true);
    setResults([]);

    const testGuildId = "test-guild-id"; // You can replace this with a real guild ID

    // Test notification endpoints
    await testEndpoint('http://localhost:8000/api/notifications/');
    await testEndpoint('http://localhost:8000/api/notifications/unread-count/');

    // Test guild report endpoints
    await testEndpoint('http://localhost:8000/api/users/admin/guild-reports/');
    await testEndpoint('http://localhost:8000/api/users/guild-report/', 'POST', {
      reportedGuild: testGuildId,
      reason: 'test',
      message: 'test message'
    });

    // Test guild warning endpoints
    await testEndpoint(`http://localhost:8000/api/guilds/${testGuildId}/warnings/`);
    await testEndpoint(`http://localhost:8000/api/guilds/${testGuildId}/reset-warnings/`, 'POST');
    await testEndpoint(`http://localhost:8000/api/guilds/${testGuildId}/reset_warnings/`, 'POST');

    // Test guild moderation endpoints
    await testEndpoint(`http://localhost:8000/api/guilds/${testGuildId}/warn/`, 'POST', { reason: 'test' });
    await testEndpoint(`http://localhost:8000/api/guilds/${testGuildId}/enable/`, 'POST');

    setLoading(false);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Backend Endpoint Tests</h2>
      
      <button
        onClick={runTests}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 mb-4"
      >
        {loading ? 'Testing...' : 'Run Endpoint Tests'}
      </button>

      <div className="space-y-2">
        {results.map((result, index) => (
          <div 
            key={index} 
            className={`p-2 rounded text-sm font-mono ${
              result.includes('200') ? 'bg-green-100 text-green-800' :
              result.includes('404') || result.includes('405') ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}
          >
            {result}
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">Expected Endpoints:</h3>
        <ul className="text-sm space-y-1 font-mono">
          <li>• GET /api/notifications/</li>
          <li>• GET /api/notifications/unread-count/</li>
          <li>• POST /api/notifications/</li>
          <li>• POST /api/notifications/[id]/mark-read/</li>
          <li>• GET /api/users/admin/guild-reports/</li>
          <li>• POST /api/users/guild-report/</li>
          <li>• GET /api/guilds/[id]/warnings/</li>
          <li>• POST /api/guilds/[id]/reset-warnings/</li>
          <li>• POST /api/guilds/[id]/warn/</li>
          <li>• POST /api/guilds/[id]/enable/</li>
        </ul>
      </div>
    </div>
  );
}
