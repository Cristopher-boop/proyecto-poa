import React from 'react';
import { FileCheck2, Building2, Eye, Edit3, Power } from 'lucide-react';
import type { Operacion } from '../types/planificacion.types';

interface OperacionesListProps {
  operaciones: Operacion[];
  canEditOrToggle: boolean;
  onView: (op: Operacion) => void;
  onEdit: (op: Operacion) => void;
  onToggle: (op: Operacion) => void;
}

export const OperacionesList: React.FC<OperacionesListProps> = ({
  operaciones,
  canEditOrToggle,
  onView,
  onEdit,
  onToggle,
}) => {
  if (operaciones.length === 0) {
    return (
      <div className="p-12 rounded-2xl border border-dashed border-theme-border bg-theme-surface text-center text-theme-muted space-y-3">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-brand-50 text-brand-500 border border-brand-200 dark:bg-brand-900/30 dark:text-brand-300 dark:border-brand-700/60 flex items-center justify-center">
          <FileCheck2 size={24} />
        </div>
        <div>
          <p className="text-sm font-semibold text-theme-main">No se encontraron operaciones registradas</p>
          <p className="text-xs text-theme-muted mt-0.5">
            Ajuste los filtros de búsqueda o presione "Nueva Operación" para registrar una en el catálogo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-theme-muted px-1">
        <span>
          Mostrando <strong className="text-theme-main">{operaciones.length}</strong> operaciones registradas
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {operaciones.map((op) => {
          const isActiva = Boolean(op.estado);
          const progCode = op.area_programa_codigo || op.acp_programa_codigo || 'P-01';

          return (
            <div
              key={op.id}
              className={`p-4 rounded-2xl border border-theme-border bg-theme-surface hover:border-brand-300 dark:hover:border-brand-500/50 hover:shadow-md transition-all flex flex-col justify-between gap-3 shadow-sm ${
                !isActiva ? 'opacity-65 bg-theme-base/40' : ''
              }`}
            >
              {/* Encabezado: Código, Programa, Estado y Acciones */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold text-xs bg-blue-50 text-blue-700 border border-blue-200/90 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60 px-2.5 py-1 rounded-lg">
                    {op.codigo}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-900 border border-amber-200/90 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-800/50 font-mono">
                    {progCode}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border select-none ${
                      isActiva
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isActiva ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    />
                    {isActiva ? 'Activa' : 'Inactiva'}
                  </span>

                  {/* Botón Ojito (Solo lectura / Detalles) */}
                  <button
                    type="button"
                    onClick={() => onView(op)}
                    className="p-1.5 rounded-lg border border-theme-border bg-theme-base hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-300 dark:hover:border-indigo-800/60 text-theme-muted transition-colors"
                    title="Ver detalles de la operación"
                    aria-label={`Ver detalles de ${op.codigo}`}
                  >
                    <Eye size={14} />
                  </button>

                  {/* Acciones de gestión */}
                  {canEditOrToggle && (
                    <>
                      <button
                        type="button"
                        onClick={() => onEdit(op)}
                        className="p-1.5 rounded-lg border border-theme-border bg-theme-base hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 dark:hover:bg-amber-950/50 dark:hover:text-amber-300 dark:hover:border-amber-800/60 text-theme-muted transition-colors"
                        title="Editar operación"
                        aria-label={`Editar ${op.codigo}`}
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggle(op)}
                        className={`p-1.5 rounded-lg border border-theme-border bg-theme-base transition-colors ${
                          isActiva
                            ? 'text-theme-muted hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 dark:hover:bg-rose-950/50 dark:hover:text-rose-300 dark:hover:border-rose-800/60'
                            : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-300 dark:hover:border-emerald-800/60'
                        }`}
                        title={isActiva ? 'Desactivar operación' : 'Reactivar operación'}
                        aria-label={`Cambiar estado de ${op.codigo}`}
                      >
                        <Power size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Cuerpo: Descripción de la Operación */}
              <div className="py-0.5">
                <p className="text-xs font-medium text-theme-main leading-relaxed line-clamp-2" title={op.descripcion}>
                  {op.descripcion || (
                    <span className="italic text-theme-muted">Operación sin descripción técnica detallada.</span>
                  )}
                </p>
              </div>

              {/* Pie de Tarjeta: Área Única y ACP */}
              <div className="pt-2 border-t border-theme-border/70 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-theme-muted truncate min-w-0">
                  <Building2 size={13} className="text-theme-muted/70 shrink-0" />
                  <span className="truncate font-semibold text-theme-main/90" title={op.area_nombre}>
                    {op.area_nombre || `Área ${op.area_codigo || ''}`}
                  </span>
                </div>

                <div className="shrink-0 flex items-center gap-1">
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/90 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60">
                    {op.acp_codigo || 'ACP'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
