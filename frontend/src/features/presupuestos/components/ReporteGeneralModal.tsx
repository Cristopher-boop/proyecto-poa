import React from 'react';
import { Printer, X } from 'lucide-react';
import {
  PresupuestoAreaCalculado,
  ResumenPrograma,
  AgrupacionViewMode,
  Gestion,
  Area,
} from '../types/presupuestos.types';

interface ReporteGeneralModalProps {
  isOpen: boolean;
  onClose: () => void;
  tipoReporteImpresion: AgrupacionViewMode;
  onTipoReporteImpresionChange: (tipo: AgrupacionViewMode) => void;
  activeGestion: Gestion | null;
  filtroAreaId: string;
  presupuestosArea: PresupuestoAreaCalculado[];
  presupuestosCalculados: PresupuestoAreaCalculado[];
  programasResumen: ResumenPrograma[];
  totalInicial: number;
  totalEjecutadoPeriodo: number;
  totalDisponiblePeriodo: number;
  pctEjecucionPeriodo: number;
  nombreMesDesde: string;
  nombreMesHasta: string;
  formatMoney: (val: string | number) => string;
}

export const ReporteGeneralModal: React.FC<ReporteGeneralModalProps> = ({
  isOpen,
  onClose,
  tipoReporteImpresion,
  onTipoReporteImpresionChange,
  activeGestion,
  filtroAreaId,
  presupuestosArea,
  presupuestosCalculados,
  programasResumen,
  totalInicial,
  totalEjecutadoPeriodo,
  totalDisponiblePeriodo,
  pctEjecucionPeriodo,
  nombreMesDesde,
  nombreMesHasta,
  formatMoney,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:overflow-visible">
      <div className="bg-theme-surface border border-theme-border rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden print:max-w-none print:max-h-none print:border-none print:shadow-none print:w-full">
        {/* Barra de Controles Superior */}
        <div className="p-4 border-b border-theme-border flex items-center justify-between bg-theme-base/60 print:hidden">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-theme-primary/10 text-theme-primary">
              <Printer size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-theme-main">Vista Previa de Reporte Presupuestario</h3>
              <p className="text-[11px] text-theme-muted">
                Gestión Fiscal {activeGestion?.anio || '2026'} • Periodo: {nombreMesDesde} - {nombreMesHasta}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center p-0.5 bg-theme-surface border border-theme-border rounded-lg">
              <button
                type="button"
                onClick={() => onTipoReporteImpresionChange('gerencias')}
                className={`px-2.5 py-1 text-xs font-semibold rounded ${
                  tipoReporteImpresion === 'gerencias'
                    ? 'bg-theme-primary text-theme-primaryText shadow-sm'
                    : 'text-theme-muted'
                }`}
              >
                Por Gerencias
              </button>
              <button
                type="button"
                onClick={() => onTipoReporteImpresionChange('programas')}
                className={`px-2.5 py-1 text-xs font-semibold rounded ${
                  tipoReporteImpresion === 'programas'
                    ? 'bg-theme-primary text-theme-primaryText shadow-sm'
                    : 'text-theme-muted'
                }`}
              >
                Por Programas
              </button>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-theme-primary text-theme-primaryText text-xs font-bold hover:bg-theme-primaryHover transition-all flex items-center gap-1.5 shadow cursor-pointer"
            >
              <Printer size={15} />
              Imprimir Reporte (PDF)
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-theme-muted hover:text-theme-main hover:bg-theme-border/40 transition-colors cursor-pointer"
              title="Cerrar vista previa"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Hoja de Reporte Imprimible Oficial */}
        <div className="p-4 sm:p-8 overflow-y-auto print:overflow-visible bg-white text-black">
          <div id="reporte-dashboard-printable" className="w-full bg-white text-black max-w-4xl mx-auto space-y-6">
            {/* Cabecera Institucional */}
            <div className="border-b-2 border-black pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-600">
                    ESTADO PLURINACIONAL DE BOLIVIA
                  </p>
                  <h1 className="text-base sm:text-lg font-black uppercase tracking-wider text-black mt-0.5">
                    EMPRESA PÚBLICA DE TRANSPORTE AÉREO MILITAR - EPTAM
                  </h1>
                  <p className="text-[10px] font-semibold tracking-wide text-gray-500 uppercase">
                    SISTEMA INTEGRADO DE PROGRAMACIÓN OPERATIVA ANUAL (POA)
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block border-2 border-black px-2.5 py-1 text-xs font-black uppercase tracking-wider">
                    POA {activeGestion?.anio || '2026'}
                  </span>
                </div>
              </div>

              <div className="mt-4 text-center">
                <h2 className="text-base sm:text-lg font-black uppercase tracking-wide text-black underline underline-offset-4">
                  REPORTE DE ESTADO Y EJECUCIÓN PRESUPUESTARIA
                </h2>
                <p className="text-xs font-bold text-gray-700 mt-1 uppercase">
                  {tipoReporteImpresion === 'gerencias'
                    ? 'CONSOLIDADO POR GERENCIAS Y UNIDADES ORGANIZACIONALES'
                    : 'CONSOLIDADO POR PROGRAMAS ESTRATÉGICOS'}
                </p>
              </div>
            </div>

            {/* Bloque de Metadatos y Filtros Aplicados */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] border border-gray-400 bg-gray-50 p-3 rounded">
              <div>
                <span className="font-bold text-gray-500 block uppercase text-[9px]">Gestión Fiscal:</span>
                <span className="font-bold text-black">{activeGestion?.anio || '2026'}</span>
              </div>
              <div>
                <span className="font-bold text-gray-500 block uppercase text-[9px]">Periodo Evaluado:</span>
                <span className="font-bold text-black">
                  {nombreMesDesde === nombreMesHasta
                    ? `${nombreMesDesde} ${activeGestion?.anio || ''}`
                    : `${nombreMesDesde} - ${nombreMesHasta} ${activeGestion?.anio || ''}`}
                </span>
              </div>
              <div>
                <span className="font-bold text-gray-500 block uppercase text-[9px]">Área Filtrada:</span>
                <span className="font-bold text-black truncate block">
                  {filtroAreaId === 'todas'
                    ? 'Todas las Áreas'
                    : presupuestosArea.find((a) => String(a.area) === filtroAreaId)?.area_nombre || 'Área'}
                </span>
              </div>
              <div>
                <span className="font-bold text-gray-500 block uppercase text-[9px]">Fecha de Emisión:</span>
                <span className="font-medium text-black">
                  {new Date().toLocaleDateString('es-BO')}{' '}
                  {new Date().toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Cuadros Resumen Ejecutivo */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="border border-gray-400 p-2.5 rounded bg-white">
                <p className="text-[9px] font-bold uppercase text-gray-600">Presupuesto Inicial</p>
                <p className="text-sm font-black text-black mt-0.5">{formatMoney(totalInicial)}</p>
              </div>
              <div className="border border-gray-400 p-2.5 rounded bg-white">
                <p className="text-[9px] font-bold uppercase text-gray-600">
                  Ejecutado ({nombreMesDesde.slice(0, 3)} - {nombreMesHasta.slice(0, 3)})
                </p>
                <p className="text-sm font-black text-red-700 mt-0.5">{formatMoney(totalEjecutadoPeriodo)}</p>
              </div>
              <div className="border border-gray-400 p-2.5 rounded bg-white">
                <p className="text-[9px] font-bold uppercase text-gray-600">Saldo Disponible</p>
                <p className="text-sm font-black text-emerald-700 mt-0.5">{formatMoney(totalDisponiblePeriodo)}</p>
              </div>
              <div className="border border-gray-400 p-2.5 rounded bg-white">
                <p className="text-[9px] font-bold uppercase text-gray-600">% Avance / Ejecución</p>
                <p className="text-sm font-black text-black mt-0.5">{pctEjecucionPeriodo}%</p>
              </div>
            </div>

            {/* Tabla de Datos Principal */}
            <div>
              <table className="w-full border-collapse border border-gray-400 text-[11px]">
                <thead>
                  <tr className="bg-gray-200 border-b border-gray-400 font-black text-black uppercase tracking-wider text-[10px]">
                    <th className="border border-gray-400 py-2 px-2.5 text-center w-10">Nº</th>
                    <th className="border border-gray-400 py-2 px-2 text-center w-24">Código</th>
                    <th className="border border-gray-400 py-2 px-3 text-left">
                      {tipoReporteImpresion === 'gerencias'
                        ? 'Gerencia / Unidad Organizacional'
                        : 'Programa / Área'}
                    </th>
                    <th className="border border-gray-400 py-2 px-3 text-right w-28">Presupuesto Inicial (Bs.)</th>
                    <th className="border border-gray-400 py-2 px-3 text-right w-28">Ejecutado Periodo (Bs.)</th>
                    <th className="border border-gray-400 py-2 px-3 text-right w-28">Saldo Disponible (Bs.)</th>
                    <th className="border border-gray-400 py-2 px-2 text-center w-16">% Ejec.</th>
                  </tr>
                </thead>

                {tipoReporteImpresion === 'gerencias' ? (
                  <tbody>
                    {presupuestosCalculados.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="border border-gray-400 py-6 text-center text-gray-500 font-medium">
                          No existen datos presupuestarios para el criterio seleccionado.
                        </td>
                      </tr>
                    ) : (
                      presupuestosCalculados.map((p, idx) => (
                        <tr key={`print-area-${p.id}`} className={idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="border border-gray-400 py-1.5 px-2 text-center font-bold text-gray-600">
                            {idx + 1}
                          </td>
                          <td className="border border-gray-400 py-1.5 px-2 text-center font-mono font-bold text-black">
                            {p.area_codigo}
                          </td>
                          <td className="border border-gray-400 py-1.5 px-3 font-semibold text-black">
                            {p.area_nombre}
                          </td>
                          <td className="border border-gray-400 py-1.5 px-3 text-right font-medium text-black">
                            {formatMoney(p.monto_inicial)}
                          </td>
                          <td className="border border-gray-400 py-1.5 px-3 text-right font-medium text-red-700">
                            {formatMoney(p.monto_ejecutado_periodo)}
                          </td>
                          <td className="border border-gray-400 py-1.5 px-3 text-right font-bold text-emerald-800">
                            {formatMoney(p.monto_disponible_periodo)}
                          </td>
                          <td className="border border-gray-400 py-1.5 px-2 text-center font-bold text-black">
                            {p.porcentaje_ejecucion_periodo}%
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                ) : (
                  <tbody>
                    {programasResumen.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="border border-gray-400 py-6 text-center text-gray-500 font-medium">
                          No existen programas para el criterio seleccionado.
                        </td>
                      </tr>
                    ) : (
                      programasResumen.map((prog, pIdx) => (
                        <React.Fragment key={`print-prog-${prog.codigo}`}>
                          <tr className="bg-gray-300 font-bold border-t-2 border-black">
                            <td className="border border-gray-400 py-2 px-2 text-center text-black">
                              {pIdx + 1}
                            </td>
                            <td className="border border-gray-400 py-2 px-2 text-center font-mono font-black text-black">
                              {prog.codigo}
                            </td>
                            <td className="border border-gray-400 py-2 px-3 uppercase text-black font-black">
                              {prog.nombre}
                            </td>
                            <td className="border border-gray-400 py-2 px-3 text-right font-black text-black">
                              {formatMoney(prog.total_inicial)}
                            </td>
                            <td className="border border-gray-400 py-2 px-3 text-right font-black text-red-800">
                              {formatMoney(prog.total_ejecutado)}
                            </td>
                            <td className="border border-gray-400 py-2 px-3 text-right font-black text-emerald-800">
                              {formatMoney(prog.total_disponible)}
                            </td>
                            <td className="border border-gray-400 py-2 px-2 text-center font-black text-black">
                              {prog.porcentaje_ejecucion}%
                            </td>
                          </tr>
                          {prog.areas.map((a, aIdx) => (
                            <tr key={`print-prog-area-${a.id}`} className={aIdx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
                              <td className="border border-gray-400 py-1 px-2 text-center text-gray-500 text-[10px]">
                                {pIdx + 1}.{aIdx + 1}
                              </td>
                              <td className="border border-gray-400 py-1 px-2 text-center font-mono text-gray-600 text-[10px]">
                                {a.area_codigo}
                              </td>
                              <td className="border border-gray-400 py-1 px-3 text-gray-800 pl-6">
                                {a.area_nombre}
                              </td>
                              <td className="border border-gray-400 py-1 px-3 text-right text-gray-700">
                                {formatMoney(a.monto_inicial)}
                              </td>
                              <td className="border border-gray-400 py-1 px-3 text-right text-red-700">
                                {formatMoney(a.monto_ejecutado_periodo)}
                              </td>
                              <td className="border border-gray-400 py-1 px-3 text-right text-emerald-800 font-semibold">
                                {formatMoney(a.monto_disponible_periodo)}
                              </td>
                              <td className="border border-gray-400 py-1 px-2 text-center text-gray-700">
                                {a.porcentaje_ejecucion_periodo}%
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))
                    )}
                  </tbody>
                )}

                <tfoot>
                  <tr className="bg-gray-300 font-black border-t-2 border-black text-black">
                    <td colSpan={3} className="border border-gray-400 py-2.5 px-3 text-right uppercase tracking-wider">
                      TOTAL CONSOLIDADO GENERAL:
                    </td>
                    <td className="border border-gray-400 py-2.5 px-3 text-right font-black">
                      {formatMoney(totalInicial)}
                    </td>
                    <td className="border border-gray-400 py-2.5 px-3 text-right font-black text-red-800">
                      {formatMoney(totalEjecutadoPeriodo)}
                    </td>
                    <td className="border border-gray-400 py-2.5 px-3 text-right font-black text-emerald-800">
                      {formatMoney(totalDisponiblePeriodo)}
                    </td>
                    <td className="border border-gray-400 py-2.5 px-2 text-center font-black">
                      {pctEjecucionPeriodo}%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Firmas Institucionales */}
            <div className="pt-8 pb-4 mt-8">
              <div className="grid grid-cols-3 gap-6 text-center">
                <div className="border-t border-black pt-2">
                  <p className="text-[10px] font-bold uppercase text-black">Elaborado por</p>
                  <p className="text-[9px] text-gray-600 mt-1">Responsable de Planificación y Presupuesto</p>
                  <p className="text-[8px] text-gray-500 mt-4">Firma y Sello</p>
                </div>
                <div className="border-t border-black pt-2">
                  <p className="text-[10px] font-bold uppercase text-black">Revisado por</p>
                  <p className="text-[9px] text-gray-600 mt-1">Jefe de Planificación Institucional</p>
                  <p className="text-[8px] text-gray-500 mt-4">Firma y Sello</p>
                </div>
                <div className="border-t border-black pt-2">
                  <p className="text-[10px] font-bold uppercase text-black">Aprobado por</p>
                  <p className="text-[9px] text-gray-600 mt-1">Gerente General / Máxima Autoridad EPTAM</p>
                  <p className="text-[8px] text-gray-500 mt-4">Firma y Sello</p>
                </div>
              </div>
            </div>

            {/* Nota de Pie de Página */}
            <div className="border-t border-gray-300 pt-2 text-[8px] text-gray-500 flex justify-between">
              <span>Sistema POA - EPTAM • Documento Oficial de Seguimiento Financiero</span>
              <span>Montos expresados en Bolivianos (Bs.)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
