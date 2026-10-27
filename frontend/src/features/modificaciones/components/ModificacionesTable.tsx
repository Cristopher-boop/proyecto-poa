import React from 'react';
import {
  ArrowRightLeft,
  ArrowRight,
  UserCheck,
  Layers,
  Check,
  X,
  Eye,
  Clock,
  CheckCircle2,
  Building2,
  Sparkles,
} from 'lucide-react';
import { ModificacionPresupuestaria } from '../../../services/presupuestoService';
import { StatusBadge } from '../../../components/commons';

interface ModificacionesTableProps {
  modificaciones: ModificacionPresupuestaria[];
  loading: boolean;
  canAprobar: boolean;
  canAceptarGerencia?: (mod: ModificacionPresupuestaria) => boolean;
  selectedModIds: number[];
  areAllPendingOnPageSelected: boolean;
  pendingVisiblesCount: number;
  onToggleSelectAllPending: () => void;
  onToggleSelectRow: (id: number) => void;
  onVerDetalle: (mod: ModificacionPresupuestaria) => void;
  onAprobarIndividual: (mod: ModificacionPresupuestaria) => void;
  onAceptarGerencia?: (mod: ModificacionPresupuestaria) => void;
  onRechazarIndividual: (mod: ModificacionPresupuestaria) => void;
  actionLoading?: boolean;
  currentPage: number;
  totalPages: number;
  totalFilteredCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export const ModificacionesTable: React.FC<ModificacionesTableProps> = ({
  modificaciones,
  loading,
  canAprobar,
  canAceptarGerencia,
  selectedModIds,
  areAllPendingOnPageSelected,
  pendingVisiblesCount,
  onToggleSelectAllPending,
  onToggleSelectRow,
  onVerDetalle,
  onAprobarIndividual,
  onAceptarGerencia,
  onRechazarIndividual,
  actionLoading = false,
  currentPage,
  totalPages,
  totalFilteredCount,
  pageSize,
  onPageChange,
}) => {
  const formatMoney = (val: number | string) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB', minimumFractionDigits: 2 }).format(num || 0);
  };

