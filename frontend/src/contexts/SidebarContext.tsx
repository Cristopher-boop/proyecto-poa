import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "react-router-dom";

interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  openMenus: Record<string, boolean>;
  toggleMenu: (menu: string) => void;
  expandAllMenus: () => void;
  collapseAllMenus: () => void;
  areAllMenusExpanded: boolean;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem("poa-sidebar-collapsed") === "true";
    } catch {
      return false;
    }
  });

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    organizacion: true,
    gastos: true,
  });

  const location = useLocation();

  // Guardar preferencia de colapso en localStorage
  useEffect(() => {
    try {
      localStorage.setItem("poa-sidebar-collapsed", String(collapsed));
    } catch {
      // Ignore storage errors
    }
  }, [collapsed]);

  // Si la ruta actual pertenece a un submenú, asegurar que esté abierto para facilitar el contexto
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith("/partidas") || path.startsWith("/planificacion") || path.startsWith("/organizacional")) {
      setOpenMenus((prev) => ({ ...prev, organizacion: true }));
    }
    if (path.startsWith("/certificaciones") || path.startsWith("/ejecucion") || path.startsWith("/traspasos")) {
      setOpenMenus((prev) => ({ ...prev, gastos: true }));
    }
  }, [location.pathname]);

  // Atajo de teclado: Ctrl+B o Cmd+B para alternar el menú lateral
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setCollapsed((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const toggleSidebar = () => setCollapsed((prev) => !prev);

  const toggleMenu = (menu: string) => {
    setOpenMenus((prev) => ({ ...prev, [menu]: !prev[menu] }));
  };

  const expandAllMenus = () => {
    setOpenMenus({
      organizacion: true,
      gastos: true,
    });
  };

  const collapseAllMenus = () => {
    setOpenMenus({
      organizacion: false,
      gastos: false,
    });
  };

  const areAllMenusExpanded = Boolean(openMenus.organizacion && openMenus.gastos);

  return (
    <SidebarContext.Provider
      value={{
        collapsed,
        setCollapsed,
        toggleSidebar,
        openMenus,
        toggleMenu,
        expandAllMenus,
        collapseAllMenus,
        areAllMenusExpanded,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
