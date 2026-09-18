import React, { useState } from 'react';
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

import { SelectOption } from './TabsFilter';

export interface FilterPanelProps {
  // Buscador general (desacoplado de filtros específicos)
  searchTerm: string;
  onSearchChange: (term: string) => void;
  searchPlaceholder?: string;

  // Filtro de Área / Gerencia
  areaOptions?: SelectOption[];
  selectedArea?: string;
  onAreaChange?: (area: string) => void;
  areaPlaceholder?: string;

  // Filtro de Partida Presupuestaria
  partidaOptions?: SelectOption[];
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
  searchTerm,
  onSearchChange,
  searchPlaceholder = 'Buscar por comprobante, observación...',
  areaOptions,
  selectedArea = 'todas',
  onAreaChange,
  areaPlaceholder = 'Todas las Áreas',
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

  return (
    <div className={`space-y-3 mb-6 ${className}`}>
      {/* Barra Principal de Filtros */}
      <div className="flex flex-col lg:flex-row gap-2.5 justify-between items-stretch lg:items-center bg-theme-surface p-3 rounded-2xl border border-theme-border shadow-sm">
        <div className="flex flex-1 flex-wrap gap-2.5 items-center">
          {/* Buscador General Desacoplado */}
          <div className="relative flex-1 min-w-[220px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted" />
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

          {/* Selector de Área / Gerencia */}
          {areaOptions && onAreaChange && (
            <div className="relative min-w-[180px] max-w-xs">
              <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted pointer-events-none" />
              <select
                value={selectedArea}
                onChange={(e) => onAreaChange(e.target.value)}
                className="w-full pl-9 pr-7 py-2 text-xs bg-theme-base border border-theme-border rounded-xl text-theme-main outline-none focus:ring-2 focus:ring-theme-primary/40 focus:border-theme-primary cursor-pointer truncate"
              >
                <option value="todas">{areaPlaceholder}</option>
                {areaOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Selector de Partida Presupuestaria */}
          {partidaOptions && onPartidaChange && (
            <div className="relative min-w-[180px] max-w-xs">
              <Bookmark size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted pointer-events-none" />
              <select
                value={selectedPartida}
                onChange={(e) => onPartidaChange(e.target.value)}
                className="w-full pl-9 pr-7 py-2 text-xs bg-theme-base border border-theme-border rounded-xl text-theme-main outline-none focus:ring-2 focus:ring-theme-primary/40 focus:border-theme-primary cursor-pointer truncate"
              >
                <option value="todas">{partidaPlaceholder}</option>
                {partidaOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

        </div>

        {/* Acciones del Extremo Derecho: Filtros Avanzados a la izquierda de Refrescar, solo íconos */}
        <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
          {/* Botón Limpiar Filtros (Solo Ícono) */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="p-2 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-all flex items-center justify-center border border-rose-300/60 dark:border-rose-900/60"
              title="Restablecer filtros"
            >
              <RotateCcw size={15} />
            </button>
          )}

          {/* Botón Filtros Avanzados (Solo Ícono, a la izquierda de Refrescar) */}
          <button
            type="button"
            onClick={() => setShowAdvanced((prev) => !prev)}
            className={`relative p-2 rounded-xl text-xs font-semibold flex items-center justify-center transition-all border ${
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

          {/* Botón Refrescar (Acción del extremo derecho) */}
          {actions}
        </div>
      </div>

      {/* Panel Desplegable de Filtros Avanzados */}
      {showAdvanced && (
        <div className="p-4 bg-theme-surface rounded-2xl border border-theme-border shadow-sm space-y-4 animate-in fade-in duration-200">
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
                      className="w-full px-2.5 py-1.5 text-xs bg-theme-base border border-theme-border rounded-lg text-theme-main outline-none focus:border-theme-primary cursor-pointer"
                    >
                      {MESES_ANIO.map((m) => (
                        <option key={`d-${m.num}`} value={m.num}>
                          {m.nombre}
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
                      className="w-full px-2.5 py-1.5 text-xs bg-theme-base border border-theme-border rounded-lg text-theme-main outline-none focus:border-theme-primary cursor-pointer"
                    >
                      {MESES_ANIO.map((m) => (
                        <option key={`h-${m.num}`} value={m.num}>
                          {m.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Rango de Fechas Exactas (Limitado al año fiscal) */}
            {onFechaDesdeChange && onFechaHastaChange && (
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-theme-muted">
                  <Calendar size={13} className="text-theme-primary" />
                  Fechas Exactas {gestionAnio ? `(${gestionAnio})` : ''}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-theme-muted block mb-0.5">Desde</span>
                    <input
                      type="date"
                      value={fechaDesde}
                      min={minFechaFiscal}
                      max={maxFechaFiscal}
                      onChange={(e) => onFechaDesdeChange(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs bg-theme-base border border-theme-border rounded-lg text-theme-main outline-none focus:border-theme-primary"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-theme-muted block mb-0.5">Hasta</span>
                    <input
                      type="date"
                      value={fechaHasta}
                      min={minFechaFiscal}
                      max={maxFechaFiscal}
                      onChange={(e) => onFechaHastaChange(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs bg-theme-base border border-theme-border rounded-lg text-theme-main outline-none focus:border-theme-primary"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 3. Rango de Montos Ejecutados (Min - Max) */}
            {onMontoMinChange && onMontoMaxChange && (
              <div className="space-y-1.5 lg:col-span-2">
                <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-theme-muted">
                  <DollarSign size={13} className="text-rose-600 dark:text-rose-400" />
                  Rango de Importe (Bs.)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-theme-muted block mb-0.5">Mínimo</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={montoMin}
                      onChange={(e) => onMontoMinChange(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-theme-base border border-theme-border rounded-lg text-theme-main outline-none focus:border-theme-primary"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-theme-muted block mb-0.5">Máximo</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Sin límite"
                      value={montoMax}
                      onChange={(e) => onMontoMaxChange(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-theme-base border border-theme-border rounded-lg text-theme-main outline-none focus:border-theme-primary"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Resumen de Criterios Aplicados */}
          {hasActiveFilters && (
            <div className="pt-2 border-t border-theme-border/50 flex items-center justify-between text-[11px] text-theme-muted">
              <span>
                Filtros activos:{' '}
                <strong className="text-theme-main font-semibold">
                  {countActive} criterio(s) aplicado(s)
                </strong>
              </span>
              <button
                type="button"
                onClick={onResetFilters}
                className="text-rose-600 dark:text-rose-400 hover:underline font-semibold"
              >
                Limpiar todos los filtros
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
