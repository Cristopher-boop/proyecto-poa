import React from 'react';
import { Search, Filter } from 'lucide-react';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
  activeColorClass?: string;
  activeBadgeClass?: string;
  tourId?: string;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface TabsFilterProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  searchPlaceholder?: string;
  selectOptions?: SelectOption[];
  selectedValue?: string;
  onSelectChange?: (value: string) => void;
  selectPlaceholder?: string;
  actions?: React.ReactNode;
  className?: string;
  variant?: 'card' | 'plain';
  totalCount?: number;
  filteredCount?: number;
  gestionAnio?: number;
  recordsLabel?: string;
}

export const TabsFilter: React.FC<TabsFilterProps> = ({
  tabs,
  activeTab,
  onTabChange,
  searchTerm,
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  selectOptions,
  selectedValue,
  onSelectChange,
  selectPlaceholder = 'Todos',
  actions,
  className = '',
  variant = 'card',
  totalCount,
  filteredCount,
  gestionAnio,
  recordsLabel,
}) => {
  const containerClass =
    variant === 'plain'
      ? `space-y-4 mb-6 ${className}`
      : `card p-4 border border-theme-border bg-theme-surface shadow-sm space-y-4 mb-6 ${className}`;

  return (
    <div className={containerClass}>
      {/* Pestañas de Estado con Insignias Contadoras */}
      <div className="flex border-b border-theme-border overflow-x-auto no-scrollbar gap-2">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          const activeClass =
            tab.activeColorClass || 'border-theme-primary text-theme-main font-bold';

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              data-tab-id={tab.id}
              data-tour={tab.tourId || `tour-tab-${tab.id.toLowerCase()}`}
              className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? activeClass
                  : 'border-transparent text-theme-muted hover:text-theme-main'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                    isActive
                      ? (tab.activeBadgeClass || 'bg-theme-primary/15 text-theme-primary font-bold')
                      : 'bg-theme-border/60 text-theme-main'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Buscador, Selectores y Acciones */}
      {Boolean(onSearchChange || (selectOptions && onSelectChange) || actions || (typeof filteredCount === 'number' && typeof totalCount === 'number')) && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto flex-1">
            {/* Buscador */}
            {onSearchChange && (
              <div className="relative w-full sm:w-80">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted pointer-events-none" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchTerm || ''}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="input-theme pl-9 text-xs w-full"
                />
              </div>
            )}

            {/* Select simple */}
            {selectOptions && onSelectChange && (
              <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-theme-muted">
                  <Filter size={14} />
                </div>
                <select
                  value={selectedValue || 'todas'}
                  onChange={(e) => onSelectChange(e.target.value)}
                  className="input-theme pl-9 text-xs w-full cursor-pointer appearance-none"
                >
                  <option value="todas">{selectPlaceholder}</option>
                  {selectOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Acciones */}
            {actions && (
              <div className="flex items-center gap-2">
                {actions}
              </div>
            )}
          </div>

          {/* Conteo de registros */}
          {typeof filteredCount === 'number' && typeof totalCount === 'number' && gestionAnio && (
            <p className="text-xs text-theme-muted font-medium shrink-0">
              Mostrando <strong className="text-theme-main">{filteredCount}</strong> de{' '}
              <strong className="text-theme-main">{totalCount}</strong> {recordsLabel || 'operaciones'} en Gestión {gestionAnio}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
