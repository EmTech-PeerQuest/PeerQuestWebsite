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
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user');
      const user = stored ? JSON.parse(stored) : null;
      console.log('🔍 Initial user from localStorage:', user);
      return user;
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadUser = async (token: string, setLoadingState: boolean = true) => {
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
      console.log('🔍 User profile data from API:', res.data);
      if (res.data.gold_balance !== undefined) {
        console.log('💰 User profile gold_balance:', res.data.gold_balance, typeof res.data.gold_balance);
      }
      
      // Map gold_balance to gold for frontend consistency
      const userData = {
        ...res.data,
        gold: res.data.gold_balance ?? 0  // Use nullish coalescing since backend now returns proper numbers
      };
      
      console.log('🔍 Setting user in auth context:', userData);
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return userData; // Return user data on success
    } catch (err) {
      console.error('❌ Error loading user profile:', err);
      
      // Clear auth state regardless of error type during initialization
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      const res = await fetchUserApi(token);
      
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
          }
        } else {
          // For URLs, keep a reasonable length limit
          if (avatarUrl.length < 2000) {
            finalAvatar = avatarUrl;
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
      // Only set loading to false if this is from login
      // For initialization, loading is managed by the useEffect
      if (isFromLogin) {
        // Don't set loading state for login - let parent handle it
      }
    }
  };

  const login = async (credentials: { username: string; password: string; rememberMe?: boolean }) => {
    try {
      const res = await apiLogin(credentials.username, credentials.password);
      const { access, refresh } = res.data;
      
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
      
      await loadUser(access, true); // Pass true to indicate this is from login
    } catch (error: any) {
      
      // Clear any tokens that might have been set
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      sessionStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      setUser(null);
      
      if (err instanceof TokenInvalidError) {
        console.warn('🚨 Token invalid, auth state cleared');
        // Only show toast if this is not during app initialization
        if (setLoadingState) {
          toast({
            title: 'Session expired',
            description: 'Your session has expired. Please log in again.',
            variant: 'destructive',
          });
          router.push('/');
        }
      } else {
        console.error('🚨 Other error during user load:', err);
        // For non-token errors, only show toast during interactive operations
        if (setLoadingState) {
          toast({
            title: 'Error loading profile',
            description: 'Failed to load user profile. Please try logging in again.',
            variant: 'destructive',
          });
        }
      }
      
      // During app initialization (setLoadingState = false), don't re-throw error
      if (setLoadingState) {
        throw err;
      }
      
      return null; // Return null during initialization to indicate failure
    } finally {
      if (setLoadingState) {
        setLoading(false);
      }
    }
  };

  const login = async (credentials: { username: string; password: string }) => {
    const res = await apiLogin(credentials.username, credentials.password);
    const { access, refresh } = res.data;
    
    // Store both tokens
    localStorage.setItem('access_token', access);
    if (refresh) {
      localStorage.setItem('refresh_token', refresh);
      console.log('🔑 Stored refresh token');
    } else {
      console.warn('⚠️ No refresh token received during login');
    }
    
    await loadUser(access, true);
  };

  const register = async (data: { username: string; email: string; password: string; confirmPassword?: string }) => {
    try {
      // Call backend registration API
      await apiRegister(data);
      // Only login if registration succeeds
      await login({ username: data.username, password: data.password });
    } catch (err: any) {
      // Optionally show a toast or propagate error
      toast({ title: 'Registration failed', description: err?.message || 'Please try again.', variant: 'destructive' });
      throw err;
    }
  };

  const refreshUser = async () => {
    const token = localStorage.getItem('access_token');
    if (token && user) {
      try {
        await loadUser(token, false);
        console.log('✅ User data refreshed successfully');
      } catch (err) {
        console.error('❌ Failed to refresh user data:', err);
        // If refresh fails due to token issues, clear auth state
        if (err instanceof TokenInvalidError) {
          console.warn('🚨 Token invalid during refresh, logging out');
          logout();
        }
      }
    }
  };

  const logout = () => {
    // Clear all authentication data
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/');
      
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
      throw error;
    }
  };

  const register = async (data: { username: string; email: string; password: string; confirmPassword: string; birthday?: string | null; gender?: string | null }) => {
    try {
      // Call backend registration API
      const response = await apiRegister(data);
      
      // Registration was successful - redirect to success page with email
      
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
    
    // Clear all authentication data
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('jwt');
    
    // Clear any other cached data
    sessionStorage.clear();
    
    // Reset user state
    setUser(null);
    
    
    // Redirect to home page
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
      const token = localStorage.getItem('access_token');
      if (token) {
        console.log('🔑 Token found during initialization, validating...');
        try {
          // During initialization, loadUser won't throw errors, returns null on failure
          await loadUser(token, false);
          console.log('✅ Token validation successful during initialization');
        } catch (err) {
          // This shouldn't happen now, but handle it just in case
          console.warn('🚨 Unexpected error during token validation:', err);
          // Clear auth state
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          setUser(null);
        }
      } else {
        console.log('🔍 No token found during initialization');
      }
      setLoading(false);
    };

    initializeAuth();
    const initializeAuth = async () => {
      let timeoutId: NodeJS.Timeout | null = null;
      
      try {
        
        // Add a timeout to prevent hanging
        timeoutId = setTimeout(() => {
          setLoading(false);
        }, 5000); // 5 second timeout (reduced from 10)
        
        const token = localStorage.getItem('access_token');
        
        if (token) {
          try {
            await loadUser(token);
          } catch (error) {
            // Access token might be expired, try to refresh
            const newToken = await refreshAccessToken();
            
            if (newToken) {
              try {
                await loadUser(newToken);
              } catch (refreshError) {
                console.error('Failed to load user after token refresh:', refreshError);
              }
            }
          }
        } else {
          // No access token, try to refresh if we have a refresh token
          const refreshToken = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
          
          if (refreshToken) {
            const newToken = await refreshAccessToken();
            
            if (newToken) {
              try {
                await loadUser(newToken);
              } catch (refreshError) {
                console.error('Failed to load user after token refresh:', refreshError);
              }
            }
          }
        }
        
        
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        // Clear timeout and set loading to false
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
    <AuthContext.Provider value={{ user, login, register, logout, refreshUser }}>
      {loading ? <ThemedLoading /> : children}
    <AuthContext.Provider value={{ user, login, register, logout, loginWithGoogle, refreshUser, clearAllAuthCache }}>
      {loading ? <ThemedLoading /> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export const useAuth = () => useContext(AuthContext);
