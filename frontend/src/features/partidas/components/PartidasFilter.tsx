import React, { useMemo } from 'react';
import { Search, X, Filter, CheckCircle2, RotateCcw, RefreshCw } from 'lucide-react';
import { Dropdown, type DropdownItem } from '../../../components/commons';
import type { PartidaStats } from '../types/partidas.types';

interface PartidasFilterProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedGrupo: string;
  onGrupoChange: (grupo: string) => void;
  gruposOpciones: Array<{ id: string; label: string; count: number }>;
  selectedEstado: string;
  onEstadoChange: (estado: string) => void;
  stats: PartidaStats;
  totalFiltrados: number;
  loading: boolean;
  onRefresh: () => void;
}

export const PartidasFilter: React.FC<PartidasFilterProps> = ({
  searchTerm,
  onSearchChange,
  selectedGrupo,
  onGrupoChange,
  gruposOpciones,
  selectedEstado,
  onEstadoChange,
  stats,
  totalFiltrados,
  loading,
  onRefresh,
}) => {
  const grupoItems = useMemo((): DropdownItem[] => [
    { id: 'todos', label: 'Todos los Capítulos / Rubros' },
    ...gruposOpciones.map((g) => ({
      id: g.id,
      label: g.label,
      badge: `${g.count}`,
    })),
  ], [gruposOpciones]);

  const estadoItems: DropdownItem[] = useMemo(() => [
    { id: 'todas', label: 'Todos los Estados', badge: `${stats.total}` },
    { id: 'activas', label: 'Solo Activas', badge: `${stats.activas}` },
    { id: 'inactivas', label: 'Solo Inactivas', badge: `${stats.inactivas}` },
  ], [stats]);

  const hasActiveFilters = Boolean(
    searchTerm.trim() ||
    (selectedGrupo && selectedGrupo !== 'todos' && selectedGrupo !== 'todas') ||
    (selectedEstado && selectedEstado !== 'todas')
  );

  const handleReset = () => {
    onSearchChange('');
    onGrupoChange('todos');
    onEstadoChange('todas');
  };

  return (
    <div className="p-3.5 sm:p-4 rounded-2xl border border-theme-border bg-theme-surface shadow-sm space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
        {/* Buscador de partidas */}
        <div className="lg:col-span-5 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-theme-muted" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por código, denominación o descripción..."
            className="block w-full pl-9 pr-8 py-2 bg-theme-base border border-theme-border rounded-xl text-theme-main text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-500 focus:border-slate-400 dark:focus:border-slate-500 transition-all placeholder:text-theme-muted"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-main p-0.5 rounded transition-colors cursor-pointer"
              title="Limpiar búsqueda"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Selector de Capítulo / Rubro */}
        <div className="lg:col-span-4">
          <Dropdown
            items={grupoItems}
            value={selectedGrupo || 'todos'}
            onChange={(val) => onGrupoChange(String(val || 'todos'))}
            placeholder="Todos los Capítulos / Rubros"
            searchable
            searchPlaceholder="Buscar rubro o capítulo..."
            icon={<Filter className="h-3.5 w-3.5 text-theme-muted" />}
            size="sm"
          />
        </div>

        {/* Filtro de Estado (Todas, Activas, Inactivas) arriba de la tabla */}
        <div className="lg:col-span-2">
          <Dropdown
            items={estadoItems}
            value={selectedEstado || 'todas'}
            onChange={(val) => onEstadoChange(String(val || 'todas'))}
            placeholder="Todos los Estados"
            icon={<CheckCircle2 className="h-3.5 w-3.5 text-theme-muted" />}
            size="sm"
          />
        </div>

        {/* Acciones Rápidas: Reset y Refrescar */}
        <div className="lg:col-span-1 flex items-center justify-end gap-1.5">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleReset}
              className="p-2 rounded-xl border border-theme-border hover:bg-theme-base text-theme-muted hover:text-theme-main transition-colors text-xs flex items-center gap-1 cursor-pointer"
              title="Restablecer filtros"
            >
              <RotateCcw size={14} />
            </button>
          )}

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="p-2 rounded-xl border border-theme-border hover:bg-theme-base text-theme-muted hover:text-theme-main transition-colors cursor-pointer disabled:opacity-50"
            title="Recargar catálogo de partidas"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Indicador de resultados filtrados */}
      <div className="flex items-center justify-between text-[11px] text-theme-muted pt-1 border-t border-theme-border/50">
        <span>
          Partidas en catálogo: <strong className="text-theme-main font-semibold">{totalFiltrados}</strong>
        </span>
        {hasActiveFilters && (
          <span className="text-amber-600 dark:text-amber-400 font-medium">
            Filtros aplicados
          </span>
        )}
      </div>
    </div>
  );
};
