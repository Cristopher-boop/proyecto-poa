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
      <div className="p-12 rounded-2xl border border-dashed border-theme-border bg-theme-surface text-center text-theme-muted space-y-2">
        <Compass size={36} className="mx-auto opacity-40 text-theme-primary" />
        <p className="text-sm font-semibold text-theme-main">No hay acciones a mediano plazo registradas</p>
        <p className="text-xs">
          Seleccione "Nueva AMP" para registrar un objetivo quinquenal del Plan Estratégico Institucional (PEI).
        </p>
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
        {amps.map((amp) => {
          const isActiva = Boolean(amp.estado);

          return (
            <div
              key={amp.id}
              className={`p-4 rounded-2xl border border-theme-border bg-theme-surface hover:border-theme-primary/40 transition-all flex flex-col justify-between gap-3 shadow-sm ${
                !isActiva ? 'opacity-65 bg-theme-base/40' : ''
              }`}
            >
              {/* Encabezado: Código, Programa, Quinquenio, Estado y Acciones */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold text-xs text-theme-primary bg-theme-base px-2.5 py-1 rounded-lg border border-theme-border">
                    {amp.codigo}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-theme-base border border-theme-border text-theme-muted font-mono">
                    {amp.programa_codigo || 'P-01'}
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-theme-base border border-theme-border text-theme-muted">
                    Período {amp.periodo_inicio} — {amp.periodo_fin}
                  </span>
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
                    className="p-1.5 rounded-lg border border-theme-border bg-theme-base hover:bg-theme-border/60 text-theme-muted hover:text-theme-primary transition-colors"
                    title="Ver detalle de la AMP"
                    aria-label={`Ver detalle de ${amp.codigo}`}
                  >
                    <Eye size={14} />
                  </button>

                  {/* Acciones para administradores */}
                  {canManage && (
                    <>
                      <button
                        type="button"
                        onClick={() => onEdit(amp)}
                        className="p-1.5 rounded-lg border border-theme-border bg-theme-base hover:bg-theme-border/60 text-theme-muted hover:text-theme-primary transition-colors"
                        title="Editar AMP"
                        aria-label={`Editar ${amp.codigo}`}
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggle(amp)}
                        className={`p-1.5 rounded-lg border border-theme-border bg-theme-base hover:bg-theme-border/60 transition-colors ${
                          isActiva ? 'text-theme-muted hover:text-rose-600' : 'text-emerald-600'
                        }`}
                        title={isActiva ? 'Desactivar AMP' : 'Reactivar AMP'}
                        aria-label={`Cambiar estado de ${amp.codigo}`}
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

              {/* Pie con nombre del Programa */}
              <div className="pt-2 border-t border-theme-border/70 flex items-center justify-between text-xs text-theme-muted">
                <span className="truncate">
                  Programa: <strong className="text-theme-main">{amp.programa_nombre || 'General'}</strong>
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
