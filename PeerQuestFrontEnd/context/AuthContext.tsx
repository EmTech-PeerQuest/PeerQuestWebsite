'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { login as apiLogin, register as apiRegister, fetchUser as fetchUserApi, logout as apiLogout, TokenInvalidError } from '@/lib/api/auth';
import { useRouter } from 'next/navigation';
import ThemedLoading from '@/components/ui/themed-loading';
import { toast } from '@/hooks/use-toast';
import { User } from '@/lib/types';

interface AuthContextProps {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: { username: string; password: string; rememberMe?: boolean }) => Promise<void>;
  register: (data: { username: string; email: string; password: string; confirmPassword: string; birthday?: string | null; gender?: string | null }) => Promise<void>;
  logout: () => void;
  loginWithGoogle: (googleCredential: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  clearAllAuthCache: () => void;
}


const AuthContext = createContext<AuthContextProps>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  loginWithGoogle: async () => {},
  refreshUser: async () => {},
  clearAllAuthCache: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
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

  // --- ADD: token state management ---
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  });


  // Google login
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
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadUser = async (token: string, isFromLogin: boolean = false) => {
    try {
      const res = await fetchUserApi(token);
      // ...existing code...
      const avatarUrl = res.avatar_url;
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
        ...res,
        avatar: finalAvatar,
        dateJoined: res.dateJoined,
        createdAt: res.createdAt,
        displayName: res.displayName,
        lastPasswordChange: res.lastPasswordChange,
        birthday: res.birthday,
        gender: res.gender,
        xp: res.xp || 0,
        gold: res.gold || 0,
        is_staff: res.is_staff,
        is_superuser: res.is_superuser,
        isSuperuser: res.is_superuser || res.isSuperuser,
        // Ban fields
        isBanned: res.isBanned,
        banReason: res.banReason,
        banExpiration: res.banExpiration,
      };
      transformedUser.is_staff = !!(res.is_staff);
      transformedUser.isSuperuser = !!(res.is_superuser || res.isSuperuser);
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
  }

  const login = async (credentials: { username: string; password: string; rememberMe?: boolean }) => {
    try {
      const res = await apiLogin(credentials.username, credentials.password);
      const { access, refresh } = res.data;
      localStorage.setItem('access_token', access);
      if (credentials.rememberMe) {
        localStorage.setItem('refresh_token', refresh);
        localStorage.setItem('remember_me', 'true');
      } else {
        sessionStorage.setItem('refresh_token', refresh);
        localStorage.removeItem('remember_me');
      }
      await loadUser(access, true);
    } catch (err: any) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      sessionStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      setUser(null);
      if (err instanceof TokenInvalidError) {
        toast({
          title: 'Session expired',
          description: 'Your session has expired. Please log in again.',
          variant: 'destructive',
        });
        router.push('/');
      } else {
        toast({
          title: 'Login failed',
          description: err?.message || 'Please try again.',
          variant: 'destructive',
        });
      }
      throw err;
    }
  };

  // Registration
  const register = async (data: { username: string; email: string; password: string; confirmPassword: string; birthday?: string | null; gender?: string | null }) => {
    try {
      const response = await apiRegister(data);
      toast({
        title: 'Registration Successful!',
        description: response.data.message || 'Please check your email for a verification link to complete your account setup.',
        variant: 'default',
      });
      const encodedEmail = encodeURIComponent(data.email);
      router.push(`/register-success?email=${encodedEmail}`);
    } catch (err: any) {
      toast({
        title: 'Registration failed',
        description: err?.message || 'Please try again.',
        variant: 'destructive',
      });
      throw err;
    }
  }


  // Refresh user profile
  const refreshUser = async () => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        await loadUser(token, false);
        console.log('✅ User data refreshed successfully');
      } catch (err) {
        console.error('❌ Failed to refresh user data:', err);
        if (err instanceof TokenInvalidError) {
          logout();
        }
      }
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('jwt');
    localStorage.removeItem('authToken'); // Clear old authToken key as well
    localStorage.removeItem('currentUser'); // Clear mock auth user
    
    // Clear any other cached data
    sessionStorage.clear();
    // Clear cookies
    document.cookie.split(';').forEach((c) => {
      const eqPos = c.indexOf('=');
      const name = eqPos > -1 ? c.substr(0, eqPos) : c;
      document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
      document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=localhost';
    });
    setUser(null);
    router.push('/');
  };

  // Utility function to clear all auth-related cache data
  const clearAllAuthCache = () => {
    
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
        timeoutId = setTimeout(() => {
          setLoading(false);
        }, 5000);
        const token = localStorage.getItem('access_token');
        if (token) {
          try {
            await loadUser(token, false);
            console.log('✅ Token validation successful during initialization');
          } catch (err) {
            // Access token might be expired, try to refresh
            const newToken = await refreshAccessToken();
            if (newToken) {
              try {
                await loadUser(newToken, false);
              } catch (refreshError) {
                console.error('Failed to load user after token refresh:', refreshError);
              }
            } else {
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
              localStorage.removeItem('user');
              setUser(null);
            }
          }
        } else {
          // No access token, try to refresh if we have a refresh token
          const refreshToken = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
          if (refreshToken) {
            const newToken = await refreshAccessToken();
            if (newToken) {
              try {
                await loadUser(newToken, false);
              } catch (refreshError) {
                console.error('Failed to load user after token refresh:', refreshError);
              }
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
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
        setUser(null);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, []);



  return (
    <AuthContext.Provider value={{ user, token, isLoading: loading, login, register, logout, loginWithGoogle, refreshUser, clearAllAuthCache }}>
      {loading ? <ThemedLoading /> : children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
