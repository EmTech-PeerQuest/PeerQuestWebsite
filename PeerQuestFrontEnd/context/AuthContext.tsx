'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { login as apiLogin, register as apiRegister, fetchUser as fetchUserApi, logout as apiLogout, TokenInvalidError } from '@/lib/api/auth';
import { useRouter } from 'next/navigation';
import ThemedLoading from '@/components/ui/themed-loading';
import { toast } from '@/hooks/use-toast';
import { User } from '@/lib/types';

interface AuthContextProps {
  user: User | null;
  login: (credentials: { username: string; password: string; rememberMe?: boolean }) => Promise<void>;
  register: (data: { username: string; email: string; password: string; confirmPassword?: string }) => Promise<void>;
  logout: () => void;
  loginWithGoogle: (googleCredential: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}


const AuthContext = createContext<AuthContextProps>({
  user: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  loginWithGoogle: async () => {},
  refreshUser: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const loginWithGoogle = async (googleCredential: string) => {
    try {
      const res = await fetch("http://localhost:8000/api/auth/google/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: googleCredential }),
      });
      const data = await res.json();
      if (res.ok && data.access) {
        localStorage.setItem("access_token", data.access);
        await loadUser(data.access, true);
      } else {
        throw new Error(data?.error || data?.detail || "Google login failed");
      }
    } catch (err: any) {
      toast({ title: "Google Login Failed", description: err?.message || "Please try again.", variant: "destructive" });
      throw err;
    }
  };
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          
          // Re-validate avatar field in case validation logic changed
          if (parsed.avatar_url || parsed.avatar_data) {
            const avatarUrl = parsed.avatar_url || parsed.avatar_data;
            if (avatarUrl && (avatarUrl.startsWith('http') || avatarUrl.startsWith('data:'))) {
              parsed.avatar = avatarUrl;
            }
          }
          
          return parsed;
        } catch (e) {
          console.error('[AuthContext] Failed to parse stored user:', e);
          localStorage.removeItem('user');
        }
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadUser = async (token: string, isFromLogin: boolean = false) => {
    try {
      const res = await fetchUserApi(token);
      
      console.log('[AuthContext] Raw backend user data:', res.data);
      
      // Transform backend user data to frontend User type
      const avatarUrl = res.data.avatar_url || res.data.avatar_data;
      let finalAvatar = undefined;
      
      // Only set avatar if it's a valid URL or data URL
      if (avatarUrl && (avatarUrl.startsWith('http') || avatarUrl.startsWith('data:'))) {
        // For base64 images, validate they are reasonable size (under 10MB when decoded)
        if (avatarUrl.startsWith('data:')) {
          // Base64 images can be quite long, so we'll be more lenient
          if (avatarUrl.length < 15000000) { // ~10MB limit for base64
            finalAvatar = avatarUrl;
          } else {
            console.warn('[AuthContext] Avatar data too large, skipping');
          }
        } else {
          // For URLs, keep a reasonable length limit
          if (avatarUrl.length < 2000) {
            finalAvatar = avatarUrl;
          } else {
            console.warn('[AuthContext] Avatar URL too long, skipping');
          }
        }
      }
      
      const transformedUser = {
        ...res.data,
        avatar: finalAvatar,
        // Map backend snake_case fields to frontend camelCase
        dateJoined: res.data.date_joined || res.data.dateJoined,
        createdAt: res.data.created_at || res.data.createdAt || res.data.date_joined,
        displayName: res.data.display_name || res.data.displayName,
        lastPasswordChange: res.data.last_password_change || res.data.lastPasswordChange,
        birthday: res.data.birthday, // Ensure birthday is included
        gender: res.data.gender, // Ensure gender is included
        xp: res.data.experience_points || res.data.xp || 0,
        gold: res.data.gold_balance || res.data.gold || 0,
      };
      
      console.log('[AuthContext] Transformed user data:', transformedUser);
      
      setUser(transformedUser);
      localStorage.setItem('user', JSON.stringify(transformedUser));
    } catch (err) {
      if (err instanceof TokenInvalidError) {
        // Token invalid/expired: auto-logout and notify
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        setUser(null);
        toast({
          title: 'Session expired',
          description: 'Your session has expired. Please log in again.',
          variant: 'destructive',
        });
        router.push('/');
        
        // If this is from a login attempt, throw the error
        if (isFromLogin) {
          throw new Error('Session expired. Please log in again.');
        }
      } else {
        setUser(null);
        localStorage.removeItem('user');
        
        // If this is from a login attempt, throw the error
        if (isFromLogin) {
          throw new Error('Failed to load user profile. Please try again.');
        }
      }
    } finally {
      if (!isFromLogin) {
        setLoading(false);
      }
    }
  };

