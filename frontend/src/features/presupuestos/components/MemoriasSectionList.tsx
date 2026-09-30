import React, { useState } from 'react';
import {
  FileText,
  TrendingUp,
  TrendingDown,
  ChevronDown,
} from 'lucide-react';
import { MemoriaDetalleArea } from '../types/presupuestos.types';
import { Pagination } from '../../../components/commons/Pagination';

interface MemoriasSectionListProps {
  memorias: MemoriaDetalleArea[];
  expandedMemorias: Set<number>;
  onToggleMemoria: (id: number) => void;
  expandedPartidas: Set<string>;
  onTogglePartida: (key: string) => void;
  formatMoney: (val: string | number) => string;
  getBadgeEstado: (estado: string) => { className: string; label: string };
}

export const MemoriasSectionList: React.FC<MemoriasSectionListProps> = ({
  memorias,
  expandedMemorias,
  onToggleMemoria,
  expandedPartidas,
  onTogglePartida,
  formatMoney,
  getBadgeEstado,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 4;

  const pagedMemorias = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return memorias.slice(start, start + pageSize);
  }, [memorias, currentPage]);

  if (memorias.length === 0) {
    return (
      <div className="card p-10 text-center text-theme-muted space-y-2">
        <FileText size={36} className="mx-auto opacity-30 text-theme-muted" />
        <p className="font-semibold text-sm">No hay memorias de cálculo registradas en esta sección.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-theme-border bg-theme-surface p-4 flex flex-col space-y-4 shadow-sm">
      {/* Contenedor delimitado con scroll interno para evitar que se desborde la página */}
      <div className="max-h-[580px] overflow-y-auto pr-2 space-y-3 scrollbar-thin">
        {pagedMemorias.map((memoria) => {
          const memExpanded = expandedMemorias.has(memoria.memoria_id);
          const badge = getBadgeEstado(memoria.estado);

          return (
            <div
              key={memoria.memoria_id}
              className="card border border-theme-border overflow-hidden bg-theme-surface transition-all"
            >
              {/* Cabecera de Memoria */}
              <button
                type="button"
                onClick={() => onToggleMemoria(memoria.memoria_id)}
                className="w-full flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 text-left hover:bg-theme-border/20 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <FileText size={18} className="text-theme-muted shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-bold text-theme-main">
                        {memoria.memoria_codigo}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.className}`}>
                        {badge.label}
                      </span>
                      {Number(memoria.monto_entrante || 0) > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          <TrendingUp size={11} /> +{formatMoney(memoria.monto_entrante || 0)}
                        </span>
                      )}
                      {Number(memoria.monto_saliente || 0) > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                          <TrendingDown size={11} /> -{formatMoney(memoria.monto_saliente || 0)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-theme-muted mt-1 leading-normal line-clamp-2">
                      {memoria.justificacion}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 ml-auto sm:ml-0 shrink-0 text-right">
                  <div>
                    <p className="text-[10px] text-theme-muted font-semibold uppercase">PRESUPUESTADO</p>
                    <p className="text-sm font-bold text-theme-main">
                      {formatMoney(memoria.total_presupuestado)}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] text-theme-muted font-semibold uppercase">SALDO DISPONIBLE</p>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {formatMoney(memoria.total_disponible)}
                    </p>
                  </div>
                  <ChevronDown
                    size={18}
                    className={`text-theme-muted transition-transform ${
                      memExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </button>

              {/* Partidas y gastos asociados de la memoria */}
              {memExpanded && (
                <div className="border-t border-theme-border bg-theme-base/20 p-4 space-y-4">
                  {memoria.partidas.length === 0 ? (
                    <p className="text-xs text-theme-muted text-center py-2">
                      Sin partidas asignadas en esta memoria.
                    </p>
                  ) : (
                    memoria.partidas.map((partida) => {
                      const pKey = `${memoria.memoria_id}-${partida.partida_codigo}`;
                      const prtExpanded = expandedPartidas.has(pKey);
                      const pctP =
                        parseFloat(partida.presupuestado) > 0
                          ? Math.min(
                              100,
                              Math.round(
                                (parseFloat(partida.gastado) / parseFloat(partida.presupuestado)) *
                                  10000
                              ) / 100
                            )
                          : 0;

                      return (
                        <div
                          key={pKey}
                          className="border border-theme-border rounded-xl bg-theme-surface overflow-hidden shadow-sm"
                        >
                          {/* Cabecera Partida */}
                          <button
                            type="button"
                            onClick={() => onTogglePartida(pKey)}
                            className="w-full p-4 flex items-center justify-between gap-4 hover:bg-theme-border/20 transition-colors text-left cursor-pointer"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-theme-primary">
                                  {partida.partida_codigo}
                                </span>
                                <span className="text-xs font-semibold text-theme-main truncate">
                                  {partida.partida_nombre}
                                </span>
                              </div>

                              <div className="grid grid-cols-3 gap-2 mt-3 text-left">
                                <div>
                                  <span className="text-[10px] text-theme-muted uppercase font-semibold">
                                    Presupuesto
                                  </span>
                                  <p className="text-xs font-bold text-theme-main">
                                    {formatMoney(partida.presupuestado)}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-[10px] text-theme-muted text-rose-600 uppercase font-semibold">
                                    Ejecutado
                                  </span>
                                  <p className="text-xs font-bold text-rose-600 dark:text-rose-400">
                                    {formatMoney(partida.gastado)}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-[10px] text-theme-muted text-emerald-600 uppercase font-semibold">
                                    Disponible
                                  </span>
                                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                    {formatMoney(partida.disponible)}
                                  </p>
                                </div>
                              </div>

                              <div className="w-full bg-theme-border/60 rounded-full h-1.5 mt-2.5 overflow-hidden">
                                <div
                                  className={`h-full ${
                                    pctP > 80
                                      ? 'bg-rose-500'
                                      : pctP > 50
                                      ? 'bg-amber-500'
                                      : 'bg-theme-primary'
                                  }`}
                                  style={{ width: `${pctP}%` }}
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {partida.gastos_detalle.length > 0 && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                                  {partida.gastos_detalle.length} gasto(s)
                                </span>
                              )}
                              <ChevronDown
                                size={15}
                                className={`text-theme-muted transition-transform ${
                                  prtExpanded ? 'rotate-180' : ''
                               }`}
                              />
                            </div>
                          </button>

                          {/* Tabla de Gastos Ejecutados en Partida */}
                          {prtExpanded && (
                            <div className="border-t border-theme-border bg-theme-base/40">
                              {partida.gastos_detalle.length === 0 ? (
                                <p className="p-4 text-xs text-center text-theme-muted">
                                  Sin gastos registrados todavía.
                                </p>
                              ) : (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs border-collapse">
                                    <thead>
                                      <tr className="text-[10px] font-bold uppercase text-theme-muted border-b border-theme-border bg-theme-base/60">
                                        <th className="py-2 px-4 text-left">Fecha</th>
                                        <th className="py-2 px-4 text-left">Descripción del Ítem</th>
                                        <th className="py-2 px-4 text-left">N° Comprobante</th>
                                        <th className="py-2 px-4 text-left">Observación</th>
                                        <th className="py-2 px-4 text-right">Monto</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-theme-border">
                                      {partida.gastos_detalle.map((gasto) => (
                                        <tr key={gasto.gasto_id} className="hover:bg-theme-border/20 transition-colors">
                                          <td className="py-2.5 px-4 font-mono font-semibold text-theme-muted">
                                            {gasto.fecha_gasto}
                                          </td>
                                          <td className="py-2.5 px-4 text-theme-main font-medium">
                                            {gasto.item_descripcion}
                                          </td>
                                          <td className="py-2.5 px-4 font-mono font-bold text-theme-muted">
                                            {gasto.comprobante || 'S/N'}
                                          </td>
                                          <td className="py-2.5 px-4 text-theme-muted">
                                            {gasto.observacion || '—'}
                                          </td>
                                          <td className="py-2.5 px-4 text-right font-bold text-rose-600 dark:text-rose-400">
                                            {formatMoney(gasto.monto)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Paginación de Memorias */}
      <Pagination
        currentPage={currentPage}
        totalItems={memorias.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        itemLabel="memorias formuladas"
      />
    </div>
  );
};
