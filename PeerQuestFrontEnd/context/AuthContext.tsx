'use client';

import { createContext, useEffect, useState } from 'react';
import axiosAuth from '@/lib/api/auth';

export const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState(null);

  const fetchUser = async () => {
    try {
      const res = await axiosAuth.get('/auth/user/');
      setUser(res.data);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
