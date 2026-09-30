import React, { useState } from 'react';
import {
  Building2,
  Layers,
  Printer,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import {
  PresupuestoAreaCalculado,
  ResumenPrograma,
  AgrupacionViewMode,
} from '../types/presupuestos.types';
import { Pagination } from '../../../components/commons/Pagination';

interface PresupuestosTableProps {
  vistaAgrupacion: AgrupacionViewMode;
  onVistaAgrupacionChange: (mode: AgrupacionViewMode) => void;
  onOpenReporteGeneral: () => void;
  presupuestosCalculados: PresupuestoAreaCalculado[];
  programasResumen: ResumenPrograma[];
  expandedProgramas: Record<string, boolean>;
  onToggleExpandPrograma: (codigo: string) => void;
  onSelectArea: (areaId: number) => void;
  formatMoney: (val: string | number) => string;
  nombreMesDesde: string;
  nombreMesHasta: string;
}

export const PresupuestosTable: React.FC<PresupuestosTableProps> = ({
  vistaAgrupacion,
  onVistaAgrupacionChange,
  onOpenReporteGeneral,
  presupuestosCalculados,
  programasResumen,
  expandedProgramas,
  onToggleExpandPrograma,
  onSelectArea,
  formatMoney,
  nombreMesDesde,
  nombreMesHasta,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  const pagedGerencias = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return presupuestosCalculados.slice(start, start + pageSize);
  }, [presupuestosCalculados, currentPage]);

  return (
    <div className="card p-0 overflow-hidden shadow-sm">
      {/* Cabecera de la Tabla */}
      <div className="p-4 sm:p-5 border-b border-theme-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-theme-base/40">
        <div>
          <h3 className="text-sm font-bold text-theme-main">
            {vistaAgrupacion === 'gerencias'
              ? 'Presupuesto y Ejecución por Gerencia / Área'
              : 'Presupuesto y Ejecución Consolidado por Programa'}
          </h3>
          <p className="text-xs text-theme-muted mt-0.5">
            {vistaAgrupacion === 'gerencias'
              ? 'Techo asignado, gasto ejecutado y saldo disponible. Seleccione una fila para acceder directamente a la sección.'
              : 'Consolidación por programas estratégicos. Despliegue para ingresar a cada sección operativa.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Switch Agrupación: Gerencias vs Programas */}
          <div className="flex items-center p-1 bg-theme-surface border border-theme-border rounded-xl">
            <button
              onClick={() => {
                onVistaAgrupacionChange('gerencias');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                vistaAgrupacion === 'gerencias'
                  ? 'bg-theme-primary text-theme-primaryText shadow-sm'
                  : 'text-theme-muted hover:text-theme-main'
              }`}
            >
              <Building2 size={13} />
              Por Gerencias
            </button>
            <button
              onClick={() => onVistaAgrupacionChange('programas')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                vistaAgrupacion === 'programas'
                  ? 'bg-theme-primary text-theme-primaryText shadow-sm'
                  : 'text-theme-muted hover:text-theme-main'
              }`}
            >
              <Layers size={13} />
              Por Programas
            </button>
          </div>

          <button
            onClick={onOpenReporteGeneral}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-theme-primary/10 text-theme-primary hover:bg-theme-primary/20 transition-all flex items-center gap-1.5 cursor-pointer"
            title="Generar e imprimir reporte según el filtro activo"
          >
            <Printer size={13} />
            Imprimir Reporte
          </button>
        </div>
      </div>

      {/* TABLA POR GERENCIAS */}
      {vistaAgrupacion === 'gerencias' && (
        <div className="flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-theme-border bg-theme-base/60 text-xs font-semibold uppercase tracking-wider text-theme-muted">
                  <th className="py-3 px-4">Gerencia / Unidad Organizacional</th>
                  <th className="py-3 px-4 text-right">Techo Inicial</th>
                  <th className="py-3 px-4 text-right">
                    Ejecutado ({nombreMesDesde.slice(0, 3)} - {nombreMesHasta.slice(0, 3)})
                  </th>
                  <th className="py-3 px-4 text-right">Disponible</th>
                  <th className="py-3 px-4 text-center">Avance</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border">
                {pagedGerencias.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-theme-muted text-sm">
                      No hay registros presupuestarios para el criterio seleccionado.
                    </td>
                  </tr>
                ) : (
                  pagedGerencias.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => onSelectArea(p.area)}
                      className="hover:bg-theme-border/20 transition-colors cursor-pointer group"
                      title={`Ingresar directamente a la sección de ${p.area_nombre}`}
                    >
                      <td className="py-3.5 px-4 min-w-[200px]">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/90 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60 px-1.5 py-0.5 rounded">
                            {p.area_codigo}
                          </span>
                          <span className="font-bold text-theme-main text-xs group-hover:text-theme-primary transition-colors">
                            {p.area_nombre}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-theme-main">
                        {formatMoney(p.monto_inicial)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-rose-600 dark:text-rose-400 font-semibold">
                        {formatMoney(p.monto_ejecutado_periodo)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {formatMoney(p.monto_disponible_periodo)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            p.porcentaje_ejecucion_periodo > 80
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                              : p.porcentaje_ejecucion_periodo > 50
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              : 'bg-theme-border text-theme-main'
                          }`}
                        >
                          {p.porcentaje_ejecucion_periodo}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className="text-[11px] text-theme-primary font-semibold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                          Ver Sección <ChevronRight size={13} />
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación de la Tabla de Gerencias */}
          <Pagination
            currentPage={currentPage}
            totalItems={presupuestosCalculados.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            itemLabel="gerencias / unidades"
          />
        </div>
      )}

      {/* TABLA POR PROGRAMAS */}
      {vistaAgrupacion === 'programas' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-theme-border bg-theme-base/60 text-xs font-semibold uppercase tracking-wider text-theme-muted">
                <th className="py-3 px-4">Programa Estratégico</th>
                <th className="py-3 px-4 text-right">Techo Total Inicial</th>
                <th className="py-3 px-4 text-right">
                  Ejecutado ({nombreMesDesde.slice(0, 3)} - {nombreMesHasta.slice(0, 3)})
                </th>
                <th className="py-3 px-4 text-right">Disponible</th>
                <th className="py-3 px-4 text-center">Avance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-border">
              {programasResumen.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-theme-muted text-sm">
                    No hay programas registrados para el criterio seleccionado.
                  </td>
                </tr>
              ) : (
                programasResumen.map((prog) => {
                  const isExpanded = expandedProgramas[prog.codigo];
                  return (
                    <React.Fragment key={prog.codigo}>
                      <tr
                        onClick={() => onToggleExpandPrograma(prog.codigo)}
                        className="hover:bg-theme-border/20 transition-colors cursor-pointer bg-theme-base/20"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <div className="text-theme-muted">
                              {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                            </div>
                            <div>
                              <span className="font-bold text-theme-main text-xs">{prog.nombre}</span>
                              <span className="text-[10px] px-2 py-0.5 ml-2 rounded-full font-bold bg-theme-primary/10 text-theme-primary font-mono">
                                {prog.areas.length} {prog.areas.length === 1 ? 'área' : 'áreas'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right font-bold text-theme-main">
                          {formatMoney(prog.total_inicial)}
                        </td>
                        <td className="py-4 px-4 text-right font-bold text-rose-600 dark:text-rose-400">
                          {formatMoney(prog.total_ejecutado)}
                        </td>
                        <td className="py-4 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          {formatMoney(prog.total_disponible)}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              prog.porcentaje_ejecucion > 80
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                : prog.porcentaje_ejecucion > 50
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                : 'bg-theme-border text-theme-main'
                            }`}
                          >
                            {prog.porcentaje_ejecucion}%
                          </span>
                        </td>
                      </tr>

                      {/* Desglose de Áreas dentro del Programa */}
                      {isExpanded &&
                        prog.areas.map((p) => (
                          <tr
                            key={`prog-area-${p.id}`}
                            onClick={() => onSelectArea(p.area)}
                            className="bg-theme-surface hover:bg-theme-border/20 transition-colors cursor-pointer group"
                            title={`Ingresar directamente a la sección de ${p.area_nombre}`}
                          >
                            <td className="py-3 px-4 pl-10">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 px-1.5 py-0.5 rounded">
                                  {p.area_codigo}
                                </span>
                                <span className="text-theme-main text-xs group-hover:text-theme-primary transition-colors">
                                  {p.area_nombre}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right text-theme-muted font-medium">
                              {formatMoney(p.monto_inicial)}
                            </td>
                            <td className="py-3 px-4 text-right text-rose-600/90 dark:text-rose-400 font-medium">
                              {formatMoney(p.monto_ejecutado_periodo)}
                            </td>
                            <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                              {formatMoney(p.monto_disponible_periodo)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="text-[11px] font-bold text-theme-muted">
                                {p.porcentaje_ejecucion_periodo}%
                              </span>
                            </td>
                          </tr>
                        ))}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
