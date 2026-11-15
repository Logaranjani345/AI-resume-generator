import React, { createContext, useContext, useEffect, useState } from 'react';

export interface AuthUser {
  id: string;
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  authError: string | null;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  createAccount: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function readResponse(response: Response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Authentication request failed.');
  }
  return data;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadCurrentUser = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'same-origin',
        });
        const data = await readResponse(response);
        if (active) {
          setUser(data.user || null);
          setAuthError(null);
        }
      } catch (error) {
        if (active) {
          setAuthError(
            error instanceof Error ? error.message : 'Unable to load your session.'
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadCurrentUser();
    return () => {
      active = false;
    };
  }, []);

  const authenticate = async (
    endpoint: '/api/auth/login' | '/api/auth/register',
    email: string,
    password: string
  ) => {
    setAuthError(null);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email, password }),
      });
      const data = await readResponse(response);
      setUser(data.user);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Authentication request failed.';
      setAuthError(message);
      throw new Error(message);
    }
  };

  const signInWithEmail = (email: string, password: string) =>
    authenticate('/api/auth/login', email, password);

  const createAccount = (email: string, password: string) =>
    authenticate('/api/auth/register', email, password);

  const signOutUser = async () => {
    setAuthError(null);
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
      });
      await readResponse(response);
      setUser(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to sign out right now.';
      setAuthError(message);
      throw new Error(message);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authError,
        signInWithEmail,
        createAccount,
        signOutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
