import React from 'react';
import { Search, Clock, CheckCircle2, XCircle, Layers, Building2 } from 'lucide-react';
import { Area } from '../../../services/presupuestoService';
import { Dropdown, DropdownItem } from '../../../components/commons';
import { ModificacionTab } from '../hooks/useModificaciones';

interface ModificacionesFilterProps {
  activeTab: ModificacionTab;
  onTabChange: (tab: ModificacionTab) => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  areas: Area[];
  filtroArea: string;
  onAreaChange: (val: string) => void;
  totalCount: number;
  countPendientesGerencia: number;
  countPendientesPresupuestos: number;
  countAprobadas: number;
  countRechazadas: number;
  gestionAnio?: number;
  filteredCount: number;
}

export const ModificacionesFilter: React.FC<ModificacionesFilterProps> = ({
  activeTab,
  onTabChange,
  searchTerm,
  onSearchChange,
  areas,
  filtroArea,
  onAreaChange,
  totalCount,
  countPendientesGerencia,
  countPendientesPresupuestos,
  countAprobadas,
  countRechazadas,
  gestionAnio,
  filteredCount,
}) => {
  // Convertir áreas a items para el Dropdown institucional
  const areaDropdownItems: DropdownItem[] = [
    {
      id: 'todas',
      label: 'Todas las Áreas',
      badge: 'GLOBAL',
      badgeClassName: 'bg-theme-primary/10 text-theme-primary font-bold',
    },
    ...areas.map((a) => ({
      id: String(a.id),
      label: a.nombre,
      badge: a.codigo,
      badgeClassName: 'bg-theme-border/60 text-theme-main font-mono text-[10px]',
      sublabel: `${a.tipo || 'Área'} institucional`,
    })),
  ];

  return (
    <div className="card p-4 border border-theme-border bg-theme-surface shadow-sm space-y-4">
      {/* Pestañas de Estado con Insignias Contadoras */}
      <div className="flex border-b border-theme-border overflow-x-auto no-scrollbar gap-2">
        <button
          type="button"
          onClick={() => onTabChange('TODAS')}
          className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'TODAS'
              ? 'border-theme-primary text-theme-main font-bold'
              : 'border-transparent text-theme-muted hover:text-theme-main'
          }`}
        >
          <Layers size={13} />
          <span>Todas</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-theme-border/60 text-theme-main font-mono">
            {totalCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('PENDIENTE_GERENCIA_CEDENTE')}
          className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'PENDIENTE_GERENCIA_CEDENTE'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold'
              : 'border-transparent text-theme-muted hover:text-theme-main'
          }`}
        >
          <Building2 size={13} />
          <span>En Espera (Gerencia Cedente)</span>
          {countPendientesGerencia > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 font-bold font-mono">
              {countPendientesGerencia}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onTabChange('PENDIENTE_PRESUPUESTOS')}
          className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'PENDIENTE_PRESUPUESTOS'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-bold'
              : 'border-transparent text-theme-muted hover:text-theme-main'
          }`}
        >
          <Clock size={13} />
          <span>En Espera (Presupuestos)</span>
          {countPendientesPresupuestos > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold font-mono">
              {countPendientesPresupuestos}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onTabChange('APROBADO')}
          className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'APROBADO'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
              : 'border-transparent text-theme-muted hover:text-theme-main'
          }`}
        >
          <CheckCircle2 size={13} />
          <span>Aprobadas</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold font-mono">
            {countAprobadas}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('RECHAZADO')}
          className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'RECHAZADO'
              ? 'border-rose-500 text-rose-600 dark:text-rose-400 font-bold'
              : 'border-transparent text-theme-muted hover:text-theme-main'
          }`}
        >
          <XCircle size={13} />
          <span>Rechazadas</span>
          {countRechazadas > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500/20 text-rose-700 dark:text-rose-400 font-bold font-mono">
              {countRechazadas}
            </span>
          )}
        </button>
      </div>

      {/* Buscador y Dropdown Institucional de Área */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Input de Búsqueda */}
          <div className="relative w-full sm:w-80">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar por código, motivo, partida, memoria..."
              className="input-theme pl-9 text-xs w-full"
            />
          </div>

          {/* Dropdown Desplegable Institucional de Área */}
          <div className="w-full sm:w-72">
            <Dropdown
              items={areaDropdownItems}
              value={filtroArea}
              onChange={(val) => onAreaChange(val)}
              placeholder="Filtrar por Área..."
              searchable={true}
              searchPlaceholder="Buscar área..."
              size="sm"
            />
          </div>
        </div>

        <p className="text-xs text-theme-muted font-medium shrink-0">
          Mostrando <strong className="text-theme-main">{filteredCount}</strong> de{' '}
          <strong className="text-theme-main">{totalCount}</strong> operaciones en Gestión {gestionAnio}
        </p>
      </div>
    </div>
  );
};
