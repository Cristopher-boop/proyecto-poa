import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  LayoutDashboard,
  WalletCards,
  BookOpenText,
  TrendingDown,
  Building2,
  FileSpreadsheet,
  Compass,
} from "lucide-react";

export type ModuleKey = "dashboard" | "presupuestos" | "partidas" | "memorias" | "ejecucion" | "planificacion" | "organizacional";

interface ModuleItem {
  key: ModuleKey;
  label: string;
  icon: any;
  path: string;
}

const modules: ModuleItem[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { key: "presupuestos", label: "Presupuestos & POA", icon: WalletCards, path: "/presupuestos" },
  { key: "partidas", label: "Partidas Presup.", icon: FileSpreadsheet, path: "/partidas" },
  { key: "memorias", label: "Memorias de Cálculo", icon: BookOpenText, path: "/memorias" },
  { key: "ejecucion", label: "Ejecución Presupuestaria", icon: TrendingDown, path: "/ejecucion" },
  { key: "planificacion", label: "Planificación Estratégica", icon: Compass, path: "/planificacion" },
  { key: "organizacional", label: "Estructura Org.", icon: Building2, path: "/organizacional" },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const { user } = useAuth();
  const isAdmin = user?.is_superuser || user?.rol_nombre?.toUpperCase() === 'ADMINISTRADOR' || user?.rol_nombre?.toUpperCase() === 'APROBADOR';

  const visibleModules = useMemo(() => {
    if (isAdmin) {
      return [...modules, { key: "logs", label: "Auditoría / Logs", icon: ClipboardList, path: "/logs" }];
    }
    return modules;
  }, [isAdmin]);

  const getActiveKey = (): string => {
    if (location.pathname.startsWith('/memorias')) return 'memorias';
    if (location.pathname.startsWith('/ejecucion')) return 'ejecucion';
    if (location.pathname.startsWith('/presupuestos')) return 'presupuestos';
    if (location.pathname.startsWith('/planificacion')) return 'planificacion';
    if (location.pathname.startsWith('/organizacional')) return 'organizacional';
    if (location.pathname.startsWith('/logs')) return 'logs';
    return 'dashboard';
  };

  const activeKey = getActiveKey();

  return (
    <aside className={`h-screen sticky top-0 flex flex-col bg-theme-sidebar border-r border-theme-border transition-all duration-200 ${collapsed ? "w-[76px]" : "w-64"}`}>
      <div className="flex items-center gap-3 px-4 h-16 border-b border-theme-border">
        <div className="w-9 h-9 rounded-lg bg-theme-primary text-theme-primaryText flex items-center justify-center font-bold shrink-0 shadow-sm text-base transition-colors duration-200">
          P
        </div>
        {!collapsed && (
          <div className="leading-tight">
            <span className="font-display font-bold text-theme-main tracking-wide text-lg block">POA</span>
            <span className="text-[9px] uppercase tracking-[0.18em] text-theme-muted">Gestión operativa</span>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {!collapsed && (
          <p className="px-3 mb-2 text-[10px] uppercase tracking-widest text-theme-muted font-semibold">Módulos</p>
        )}

        <div className="space-y-0.5">
          {visibleModules.map(({ key, label, icon: Icon, path }) => {
            const active = activeKey === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => navigate(path)}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                  active
                    ? "bg-theme-primary text-theme-primaryText shadow-sm font-semibold"
                    : "text-theme-muted hover:bg-theme-border/50 hover:text-theme-main"
                }`}
                title={collapsed ? label : undefined}
              >
                <Icon size={17} className="shrink-0" />
                {!collapsed && <span>{label}</span>}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="px-3 pb-3">
        {!collapsed && (
          <div className="mb-3 rounded-xl border border-theme-border bg-theme-base px-3 py-2.5">
            <div className="flex items-center gap-2 text-xs text-theme-muted">
              <ClipboardList size={14} />
              <span>Superadministrador</span>
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="flex items-center gap-2 px-4 h-11 border-t border-theme-border text-theme-muted hover:text-theme-primary hover:bg-theme-border/30 text-sm transition-colors"
      >
        {collapsed ? <ChevronsRight size={17} /> : <ChevronsLeft size={17} />}
        {!collapsed && <span className="text-xs">Colapsar</span>}
      </button>
    </aside>
  );
}
