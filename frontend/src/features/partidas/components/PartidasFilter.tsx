import React from 'react';
import { Layers, CheckCircle2, XCircle, Plus, RefreshCw, X } from 'lucide-react';
import { TabsFilter, Button } from '../../../components/commons';
import type { TabItem, SelectOption } from '../../../components/commons/TabsFilter';
import type { PartidaStats } from '../types/partidas.types';

interface PartidasFilterProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedGrupo: string;
  onGrupoChange: (grupo: string) => void;
  gruposOpciones: Array<{ id: string; label: string; count: number }>;
  stats: PartidaStats;
  totalFiltrados: number;
  loading: boolean;
  onRefresh: () => void;
  onCreateNew: () => void;
}

export const PartidasFilter: React.FC<PartidasFilterProps> = ({
  activeTab,
  onTabChange,
  searchTerm,
  onSearchChange,
  selectedGrupo,
  onGrupoChange,
  gruposOpciones,
  stats,
  totalFiltrados,
  loading,
  onRefresh,
  onCreateNew,
}) => {
  const tabs: TabItem[] = [
    {
      id: 'todas',
      label: 'Todas',
      count: stats.total,
      icon: <Layers size={14} />,
      activeColorClass: 'border-theme-primary text-theme-main font-bold',
      activeBadgeClass: 'bg-theme-primary/15 text-theme-primary',
    },
    {
      id: 'activas',
      label: 'Activas',
      count: stats.activas,
      icon: <CheckCircle2 size={14} className="text-emerald-500" />,
      activeColorClass: 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold',
      activeBadgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    },
    {
      id: 'inactivas',
      label: 'Inactivas',
      count: stats.inactivas,
      icon: <XCircle size={14} className="text-rose-500" />,
      activeColorClass: 'border-rose-500 text-rose-600 dark:text-rose-400 font-bold',
      activeBadgeClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
    },
  ];

  const selectOptions: SelectOption[] = gruposOpciones.map((g) => ({
    value: g.id,
    label: `${g.label} (${g.count})`,
  }));

  const hasActiveFilters = Boolean(searchTerm.trim() || selectedGrupo !== 'todos' || activeTab !== 'todas');

  return (
    <div className="space-y-2">
      <TabsFilter
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={onTabChange}
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        searchPlaceholder="Buscar por código, concepto o descripción..."
        selectOptions={selectOptions}
        selectedValue={selectedGrupo}
        onSelectChange={onGrupoChange}
        selectPlaceholder="Todos los Capítulos / Rubros"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              className="p-2 border border-theme-border rounded-xl bg-theme-surface text-theme-muted hover:text-theme-main hover:bg-theme-border/20 transition-colors"
              title="Refrescar catálogo"
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin text-theme-primary' : ''} />
            </button>
            <Button
              type="button"
              variant="primary"
              size="md"
              icon={<Plus size={16} />}
              onClick={onCreateNew}
            >
              Nueva Partida
            </Button>
          </div>
        }
      />

      {/* Indicador de filtros aplicados */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between text-xs text-theme-muted px-1 pb-1">
          <span>
            Mostrando <strong className="text-theme-main">{totalFiltrados}</strong> de{' '}
            <strong className="text-theme-main">{stats.total}</strong> partidas presupuestarias
          </span>
          <button
            type="button"
            onClick={() => {
              onSearchChange('');
              onGrupoChange('todos');
              onTabChange('todas');
            }}
            className="inline-flex items-center gap-1 text-theme-primary hover:underline font-semibold cursor-pointer"
          >
            <X size={12} />
            Limpiar todos los filtros
          </button>
        </div>
      )}
    </div>
  );
};
