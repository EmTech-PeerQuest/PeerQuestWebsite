'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { login as apiLogin, register as apiRegister, fetchUser as fetchUserApi, logout as apiLogout, TokenInvalidError } from '@/lib/api/auth';
import { useRouter } from 'next/navigation';
import ThemedLoading from '@/components/ui/themed-loading';
import { toast } from '@/hooks/use-toast';
import { User } from '@/lib/types';

interface AuthContextProps {
  user: User | null;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  register: (data: { username: string; email: string; password: string; confirmPassword?: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  refreshUser: async () => {},
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
    try {
      const res = await fetchUserApi(token);
      console.log('🔍 User profile data from API:', res.data);
      if (res.data.gold_balance !== undefined) {
        console.log('💰 User profile gold_balance:', res.data.gold_balance, typeof res.data.gold_balance);
      }
      
      // Map gold_balance to gold for frontend consistency
      const userData = {
        ...res.data,
        gold: res.data.gold_balance || res.data.gold || 0
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
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, refreshUser }}>
      {loading ? <ThemedLoading /> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
