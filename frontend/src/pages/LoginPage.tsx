import { useState } from "react";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  
  const { login, isAuthenticated, isLoading } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Por favor completa todos los campos.");
      return;
    }

    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Credenciales incorrectas o error de conexión.");
    }
  }

  return (
    <div className="min-h-screen bg-theme-base flex transition-colors duration-200">
      <div className="hidden lg:flex flex-1 flex-col justify-center px-20 bg-theme-primary transition-colors duration-200">
        <div className="w-16 h-16 rounded-2xl bg-theme-base text-theme-primary flex items-center justify-center font-display font-bold text-3xl shadow-lg mb-8">
          P
        </div>
        <h1 className="text-5xl font-display font-bold text-theme-primaryText leading-tight mb-6">
          Gestión <br />
          Operativa <br />
          Anual
        </h1>
        <p className="text-theme-primaryText/80 text-lg max-w-md font-medium">
          Sistema centralizado para la planificación, ejecución y control de presupuestos.
        </p>
      </div>

      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24">
        <div className="w-full max-w-sm mx-auto">
          <div className="lg:hidden w-12 h-12 rounded-xl bg-theme-primary text-theme-primaryText flex items-center justify-center font-display font-bold text-xl shadow-sm mb-8">
            P
          </div>
          
          <h2 className="text-3xl font-display font-bold text-theme-main mb-2">Bienvenido</h2>
          <p className="text-theme-muted mb-8">Ingresa tus credenciales para continuar.</p>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-triad-rose-50 dark:bg-triad-rose-500/10 border border-triad-rose-200 dark:border-triad-rose-500/30 flex items-start gap-3">
              <AlertCircle size={20} className="text-triad-rose-600 dark:text-triad-rose-400 shrink-0 mt-0.5" />
              <p className="text-sm text-triad-rose-700 dark:text-triad-rose-400 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-theme-main mb-1.5" htmlFor="username">
                Usuario
              </label>
              <input
                id="username"
                type="text"
                className="input-theme"
                placeholder="ej. juan.perez"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-theme-main mb-1.5" htmlFor="password">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="input-theme pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-main transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary w-full mt-4">
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                "Ingresar al sistema"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
