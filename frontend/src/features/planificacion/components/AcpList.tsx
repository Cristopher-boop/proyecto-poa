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
      <div className="p-12 rounded-2xl border border-dashed border-theme-border bg-theme-surface text-center text-theme-muted space-y-2">
        <Target size={36} className="mx-auto opacity-40 text-theme-primary" />
        <p className="text-sm font-semibold text-theme-main">No hay acciones a corto plazo registradas</p>
        <p className="text-xs">
          Seleccione "Nueva ACP" para crear una meta institucional anual articulada al PEI.
        </p>
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
              className={`p-4 rounded-2xl border border-theme-border bg-theme-surface hover:border-theme-primary/40 transition-all flex flex-col justify-between gap-3 shadow-sm ${
                !isActiva ? 'opacity-65 bg-theme-base/40' : ''
              }`}
            >
              {/* Encabezado: Código, Programa, Gestión, Estado y Acciones */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold text-xs text-theme-primary bg-theme-base px-2.5 py-1 rounded-lg border border-theme-border">
                    {acp.codigo}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-theme-base border border-theme-border text-theme-muted font-mono">
                    {acp.programa_codigo || 'P-01'}
                  </span>
                  {acp.gestion_anio && (
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-theme-base border border-theme-border text-theme-muted">
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
                    className="p-1.5 rounded-lg border border-theme-border bg-theme-base hover:bg-theme-border/60 text-theme-muted hover:text-theme-primary transition-colors"
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
                        className="p-1.5 rounded-lg border border-theme-border bg-theme-base hover:bg-theme-border/60 text-theme-muted hover:text-theme-primary transition-colors"
                        title="Editar ACP"
                        aria-label={`Editar ${acp.codigo}`}
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggle(acp)}
                        className={`p-1.5 rounded-lg border border-theme-border bg-theme-base hover:bg-theme-border/60 transition-colors ${
                          isActiva ? 'text-theme-muted hover:text-rose-600' : 'text-emerald-600'
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
                    PEI Quinquenal: <strong className="text-theme-main font-mono">{acp.amp_codigo}</strong>
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
