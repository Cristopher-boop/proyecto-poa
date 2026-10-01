import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Printer,
  Layers,
  Receipt,
  BookOpenText,
  FileText,
  RefreshCw,
} from 'lucide-react';
import {
  DetalleArea,
  SeccionDetalleArea,
  TabSeccionMode,
  GastoAuxiliarItem,
  PartidaConsolidada,
} from '../types/presupuestos.types';
import { MemoriasSectionList } from './MemoriasSectionList';
import { GastosSectionTable } from './GastosSectionTable';
import { PartidasSectionTable } from './PartidasSectionTable';

interface PresupuestoSectionViewProps {
  detalleArea: DetalleArea | null;
  seccionActivaData: SeccionDetalleArea | null;
  selectedAreaId: number | null;
  detalleLoading: boolean;
  onVolverGeneral: () => void;
  onOpenReporteSeccion: () => void;
  tabSeccion: TabSeccionMode;
  onTabSeccionChange: (tab: TabSeccionMode) => void;
  // Sub-tab 1: Memorias
  expandedMemorias: Set<number>;
  onToggleMemoria: (id: number) => void;
  expandedPartidas: Set<string>;
  onTogglePartida: (key: string) => void;
  getBadgeEstado: (estado: string) => { className: string; label: string };
  // Sub-tab 2: Gastos
  todosLosGastosSeccion: GastoAuxiliarItem[];
  // Sub-tab 3: Partidas
  partidasConsolidadas: PartidaConsolidada[];
  partidasFiltradas: PartidaConsolidada[];
  busquedaPartida: string;
  onBusquedaPartidaChange: (query: string) => void;
  expandedPartidasConsolidadas: Set<string>;
  onTogglePartidaConsolidada: (codigo: string) => void;
  onOpenReportePartidas: () => void;
  totalPartidasPresupuestado: number;
  totalPartidasAgregado: number;
  totalPartidasQuitado: number;
  totalPartidasEjecutado: number;
  totalPartidasDisponible: number;
  pctPartidasGlobal: number;
  // Common formatters & filters
  formatMoney: (val: string | number) => string;
  nombreMesDesde: string;
  nombreMesHasta: string;
  gestionAnio?: number;
}

