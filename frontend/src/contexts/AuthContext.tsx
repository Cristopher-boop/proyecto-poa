import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  clearTokens,
  getCurrentUser,
  getStoredTokens,
  loginUser,
  saveTokens,
  type LoginCredentials,
  type UserProfile,
} from '../services/authService';

// ── Tipos ────────────────────────────────────────────────────────────────────

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

// ── Contexto ─────────────────────────────────────────────────────────────────

export const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Al montar, si hay tokens guardados, recuperar perfil del usuario
  useEffect(() => {
    const { access } = getStoredTokens();
    if (!access) {
      setState({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }

    getCurrentUser()
      .then((user) => {
        setState({ user, isAuthenticated: true, isLoading: false });
      })
      .catch(() => {
        clearTokens();
        setState({ user: null, isAuthenticated: false, isLoading: false });
      });
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const tokens = await loginUser(credentials);
    saveTokens(tokens);
    const user = await getCurrentUser();
    setState({ user, isAuthenticated: true, isLoading: false });
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setState({ user: null, isAuthenticated: false, isLoading: false });
  }, []);

  const value = useMemo(
    () => ({ ...state, login, logout }),
    [state, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ── Hook interno (uso directo en componentes) ─────────────────────────────────

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext debe usarse dentro de <AuthProvider>');
  return ctx;
}
