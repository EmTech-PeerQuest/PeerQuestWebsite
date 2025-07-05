'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { login as apiLogin, register as apiRegister, fetchUser as fetchUserApi, logout as apiLogout, TokenInvalidError } from '@/lib/api/auth';
import { useRouter } from 'next/navigation';
import ThemedLoading from '@/components/ui/themed-loading';
import { toast } from '@/hooks/use-toast';

interface User {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  avatar_data?: string;
  avatar?: string; // Unified field for frontend use
}

interface AuthContextProps {
  user: User | null;
  login: (credentials: { username: string; password: string }) => Promise<void>;
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
        await loadUser(data.access);
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

  const loadUser = async (token: string) => {
    try {
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
      } else {
        setUser(null);
        localStorage.removeItem('user');
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: { username: string; password: string }) => {
    const res = await apiLogin(credentials.username, credentials.password);
    const { access } = res.data;
    localStorage.setItem('access_token', access);
    await loadUser(access);
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

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/');
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      loadUser(token);
    } else {
      setLoading(false);
    }
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
