// Test script to check current authentication status
console.log('🔍 Checking authentication status...');

// Check if we're in browser
if (typeof window !== 'undefined') {
  const accessToken = localStorage.getItem('access_token');
  const refreshToken = localStorage.getItem('refresh_token');
  
  console.log('Access token:', accessToken ? 'EXISTS' : 'MISSING');
  console.log('Refresh token:', refreshToken ? 'EXISTS' : 'MISSING');
  
  if (accessToken) {
    console.log('Access token length:', accessToken.length);
    // Try to decode the JWT to see if it's expired
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      console.log('Token expires at:', new Date(payload.exp * 1000));
      console.log('Current time:', new Date());
      console.log('Token is', payload.exp > now ? 'VALID' : 'EXPIRED');
    } catch (e) {
      console.error('Failed to decode token:', e);
    }
  }
} else {
  console.log('Not in browser environment');
}
