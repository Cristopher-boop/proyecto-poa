import React from 'react';
import { DataTable, Column } from '../../../components/commons/DataTable';
import {
  PresupuestoAreaResumen,
  PartidaConsolidadaReporte,
  SubReportPresupuesto,
} from '../types/reportes.types';
import { Building2, FileSpreadsheet } from 'lucide-react';

interface ReportesPresupuestosViewProps {
  subReport: SubReportPresupuesto;
  presupuestosInstitucionales: PresupuestoAreaResumen[];
  partidasConsolidadas: PartidaConsolidadaReporte[];
  formatMoney: (val: number | string | undefined | null) => string;
  loading: boolean;
}

export const ReportesPresupuestosView: React.FC<ReportesPresupuestosViewProps> = ({
  subReport,
  presupuestosInstitucionales,
  partidasConsolidadas,
  formatMoney,
  loading,
}) => {
  // Columnas para Consolidado Institucional
  const columnsInstitucional: Column<PresupuestoAreaResumen>[] = [
    {
      header: 'Área / Gerencia',
      accessor: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-theme-primary/10 text-theme-primary flex items-center justify-center font-bold text-xs shrink-0">
            <Building2 size={15} />
          </div>
          <div>
            <span className="font-semibold text-theme-main text-xs block">
              {row.areaNombre}
            </span>
            <span className="text-[10px] text-theme-muted uppercase tracking-wider">
              {row.areaTipo} • {row.programaNombre}
            </span>
          </div>
        </div>
      ),
      minWidth: '240px',
    },
    {
      header: 'Presupuesto Inicial',
      align: 'right',
      accessor: (row) => (
        <span className="text-xs font-medium text-theme-main">
          {formatMoney(row.montoInicial)}
        </span>
      ),
      minWidth: '130px',
    },
    {
      header: 'Monto Vigente',
      align: 'right',
      accessor: (row) => (
        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
          {formatMoney(row.montoVigente)}
        </span>
      ),
      minWidth: '130px',
    },
    {
      header: 'Total Ejecutado',
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
        <div className="w-28 mx-auto space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-theme-main">
            <span>{row.porcentajeEjecucion}%</span>
          </div>
          <div className="w-full bg-theme-border/60 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                row.porcentajeEjecucion >= 70
                  ? 'bg-emerald-500'
                  : row.porcentajeEjecucion >= 40
                  ? 'bg-amber-500'
                  : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(row.porcentajeEjecucion, 100)}%` }}
            />
          </div>
        </div>
      ),
      minWidth: '120px',
    },
  ];

  // Columnas para Clasificador de Partidas
  const columnsPartidas: Column<PartidaConsolidadaReporte>[] = [
    {
      header: 'Partida Presupuestaria',
      accessor: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-theme-primary/10 text-theme-primary flex items-center justify-center font-bold text-xs shrink-0">
            <FileSpreadsheet size={15} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-theme-base border border-theme-border text-theme-primary">
                {row.codigo}
              </span>
              <span className="font-semibold text-theme-main text-xs">{row.nombre}</span>
            </div>
            <span className="text-[10px] text-theme-muted uppercase tracking-wider">
              Clase: {row.clase}
            </span>
          </div>
        </div>
      ),
      minWidth: '280px',
    },
    {
      header: 'Presupuestado',
      align: 'right',
      accessor: (row) => (
        <span className="text-xs font-medium text-theme-main">
          {formatMoney(row.presupuestado)}
        </span>
      ),
      minWidth: '130px',
    },
    {
      header: 'Ejecutado',
      align: 'right',
      accessor: (row) => (
        <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
          {formatMoney(row.ejecutado)}
        </span>
      ),
      minWidth: '130px',
    },
    {
      header: 'Saldo Disponible',
      align: 'right',
      accessor: (row) => (
        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
          {formatMoney(row.disponible)}
        </span>
      ),
      minWidth: '130px',
    },
    {
      header: '% Ejecutado',
      align: 'center',
      accessor: (row) => (
        <div className="w-24 mx-auto space-y-1">
          <span className="text-[11px] font-bold text-theme-main block text-center">
            {row.porcentajeEjecucion}%
          </span>
          <div className="w-full bg-theme-border/60 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-theme-primary rounded-full"
              style={{ width: `${Math.min(row.porcentajeEjecucion, 100)}%` }}
            />
          </div>
        </div>
      ),
      minWidth: '110px',
    },
  ];

  if (subReport === 'institucional') {
    const totInicial = presupuestosInstitucionales.reduce((a, b) => a + b.montoInicial, 0);
    const totVigente = presupuestosInstitucionales.reduce((a, b) => a + b.montoVigente, 0);
    const totEjec = presupuestosInstitucionales.reduce((a, b) => a + b.montoEjecutado, 0);
    const totDisp = presupuestosInstitucionales.reduce((a, b) => a + b.saldoDisponible, 0);
    const pctGlobal = totInicial > 0 ? Math.round((totEjec / totInicial) * 10000) / 100 : 0;

    return (
      <div className="space-y-4">
        <DataTable
          columns={columnsInstitucional}
          data={presupuestosInstitucionales}
          keyExtractor={(row) => row.areaId}
          loading={loading}
          emptyMessage="No se encontraron presupuestos de áreas registrados."
        />

        {/* Fila de Totales Consolidados Institucionales */}
        {!loading && presupuestosInstitucionales.length > 0 && (
          <div className="card p-4 border border-theme-border bg-theme-base/60 rounded-2xl flex flex-wrap items-center justify-between gap-4 text-xs font-bold shadow-xs">
            <span className="text-theme-main uppercase tracking-wider">
              TOTALES INSTITUCIONALES CONSOLIDADOS ({presupuestosInstitucionales.length} ÁREAS):
            </span>
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <span className="text-theme-muted font-normal block text-[10px]">Inicial:</span>
                <span className="text-theme-main">{formatMoney(totInicial)}</span>
              </div>
              <div>
                <span className="text-theme-muted font-normal block text-[10px]">Vigente:</span>
                <span className="text-blue-600 dark:text-blue-400">{formatMoney(totVigente)}</span>
              </div>
              <div>
                <span className="text-theme-muted font-normal block text-[10px]">Ejecutado:</span>
                <span className="text-rose-600 dark:text-rose-400">{formatMoney(totEjec)}</span>
              </div>
              <div>
                <span className="text-theme-muted font-normal block text-[10px]">Disponible:</span>
                <span className="text-emerald-600 dark:text-emerald-400">{formatMoney(totDisp)}</span>
              </div>
              <div>
                <span className="text-theme-muted font-normal block text-[10px]">Avance POA:</span>
                <span className="text-theme-primary">{pctGlobal}%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Clasificador de Partidas
  const totPartPresup = partidasConsolidadas.reduce((a, b) => a + b.presupuestado, 0);
  const totPartEjec = partidasConsolidadas.reduce((a, b) => a + b.ejecutado, 0);
  const totPartDisp = partidasConsolidadas.reduce((a, b) => a + b.disponible, 0);

  return (
    <div className="space-y-4">
      <DataTable
        columns={columnsPartidas}
        data={partidasConsolidadas}
        keyExtractor={(row) => row.partidaId}
        loading={loading}
        emptyMessage="No se encontraron partidas con asignación presupuestaria en el periodo."
      />

      {!loading && partidasConsolidadas.length > 0 && (
        <div className="card p-4 border border-theme-border bg-theme-base/60 rounded-2xl flex flex-wrap items-center justify-between gap-4 text-xs font-bold shadow-xs">
          <span className="text-theme-main uppercase tracking-wider">
            TOTAL CONSOLIDADO EN PARTIDAS ({partidasConsolidadas.length} ACTIVAS):
          </span>
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <span className="text-theme-muted font-normal block text-[10px]">Presupuestado:</span>
              <span className="text-theme-main">{formatMoney(totPartPresup)}</span>
            </div>
            <div>
              <span className="text-theme-muted font-normal block text-[10px]">Ejecutado:</span>
              <span className="text-rose-600 dark:text-rose-400">{formatMoney(totPartEjec)}</span>
            </div>
            <div>
              <span className="text-theme-muted font-normal block text-[10px]">Disponible:</span>
              <span className="text-emerald-600 dark:text-emerald-400">{formatMoney(totPartDisp)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
