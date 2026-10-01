import React, { useState } from 'react';
import {
  BookOpenText,
  Search,
  Printer,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { PartidaConsolidada } from '../types/presupuestos.types';
import { Pagination } from '../../../components/commons/Pagination';

interface PartidasSectionTableProps {
  partidas: PartidaConsolidada[];
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
  formatMoney: (val: string | number) => string;
  nombreMesDesde: string;
  nombreMesHasta: string;
  areaNombre?: string;
  areaCodigo?: string;
  gestionAnio?: number;
}

export const PartidasSectionTable: React.FC<PartidasSectionTableProps> = ({
  partidas,
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
  areaNombre,
  areaCodigo,
  gestionAnio,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  const pagedPartidas = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return partidas.slice(start, start + pageSize);
  }, [partidas, currentPage]);

  return (
    <div className="space-y-4">
      {/* Barra de Filtros de Partidas */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-theme-surface p-4 rounded-xl border border-theme-border shadow-sm">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-theme-primary/10 text-theme-primary">
            <BookOpenText size={18} />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-theme-main">
              Lista Consolidada por Orden de Partidas
            </h3>
            <p className="text-[11px] text-theme-muted">
              Gestión {gestionAnio} • {areaNombre} ({areaCodigo})
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Búsqueda */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted" />
            <input
              type="text"
              placeholder="Buscar partida..."
              value={busquedaPartida}
              onChange={(e) => {
                onBusquedaPartidaChange(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 pr-3 py-1.5 text-xs rounded-xl bg-theme-base border border-theme-border text-theme-main placeholder:text-theme-muted focus:outline-none focus:border-theme-primary w-full sm:w-44"
            />
            {busquedaPartida && (
              <button
                type="button"
                onClick={() => onBusquedaPartidaChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-main text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Botón Imprimir Partidas */}
          <button
            type="button"
            onClick={onOpenReportePartidas}
            className="px-3 py-1.5 rounded-xl bg-theme-primary text-theme-primaryText text-xs font-bold hover:bg-theme-primaryHover transition-all flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
            title="Imprimir reporte oficial de partidas presupuestarias"
          >
            <Printer size={14} />
            Imprimir Partidas
          </button>
        </div>
      </div>

      {/* Resumen KPIs de Partidas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        <div className="card p-3 text-center">
          <span className="text-[9px] font-bold text-theme-muted uppercase block">Total Presupuestado</span>
          <p className="text-sm font-bold text-theme-main mt-0.5">{formatMoney(totalPartidasPresupuestado)}</p>
        </div>
        <div className="card p-3 text-center bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-800/40">
          <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 uppercase block">Agregado (+)</span>
          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">+{formatMoney(totalPartidasAgregado)}</p>
        </div>
        <div className="card p-3 text-center bg-rose-50/40 dark:bg-rose-950/20 border-rose-200/60 dark:border-rose-800/40">
          <span className="text-[9px] font-bold text-rose-700 dark:text-rose-400 uppercase block">Quitado (-)</span>
          <p className="text-sm font-bold text-rose-600 dark:text-rose-400 mt-0.5">-{formatMoney(totalPartidasQuitado)}</p>
        </div>
        <div className="card p-3 text-center bg-rose-50/30 dark:bg-rose-950/15 border-rose-200/50 dark:border-rose-800/30">
          <span className="text-[9px] font-bold text-rose-700 dark:text-rose-400 uppercase block">
            Ejecutado ({nombreMesDesde.slice(0, 3)} - {nombreMesHasta.slice(0, 3)})
          </span>
          <p className="text-sm font-bold text-rose-600 dark:text-rose-400 mt-0.5">{formatMoney(totalPartidasEjecutado)}</p>
        </div>
        <div className="card p-3 text-center bg-emerald-50/50 dark:bg-emerald-950/25 border-emerald-200/70 dark:border-emerald-800/50">
          <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 uppercase block">Disponible</span>
          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{formatMoney(totalPartidasDisponible)}</p>
        </div>
        <div className="card p-3 text-center">
          <span className="text-[9px] font-bold text-theme-muted uppercase block">% Ejecución</span>
          <p className="text-sm font-bold text-theme-main mt-0.5">{pctPartidasGlobal}%</p>
        </div>
      </div>

      {/* Tabla Principal de Partidas */}
      <div className="card overflow-hidden bg-theme-surface flex flex-col shadow-sm">
        {partidas.length === 0 ? (
          <div className="p-12 text-center text-theme-muted space-y-2">
            <BookOpenText size={36} className="mx-auto opacity-30 text-theme-primary" />
            <p className="font-semibold text-sm">
              {busquedaPartida ? 'No se encontraron partidas para la búsqueda.' : 'Sin partidas configuradas en esta sección.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-theme-base/60 text-[10px] font-bold uppercase tracking-wider text-theme-muted border-b border-theme-border">
                    <th className="py-3 px-3 text-center w-10">Nº</th>
                    <th className="py-3 px-3 text-center w-24">Nº Partida</th>
                    <th className="py-3 px-4">Nombre de la Partida</th>
                    <th className="py-3 px-3 text-right">Total Presupuestado</th>
                    <th className="py-3 px-3 text-right text-emerald-700 dark:text-emerald-400">Agregado (+)</th>
                    <th className="py-3 px-3 text-right text-rose-700 dark:text-rose-400">Quitado (-)</th>
                    <th className="py-3 px-3 text-right text-rose-600 dark:text-rose-400">
                      Ejecutado ({nombreMesDesde.slice(0, 3)} - {nombreMesHasta.slice(0, 3)})
                    </th>
                    <th className="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400">Disponible</th>
                    <th className="py-3 px-3 text-center w-20">Porcentaje</th>
                    <th className="py-3 px-2 text-center w-12">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-border">
                  {pagedPartidas.map((partida, idx) => {
                    const isExp = expandedPartidasConsolidadas.has(partida.partida_codigo);
                    const globalIdx = (currentPage - 1) * pageSize + idx + 1;

                    return (
                      <React.Fragment key={`partida-${partida.partida_codigo}`}>
                        <tr
                          onClick={() => onTogglePartidaConsolidada(partida.partida_codigo)}
                          className="hover:bg-theme-border/20 transition-colors cursor-pointer"
                        >
                          <td className="py-3 px-3 text-center font-bold text-theme-muted text-[11px]">
                            {globalIdx}
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-theme-primary text-xs">
                            {partida.partida_codigo}
                          </td>
                          <td className="py-3 px-4 font-semibold text-theme-main text-xs">
                            {partida.partida_nombre}
                          </td>
                          <td className="py-3 px-3 text-right font-medium text-theme-main text-xs">
                            {formatMoney(partida.total_presupuestado)}
                          </td>
                          <td className="py-3 px-3 text-right font-medium text-emerald-600 dark:text-emerald-400 text-xs">
                            {partida.total_agregado > 0 ? `+${formatMoney(partida.total_agregado)}` : '0,00 Bs'}
                          </td>
                          <td className="py-3 px-3 text-right font-medium text-rose-600 dark:text-rose-400 text-xs">
                            {partida.total_quitado > 0 ? `-${formatMoney(partida.total_quitado)}` : '0,00 Bs'}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-rose-600 dark:text-rose-400 text-xs">
                            {formatMoney(partida.total_ejecutado)}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                            {formatMoney(partida.total_disponible)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                partida.porcentaje_ejecucion > 80
                                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                  : partida.porcentaje_ejecucion > 50
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                  : 'bg-theme-border text-theme-main'
                              }`}
                            >
                              {partida.porcentaje_ejecucion}%
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center text-theme-muted">
                            {isExp ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                          </td>
                        </tr>

                        {/* Desglose de Memorias al Expandir la Partida */}
                        {isExp && (
                          <tr className="bg-theme-base/30">
                            <td colSpan={10} className="p-4 border-l-4 border-theme-primary/60">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-bold uppercase text-theme-muted">
                                    Memorias de Cálculo Asociadas a la Partida {partida.partida_codigo}:
                                  </span>
                                  <span className="text-[10px] text-theme-muted font-bold">
                                    {partida.memorias.length} memoria(s)
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {partida.memorias.map((mem) => (
                                    <div
                                      key={`mem-${mem.memoria_id}`}
                                      className="p-3 rounded-xl bg-theme-surface border border-theme-border text-xs space-y-2 shadow-sm"
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="font-mono font-bold text-theme-primary text-xs">
                                          {mem.memoria_codigo}
                                        </span>
                                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                          Disp: {formatMoney(mem.disponible)}
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-theme-muted line-clamp-2">
                                        {mem.justificacion}
                                      </p>
                                      <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-theme-border/60 text-[10px]">
                                        <div>
                                          <span className="text-theme-muted block">Presupuesto:</span>
                                          <span className="font-bold text-theme-main">
                                            {formatMoney(mem.presupuestado)}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-theme-muted block">Traspasos:</span>
                                          <span className="font-bold text-blue-600 dark:text-blue-400">
                                            +{formatMoney(mem.agregado)} / -{formatMoney(mem.quitado)}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-theme-muted block">Ejecutado:</span>
                                          <span className="font-bold text-rose-600 dark:text-rose-400">
                                            {formatMoney(mem.ejecutado)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginación de Partidas */}
            <Pagination
              currentPage={currentPage}
              totalItems={partidas.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              itemLabel="partidas"
            />
          </div>
        )}
      </div>
    </div>
  );
};
