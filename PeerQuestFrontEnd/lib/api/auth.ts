// --- fetchWithAuth utility for authenticated fetch requests ---
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  
  const headers = {
    ...(options.headers || {}),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
  
  const response = await fetch(url, { ...options, headers });
  
  // Handle authentication errors
  if (response.status === 401) {
    // Try to parse error details
    let errorDetail = '';
    try {
      const data = await response.json();
      errorDetail = data?.detail || '';
    } catch {}
    
    if (errorDetail.includes('token') || errorDetail.includes('authentication')) {
      // Remove invalid tokens and redirect to login ONLY if a token was present
      if (token && typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/';
        throw new TokenInvalidError(errorDetail || 'Token not valid');
      }
    }
  }
  
  return response;
}
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

// Custom error for invalid/expired JWT
export class TokenInvalidError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TokenInvalidError";
  }
}

// JWT login
export const login = async (username: string, password: string) => {
  console.log('🔍 API login called with username:', username);
  try {
    const response = await axios.post(`${API_BASE}/api/token/`, { username, password });
    console.log('🔍 API login successful:', response.status);
    return response;
  } catch (error: any) {
    console.log('🔍 API login failed:', error?.response?.status, error?.response?.data);
    
    // Handle 401 errors (authentication failures)
    if (error?.response?.status === 401) {
      const errorDetail = error?.response?.data?.detail || '';
      
      // Check for email verification required
      if (errorDetail.toLowerCase().includes('verify') || 
          errorDetail.toLowerCase().includes('verification') ||
          errorDetail.toLowerCase().includes('email') ||
          error?.response?.data?.verification_required) {
        throw new Error("Please verify your email address before logging in. Check your inbox for the verification email.");
      }
      
      // Check for specific account issues
      if (errorDetail.toLowerCase().includes('no active account')) {
        console.warn(`Login failed: No active account found with username: '${username}'.`);
        throw new Error("No account found with this username.");
      } else if (errorDetail.toLowerCase().includes('password')) {
        console.warn(`Login failed: Incorrect password for username: '${username}'.`);
        throw new Error("Incorrect password.");
      } else {
        console.warn(`Login failed for username: '${username}'. Detail:`, errorDetail);
        throw new Error("Invalid username or password.");
      }
    }
    
    // Handle 403 errors (forbidden - likely email verification required)
    if (error?.response?.status === 403) {
      const errorDetail = error?.response?.data?.detail || '';
      // Check for verification_required flag from our custom token view
      if (error?.response?.data?.verification_required) {
        throw new Error(errorDetail || "Please verify your email address before logging in. Check your inbox for the verification email.");
      }
      throw new Error(errorDetail || "Access forbidden. Please verify your email address before logging in.");
    }
    
    // User-friendly error for backend validation
    if (error?.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }
    
    throw error;
  }
};

