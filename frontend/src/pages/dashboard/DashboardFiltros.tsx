import React, { useMemo } from 'react';
import { Filter, Building2, Calendar, RotateCcw } from 'lucide-react';
import { PresupuestoArea } from '../../services/presupuestoService';
import { Dropdown, DropdownItem } from '../../components/commons';

export const MESES = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
];

interface DashboardFiltrosProps {
  filtroAreaId: string;
  setFiltroAreaId: (val: string) => void;
  mesDesde: number;
  setMesDesde: (val: number) => void;
  mesHasta: number;
  setMesHasta: (val: number) => void;
  areasParaSelector: PresupuestoArea[];
  nombreMesDesde: string;
  nombreMesHasta: string;
  activeGestionAnio?: number | string;
  totalAreasEnAlcance: number;
  onReset: () => void;
  hayFiltrosActivos: boolean;
}

export const DashboardFiltros: React.FC<DashboardFiltrosProps> = ({
  filtroAreaId,
  setFiltroAreaId,
  mesDesde,
  setMesDesde,
  mesHasta,
  setMesHasta,
  areasParaSelector,
  nombreMesDesde,
  nombreMesHasta,
  activeGestionAnio,
  totalAreasEnAlcance,
  onReset,
  hayFiltrosActivos,
}) => {
  // Opciones de Gerencias / Áreas para el componente Dropdown
  const itemsAreas: DropdownItem[] = useMemo(() => {
    return [
      {
        id: 'todas',
        label: 'Todas las Gerencias y Unidades',
        triggerLabel: 'Todas las Gerencias',
      },
      ...areasParaSelector.map((a) => ({
        id: String(a.area),
        label: a.area_nombre,
        badge: a.area_codigo,
        sublabel: a.area_tipo,
      })),
    ];
  }, [areasParaSelector]);

  // Opciones de Meses para el componente Dropdown
  const itemsMeses: DropdownItem[] = useMemo(() => {
    return MESES.map((m) => ({
      id: m.value,
      label: m.label,
    }));
  }, []);

  return (
    <div className="card p-4 bg-theme-surface border border-theme-border rounded-2xl shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Título de la Sección de Filtros */}
        <div className="flex items-center gap-2 text-xs font-bold text-theme-main uppercase tracking-wider shrink-0">
          <Filter size={15} className="text-theme-main" />
          <span>Filtros de Análisis Presupuestario</span>
        </div>

        {/* Controles de Filtros con el Dropdown Reutilizable */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Dropdown de Gerencia / Área */}
          <div className="w-full sm:w-64">
            <Dropdown
              items={itemsAreas}
              value={filtroAreaId}
              onChange={(val) => setFiltroAreaId(String(val))}
              icon={<Building2 size={14} className="text-theme-muted" />}
              size="sm"
              searchable
              searchPlaceholder="Buscar gerencia o código..."
              placeholder="Filtrar por gerencia..."
            />
          </div>

          {/* Dropdown Mes Desde */}
          <div className="w-36">
            <Dropdown
              items={itemsMeses}
              value={mesDesde}
              onChange={(val) => {
                const num = Number(val);
                setMesDesde(num);
                if (num > mesHasta) setMesHasta(num);
              }}
              icon={<Calendar size={14} className="text-theme-muted" />}
              size="sm"
              placeholder="Desde..."
            />
          </div>

          {/* Dropdown Mes Hasta */}
          <div className="w-36">
            <Dropdown
              items={itemsMeses}
              value={mesHasta}
              onChange={(val) => {
                const num = Number(val);
                setMesHasta(num);
                if (num < mesDesde) setMesDesde(num);
              }}
              icon={<Calendar size={14} className="text-theme-muted" />}
              size="sm"
              placeholder="Hasta..."
            />
          </div>

          {/* Botón Restablecer Filtros */}
          {hayFiltrosActivos && (
            <button
              onClick={onReset}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-all flex items-center gap-1.5"
              title="Restablecer a todo el año y todas las áreas"
            >
              <RotateCcw size={13} />
              <span>Limpiar</span>
            </button>
          )}
        </div>
      </div>

      {/* Indicador Informativo del Rango Activo */}
      <div className="mt-3 pt-2.5 border-t border-theme-border flex flex-wrap items-center justify-between text-[11px] text-theme-muted gap-2">
        <span>
          Periodo analizado:{' '}
          <strong className="text-theme-main font-semibold">
            {nombreMesDesde === nombreMesHasta
              ? `${nombreMesDesde} ${activeGestionAnio || ''}`
              : `${nombreMesDesde} a ${nombreMesHasta} ${activeGestionAnio || ''}`}
          </strong>
          {filtroAreaId !== 'todas' && (
            <span>
              {' '}
              • Gerencia filtrada:{' '}
              <strong className="text-theme-main font-semibold">
                {areasParaSelector.find((a) => String(a.area) === filtroAreaId)?.area_nombre ||
                  filtroAreaId}
              </strong>
            </span>
          )}
        </span>

        <span>
          Alcance:{' '}
          <strong className="text-theme-main font-semibold">
            {totalAreasEnAlcance} {totalAreasEnAlcance === 1 ? 'área' : 'áreas'}
          </strong>
        </span>
      </div>
    </div>
  );
};
