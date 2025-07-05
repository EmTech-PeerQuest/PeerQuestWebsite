// Remember Me Testing Script
// Run this in browser console after logging in

function testRememberMeState() {
  console.log('=== Remember Me Test Results ===');
  
  // Check localStorage
  const accessToken = localStorage.getItem('access_token');
  const refreshTokenLocal = localStorage.getItem('refresh_token');
  const rememberMe = localStorage.getItem('remember_me');
  const user = localStorage.getItem('user');
  
  // Check sessionStorage
  const refreshTokenSession = sessionStorage.getItem('refresh_token');
  
  console.log('📱 Local Storage:');
  console.log('  access_token:', accessToken ? '✅ Present' : '❌ Missing');
  console.log('  refresh_token:', refreshTokenLocal ? '✅ Present' : '❌ Missing');
  console.log('  remember_me:', rememberMe || '❌ Not set');
  console.log('  user:', user ? '✅ Present' : '❌ Missing');
  
  console.log('🔄 Session Storage:');
  console.log('  refresh_token:', refreshTokenSession ? '✅ Present' : '❌ Missing');
  
  // Determine login type
  if (rememberMe === 'true' && refreshTokenLocal) {
    console.log('✅ Remember Me: ENABLED (Persistent login)');
  } else if (refreshTokenSession && !refreshTokenLocal) {
    console.log('✅ Remember Me: DISABLED (Session only)');
  } else {
    console.log('❌ Invalid state - check implementation');
  }
  
  console.log('=== End Test Results ===');
}

// Run the test
testRememberMeState();

// Test token refresh
async function testTokenRefresh() {
  console.log('🔄 Testing token refresh...');
  
  const refreshToken = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
  if (!refreshToken) {
    console.log('❌ No refresh token found');
    return;
  }
  
  try {
    const response = await fetch('http://localhost:8000/api/token/refresh/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Token refresh successful');
      console.log('New access token:', data.access ? '✅ Received' : '❌ Missing');
    } else {
      console.log('❌ Token refresh failed:', response.status);
    }
  } catch (error) {
    console.log('❌ Token refresh error:', error.message);
  }
}

// Export functions for manual testing
window.testRememberMe = testRememberMeState;
window.testTokenRefresh = testTokenRefresh;

console.log('🧪 Test functions loaded:');
console.log('  testRememberMe() - Check current state');
console.log('  testTokenRefresh() - Test token refresh');
