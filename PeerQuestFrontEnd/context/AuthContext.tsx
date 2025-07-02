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
}

interface AuthContextProps {
  user: User | null;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  register: (data: { username: string; email: string; password: string; confirmPassword?: string }) => Promise<void>;
  logout: () => void;
  loginWithGoogle: (googleCredential: string) => Promise<void>;
}


const AuthContext = createContext<AuthContextProps>({
  user: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  loginWithGoogle: async () => {},
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
      const parsed = stored ? JSON.parse(stored) : null;
      console.log('[AuthContext] Initial user from localStorage:', parsed);
      return parsed;
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadUser = async (token: string) => {
    try {
      const res = await fetchUserApi(token);
      console.log('[AuthContext] loadUser fetched:', res.data);
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
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

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loginWithGoogle }}>
      {loading ? <ThemedLoading /> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