// Register
export const register = async (userData: {
  username: string;
  email: string;
  password: string;
  confirmPassword: string; // Make this required since backend needs it
  birthday?: string | null;
  gender?: string | null;
}) => {
  try {
    console.log('🔍 API: Received userData:', userData);
    
    // Prepare payload for backend
    const payload: any = {
      username: userData.username,
      email: userData.email,
      password: userData.password,
      password_confirm: userData.confirmPassword, // Backend expects password_confirm
    };
    
    // Only include birthday if provided
    if (userData.birthday) {
      payload.birthday = userData.birthday;
    }
    
    // Only include gender if provided
    if (userData.gender) {
      payload.gender = userData.gender;
    }
    
    console.log('🔍 API: Sending payload to backend:', payload);
    
    const response = await axios.post(`${API_BASE}/api/users/register/`, payload);
    console.log('🔍 API: Backend response:', response.data);
    
    // Only succeed if registration returns 201 Created
    if (response.status !== 201) {
      throw new Error(`Registration failed: Unexpected response status ${response.status}`);
    }
    return response;
  } catch (error: any) {
    console.log('🔍 API: Registration error:', error);
    console.log('🔍 API: Error response data:', error?.response?.data);
    
    // Only log and handle actual errors, not successful responses
    if (error?.response?.status >= 400) {
      // Handle empty response object
      if (!error.response.data || Object.keys(error.response.data).length === 0) {
        throw new Error('Registration failed. Please check your information and try again.');
      }
      
      // Handle specific error cases
      if (error.response.status === 400) {
        const errorData = error.response.data;
        
        // Check for detailed error response from backend
        if (errorData.details) {
          // Handle the new structured error format
          const details = errorData.details;
          
          if (details.password) {
            const passwordErrors = Array.isArray(details.password) ? details.password : [details.password];
            throw new Error(`Password error: ${passwordErrors.join(', ')}`);
          }
          
          if (details.username) {
            const usernameErrors = Array.isArray(details.username) ? details.username : [details.username];
            throw new Error(`Username error: ${usernameErrors.join(', ')}`);
          }
          
          if (details.email) {
            const emailErrors = Array.isArray(details.email) ? details.email : [details.email];
            throw new Error(`Email error: ${emailErrors.join(', ')}`);
          }
          
          if (details.password_confirm) {
            const confirmErrors = Array.isArray(details.password_confirm) ? details.password_confirm : [details.password_confirm];
            throw new Error(`Password confirmation error: ${confirmErrors.join(', ')}`);
          }
        }
        
        // Check for field-specific errors (like email already exists)
        if (errorData.email) {
          const emailErrors = Array.isArray(errorData.email) ? errorData.email : [errorData.email];
          if (emailErrors.some((err: any) => err.includes('already exists') || err.includes('unique'))) {
            throw new Error('This email address is already registered. Please use a different email or try logging in.');
          }
          throw new Error(`Email error: ${emailErrors.join(', ')}`);
        }
        
        if (errorData.username) {
          const usernameErrors = Array.isArray(errorData.username) ? errorData.username : [errorData.username];
          if (usernameErrors.some((err: any) => err.includes('already exists') || err.includes('unique'))) {
            throw new Error('This username is already taken. Please choose a different username.');
          }
          throw new Error(`Username error: ${usernameErrors.join(', ')}`);
        }
        
        if (errorData.password) {
          const passwordErrors = Array.isArray(errorData.password) ? errorData.password : [errorData.password];
          throw new Error(`Password error: ${passwordErrors.join(', ')}`);
        }
        
        // Check for general error messages
        if (errorData.detail) {
          throw new Error(errorData.detail);
        }
        
        if (errorData.non_field_errors) {
          const nonFieldErrors = Array.isArray(errorData.non_field_errors) ? errorData.non_field_errors : [errorData.non_field_errors];
          throw new Error(nonFieldErrors.join(', '));
        }
      }
      
      // Prefer extracting from 'errors' key if present
      const errorData = error.response.data.errors ?? error.response.data;
      function extractMessages(val: any): string[] {
        if (!val) return [];
        if (typeof val === 'string') return [val];
        if (Array.isArray(val)) return val.flatMap(extractMessages);
        if (typeof val === 'object') return Object.values(val).flatMap(extractMessages);
        return [];
      }
      const allMessages = extractMessages(errorData);
      if (allMessages.length) {
        throw new Error(allMessages.join(' | '));
      }
      // Fallback: show the whole error object
      throw new Error(`Registration error: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
};

// Verify email
export const verifyEmail = async (token: string) => {
  try {
    const response = await axios.post(`${API_BASE}/api/users/verify-email/`, { token });
    return response;
  } catch (error: any) {
    if (error?.response?.data) {
      const errorData = error.response.data.errors ?? error.response.data;
      function extractMessages(val: any): string[] {
        if (!val) return [];
        if (typeof val === 'string') return [val];
        if (Array.isArray(val)) return val.flatMap(extractMessages);
        if (typeof val === 'object') return Object.values(val).flatMap(extractMessages);
        return [];
      }
      const allMessages = extractMessages(errorData);
      if (allMessages.length) {
        throw new Error(allMessages.join(' | '));
      }
    }
    throw error;
  }
};

// Resend verification email
export const resendVerificationEmail = async (email: string) => {
  try {
    const response = await axios.post(`${API_BASE}/api/users/resend-verification/`, { email });
    return response;
  } catch (error: any) {
    if (error?.response?.data) {
      const errorData = error.response.data.errors ?? error.response.data;
      function extractMessages(val: any): string[] {
        if (!val) return [];
        if (typeof val === 'string') return [val];
        if (Array.isArray(val)) return val.flatMap(extractMessages);
        if (typeof val === 'object') return Object.values(val).flatMap(extractMessages);
        return [];
      }
      const allMessages = extractMessages(errorData);
      if (allMessages.length) {
        throw new Error(allMessages.join(' | '));
      }
    }
    throw error;
  }
};

// Fetch user profile (JWT required)
export const fetchUser = async (token: string) => {
  try {
    const response = await axios.get(`${API_BASE}/api/users/profile/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    console.log('👤 fetchUser response:', response.data);
    
    return response;
  } catch (error: any) {
    // Detect JWT errors
    const detail = error?.response?.data?.detail || "";
    if (
      error?.response?.status === 401 &&
      (detail.includes("token not valid") || detail.includes("token has expired") || detail.includes("credentials were not provided"))
    ) {
      throw new TokenInvalidError(detail || "Token not valid");
    }
    throw error;
  }
};

// No server-side logout for JWT, just remove token client-side
export const logout = async () => {
  // No-op for JWT
};

// Token refresh functionality
export const refreshToken = async () => {
  try {
    // Try to get refresh token from localStorage first (remember me), then sessionStorage
    const refreshTokenValue = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
    
    if (!refreshTokenValue) {
      throw new Error('No refresh token available');
    }
    
    const response = await axios.post(`${API_BASE}/api/token/refresh/`, {
      refresh: refreshTokenValue
    });
    
    return response.data;
  } catch (error: any) {
    // Clear all tokens on refresh failure
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    sessionStorage.removeItem('refresh_token');
    localStorage.removeItem('remember_me');
    throw error;
  }
};

// Axios interceptor for automatic token refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Don't handle 401 errors from login endpoints - let them bubble up
    if (error.response?.status === 401 && 
        (originalRequest.url?.includes('/api/token/') || 
         originalRequest.url?.includes('/auth/login') || 
         originalRequest.url?.includes('/auth/google'))) {
      return Promise.reject(error);
    }
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshData = await refreshToken();
        
        // Update the access token
        localStorage.setItem('access_token', refreshData.access);
        
        // Update the authorization header for the failed request
        originalRequest.headers.Authorization = `Bearer ${refreshData.access}`;
        
        // Retry the original request
        return axios(originalRequest);
      } catch (refreshError) {
        // Token refresh failed, redirect to login only if not already on login page
        if (typeof window !== 'undefined' && !window.location.pathname.includes('login')) {
          window.location.href = '/';
        }
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Forgot password
export const forgotPassword = async (email: string) => {
  try {
    console.log('🔍 API: Sending forgot password request for email:', email);
    
    const response = await axios.post(`${API_BASE}/api/users/password-reset/`, { email });
    console.log('🔍 API: Forgot password response:', response.data);
    
    return response;
  } catch (error: any) {
    console.log('🔍 API: Forgot password error:', error);
    console.log('🔍 API: Error response data:', error?.response?.data);
    
    if (error?.response?.status === 400) {
      const errorData = error.response.data;
      
      // Handle email not found error
      if (errorData.email) {
        const emailErrors = Array.isArray(errorData.email) ? errorData.email : [errorData.email];
        if (emailErrors.some((err: any) => err.includes('not found') || err.includes('does not exist'))) {
          throw new Error('No account found with this email address.');
        }
        throw new Error(`Email error: ${emailErrors.join(', ')}`);
      }
      
      // Handle general error message
      if (errorData.detail) {
        throw new Error(errorData.detail);
      }
      
      // Handle non-field errors
      if (errorData.non_field_errors) {
        const nonFieldErrors = Array.isArray(errorData.non_field_errors) ? errorData.non_field_errors : [errorData.non_field_errors];
        throw new Error(nonFieldErrors.join(', '));
      }
      
      throw new Error('Password reset request failed. Please check your email address and try again.');
    }
    
    if (error?.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }
    
    throw error;
  }
};

// Password reset confirmation
export const resetPasswordConfirm = async (uid: string, token: string, newPassword: string) => {
  try {
    console.log('🔍 API: Sending password reset confirmation request');
    
    const response = await axios.post(`${API_BASE}/api/users/password-reset-confirm/`, {
      uid,
      token,
      new_password: newPassword
    });
    console.log('🔍 API: Password reset confirmation response:', response.data);
    
    return response;
  } catch (error: any) {
    console.log('🔍 API: Password reset confirmation error:', error);
    console.log('🔍 API: Error response data:', error?.response?.data);
    
    if (error?.response?.status === 400) {
      const errorData = error.response.data;
      
      // Handle token/uid validation errors
      if (errorData.detail) {
        throw new Error(errorData.detail);
      }
      
      // Handle password validation errors
      if (errorData.new_password) {
        const passwordErrors = Array.isArray(errorData.new_password) ? errorData.new_password : [errorData.new_password];
        throw new Error(`Password error: ${passwordErrors.join(', ')}`);
      }
      
      // Handle non-field errors
      if (errorData.non_field_errors) {
        const nonFieldErrors = Array.isArray(errorData.non_field_errors) ? errorData.non_field_errors : [errorData.non_field_errors];
        throw new Error(nonFieldErrors.join(', '));
      }
      
      throw new Error('Password reset failed. Please check your reset link and try again.');
    }
    
    if (error?.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }
    
    throw error;
  }
};

// Password strength check
export const checkPasswordStrength = async (password: string, username?: string, email?: string) => {
  try {
    const response = await axios.post(`${API_BASE}/api/users/password-strength-check/`, {
      password,
      username,
      email
    });
    return response.data;
  } catch (error: any) {
    console.error('Password strength check failed:', error?.response?.data);
    throw error;
  }
};