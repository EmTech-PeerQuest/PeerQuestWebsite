'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { customLogin, customRegister, fetchUser as fetchUserApi, logout as apiLogout, TokenInvalidError } from '@/lib/api/auth';
import { useRouter } from 'next/navigation';
import ThemedLoading from '@/components/ui/themed-loading';

interface User {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
}

interface AuthContextProps {
  user: User | null;
  loading: boolean;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  register: (data: { username: string; email: string; password: string; confirmPassword?: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
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
    } catch (err) {
      if (err instanceof TokenInvalidError) {
        // Token invalid/expired: auto-logout and notify
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        setUser(null);
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
    const res = await customLogin(credentials.username, credentials.password);
    console.log('[AuthContext] login response:', JSON.stringify(res));
    if (res.user) {
      setUser(res.user);
      localStorage.setItem('user', JSON.stringify(res.user));
      if (res.token || res.access_token) {
        localStorage.setItem('access_token', res.token || res.access_token);
      }
    }
  };

  const register = async (data: { username: string; email: string; password: string; confirmPassword?: string }) => {
    try {
      const res = await customRegister(data);
      console.log('[AuthContext] register response:', res);
      if (res.user) {
        setUser(res.user);
        localStorage.setItem('user', JSON.stringify(res.user));
        if (res.token || res.access_token) {
          localStorage.setItem('access_token', res.token || res.access_token);
        }
      }
    } catch (err: any) {
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setUser(null);
    // Show brown toast on logout
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('show-toast', {
        detail: { message: 'You have been logged out.', type: 'brown' }
      });
      window.dispatchEvent(event);
    }
    router.push('/');
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      loadUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {loading ? <ThemedLoading /> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
