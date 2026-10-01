import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Building2,
  FileSpreadsheet,
  DollarSign,
  Shuffle,
  Award,
  Clock,
  ArrowRight,
  Shield,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import {
  WorkerDetailActivity,
  WorkerMemoriaItem,
  WorkerGastoItem,
  WorkerTraspasoItem,
  WorkerCertificacionItem,
  AuditLogEntry,
} from '../types/auditoria.types';

interface ExpedienteTrabajadorDrawerProps {
  detail: WorkerDetailActivity | null;
  loading: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSelectLog: (log: AuditLogEntry) => void;
}

export const ExpedienteTrabajadorDrawer: React.FC<ExpedienteTrabajadorDrawerProps> = ({
  detail,
  loading,
  isOpen,
  onClose,
  onSelectLog,
}) => {
  const [subTab, setSubTab] = useState<'MEMORIAS' | 'GASTOS' | 'TRASPASOS' | 'CERTIFICACIONES' | 'BITACORA'>('MEMORIAS');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-12">
        <div className="w-screen max-w-3xl bg-theme-surface border-l border-theme-border shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
          {/* Header del Expediente */}
          <div className="p-5 border-b border-theme-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-theme-primary to-brand-700 text-white font-bold text-base flex items-center justify-center shadow-inner shrink-0">
                {detail?.usuario ? detail.usuario.nombre_completo.substring(0, 2).toUpperCase() : 'EX'}
              </div>
              <div>
                <h3 className="text-base font-bold text-theme-main">
                  {detail?.usuario ? detail.usuario.nombre_completo : 'Cargando expediente...'}
                </h3>
                <span className="text-xs font-mono text-theme-muted">
                  {detail?.usuario ? `@${detail.usuario.username} • Expediente Operativo` : 'Trazabilidad POA'}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-theme-muted hover:text-theme-main hover:bg-theme-surface-subtle transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Contenido Principal */}
          {loading || !detail ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-theme-muted p-12">
              <Loader2 className="animate-spin text-theme-primary" size={32} />
              <p className="text-xs">Recuperando trazabilidad del servidor público...</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Ficha del Servidor */}
              <div className="p-4 rounded-xl bg-theme-surface-subtle border border-theme-border space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-theme-primary/10 text-theme-primary border border-theme-primary/20">
                      {detail.usuario.rol}
                    </span>
                    <span className="text-xs text-theme-muted">
                      {detail.usuario.cargo || 'Sin cargo específico'}
                    </span>
                  </div>

                  <span className="text-[11px] text-theme-muted">
                    Último acceso:{' '}
                    <strong className="text-theme-main">
                      {detail.usuario.last_login
                        ? new Date(detail.usuario.last_login).toLocaleDateString('es-BO')
                        : 'Sin accesos'}
                    </strong>
                  </span>
                </div>

                <div className="text-xs text-theme-muted flex items-center gap-1.5">
                  <Building2 size={13} className="shrink-0" />
                  <span>{detail.usuario.area || 'Dirección General'}</span>
                  {detail.usuario.seccion && <span>/ {detail.usuario.seccion}</span>}
                </div>
              </div>

              {/* Métricas Resumidas del Expediente */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-2.5 rounded-xl bg-theme-surface border border-theme-border">
                  <span className="text-[10px] font-bold uppercase text-theme-muted block">Memorias</span>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {detail.memorias.length}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-theme-surface border border-theme-border">
                  <span className="text-[10px] font-bold uppercase text-theme-muted block">Gastos</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {detail.gastos.length}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-theme-surface border border-theme-border">
                  <span className="text-[10px] font-bold uppercase text-theme-muted block">Traspasos</span>
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {detail.traspasos.length}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-theme-surface border border-theme-border">
                  <span className="text-[10px] font-bold uppercase text-theme-muted block">Bitácora</span>
                  <span className="text-sm font-bold text-theme-main">{detail.logs.length}</span>
                </div>
              </div>

              {/* Sub-pestañas de Navegación del Expediente */}
              <div className="border-b border-theme-border flex gap-1 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setSubTab('MEMORIAS')}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                    subTab === 'MEMORIAS'
                      ? 'border-theme-primary text-theme-primary font-bold'
                      : 'border-transparent text-theme-muted hover:text-theme-main'
                  }`}
                >
                  <FileSpreadsheet size={13} />
                  <span>Memorias ({detail.memorias.length})</span>
                </button>

                <button
                  onClick={() => setSubTab('GASTOS')}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                    subTab === 'GASTOS'
                      ? 'border-theme-primary text-theme-primary font-bold'
                      : 'border-transparent text-theme-muted hover:text-theme-main'
                  }`}
                >
                  <DollarSign size={13} />
                  <span>Gastos ({detail.gastos.length})</span>
                </button>

                <button
                  onClick={() => setSubTab('TRASPASOS')}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                    subTab === 'TRASPASOS'
                      ? 'border-theme-primary text-theme-primary font-bold'
                      : 'border-transparent text-theme-muted hover:text-theme-main'
                  }`}
                >
                  <Shuffle size={13} />
                  <span>Traspasos ({detail.traspasos.length})</span>
                </button>

                <button
                  onClick={() => setSubTab('CERTIFICACIONES')}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                    subTab === 'CERTIFICACIONES'
                      ? 'border-theme-primary text-theme-primary font-bold'
                      : 'border-transparent text-theme-muted hover:text-theme-main'
                  }`}
                >
                  <Award size={13} />
                  <span>Certificaciones ({detail.certificaciones.length})</span>
                </button>

                <button
                  onClick={() => setSubTab('BITACORA')}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                    subTab === 'BITACORA'
                      ? 'border-theme-primary text-theme-primary font-bold'
                      : 'border-transparent text-theme-muted hover:text-theme-main'
                  }`}
                >
                  <Clock size={13} />
                  <span>Bitácora ({detail.logs.length})</span>
                </button>
              </div>

              {/* Vistas según sub-pestaña */}
              <div>
                {/* Pestaña Memorias */}
                {subTab === 'MEMORIAS' && (
                  <div className="bg-theme-surface rounded-xl border border-theme-border overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-theme-border bg-theme-base/60 text-xs font-semibold uppercase tracking-wider text-theme-muted">
                          <th className="py-2.5 px-3">Código</th>
                          <th className="py-2.5 px-3">Rol en Memoria</th>
                          <th className="py-2.5 px-3 text-center">Gestión</th>
                          <th className="py-2.5 px-3 text-center">Estado</th>
                          <th className="py-2.5 px-3 text-right">Presupuestado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-theme-border">
                        {detail.memorias.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-theme-muted text-xs">
                              Sin memorias registradas.
                            </td>
                          </tr>
                        ) : (
                          detail.memorias.map((m) => (
                            <tr key={m.id} className="hover:bg-theme-border/20 transition-colors">
                              <td className="py-2.5 px-3 font-mono font-bold text-theme-main">{m.codigo}</td>
                              <td className="py-2.5 px-3">
                                <span className="px-2 py-0.5 rounded bg-theme-primary/10 text-theme-primary text-[10px] font-bold">
                                  {m.rol_participacion_display}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center font-semibold text-theme-main">
                                {m.gestion || '-'}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className="px-2 py-0.5 rounded bg-theme-border/30 text-theme-main text-[10px] font-bold">
                                  {m.estado_display}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-semibold text-theme-main">
                                Bs. {m.total_presupuestado.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pestaña Gastos */}
                {subTab === 'GASTOS' && (
                  <div className="bg-theme-surface rounded-xl border border-theme-border overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-theme-border bg-theme-base/60 text-xs font-semibold uppercase tracking-wider text-theme-muted">
                          <th className="py-2.5 px-3">Fecha</th>
                          <th className="py-2.5 px-3">Comprobante</th>
                          <th className="py-2.5 px-3">Memoria</th>
                          <th className="py-2.5 px-3 text-right">Monto Ejecutado</th>
                          <th className="py-2.5 px-3">Observación</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-theme-border">
                        {detail.gastos.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-theme-muted text-xs">
                              Sin gastos registrados.
                            </td>
                          </tr>
                        ) : (
                          detail.gastos.map((g) => (
                            <tr key={g.id} className="hover:bg-theme-border/20 transition-colors">
                              <td className="py-2.5 px-3 text-theme-muted whitespace-nowrap">{g.fecha_gasto}</td>
                              <td className="py-2.5 px-3 font-mono font-bold text-theme-main">
                                {g.comprobante_num || 'S/N'}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-theme-primary font-semibold">
                                {g.memoria_codigo}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                                Bs. {g.monto_ejecutado.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-2.5 px-3 text-theme-muted line-clamp-1">{g.observacion || '-'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pestaña Traspasos */}
                {subTab === 'TRASPASOS' && (
                  <div className="bg-theme-surface rounded-xl border border-theme-border overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-theme-border bg-theme-base/60 text-xs font-semibold uppercase tracking-wider text-theme-muted">
                          <th className="py-2.5 px-3">Fecha</th>
                          <th className="py-2.5 px-3 text-right">Monto</th>
                          <th className="py-2.5 px-3">Traspaso</th>
                          <th className="py-2.5 px-3">Motivo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-theme-border">
                        {detail.traspasos.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-theme-muted text-xs">
                              Sin traspasos registrados.
                            </td>
                          </tr>
                        ) : (
                          detail.traspasos.map((t) => (
                            <tr key={t.id} className="hover:bg-theme-border/20 transition-colors">
                              <td className="py-2.5 px-3 text-theme-muted whitespace-nowrap">
                                {new Date(t.created_at).toLocaleDateString('es-BO')}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                                Bs. {t.monto.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-2.5 px-3 font-mono">
                                <span className="font-bold text-theme-main">{t.memoria_origen}</span> →{' '}
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                  {t.memoria_destino}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-theme-muted line-clamp-1">{t.motivo}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pestaña Certificaciones */}
                {subTab === 'CERTIFICACIONES' && (
                  <div className="bg-theme-surface rounded-xl border border-theme-border overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-theme-border bg-theme-base/60 text-xs font-semibold uppercase tracking-wider text-theme-muted">
                          <th className="py-2.5 px-3">Código</th>
                          <th className="py-2.5 px-3">Área</th>
                          <th className="py-2.5 px-3 text-center">Estado</th>
                          <th className="py-2.5 px-3 text-right">Monto Solicitado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-theme-border">
                        {detail.certificaciones.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-theme-muted text-xs">
                              Sin certificaciones registradas.
                            </td>
                          </tr>
                        ) : (
                          detail.certificaciones.map((c) => (
                            <tr key={c.id} className="hover:bg-theme-border/20 transition-colors">
                              <td className="py-2.5 px-3 font-mono font-bold text-theme-main">{c.codigo}</td>
                              <td className="py-2.5 px-3 text-theme-muted">{c.area}</td>
                              <td className="py-2.5 px-3 text-center">
                                <span className="px-2 py-0.5 rounded bg-theme-border/30 text-theme-main text-[10px] font-bold">
                                  {c.estado}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-purple-600 dark:text-purple-400 whitespace-nowrap">
                                Bs. {c.monto_solicitado.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pestaña Bitácora Individual */}
                {subTab === 'BITACORA' && (
                  <div className="space-y-2">
                    {detail.logs.length === 0 ? (
                      <div className="p-8 text-center text-xs text-theme-muted">
                        No registra eventos en la bitácora del sistema.
                      </div>
                    ) : (
                      detail.logs.map((log) => (
                        <div
                          key={log.id}
                          onClick={() => onSelectLog(log)}
                          className="p-3 rounded-xl border border-theme-border bg-theme-surface hover:bg-theme-surface-subtle transition-colors flex items-center justify-between gap-3 cursor-pointer group"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-theme-primary/10 text-theme-primary">
                                {log.modulo}
                              </span>
                              <span className="text-xs font-mono font-bold text-theme-main">
                                {log.object_repr}
                              </span>
                            </div>
                            <p className="text-xs text-theme-muted mt-1 line-clamp-1">
                              {log.change_message}
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[11px] font-mono text-theme-muted block">
                              {new Date(log.action_time).toLocaleDateString('es-BO')}
                            </span>
                            <span className="text-[10px] text-theme-primary opacity-0 group-hover:opacity-100 transition-opacity">
                              Inspeccionar
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer del Drawer */}
          <div className="p-4 border-t border-theme-border bg-theme-surface flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-theme-border text-theme-main hover:bg-theme-surface-subtle transition-colors cursor-pointer"
            >
              Cerrar Expediente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
