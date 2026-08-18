import { useState } from "react";
import { ArrowLeftRight, BookOpenText, ChevronsLeft, ChevronsRight, ClipboardList, LayoutDashboard, WalletCards, Building2 } from "lucide-react";

export type ModuleKey = "dashboard" | "organizacional" | "presupuestos" | "memorias" | "traspasos";

interface SidebarProps {
  activeModule: ModuleKey;
  onModuleChange: (module: ModuleKey) => void;
}

const modules = [
  { key: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
  { key: "organizacional" as const, label: "Organizacional", icon: Building2 },
  { key: "presupuestos" as const, label: "Presupuestos", icon: WalletCards },
  { key: "memorias" as const, label: "Memorias", icon: BookOpenText },
  { key: "traspasos" as const, label: "Traspasos", icon: ArrowLeftRight },
];

export default function Sidebar({ activeModule, onModuleChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

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
          {modules.map(({ key, label, icon: Icon }) => {
            const active = activeModule === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onModuleChange(key)}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                  active ? "bg-theme-primary text-theme-primaryText shadow-sm" : "text-theme-muted hover:bg-theme-border/50 hover:text-theme-main"
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
              <span>Espacio para widgets</span>
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
