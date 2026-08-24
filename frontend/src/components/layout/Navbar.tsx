import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronDown, LogOut, User, Moon, Sun, CheckCheck } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../contexts/ThemeContext";
import { notificacionService } from "../../services/notificacionService";
import { Notificacion } from "../../types/notificacion";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const initials = user ? (user.first_name?.[0] ?? user.username[0]).toUpperCase() : "U";
  const displayName = user?.first_name ? `${user.first_name} ${user.last_name ?? ""}`.trim() : user?.username ?? "Usuario";
  const displayRole = user?.rol_nombre ?? user?.cargo ?? "Administrador";

  const fetchNotificaciones = async () => {
    try {
      const data = await notificacionService.getNotificaciones();
      setNotificaciones(data || []);
      const count = await notificacionService.getUnreadCount();
      setUnreadCount(count || 0);
    } catch (err) {
      // Omitir silenciosamente errores de red si no está autenticado aún
    }
  };

  useEffect(() => {
    fetchNotificaciones();
    const interval = setInterval(fetchNotificaciones, 15000); // Polling ligero cada 15s
    return () => clearInterval(interval);
  }, []);

  const handleMarcarLeida = async (n: Notificacion) => {
    try {
      await notificacionService.marcarLeida(n.id);
      await fetchNotificaciones();
      if (n.enlace) {
        setNotifOpen(false);
        navigate(n.enlace);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarcarTodas = async () => {
    try {
      await notificacionService.marcarTodasLeidas();
      await fetchNotificaciones();
    } catch (err) {
      console.error(err);
    }
  };

  function handleLogout() {
    setMenuOpen(false);
    logout();
    navigate("/login", { replace: true });
  }

  function toggleTheme() {
    setTheme(isDark ? "light" : "dark");
  }

  return (
    <header className="h-16 sticky top-0 z-20 bg-theme-surface/95 backdrop-blur border-b border-theme-border flex items-center justify-between px-6 shadow-sm transition-colors duration-200">
      <div>
        <p className="text-xs font-medium text-theme-muted">Sistema POA</p>
        <h1 className="text-base font-semibold text-theme-main">Panel principal</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Indicador de gestión */}
        <div className="hidden md:flex items-center gap-2 rounded-lg border border-theme-border bg-theme-base px-3 py-1.5 transition-colors">
          <span className="h-2 w-2 rounded-full bg-theme-primary ring-2 ring-theme-primary/30" />
          <span className="text-sm font-medium text-theme-main">Gestión 2026</span>
        </div>

        {/* Toggle Dark Mode */}
        <button
          type="button"
          onClick={toggleTheme}
          className="relative p-2 rounded-lg hover:bg-theme-border/50 text-theme-main transition-colors"
          aria-label="Cambiar tema"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Campana de Notificaciones */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setNotifOpen(!notifOpen);
              setMenuOpen(false);
            }}
            className="relative p-2 rounded-lg hover:bg-theme-border/50 text-theme-main transition-colors"
            aria-label="Notificaciones"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white leading-none shadow-sm animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Menú desplegable Notificaciones */}
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-theme-surface rounded-2xl border border-theme-border shadow-panel p-2 z-50 text-xs">
              <div className="flex items-center justify-between p-2 border-b border-theme-border mb-1">
                <span className="font-bold text-theme-main text-sm">Notificaciones</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarcarTodas}
                    className="text-theme-primary hover:underline flex items-center gap-1 font-medium"
                  >
                    <CheckCheck size={14} /> Marcar todas leídas
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto space-y-1">
                {notificaciones.length === 0 ? (
                  <div className="p-6 text-center text-theme-muted">
                    No tienes notificaciones recibidas.
                  </div>
                ) : (
                  notificaciones.slice(0, 10).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleMarcarLeida(n)}
                      className={`p-3 rounded-xl cursor-pointer transition-colors border border-transparent ${
                        !n.leido
                          ? 'bg-theme-primary/10 border-theme-primary/20 text-theme-main font-medium'
                          : 'hover:bg-theme-base/60 text-theme-muted'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold text-theme-main truncate">{n.titulo}</span>
                        {!n.leido && (
                          <span className="w-2 h-2 rounded-full bg-theme-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] leading-relaxed line-clamp-2">{n.mensaje}</p>
                      <span className="text-[10px] text-theme-muted mt-1 block">
                        {new Date(n.created_at).toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Menú usuario */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setMenuOpen((open) => !open);
              setNotifOpen(false);
            }}
            className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-xl hover:bg-theme-border/30 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-theme-primary text-theme-primaryText flex items-center justify-center text-sm font-semibold ring-2 ring-theme-primary/30">
              {initials}
            </div>
            <div className="hidden sm:block text-left leading-tight">
              <p className="text-sm font-semibold text-theme-main">{displayName}</p>
              <p className="text-xs text-theme-muted">{displayRole}</p>
            </div>
            <ChevronDown size={14} className="text-theme-muted" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-theme-surface rounded-2xl border border-theme-border shadow-panel p-1 text-sm transition-colors z-50">
              <button className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-theme-border/50 text-theme-main transition-colors">
                <User size={15} /> Mi perfil
              </button>
              <div className="my-1 border-t border-theme-border" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-triad-rose-500/10 text-triad-rose-600 dark:text-triad-rose-500 transition-colors"
              >
                <LogOut size={15} /> Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
