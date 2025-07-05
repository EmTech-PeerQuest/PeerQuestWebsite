// Comprehensive Remember Me Test Suite
// Run this in the browser console

async function runRememberMeTests() {
  console.log('🧪 Starting Remember Me Test Suite...\n');
  
  // Test 1: Check current login state
  console.log('Test 1: Current Login State');
  console.log('='.repeat(30));
  
  const currentUser = localStorage.getItem('user');
  if (currentUser) {
    console.log('✅ User is logged in');
    const userData = JSON.parse(currentUser);
    console.log('👤 Username:', userData.username);
  } else {
    console.log('❌ User is not logged in');
    console.log('Please log in first to test Remember Me functionality\n');
    return;
  }
  
  // Test 2: Token Storage Analysis
  console.log('\nTest 2: Token Storage Analysis');
  console.log('='.repeat(30));
  
  const tokens = {
    accessToken: localStorage.getItem('access_token'),
    refreshTokenLocal: localStorage.getItem('refresh_token'),
    refreshTokenSession: sessionStorage.getItem('refresh_token'),
    rememberMe: localStorage.getItem('remember_me')
  };
  
  console.log('📍 Access Token:', tokens.accessToken ? '✅ Present' : '❌ Missing');
  console.log('📍 Refresh Token (Local):', tokens.refreshTokenLocal ? '✅ Present' : '❌ Missing');
  console.log('📍 Refresh Token (Session):', tokens.refreshTokenSession ? '✅ Present' : '❌ Missing');
  console.log('📍 Remember Me Flag:', tokens.rememberMe || '❌ Not set');
  
  // Determine configuration
  let config = 'Unknown';
  if (tokens.rememberMe === 'true' && tokens.refreshTokenLocal) {
    config = '🔒 Persistent Login (Remember Me ON)';
  } else if (tokens.refreshTokenSession && !tokens.refreshTokenLocal) {
    config = '⏰ Session Login (Remember Me OFF)';
  } else {
    config = '❌ Invalid Configuration';
  }
  console.log('⚙️ Configuration:', config);
  
  // Test 3: Token Refresh Test
  console.log('\nTest 3: Token Refresh Test');
  console.log('='.repeat(30));
  
  const refreshToken = tokens.refreshTokenLocal || tokens.refreshTokenSession;
  if (refreshToken) {
    try {
      const response = await fetch('http://localhost:8000/api/token/refresh/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Token refresh successful');
        console.log('🔑 New access token received');
        
        // Update localStorage with new token for testing
        localStorage.setItem('access_token', data.access);
        console.log('✅ Access token updated in storage');
      } else {
        console.log('❌ Token refresh failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.log('❌ Token refresh error:', error.message);
    }
  } else {
    console.log('❌ No refresh token available for testing');
  }
  
  // Test 4: API Request Test
  console.log('\nTest 4: Authenticated API Request Test');
  console.log('='.repeat(30));
  
  const currentAccessToken = localStorage.getItem('access_token');
  if (currentAccessToken) {
    try {
      const response = await fetch('http://localhost:8000/api/users/profile/', {
        headers: {
          'Authorization': `Bearer ${currentAccessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        console.log('✅ API request successful with current token');
      } else {
        console.log('❌ API request failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.log('❌ API request error:', error.message);
    }
  } else {
    console.log('❌ No access token for API testing');
  }
  
  // Test 5: Storage Persistence Recommendations
  console.log('\nTest 5: Next Steps & Recommendations');
  console.log('='.repeat(30));
  
  if (tokens.rememberMe === 'true') {
    console.log('🔄 To test persistence:');
    console.log('   1. Close this browser completely');
    console.log('   2. Reopen and navigate to http://localhost:3000');
    console.log('   3. You should be automatically logged in');
  } else {
    console.log('⏰ To test session behavior:');
    console.log('   1. Close this browser completely');
    console.log('   2. Reopen and navigate to http://localhost:3000');
    console.log('   3. You should NOT be automatically logged in');
  }
  
  console.log('\n🧪 Test Suite Complete!');
}

// Quick functions for individual tests
window.testRememberMe = runRememberMeTests;
window.clearAllTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  localStorage.removeItem('remember_me');
  sessionStorage.removeItem('refresh_token');
  console.log('🧹 All tokens cleared');
};

console.log('🧪 Remember Me Test Suite Loaded!');
console.log('Run: testRememberMe() to start testing');
console.log('Run: clearAllTokens() to reset state');
