import { useState, useEffect } from "react";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { registerUser, getRoles, Rol } from "../services/authService";
import { getSecciones, Seccion, Area, getAreas } from "../services/presupuestoService";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  
  // Login State
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  // Register State
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regRol, setRegRol] = useState<number | "">("");
  const [regSeccion, setRegSeccion] = useState<number | "">("");

  // Common State
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loadingReg, setLoadingReg] = useState(false);
  
  // Data State
  const [roles, setRoles] = useState<Rol[]>([]);
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  
  const { login, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLogin) {
      getRoles().then(setRoles).catch(console.error);
      getSecciones().then(setSecciones).catch(console.error);
    }
  }, [isLogin]);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Por favor completa todos los campos.");
      return;
    }

    try {
      await login({ username, password });
    } catch (err: any) {
      setError(err.response?.data?.detail || "Credenciales incorrectas o error de conexión.");
    }
  }

  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!regUsername || !regPassword || !regEmail || !regFirstName || !regLastName) {
      setError("Por favor completa todos los campos requeridos.");
      return;
    }

    if (!regRol) {
      setError("Por favor selecciona un Rol para tu cuenta.");
      return;
    }

    setLoadingReg(true);
    try {
      await registerUser({
        username: regUsername,
        password: regPassword,
        email: regEmail,
        first_name: regFirstName,
        last_name: regLastName,
        rol_id: regRol ? Number(regRol) : null,
        seccion_id: regSeccion ? Number(regSeccion) : null,
      });
      // Auto login after register
      await login({ username: regUsername, password: regPassword });
    } catch (err: any) {
      const errMsg = err.response?.data?.username?.[0] || 
                     err.response?.data?.email?.[0] || 
                     err.response?.data?.detail || 
                     "Error al registrar usuario.";
      setError(errMsg);
      setLoadingReg(false);
    }
  }

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError("");
  };

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
          
          <h2 className="text-3xl font-display font-bold text-theme-main mb-2">
            {isLogin ? "Bienvenido" : "Crear Cuenta"}
          </h2>
          <p className="text-theme-muted mb-8">
            {isLogin ? "Ingresa tus credenciales para continuar." : "Completa el formulario para registrarte."}
          </p>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-triad-rose-50 dark:bg-triad-rose-500/10 border border-triad-rose-200 dark:border-triad-rose-500/30 flex items-start gap-3">
              <AlertCircle size={20} className="text-triad-rose-600 dark:text-triad-rose-400 shrink-0 mt-0.5" />
              <p className="text-sm text-triad-rose-700 dark:text-triad-rose-400 font-medium">{error}</p>
            </div>
          )}

          {isLogin ? (
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-theme-main mb-1.5" htmlFor="username">Usuario</label>
                <input id="username" type="text" className="input-theme" placeholder="ej. juan.perez" value={username} onChange={(e) => setUsername(e.target.value)} disabled={isLoading} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-theme-main mb-1.5" htmlFor="password">Contraseña</label>
                <div className="relative">
                  <input id="password" type={showPassword ? "text" : "password"} className="input-theme pr-10" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-main transition-colors" onClick={() => setShowPassword(!showPassword)} disabled={isLoading}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={isLoading} className="btn-primary w-full mt-4">
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : "Ingresar al sistema"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-theme-main mb-1">Nombres</label>
                  <input type="text" className="input-theme text-xs" required value={regFirstName} onChange={(e) => setRegFirstName(e.target.value)} disabled={loadingReg} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-theme-main mb-1">Apellidos</label>
                  <input type="text" className="input-theme text-xs" required value={regLastName} onChange={(e) => setRegLastName(e.target.value)} disabled={loadingReg} />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-theme-main mb-1">Correo Electrónico</label>
                <input type="email" className="input-theme text-xs" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)} disabled={loadingReg} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-theme-main mb-1">Nombre de Usuario</label>
                <input type="text" className="input-theme text-xs" required value={regUsername} onChange={(e) => setRegUsername(e.target.value)} disabled={loadingReg} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-theme-main mb-1">Contraseña</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} className="input-theme text-xs pr-10" required value={regPassword} onChange={(e) => setRegPassword(e.target.value)} disabled={loadingReg} />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-main" onClick={() => setShowPassword(!showPassword)} disabled={loadingReg}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-theme-main mb-1">Rol</label>
                  <select className="input-theme text-xs" required value={regRol} onChange={(e) => setRegRol(e.target.value ? Number(e.target.value) : "")} disabled={loadingReg}>
                    <option value="">Seleccione...</option>
                    {(Array.isArray(roles) ? roles : [])
                      .filter((r) => !['ADMINISTRADOR', 'SUPERADMIN', 'SUPERUSUARIO'].includes(r.nombre.toUpperCase()))
                      .map((r) => (
                        <option key={r.id} value={r.id}>{r.nombre}</option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-theme-main mb-1">Sección (Opcional)</label>
                  <select className="input-theme text-xs" value={regSeccion} onChange={(e) => setRegSeccion(e.target.value ? Number(e.target.value) : "")} disabled={loadingReg}>
                    <option value="">Seleccione...</option>
                    {(Array.isArray(secciones) ? secciones : []).map((s) => (
                      <option key={s.id} value={s.id}>{s.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button type="submit" disabled={loadingReg} className="btn-primary w-full mt-4 text-sm">
                {loadingReg ? <Loader2 size={16} className="animate-spin" /> : "Registrarse"}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <button type="button" onClick={toggleMode} className="text-sm font-semibold text-theme-primary hover:underline">
              {isLogin ? "¿No tienes una cuenta? Regístrate aquí" : "¿Ya tienes cuenta? Inicia sesión"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
