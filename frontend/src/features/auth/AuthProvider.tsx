import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, tokens } from '../../lib/api-client';

interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  platformRole: 'platform_admin' | 'user';
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  ingestTokens: (access: string, refresh: string) => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadMe() {
    try {
      const { data } = await api.get('/me');
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    tokens.load();
    if (tokens.getAccess()) {
      loadMe();
    } else {
      setLoading(false);
    }
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      async signIn(email, password) {
        const { data } = await api.post('/auth/login', { email, password });
        tokens.set(data.accessToken, data.refreshToken);
        await loadMe();
      },
      async signUp(email, password, displayName) {
        const { data } = await api.post('/auth/register', { email, password, displayName });
        tokens.set(data.accessToken, data.refreshToken);
        await loadMe();
      },
      async signOut() {
        try {
          await api.post('/auth/logout');
        } catch {
          /* ignore */
        }
        tokens.clear();
        setUser(null);
      },
      async ingestTokens(access, refresh) {
        tokens.set(access, refresh);
        await loadMe();
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
