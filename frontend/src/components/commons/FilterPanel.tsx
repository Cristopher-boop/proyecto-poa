import React, { useState, useMemo } from 'react';
import {
  Search,
  Calendar,
  DollarSign,
  Building2,
  Bookmark,
  SlidersHorizontal,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  X,
} from 'lucide-react';

export const MESES_ANIO = [
  { num: 1, nombre: 'Enero' },
  { num: 2, nombre: 'Febrero' },
  { num: 3, nombre: 'Marzo' },
  { num: 4, nombre: 'Abril' },
  { num: 5, nombre: 'Mayo' },
  { num: 6, nombre: 'Junio' },
  { num: 7, nombre: 'Julio' },
  { num: 8, nombre: 'Agosto' },
  { num: 9, nombre: 'Septiembre' },
  { num: 10, nombre: 'Octubre' },
  { num: 11, nombre: 'Noviembre' },
  { num: 12, nombre: 'Diciembre' },
];

import { SelectOption, TabItem } from './TabsFilter';
import { Dropdown, DropdownItem } from './Dropdown';

export interface FilterOption extends SelectOption {
  group?: string;
  groupBadge?: string;
  badge?: string;
  badgeClassName?: string;
  triggerLabel?: string;
  sublabel?: string;
}

export interface FilterPanelProps {
  // Pestañas integradas opcionales (Estilo Modificaciones)
  tabs?: TabItem[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  filteredCount?: number;
  totalCount?: number;
  recordsLabel?: string;

  // Buscador general (desacoplado de filtros específicos)
  searchTerm: string;
  onSearchChange: (term: string) => void;
  searchPlaceholder?: string;

  // Filtro de Área / Gerencia
  areaOptions?: FilterOption[];
  selectedArea?: string;
  onAreaChange?: (area: string) => void;
  areaPlaceholder?: string;
  isGerente?: boolean;

  // Filtro de Partida Presupuestaria
  partidaOptions?: FilterOption[];
  selectedPartida?: string;
  onPartidaChange?: (partida: string) => void;
  partidaPlaceholder?: string;

  // Filtro por Fechas exactas
  fechaDesde?: string;
  fechaHasta?: string;
  onFechaDesdeChange?: (fecha: string) => void;
  onFechaHastaChange?: (fecha: string) => void;

  // Filtro por Meses (1 a 12)
  mesDesde?: number;
  mesHasta?: number;
  onMesDesdeChange?: (mes: number) => void;
  onMesHastaChange?: (mes: number) => void;

  // Filtro por Rango de Montos (Min - Max)
  montoMin?: string | number;
  montoMax?: string | number;
  onMontoMinChange?: (val: string) => void;
  onMontoMaxChange?: (val: string) => void;

  // Año de la gestión activa para limitar los calendarios
  gestionAnio?: number;

  // Estado y reseteo
  hasActiveFilters: boolean;
  onResetFilters: () => void;

  // Acciones adicionales a la derecha (ej: botón refrescar)
  actions?: React.ReactNode;
  className?: string;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  tabs,
  activeTab,
  onTabChange,
  filteredCount,
  totalCount,
  recordsLabel,
  searchTerm,
  onSearchChange,
  searchPlaceholder = 'Buscar por comprobante, observación...',
  areaOptions,
  selectedArea = 'todas',
  onAreaChange,
  areaPlaceholder = 'Todas las Áreas',
  isGerente = false,
  partidaOptions,
  selectedPartida = 'todas',
  onPartidaChange,
  partidaPlaceholder = 'Todas las Partidas',
  fechaDesde = '',
  fechaHasta = '',
  onFechaDesdeChange,
  onFechaHastaChange,
  mesDesde = 1,
  mesHasta = 12,
  onMesDesdeChange,
  onMesHastaChange,
  montoMin = '',
  montoMax = '',
  onMontoMinChange,
  onMontoMaxChange,
  gestionAnio,
  hasActiveFilters,
  onResetFilters,
  actions,
  className = '',
}) => {
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Límites del año fiscal
  const minFechaFiscal = gestionAnio ? `${gestionAnio}-01-01` : undefined;
  const maxFechaFiscal = gestionAnio ? `${gestionAnio}-12-31` : undefined;

  // Conteo de filtros activos para la insignia
  const countActive = [
    Boolean(searchTerm.trim()),
    selectedArea !== 'todas',
    selectedPartida !== 'todas',
    Boolean(fechaDesde || fechaHasta),
    mesDesde !== 1 || mesHasta !== 12,
    montoMin !== '' || montoMax !== '',
  ].filter(Boolean).length;

  // Preparar opciones de Área para Dropdown
  const areaDropdownItems = useMemo((): DropdownItem[] => {
    if (!areaOptions) return [];
    const items: DropdownItem[] = [];
    if (!isGerente && areaPlaceholder) {
      items.push({
        id: 'todas',
        label: areaPlaceholder,
        triggerLabel: areaPlaceholder,
      });
    }
    areaOptions.forEach((opt) => {
      items.push({
        id: opt.value,
        label: opt.label,
        triggerLabel: opt.triggerLabel || opt.label,
        badge: opt.badge,
        badgeClassName: opt.badgeClassName,
      });
    });
    return items;
  }, [areaOptions, isGerente, areaPlaceholder]);

  // Preparar opciones de Partida / MC para Dropdown
  const partidaDropdownItems = useMemo((): DropdownItem[] => {
    if (!partidaOptions) return [];
    const items: DropdownItem[] = [
      {
        id: 'todas',
        label: partidaPlaceholder,
        triggerLabel: partidaPlaceholder,
      },
    ];
    partidaOptions.forEach((opt) => {
      items.push({
        id: opt.value,
        label: opt.label,
        triggerLabel: opt.triggerLabel || opt.label,
        badge: opt.badge,
        badgeClassName: opt.badgeClassName,
        group: opt.group,
        groupBadge: opt.groupBadge,
        sublabel: opt.sublabel,
      });
    });
    return items;
  }, [partidaOptions, partidaPlaceholder]);

  return (
    <div className={`card p-4 border border-theme-border bg-theme-surface shadow-sm space-y-4 mb-6 ${className}`}>
      {/* Pestañas de Estado integradas en cabecera (Estilo Modificaciones) */}
      {tabs && tabs.length > 0 && onTabChange && (
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
      )}

      {/* Barra Principal de Filtros */}
      <div className="flex flex-col lg:flex-row gap-2.5 justify-between items-stretch lg:items-center relative z-20">
        <div className="flex flex-1 flex-wrap gap-2.5 items-center">
          {/* Buscador General Desacoplado */}
          <div className="relative flex-1 min-w-[220px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-8 py-2 text-xs bg-theme-base border border-theme-border rounded-xl text-theme-main outline-none focus:ring-2 focus:ring-theme-primary/40 focus:border-theme-primary transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-main"
                title="Borrar texto"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Selector de Área / Gerencia con Dropdown */}
          {areaOptions && onAreaChange && (
            <div className="min-w-[180px] max-w-xs">
              <Dropdown
                items={areaDropdownItems}
                value={selectedArea}
                onChange={(val) => onAreaChange(String(val))}
                disabled={isGerente}
                icon={<Building2 size={14} className="text-theme-muted" />}
                placeholder={areaPlaceholder}
                searchable={areaDropdownItems.length > 5}
                searchPlaceholder="Buscar área..."
                size="md"
                className="w-full"
                menuMinWidth="230px"
              />
            </div>
          )}

          {/* Selector de Partida Presupuestaria / MCs con Dropdown */}
          {partidaOptions && onPartidaChange && (
            <div className="min-w-[240px] max-w-md flex-1">
              <Dropdown
                items={partidaDropdownItems}
                value={selectedPartida}
                onChange={(val) => onPartidaChange(String(val))}
                icon={<Bookmark size={14} className="text-theme-muted" />}
                placeholder={partidaPlaceholder}
                searchable={true}
                searchPlaceholder="Buscar partida o MC..."
                size="md"
                className="w-full"
                menuMinWidth="380px"
                maxHeight="320px"
                showBadgeInTrigger={true}
                badgePosition="start"
              />
            </div>
          )}
        </div>

        {/* Acciones del Extremo Derecho */}
        <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="p-2 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-all flex items-center justify-center border border-rose-300/60 dark:border-rose-900/60 cursor-pointer"
              title="Restablecer filtros"
            >
              <RotateCcw size={15} />
            </button>
          )}

          {/* Botón Filtros Avanzados */}
          <button
            type="button"
            onClick={() => setShowAdvanced((prev) => !prev)}
            className={`relative p-2 rounded-xl text-xs font-semibold flex items-center justify-center transition-all border cursor-pointer ${
              showAdvanced || countActive > 0
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-900/60 ring-1 ring-rose-500/30'
                : 'bg-theme-base text-theme-muted border-theme-border hover:text-theme-main hover:border-theme-border/80'
            }`}
            title={showAdvanced ? 'Ocultar filtros avanzados' : 'Filtros avanzados'}
          >
            <SlidersHorizontal size={15} />
            {countActive > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 text-[9px] font-black rounded-full bg-rose-600 text-white flex items-center justify-center shadow-sm">
                {countActive}
              </span>
            )}
          </button>

          {/* Botón Refrescar */}
          {actions}

          {/* Texto Contador de Registros */}
          {typeof filteredCount === 'number' && typeof totalCount === 'number' && gestionAnio && (
            <p className="text-xs text-theme-muted font-medium shrink-0 ml-2 hidden sm:block">
              Mostrando <strong className="text-theme-main">{filteredCount}</strong> de{' '}
              <strong className="text-theme-main">{totalCount}</strong> {recordsLabel || 'registros'} en Gestión {gestionAnio}
            </p>
          )}
        </div>
      </div>

      {/* Panel Desplegable de Filtros Avanzados */}
      {showAdvanced && (
        <div className="p-4 bg-theme-base rounded-2xl border border-theme-border shadow-sm space-y-4 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Rango de Meses (Dentro del año fiscal) */}
            {onMesDesdeChange && onMesHastaChange && (
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-theme-muted">
                  <Calendar size={13} className="text-theme-primary" />
                  Rango de Meses {gestionAnio ? `(${gestionAnio})` : ''}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-theme-muted block mb-0.5">Desde</span>
                    <select
                      value={mesDesde}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        onMesDesdeChange(val);
                        if (val > mesHasta) onMesHastaChange(val);
                      }}
                      className="w-full text-xs bg-theme-surface border border-theme-border rounded-xl px-2.5 py-1.5 text-theme-main outline-none focus:ring-1 focus:ring-theme-primary/50 cursor-pointer"
                    >
                      {MESES_ANIO.map((m) => (
                        <option key={m.num} value={m.num}>
                          {m.num}. {m.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className="text-[10px] text-theme-muted block mb-0.5">Hasta</span>
                    <select
                      value={mesHasta}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        onMesHastaChange(val);
                        if (val < mesDesde) onMesDesdeChange(val);
                      }}
                      className="w-full text-xs bg-theme-surface border border-theme-border rounded-xl px-2.5 py-1.5 text-theme-main outline-none focus:ring-1 focus:ring-theme-primary/50 cursor-pointer"
                    >
                      {MESES_ANIO.map((m) => (
                        <option key={m.num} value={m.num}>
                          {m.num}. {m.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Rango de Fechas Exactas */}
            {onFechaDesdeChange && onFechaHastaChange && (
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-theme-muted">
                  <Calendar size={13} className="text-theme-primary" />
                  Fechas Exactas
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-theme-muted block mb-0.5">Desde</span>
                    <input
                      type="date"
                      value={fechaDesde}
                      min={minFechaFiscal}
                      max={fechaHasta || maxFechaFiscal}
                      onChange={(e) => onFechaDesdeChange(e.target.value)}
                      className="w-full text-xs bg-theme-surface border border-theme-border rounded-xl px-2.5 py-1.5 text-theme-main outline-none focus:ring-1 focus:ring-theme-primary/50"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-theme-muted block mb-0.5">Hasta</span>
                    <input
                      type="date"
                      value={fechaHasta}
                      min={fechaDesde || minFechaFiscal}
                      max={maxFechaFiscal}
                      onChange={(e) => onFechaHastaChange(e.target.value)}
                      className="w-full text-xs bg-theme-surface border border-theme-border rounded-xl px-2.5 py-1.5 text-theme-main outline-none focus:ring-1 focus:ring-theme-primary/50"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 3. Rango de Montos */}
            {onMontoMinChange && onMontoMaxChange && (
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-theme-muted">
                  <DollarSign size={13} className="text-theme-primary" />
                  Rango de Monto (Bs.)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-theme-muted block mb-0.5">Mínimo</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={montoMin}
                      onChange={(e) => onMontoMinChange(e.target.value)}
                      className="w-full text-xs bg-theme-surface border border-theme-border rounded-xl px-2.5 py-1.5 text-theme-main outline-none focus:ring-1 focus:ring-theme-primary/50"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-theme-muted block mb-0.5">Máximo</span>
                    <input
                      type="number"
                      placeholder="Sin tope"
                      value={montoMax}
                      onChange={(e) => onMontoMaxChange(e.target.value)}
                      className="w-full text-xs bg-theme-surface border border-theme-border rounded-xl px-2.5 py-1.5 text-theme-main outline-none focus:ring-1 focus:ring-theme-primary/50"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 4. Resumen y Limpieza */}
            <div className="flex flex-col justify-end space-y-1.5">
              <span className="text-[10px] text-theme-muted block">
                {countActive > 0 ? `${countActive} filtros aplicados` : 'Sin filtros avanzados activos'}
              </span>
              <button
                type="button"
                onClick={onResetFilters}
                disabled={!hasActiveFilters}
                className="w-full py-1.5 px-3 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 disabled:opacity-40 disabled:cursor-not-allowed border border-rose-300/60 dark:border-rose-900/60 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <RotateCcw size={13} />
                Restablecer Todo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
