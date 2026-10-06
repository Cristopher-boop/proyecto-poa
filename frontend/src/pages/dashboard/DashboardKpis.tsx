import React from 'react';
import {
  WalletCards,
  TrendingDown,
  CheckCircle2,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface DashboardKpisProps {
  totalInicial: number;
  totalEjecutado: number;
  totalDisponible: number;
  pctEjecucion: number;
  mesDesde: number;
  mesHasta: number;
  totalAreas: number;
  formatMoney: (val: number | string) => string;
}

export const DashboardKpis: React.FC<DashboardKpisProps> = ({
  totalInicial,
  totalEjecutado,
  totalDisponible,
  pctEjecucion,
  mesDesde,
  mesHasta,
  totalAreas,
}) => {
  // Ritmo de ejecución esperado según los meses transcurridos (meta proporcional institucional)
  const ritmoEsperado = Math.round((mesHasta / 12) * 100);
  const desviacionRitmo = Math.round((pctEjecucion - ritmoEsperado) * 10) / 10;
  const esRitmoAdelantado = desviacionRitmo >= 0;

  // Renderizador unificado con tipografía idéntica a Presupuestos (sin mono/black desbordado)
  const renderMonto = (val: number, colorClass: string = 'text-theme-main') => {
    const formatted = new Intl.NumberFormat('es-BO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val || 0);

    return (
      <div className="flex items-baseline gap-1.5 mt-2.5">
        <span className="text-xs sm:text-sm font-semibold text-theme-muted">Bs</span>
        <span className={`text-xl sm:text-2xl font-bold ${colorClass} tracking-tight truncate`}>
          {formatted}
        </span>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* KPI 1: Presupuesto Asignado */}
      <div className="card p-4 sm:p-5 bg-theme-surface border border-theme-border rounded-2xl shadow-sm hover:border-theme-primary/40 transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-theme-muted">
              Presupuesto Asignado
            </span>
            <div className="p-2 rounded-xl bg-theme-base/60 text-theme-main border border-theme-border">
              <WalletCards size={18} />
            </div>
          </div>
          {renderMonto(totalInicial, 'text-theme-main')}
        </div>

        <div className="pt-3 mt-3 border-t border-theme-border flex items-center justify-between text-xs text-theme-muted">
          <span>Alcance</span>
          <span className="font-semibold text-theme-main">
            {totalAreas} {totalAreas === 1 ? 'gerencia/unidad' : 'áreas asignadas'}
          </span>
        </div>
      </div>

      {/* KPI 2: Presupuesto Gastado */}
      <div className="card p-4 sm:p-5 bg-theme-surface border border-theme-border rounded-2xl shadow-sm hover:border-rose-500/40 transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-theme-muted">
              Presupuesto Gastado
            </span>
            <div className="p-2 rounded-xl bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/20">
              <TrendingDown size={18} />
            </div>
          </div>
          {renderMonto(totalEjecutado, 'text-rose-600 dark:text-rose-400')}
        </div>

        <div className="pt-3 mt-3 border-t border-theme-border flex items-center justify-between text-xs text-theme-muted">
          <span>Periodo analizado</span>
          <span className="font-semibold text-theme-main">
            {mesDesde === mesHasta ? `Mes ${mesDesde}` : `Meses ${mesDesde} a ${mesHasta}`}
          </span>
        </div>
      </div>

      {/* KPI 3: Saldo Disponible */}
      <div className="card p-4 sm:p-5 bg-theme-surface border border-theme-border rounded-2xl shadow-sm hover:border-emerald-500/40 transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-theme-muted">
              Saldo Disponible
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
              <CheckCircle2 size={18} />
            </div>
          </div>
          {renderMonto(totalDisponible, 'text-emerald-600 dark:text-emerald-400')}
        </div>

        <div className="pt-3 mt-3 border-t border-theme-border flex items-center justify-between text-xs text-theme-muted">
          <span>Capacidad operativa</span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
            {totalInicial > 0 ? (100 - pctEjecucion).toFixed(1) : 0}% disponible
          </span>
        </div>
      </div>

      {/* KPI 4: % de Avance Presupuestario */}
      <div className="card p-4 sm:p-5 bg-theme-surface border border-theme-border rounded-2xl shadow-sm hover:border-amber-500/40 transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-theme-muted">
              % de Avance
            </span>
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20">
              <Activity size={18} />
            </div>
          </div>

          <div className="flex items-baseline justify-between mt-2.5">
            <span className="text-xl sm:text-2xl font-bold text-theme-main tracking-tight">
              {pctEjecucion}%
            </span>
            <div
              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg border ${
                esRitmoAdelantado
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
              }`}
            >
              {esRitmoAdelantado ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
              <span>{Math.abs(desviacionRitmo)}% vs programado</span>
            </div>
          </div>
        </div>

        {/* Barra de Progreso */}
        <div className="pt-3 mt-3 border-t border-theme-border space-y-1.5">
          <div className="w-full bg-theme-border rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-theme-primary transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, pctEjecucion))}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-theme-muted">
            <span>Ejecutado: {pctEjecucion}%</span>
            <span>Meta esperada: {ritmoEsperado}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
