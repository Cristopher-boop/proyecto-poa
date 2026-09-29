import React, { useMemo } from 'react';
import { Search, X, FolderTree, Building2, CheckCircle2, RotateCcw } from 'lucide-react';
import { Dropdown, type DropdownItem } from '../../../components/commons';
import type { Programa } from '../../../types/organizacional';
import { formatProgramaShort } from '../utils/organizacionalUtils';

interface OrganizacionalFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedPrograma: string;
  onProgramaChange: (value: string) => void;
  selectedTipo: string;
  onTipoChange: (value: string) => void;
  selectedEstado: string;
  onEstadoChange: (value: string) => void;
  programas: Programa[];
  onResetFilters: () => void;
}

export const OrganizacionalFilter: React.FC<OrganizacionalFilterProps> = ({
  searchTerm,
  onSearchChange,
  selectedPrograma,
  onProgramaChange,
  selectedTipo,
  onTipoChange,
  selectedEstado,
  onEstadoChange,
  programas,
  onResetFilters,
}) => {
  const hasActiveFilters =
    Boolean(searchTerm) ||
    selectedPrograma !== 'ALL' ||
    selectedTipo !== 'ALL' ||
    selectedEstado !== 'ALL';

  // Program items: ONLY "Programa X", NO VERBOSE BREAKDOWN!
  const programaItems = useMemo((): DropdownItem[] => [
    { id: 'ALL', label: 'Todos los Programas' },
    ...programas.map((p) => ({
      id: String(p.id),
      label: formatProgramaShort(p),
      badge: p.codigo,
    })),
  ], [programas]);

  const tipoItems: DropdownItem[] = [
    { id: 'ALL', label: 'Todos los Tipos' },
    { id: 'GERENCIA', label: 'Gerencias de Área', badge: 'GER' },
    { id: 'UNIDAD', label: 'Unidades Operativas', badge: 'UNI' },
  ];

  const estadoItems: DropdownItem[] = [
    { id: 'ALL', label: 'Todos los Estados' },
    { id: 'ACTIVAS', label: 'Solo Activos', badge: 'ACT' },
    { id: 'INACTIVAS', label: 'Solo Inactivos', badge: 'INA' },
  ];

  return (
    <div className="p-3.5 sm:p-4 rounded-2xl border border-theme-border bg-theme-surface shadow-sm space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
        {/* Buscador de Texto */}
        <div className="lg:col-span-4 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-theme-muted" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por código, nombre o descripción..."
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

        {/* Dropdown Programa (Clean name: "Programa 1", etc.) */}
        <div className="lg:col-span-3">
          <Dropdown
            items={programaItems}
            value={selectedPrograma}
            onChange={(val) => onProgramaChange(String(val))}
            placeholder="Todos los Programas"
            searchable
            searchPlaceholder="Buscar programa..."
            icon={<FolderTree className="h-3.5 w-3.5 text-theme-muted" />}
            size="sm"
          />
        </div>

        {/* Dropdown Tipo (Gerencia / Unidad) */}
        <div className="lg:col-span-3">
          <Dropdown
            items={tipoItems}
            value={selectedTipo}
            onChange={(val) => onTipoChange(String(val))}
            placeholder="Todos los Tipos"
            icon={<Building2 className="h-3.5 w-3.5 text-theme-muted" />}
            size="sm"
          />
        </div>

        {/* Dropdown Estado */}
        <div className="lg:col-span-2">
          <Dropdown
            items={estadoItems}
            value={selectedEstado}
            onChange={(val) => onEstadoChange(String(val))}
            placeholder="Todos los Estados"
            icon={<CheckCircle2 className="h-3.5 w-3.5 text-theme-muted" />}
            size="sm"
          />
        </div>
      </div>

      {/* Botón de Restablecer Filtros si hay alguno activo */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between pt-1 border-t border-theme-border/60 text-xs">
          <span className="text-[11px] text-theme-muted">
            Filtros activos aplicados a la estructura
          </span>
          <button
            type="button"
            onClick={onResetFilters}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-theme-muted hover:text-theme-main transition-colors hover:underline cursor-pointer"
          >
            <RotateCcw size={12} /> Restablecer filtros
          </button>
        </div>
      )}
    </div>
  );
};
