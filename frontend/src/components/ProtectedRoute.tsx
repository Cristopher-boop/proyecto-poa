import { Navigate, Outlet, type To } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  redirectTo?: To;
}

/**
 * Envuelve rutas privadas. Si el usuario no está autenticado,
 * redirige a /login. Muestra un spinner mientras verifica la sesión.
 */
export default function ProtectedRoute({ redirectTo = '/login' }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-base">
        <div className="w-8 h-8 rounded-full border-4 border-theme-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to={redirectTo} replace />;
}
