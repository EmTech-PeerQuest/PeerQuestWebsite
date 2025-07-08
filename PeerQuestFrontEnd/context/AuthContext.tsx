'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
  login as apiLogin,
  register as apiRegister,
  fetchUser as fetchUserApi,
  logout as apiLogout,
  TokenInvalidError
} from '@/lib/api/auth';
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
  token?: string | null; // Optional token for API calls
  login: (credentials: { username: string; password: string }) => Promise<void>;
  register: (data: {
    username: string;
    email: string;
    password: string;
    confirmPassword?: string;
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  token: null,
  login: async () => {},
  register: async () => {},
  logout: () => {}
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  });

  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadUser = async (token: string) => {
    try {
      const res = await fetchUserApi(token);
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
      setToken(token);
    } catch (err) {
      if (err instanceof TokenInvalidError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        setUser(null);
        setToken(null);
        toast({
          title: 'Session expired',
          description: 'Your session has expired. Please log in again.',
          variant: 'destructive'
        });
        router.push('/');
      } else {
        setUser(null);
        setToken(null);
        localStorage.removeItem('user');
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async ({ username, password }: { username: string; password: string }) => {
    const res = await apiLogin(username, password);
    const access = res.data.access;
    localStorage.setItem('access_token', access);
    await loadUser(access);
  };

  const register = async (data: {
    username: string;
    email: string;
    password: string;
    confirmPassword?: string;
  }) => {
    try {
      await apiRegister(data);
      await login({ username: data.username, password: data.password });
    } catch (err: any) {
      toast({
        title: 'Registration failed',
        description: err?.message || 'Please try again.',
        variant: 'destructive'
      });
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
    router.push('/');
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('access_token');
    if (savedToken) {
      loadUser(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {loading ? <ThemedLoading /> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
