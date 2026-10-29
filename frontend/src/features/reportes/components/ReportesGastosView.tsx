import React from 'react';
import { DataTable, Column } from '../../../components/commons/DataTable';
import { StatusBadge } from '../../../components/commons/StatusBadge';
import {
  GastoReporteRow,
  CertificacionReporteRow,
  SemaforoAreaRow,
  SubReportGasto,
} from '../types/reportes.types';
import { TrendingDown, FileText, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

interface ReportesGastosViewProps {
  subReport: SubReportGasto;
  libroGastos: GastoReporteRow[];
  certificacionesPOA: CertificacionReporteRow[];
  semaforoEjecucion: SemaforoAreaRow[];
  formatMoney: (val: number | string | undefined | null) => string;
  loading: boolean;
}

export const ReportesGastosView: React.FC<ReportesGastosViewProps> = ({
  subReport,
  libroGastos,
  certificacionesPOA,
  semaforoEjecucion,
  formatMoney,
  loading,
}) => {
  // Columnas para Libro Diario de Gastos
  const columnsGastos: Column<GastoReporteRow>[] = [
    {
      header: 'Fecha / Comprobante',
      accessor: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-theme-primary/10 text-theme-primary flex items-center justify-center font-bold text-xs shrink-0">
            <TrendingDown size={15} />
          </div>
          <div>
            <span className="font-semibold text-theme-main text-xs block">
              {row.fecha}
            </span>
            <span className="font-mono text-[10px] text-theme-muted uppercase">
              {row.comprobante}
            </span>
          </div>
        </div>
      ),
      minWidth: '160px',
    },
    {
      header: 'Gerencia / Sección',
      accessor: (row) => (
        <div>
          <span className="font-semibold text-theme-main text-xs block">
            {row.areaNombre}
          </span>
          <span className="text-[10px] text-theme-muted">{row.seccionNombre}</span>
        </div>
      ),
      minWidth: '180px',
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
      header: 'Concepto / Glosa',
      accessor: (row) => (
        <span className="text-xs text-theme-muted line-clamp-2 block" title={row.concepto}>
          {row.concepto}
        </span>
      ),
      minWidth: '220px',
    },
    {
      header: 'Monto Ejecutado',
      align: 'right',
      accessor: (row) => (
        <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
          {formatMoney(row.monto)}
        </span>
      ),
      minWidth: '130px',
    },
    {
      header: 'Registrado Por',
      accessor: (row) => (
        <span className="text-xs text-theme-muted truncate block">
          {row.registradoPor}
        </span>
      ),
      minWidth: '140px',
    },
  ];

  // Columnas para Certificaciones POA
  const columnsCerts: Column<CertificacionReporteRow>[] = [
    {
      header: 'Nº Certificación / Fecha',
      accessor: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-theme-primary/10 text-theme-primary flex items-center justify-center font-bold text-xs shrink-0">
            <FileText size={15} />
          </div>
          <div>
            <span className="font-mono text-xs font-bold text-theme-main block">
              {row.codigo}
            </span>
            <span className="text-[10px] text-theme-muted">{row.fecha}</span>
          </div>
        </div>
      ),
      minWidth: '170px',
    },
    {
      header: 'Unidad Solicitante',
      accessor: (row) => (
        <div>
          <span className="font-semibold text-theme-main text-xs block">
            {row.areaNombre}
          </span>
          <span className="text-[10px] text-theme-muted block truncate">
            {row.solicitante}
          </span>
        </div>
      ),
      minWidth: '180px',
    },
    {
      header: 'Objeto del Gasto',
      accessor: (row) => (
        <div>
          <span className="text-xs text-theme-muted line-clamp-2 block" title={row.concepto}>
            {row.concepto}
          </span>
          {row.esContratacion && (
            <span className="inline-block mt-1 px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[9px] font-bold uppercase">
              Proceso de Compra (PAC)
            </span>
          )}
        </div>
      ),
      minWidth: '220px',
    },
    {
      header: 'Monto Solicitado',
      align: 'right',
      accessor: (row) => (
        <span className="text-xs font-bold text-theme-main">
          {formatMoney(row.montoSolicitado)}
        </span>
      ),
      minWidth: '130px',
    },
    {
      header: 'Estado de Trámite',
      align: 'center',
      accessor: (row) => (
        <StatusBadge status={row.estado} label={row.estadoDisplay} size="sm" />
      ),
      minWidth: '140px',
    },
  ];

  // Columnas para Semáforo de Ejecución
  const columnsSemaforo: Column<SemaforoAreaRow>[] = [
    {
      header: 'Gerencia / Área',
      accessor: (row) => (
        <span className="font-semibold text-theme-main text-xs block">
          {row.areaNombre}
        </span>
      ),
      minWidth: '220px',
    },
    {
      header: 'Techo Asignado',
      align: 'right',
      accessor: (row) => (
        <span className="text-xs font-medium text-theme-main">
          {formatMoney(row.techoAsignado)}
        </span>
      ),
      minWidth: '130px',
    },
    {
      header: 'Monto Ejecutado',
      align: 'right',
      accessor: (row) => (
        <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
          {formatMoney(row.montoEjecutado)}
        </span>
      ),
      minWidth: '130px',
    },
    {
      header: 'Saldo Disponible',
      align: 'right',
      accessor: (row) => (
        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
          {formatMoney(row.saldoDisponible)}
        </span>
      ),
      minWidth: '130px',
    },
    {
      header: '% Ejecución',
      align: 'center',
      accessor: (row) => (
        <div className="w-24 mx-auto space-y-1">
          <span className="text-[11px] font-bold text-theme-main block text-center">
            {row.porcentajeEjecucion}%
          </span>
          <div className="w-full bg-theme-border/60 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                row.estadoSemaforo === 'optimo'
                  ? 'bg-emerald-500'
                  : row.estadoSemaforo === 'moderado'
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(row.porcentajeEjecucion, 100)}%` }}
            />
          </div>
        </div>
      ),
      minWidth: '110px',
    },
    {
      header: 'Semáforo Institucional',
      align: 'center',
      accessor: (row) => {
        if (row.estadoSemaforo === 'optimo') {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
              <CheckCircle2 size={13} />
              <span>Ejecución Óptima (≥70%)</span>
            </span>
          );
        }
        if (row.estadoSemaforo === 'moderado') {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-bold border border-amber-500/20">
              <AlertTriangle size={13} />
              <span>Avance Regular (40-69%)</span>
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-400 text-xs font-bold border border-rose-500/20">
            <AlertCircle size={13} />
            <span>Alerta Rezago (&lt;40%)</span>
          </span>
        );
      },
      minWidth: '180px',
    },
  ];

  if (subReport === 'certificaciones') {
    const totalSolicitado = certificacionesPOA.reduce((a, b) => a + b.montoSolicitado, 0);

    return (
      <div className="space-y-4">
        <DataTable
          columns={columnsCerts}
          data={certificacionesPOA}
          keyExtractor={(row) => row.id}
          loading={loading}
          emptyMessage="No se encontraron certificaciones POA emitidas en la gestión."
        />

        {!loading && certificacionesPOA.length > 0 && (
          <div className="card p-4 border border-theme-border bg-theme-base/60 rounded-2xl flex flex-wrap items-center justify-between gap-4 text-xs font-bold shadow-xs">
            <span className="text-theme-main uppercase tracking-wider">
              TOTAL SOLICITADO EN CERTIFICACIONES ({certificacionesPOA.length}):
            </span>
            <span className="text-theme-primary text-sm font-bold">
              {formatMoney(totalSolicitado)}
            </span>
          </div>
        )}
      </div>
    );
  }

  if (subReport === 'eficiencia_semaforo') {
    return (
      <div className="space-y-4">
        <DataTable
          columns={columnsSemaforo}
          data={semaforoEjecucion}
          keyExtractor={(row) => row.areaId}
          loading={loading}
          emptyMessage="No se tienen datos para el semáforo de ejecución presupuestaria."
        />
      </div>
    );
  }

  // Libro Diario de Gastos
  const totalGastado = libroGastos.reduce((a, b) => a + b.monto, 0);

  return (
    <div className="space-y-4">
      <DataTable
        columns={columnsGastos}
        data={libroGastos}
        keyExtractor={(row) => row.id}
        loading={loading}
        emptyMessage="No se encontraron registros de gastos ejecutados en el periodo."
      />

      {!loading && libroGastos.length > 0 && (
        <div className="card p-4 border border-theme-border bg-theme-base/60 rounded-2xl flex flex-wrap items-center justify-between gap-4 text-xs font-bold shadow-xs">
          <span className="text-theme-main uppercase tracking-wider">
            TOTAL GASTO DEVENGADO ({libroGastos.length} COMPROBANTES):
          </span>
          <span className="text-rose-600 dark:text-rose-400 text-sm font-bold">
            {formatMoney(totalGastado)}
          </span>
        </div>
      )}
    </div>
  );
};
