import React, { useState } from 'react';
import { DataTable, Column, StatusBadge, Button } from '../../../components/commons';
import { formatMoney, formatDate } from '../../../utils/formatters';
import { Plus, BookOpen, ChevronRight, ChevronDown, Receipt } from 'lucide-react';

interface MemoriaItem {
  memoriaId: number;
  codigo: string;
  areaId?: number | string;
  areaNombre: string;
  seccionNombre: string;
  partidasString: string;
  partidaNombre: string;
  justificacion: string;
  montoTotal: number;
  montoGastado: number;
  saldoDisponible: number;
  estadoGasto: string;
  gastosList: any[];
}

interface MemoriasSaldoTableProps {
  memorias: MemoriaItem[];
  loading: boolean;
  canExecuteGasto: boolean;
  onSelectMemoria: (memoriaId: number) => void;
  canSolicitarGasto?: boolean;
  onSolicitarGasto?: (memoriaId: number) => void;
}

export const MemoriasSaldoTable: React.FC<MemoriasSaldoTableProps> = ({
  memorias,
  loading,
  canExecuteGasto,
  onSelectMemoria,
  canSolicitarGasto = false,
  onSolicitarGasto,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});
  const PAGE_SIZE = 10;

  React.useEffect(() => {
    setCurrentPage(1);
  }, [memorias.length]);

  const toggleRow = (memoriaId: number) => {
    setExpandedRows((prev) => ({
      ...prev,
      [memoriaId]: !prev[memoriaId],
    }));
  };

  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return memorias.slice(start, start + PAGE_SIZE);
  }, [memorias, currentPage]);

  const columns: Column<MemoriaItem>[] = [
    {
      header: '',
      width: '40px',
      align: 'center',
      render: (m) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleRow(m.memoriaId);
          }}
          className="p-1 rounded-lg hover:bg-theme-border/30 text-theme-muted hover:text-theme-main transition-colors"
          title={expandedRows[m.memoriaId] ? 'Contraer desglose' : 'Desplegar detalle y gastos'}
        >
          {expandedRows[m.memoriaId] ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </button>
      ),
    },
    {
      header: 'Memoria POA',
      width: '160px',
      render: (m) => (
        <span className="font-mono font-bold text-xs bg-theme-base px-2.5 py-1 rounded-md border border-theme-border text-theme-main inline-block whitespace-nowrap">
          {m.codigo}
        </span>
      ),
    },
    {
      header: 'Área / Sección',
      width: '180px',
      render: (m) => (
        <div className="min-w-0">
          <p className="text-[11px] text-theme-muted truncate">{m.areaNombre}</p>
        </div>
      ),
    },
    {
      header: 'Partida',
      width: '120px',
      render: (m) => (
        <div className="min-w-0">
          <span className="font-mono font-bold text-xs text-theme-primary truncate block">
            {m.partidasString || 'Partida'}
          </span>
          <p className="text-[11px] text-theme-muted truncate">{m.partidaNombre}</p>
        </div>
      ),
    },
    {
      header: 'Presupuestado',
      align: 'right',
      width: '160px',
      render: (m) => (
        <span className="font-mono font-semibold text-xs text-theme-main whitespace-nowrap">
          {formatMoney(m.montoTotal)}
        </span>
      ),
    },
    {
      header: <span className="text-rose-600 dark:text-rose-400 font-bold">Ejecutado</span>,
      align: 'right',
      width: '160px',
      render: (m) => (
        <span className="font-mono font-bold text-xs text-rose-600 dark:text-rose-400 whitespace-nowrap">
          {formatMoney(m.montoGastado)}
        </span>
      ),
    },
    {
      header: 'Saldo Disponible',
      align: 'right',
      width: '160px',
      render: (m) => (
        <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
          {formatMoney(m.saldoDisponible)}
        </span>
      ),
    },
    {
      header: 'Estado Gasto',
      align: 'center',
      width: '140px',
      render: (m) => <StatusBadge status={m.estadoGasto} size="sm" />,
    },
    ...(canExecuteGasto || canSolicitarGasto
      ? [
        {
          header: 'Acción',
          align: 'center' as const,
          width: '120px',
          render: (m: MemoriaItem) => (
            <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              {canSolicitarGasto && (
                <Button
                  variant="primary"
                  size="sm"
                  disabled={m.saldoDisponible <= 0}
                  onClick={() => onSolicitarGasto && onSolicitarGasto(m.memoriaId)}
                  icon={<Plus size={13} />}
                  className="text-[11px] py-1 px-2 font-bold shadow-sm"
                  title={m.saldoDisponible <= 0 ? 'Sin saldo disponible' : 'Solicitar gasto para esta memoria'}
                >
                  Solicitar
                </Button>
              )}
              {canExecuteGasto && (
                <Button
                  variant="danger"
                  size="sm"
                  disabled={m.saldoDisponible <= 0}
                  onClick={() => onSelectMemoria(m.memoriaId)}
                  icon={<Plus size={13} />}
                  className="text-[11px] py-1 px-2 font-bold shadow-sm"
                  title={m.saldoDisponible <= 0 ? 'Sin saldo disponible' : 'Imputar gasto contable'}
                >
                  + Gasto
                </Button>
              )}
            </div>
          ),
        },
      ]
      : []),
  ];

  return (
    <DataTable
      columns={columns}
      data={paginatedData}
      keyExtractor={(m) => m.memoriaId}
      loading={loading}
      minWidth="1200px"
      emptyMessage="No se encontraron memorias de cálculo aprobadas para imputación."
      emptyIcon={<BookOpen size={36} className="text-theme-muted/50" />}
      onRowClick={(m) => toggleRow(m.memoriaId)}
      renderExpandedRow={(m) => (
        <div className="space-y-3 bg-theme-base/60 p-4 rounded-xl border border-theme-border/70 text-xs animate-in fade-in duration-150">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-theme-border/60">
            <div className="flex items-center gap-2">
              <span className="font-bold text-theme-main font-mono text-sm">{m.codigo}</span>
              <span className="text-theme-muted">•</span>
              <span className="text-theme-muted">{m.areaNombre} - {m.seccionNombre}</span>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span>Presupuesto: <strong className="text-theme-main font-semibold">{formatMoney(m.montoTotal)}</strong></span>
              <span>Ejecutado: <strong className="text-rose-600 dark:text-rose-400 font-bold">{formatMoney(m.montoGastado)}</strong></span>
              <span>Disponible: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{formatMoney(m.saldoDisponible)}</strong></span>
            </div>
          </div>

          {m.justificacion && (
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-theme-muted">
                Justificación Técnica POA:
              </span>
              <p className="text-theme-main text-xs italic bg-theme-surface/70 p-2.5 rounded-lg border border-theme-border/50">
                {m.justificacion}
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-theme-muted flex items-center gap-1.5">
              <Receipt size={13} className="text-rose-500" />
              Gastos Ejecutados Imputados ({m.gastosList.length})
            </span>

            {m.gastosList.length === 0 ? (
              <div className="py-2.5 px-3 bg-theme-surface/60 rounded-lg border border-dashed border-theme-border text-center text-theme-muted text-xs">
                Esta memoria no tiene ejecuciones de gasto registradas. El saldo presupuestario se encuentra 100% disponible.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-theme-border bg-theme-surface shadow-xs">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-theme-border bg-theme-base/80 text-[10px] font-bold uppercase tracking-wider text-theme-muted">
                      <th className="py-2 px-3 text-left">Fecha</th>
                      <th className="py-2 px-3 text-left">Nº Comprobante</th>
                      <th className="py-2 px-3 text-left">Observación / Concepto</th>
                      <th className="py-2 px-3 text-right">Monto Ejecutado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-border/60">
                    {m.gastosList.map((g: any) => (
                      <tr key={g.id} className="hover:bg-theme-base/30">
                        <td className="py-2 px-3 font-mono text-theme-main whitespace-nowrap">{formatDate(g.fecha_gasto)}</td>
                        <td className="py-2 px-3 font-mono font-bold text-theme-main whitespace-nowrap">{g.comprobante_num || 'S/N'}</td>
                        <td className="py-2 px-3 text-theme-main max-w-md truncate">{g.observacion || '-'}</td>
                        <td className="py-2 px-3 font-mono font-bold text-rose-600 dark:text-rose-400 text-right whitespace-nowrap">{formatMoney(g.monto_ejecutado)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
      isRowExpanded={(m) => Boolean(expandedRows[m.memoriaId])}
      pagination={{
        currentPage,
        pageSize: PAGE_SIZE,
        totalItems: memorias.length,
        onPageChange: setCurrentPage,
      }}
    />
  );
};
