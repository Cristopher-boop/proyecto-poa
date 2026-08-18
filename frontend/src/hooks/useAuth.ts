import { useAuthContext } from '../contexts/AuthContext';

/**
 * Hook para acceder al contexto de autenticación desde cualquier componente.
 *
 * @example
 * const { user, isAuthenticated, login, logout } = useAuth();
 */
export function useAuth() {
  return useAuthContext();
}
