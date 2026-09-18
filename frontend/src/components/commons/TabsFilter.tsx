import React from 'react';
import { Search, Filter } from 'lucide-react';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
  activeColorClass?: string;
  activeBadgeClass?: string;
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
}) => {
  return (
    <div className={`space-y-4 mb-6 ${className}`}>
      {/* Pestañas horizontales y acciones rápidas */}
      <div className="flex border-b border-theme-border justify-between items-center gap-2">
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            const activeClass =
              tab.activeColorClass || 'border-theme-primary text-theme-main font-bold';

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? activeClass
                    : 'border-transparent text-theme-muted hover:text-theme-main hover:border-theme-border'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive
                        ? (tab.activeBadgeClass || 'bg-theme-primary/15 text-theme-primary')
                        : 'bg-theme-border/40 text-theme-muted'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {actions && !onSearchChange && !selectOptions && (
          <div className="shrink-0 pb-1">
            {actions}
          </div>
        )}
      </div>

      {/* Barra de Filtros y Acciones (solo si hay buscador o select de búsqueda) */}
      {Boolean(onSearchChange || (selectOptions && onSelectChange)) && (
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
          <div className="flex flex-1 flex-wrap gap-3 w-full sm:w-auto">
            {/* Buscador */}
            {onSearchChange && (
              <div className="relative flex-1 min-w-[200px] sm:max-w-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-theme-muted">
                  <Search size={14} />
                </div>
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchTerm || ''}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 bg-theme-base border border-theme-border rounded-xl text-theme-main text-xs focus:ring-2 focus:ring-theme-primary/40 focus:border-theme-primary outline-none transition-all"
                />
              </div>
            )}

            {/* Select de Área u otro filtro */}
            {selectOptions && onSelectChange && (
              <div className="relative flex-1 min-w-[180px] sm:max-w-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-theme-muted">
                  <Filter size={14} />
                </div>
                <select
                  value={selectedValue || 'todas'}
                  onChange={(e) => onSelectChange(e.target.value)}
                  className="block w-full pl-9 pr-8 py-2 bg-theme-base border border-theme-border rounded-xl text-theme-main text-xs focus:ring-2 focus:ring-theme-primary/40 focus:border-theme-primary outline-none appearance-none transition-all cursor-pointer"
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
          </div>

          {/* Acciones */}
          {actions && (
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {actions}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
