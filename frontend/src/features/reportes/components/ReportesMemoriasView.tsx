import React from 'react';
import { DataTable, Column } from '../../../components/commons/DataTable';
import { StatusBadge } from '../../../components/commons/StatusBadge';
import {
  MemoriaEstadoRow,
  ItemRequerimientoRow,
  SubReportMemoria,
} from '../types/reportes.types';
import { BookOpenText, ShoppingCart, CheckCircle2 } from 'lucide-react';

interface ReportesMemoriasViewProps {
  subReport: SubReportMemoria;
  memoriasPorEstado: MemoriaEstadoRow[];
  itemsRequerimientos: ItemRequerimientoRow[];
  itemsContrataciones: ItemRequerimientoRow[];
  formatMoney: (val: number | string | undefined | null) => string;
  loading: boolean;
}

export const ReportesMemoriasView: React.FC<ReportesMemoriasViewProps> = ({
  subReport,
  memoriasPorEstado,
  itemsRequerimientos,
  itemsContrataciones,
  formatMoney,
  loading,
}) => {
  // Columnas para Resumen de Estados por Gerencia
  const columnsEstados: Column<MemoriaEstadoRow>[] = [
    {
      header: 'Gerencia / Área',
      accessor: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-theme-primary/10 text-theme-primary flex items-center justify-center font-bold text-xs shrink-0">
            <BookOpenText size={15} />
          </div>
          <div>
            <span className="font-semibold text-theme-main text-xs block">
              {row.areaNombre}
            </span>
            <span className="text-[10px] text-theme-muted uppercase tracking-wider">
              {row.totalMemorias} MCs formuladas
            </span>
          </div>
        </div>
      ),
      minWidth: '220px',
    },
    {
      header: 'Borrador',
      align: 'center',
      accessor: (row) => (
        <span className="text-xs font-medium text-gray-500">
          {row.borrador || '—'}
        </span>
      ),
      minWidth: '80px',
    },
    {
      header: 'Pend. Gerencia',
      align: 'center',
      accessor: (row) => (
        <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
          {row.pendienteGerencia || '—'}
        </span>
      ),
      minWidth: '100px',
    },
    {
      header: 'Aprob. Gerencia',
      align: 'center',
      accessor: (row) => (
        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
          {row.aprobadoGerencia || '—'}
        </span>
      ),
      minWidth: '100px',
    },
    {
      header: 'En Planificación',
      align: 'center',
      accessor: (row) => (
        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
          {row.pendientePlanificacion || '—'}
        </span>
      ),
      minWidth: '110px',
    },
    {
      header: 'Aprob. Finanzas',
      align: 'center',
      accessor: (row) => (
        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
          {row.aprobadoFinanzas || '0'}
        </span>
      ),
      minWidth: '110px',
    },
    {
      header: 'Rechazadas',
      align: 'center',
      accessor: (row) => (
        <span className="text-xs font-medium text-rose-600 dark:text-rose-400">
          {row.rechazado || '—'}
        </span>
      ),
      minWidth: '90px',
    },
    {
      header: 'Monto Formulado',
      align: 'right',
      accessor: (row) => (
        <span className="text-xs font-semibold text-theme-main">
          {formatMoney(row.montoFormulado)}
        </span>
      ),
      minWidth: '130px',
    },
    {
      header: 'Monto Aprobado',
      align: 'right',
      accessor: (row) => (
        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
          {formatMoney(row.montoAprobadoFinanzas)}
        </span>
      ),
      minWidth: '130px',
    },
  ];

  // Columnas para Ítems y Requerimientos (Sin códigos innecesarios)
  const columnsItems: Column<ItemRequerimientoRow>[] = [
    {
      header: 'Descripción del Requerimiento',
      accessor: (row) => (
        <div>
          <span className="font-semibold text-theme-main text-xs block leading-snug">
            {row.descripcion}
          </span>
          <span className="text-[10px] text-theme-muted flex items-center gap-1.5 mt-0.5">
            <span>{row.areaNombre}</span>
            <span>•</span>
            <span>{row.seccionNombre}</span>
            {row.esContratacion && (
              <span className="px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold uppercase text-[9px]">
                PAC / Compra
              </span>
            )}
          </span>
        </div>
      ),
      minWidth: '280px',
    },
    {
      header: 'Partida Presupuestaria',
      accessor: (row) => (
        <div>
          <span className="font-semibold text-theme-main text-xs block">
            {row.partidaNombre}
          </span>
          <span className="font-mono text-[10px] text-theme-primary font-bold">
            Partida {row.partidaCodigo}
          </span>
        </div>
      ),
      minWidth: '180px',
    },
    {
      header: 'U. Medida',
      align: 'center',
      accessor: (row) => (
        <span className="text-xs text-theme-muted uppercase">{row.unidadMedida}</span>
      ),
      minWidth: '85px',
    },
    {
      header: 'Cant.',
      align: 'center',
      accessor: (row) => (
        <span className="text-xs font-semibold text-theme-main">{row.cantidad}</span>
      ),
      minWidth: '65px',
    },
    {
      header: 'Precio Unitario',
      align: 'right',
      accessor: (row) => (
        <span className="text-xs text-theme-muted">{formatMoney(row.precioUnitario)}</span>
      ),
      minWidth: '110px',
    },
    {
      header: 'Total Programado',
      align: 'right',
      accessor: (row) => (
        <span className="text-xs font-bold text-theme-main">
          {formatMoney(row.precioTotal)}
        </span>
      ),
      minWidth: '125px',
    },
    {
      header: 'Periodo / Mes',
      align: 'center',
      accessor: (row) => (
        <span className="text-[11px] font-medium text-theme-muted">
          {row.mesRequerido || 'Anual'}
        </span>
      ),
      minWidth: '100px',
    },
    {
      header: 'Estado Gasto',
      align: 'center',
      accessor: (row) => <StatusBadge status={row.estadoGasto} size="sm" />,
      minWidth: '120px',
    },
  ];

  if (subReport === 'estados') {
    const totalFormulado = memoriasPorEstado.reduce((a, b) => a + b.montoFormulado, 0);
    const totalAprobado = memoriasPorEstado.reduce((a, b) => a + b.montoAprobadoFinanzas, 0);

    return (
      <div className="space-y-4">
        <DataTable
          columns={columnsEstados}
          data={memoriasPorEstado}
          keyExtractor={(row) => row.areaId}
          loading={loading}
          emptyMessage="No se encontraron memorias de cálculo registradas en la gestión."
        />

        {!loading && memoriasPorEstado.length > 0 && (
          <div className="card p-4 border border-theme-border bg-theme-base/60 rounded-2xl flex flex-wrap items-center justify-between gap-4 text-xs font-bold shadow-xs">
            <span className="text-theme-main uppercase tracking-wider">
              TOTALES POR CIRCUITO DE APROBACIÓN:
            </span>
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <span className="text-theme-muted font-normal block text-[10px]">Total Formulado:</span>
                <span className="text-theme-main">{formatMoney(totalFormulado)}</span>
              </div>
              <div>
                <span className="text-theme-muted font-normal block text-[10px]">Aprobado Finanzas:</span>
                <span className="text-emerald-600 dark:text-emerald-400">{formatMoney(totalAprobado)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const itemsData = subReport === 'contrataciones_pac' ? itemsContrataciones : itemsRequerimientos;
  const totalItemsMonto = itemsData.reduce((a, b) => a + b.precioTotal, 0);

  return (
    <div className="space-y-4">
      <DataTable
        columns={columnsItems}
        data={itemsData}
        keyExtractor={(row) => row.id}
        loading={loading}
        emptyMessage={
          subReport === 'contrataciones_pac'
            ? 'No se identificaron requerimientos catalogados para el Plan Anual de Contrataciones (PAC).'
            : 'No se encontraron requerimientos registrados en las memorias de cálculo.'
        }
      />

      {!loading && itemsData.length > 0 && (
        <div className="card p-4 border border-theme-border bg-theme-base/60 rounded-2xl flex flex-wrap items-center justify-between gap-4 text-xs font-bold shadow-xs">
          <span className="text-theme-main uppercase tracking-wider">
            TOTAL PROGRAMADO ({itemsData.length} ÍTEMS):
          </span>
          <span className="text-emerald-600 dark:text-emerald-400 text-sm">
            {formatMoney(totalItemsMonto)}
          </span>
        </div>
      )}
    </div>
  );
};
