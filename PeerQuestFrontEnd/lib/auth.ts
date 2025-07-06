// Utility for authentication token management and refresh

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
console.log('🔧 API_BASE_URL:', API_BASE_URL); // Debug log

export async function refreshAccessToken() {
  const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
  if (!refreshToken) {
    console.warn('🔄 No refresh token available. User needs to log in.');
    // Clean up any invalid tokens
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
    }
    throw new Error('No refresh token available.');
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });
    
    if (!response.ok) {
      console.error(`🔄 Token refresh failed: ${response.status} ${response.statusText}`);
      // Clean up invalid tokens
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
      throw new Error('Failed to refresh access token.');
    }
    
    const data = await response.json();
    if (data.access) {
      localStorage.setItem('access_token', data.access);
      return data.access;
    }
    throw new Error('No access token returned.');
  } catch (error) {
    console.error('🔄 Token refresh error:', error);
    throw error;
  }
}

export async function fetchWithAuth(input: RequestInfo, init: RequestInit = {}, retry = true): Promise<Response> {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    console.warn('⚠️ fetchWithAuth called during SSR, skipping');
    throw new Error('fetchWithAuth can only be called in browser environment');
  }

  // Additional check for document
  if (typeof document === 'undefined') {
    console.warn('⚠️ fetchWithAuth called without document object, skipping');
    throw new Error('fetchWithAuth requires full browser environment');
  }
  
  // Get token from localStorage if we're in a browser environment
  let token = localStorage.getItem('access_token');
  
  // Initialize headers if not provided
  if (!init.headers) {
    init.headers = {};
  }
  
  // Set Content-Type if not present and not FormData
  if (!init.headers.hasOwnProperty('Content-Type') && !(init.body instanceof FormData)) {
    (init.headers as any)['Content-Type'] = 'application/json';
  }
  
  // Add authorization header if token exists
  if (token) {
    (init.headers as any)['Authorization'] = `Bearer ${token}`;
    console.log('🔑 Using token for request');
  } else {
    console.warn('⚠️ No access token available for request');
    
    // Get the URL string for checking
    let urlString: string;
    if (typeof input === 'string') {
      urlString = input;
    } else if (input instanceof Request) {
      urlString = input.url;
    } else {
      urlString = String(input);
    }
    
    console.log('🔍 Checking URL for auth requirements:', urlString);
    
    // For authenticated endpoints, we should immediately return an unauthorized response
    // instead of making a request we know will fail
    if (urlString.includes('/transactions/') || urlString.includes('/users/profile/')) {
      console.log('🚫 Skipping authenticated request because no token is available');
      return new Response(JSON.stringify({ 
        detail: "Authentication credentials were not provided." 
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  // Log the full request details for debugging
  const method = init.method || 'GET';
  console.log(`🔷 Fetching: ${typeof input === 'string' ? input : input.url} [${method}]`);
  if (init.body) {
    try {
      // Try to log the request body in a readable format
      const bodyObj = typeof init.body === 'string' ? JSON.parse(init.body) : init.body;
      console.log('📤 Request body:', bodyObj);
    } catch (e) {
      console.log('📤 Request body (raw):', init.body);
    }
  }
  
  try {
    // Ensure input is properly formatted
    const url = typeof input === 'string' ? input : input.url || input.toString();
    console.log(`🔷 Final URL: ${url}`);
    console.log(`🔷 Request init:`, JSON.stringify(init, null, 2));
    
    // Validate URL before making request
    try {
      const urlObj = new URL(url);
      console.log(`🔷 URL parsed successfully:`, {
        protocol: urlObj.protocol,
        host: urlObj.host,
        pathname: urlObj.pathname,
        search: urlObj.search
      });
    } catch (urlError) {
      console.error('❌ Invalid URL:', url, urlError);
      throw new Error(`Invalid URL: ${url}`);
    }

    // Check if backend is reachable
    console.log('🔷 Attempting fetch...');
    let response = await fetch(input, init);
    console.log('✅ Fetch successful');
    
    // Log detailed response information
    console.log(`🔶 Response: ${response.status} ${response.statusText}`);
    console.log(`🔶 Response headers:`, Object.fromEntries(response.headers.entries()));
    
    // Handle 401/403 errors by attempting to refresh token
    if ((response.status === 401 || response.status === 403) && retry) {
      console.log('🔄 Token expired, attempting refresh...');
      try {
        token = await refreshAccessToken();
        console.log('✅ Token refreshed successfully');
        // Update headers with new token
        if (!init.headers) init.headers = {};
        (init.headers as any)['Authorization'] = `Bearer ${token}`;
        // Retry the original request with the new token
        console.log('🔁 Retrying original request with new token');
        response = await fetch(input, init);
        console.log(`🔶 Retry response: ${response.status} ${response.statusText}`);
      } catch (e) {
        console.error('❌ Token refresh failed:', e);
        // Clear tokens on refresh failure
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          console.warn('🗑️ Auth tokens cleared due to refresh failure');
        }
        throw new Error('Session expired. Please log in again.');
      }
    }
    
    // Log response errors for debugging
    if (!response.ok) {
      // Commented out to suppress console errors for user-facing API errors
      // console.error(`API Error: ${response.status} ${response.statusText}`);
      // Clone the response so we can read the body without affecting later processing
      const responseClone = response.clone();
      const contentType = response.headers.get('content-type');
      if (contentType && !contentType.includes('application/json')) {
        // console.error(`Received non-JSON response: ${contentType}`);
        const text = await responseClone.text();
        // console.error(`Response text preview: ${text.substring(0, 200)}...`);
      } else {
        try {
          const errorJson = await responseClone.json();
          // console.error(`Response error JSON:`, errorJson);
        } catch (e) {
          // console.error(`Could not parse error response as JSON`);
          const text = await responseClone.text();
          // console.error(`Response text preview: ${text.substring(0, 200)}...`);
        }
      }
    }
    
    return response;
  } catch (error) {
    // Remove console.error for user-facing errors
    // console.error('❌ Fetch error details:', {
    //   error: error,
    //   message: error instanceof Error ? error.message : 'Unknown error',
    //   stack: error instanceof Error ? error.stack : 'No stack trace',
    //   input: typeof input === 'string' ? input : 'Request object',
    //   init: init
    // });
    // Re-throw with more context
    if (error instanceof Error) {
      throw new Error(`Fetch failed for ${typeof input === 'string' ? input : 'request'}: ${error.message}`);
    } else {
      throw new Error(`Fetch failed for ${typeof input === 'string' ? input : 'request'}: Unknown error`);
    }
  }
}