  const login = async (credentials: { username: string; password: string; rememberMe?: boolean }) => {
    console.log('🔍 AuthContext login called');
    try {
      console.log('🔍 AuthContext calling API login');
      const res = await apiLogin(credentials.username, credentials.password);
      const { access, refresh } = res.data;
      
      console.log('🔍 AuthContext API login successful');
      // Store access token in localStorage
      localStorage.setItem('access_token', access);
      
      // Store refresh token based on "Remember Me" preference
      if (credentials.rememberMe) {
        // Store refresh token in localStorage for persistent login
        localStorage.setItem('refresh_token', refresh);
        localStorage.setItem('remember_me', 'true');
      } else {
        // Store refresh token in sessionStorage for session-only login
        sessionStorage.setItem('refresh_token', refresh);
        localStorage.removeItem('remember_me');
      }
      
      console.log('🔍 AuthContext calling loadUser');
      await loadUser(access, true); // Pass true to indicate this is from login
      console.log('🔍 AuthContext login process completed successfully');
    } catch (error: any) {
      console.log('🔍 AuthContext login failed:', error);
      
      // Clear any tokens that might have been set
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      sessionStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      setUser(null);
      
      // Check if it's an email verification error
      if (error?.response?.data?.verification_required || 
          error?.message?.toLowerCase().includes('verify') ||
          error?.message?.toLowerCase().includes('verification')) {
        toast({
          title: 'Email Verification Required',
          description: 'Please verify your email address before logging in. Check your email for the verification link.',
          variant: 'destructive',
        });
        throw new Error('Email verification required');
      }
      
      // Re-throw the error to be handled by the modal
      console.log('🔍 AuthContext rethrowing error for modal to handle');
      throw error;
    }
  };

  const register = async (data: { username: string; email: string; password: string; confirmPassword?: string }) => {
    try {
      // Call backend registration API
      const response = await apiRegister(data);
      
      // Check if registration was successful and email verification is required
      if (response.data.message) {
        // Show success message about email verification
        toast({
          title: 'Registration Successful!',
          description: response.data.message,
          variant: 'default',
        });
        
        // Don't auto-login since email verification is required
        // Instead, redirect to a verification notice page
        router.push('/register-success?email=' + encodeURIComponent(data.email));
      } else {
        // Old behavior for backward compatibility
        await login({ username: data.username, password: data.password });
      }
    } catch (err: any) {
      // Optionally show a toast or propagate error
      toast({ title: 'Registration failed', description: err?.message || 'Please try again.', variant: 'destructive' });
      throw err;
    }
  };

  const logout = () => {
    // Clear all tokens and user data
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    sessionStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('remember_me');
    
    setUser(null);
    router.push('/');
  };

  const refreshAccessToken = async (): Promise<string | null> => {
    try {
      // Try to get refresh token from localStorage first (remember me), then sessionStorage
      const refreshToken = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
      
      if (!refreshToken) {
        return null;
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/api/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });
      
      if (!response.ok) {
        throw new Error('Token refresh failed');
      }
      
      const data = await response.json();
      const newAccessToken = data.access;
      
      // Update access token in localStorage
      localStorage.setItem('access_token', newAccessToken);
      
      return newAccessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      
      // Clear all tokens on refresh failure
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      sessionStorage.removeItem('refresh_token');
      localStorage.removeItem('remember_me');
      
      return null;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('access_token');
      
      if (token) {
        try {
          await loadUser(token);
        } catch (error) {
          // Access token might be expired, try to refresh
          console.log('Access token failed, attempting refresh...');
          const newToken = await refreshAccessToken();
          
          if (newToken) {
            try {
              await loadUser(newToken);
            } catch (refreshError) {
              console.error('Failed to load user after token refresh:', refreshError);
              setLoading(false);
            }
          } else {
            setLoading(false);
          }
        }
      } else {
        // No access token, try to refresh if we have a refresh token
        const refreshToken = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
        
        if (refreshToken) {
          console.log('No access token but found refresh token, attempting refresh...');
          const newToken = await refreshAccessToken();
          
          if (newToken) {
            try {
              await loadUser(newToken);
            } catch (refreshError) {
              console.error('Failed to load user after token refresh:', refreshError);
              setLoading(false);
            }
          } else {
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      }
    };
    
    initializeAuth();
    
    // Listen for storage changes (multi-tab sync)
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'user') {
        const newUser = event.newValue ? JSON.parse(event.newValue) : null;
        setUser(newUser);
      }
      if (event.key === 'access_token' && !event.newValue) {
        // Token removed (logout in another tab)
        setUser(null);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const refreshUser = async () => {
    const token = localStorage.getItem('access_token');
    if (token) {
      await loadUser(token);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loginWithGoogle, refreshUser }}>
      {loading ? <ThemedLoading /> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
