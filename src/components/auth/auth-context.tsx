'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  AuthClient,
  AuthOrganization,
  AuthSession,
  AuthUser,
  createHttpAuthClient
} from '@/lib/auth-client';

type AuthContextValue = {
  user: AuthUser | null;
  organization: AuthOrganization | null;
  session: AuthSession | null;
  loading: boolean;
  login: (params: { username: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const authClient: AuthClient = createHttpAuthClient();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const current = await authClient.getSession();
        if (mounted) {
          setSession(current);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const handleLogin = async (params: {
    username: string;
    password: string;
  }) => {
    setLoading(true);
    try {
      const nextSession = await authClient.login(params);
      setSession(nextSession);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await authClient.logout();
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextValue = {
    user: session?.user ?? null,
    organization: session?.organization ?? null,
    session,
    loading,
    login: handleLogin,
    logout: handleLogout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return ctx;
}
