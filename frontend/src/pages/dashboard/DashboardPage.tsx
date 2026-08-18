import DashboardChart from "./DashboardChart";
import DashboardTable from "./DashboardTable";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-theme-main">Dashboard</h2>
        <p className="text-theme-muted">Resumen ejecutivo del estado de presupuesto y gestión.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico */}
        <div className="lg:col-span-2 card p-6">
          <h3 className="text-sm font-semibold text-theme-main mb-6">Ejecución Presupuestaria por Mes</h3>
          <div className="h-[300px]">
            <DashboardChart />
          </div>
        </div>

        {/* Resumen */}
        <div className="card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-theme-main mb-2">Presupuesto Total</h3>
            <p className="text-4xl font-display font-bold text-theme-main tracking-tight">$4.2M</p>
            <p className="text-sm text-theme-muted mt-2">
              <span className="text-triad-green-600 dark:text-triad-green-500 font-semibold">+12.5%</span> respecto al año anterior
            </p>
          </div>
          <div className="mt-6 pt-6 border-t border-theme-border">
            <h3 className="text-sm font-semibold text-theme-main mb-2">Ejecutado</h3>
            <p className="text-2xl font-display font-bold text-theme-main">68%</p>
            <div className="w-full bg-theme-border rounded-full h-2 mt-3 overflow-hidden">
              <div className="bg-theme-primary h-2 rounded-full" style={{ width: "68%" }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="card p-0 overflow-hidden">
        <div className="p-5 border-b border-theme-border flex justify-between items-center">
          <h3 className="text-sm font-semibold text-theme-main">Últimos Traspasos y Ajustes</h3>
          <button className="text-xs font-semibold text-theme-primary hover:text-theme-primaryHover">Ver todos</button>
        </div>
        <DashboardTable />
      </div>
    </div>
  );
}
