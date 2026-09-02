import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  WalletCards,
  Building2,
  FileSpreadsheet,
  Compass,
  FileText,
  BookOpenText,
  TrendingDown,
  ArrowRightLeft,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  Menu,
  LayoutDashboard
} from "lucide-react";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    organizacion: false,
    gastos: false
  });
  
  const navigate = useNavigate();
  const location = useLocation();

  const { user } = useAuth();
  const isAdmin = user?.is_superuser || user?.rol_nombre?.toUpperCase() === 'ADMINISTRADOR';

  // Si colapsamos, cerramos los menús desplegables
  useEffect(() => {
    if (collapsed) {
      setOpenMenus({ organizacion: false, gastos: false });
    }
  }, [collapsed]);

  const toggleMenu = (menu: string) => {
    if (collapsed) {
      setCollapsed(false);
      setOpenMenus({ [menu]: true });
    } else {
      setOpenMenus((prev) => ({ ...prev, [menu]: !prev[menu] }));
    }
  };

  const isActive = (path: string) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
  
  const isOrganizacionActive = isActive('/partidas') || isActive('/planificacion') || isActive('/organizacional');
  const isGastosActive = isActive('/certificaciones') || isActive('/ejecucion') || isActive('/traspasos');

  const navItemClass = (active: boolean) => 
    `w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
      active
        ? "bg-theme-primary text-theme-primaryText shadow-sm font-semibold"
        : "text-theme-muted hover:bg-theme-border/50 hover:text-theme-main"
    }`;

  const subItemClass = (active: boolean) =>
    `w-full flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all duration-150 pl-10 ${
      active
        ? "text-theme-primary font-bold bg-theme-primary/5"
        : "text-theme-muted hover:text-theme-main hover:bg-theme-border/30"
    }`;

  return (
    <aside className={`h-screen sticky top-0 flex flex-col bg-theme-sidebar border-r border-theme-border transition-all duration-300 z-20 ${collapsed ? "w-[72px]" : "w-64"}`}>
      {/* Header / Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-theme-border relative">
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="w-9 h-9 rounded-lg bg-theme-primary text-theme-primaryText flex items-center justify-center font-bold shrink-0 shadow-sm text-base transition-colors hover:opacity-90"
          title="Alternar Menú"
        >
          {collapsed ? <Menu size={18} /> : 'P'}
        </button>
        {!collapsed && (
          <div className="leading-tight overflow-hidden whitespace-nowrap">
            <span className="font-display font-bold text-theme-main tracking-wide text-lg block">POA</span>
            <span className="text-[9px] uppercase tracking-[0.18em] text-theme-muted">Gestión operativa</span>
          </div>
        )}
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-1 custom-scrollbar">
        {!collapsed && (
          <p className="px-3 mb-3 text-[10px] uppercase tracking-widest text-theme-muted font-semibold">Módulos</p>
        )}

        {/* 0. Dashboard */}
        <button
          onClick={() => navigate('/')}
          className={navItemClass(isActive('/'))}
          title={collapsed ? "Dashboard" : undefined}
        >
          <LayoutDashboard size={18} className="shrink-0" />
          {!collapsed && <span>Dashboard</span>}
        </button>

        {/* 1. Presupuestos */}
        <button
          onClick={() => navigate('/presupuestos')}
          className={navItemClass(isActive('/presupuestos'))}
          title={collapsed ? "Presupuestos" : undefined}
        >
          <WalletCards size={18} className="shrink-0" />
          {!collapsed && <span>Presupuestos</span>}
        </button>

        {/* 2. Organización (Dropdown) */}
        <div>
          <button
            onClick={() => toggleMenu('organizacion')}
            className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${isOrganizacionActive && !openMenus.organizacion && collapsed ? 'bg-theme-primary/10 text-theme-primary' : 'text-theme-muted hover:bg-theme-border/50 hover:text-theme-main'}`}
            title={collapsed ? "Organización" : undefined}
          >
            <div className="flex items-center gap-3">
              <Building2 size={18} className="shrink-0" />
              {!collapsed && <span>Organización</span>}
            </div>
            {!collapsed && (
              openMenus.organizacion ? <ChevronDown size={14} /> : <ChevronRight size={14} />
            )}
          </button>
          
          {/* Submenú Organización */}
          {!collapsed && openMenus.organizacion && (
            <div className="mt-1 space-y-1 overflow-hidden">
              <button onClick={() => navigate('/partidas')} className={subItemClass(isActive('/partidas'))}>
                <FileSpreadsheet size={15} className="shrink-0" />
                <span>Partidas Presup.</span>
              </button>
              <button onClick={() => navigate('/planificacion')} className={subItemClass(isActive('/planificacion'))}>
                <Compass size={15} className="shrink-0" />
                <span>Planificación Estratégica</span>
              </button>
              <button onClick={() => navigate('/organizacional')} className={subItemClass(isActive('/organizacional'))}>
                <Building2 size={15} className="shrink-0" />
                <span>Estructura Org.</span>
              </button>
            </div>
          )}
        </div>

        {/* 3. Memorias de Calculo */}
        <button
          onClick={() => navigate('/memorias')}
          className={navItemClass(isActive('/memorias'))}
          title={collapsed ? "Memorias de Cálculo" : undefined}
        >
          <BookOpenText size={18} className="shrink-0" />
          {!collapsed && <span>Memorias de Cálculo</span>}
        </button>

        {/* 4. Gastos (Dropdown) */}
        <div>
          <button
            onClick={() => toggleMenu('gastos')}
            className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${isGastosActive && !openMenus.gastos && collapsed ? 'bg-theme-primary/10 text-theme-primary' : 'text-theme-muted hover:bg-theme-border/50 hover:text-theme-main'}`}
            title={collapsed ? "Gastos" : undefined}
          >
            <div className="flex items-center gap-3">
              <TrendingDown size={18} className="shrink-0" />
              {!collapsed && <span>Gastos</span>}
            </div>
            {!collapsed && (
              openMenus.gastos ? <ChevronDown size={14} /> : <ChevronRight size={14} />
            )}
          </button>
          
          {/* Submenú Gastos */}
          {!collapsed && openMenus.gastos && (
            <div className="mt-1 space-y-1 overflow-hidden">
              <button onClick={() => navigate('/certificaciones')} className={subItemClass(isActive('/certificaciones'))}>
                <FileText size={15} className="shrink-0" />
                <span>Certificación POA</span>
              </button>
              <button onClick={() => navigate('/ejecucion')} className={subItemClass(isActive('/ejecucion'))}>
                <TrendingDown size={15} className="shrink-0" />
                <span>Ejecuciones</span>
              </button>
              <button onClick={() => navigate('/traspasos')} className={subItemClass(isActive('/traspasos'))}>
                <ArrowRightLeft size={15} className="shrink-0" />
                <span>Modificaciones</span>
              </button>
            </div>
          )}
        </div>

        {/* 6. Auditoría / Usuarios (Solo Admin) */}
        {isAdmin && (
          <div className="pt-4 mt-4 border-t border-theme-border/50">
            <button
              onClick={() => navigate('/logs')}
              className={navItemClass(isActive('/logs'))}
              title={collapsed ? "Auditoría / Usuarios" : undefined}
            >
              <ClipboardList size={18} className="shrink-0" />
              {!collapsed && <span>Auditoría / Usuarios</span>}
            </button>
          </div>
        )}
      </nav>
    </aside>
  );
}
