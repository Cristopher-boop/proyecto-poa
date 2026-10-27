import React from 'react';
import { Clock, CheckCircle2, WalletCards, Building2 } from 'lucide-react';
import { ModificacionTab } from '../hooks/useModificaciones';

interface ModificacionesKpisProps {
  activeTab: ModificacionTab;
  onSelectTab: (tab: ModificacionTab) => void;
  countPendientesGerencia: number;
  totalMontoPendienteGerencia: number;
  countPendientesPresupuestos: number;
  totalMontoPendientePresupuestos: number;
  countAprobadas: number;
  totalMontoAprobado: number;
  totalCount: number;
}

export const ModificacionesKpis: React.FC<ModificacionesKpisProps> = ({
  activeTab,
  onSelectTab,
  countPendientesGerencia,
  totalMontoPendienteGerencia,
  countPendientesPresupuestos,
  totalMontoPendientePresupuestos,
  countAprobadas,
  totalMontoAprobado,
  totalCount,
}) => {
  const formatMoney = (val: number | string) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB', minimumFractionDigits: 2 }).format(num || 0);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. En Espera (Gerencia Cedente) */}
      <div
        onClick={() => onSelectTab('PENDIENTE_GERENCIA_CEDENTE')}
        className={`card p-4 flex items-center gap-4 border cursor-pointer transition-all hover:scale-[1.01] ${
          activeTab === 'PENDIENTE_GERENCIA_CEDENTE'
            ? 'border-indigo-500/50 bg-indigo-500/[0.04] shadow-md ring-1 ring-indigo-500/30'
            : 'border-theme-border bg-theme-surface shadow-sm'
        }`}
      >
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
          <Building2 size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-theme-muted uppercase tracking-wider truncate">
              Gerencia Cedente
            </p>
            {countPendientesGerencia > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-700 dark:text-indigo-400">
                Peticiones
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 font-mono">{countPendientesGerencia}</p>
            <span className="text-xs text-theme-muted font-mono truncate">({formatMoney(totalMontoPendienteGerencia)})</span>
          </div>
        </div>
      </div>

      {/* 2. En Espera (Presupuestos) */}
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
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-theme-muted uppercase tracking-wider truncate">
              Presupuestos
            </p>
            {countPendientesPresupuestos > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-600">
                Pendientes
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <p className="text-xl font-bold text-amber-600 font-mono">{countPendientesPresupuestos}</p>
            <span className="text-xs text-theme-muted font-mono truncate">({formatMoney(totalMontoPendientePresupuestos)})</span>
          </div>
        </div>
      </div>

      {/* 3. Aprobadas Oficialmente */}
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
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-theme-muted uppercase tracking-wider truncate">
            Aprobadas POA
          </p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <p className="text-xl font-bold text-emerald-600 font-mono">{countAprobadas}</p>
            <span className="text-xs text-theme-muted font-mono truncate">({formatMoney(totalMontoAprobado)})</span>
          </div>
        </div>
      </div>

      {/* 4. Total Movilizado POA */}
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
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-theme-muted uppercase tracking-wider truncate">
            Total Movilizado
          </p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <p className="text-xl font-bold text-theme-main font-mono">{totalCount}</p>
            <span className="text-xs text-theme-muted font-mono truncate">
              ({formatMoney(totalMontoPendientePresupuestos + totalMontoAprobado)})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
