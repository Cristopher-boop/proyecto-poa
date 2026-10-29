import React from 'react';
import { Search, Building2, SlidersHorizontal, X } from 'lucide-react';
import { Area } from '../../../services/presupuestoService';
import {
  ReportCategory,
  SubReportPresupuesto,
  SubReportMemoria,
  SubReportModificacion,
  SubReportGasto,
} from '../types/reportes.types';

interface ReportesFilterProps {
  activeCategory: ReportCategory;
  // Subreportes
  subReportPresupuesto: SubReportPresupuesto;
  onSubReportPresupuestoChange: (sub: SubReportPresupuesto) => void;
  subReportMemoria: SubReportMemoria;
  onSubReportMemoriaChange: (sub: SubReportMemoria) => void;
  subReportModificacion: SubReportModificacion;
  onSubReportModificacionChange: (sub: SubReportModificacion) => void;
  subReportGasto: SubReportGasto;
  onSubReportGastoChange: (sub: SubReportGasto) => void;

  // Filtros
  areas: Area[];
  selectedAreaId: string;
  onSelectArea: (areaId: string) => void;
  isGlobalRole: boolean;
  userAreaNombre: string;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  estadoFilter: string;
  onEstadoFilterChange: (val: string) => void;
}

export const ReportesFilter: React.FC<ReportesFilterProps> = ({
  activeCategory,
  subReportPresupuesto,
  onSubReportPresupuestoChange,
  subReportMemoria,
  onSubReportMemoriaChange,
  subReportModificacion,
  onSubReportModificacionChange,
  subReportGasto,
  onSubReportGastoChange,
  areas,
  selectedAreaId,
  onSelectArea,
  isGlobalRole,
  userAreaNombre,
  searchTerm,
  onSearchChange,
  estadoFilter,
  onEstadoFilterChange,
}) => {
  return (
    <div className="card p-4 border border-theme-border bg-theme-surface shadow-sm space-y-3.5 mb-6">
      {/* Selector de Subreporte según la Categoría activa */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-theme-border/60 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {activeCategory === 'presupuestos' && (
            <>
              <button
                type="button"
                onClick={() => onSubReportPresupuestoChange('institucional')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  subReportPresupuesto === 'institucional'
                    ? 'bg-theme-primary text-theme-primaryText shadow-xs'
                    : 'text-theme-muted hover:text-theme-main hover:bg-theme-border/40'
                }`}
              >
                1. Consolidado Institucional POA
              </button>
              <button
                type="button"
                onClick={() => onSubReportPresupuestoChange('por_partida')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  subReportPresupuesto === 'por_partida'
                    ? 'bg-theme-primary text-theme-primaryText shadow-xs'
                    : 'text-theme-muted hover:text-theme-main hover:bg-theme-border/40'
                }`}
              >
                2. Clasificador de Partidas
              </button>
            </>
          )}

          {activeCategory === 'memorias' && (
            <>
              <button
                type="button"
                onClick={() => onSubReportMemoriaChange('estados')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  subReportMemoria === 'estados'
                    ? 'bg-theme-primary text-theme-primaryText shadow-xs'
                    : 'text-theme-muted hover:text-theme-main hover:bg-theme-border/40'
                }`}
              >
                1. Estado y Flujo de MCs
              </button>
              <button
                type="button"
                onClick={() => onSubReportMemoriaChange('items_requerimientos')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  subReportMemoria === 'items_requerimientos'
                    ? 'bg-theme-primary text-theme-primaryText shadow-xs'
                    : 'text-theme-muted hover:text-theme-main hover:bg-theme-border/40'
                }`}
              >
                2. Catálogo de Requerimientos (Ítems)
              </button>
              <button
                type="button"
                onClick={() => onSubReportMemoriaChange('contrataciones_pac')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  subReportMemoria === 'contrataciones_pac'
                    ? 'bg-theme-primary text-theme-primaryText shadow-xs'
                    : 'text-theme-muted hover:text-theme-main hover:bg-theme-border/40'
                }`}
              >
                3. Requerimientos PAC (Compras)
              </button>
            </>
          )}

          {activeCategory === 'modificaciones' && (
            <>
              <button
                type="button"
                onClick={() => onSubReportModificacionChange('historial')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  subReportModificacion === 'historial'
                    ? 'bg-theme-primary text-theme-primaryText shadow-xs'
                    : 'text-theme-muted hover:text-theme-main hover:bg-theme-border/40'
                }`}
              >
                1. Historial de Modificaciones
              </button>
              <button
                type="button"
                onClick={() => onSubReportModificacionChange('matriz_traspasos')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  subReportModificacion === 'matriz_traspasos'
                    ? 'bg-theme-primary text-theme-primaryText shadow-xs'
                    : 'text-theme-muted hover:text-theme-main hover:bg-theme-border/40'
                }`}
              >
                2. Matriz de Traspasos (Origen → Destino)
              </button>
              <button
                type="button"
                onClick={() => onSubReportModificacionChange('incrementos')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  subReportModificacion === 'incrementos'
                    ? 'bg-theme-primary text-theme-primaryText shadow-xs'
                    : 'text-theme-muted hover:text-theme-main hover:bg-theme-border/40'
                }`}
              >
                3. Incrementos Presupuestarios
              </button>
            </>
          )}

          {activeCategory === 'gastos' && (
            <>
              <button
                type="button"
                onClick={() => onSubReportGastoChange('libro_gastos')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  subReportGasto === 'libro_gastos'
                    ? 'bg-theme-primary text-theme-primaryText shadow-xs'
                    : 'text-theme-muted hover:text-theme-main hover:bg-theme-border/40'
                }`}
              >
                1. Libro Diario de Gastos
              </button>
              <button
                type="button"
                onClick={() => onSubReportGastoChange('certificaciones')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  subReportGasto === 'certificaciones'
                    ? 'bg-theme-primary text-theme-primaryText shadow-xs'
                    : 'text-theme-muted hover:text-theme-main hover:bg-theme-border/40'
                }`}
              >
                2. Certificaciones POA
              </button>
              <button
                type="button"
                onClick={() => onSubReportGastoChange('eficiencia_semaforo')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  subReportGasto === 'eficiencia_semaforo'
                    ? 'bg-theme-primary text-theme-primaryText shadow-xs'
                    : 'text-theme-muted hover:text-theme-main hover:bg-theme-border/40'
                }`}
              >
                3. Semáforo de Ejecución Financiera
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-theme-muted">
          <SlidersHorizontal size={13} className="text-theme-primary" />
          <span>Filtros Dinámicos</span>
        </div>
      </div>

      {/* Controles de Filtrado: Búsqueda y Selector de Área */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {/* Buscador de texto */}
        <div className="sm:col-span-2 relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Filtrar por texto, descripción, partida, responsable..."
            className="w-full bg-theme-base/60 border border-theme-border rounded-xl pl-10 pr-9 py-2 text-xs text-theme-main placeholder:text-theme-muted/60 focus:outline-none focus:ring-2 focus:ring-theme-primary/30"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-main p-0.5 rounded cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Selector de Gerencia / Área */}
        <div className="relative">
          {isGlobalRole ? (
            <div className="relative">
              <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted pointer-events-none" />
              <select
                value={selectedAreaId}
                onChange={(e) => onSelectArea(e.target.value)}
                className="w-full bg-theme-base/60 border border-theme-border rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-theme-main focus:outline-none focus:ring-2 focus:ring-theme-primary/30 cursor-pointer"
              >
                <option value="todas">Todas las Áreas / Gerencias</option>
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.nombre}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="h-full flex items-center gap-2 px-3 py-1.5 rounded-xl bg-theme-base border border-theme-border text-xs text-theme-main font-semibold">
              <Building2 size={15} className="text-theme-primary shrink-0" />
              <span className="truncate" title={userAreaNombre}>
                {userAreaNombre || 'Tu Gerencia'}
              </span>
            </div>
          )}
        </div>

        {/* Filtro de Estado secundario */}
        <div>
          <select
            value={estadoFilter}
            onChange={(e) => onEstadoFilterChange(e.target.value)}
            className="w-full bg-theme-base/60 border border-theme-border rounded-xl px-3 py-2 text-xs font-semibold text-theme-main focus:outline-none focus:ring-2 focus:ring-theme-primary/30 cursor-pointer"
          >
            <option value="todos">Todos los Estados</option>
            {activeCategory === 'memorias' && (
              <>
                <option value="PENDIENTE">Gasto Pendiente</option>
                <option value="EJECUTADO_PARCIAL">Ejecutado Parcial</option>
                <option value="COMPLETADO">Completado</option>
              </>
            )}
            {activeCategory === 'modificaciones' && (
              <>
                <option value="APROBADO">Aprobadas</option>
                <option value="PENDIENTE_PRESUPUESTOS">En Presupuestos</option>
                <option value="PENDIENTE_GERENCIA_CEDENTE">En Gerencia Cedente</option>
                <option value="RECHAZADO">Rechazadas</option>
              </>
            )}
            {activeCategory === 'gastos' && (
              <>
                <option value="APROBADO">Aprobadas / Pagadas</option>
                <option value="PENDIENTE_TESORERIA">En Tesorería</option>
                <option value="PENDIENTE_PRESUPUESTOS">En Presupuestos</option>
                <option value="PENDIENTE_PLANIFICACION">En Planificación</option>
                <option value="BORRADOR">Borrador</option>
              </>
            )}
          </select>
        </div>
      </div>
    </div>
  );
};
