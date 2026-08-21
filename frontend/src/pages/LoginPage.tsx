import { useState, useEffect } from "react";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { registerUser } from "../services/authService";
import { getSecciones, Seccion } from "../services/presupuestoService";

export default function LoginPage() {
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Login fields
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  // Register additional fields
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [rol, setRol] = useState("TRABAJADOR");
  const [seccionId, setSeccionId] = useState("");

  const [secciones, setSecciones] = useState<Seccion[]>([]);
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isRegistering && secciones.length === 0) {
      getSecciones().then(setSecciones).catch(console.error);
    }
  }, [isRegistering]);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!username || !password) {
      setError("Por favor completa usuario y contraseña.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isRegistering) {
        if (!email || !firstName || !lastName || !rol || !seccionId) {
          setError("Para registrarte completa todos los campos.");
          setIsSubmitting(false);
          return;
        }
        await registerUser({
          username,
          password,
          email,
          first_name: firstName,
          last_name: lastName,
          rol_nombre: rol,
          seccion: parseInt(seccionId)
        });
        
        // Auto-login después de registrarse exitosamente
        await login({ username, password });
      } else {
        await login({ username, password });
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.response?.data?.username?.[0] || "Credenciales incorrectas o error al registrar.");
    } finally {
      setIsSubmitting(false);
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

      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24 max-h-screen overflow-y-auto py-8">
        <div className="w-full max-w-sm mx-auto">
          <div className="lg:hidden w-12 h-12 rounded-xl bg-theme-primary text-theme-primaryText flex items-center justify-center font-display font-bold text-xl shadow-sm mb-8">
            P
          </div>
          
          <h2 className="text-3xl font-display font-bold text-theme-main mb-2">
            {isRegistering ? "Crear Cuenta" : "Bienvenido"}
          </h2>
          <p className="text-theme-muted mb-8">
            {isRegistering ? "Registra un nuevo usuario para probar los roles." : "Ingresa tus credenciales para continuar."}
          </p>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 flex items-start gap-3">
              <AlertCircle size={20} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <p className="text-sm text-rose-700 dark:text-rose-400 font-medium">{error}</p>
            </div>
          )}
          
          {successMsg && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex items-start gap-3">
              <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">{successMsg}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {isRegistering && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-theme-main mb-1.5">Nombre</label>
                  <input type="text" className="input-theme" value={firstName} onChange={e => setFirstName(e.target.value)} disabled={isSubmitting} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-theme-main mb-1.5">Apellido</label>
                  <input type="text" className="input-theme" value={lastName} onChange={e => setLastName(e.target.value)} disabled={isSubmitting} />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-theme-main mb-1.5">Usuario</label>
              <input type="text" className="input-theme" placeholder="ej. juan.perez" value={username} onChange={(e) => setUsername(e.target.value)} disabled={isSubmitting} />
            </div>
            
            {isRegistering && (
              <div>
                <label className="block text-sm font-semibold text-theme-main mb-1.5">Correo</label>
                <input type="email" className="input-theme" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isSubmitting} />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-theme-main mb-1.5">Contraseña</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} className="input-theme pr-10" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isSubmitting} />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-main transition-colors" onClick={() => setShowPassword(!showPassword)} disabled={isSubmitting}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {isRegistering && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-theme-main mb-1.5">Rol</label>
                  <select className="input-theme" value={rol} onChange={e => setRol(e.target.value)} disabled={isSubmitting}>
                    <option value="ADMINISTRADOR">Administrador (Revision/Aprobacion Finanzas)</option>
                    <option value="GERENTE">Gerente (Aprobación Jefatura/Gerencia)</option>
                    <option value="ELABORADOR">Elaborador (Crear/Editar Memorias)</option>
                    <option value="TRABAJADOR">Trabajador (Solo Lectura)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-theme-main mb-1.5">Sección / Área</label>
                  <select className="input-theme" value={seccionId} onChange={e => setSeccionId(e.target.value)} disabled={isSubmitting}>
                    <option value="">Selecciona sección...</option>
                    {secciones.map(s => (
                      <option key={s.id} value={s.id}>{s.nombre} ({s.area_nombre})</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <button type="submit" disabled={isSubmitting || isLoading} className="btn-primary w-full mt-2">
              {isSubmitting || isLoading ? <Loader2 size={18} className="animate-spin" /> : (isRegistering ? "Crear cuenta" : "Ingresar al sistema")}
            </button>
            
            <div className="text-center mt-4">
              <button type="button" onClick={() => {setIsRegistering(!isRegistering); setError(""); setSuccessMsg("");}} className="text-sm text-theme-muted hover:text-theme-main font-semibold">
                {isRegistering ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate aquí para pruebas"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
