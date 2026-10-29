import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useSidebar } from "../../contexts/SidebarContext";
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
  LayoutDashboard,
  PanelLeftClose,
  ChevronsUpDown,
  Palette,
  BarChart3,
  HelpCircle,
} from "lucide-react";
import { useGuia } from "../../features/guia-interactiva";

export default function Sidebar() {
  const {
    collapsed,
    toggleSidebar,
    openMenus,
    toggleMenu,
    expandAllMenus,
    collapseAllMenus,
    areAllMenusExpanded,
  } = useSidebar();

  const navigate = useNavigate();
  const location = useLocation();
  const { openGuia } = useGuia();

  const { user } = useAuth();
  const rol = user?.rol_nombre?.toUpperCase() || "";
  const rolClean = rol.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const isAdmin = Boolean(user?.is_superuser) || rolClean.includes("ADMIN");
  const isPlanificador = rolClean.includes("PLANIF");
  const isPresupuestos =
    rolClean.includes("PRESUP") || rolClean.includes("APROB") || rolClean.includes("FINAN");
  const isTesoreria = rolClean.includes("TESOR");

  // Certificaciones POA solo visible para Planificación, Presupuestos y Tesorería
  const showCertificacionesMenu = isAdmin || isPlanificador || isPresupuestos || isTesoreria;

  // Reportes POA: Restringido estrictamente para Elaborador y Trabajador
  const isElaborador = rolClean.includes("ELABORAD");
  const isTrabajador = rolClean.includes("TRABAJAD");
  const canAccessReports =
    (isAdmin || isPlanificador || isPresupuestos || isTesoreria || rolClean.includes("GERENT") || rolClean.includes("DIRECT") || rolClean.includes("JEFE")) &&
    !isElaborador &&
    !isTrabajador;

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  const isOrganizacionActive =
    isActive("/partidas") || isActive("/planificacion") || isActive("/organizacional");
  const isGastosActive =
    isActive("/certificaciones") || isActive("/ejecucion") || isActive("/traspasos");

  const navItemClass = (active: boolean) =>
    `w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
      active
        ? "bg-theme-primary text-theme-primaryText shadow-sm font-semibold"
        : "text-theme-muted hover:bg-theme-border/50 hover:text-theme-main"
    }`;

  const subItemClass = (active: boolean) =>
    `w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs transition-all duration-150 ${
      active
        ? "bg-theme-primary text-theme-primaryText font-semibold shadow-xs"
        : "text-theme-muted hover:text-theme-main hover:bg-theme-border/40 font-medium"
    }`;

  return (
    <aside
      className={`h-screen sticky top-0 flex flex-col bg-theme-sidebar transition-all duration-300 ease-in-out z-20 shrink-0 ${
        collapsed
          ? "w-0 opacity-0 overflow-hidden border-r-0 pointer-events-none"
          : "w-64 opacity-100 border-r border-theme-border"
      }`}
      aria-hidden={collapsed}
    >
      <div className="w-64 h-full flex flex-col">
        {/* Cabecera / Identidad POA + Botón para Colapsar Todo */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-theme-border shrink-0">
          <div className="flex items-center gap-3 overflow-hidden select-none">
            <div className="w-9 h-9 rounded-xl bg-theme-primary text-theme-primaryText flex items-center justify-center font-bold shrink-0 shadow-sm text-base">
              P
            </div>
            <div className="leading-tight overflow-hidden whitespace-nowrap">
              <span className="font-display font-bold text-theme-main tracking-wide text-lg block">
                POA
              </span>
              <span className="text-[9px] uppercase tracking-[0.18em] text-theme-muted font-medium">
                Gestión operativa
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleSidebar}
            className="p-1.5 rounded-xl text-theme-muted hover:text-theme-main hover:bg-theme-border/50 transition-colors shrink-0"
            title="Colapsar menú lateral (Ctrl+B)"
            aria-label="Colapsar menú lateral"
          >
            <PanelLeftClose size={18} />
          </button>
        </div>

        {/* Navegación Principal */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-1 custom-scrollbar">
          {/* Cabecera de Módulos con acción rápida para Expandir / Colapsar todos los submenús */}
          <div className="flex items-center justify-between px-2 mb-2 select-none">
            <span className="text-[10px] uppercase tracking-widest text-theme-muted/70 font-bold">
              Módulos
            </span>
            <button
              type="button"
              onClick={areAllMenusExpanded ? collapseAllMenus : expandAllMenus}
              className="text-[11px] font-medium text-theme-muted hover:text-theme-main transition-colors flex items-center gap-1 hover:underline py-0.5 px-1.5 rounded-md hover:bg-theme-border/40"
              title={areAllMenusExpanded ? "Colapsar todos los menús" : "Abrir todos los menús"}
            >
              <span>{areAllMenusExpanded ? "Colapsar todo" : "Abrir todo"}</span>
              <ChevronsUpDown size={12} className="opacity-70" />
            </button>
          </div>

          {/* 0. Dashboard */}
          <button
            type="button"
            onClick={() => navigate("/")}
            data-tour="tour-nav-dashboard"
            className={navItemClass(isActive("/"))}
          >
            <LayoutDashboard size={18} className="shrink-0" />
            <span>Dashboard</span>
          </button>

          {/* 1. Presupuestos */}
          <button
            type="button"
            onClick={() => navigate("/presupuestos")}
            data-tour="tour-nav-presupuestos"
            className={navItemClass(isActive("/presupuestos"))}
          >
            <WalletCards size={18} className="shrink-0" />
            <span>Presupuestos</span>
          </button>

          {/* 2. Organización (Desplegable Minimalista con Guía Jerárquica) */}
          <div>
            <button
              type="button"
              onClick={() => toggleMenu("organizacion")}
              className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                isOrganizacionActive && !openMenus.organizacion
                  ? "bg-theme-primary/10 text-theme-primary font-semibold"
                  : "text-theme-muted hover:bg-theme-border/50 hover:text-theme-main"
              }`}
            >
              <div className="flex items-center gap-3">
                <Building2 size={18} className="shrink-0" />
                <span>Organización</span>
              </div>
              <div className="flex items-center gap-2">
                {isOrganizacionActive && !openMenus.organizacion && (
                  <span className="w-1.5 h-1.5 rounded-full bg-theme-primary ring-2 ring-theme-primary/30" />
                )}
                <ChevronDown
                  size={15}
                  className={`text-theme-muted transition-transform duration-200 ${
                    openMenus.organizacion ? "rotate-180" : ""
                  }`}
                />
              </div>
            </button>

            {/* Submenú Organización */}
            {openMenus.organizacion && (
              <div className="ml-4 pl-3.5 border-l border-theme-border/70 my-1 space-y-0.5">
                <button
                  type="button"
                  onClick={() => navigate("/partidas")}
                  className={subItemClass(isActive("/partidas"))}
                >
                  <FileSpreadsheet size={14} className="shrink-0" />
                  <span className="truncate">Partidas Presup.</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/planificacion")}
                  className={subItemClass(isActive("/planificacion"))}
                >
                  <Compass size={14} className="shrink-0" />
                  <span className="truncate">Planificación Estratégica</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/organizacional")}
                  className={subItemClass(isActive("/organizacional"))}
                >
                  <Building2 size={14} className="shrink-0" />
                  <span className="truncate">Estructura Org.</span>
                </button>
              </div>
            )}
          </div>

          {/* 3. Memorias de Cálculo */}
          <button
            type="button"
            onClick={() => navigate("/memorias")}
            data-tour="tour-nav-memorias"
            className={navItemClass(isActive("/memorias"))}
          >
            <BookOpenText size={18} className="shrink-0" />
            <span>Memorias de Cálculo</span>
          </button>

          {/* 4. Gastos (Desplegable Minimalista con Guía Jerárquica) */}
          <div>
            <button
              type="button"
              onClick={() => toggleMenu("gastos")}
              data-tour="tour-nav-gastos"
              className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                isGastosActive && !openMenus.gastos
                  ? "bg-theme-primary/10 text-theme-primary font-semibold"
                  : "text-theme-muted hover:bg-theme-border/50 hover:text-theme-main"
              }`}
            >
              <div className="flex items-center gap-3">
                <TrendingDown size={18} className="shrink-0" />
                <span>Gastos</span>
              </div>
              <div className="flex items-center gap-2">
                {isGastosActive && !openMenus.gastos && (
                  <span className="w-1.5 h-1.5 rounded-full bg-theme-primary ring-2 ring-theme-primary/30" />
                )}
                <ChevronDown
                  size={15}
                  className={`text-theme-muted transition-transform duration-200 ${
                    openMenus.gastos ? "rotate-180" : ""
                  }`}
                />
              </div>
            </button>

            {/* Submenú Gastos */}
            {openMenus.gastos && (
              <div className="ml-4 pl-3.5 border-l border-theme-border/70 my-1 space-y-0.5">
                {showCertificacionesMenu && (
                  <button
                    type="button"
                    onClick={() => navigate("/certificaciones")}
                    data-tour="tour-nav-certificaciones"
                    className={subItemClass(isActive("/certificaciones"))}
                  >
                    <FileText size={14} className="shrink-0" />
                    <span className="truncate">Certificación POA</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => navigate("/ejecucion")}
                  data-tour="tour-nav-ejecucion"
                  className={subItemClass(isActive("/ejecucion"))}
                >
                  <TrendingDown size={14} className="shrink-0" />
                  <span className="truncate">Ejecuciones</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/traspasos")}
                  data-tour="tour-nav-traspasos"
                  className={subItemClass(isActive("/traspasos"))}
                >
                  <ArrowRightLeft size={14} className="shrink-0" />
                  <span className="truncate">Modificaciones</span>
                </button>
              </div>
            )}
          </div>

          {/* 5. Reportes Oficiales POA */}
          {canAccessReports && (
            <button
              type="button"
              onClick={() => navigate("/reportes")}
              className={navItemClass(isActive("/reportes"))}
            >
              <BarChart3 size={18} className="shrink-0" />
              <span>Reportes POA</span>
            </button>
          )}

          {/* 6. Administración y Laboratorio UX / UI */}
          <div className="pt-6 space-y-1">
            <div className="px-2 mb-2 select-none">
              <span className="text-[10px] uppercase tracking-widest text-theme-muted/70 font-bold">
                Administración
              </span>
            </div>
            {isAdmin && (
              <button
                type="button"
                onClick={() => navigate("/logs")}
                className={navItemClass(isActive("/logs"))}
              >
                <ClipboardList size={18} className="shrink-0" />
                <span>Auditoría / Usuarios</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate("/ux-ui")}
              className={navItemClass(isActive("/ux-ui"))}
            >
              <Palette size={18} className="shrink-0" />
              <div className="flex items-center justify-between flex-1">
                <span>UX / UI</span>
                <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-md bg-theme-primary/15 text-theme-primary">
                  Test
                </span>
              </div>
            </button>
            {/* Acceso a Guía y Flujos Operativos POA */}
            <button
              type="button"
              onClick={() => openGuia()}
              className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150 text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 shadow-xs"
            >
              <HelpCircle size={18} className="shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="flex items-center justify-between flex-1">
                <span>Guía y Flujos</span>
                <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300">
                  Ayuda
                </span>
              </div>
            </button>
          </div>
        </nav>
      </div>
    </aside>
  );
}
