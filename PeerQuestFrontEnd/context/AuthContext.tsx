'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { login as apiLogin, register as apiRegister, fetchUser as fetchUserApi, logout as apiLogout } from '@/lib/api/auth';
import { useRouter } from 'next/navigation';

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
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
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
      setUser(null);
      localStorage.removeItem('user');
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
    await apiRegister(data);
    // Optionally auto-login after register
    await login({ username: data.username, password: data.password });
  };

  const logout = () => {
    localStorage.removeItem('access_token');
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
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {loading ? <div className="min-h-screen flex items-center justify-center">Loading...</div> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
