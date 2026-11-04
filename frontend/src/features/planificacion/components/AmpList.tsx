import React from 'react';
import { Compass, Eye, Edit3, Power } from 'lucide-react';
import type { AccionMedianoPlazo } from '../types/planificacion.types';

interface AmpListProps {
  amps: AccionMedianoPlazo[];
  canManage: boolean;
  onView: (amp: AccionMedianoPlazo) => void;
  onEdit: (amp: AccionMedianoPlazo) => void;
  onToggle: (amp: AccionMedianoPlazo) => void;
}

export const AmpList: React.FC<AmpListProps> = ({
  amps,
  canManage,
  onView,
  onEdit,
  onToggle,
}) => {
  if (amps.length === 0) {
    return (
      <div className="p-12 rounded-2xl border border-dashed border-theme-border bg-theme-surface text-center text-theme-muted space-y-3">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-theme-primary/10 text-theme-primary border border-theme-primary/25 flex items-center justify-center">
          <Compass size={24} />
        </div>
        <div>
          <p className="text-sm font-semibold text-theme-main">No hay acciones a mediano plazo registradas</p>
          <p className="text-xs text-theme-muted mt-0.5">
            Seleccione "Nueva AMP" para registrar un objetivo quinquenal del Plan Estratégico Institucional (PEI).
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-theme-muted px-1">
        <span>
          Total <strong className="text-theme-main">{amps.length}</strong> acciones a mediano plazo (Quinquenales PEI)
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {amps.map((amp, index) => {
          const isActiva = Boolean(amp.estado);
          const cleanAmpCode = amp.codigo.replace(/-\d+$/, '');
          const progNumber = amp.programa_codigo?.replace(/^P-?/i, '') || '1';

          return (
            <div
              key={amp.id}
              className={`p-4 rounded-2xl border border-theme-border bg-theme-surface hover:border-theme-primary/50 hover:shadow-md transition-all flex flex-col justify-between gap-3 shadow-sm ${
                !isActiva ? 'opacity-65 bg-theme-base/40' : ''
              }`}
            >
              {/* Encabezado: Código, Quinquenio en la primera, Estado y Acciones */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-mono font-bold text-xs text-theme-primary">
                    {cleanAmpCode}
                  </span>
                  {index === 0 && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 dark:bg-theme-base dark:text-theme-muted dark:border-theme-border">
                      Período {amp.periodo_inicio} — {amp.periodo_fin}
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
                    onClick={() => onView(amp)}
                    className="p-1.5 rounded-lg border border-theme-border bg-theme-base hover:bg-theme-primary/10 hover:text-theme-primary hover:border-theme-primary/30 text-theme-muted transition-colors cursor-pointer"
                    title="Ver detalle de la AMP"
                    aria-label={`Ver detalle de ${cleanAmpCode}`}
                  >
                    <Eye size={14} />
                  </button>

                  {/* Acciones para administradores y planificación */}
                  {canManage && (
                    <>
                      <button
                        type="button"
                        onClick={() => onEdit(amp)}
                        className="p-1.5 rounded-lg border border-theme-border bg-theme-base hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 dark:hover:bg-amber-950/50 dark:hover:text-amber-300 dark:hover:border-amber-800/60 text-theme-muted transition-colors cursor-pointer"
                        title="Editar AMP"
                        aria-label={`Editar ${cleanAmpCode}`}
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggle(amp)}
                        className={`p-1.5 rounded-lg border border-theme-border bg-theme-base transition-colors cursor-pointer ${
                          isActiva
                            ? 'text-theme-muted hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 dark:hover:bg-rose-950/50 dark:hover:text-rose-300 dark:hover:border-rose-800/60'
                            : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-300 dark:hover:border-emerald-800/60'
                        }`}
                        title={isActiva ? 'Desactivar AMP' : 'Reactivar AMP'}
                        aria-label={`Cambiar estado de ${cleanAmpCode}`}
                      >
                        <Power size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Descripción de la AMP */}
              <div>
                <p className="text-xs font-medium text-theme-main leading-relaxed" title={amp.descripcion}>
                  {amp.descripcion || (
                    <span className="italic text-theme-muted">Sin descripción detallada del objetivo quinquenal.</span>
                  )}
                </p>
              </div>

              {/* Pie con Programa limpio */}
              <div className="pt-2 border-t border-theme-border/70 flex items-center justify-between text-xs text-theme-muted">
                <span className="truncate font-semibold text-theme-main">
                  Programa {progNumber}
                </span>
                <span className="text-[10px] font-mono text-theme-muted">
                  Vigencia Quinquenal PEI
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
