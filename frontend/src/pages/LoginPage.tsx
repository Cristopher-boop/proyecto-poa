import { useState, type FormEvent } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getErrorMessage(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error
  ) {
    const response = (error as { response?: { status?: number } }).response;
    if (response?.status === 401) return 'Credenciales incorrectas. Verifica tu usuario y contraseña.';
    if (response?.status === 400) return 'Datos inválidos. Completa todos los campos.';
    if (response?.status !== undefined && response.status >= 500)
      return 'Error interno del servidor. Intenta nuevamente.';
  }
  if (error instanceof Error) return error.message;
  return 'Ocurrió un error inesperado.';
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const { login, isAuthenticated, isLoading: sessionLoading } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Si ya está autenticado, redirigir al dashboard
  if (!sessionLoading && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Completa todos los campos.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await login({ username: username.trim(), password });
      navigate('/', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Panel izquierdo — branding */}
      <div className="hidden lg:flex w-1/2 bg-[#19499C] flex-col justify-between p-12 relative overflow-hidden">
        {/* Decoración de fondo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-[-80px] left-[-80px] w-[400px] h-[400px] rounded-full bg-white" />
          <div className="absolute bottom-[-100px] right-[-60px] w-[320px] h-[320px] rounded-full bg-[#FFCD05]" />
        </div>

        <div className="relative">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-[#FFCD05] text-[#19499C] flex items-center justify-center font-bold text-lg shadow">
              P
            </div>
            <div>
              <p className="font-bold text-white text-xl leading-tight">POA</p>
              <p className="text-white/60 text-xs tracking-widest uppercase">Sistema</p>
            </div>
          </div>

          <h1 className="text-4xl font-bold text-white leading-snug">
            Planificación<br />Operativa Anual
          </h1>
          <p className="mt-4 text-white/70 text-base leading-relaxed max-w-sm">
            Gestión integral de presupuestos, memorias y estructura organizacional.
          </p>
        </div>

        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white/80">
            <span className="h-2 w-2 rounded-full bg-[#FFCD05]" />
            Gestión 2026
          </div>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Logo mobile */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-lg bg-[#19499C] text-[#FFCD05] flex items-center justify-center font-bold">
              P
            </div>
            <span className="font-bold text-[#19499C] text-lg">POA</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#19499C]">Iniciar sesión</h2>
            <p className="mt-1 text-sm text-slate-500">Ingresa tus credenciales para acceder al sistema.</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Error banner */}
            {error && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                <AlertCircle size={17} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Usuario */}
            <div className="space-y-1.5">
              <label htmlFor="username" className="block text-sm font-medium text-slate-700">
                Usuario
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                placeholder="Nombre de usuario"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-[#19499C] focus:ring-2 focus:ring-[#19499C]/15 disabled:opacity-50"
              />
            </div>

            {/* Contraseña */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-11 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-[#19499C] focus:ring-2 focus:ring-[#19499C]/15 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl bg-[#19499C] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#153a80] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <LogIn size={16} />
              )}
              {isLoading ? 'Iniciando sesión…' : 'Ingresar'}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-400">
            Sistema POA &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
