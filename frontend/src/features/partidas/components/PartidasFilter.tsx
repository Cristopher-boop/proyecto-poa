import React from 'react';
import { Layers, CheckCircle2, XCircle, Plus, RefreshCw, X, Search, Filter } from 'lucide-react';
import { Dropdown, Button } from '../../../components/commons';
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
  canManage?: boolean;
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
  canManage = false,
  onRefresh,
  onCreateNew,
}) => {
  const tabs = [
    {
      id: 'todas',
      label: 'Todas',
      count: stats.total,
      icon: <Layers size={14} />,
      activeClass: 'border-theme-primary text-theme-main font-bold',
      badgeClass: 'bg-theme-primary/15 text-theme-primary',
    },
    {
      id: 'activas',
      label: 'Activas',
      count: stats.activas,
      icon: <CheckCircle2 size={14} className="text-emerald-500" />,
      activeClass: 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold',
      badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    },
    {
      id: 'inactivas',
      label: 'Inactivas',
      count: stats.inactivas,
      icon: <XCircle size={14} className="text-rose-500" />,
      activeClass: 'border-rose-500 text-rose-600 dark:text-rose-400 font-bold',
      badgeClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
    },
  ];

  const dropdownItems = [
    { id: 'todos', label: 'Todos los Capítulos / Rubros' },
    ...gruposOpciones.map((g) => ({
      id: g.id,
      label: g.label,
      badge: `${g.count}`,
    })),
  ];

  const hasActiveFilters = Boolean(
    searchTerm.trim() ||
    (selectedGrupo && selectedGrupo !== 'todos' && selectedGrupo !== 'todas') ||
    activeTab !== 'todas'
  );

  return (
    <div className="space-y-3 mb-6">
      {/* Pestañas horizontales superiores */}
      <div className="flex border-b border-theme-border justify-between items-center gap-2">
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? tab.activeClass
                    : 'border-transparent text-theme-muted hover:text-theme-main hover:border-theme-border'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isActive ? tab.badgeClass : 'bg-theme-border/40 text-theme-muted'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Barra de Filtros: Buscador, Desplegable (Dropdown reutilizable) y Acciones */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <div className="flex flex-1 flex-wrap gap-3 w-full sm:w-auto">
          {/* Buscador de partidas */}
          <div className="relative flex-1 min-w-[200px] sm:max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-theme-muted">
              <Search size={14} />
            </div>
            <input
              type="text"
              placeholder="Buscar por código, concepto o descripción..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="block w-full pl-9 pr-3 py-2 bg-theme-base border border-theme-border rounded-xl text-theme-main text-xs focus:ring-2 focus:ring-theme-primary/40 focus:border-theme-primary outline-none transition-all"
            />
          </div>

          {/* Selector de Capítulo / Rubro con el Dropdown de Commons */}
          <div className="flex-1 min-w-[230px] sm:max-w-xs">
            <Dropdown
              items={dropdownItems}
              value={selectedGrupo || 'todos'}
              onChange={(val) => onGrupoChange(String(val || 'todos'))}
              placeholder="Todos los Capítulos / Rubros"
              icon={<Filter size={14} className="text-theme-muted" />}
              size="sm"
            />
          </div>
        </div>

        {/* Acciones: Refresco y Nueva Partida (solo Superadmin y Aprobador) */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={onRefresh}
            className="p-2 border border-theme-border rounded-xl bg-theme-surface text-theme-muted hover:text-theme-main hover:bg-theme-border/20 transition-colors"
            title="Refrescar catálogo"
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin text-theme-primary' : ''} />
          </button>

          {canManage ? (
            <Button
              type="button"
              variant="primary"
              size="md"
              icon={<Plus size={16} />}
              onClick={onCreateNew}
            >
              Nueva Partida
            </Button>
          ) : null}
        </div>
      </div>

      {/* Indicador de filtros aplicados */}
      {hasActiveFilters ? (
        <div className="flex items-center justify-between text-xs text-theme-muted px-1 pt-1">
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
      ) : null}
    </div>
  );
};
