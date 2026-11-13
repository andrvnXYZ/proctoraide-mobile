import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { apiRequest } from '@/lib/api';
import type { Role, User } from '@/types';

const TOKEN_KEY = 'proctoraide.api.token';

type AuthContextValue = {
  ready: boolean;
  token: string | null;
  user: User | null;
  login: (identifier: string, password: string, role: Role) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function readToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return globalThis.localStorage?.getItem(TOKEN_KEY) ?? null;
  }

  return SecureStore.getItemAsync(TOKEN_KEY);
}

async function writeToken(token: string | null): Promise<void> {
  if (Platform.OS === 'web') {
    if (token) {
      globalThis.localStorage?.setItem(TOKEN_KEY, token);
    } else {
      globalThis.localStorage?.removeItem(TOKEN_KEY);
    }

    return;
  }

  if (token) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const stored = await readToken();

        if (!stored) {
          return;
        }

        const payload = await apiRequest<{ user: User }>('/auth/me', { token: stored });

        if (!active) return;

        setToken(stored);
        setUser(payload.user);
      } catch {
        await writeToken(null);
      } finally {
        if (active) setReady(true);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (identifier: string, password: string, role: Role) => {
    const payload = await apiRequest<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: { identifier, password, role, device_name: `ProctorAide ${Platform.OS}` },
    });

    await writeToken(payload.token);
    setToken(payload.token);
    setUser(payload.user);

    return payload.user;
  }, []);

  const logout = useCallback(async () => {
    const current = token;

    setToken(null);
    setUser(null);
    await writeToken(null);

    if (current) {
      try {
        await apiRequest('/auth/logout', { method: 'POST', token: current });
      } catch {
        // The local token is already gone; a failed revoke is not fatal.
      }
    }
  }, [token]);

  const refreshUser = useCallback(async () => {
    if (!token) return;

    const payload = await apiRequest<{ user: User }>('/auth/me', { token });
    setUser(payload.user);
  }, [token]);

  const value = useMemo(
    () => ({ ready, token, user, login, logout, refreshUser }),
    [ready, token, user, login, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
