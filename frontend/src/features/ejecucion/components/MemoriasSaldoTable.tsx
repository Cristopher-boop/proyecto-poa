import React, { useState } from 'react';
import { DataTable, Column, StatusBadge, Button } from '../../../components/commons';
import { formatMoney } from '../../../utils/formatters';
import { Plus, BookOpen } from 'lucide-react';

interface MemoriaItem {
  memoriaId: number;
  codigo: string;
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
}

export const MemoriasSaldoTable: React.FC<MemoriasSaldoTableProps> = ({
  memorias,
  loading,
  canExecuteGasto,
  onSelectMemoria,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return memorias.slice(start, start + PAGE_SIZE);
  }, [memorias, currentPage]);

  const columns: Column<MemoriaItem>[] = [
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
    ...(canExecuteGasto
      ? [
        {
          header: 'Acción',
          align: 'center' as const,
          width: '110px',
          render: (m: MemoriaItem) => (
            <Button
              variant="danger"
              size="sm"
              disabled={m.saldoDisponible <= 0}
              onClick={() => onSelectMemoria(m.memoriaId)}
              icon={<Plus size={13} />}
              className="text-[11px] py-1 px-2.5 font-bold shadow-sm"
              title={m.saldoDisponible <= 0 ? 'Sin saldo disponible' : 'Imputar gasto'}
            >
              + Gasto
            </Button>
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
      pagination={{
        currentPage,
        pageSize: PAGE_SIZE,
        totalItems: memorias.length,
        onPageChange: setCurrentPage,
      }}
    />
  );
};
