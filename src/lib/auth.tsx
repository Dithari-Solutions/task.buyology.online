'use client';

import { useQueryClient } from '@tanstack/react-query';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, TOKEN_COOKIE } from './api';
import type { LoginResponse, User } from './types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const queryClient = useQueryClient();

  const refresh = useCallback(async () => {
    const token = Cookies.get(TOKEN_COOKIE);
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get<User>('/auth/me');
      setUser(data);
    } catch {
      Cookies.remove(TOKEN_COOKIE);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<LoginResponse>('/auth/login', { email, password });
    Cookies.set(TOKEN_COOKIE, data.token, {
      expires: 1,
      sameSite: 'lax',
      secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
    });
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    Cookies.remove(TOKEN_COOKIE);
    setUser(null);
    queryClient.clear();
    router.push('/login');
  }, [queryClient, router]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, isAdmin: user?.role === 'ADMIN', login, logout, refresh }),
    [user, loading, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return context;
}
