import React from 'react';
import {
  ShieldCheck,
  RefreshCw,
  Download,
  Calendar,
  Activity,
  Users,
  Shield,
  Database,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { AuditResumen } from '../types/auditoria.types';

interface AuditoriaControlBarProps {
  activeTab: 'BITACORA' | 'TRABAJADORES' | 'LOGINS';
  onTabChange: (tab: 'BITACORA' | 'TRABAJADORES' | 'LOGINS') => void;
  timeRange: 'TODAS' | 'HOY' | '7_DIAS' | 'ESTE_MES';
  onTimeRangeChange: (range: 'TODAS' | 'HOY' | '7_DIAS' | 'ESTE_MES') => void;
  onRefresh: () => void;
  onExport: () => void;
  refreshing: boolean;
  loading: boolean;
  resumen: AuditResumen | null;
  totalLogsCount: number;
  totalWorkersCount: number;
  totalLoginsCount: number;
}

export const AuditoriaControlBar: React.FC<AuditoriaControlBarProps> = ({
  activeTab,
  onTabChange,
  timeRange,
  onTimeRangeChange,
  onRefresh,
  onExport,
  refreshing,
  loading,
  resumen,
  totalLogsCount,
  totalWorkersCount,
  totalLoginsCount,
}) => {
  const totalEvents = resumen?.total_logs ?? totalLogsCount;
  const hoyEvents = resumen?.acciones_hoy ?? 0;
  const criticalEvents = resumen?.modificaciones_criticas ?? 0;
  const activeWorkers = resumen?.usuarios_activos_total ?? totalWorkersCount;

  return (
    <div className="space-y-4">
      {/* Cabecera Principal */}
      <div className="card p-5 sm:p-6 bg-theme-surface border border-theme-border rounded-2xl shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-500 border border-brand-200 dark:bg-brand-900/40 dark:text-brand-200 dark:border-brand-600 flex items-center justify-center shadow-sm shrink-0">
              <ShieldCheck size={26} />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-md bg-theme-primary/10 text-theme-primary text-[10px] font-bold uppercase tracking-wider">
                  Superadministración
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Registro Inmutable Activo
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold font-display text-theme-main tracking-tight">
                Auditoría & Trazabilidad Operativa
              </h1>

              <p className="text-xs text-theme-muted mt-0.5 leading-relaxed">
                Supervisión institucional, bitácora de eventos y flujo de trabajo por servidor público.
              </p>
            </div>
          </div>

          {/* Acciones de Cabecera */}
          <div className="flex items-center gap-2 self-start md:self-center flex-wrap">
            <button
              onClick={onExport}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-theme-border text-theme-main bg-theme-surface hover:bg-theme-border/20 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Exportar registros filtrados a formato CSV"
            >
              <Download size={14} className="text-theme-muted" />
              <span>Exportar Bitácora</span>
            </button>

            <button
              onClick={onRefresh}
              disabled={refreshing || loading}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-theme-primary text-theme-primaryText dark:text-white hover:bg-theme-primaryHover transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              title="Recargar datos de auditoría"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              <span>{refreshing ? 'Sincronizando...' : 'Actualizar Datos'}</span>
            </button>
          </div>
        </div>

        {/* Franja de Indicadores Resumen (Bordes Temáticos Suaves por Tarjeta) */}
        <div className="mt-5 pt-4 border-t border-theme-border/50 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Tarjeta 1: Total Bitácora (Borde Azul/Primary) */}
          <div className="p-3 rounded-xl bg-blue-500/[0.03] border border-blue-500/25 dark:border-blue-400/20 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 block tracking-wider">
                Total Bitácora
              </span>
              <span className="text-base sm:text-lg font-bold text-theme-main">
                {totalEvents.toLocaleString()}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Database size={15} />
            </div>
          </div>

          {/* Tarjeta 2: Operaciones Hoy (Borde Sky/Azul Suave) */}
          <div className="p-3 rounded-xl bg-sky-500/[0.03] border border-sky-500/25 dark:border-sky-400/20 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-sky-600 dark:text-sky-400 block tracking-wider">
                Operaciones Hoy
              </span>
              <span className="text-base sm:text-lg font-bold text-sky-600 dark:text-sky-400">
                {hoyEvents.toLocaleString()}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <Clock size={15} />
            </div>
          </div>

          {/* Tarjeta 3: Acciones Críticas (Borde Ámbar) */}
          <div className="p-3 rounded-xl bg-amber-500/[0.03] border border-amber-500/25 dark:border-amber-400/20 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block tracking-wider">
                Acciones Críticas
              </span>
              <span className="text-base sm:text-lg font-bold text-amber-600 dark:text-amber-400">
                {criticalEvents.toLocaleString()}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Shield size={15} />
            </div>
          </div>

          {/* Tarjeta 4: Servidores Activos (Borde Esmeralda) */}
          <div className="p-3 rounded-xl bg-emerald-500/[0.03] border border-emerald-500/25 dark:border-emerald-400/20 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block tracking-wider">
                Servidores Activos
              </span>
              <span className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {activeWorkers} / {totalWorkersCount}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Users size={15} />
            </div>
          </div>
        </div>
      </div>

      {/* Selector de Pestañas y Filtro de Rango Temporal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-theme-border pb-2">
        {/* Pestañas de Vista */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => onTabChange('BITACORA')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'BITACORA'
                ? 'bg-theme-primary text-theme-primaryText dark:text-white shadow-sm font-bold'
                : 'text-theme-muted hover:text-theme-main hover:bg-theme-surface'
            }`}
          >
            <Activity size={15} />
            <span>Bitácora General del POA</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'BITACORA'
                  ? 'bg-black/15 text-theme-primaryText dark:bg-white/20 dark:text-white'
                  : 'bg-theme-border/40 text-theme-muted'
              }`}
            >
              {totalLogsCount.toLocaleString()}
            </span>
          </button>

          <button
            onClick={() => onTabChange('TRABAJADORES')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'TRABAJADORES'
                ? 'bg-theme-primary text-theme-primaryText dark:text-white shadow-sm font-bold'
                : 'text-theme-muted hover:text-theme-main hover:bg-theme-surface'
            }`}
          >
            <Users size={15} />
            <span>Flujo por Servidor Público</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'TRABAJADORES'
                  ? 'bg-black/15 text-theme-primaryText dark:bg-white/20 dark:text-white'
                  : 'bg-theme-border/40 text-theme-muted'
              }`}
            >
              {totalWorkersCount}
            </span>
          </button>

          <button
            onClick={() => onTabChange('LOGINS')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'LOGINS'
                ? 'bg-theme-primary text-theme-primaryText dark:text-white shadow-sm font-bold'
                : 'text-theme-muted hover:text-theme-main hover:bg-theme-surface'
            }`}
          >
            <ShieldCheck size={15} />
            <span>Historial de Accesos (Logins)</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'LOGINS'
                  ? 'bg-black/15 text-theme-primaryText dark:bg-white/20 dark:text-white'
                  : 'bg-theme-border/40 text-theme-muted'
              }`}
            >
              {totalLoginsCount}
            </span>
          </button>
        </div>

        {/* Filtro Rápido de Rango de Fechas (Solo visible en Bitácora) */}
        {activeTab === 'BITACORA' && (
          <div className="flex items-center gap-1 self-end sm:self-center shrink-0 text-xs">
            <span className="text-[11px] font-semibold text-theme-muted mr-1 hidden lg:inline flex items-center gap-1">
              <Calendar size={12} /> Periodo:
            </span>
            {[
              { id: 'TODAS', label: 'Todo' },
              { id: 'HOY', label: 'Hoy' },
              { id: '7_DIAS', label: '7 días' },
              { id: 'ESTE_MES', label: 'Este mes' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => onTimeRangeChange(p.id as any)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                  timeRange === p.id
                    ? 'bg-theme-primary/15 text-theme-primary border border-theme-primary/30 font-bold'
                    : 'text-theme-muted hover:text-theme-main hover:bg-theme-surface border border-transparent'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
