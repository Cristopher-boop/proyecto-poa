import React from 'react';
import { DataTable, Column } from '../../../components/commons/DataTable';
import { StatusBadge } from '../../../components/commons/StatusBadge';
import {
  ModificacionRow,
  MatrizTraspasoRow,
  SubReportModificacion,
} from '../types/reportes.types';
import { ArrowRightLeft, TrendingUp, FileText } from 'lucide-react';

interface ReportesModificacionesViewProps {
  subReport: SubReportModificacion;
  historialModificaciones: ModificacionRow[];
  matrizTraspasos: MatrizTraspasoRow[];
  incrementosPresupuestarios: ModificacionRow[];
  formatMoney: (val: number | string | undefined | null) => string;
  loading: boolean;
}

export const ReportesModificacionesView: React.FC<ReportesModificacionesViewProps> = ({
  subReport,
  historialModificaciones,
  matrizTraspasos,
  incrementosPresupuestarios,
  formatMoney,
  loading,
}) => {
  // Columnas para Historial de Modificaciones
  const columnsHistorial: Column<ModificacionRow>[] = [
    {
      header: 'Código / Fecha',
      accessor: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-theme-primary/10 text-theme-primary flex items-center justify-center font-bold text-xs shrink-0">
            <ArrowRightLeft size={15} />
          </div>
          <div>
            <span className="font-mono text-xs font-bold text-theme-main block">
              {row.codigo}
            </span>
            <span className="text-[10px] text-theme-muted">{row.fecha}</span>
          </div>
        </div>
      ),
      minWidth: '150px',
    },
    {
      header: 'Tipo de Movimiento',
      accessor: (row) => (
        <span className="px-2 py-0.5 rounded-md bg-theme-base border border-theme-border text-xs font-semibold text-theme-main">
          {row.tipoDisplay}
        </span>
      ),
      minWidth: '160px',
    },
    {
      header: 'Gerencia Solicitante',
      accessor: (row) => (
        <div>
          <span className="font-semibold text-theme-main text-xs block">
            {row.areaSolicitante}
          </span>
          {row.areaCedente && (
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium block">
              Cedente: {row.areaCedente}
            </span>
          )}
        </div>
      ),
      minWidth: '190px',
    },
    {
      header: 'Justificación / Motivo',
      accessor: (row) => (
        <span className="text-xs text-theme-muted line-clamp-2 max-w-xs block" title={row.motivo}>
          {row.motivo}
        </span>
      ),
      minWidth: '220px',
    },
    {
      header: 'Monto Compensado',
      align: 'right',
      accessor: (row) => (
        <span className="text-xs font-bold text-theme-main">
          {formatMoney(row.monto)}
        </span>
      ),
      minWidth: '140px',
    },
    {
      header: 'Estado',
      align: 'center',
      accessor: (row) => <StatusBadge status={row.estado} label={row.estadoDisplay} size="sm" />,
      minWidth: '140px',
    },
  ];

  // Columnas para Matriz de Traspasos Origen -> Destino
  const columnsTraspasos: Column<MatrizTraspasoRow>[] = [
    {
      header: 'Código / Fecha',
      accessor: (row) => (
        <div>
          <span className="font-mono text-xs font-bold text-theme-main block">
            {row.modificacionCodigo}
          </span>
          <span className="text-[10px] text-theme-muted">{row.fecha}</span>
        </div>
      ),
      minWidth: '130px',
    },
    {
      header: 'Origen (Cede Fondos)',
      accessor: (row) => (
        <div className="p-1.5 rounded-lg bg-rose-500/5 border border-rose-500/15">
          <span className="text-xs font-semibold text-rose-700 dark:text-rose-400 block truncate">
            {row.origenArea}
          </span>
          <span className="text-[10px] text-theme-muted block truncate">
            {row.origenPartida}
          </span>
        </div>
      ),
      minWidth: '200px',
    },
    {
      header: 'Destino (Recibe Fondos)',
      accessor: (row) => (
        <div className="p-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 block truncate">
            {row.destinoArea}
          </span>
          <span className="text-[10px] text-theme-muted block truncate">
            {row.destinoPartida}
          </span>
        </div>
      ),
      minWidth: '200px',
    },
    {
      header: 'Monto Traspaso',
      align: 'right',
      accessor: (row) => (
        <span className="text-xs font-bold text-theme-main">
          {formatMoney(row.monto)}
        </span>
      ),
      minWidth: '130px',
    },
    {
      header: 'Motivo Operativo',
      accessor: (row) => (
        <span className="text-xs text-theme-muted line-clamp-2 block" title={row.motivo}>
          {row.motivo}
        </span>
      ),
      minWidth: '200px',
    },
  ];

  if (subReport === 'matriz_traspasos') {
    const totalTraspasado = matrizTraspasos.reduce((a, b) => a + b.monto, 0);

    return (
      <div className="space-y-4">
        <DataTable
          columns={columnsTraspasos}
          data={matrizTraspasos}
          keyExtractor={(row) => row.id}
          loading={loading}
          emptyMessage="No se identificaron movimientos de traspaso entre partidas en el periodo."
        />

        {!loading && matrizTraspasos.length > 0 && (
          <div className="card p-4 border border-theme-border bg-theme-base/60 rounded-2xl flex flex-wrap items-center justify-between gap-4 text-xs font-bold shadow-xs">
            <span className="text-theme-main uppercase tracking-wider">
              TOTAL COMPENSADO EN TRASPASOS ({matrizTraspasos.length} MOVIMIENTOS):
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 text-sm">
              {formatMoney(totalTraspasado)}
            </span>
          </div>
        )}
      </div>
    );
  }

  const dataset = subReport === 'incrementos' ? incrementosPresupuestarios : historialModificaciones;
  const totalMonto = dataset.reduce((a, b) => a + b.monto, 0);

  return (
    <div className="space-y-4">
      <DataTable
        columns={columnsHistorial}
        data={dataset}
        keyExtractor={(row) => row.id}
        loading={loading}
        emptyMessage={
          subReport === 'incrementos'
            ? 'No se registraron incrementos presupuestarios en la gestión seleccionada.'
            : 'No se encontraron modificaciones presupuestarias registradas.'
        }
      />

      {!loading && dataset.length > 0 && (
        <div className="card p-4 border border-theme-border bg-theme-base/60 rounded-2xl flex flex-wrap items-center justify-between gap-4 text-xs font-bold shadow-xs">
          <span className="text-theme-main uppercase tracking-wider">
            TOTAL EN MODIFICACIONES ({dataset.length} REGISTROS):
          </span>
          <span className="text-theme-primary text-sm font-bold">
            {formatMoney(totalMonto)}
          </span>
        </div>
      )}
    </div>
  );
};
