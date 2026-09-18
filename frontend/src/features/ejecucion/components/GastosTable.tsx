import React, { useState } from 'react';
import { Gasto } from '../../../services/presupuestoService';
import { DataTable, Column } from '../../../components/commons';
import { formatMoney, formatDate } from '../../../utils/formatters';
import { Edit3, Receipt } from 'lucide-react';

interface GastosTableProps {
  gastos: Gasto[];
  loading: boolean;
  canManage: boolean;
  onEdit: (gasto: Gasto) => void;
  onDelete?: (gasto: Gasto) => void;
}

export const GastosTable: React.FC<GastosTableProps> = ({
  gastos,
  loading,
  canManage,
  onEdit,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return gastos.slice(start, start + PAGE_SIZE);
  }, [gastos, currentPage]);

  const columns: Column<Gasto>[] = [
    {
      header: 'Fecha',
      width: '110px',
      render: (g) => (
        <span className="font-mono text-xs text-theme-main">
          {formatDate(g.fecha_gasto)}
        </span>
      ),
    },
    {
      header: 'Nº Comprobante',
      width: '140px',
      render: (g) => (
        <span className="font-mono font-bold text-xs bg-theme-base px-2 py-0.5 rounded border border-theme-border text-theme-main inline-block">
          {g.comprobante_num || 'S/N'}
        </span>
      ),
    },
    {
      header: 'Área / Sección',
      width: '190px',
      render: (g) => (
        <div className="min-w-0">
          <p className="text-[11px] text-theme-muted truncate">
            {g.area_nombre || '-'}
          </p>
        </div>
      ),
    },
    {
      header: 'Partida',
      width: '100px',
      render: (g) => (
        <div className="min-w-0">
          <span className="font-mono font-bold text-xs text-theme-primary">
            {g.partida_codigo || 'Partida'}
          </span>
          <p className="text-[11px] text-theme-muted truncate">
            {g.partida_nombre || 'Sin nombre'}
          </p>
        </div>
      ),
    },
    {
      header: 'Memoria POA',
      width: '160px',
      render: (g) => (
        <span className="font-mono font-bold text-xs text-theme-main bg-theme-base/80 px-2.5 py-1 rounded-md border border-theme-border inline-block whitespace-nowrap">
          {g.memoria_codigo}
        </span>
      ),
    },
    {
      header: 'Observación / Detalle',
      render: (g) => (
        <p className="text-xs text-theme-main line-clamp-2 max-w-sm">
          {g.observacion || '-'}
        </p>
      ),
    },
    {
      header: <span className="text-rose-600 dark:text-rose-400 font-bold">Monto Ejecutado</span>,
      align: 'right',
      width: '180px',
      render: (g) => (
        <span className="font-mono font-bold text-sm text-rose-600 dark:text-rose-400 whitespace-nowrap">
          {formatMoney(g.monto_ejecutado)}
        </span>
      ),
    },
    ...(canManage
      ? [
        {
          header: 'Acciones',
          align: 'center' as const,
          width: '80px',
          render: (g: Gasto) => (
            <div className="flex items-center justify-center">
              <button
                onClick={() => onEdit(g)}
                className="p-1.5 text-theme-muted hover:text-indigo-600 hover:bg-indigo-500/10 rounded-lg transition-colors"
                title="Editar Gasto"
              >
                <Edit3 size={15} />
              </button>
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
      keyExtractor={(g) => g.id}
      loading={loading}
      minWidth="1050px"
      emptyMessage="No se registraron gastos ejecutados con los filtros seleccionados."
      emptyIcon={<Receipt size={36} className="text-rose-500/40" />}
      pagination={{
        currentPage,
        pageSize: PAGE_SIZE,
        totalItems: gastos.length,
        onPageChange: setCurrentPage,
      }}
    />
  );
};
