import React from 'react';
import { Clock, CheckCircle2, WalletCards } from 'lucide-react';

interface ModificacionesKpisProps {
  activeTab: 'TODAS' | 'PENDIENTE_PRESUPUESTOS' | 'APROBADO' | 'RECHAZADO';
  onSelectTab: (tab: 'TODAS' | 'PENDIENTE_PRESUPUESTOS' | 'APROBADO' | 'RECHAZADO') => void;
  countPendientes: number;
  totalMontoPendiente: number;
  countAprobadas: number;
  totalMontoAprobado: number;
  totalCount: number;
}

export const ModificacionesKpis: React.FC<ModificacionesKpisProps> = ({
  activeTab,
  onSelectTab,
  countPendientes,
  totalMontoPendiente,
  countAprobadas,
  totalMontoAprobado,
  totalCount,
}) => {
  const formatMoney = (val: number | string) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB', minimumFractionDigits: 2 }).format(num || 0);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* En Espera (Presupuestos) */}
      <div
        onClick={() => onSelectTab('PENDIENTE_PRESUPUESTOS')}
        className={`card p-4 flex items-center gap-4 border cursor-pointer transition-all hover:scale-[1.01] ${
          activeTab === 'PENDIENTE_PRESUPUESTOS'
            ? 'border-amber-500/50 bg-amber-500/[0.04] shadow-md ring-1 ring-amber-500/30'
            : 'border-theme-border bg-theme-surface shadow-sm'
        }`}
      >
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
          <Clock size={20} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-theme-muted uppercase tracking-wider">
              En Espera (Presupuestos)
            </p>
            {countPendientes > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-600">
                Pendientes
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <p className="text-xl font-bold text-amber-600 font-mono">{countPendientes}</p>
            <span className="text-xs text-theme-muted font-mono">({formatMoney(totalMontoPendiente)})</span>
          </div>
        </div>
      </div>

      {/* Aprobadas Oficialmente */}
      <div
        onClick={() => onSelectTab('APROBADO')}
        className={`card p-4 flex items-center gap-4 border cursor-pointer transition-all hover:scale-[1.01] ${
          activeTab === 'APROBADO'
            ? 'border-emerald-500/50 bg-emerald-500/[0.04] shadow-md ring-1 ring-emerald-500/30'
            : 'border-theme-border bg-theme-surface shadow-sm'
        }`}
      >
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
          <CheckCircle2 size={20} />
        </div>
        <div className="flex-1">
          <p className="text-[11px] font-semibold text-theme-muted uppercase tracking-wider">
            Aprobadas Oficialmente
          </p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <p className="text-xl font-bold text-emerald-600 font-mono">{countAprobadas}</p>
            <span className="text-xs text-theme-muted font-mono">({formatMoney(totalMontoAprobado)})</span>
          </div>
        </div>
      </div>

      {/* Total Movilizado POA */}
      <div
        onClick={() => onSelectTab('TODAS')}
        className={`card p-4 flex items-center gap-4 border cursor-pointer transition-all hover:scale-[1.01] ${
          activeTab === 'TODAS'
            ? 'border-theme-primary/50 bg-theme-primary/[0.04] shadow-md ring-1 ring-theme-primary/30'
            : 'border-theme-border bg-theme-surface shadow-sm'
        }`}
      >
        <div className="w-10 h-10 rounded-xl bg-theme-primary/10 text-theme-primary flex items-center justify-center shrink-0">
          <WalletCards size={20} />
        </div>
        <div className="flex-1">
          <p className="text-[11px] font-semibold text-theme-muted uppercase tracking-wider">
            Total Movilizado POA
          </p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <p className="text-xl font-bold text-theme-main font-mono">{totalCount}</p>
            <span className="text-xs text-theme-muted font-mono">
              ({formatMoney(totalMontoPendiente + totalMontoAprobado)})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