  return (
    <div className="card border border-theme-border bg-theme-surface shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-theme-border/40 border-b border-theme-border text-theme-muted font-semibold">
              {/* Checkbox Maestro para Aprobación en Lote */}
              {canAprobar && (
                <th className="py-3 px-3 text-center w-10">
                  <input
                    type="checkbox"
                    checked={areAllPendingOnPageSelected}
                    onChange={onToggleSelectAllPending}
                    disabled={pendingVisiblesCount === 0}
                    title="Seleccionar todas las pendientes visibles"
                    className="rounded border-theme-border text-theme-primary focus:ring-theme-primary cursor-pointer"
                  />
                </th>
              )}
              <th className="py-3 px-4"># / Código</th>
              <th className="py-3 px-4">Área Solicitante / Flujo</th>
              <th className="py-3 px-4">Partida Cedente (-)</th>
              <th className="py-3 px-2 text-center">Flujo</th>
              <th className="py-3 px-4">Partida Receptora (+)</th>
              <th className="py-3 px-4 text-right">Monto Compensado</th>
              <th className="py-3 px-4 text-center">Estado</th>
              <th className="py-3 px-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-theme-border">
            {loading ? (
              <tr>
                <td colSpan={canAprobar ? 9 : 8} className="py-12 text-center text-theme-muted">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-theme-primary border-t-transparent rounded-full animate-spin" />
                    <p className="font-medium text-xs">Cargando modificaciones presupuestarias...</p>
                  </div>
                </td>
              </tr>
            ) : modificaciones.length === 0 ? (
              <tr>
                <td colSpan={canAprobar ? 9 : 8} className="py-12 text-center text-theme-muted">
                  <ArrowRightLeft size={36} className="mx-auto mb-2 opacity-30" />
                  <p className="font-medium">No se encontraron modificaciones presupuestarias con los filtros aplicados.</p>
                </td>
              </tr>
            ) : (
              modificaciones.map((mod) => {
                const origCount = mod.origenes?.length || 0;
                const destCount = mod.destinos?.length || 0;
                const isPendingPresupuestos = mod.estado === 'PENDIENTE_PRESUPUESTOS';
                const isPendingGerencia = mod.estado === 'PENDIENTE_GERENCIA_CEDENTE';
                const isSelected = selectedModIds.includes(mod.id);
                const isInterArea = mod.tipo === 'TRASPASO_INTER_AREA' || !!mod.es_inter_area;
                const userCanAcceptGerencia = canAceptarGerencia ? canAceptarGerencia(mod) : false;

                return (
                  <tr
                    key={mod.id}
                    className={`transition-colors ${
                      isSelected
                        ? 'bg-amber-500/[0.08] dark:bg-amber-500/[0.12]'
                        : isPendingPresupuestos
                        ? 'hover:bg-amber-500/[0.03]'
                        : isPendingGerencia
                        ? 'hover:bg-indigo-500/[0.03]'
                        : 'hover:bg-theme-border/20'
                    }`}
                  >
                    {/* Checkbox de selección para Presupuestos */}
                    {canAprobar && (
                      <td className="py-3 px-3 text-center">
                        {isPendingPresupuestos ? (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onToggleSelectRow(mod.id)}
                            className="rounded border-theme-border text-amber-600 focus:ring-amber-500 cursor-pointer"
                          />
                        ) : (
                          <span className="text-theme-muted/40">•</span>
                        )}
                      </td>
                    )}

                    {/* Código & Fecha */}
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-theme-main">{mod.codigo}</span>
                      <p className="text-[11px] text-theme-muted mt-0.5">
                        {mod.created_at || mod.fecha
                          ? new Date(mod.created_at || mod.fecha).toLocaleDateString('es-BO')
                          : 'N/A'}
                      </p>
                    </td>

                    {/* Área Solicitante / Inter-Área */}
                    <td className="py-3 px-4">
                      {isInterArea ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20">
                            Inter-Gerencias
                          </span>
                          <p className="text-xs font-semibold text-theme-main">
                            {mod.area_nombre || 'N/A'}
                          </p>
                          <p className="text-[10px] text-theme-muted font-medium">
                            Cede: <strong className="text-indigo-600 dark:text-indigo-400">{mod.area_cedente_nombre || 'Área Cedente'}</strong>
                          </p>
                        </div>
                      ) : (
                        <div>
                          <span className="font-semibold text-theme-main">{mod.area_nombre || 'N/A'}</span>
                          {mod.usuario_registro_nombre && (
                            <p className="text-[10px] text-theme-muted flex items-center gap-1 mt-0.5">
                              <UserCheck size={11} /> {mod.usuario_registro_nombre}
                            </p>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Partida Origen (-) */}
                    <td className="py-3 px-4">
                      {origCount === 1 ? (
                        <div className="flex flex-col">
                          <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                            Partida {mod.origenes[0].partida_codigo || 'S/P'}
                          </span>
                          <span className="text-[10px] text-theme-muted font-mono truncate max-w-[150px]">
                            {mod.origenes[0].memoria_codigo ? `Memoria ${mod.origenes[0].memoria_codigo}` : 'Origen'}
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                          <Layers size={11} className="mr-1" />
                          {origCount} Partidas Cedentes
                        </span>
                      )}
                    </td>

                    {/* Flecha */}
                    <td className="py-3 px-2 text-center">
                      <div className="w-6 h-6 rounded-full bg-theme-border/60 flex items-center justify-center mx-auto text-theme-primary">
                        <ArrowRight size={12} />
                      </div>
                    </td>

                    {/* Partida Destino (+) */}
                    <td className="py-3 px-4">
                      {destCount === 1 ? (
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              Partida {mod.destinos[0].partida_codigo || 'S/P'}
                            </span>
                            {mod.destinos[0].es_nueva_partida && (
                              <span
                                title="Partida creada durante la ejecución (sin detalles)"
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30"
                              >
                                <Sparkles size={9} /> Nueva
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-theme-muted font-mono truncate max-w-[150px]">
                            {mod.destinos[0].es_nueva_partida
                              ? 'Creada en ejecución'
                              : `Memoria ${mod.destinos[0].memoria_codigo}`}
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            <Layers size={11} className="mr-1" />
                            {destCount} Partidas Receptoras
                          </span>
                          {mod.destinos.some((d) => d.es_nueva_partida) && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                              <Sparkles size={9} /> Incluye nueva partida
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Monto */}
                    <td className="py-3 px-4 text-right">
                      <span className="font-mono font-bold text-theme-main text-xs">
                        {formatMoney(mod.total_monto)}
                      </span>
                    </td>

                    {/* Estado */}
                    <td className="py-3 px-4 text-center">
                      <StatusBadge
                        status={mod.estado}
                        label={
                          mod.estado === 'PENDIENTE_GERENCIA_CEDENTE'
                            ? 'En Espera (Gerencia Cedente)'
                            : mod.estado === 'PENDIENTE_PRESUPUESTOS'
                            ? 'En Espera (Presupuestos)'
                            : mod.estado_display || mod.estado
                        }
                        size="sm"
                      />
                    </td>

                    {/* Acciones */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Ver Detalle en Modal */}
                        <button
                          type="button"
                          onClick={() => onVerDetalle(mod)}
                          className="p-1.5 rounded-lg bg-theme-primary/10 text-theme-primary hover:bg-theme-primary/20 transition-colors"
                          title="Ver detalle completo en modal"
                        >
                          <Eye size={14} />
                        </button>

                        {/* Acciones para Gerencia Cedente */}
                        {isPendingGerencia && userCanAcceptGerencia && (
                          <>
                            <button
                              type="button"
                              onClick={() => onAceptarGerencia && onAceptarGerencia(mod)}
                              disabled={actionLoading}
                              title="Aceptar petición de transferencia"
                              className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition-colors"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => onRechazarIndividual(mod)}
                              disabled={actionLoading}
                              title="Rechazar petición"
                              className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </>
                        )}

                        {/* Acciones de Presupuestos cuando está En Espera */}
                        {canAprobar && isPendingPresupuestos && (
                          <>
                            <button
                              type="button"
                              onClick={() => onAprobarIndividual(mod)}
                              disabled={actionLoading}
                              title="Aprobar individualmente"
                              className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => onRechazarIndividual(mod)}
                              disabled={actionLoading}
                              title="Rechazar con motivo"
                              className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-theme-border bg-theme-surface">
          <p className="text-xs text-theme-muted">
            Mostrando {(currentPage - 1) * pageSize + 1}–
            {Math.min(currentPage * pageSize, totalFilteredCount)} de {totalFilteredCount} operaciones
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-theme-border text-theme-muted hover:text-theme-main disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Anterior
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...');
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                p === '...' ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-xs text-theme-muted">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => onPageChange(p as number)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      currentPage === p
                        ? 'border-theme-primary bg-theme-primary text-white'
                        : 'border-theme-border text-theme-muted hover:text-theme-main'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-theme-border text-theme-muted hover:text-theme-main disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
