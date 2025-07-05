// Utility for authentication token management and refresh

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export async function refreshAccessToken() {
  const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
  if (!refreshToken) throw new Error('No refresh token available.');
  const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh: refreshToken }),
  });
  if (!response.ok) {
    throw new Error('Failed to refresh access token.');
  }
  const data = await response.json();
  if (data.access) {
    localStorage.setItem('access_token', data.access);
    return data.access;
  }
  throw new Error('No access token returned.');
}

export async function fetchWithAuth(input: RequestInfo, init: RequestInit = {}, retry = true): Promise<Response> {
  let token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  if (!init.headers) init.headers = {};
  if (token) {
    (init.headers as any)['Authorization'] = `Bearer ${token}`;
  }
  let response = await fetch(input, init);
  if ((response.status === 401 || response.status === 403) && retry) {
    try {
      token = await refreshAccessToken();
      (init.headers as any)['Authorization'] = `Bearer ${token}`;
      response = await fetch(input, init);
    } catch (e) {
      // Optionally clear tokens and redirect to login
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      throw new Error('Session expired. Please log in again.');
    }
  }
  return response;
}
