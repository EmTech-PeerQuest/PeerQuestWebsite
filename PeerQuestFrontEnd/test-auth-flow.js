// Test authentication flow in browser console
console.log('=== Authentication Flow Test ===');

// Check if we have tokens
const accessToken = localStorage.getItem('access_token');
const refreshToken = localStorage.getItem('refresh_token');

console.log('Access token exists:', !!accessToken);
console.log('Refresh token exists:', !!refreshToken);

if (accessToken) {
  console.log('Access token preview:', accessToken.substring(0, 20) + '...');
  
  // Try to decode JWT
  try {
    const payload = JSON.parse(atob(accessToken.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    console.log('Token user_id:', payload.user_id);
    console.log('Token expires at:', new Date(payload.exp * 1000));
    console.log('Token is valid:', payload.exp > now);
  } catch (e) {
    console.error('Failed to decode token:', e);
  }
}

// Test the fetchWithAuth function directly
async function testAuth() {
  try {
    console.log('\n=== Testing fetchWithAuth ===');
    
    // Import the function (this won't work in browser console, but shows the intent)
    // const { fetchWithAuth } = await import('/lib/auth.ts');
    
    // Test URL that should trigger auth check
    const testUrl = 'http://localhost:8000/api/transactions/balances/my_balance/?t=123';
    console.log('Testing URL:', testUrl);
    console.log('URL includes /transactions/:', testUrl.includes('/transactions/'));
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAuth();
