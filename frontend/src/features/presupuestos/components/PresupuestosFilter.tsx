import React, { useMemo } from 'react';
import { Building2, Calendar, RotateCcw, Filter } from 'lucide-react';
import { PresupuestoArea } from '../types/presupuestos.types';
import { MESES } from '../hooks/usePresupuestos';
import { Dropdown, type DropdownItem } from '../../../components/commons';

interface PresupuestosFilterProps {
  presupuestosArea: PresupuestoArea[];
  filtroAreaId: string;
  onFilterAreaChange: (areaId: string) => void;
  mesDesde: number;
  onMesDesdeChange: (mes: number) => void;
  mesHasta: number;
  onMesHastaChange: (mes: number) => void;
  hayFiltroMeses: boolean;
  onResetFiltros: () => void;
  nombreMesDesde: string;
  nombreMesHasta: string;
  gestionAnio?: number;
}

export const PresupuestosFilter: React.FC<PresupuestosFilterProps> = ({
  presupuestosArea,
  filtroAreaId,
  onFilterAreaChange,
  mesDesde,
  onMesDesdeChange,
  mesHasta,
  onMesHastaChange,
  hayFiltroMeses,
  onResetFiltros,
  nombreMesDesde,
  nombreMesHasta,
  gestionAnio,
}) => {
  const areaItems = useMemo((): DropdownItem[] => [
    { id: 'todas', label: 'Todas las Áreas' },
    ...presupuestosArea.map((p) => ({
      id: String(p.area),
      label: p.area_nombre,
      badge: p.area_codigo,
    })),
  ], [presupuestosArea]);

  const mesItems = useMemo((): DropdownItem[] => {
    return MESES.map((m) => ({
      id: m.value,
      label: m.label,
    }));
  }, []);

  return (
    <div className="card !overflow-visible p-4 flex flex-wrap items-center justify-between gap-4 relative z-20">
      <div className="flex flex-wrap items-center gap-3">
        {/* Filtro por Gerencia / Área */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-theme-muted hidden sm:inline-block">
            Área:
          </span>
          <Dropdown
            items={areaItems}
            value={filtroAreaId}
            onChange={(val) => onFilterAreaChange(String(val))}
            placeholder="Todas las Áreas"
            searchable={areaItems.length > 5}
            searchPlaceholder="Buscar área..."
            icon={<Building2 size={14} className="text-theme-muted" />}
            size="sm"
            className="min-w-[210px]"
            menuMinWidth="230px"
          />
        </div>

        {/* Rango Mes Desde */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-theme-muted shrink-0">Desde:</span>
          <Dropdown
            items={mesItems}
            value={mesDesde}
            onChange={(val) => {
              const v = Number(val);
              onMesDesdeChange(v);
              if (v > mesHasta) onMesHastaChange(v);
            }}
            icon={<Calendar size={13} className="text-theme-muted" />}
            size="sm"
            searchable={false}
            className="w-[140px]"
            menuMinWidth="140px"
            maxHeight="220px"
          />
        </div>

        {/* Rango Mes Hasta */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-theme-muted shrink-0">Hasta:</span>
          <Dropdown
            items={mesItems}
            value={mesHasta}
            onChange={(val) => {
              const v = Number(val);
              onMesHastaChange(v);
              if (v < mesDesde) onMesDesdeChange(v);
            }}
            icon={<Calendar size={13} className="text-theme-muted" />}
            size="sm"
            searchable={false}
            className="w-[140px]"
            menuMinWidth="140px"
            maxHeight="220px"
          />
        </div>


        {/* Limpiar Filtros */}
        {(hayFiltroMeses || filtroAreaId !== 'todas') && (
          <button
            onClick={onResetFiltros}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-all flex items-center gap-1 cursor-pointer"
            title="Restablecer filtros a todo el año y todas las áreas"
          >
            <RotateCcw size={13} />
            Limpiar Filtros
          </button>
        )}
      </div>

      <div className="text-xs text-theme-muted flex items-center gap-1.5">
        <Filter size={13} className="text-theme-primary" />
        <span>
          Periodo: <strong>{nombreMesDesde} a {nombreMesHasta} {gestionAnio || ''}</strong>
        </span>
      </div>
    </div>
  );
};

