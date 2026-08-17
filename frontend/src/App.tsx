import { useState } from "react";
import { ArrowLeftRight, BookOpenText, Building2, LayoutDashboard, WalletCards } from "lucide-react";
import MainLayout from "./components/layout/MainLayout";
import type { ModuleKey } from "./components/layout/Sidebar";

const moduleInfo: Record<Exclude<ModuleKey, "dashboard">, { title: string; description: string; icon: typeof Building2 }> = {
  organizacional: {
    title: "Organizacional",
    description: "Módulo preparado para incorporar las funcionalidades de la estructura organizacional.",
    icon: Building2,
  },
  presupuestos: {
    title: "Presupuestos",
    description: "Módulo preparado para incorporar las funcionalidades de planificación y gestión presupuestaria.",
    icon: WalletCards,
  },
  memorias: {
    title: "Memorias",
    description: "Módulo preparado para incorporar las funcionalidades relacionadas con memorias y registros.",
    icon: BookOpenText,
  },
  traspasos: {
    title: "Traspasos",
    description: "Módulo preparado para incorporar las funcionalidades de traspasos y movimientos.",
    icon: ArrowLeftRight,
  },
};

function Dashboard() {
  return (
    <section className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="h-1 w-8 rounded-full bg-[#FFCD05]" />
          <span className="text-xs font-semibold uppercase tracking-widest text-[#19499C]">POA</span>
        </div>
        <h2 className="text-2xl font-bold text-[#19499C]">Dashboard</h2>
        <p className="mt-1 text-sm text-slate-500">Panel principal del sistema de Planificación Operativa Anual.</p>
      </div>

      <div className="rounded-2xl border border-[#19499C]/10 bg-white shadow-panel overflow-hidden">
        <div className="h-1.5 bg-[#FFCD05]" />
        <div className="p-8 flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-[#19499C] text-[#FFCD05] flex items-center justify-center shadow-sm">
            <LayoutDashboard size={26} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#19499C]">Área de trabajo del Dashboard</h3>
            <p className="mt-1 text-sm text-slate-500">La estructura está lista para integrar indicadores, tarjetas, gráficos y demás funcionalidades en el futuro.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function EmptyModule({ module }: { module: Exclude<ModuleKey, "dashboard"> }) {
  const info = moduleInfo[module];
  const Icon = info.icon;

  return (
    <section className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="h-1 w-8 rounded-full bg-[#FFCD05]" />
          <span className="text-xs font-semibold uppercase tracking-widest text-[#19499C]">Módulo</span>
        </div>
        <h2 className="text-2xl font-bold text-[#19499C]">{info.title}</h2>
        <p className="mt-1 text-sm text-slate-500">{info.description}</p>
      </div>

      <div className="min-h-[360px] rounded-2xl border-2 border-dashed border-[#19499C]/15 bg-white flex items-center justify-center shadow-sm">
        <div className="max-w-md text-center px-6">
          <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-[#19499C]/10 text-[#19499C] flex items-center justify-center">
            <Icon size={30} />
          </div>
          <h3 className="text-lg font-semibold text-[#19499C]">Módulo vacío</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Este espacio queda reservado para agregar las funcionalidades de <strong className="text-[#19499C]">{info.title}</strong> posteriormente.
          </p>
          <div className="mt-5 inline-flex items-center rounded-full bg-[#FFCD05]/20 px-3 py-1.5 text-xs font-semibold text-[#19499C]">
            Preparado para desarrollo futuro
          </div>
        </div>
      </div>
    </section>
  );
}

export default function App() {
  const [activeModule, setActiveModule] = useState<ModuleKey>("dashboard");

  return (
    <MainLayout activeModule={activeModule} onModuleChange={setActiveModule}>
      {activeModule === "dashboard" ? <Dashboard /> : <EmptyModule module={activeModule} />}
    </MainLayout>
  );
}
