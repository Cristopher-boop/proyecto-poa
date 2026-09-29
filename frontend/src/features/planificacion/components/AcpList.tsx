import React from 'react';
import { Target, Compass, Eye, Edit3, Power } from 'lucide-react';
import type { AccionCortoPlazo } from '../types/planificacion.types';

interface AcpListProps {
  acps: AccionCortoPlazo[];
  canManage: boolean;
  onView: (acp: AccionCortoPlazo) => void;
  onEdit: (acp: AccionCortoPlazo) => void;
  onToggle: (acp: AccionCortoPlazo) => void;
}

export const AcpList: React.FC<AcpListProps> = ({
  acps,
  canManage,
  onView,
  onEdit,
  onToggle,
}) => {
  if (acps.length === 0) {
    return (
      <div className="p-12 rounded-2xl border border-dashed border-theme-border bg-theme-surface text-center text-theme-muted space-y-3">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-700/60 flex items-center justify-center">
          <Target size={24} />
        </div>
        <div>
          <p className="text-sm font-semibold text-theme-main">No hay acciones a corto plazo registradas</p>
          <p className="text-xs text-theme-muted mt-0.5">
            Seleccione "Nueva ACP" para crear una meta institucional anual articulada al PEI.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-theme-muted px-1">
        <span>
          Total <strong className="text-theme-main">{acps.length}</strong> acciones a corto plazo (Metas POA)
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {acps.map((acp) => {
          const isActiva = Boolean(acp.estado);

          return (
            <div
              key={acp.id}
              className={`p-4 rounded-2xl border border-theme-border bg-theme-surface hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow-md transition-all flex flex-col justify-between gap-3 shadow-sm ${
                !isActiva ? 'opacity-65 bg-theme-base/40' : ''
              }`}
            >
              {/* Encabezado: Código, Programa, Gestión, Estado y Acciones */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold text-xs bg-indigo-50 text-indigo-700 border border-indigo-200/90 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60 px-2.5 py-1 rounded-lg">
                    {acp.codigo}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-900 border border-amber-200/90 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-800/50 font-mono">
                    {acp.programa_codigo || 'P-01'}
                  </span>
                  {acp.gestion_anio && (
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 dark:bg-theme-base dark:text-theme-muted dark:border-theme-border">
                      Gestión {acp.gestion_anio}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border select-none ${
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

                  {/* Botón Ojito (Detalle) */}
                  <button
                    type="button"
                    onClick={() => onView(acp)}
                    className="p-1.5 rounded-lg border border-theme-border bg-theme-base hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-300 dark:hover:border-indigo-800/60 text-theme-muted transition-colors"
                    title="Ver detalle de la ACP"
                    aria-label={`Ver detalle de ${acp.codigo}`}
                  >
                    <Eye size={14} />
                  </button>

                  {/* Acciones para administradores */}
                  {canManage && (
                    <>
                      <button
                        type="button"
                        onClick={() => onEdit(acp)}
                        className="p-1.5 rounded-lg border border-theme-border bg-theme-base hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 dark:hover:bg-amber-950/50 dark:hover:text-amber-300 dark:hover:border-amber-800/60 text-theme-muted transition-colors"
                        title="Editar ACP"
                        aria-label={`Editar ${acp.codigo}`}
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggle(acp)}
                        className={`p-1.5 rounded-lg border border-theme-border bg-theme-base transition-colors ${
                          isActiva
                            ? 'text-theme-muted hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 dark:hover:bg-rose-950/50 dark:hover:text-rose-300 dark:hover:border-rose-800/60'
                            : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-300 dark:hover:border-emerald-800/60'
                        }`}
                        title={isActiva ? 'Desactivar ACP' : 'Reactivar ACP'}
                        aria-label={`Cambiar estado de ${acp.codigo}`}
                      >
                        <Power size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Descripción de la ACP */}
              <div>
                <p className="text-xs font-medium text-theme-main leading-relaxed" title={acp.descripcion}>
                  {acp.descripcion || (
                    <span className="italic text-theme-muted">Sin descripción detallada del objetivo anual.</span>
                  )}
                </p>
              </div>

              {/* Pie con referencia a AMP Quinquenal */}
              <div className="pt-2 border-t border-theme-border/70 flex items-center justify-between text-xs text-theme-muted">
                <div className="flex items-center gap-1.5 truncate">
                  <Compass size={13} className="text-theme-muted shrink-0" />
                  <span className="truncate">
                    PEI Quinquenal: <strong className="font-mono font-bold text-xs bg-violet-50 text-violet-700 border border-violet-200/90 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800/60 px-1.5 py-0.5 rounded">{acp.amp_codigo}</strong>
                  </span>
                </div>

                <span className="text-[11px] text-theme-muted truncate max-w-[240px]">
                  {acp.amp_descripcion || ''}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
