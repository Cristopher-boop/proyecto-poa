import React, { useState } from 'react';
import { Receipt, Clock } from 'lucide-react';
import { GastoAuxiliarItem } from '../types/presupuestos.types';
import { Pagination } from '../../../components/commons/Pagination';

interface GastosSectionTableProps {
  gastos: GastoAuxiliarItem[];
  formatMoney: (val: string | number) => string;
}

export const GastosSectionTable: React.FC<GastosSectionTableProps> = ({
  gastos,
  formatMoney,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  const pagedGastos = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return gastos.slice(start, start + pageSize);
  }, [gastos, currentPage]);

  const totalGastado = React.useMemo(() => {
    return gastos.reduce((sum, g) => sum + parseFloat(g.monto || '0'), 0);
  }, [gastos]);

  return (
    <div className="card overflow-hidden bg-theme-surface flex flex-col shadow-sm">
      <div className="p-4 bg-theme-base/60 border-b border-theme-border flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-theme-main flex items-center gap-1.5">
          <Receipt size={14} className="text-rose-500" />
          Historial Detallado de Egresos y Gastos Ejecutados
        </h3>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
          {gastos.length} transacción(es)
        </span>
      </div>

      {gastos.length === 0 ? (
        <div className="p-12 text-center text-theme-muted space-y-2">
          <Receipt size={36} className="mx-auto opacity-30 text-rose-500" />
          <p className="font-semibold text-sm">Sin gastos registrados en esta sección.</p>
          <p className="text-xs max-w-sm mx-auto">
            Los gastos se registran desde el Módulo de Ejecución Presupuestaria imputando renglones aprobados.
          </p>
        </div>
      ) : (
        <div className="flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-theme-base/60 text-[10px] font-bold uppercase tracking-wider text-theme-muted border-b border-theme-border">
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Memoria</th>
                  <th className="py-3 px-4">Partida Presupuestaria</th>
                  <th className="py-3 px-4">Renglón Imputado</th>
                  <th className="py-3 px-4">N° Comprobante</th>
                  <th className="py-3 px-4">Justificación / Observación</th>
                  <th className="py-3 px-4 text-right">Monto Ejecutado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border">
                {pagedGastos.map((gasto, index) => (
                  <tr key={gasto.gasto_id || index} className="hover:bg-theme-border/20 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-mono font-bold text-[11px] text-theme-muted bg-theme-base px-2 py-0.5 rounded border border-theme-border/60">
                        <Clock size={11} />
                        {gasto.fecha_gasto}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-[11px] text-theme-main">
                      {gasto.memoria_codigo}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-mono font-bold text-[11px] text-theme-main">{gasto.partida_codigo}</p>
                      <p className="text-[10px] text-theme-muted line-clamp-1 truncate max-w-[150px]" title={gasto.partida_nombre}>
                        {gasto.partida_nombre}
                      </p>
                    </td>
                    <td className="py-3 px-4 font-medium text-theme-main max-w-xs">
                      {gasto.item_descripcion}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-mono font-bold px-2 py-0.5 rounded border border-theme-border bg-theme-base/40 text-theme-muted text-[11px]">
                        {gasto.comprobante || 'S/N'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-theme-muted max-w-xs truncate" title={gasto.observacion || ''}>
                      {gasto.observacion || '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-[13px] text-rose-600 dark:text-rose-400 whitespace-nowrap">
                      {formatMoney(gasto.monto)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-theme-base font-bold border-t border-theme-border text-xs">
                  <td colSpan={6} className="py-3 px-4 text-right uppercase text-theme-muted text-[10px]">
                    Total acumulado ejecutado:
                  </td>
                  <td className="py-3 px-4 text-right text-rose-600 dark:text-rose-400 text-sm">
                    {formatMoney(totalGastado)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Paginación de Gastos */}
          <Pagination
            currentPage={currentPage}
            totalItems={gastos.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            itemLabel="gastos ejecutados"
          />
        </div>
      )}
    </div>
  );
};
