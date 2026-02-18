import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react';
import type { AuthState, AuthTokens, PegaOperator } from '../types/pega.types';
import * as authService from '../api/authService';

interface AuthContextValue extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    tokens: null,
    operator: null,
    loading: true,
    error: null,
  });

  // Restore session on mount
  useEffect(() => {
    const stored = sessionStorage.getItem('pega_tokens');
    const operator = sessionStorage.getItem('pega_operator');
    if (stored) {
      const tokens: AuthTokens = JSON.parse(stored);
      const isExpired = tokens.expiresAt > 0 && Date.now() > tokens.expiresAt;
      if (!isExpired) {
        setState({
          isAuthenticated: true,
          tokens,
          operator: operator ? JSON.parse(operator) : null,
          loading: false,
          error: null,
        });
        return;
      }
      sessionStorage.removeItem('pega_tokens');
      sessionStorage.removeItem('pega_operator');
    }
    setState((s) => ({ ...s, loading: false }));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const tokens = await authService.login(username, password);
      sessionStorage.setItem('pega_tokens', JSON.stringify(tokens));

      let operator: PegaOperator | null = null;
      try {
        operator = await authService.getOperatorInfo();
        sessionStorage.setItem('pega_operator', JSON.stringify(operator));
      } catch {
        // operator info is optional
      }

      setState({
        isAuthenticated: true,
        tokens,
        operator,
        loading: false,
        error: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setState((s) => ({ ...s, loading: false, error: message }));
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setState({
      isAuthenticated: false,
      tokens: null,
      operator: null,
      loading: false,
      error: null,
    });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
