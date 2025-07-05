'use client';

import { TestLogin } from '@/components/debug/TestLogin';
import { DebugGoldBalance } from '@/components/debug/DebugGoldBalance';

export default function TestAuth() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Authentication & Gold Balance Test</h1>
      
      <div className="space-y-4">
        <TestLogin />
        <DebugGoldBalance />
      </div>
      
      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h2 className="font-bold mb-2">Instructions:</h2>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>First, click "Check Tokens" to see current token status</li>
          <li>If no tokens exist, use the login form with username: admin, password: admin123</li>
          <li>Click "Test Login" to authenticate</li>
          <li>The gold balance test should then show 100 gold for the admin user</li>
          <li>If errors occur, check the browser console for detailed logs</li>
        </ol>
      </div>
    </div>
  );
}
