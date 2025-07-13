// lib/auth.ts
import { api } from './api';
import { TokenInvalidError, extractErrorMessages } from './errors';
import type { User } from '@/lib/types';

// --- Token Storage Helpers ---
export function getAccessToken() {
  return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
}
export function getRefreshToken() {
  return localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
}
export function setTokens(access: string, refresh: string, rememberMe = false) {
  if (rememberMe) {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
  } else {
    sessionStorage.setItem('access_token', access);
    sessionStorage.setItem('refresh_token', refresh);
  }
}
export function clearTokens() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  sessionStorage.removeItem('access_token');
  sessionStorage.removeItem('refresh_token');
  localStorage.removeItem('remember_me');
  localStorage.removeItem('user');
}
export function saveBanInfo(reason: string, expiresAt?: string | null) {
  localStorage.setItem('ban_info', JSON.stringify({ reason, expiresAt: expiresAt || null }));
}

// --- Auth API Functions ---
export async function login(username: string, password: string, rememberMe = false) {
  try {
    const response = await api.post('/token/', { username, password });
    const { access, refresh } = response.data;
    setTokens(access, refresh, rememberMe);
    return response;
  } catch (error: any) {
    handleAuthError(error);
  }
}

export async function register(userData: {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  birthday?: string | null;
  gender?: string | null;
}) {
  try {
    const payload: any = {
      username: userData.username,
      email: userData.email,
      password: userData.password,
      password_confirm: userData.confirmPassword,
    };
    if (userData.birthday) payload.birthday = userData.birthday;
    if (userData.gender) payload.gender = userData.gender;
    const response = await api.post('/users/register/', payload);
    if (response.status !== 201) throw new Error(`Registration failed: Unexpected response status ${response.status}`);
    return response;
  } catch (error: any) {
    handleAuthError(error);
  }
}

export async function fetchUser(token?: string): Promise<User> {
  try {
    const access = token || getAccessToken();
    const response = await api.get('/users/profile/', {
      headers: { Authorization: `Bearer ${access}` },
    });
    return response.data;
  } catch (error: any) {
    if (error?.response?.status === 401) {
      throw new TokenInvalidError('Token not valid');
    }
    handleAuthError(error);
  }
}

export async function verifyEmail(token: string) {
  try {
    return await api.post('/users/verify-email/', { token });
  } catch (error: any) {
    handleAuthError(error);
  }
}

export async function resendVerificationEmail(email: string) {
  try {
    return await api.post('/users/resend-verification/', { email });
  } catch (error: any) {
    handleAuthError(error);
  }
}

export async function forgotPassword(email: string) {
  try {
    return await api.post('/users/password-reset/', { email });
  } catch (error: any) {
    handleAuthError(error);
  }
}

export async function resetPasswordConfirm(uid: string, token: string, newPassword: string) {
  try {
    return await api.post('/users/password-reset-confirm/', { uid, token, new_password: newPassword });
  } catch (error: any) {
    handleAuthError(error);
  }
}

export async function checkPasswordStrength(password: string, username?: string, email?: string) {
  try {
    const response = await api.post('/users/password-strength-check/', { password, username, email });
    return response.data;
  } catch (error: any) {
    handleAuthError(error);
  }
}

export async function refreshToken() {
  const refresh = getRefreshToken();
  if (!refresh) throw new TokenInvalidError('No refresh token available');
  try {
    const response = await api.post('/token/refresh/', { refresh });
    setTokens(response.data.access, refresh, true);
    return response.data;
  } catch (error: any) {
    clearTokens();
    throw new TokenInvalidError('Token refresh failed');
  }
}

export async function googleLogin(googleToken: string) {
  try {
    const response = await api.post('/auth/google/', { token: googleToken });
    const { access, refresh, user } = response.data;
    setTokens(access, refresh, true);
    // If user profile is incomplete, return a flag
    if (!user.birthday || !user.gender) {
      return { needsProfileCompletion: true, user };
    }
    return { user };
  } catch (error: any) {
    handleAuthError(error);
  }
}

export function logout() {
  clearTokens();
}

// --- Centralized Error Handler ---
export function handleAuthError(error: any): never {
  if (error?.response?.data) {
    const messages = extractErrorMessages(error.response.data);
    if (messages.length) throw new Error(messages.join(' | '));
  }
  if (error?.message) throw new Error(error.message);
  throw error;
}
