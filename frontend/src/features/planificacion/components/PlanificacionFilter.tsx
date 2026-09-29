import React, { useMemo } from 'react';
import { Search, X, Calendar, Layers, Building2, RotateCcw } from 'lucide-react';
import { Dropdown, type DropdownItem } from '../../../components/commons';
import type { Gestion } from '../../../services/presupuestoService';
import type { Programa, Area } from '../../../types/organizacional';

interface PlanificacionFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterGestion: string;
  onGestionChange: (value: string) => void;
  filterPrograma: string;
  onProgramaChange: (value: string) => void;
  filterArea: string;
  onAreaChange: (value: string) => void;
  gestiones: Gestion[];
  programas: Programa[];
  areas: Area[];
  isAprobadorOrPlanificador: boolean;
  onResetFilters: () => void;
}

export const PlanificacionFilter: React.FC<PlanificacionFilterProps> = ({
  searchTerm,
  onSearchChange,
  filterGestion,
  onGestionChange,
  filterPrograma,
  onProgramaChange,
  filterArea,
  onAreaChange,
  gestiones,
  programas,
  areas,
  isAprobadorOrPlanificador,
  onResetFilters,
}) => {
  const currentYearStr = String(new Date().getFullYear());
  const hasActiveFilters =
    Boolean(searchTerm) ||
    filterGestion !== currentYearStr ||
    filterPrograma !== 'ALL' ||
    (isAprobadorOrPlanificador && filterArea !== 'ALL');

  // Gestiones items for Dropdown
  const gestionItems = useMemo((): DropdownItem[] => [
    { id: 'ALL', label: 'Todas las Gestiones' },
    ...gestiones.map((g) => ({
      id: String(g.anio),
      label: `Gestión ${g.anio}`,
      badge: g.estado_display || undefined,
    })),
  ], [gestiones]);

  // Programas items for Dropdown
  const programaItems = useMemo((): DropdownItem[] => [
    { id: 'ALL', label: 'Todos los Programas' },
    ...programas.map((p) => ({
      id: String(p.id),
      label: p.nombre,
      badge: p.codigo,
    })),
  ], [programas]);

  // Áreas items for Dropdown
  const areaItems = useMemo((): DropdownItem[] => [
    { id: 'ALL', label: 'Todas las Áreas' },
    ...areas.map((a) => ({
      id: String(a.id),
      label: a.nombre,
      badge: a.codigo,
    })),
  ], [areas]);

  return (
    <div className="p-3.5 sm:p-4 rounded-2xl border border-theme-border bg-theme-surface shadow-sm space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
        {/* Buscador de Texto estilo MCs */}
        <div className={`relative ${isAprobadorOrPlanificador ? 'lg:col-span-4' : 'lg:col-span-5'}`}>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-theme-muted" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por código, descripción o área..."
            className="block w-full pl-9 pr-8 py-2 bg-theme-base border border-theme-border rounded-xl text-theme-main text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-500 focus:border-slate-400 dark:focus:border-slate-500 transition-all placeholder:text-theme-muted"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-main p-0.5 rounded transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Dropdown Institucional Gestión */}
        <div className="lg:col-span-2">
          <Dropdown
            items={gestionItems}
            value={filterGestion}
            onChange={(val) => onGestionChange(String(val))}
            placeholder="Todas las Gestiones"
            icon={<Calendar className="h-3.5 w-3.5 text-theme-muted" />}
            size="sm"
          />
        </div>

        {/* Dropdown Institucional Programa */}
        <div className={`relative ${isAprobadorOrPlanificador ? 'lg:col-span-3' : 'lg:col-span-5'}`}>
          <Dropdown
            items={programaItems}
            value={filterPrograma}
            onChange={(val) => onProgramaChange(String(val))}
            placeholder="Todos los Programas"
            searchable
            searchPlaceholder="Buscar programa..."
            icon={<Layers className="h-3.5 w-3.5 text-theme-muted" />}
            size="sm"
          />
        </div>

        {/* Dropdown Institucional Área (Solo Aprobador / Planificador) */}
        {isAprobadorOrPlanificador && (
          <div className="lg:col-span-3">
            <Dropdown
              items={areaItems}
              value={filterArea}
              onChange={(val) => onAreaChange(String(val))}
              placeholder="Todas las Áreas"
              searchable
              searchPlaceholder="Buscar área..."
              icon={<Building2 className="h-3.5 w-3.5 text-theme-muted" />}
              size="sm"
            />
          </div>
        )}
      </div>

      {/* Botón de Restablecer Filtros si hay alguno activo */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between pt-1 border-t border-theme-border/60 text-xs">
          <span className="text-[11px] text-theme-muted">
            Filtros activos aplicados al catálogo estratégico
          </span>
          <button
            type="button"
            onClick={onResetFilters}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-theme-muted hover:text-theme-main transition-colors hover:underline"
          >
            <RotateCcw size={12} /> Restablecer filtros
          </button>
        </div>
      )}
    </div>
  );
};
