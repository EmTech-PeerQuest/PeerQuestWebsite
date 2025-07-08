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
  register: (data: { username: string; email: string; password: string; confirmPassword: string; birthday?: string | null; gender?: string | null }) => Promise<void>;
  logout: () => void;
  loginWithGoogle: (googleCredential: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  clearAllAuthCache: () => void;
}


const AuthContext = createContext<AuthContextProps>({
  user: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  loginWithGoogle: async () => {},
  refreshUser: async () => {},
  clearAllAuthCache: () => {},
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
        // After loading user, check if banned and enforce ban UX
        const storedUser = localStorage.getItem('user');
        let parsedUser = null;
        if (storedUser) {
          try {
            parsedUser = JSON.parse(storedUser);
          } catch (e) {
            parsedUser = null;
          }
        }
        if (parsedUser && parsedUser.isBanned) {
          // Remove tokens and user state, redirect to /banned
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          setUser(null);
          toast({
            title: 'Account Banned',
            description: parsedUser.banReason || 'You are banned from PeerQuest.',
            variant: 'destructive',
          });
          window.location.href = '/banned';
          return;
        }
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
      // ...existing code...
      const avatarUrl = res.data.avatar_url || res.data.avatar_data;
      let finalAvatar = undefined;
      if (avatarUrl && (avatarUrl.startsWith('http') || avatarUrl.startsWith('data:'))) {
        if (avatarUrl.startsWith('data:')) {
          if (avatarUrl.length < 15000000) {
            finalAvatar = avatarUrl;
          } else {
            console.warn('[AuthContext] Avatar data too large, skipping');
          }
        } else {
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
        dateJoined: res.data.date_joined || res.data.dateJoined,
        createdAt: res.data.created_at || res.data.createdAt || res.data.date_joined,
        displayName: res.data.display_name || res.data.displayName,
        lastPasswordChange: res.data.last_password_change || res.data.lastPasswordChange,
        birthday: res.data.birthday,
        gender: res.data.gender,
        xp: res.data.experience_points || res.data.xp || 0,
        gold: res.data.gold_balance || res.data.gold || 0,
        is_staff: res.data.is_staff,
        is_superuser: res.data.is_superuser,
        isSuperuser: res.data.is_superuser,
        // Ban fields
        isBanned: res.data.is_banned,
        banReason: res.data.ban_reason,
        banExpiration: res.data.ban_expires_at,
      };
      transformedUser.is_staff = !!(res.data.is_staff);
      transformedUser.isSuperuser = !!(res.data.is_superuser || res.data.isSuperuser);
      // If banned, clear state and redirect before setting user
      if (transformedUser.isBanned) {
        toast({
          title: 'Account Banned',
          description: transformedUser.banReason || 'You are banned from PeerQuest.',
          variant: 'destructive',
        });
        window.location.href = '/banned';
        // Do NOT clear tokens or user state, so banned users can submit appeals
        // Optionally, you may want to setUser(transformedUser) here to keep user info in context
        setUser(transformedUser);
        localStorage.setItem('user', JSON.stringify(transformedUser));
        return;
      }
      setUser(transformedUser);
      localStorage.setItem('user', JSON.stringify(transformedUser));
    } catch (err: any) {
      // Handle ban enforcement (403 Forbidden)
      if (err?.response?.status === 403 && err?.response?.data?.ban_reason) {
        // Store ban info in localStorage for ban screen
        const banInfo = {
          reason: err.response.data.ban_reason,
          expiresAt: err.response.data.ban_expires_at || null,
        };
        localStorage.setItem('ban_info', JSON.stringify(banInfo));
        // Do NOT remove access_token here, so banned users can submit appeals
        setUser(null);
        localStorage.removeItem('user');
        toast({
          title: 'Account Banned',
          description: err.response.data.ban_reason,
          variant: 'destructive',
        });
        router.push('/banned');
        return;
      }
      if (err instanceof TokenInvalidError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        setUser(null);
        toast({
          title: 'Session expired',
          description: 'Your session has expired. Please log in again.',
          variant: 'destructive',
        });
        router.push('/');
        if (isFromLogin) {
          throw new Error('Session expired. Please log in again.');
        }
      } else {
        setUser(null);
        localStorage.removeItem('user');
        if (isFromLogin) {
          throw new Error('Failed to load user profile. Please try again.');
        }
      }
    } finally {
      if (isFromLogin) {
        // Don't set loading state for login - let parent handle it
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

  const register = async (data: { username: string; email: string; password: string; confirmPassword: string; birthday?: string | null; gender?: string | null }) => {
    try {
      console.log('🔍 AuthContext: Starting registration');
      // Call backend registration API
      const response = await apiRegister(data);
      console.log('🔍 AuthContext: Registration response:', response);
      
      // Registration was successful - redirect to success page with email
      console.log('🔍 AuthContext: Registration successful, redirecting to success page');
      
      // Show success message about email verification
      toast({
        title: 'Registration Successful!',
        description: response.data.message || 'Please check your email for a verification link to complete your account setup.',
        variant: 'default',
      });
      
      // Redirect to registration success page with the user's email
      const encodedEmail = encodeURIComponent(data.email);
      router.push(`/register-success?email=${encodedEmail}`);
      
      // Don't return the response, just complete successfully
    } catch (err: any) {
      console.log('🔍 AuthContext: Registration failed:', err);
      // Show error toast
      toast({ 
        title: 'Registration failed', 
        description: err?.message || 'Please try again.', 
        variant: 'destructive' 
      });
      throw err;
    }
  };

  const logout = () => {
    console.log('🔍 Logging out and clearing all stored data...');
    // Clear all authentication data
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('jwt');
    sessionStorage.clear();
    // Clear cookies
    document.cookie.split(';').forEach((c) => {
      const eqPos = c.indexOf('=');
      const name = eqPos > -1 ? c.substr(0, eqPos) : c;
      document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
      document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=localhost';
    });
    setUser(null);
    // Force reload to ensure all state is cleared and redirect to home
    window.location.href = '/';
  };

  // Utility function to clear all auth-related cache data
  const clearAllAuthCache = () => {
    console.log('🔍 Clearing all authentication cache data...');
    
    // Clear localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('jwt');
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Clear cookies
    document.cookie.split(";").forEach((c) => {
      const eqPos = c.indexOf("=");
      const name = eqPos > -1 ? c.substr(0, eqPos) : c;
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=localhost";
    });
    
    // Reset user state
    setUser(null);
    
    console.log('✅ All authentication cache cleared');
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
      let timeoutId: NodeJS.Timeout | null = null;
      
      try {
        console.log('🔍 Starting auth initialization...');
        
        // Add a timeout to prevent hanging
        timeoutId = setTimeout(() => {
          console.warn('Auth initialization timeout - forcing loading to false');
          setLoading(false);
        }, 5000); // 5 second timeout (reduced from 10)
        
        const token = localStorage.getItem('access_token');
        console.log('🔍 Found access token:', !!token);
        
        if (token) {
          try {
            console.log('🔍 Loading user with existing token...');
            await loadUser(token);
            console.log('🔍 User loaded successfully');
          } catch (error) {
            // Access token might be expired, try to refresh
            console.log('Access token failed, attempting refresh...');
            const newToken = await refreshAccessToken();
            
            if (newToken) {
              try {
                console.log('🔍 Loading user with refreshed token...');
                await loadUser(newToken);
                console.log('🔍 User loaded with refreshed token');
              } catch (refreshError) {
                console.error('Failed to load user after token refresh:', refreshError);
              }
            }
          }
        } else {
          // No access token, try to refresh if we have a refresh token
          const refreshToken = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
          console.log('🔍 Found refresh token:', !!refreshToken);
          
          if (refreshToken) {
            console.log('No access token but found refresh token, attempting refresh...');
            const newToken = await refreshAccessToken();
            
            if (newToken) {
              try {
                console.log('🔍 Loading user with new token from refresh...');
                await loadUser(newToken);
                console.log('🔍 User loaded with new token');
              } catch (refreshError) {
                console.error('Failed to load user after token refresh:', refreshError);
              }
            }
          }
        }
        
        console.log('🔍 Auth initialization completed successfully');
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        // Clear timeout and set loading to false
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        console.log('🔍 Setting loading to false...');
        setLoading(false);
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
    <AuthContext.Provider value={{ user, login, register, logout, loginWithGoogle, refreshUser, clearAllAuthCache }}>
      {loading ? <ThemedLoading /> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
