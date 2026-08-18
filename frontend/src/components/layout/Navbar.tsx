import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronDown, LogOut, User, Moon, Sun } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../contexts/ThemeContext";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const initials = user ? (user.first_name?.[0] ?? user.username[0]).toUpperCase() : "U";
  const displayName = user?.first_name ? `${user.first_name} ${user.last_name ?? ""}`.trim() : user?.username ?? "Usuario";
  const displayRole = user?.rol_nombre ?? user?.cargo ?? "Administrador";

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

        {/* Campana */}
        <button
          type="button"
          className="relative p-2 rounded-lg hover:bg-theme-border/50 text-theme-main transition-colors"
          aria-label="Notificaciones"
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-theme-primary" />
        </button>

        {/* Menú usuario */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
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
            <div className="absolute right-0 mt-2 w-48 bg-theme-surface rounded-2xl border border-theme-border shadow-panel p-1 text-sm transition-colors">
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