export const PresupuestoSectionView: React.FC<PresupuestoSectionViewProps> = ({
  detalleArea,
  seccionActivaData,
  selectedAreaId,
  detalleLoading,
  onVolverGeneral,
  onOpenReporteSeccion,
  tabSeccion,
  onTabSeccionChange,
  expandedMemorias,
  onToggleMemoria,
  expandedPartidas,
  onTogglePartida,
  getBadgeEstado,
  todosLosGastosSeccion,
  partidasConsolidadas,
  partidasFiltradas,
  busquedaPartida,
  onBusquedaPartidaChange,
  expandedPartidasConsolidadas,
  onTogglePartidaConsolidada,
  onOpenReportePartidas,
  totalPartidasPresupuestado,
  totalPartidasAgregado,
  totalPartidasQuitado,
  totalPartidasEjecutado,
  totalPartidasDisponible,
  pctPartidasGlobal,
  formatMoney,
  nombreMesDesde,
  nombreMesHasta,
  gestionAnio,
}) => {
  return (
    <div className="space-y-6">
      {/* Navegación y Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-theme-base/60 p-3 rounded-2xl border border-theme-border">
        <button
          type="button"
          onClick={onVolverGeneral}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-theme-primary hover:underline cursor-pointer"
        >
          <ChevronLeft size={16} /> Volver a Resumen Presupuestario
        </button>

        <div className="flex items-center gap-2 text-xs font-medium text-theme-muted select-none flex-wrap">
          <span className="hover:text-theme-main cursor-pointer" onClick={onVolverGeneral}>
            Presupuestos
          </span>
          <ChevronRight size={12} />
          <span className="font-semibold text-theme-main">
            {detalleArea?.area_nombre || `Área ${selectedAreaId}`}
          </span>
          {seccionActivaData && (
            <>
              <ChevronRight size={12} />
              <span className="font-bold text-theme-primary">
                {seccionActivaData.seccion_nombre}
              </span>
            </>
          )}
        </div>
      </div>

      {detalleLoading ? (
        <div className="card p-12 text-center">
          <RefreshCw size={28} className="animate-spin mx-auto text-theme-muted mb-3" />
          <p className="text-sm font-semibold text-theme-main">Cargando detalles de la sección...</p>
          <p className="text-xs text-theme-muted mt-1">Obteniendo estructura POA, partidas y gastos auxiliares.</p>
        </div>
      ) : !detalleArea || !seccionActivaData ? (
        <div className="card p-12 text-center space-y-3">
          <FileText size={36} className="mx-auto opacity-30 text-theme-muted" />
          <p className="text-sm font-semibold text-theme-muted">Sección sin presupuesto formulado</p>
          <p className="text-xs text-theme-muted max-w-md mx-auto">
            No se encontraron memorias ni techos presupuestarios registrados en esta sección para la Gestión {gestionAnio}.
          </p>
          <button type="button" onClick={onVolverGeneral} className="btn-primary text-xs px-4 py-2 mt-2">
            Volver al Resumen General
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Resumen Superior de la Sección Activa */}
          <div className="card p-5 bg-gradient-to-r from-theme-surface to-theme-base/30">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 font-mono uppercase">
                  {detalleArea?.area_codigo} — Sección Operativa
                </span>
                <h2 className="text-xl font-bold text-theme-main mt-1.5">{seccionActivaData.seccion_nombre}</h2>
                <p className="text-xs text-theme-muted mt-0.5">Gerencia / Unidad: {detalleArea?.area_nombre}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={onOpenReporteSeccion}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all bg-theme-base border-theme-border text-theme-main hover:border-theme-primary hover:text-theme-primary cursor-pointer shadow-sm"
                >
                  <Printer size={14} />
                  Generar Reporte Sección
                </button>
                <div className="text-right pl-3 border-l border-theme-border">
                  <span className="text-[10px] text-theme-muted font-semibold uppercase block">Memorias</span>
                  <span className="text-xl font-bold text-theme-main">{seccionActivaData.memorias.length}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
              <div className="p-3.5 rounded-xl bg-theme-base border border-theme-border text-center">
                <p className="text-[10px] font-semibold text-theme-muted uppercase">Presupuesto Formulado</p>
                <p className="text-lg font-bold text-theme-main mt-0.5">
                  {formatMoney(seccionActivaData.total_presupuestado)}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-200/80 dark:bg-rose-950/30 dark:border-rose-800/60 text-center">
                <p className="text-[10px] font-semibold text-rose-700 dark:text-rose-400 uppercase">Gasto Ejecutado</p>
                <p className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                  {formatMoney(seccionActivaData.total_gastado)}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80 dark:bg-emerald-950/30 dark:border-emerald-800/60 text-center">
                <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase">Saldo Disponible</p>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {formatMoney(seccionActivaData.total_disponible)}
                </p>
              </div>
            </div>
          </div>

          {/* Sub-Tabs de la Sección */}
          <div className="flex border-b border-theme-border gap-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => onTabSeccionChange('presupuesto')}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                tabSeccion === 'presupuesto'
                  ? 'border-theme-primary text-theme-main font-extrabold'
                  : 'border-transparent text-theme-muted hover:text-theme-main'
              }`}
            >
              <Layers size={14} /> Estructura POA y Memorias ({seccionActivaData.memorias.length})
            </button>
            <button
              type="button"
              onClick={() => onTabSeccionChange('gastos')}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                tabSeccion === 'gastos'
                  ? 'border-rose-500 text-rose-600 font-extrabold'
                  : 'border-transparent text-theme-muted hover:text-theme-main'
              }`}
            >
              <Receipt size={14} /> Libro Auxiliar de Gastos ({todosLosGastosSeccion.length})
            </button>
            <button
              type="button"
              onClick={() => onTabSeccionChange('partidas')}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                tabSeccion === 'partidas'
                  ? 'border-theme-primary text-theme-main font-extrabold'
                  : 'border-transparent text-theme-muted hover:text-theme-main'
              }`}
            >
              <BookOpenText size={14} /> Consolidado por Partidas ({partidasConsolidadas.length})
            </button>
          </div>

          {/* SUB-TAB 1: MEMORIAS */}
          {tabSeccion === 'presupuesto' && (
            <MemoriasSectionList
              memorias={seccionActivaData.memorias}
              expandedMemorias={expandedMemorias}
              onToggleMemoria={onToggleMemoria}
              expandedPartidas={expandedPartidas}
              onTogglePartida={onTogglePartida}
              formatMoney={formatMoney}
              getBadgeEstado={getBadgeEstado}
            />
          )}

          {/* SUB-TAB 2: GASTOS */}
          {tabSeccion === 'gastos' && (
            <GastosSectionTable
              gastos={todosLosGastosSeccion}
              formatMoney={formatMoney}
            />
          )}

          {/* SUB-TAB 3: PARTIDAS */}
          {tabSeccion === 'partidas' && (
            <PartidasSectionTable
              partidas={partidasFiltradas}
              busquedaPartida={busquedaPartida}
              onBusquedaPartidaChange={onBusquedaPartidaChange}
              expandedPartidasConsolidadas={expandedPartidasConsolidadas}
              onTogglePartidaConsolidada={onTogglePartidaConsolidada}
              onOpenReportePartidas={onOpenReportePartidas}
              totalPartidasPresupuestado={totalPartidasPresupuestado}
              totalPartidasAgregado={totalPartidasAgregado}
              totalPartidasQuitado={totalPartidasQuitado}
              totalPartidasEjecutado={totalPartidasEjecutado}
              totalPartidasDisponible={totalPartidasDisponible}
              pctPartidasGlobal={pctPartidasGlobal}
              formatMoney={formatMoney}
              nombreMesDesde={nombreMesDesde}
              nombreMesHasta={nombreMesHasta}
              areaNombre={detalleArea?.area_nombre}
              areaCodigo={detalleArea?.area_codigo}
              gestionAnio={gestionAnio}
            />
          )}
        </div>
      )}
    </div>
  );
};
