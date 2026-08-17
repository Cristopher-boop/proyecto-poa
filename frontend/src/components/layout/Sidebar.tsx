import { useState } from "react";
import {
  ArrowLeftRight,
  BookOpenText,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  LayoutDashboard,
  WalletCards,
  Building2,
} from "lucide-react";

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
    <aside
      className={`h-screen sticky top-0 flex flex-col bg-[#19499C] text-white transition-all duration-200 shadow-[4px_0_18px_rgba(25,73,156,0.14)] ${
        collapsed ? "w-[76px]" : "w-64"
      }`}
    >
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/15">
        <div className="w-9 h-9 rounded-lg bg-[#FFCD05] text-[#19499C] flex items-center justify-center font-bold shrink-0 shadow-sm">
          P
        </div>
        {!collapsed && (
          <div className="leading-tight">
            <span className="font-display font-bold text-white tracking-wide text-lg block">POA</span>
            <span className="text-[9px] uppercase tracking-[0.18em] text-white/60">Gestión operativa</span>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <div className="px-3 mb-2 text-[10px] uppercase tracking-widest text-white/55">
          {!collapsed && "Módulos"}
        </div>

        <div className="space-y-1">
          {modules.map(({ key, label, icon: Icon }) => {
            const active = activeModule === key;

            return (
              <button
                key={key}
                type="button"
                onClick={() => onModuleChange(key)}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? "bg-[#FFCD05] text-[#19499C] shadow-sm"
                    : "text-white/85 hover:bg-white/10 hover:text-white"
                }`}
                title={collapsed ? label : undefined}
              >
                <Icon size={18} className="shrink-0" />
                {!collapsed && <span>{label}</span>}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="px-3 pb-3">
        {!collapsed && (
          <div className="mb-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5">
            <div className="flex items-center gap-2 text-xs text-white/70">
              <ClipboardList size={15} />
              <span>Espacio preparado para futuras funcionalidades</span>
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setCollapsed((value) => !value)}
        className="flex items-center gap-2 px-4 h-12 border-t border-white/15 text-white/70 hover:text-[#FFCD05] hover:bg-white/5 text-sm transition-colors"
      >
        {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
        {!collapsed && <span>Colapsar</span>}
      </button>
    </aside>
  );
}
