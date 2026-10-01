import React, { useMemo } from 'react';
import { History, Calendar, Sparkles, Building2, Copy } from 'lucide-react';
import { Dropdown, type DropdownItem } from '../../../components/commons';
import type { Operacion } from '../types/planificacion.types';
import type { Gestion } from '../../../services/presupuestoService';
import type { Area } from '../../../types/organizacional';

interface ComparativaViewProps {
  gestiones: Gestion[];
  areas: Area[];
  compGestionBase: number;
  compGestionDestino: number;
  compAreaId: string;
  compOperacionesBase: Operacion[];
  compOperacionesDestino: Operacion[];
  replicating: boolean;
  canReplicate: boolean;
  onGestionBaseChange: (val: number) => void;
  onGestionDestinoChange: (val: number) => void;
  onAreaChange: (val: string) => void;
  onReplicar: () => void;
}

export const ComparativaView: React.FC<ComparativaViewProps> = ({
  gestiones,
  areas,
  compGestionBase,
  compGestionDestino,
  compAreaId,
  compOperacionesBase,
  compOperacionesDestino,
  replicating,
  canReplicate,
  onGestionBaseChange,
  onGestionDestinoChange,
  onAreaChange,
  onReplicar,
}) => {
  // Dropdown Items
  const gestionBaseItems = useMemo((): DropdownItem[] => {
    return gestiones.map((g) => ({
      id: g.anio,
      label: `Gestión ${g.anio}`,
      badge: g.estado_display || undefined,
    }));
  }, [gestiones]);

  const gestionDestinoItems = useMemo((): DropdownItem[] => {
    const list: DropdownItem[] = gestiones.map((g) => ({
      id: g.anio,
      label: `Gestión ${g.anio}`,
      badge: g.estado_display || undefined,
    }));
    if (!gestiones.some((g) => g.anio === 2027)) {
      list.push({
        id: 2027,
        label: 'Gestión 2027',
        badge: 'Próxima Formulación',
      });
    }
    return list;
  }, [gestiones]);

  const areaItems = useMemo((): DropdownItem[] => {
    return [
      { id: 'ALL', label: 'Todas las Áreas' },
      ...areas.map((a) => ({
        id: String(a.id),
        label: a.nombre,
        badge: a.codigo,
      })),
    ];
  }, [areas]);

  return (
    <div className="space-y-5">
      {/* Panel de Configuración de Comparación */}
      <div className="p-5 rounded-2xl border border-theme-border bg-theme-surface shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-theme-border/60 pb-3">
          <div className="flex items-center gap-2">
            <History className="text-theme-main" size={18} />
            <h3 className="font-bold text-sm text-theme-main">Matriz de Comparación Interanual POA</h3>
          </div>
          <span className="text-xs text-theme-muted">
            Analice la evolución de las operaciones entre gestiones consecutivas
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-theme-muted mb-1.5 flex items-center gap-1">
              <Calendar size={13} className="text-theme-muted" />
              1. Gestión Base (Histórica / Anterior)
            </label>
            <Dropdown
              items={gestionBaseItems}
              value={compGestionBase}
              onChange={(val) => onGestionBaseChange(Number(val))}
              placeholder="Seleccionar Gestión Base..."
              size="sm"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-theme-muted mb-1.5 flex items-center gap-1">
              <Sparkles size={13} className="text-theme-muted" />
              2. Gestión Destino (Nueva Formulación)
            </label>
            <Dropdown
              items={gestionDestinoItems}
              value={compGestionDestino}
              onChange={(val) => onGestionDestinoChange(Number(val))}
              placeholder="Seleccionar Gestión Destino..."
              size="sm"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-theme-muted mb-1.5 flex items-center gap-1">
              <Building2 size={13} className="text-theme-muted" />
              3. Filtrar por Área Responsable
            </label>
            <Dropdown
              items={areaItems}
              value={compAreaId}
              onChange={(val) => onAreaChange(String(val))}
              placeholder="Todas las Áreas"
              searchable
              searchPlaceholder="Buscar área..."
              size="sm"
            />
          </div>
        </div>

        {canReplicate && (
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={onReplicar}
              disabled={replicating}
              className="px-4 py-2 rounded-xl bg-theme-primary text-theme-primaryText font-semibold text-xs shadow-sm hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Copy size={14} />
              {replicating ? 'Replicando operaciones...' : `Replicar Base de ${compGestionBase} a ${compGestionDestino}`}
            </button>
          </div>
        )}
      </div>

      {/* Columnas Comparativas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Columna Base */}
        <div className="space-y-3">
          <div className="p-3.5 rounded-xl border border-theme-border bg-theme-surface flex items-center justify-between shadow-sm">
            <span className="font-bold text-xs text-theme-main uppercase tracking-wider flex items-center gap-1.5">
              <Calendar size={14} className="text-theme-muted" />
              Gestión Base {compGestionBase} ({compOperacionesBase.length})
            </span>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-theme-base border border-theme-border text-theme-muted">
              Base Histórica
            </span>
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {compOperacionesBase.length === 0 ? (
              <div className="p-10 rounded-xl border border-dashed border-theme-border bg-theme-surface text-center text-theme-muted space-y-1">
                <p className="text-xs font-semibold text-theme-main">Sin operaciones en {compGestionBase}</p>
                <p className="text-[11px]">No se encontraron operaciones registradas para los filtros seleccionados.</p>
              </div>
            ) : (
              compOperacionesBase.map((op) => (
                <div key={op.id} className="p-3.5 rounded-xl border border-theme-border bg-theme-surface space-y-1.5 text-xs shadow-sm hover:border-brand-300 dark:hover:border-brand-500/50 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs bg-blue-50 text-blue-700 border border-blue-200/90 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60 px-2 py-0.5 rounded">
                      {op.codigo}
                    </span>
                    <span className="text-[10px] text-theme-muted font-medium truncate max-w-[200px]" title={op.area_nombre}>
                      {op.area_nombre}
                    </span>
                  </div>
                  <p className="text-theme-main font-medium text-xs line-clamp-1" title={op.descripcion}>
                    {op.descripcion}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Columna Destino */}
        <div className="space-y-3">
          <div className="p-3.5 rounded-xl border border-theme-border bg-theme-surface flex items-center justify-between shadow-sm">
            <span className="font-bold text-xs text-theme-main uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} className="text-emerald-500" />
              Gestión Destino {compGestionDestino} ({compOperacionesDestino.length})
            </span>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Nueva Planificación
            </span>
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {compOperacionesDestino.length === 0 ? (
              <div className="p-10 rounded-xl border border-dashed border-theme-border bg-theme-surface text-center text-theme-muted space-y-2">
                <p className="text-xs font-semibold text-theme-main">Aún no hay operaciones formuladas en {compGestionDestino}</p>
                <p className="text-[11px]">
                  Utilice el botón "Replicar Base" para inicializar la formulación interanual automáticamente.
                </p>
              </div>
            ) : (
              compOperacionesDestino.map((op) => (
                <div key={op.id} className="p-3.5 rounded-xl border border-theme-border bg-theme-surface space-y-1.5 text-xs shadow-sm hover:border-brand-300 dark:hover:border-brand-500/50 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs bg-blue-50 text-blue-700 border border-blue-200/90 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60 px-2 py-0.5 rounded">
                      {op.codigo}
                    </span>
                    <span className="text-[10px] text-theme-muted font-medium truncate max-w-[200px]" title={op.area_nombre}>
                      {op.area_nombre}
                    </span>
                  </div>
                  <p className="text-theme-main font-medium text-xs line-clamp-1" title={op.descripcion}>
                    {op.descripcion}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
