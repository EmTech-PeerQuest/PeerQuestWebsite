// Test script to verify TokenInvalidError handling during app initialization
// This simulates the scenario where an invalid token exists in localStorage

console.log('🧪 Testing TokenInvalidError handling...');

// Simulate having an invalid token in localStorage
if (typeof window !== 'undefined') {
  // Clear existing auth state
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  
  // Set an invalid token to simulate the error scenario
  localStorage.setItem('access_token', 'invalid_token_that_will_fail_validation');
  
  console.log('🔧 Set invalid token in localStorage for testing');
  console.log('🔄 Refresh the page to test initialization handling');
}

export {};
