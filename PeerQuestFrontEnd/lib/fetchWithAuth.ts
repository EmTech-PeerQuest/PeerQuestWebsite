// lib/fetchWithAuth.ts
import { TokenInvalidError, BannedUserError } from './errors';
import { clearTokens, saveBanInfo } from './auth.js';

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('access_token') || sessionStorage.getItem('access_token')
    : null;

  const headers = {
    ...(options.headers || {}),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    let errorDetail = '';
    try {
      const data = await response.json();
      errorDetail = data?.detail || '';
    } catch {}
    if (errorDetail.includes('token') || errorDetail.includes('authentication')) {
      if (token && typeof window !== 'undefined') {
        clearTokens();
        window.location.href = '/';
        throw new TokenInvalidError(errorDetail || 'Token not valid');
      }
    }
  }
  if (response.status === 403) {
    let data;
    try {
      data = await response.json();
    } catch {}
    if (data?.ban_reason) {
      saveBanInfo(data.ban_reason, data.ban_expires_at);
      clearTokens();
      if (typeof window !== 'undefined') window.location.href = '/banned';
      throw new BannedUserError(data.ban_reason, data.ban_expires_at);
    }
  }
  return response;
}
