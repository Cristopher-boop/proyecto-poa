import { useState } from "react";
import { Bell, ChevronDown, LogOut, User } from "lucide-react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="h-16 sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-[#19499C]/10 flex items-center justify-between px-6 shadow-sm">
      <div>
        <p className="text-xs font-medium text-[#19499C]/65">Sistema POA</p>
        <h1 className="text-base font-semibold text-[#19499C]">Panel principal</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 rounded-lg border border-[#19499C]/15 bg-[#19499C]/5 px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-[#FFCD05] ring-2 ring-[#FFCD05]/20" />
          <span className="text-sm font-medium text-[#19499C]">Gestión 2026</span>
        </div>

        <button
          type="button"
          className="relative p-2 rounded-lg hover:bg-[#19499C]/5 text-[#19499C] transition-colors"
          aria-label="Notificaciones"
        >
          <Bell size={19} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#FFCD05]" />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg hover:bg-[#19499C]/5 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-[#19499C] text-white flex items-center justify-center text-sm font-semibold ring-2 ring-[#FFCD05]/30">
              U
            </div>
            <div className="hidden sm:block text-left leading-tight">
              <p className="text-sm font-medium text-[#19499C]">Usuario</p>
              <p className="text-xs text-slate-500">Administrador</p>
            </div>
            <ChevronDown size={16} className="text-[#19499C]/55" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-[#19499C]/10 shadow-panel p-1 text-sm">
              <button type="button" className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#19499C]/5 text-[#19499C]">
                <User size={16} /> Mi perfil
              </button>
              <button type="button" className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 text-red-600">
                <LogOut size={16} /> Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
