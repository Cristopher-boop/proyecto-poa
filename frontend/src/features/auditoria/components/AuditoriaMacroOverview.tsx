import React from 'react';
import {
  Activity,
  Layers,
  Calendar,
  Clock,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  DollarSign,
  Shuffle,
  Award,
  LogIn,
  Shield,
  Eye,
} from 'lucide-react';
import { AuditResumen, AuditLogEntry } from '../types/auditoria.types';
import { Button } from '../../../components/commons';

interface AuditoriaMacroOverviewProps {
  resumen: AuditResumen | null;
  loading: boolean;
  onNavigateToBitacora: (modulo?: string) => void;
  onSelectLog: (log: AuditLogEntry) => void;
}

export const AuditoriaMacroOverview: React.FC<AuditoriaMacroOverviewProps> = ({
  resumen,
  loading,
  onNavigateToBitacora,
  onSelectLog,
}) => {
  if (loading || !resumen) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-pulse">
        <div className="lg:col-span-2 card p-6 bg-theme-surface border border-theme-border rounded-2xl h-80" />
        <div className="card p-6 bg-theme-surface border border-theme-border rounded-2xl h-80" />
      </div>
    );
  }

  const moduleMeta: Record<string, { label: string; icon: React.ReactNode; color: string; barColor: string }> = {
    MEMORIAS: {
      label: 'Memorias de Cálculo',
      icon: <FileSpreadsheet size={16} className="text-blue-500" />,
      color: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20',
      barColor: 'bg-blue-500',
    },
    EJECUCIÓN: {
      label: 'Ejecución Presupuestaria (Gastos)',
      icon: <DollarSign size={16} className="text-emerald-500" />,
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      barColor: 'bg-emerald-500',
    },
    MODIFICACIONES: {
      label: 'Traspasos Presupuestarios',
      icon: <Shuffle size={16} className="text-indigo-500" />,
      color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      barColor: 'bg-indigo-500',
    },
    CERTIFICACIONES: {
      label: 'Certificaciones POA',
      icon: <Award size={16} className="text-purple-500" />,
      color: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20',
      barColor: 'bg-purple-500',
    },
    PRESUPUESTOS: {
      label: 'Techos & Presupuestos',
      icon: <Layers size={16} className="text-amber-500" />,
      color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
      barColor: 'bg-amber-500',
    },
    AUTENTICACIÓN: {
      label: 'Inicios de Sesión & Accesos',
      icon: <LogIn size={16} className="text-cyan-500" />,
      color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      barColor: 'bg-cyan-500',
    },
  };

  const totalModulosSuma = Object.values(resumen.distribucion_modulos).reduce((a, b) => a + b, 0) || 1;

  // Maximo conteo en los últimos 7 días para escalar gráfico de barras
  const maxDayCount = Math.max(...resumen.tendencia_7_dias.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      {/* Fila 1: Distribución por Módulo + Tendencia Semanal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Distribución por Módulo (7 columnas) */}
        <div className="lg:col-span-7 card p-5 sm:p-6 bg-theme-surface border border-theme-border rounded-2xl shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-theme-primary/10 text-theme-primary">
                <Layers size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-theme-main">Actividad por Módulo Institucional</h3>
                <p className="text-xs text-theme-muted">Desglose de operaciones registradas en el POA</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateToBitacora('TODOS')}
              className="text-xs font-semibold text-theme-primary hover:underline flex items-center gap-1"
            >
              <span>Ver bitácora</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="space-y-3.5">
            {Object.entries(resumen.distribucion_modulos).map(([modKey, count]) => {
              const meta = moduleMeta[modKey] || {
                label: modKey,
                icon: <Activity size={16} />,
                color: 'text-theme-main bg-theme-border/20 border-theme-border',
                barColor: 'bg-theme-primary',
              };
              const pct = Math.round((count / totalModulosSuma) * 100);

              return (
                <div
                  key={modKey}
                  onClick={() => onNavigateToBitacora(modKey)}
                  className="group p-3 rounded-xl hover:bg-theme-surface-subtle border border-transparent hover:border-theme-border transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-lg bg-theme-base border border-theme-border/60">
                        {meta.icon}
                      </div>
                      <span className="text-xs font-semibold text-theme-main group-hover:text-theme-primary transition-colors">
                        {meta.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-theme-main">{count.toLocaleString()}</span>
                      <span className="text-[10px] font-medium text-theme-muted">({pct}%)</span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-theme-border/40 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${meta.barColor} transition-all duration-500`}
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tendencia de Actividad de 7 Días (5 columnas) */}
        <div className="lg:col-span-5 card p-5 sm:p-6 bg-theme-surface border border-theme-border rounded-2xl shadow-sm flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="p-2 rounded-xl bg-theme-primary/10 text-theme-primary">
                <TrendingUp size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-theme-main">Tendencia de Actividad</h3>
                <p className="text-xs text-theme-muted">Volumen de eventos en los últimos 7 días</p>
              </div>
            </div>

            {/* Gráfico de barras diarias estilizado */}
            <div className="mt-8 pt-4 pb-2 flex items-end justify-between gap-2 h-44">
              {resumen.tendencia_7_dias.map((day) => {
                const heightPct = Math.max(Math.round((day.count / maxDayCount) * 100), 10);
                const isToday = day === resumen.tendencia_7_dias[resumen.tendencia_7_dias.length - 1];

                return (
                  <div key={day.fecha} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <span className="text-[10px] font-bold text-theme-main opacity-0 group-hover:opacity-100 transition-opacity">
                      {day.count}
                    </span>
                    <div className="w-full max-w-[28px] h-full flex items-end">
                      <div
                        className={`w-full rounded-t-lg transition-all duration-500 ${
                          isToday
                            ? 'bg-theme-primary shadow-sm'
                            : 'bg-theme-primary/25 hover:bg-theme-primary/50'
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <span
                      className={`text-[10px] font-semibold tracking-tight ${
                        isToday ? 'text-theme-primary font-bold' : 'text-theme-muted'
                      }`}
                    >
                      {day.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Resumen por Naturaleza de la Acción */}
          <div className="pt-4 border-t border-theme-border grid grid-cols-2 gap-2 text-center">
            <div className="p-2 rounded-xl bg-theme-surface-subtle border border-theme-border/60">
              <span className="text-[10px] uppercase font-bold text-theme-muted">Creaciones</span>
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {(resumen.distribucion_acciones['CREACIÓN'] || 0).toLocaleString()}
              </p>
            </div>
            <div className="p-2 rounded-xl bg-theme-surface-subtle border border-theme-border/60">
              <span className="text-[10px] uppercase font-bold text-theme-muted">Modificaciones</span>
              <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                {(resumen.distribucion_acciones['MODIFICACIÓN'] || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Fila 2: Flujo Cronológico de Actividad Reciente */}
      <div className="card p-5 sm:p-6 bg-theme-surface border border-theme-border rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-theme-primary/10 text-theme-primary">
              <Clock size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-theme-main">Línea de Tiempo de Actividad Reciente</h3>
              <p className="text-xs text-theme-muted">Últimos eventos registrados en tiempo real por el sistema</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigateToBitacora('TODOS')}
            className="text-xs font-semibold flex items-center gap-1.5"
          >
            <span>Ver bitácora completa</span>
            <ArrowRight size={14} />
          </Button>
        </div>

        <div className="divide-y divide-theme-border">
          {resumen.actividad_reciente.slice(0, 8).map((log) => {
            const dateObj = new Date(log.action_time);
            const timeStr = dateObj.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
            const dateStr = dateObj.toLocaleDateString('es-BO', { day: '2-digit', month: 'short' });

            const getActionBadge = (flag: string) => {
              switch (flag) {
                case 'CREACIÓN':
                  return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
                case 'ELIMINACIÓN':
                  return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
                case 'LOGIN':
                  return 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20';
                default:
                  return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
              }
            };

            return (
              <div
                key={log.id}
                onClick={() => onSelectLog(log)}
                className="py-3 sm:py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group hover:bg-theme-surface-subtle px-2 rounded-xl transition-colors cursor-pointer"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-theme-base border border-theme-border flex items-center justify-center font-bold text-xs text-theme-main shrink-0">
                    {log.usuario_nombre ? log.usuario_nombre.substring(0, 2).toUpperCase() : 'SI'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-theme-main">{log.usuario_nombre}</span>
                      <span className="text-[10px] text-theme-muted font-mono">@{log.usuario_username}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getActionBadge(
                          log.action_flag_display
                        )}`}
                      >
                        {log.action_flag_display}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-theme-border/30 text-theme-muted">
                        {log.modulo}
                      </span>
                    </div>
                    <p className="text-xs text-theme-main/90 mt-1 line-clamp-1 font-mono">
                      {log.change_message || log.object_repr}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                  <div className="text-right">
                    <span className="text-xs font-semibold text-theme-main">{timeStr}</span>
                    <p className="text-[10px] text-theme-muted">{dateStr}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectLog(log);
                    }}
                    className="p-1.5 text-theme-muted group-hover:text-theme-primary"
                    title="Ver detalle del registro"
                  >
                    <Eye size={15} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
