import { login } from './api/auth';
import { TransactionAPI } from './api/transactions';

// Test function to login as admin and fetch balance
export async function testAdminLogin() {
  try {
    console.log('🔐 Testing admin login...');
    
    // Clear existing tokens
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    
    // Login as admin (you'll need to update with actual admin password)
    const response = await login('admin', 'admin_password_here');
    console.log('✅ Admin login successful');
    
    // Store the tokens
    const { access, refresh } = response.data;
    localStorage.setItem('access_token', access);
    if (refresh) {
      localStorage.setItem('refresh_token', refresh);
    }
    
    // Fetch balance with fresh tokens
    const balance = await TransactionAPI.getMyBalance();
    console.log('✅ Admin balance:', balance);
    
    return balance;
  } catch (error) {
    console.error('❌ Admin login test failed:', error);
    throw error;
  }
}
