import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { IUser } from '@shared-types/index';
import { apiFetch } from '../../lib/api';

type AuthState = {
  user: IUser | null;
  token: string | null;
  isLoading: boolean;
};

type AuthContextValue = AuthState & {
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    name: string;
    email: string;
    password: string;
    role?: 'citizen' | 'admin';
    department?: string;
  }) => Promise<void>;
  refreshMe: () => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const LS_TOKEN = 'civictrack.token';
const LS_USER = 'civictrack.user';

function readStored(): { token: string | null; user: IUser | null } {
  const token = localStorage.getItem(LS_TOKEN);
  const userRaw = localStorage.getItem(LS_USER);
  const user = userRaw ? (JSON.parse(userRaw) as IUser) : null;
  return { token: token ?? null, user };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const stored = useMemo(() => readStored(), []);
  const [state, setState] = useState<AuthState>({
    user: stored.user,
    token: stored.token,
    isLoading: true,
  });

  const setSession = useCallback((token: string, user: IUser) => {
    localStorage.setItem(LS_TOKEN, token);
    localStorage.setItem(LS_USER, JSON.stringify(user));
    setState({ token, user, isLoading: false });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(LS_TOKEN);
    localStorage.removeItem(LS_USER);
    setState({ token: null, user: null, isLoading: false });
  }, []);

  useEffect(() => {
    const { token } = readStored();
    if (!token) {
      setState((s) => ({ ...s, isLoading: false }));
      return;
    }
    apiFetch<{ user: IUser }>('/api/auth/me', { token })
      .then((res) => {
        if (!res.user) return logout();
        setSession(token, res.user);
      })
      .catch(() => logout());
  }, [logout, setSession]);

  const refreshMe = useCallback(async () => {
    const { token } = readStored();
    if (!token) return;
    const res = await apiFetch<{ user: IUser }>('/api/auth/me', { token });
    if (!res.user) return logout();
    setSession(token, res.user);
  }, [logout, setSession]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiFetch<{ token: string; user: IUser }>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    setSession(res.token, res.user);
  }, [setSession]);

  const register = useCallback(async (input: {
    name: string;
    email: string;
    password: string;
    role?: 'citizen' | 'admin';
    department?: string;
  }) => {
    const res = await apiFetch<{ token: string; user: IUser }>('/api/auth/register', {
      method: 'POST',
      body: input,
    });
    setSession(res.token, res.user);
  }, [setSession]);

  const value: AuthContextValue = {
    ...state,
    login,
    register,
    refreshMe,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

