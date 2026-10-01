import React from 'react';
import { FileText, Printer, X } from 'lucide-react';
import {
  PartidaConsolidada,
  Gestion,
  DetalleArea,
  SeccionDetalleArea,
} from '../types/presupuestos.types';

interface ReportePartidasModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeGestion: Gestion | null;
  detalleArea: DetalleArea | null;
  seccionActivaData: SeccionDetalleArea | null;
  partidasConsolidadas: PartidaConsolidada[];
  totalPartidasPresupuestado: number;
  totalPartidasAgregado: number;
  totalPartidasQuitado: number;
  totalPartidasEjecutado: number;
  totalPartidasDisponible: number;
  pctPartidasGlobal: number;
  mesDesde: number;
  mesHasta: number;
  nombreMesDesde: string;
  nombreMesHasta: string;
  hayFiltroMeses: boolean;
  formatMoney: (val: string | number) => string;
}

export const ReportePartidasModal: React.FC<ReportePartidasModalProps> = ({
  isOpen,
  onClose,
  activeGestion,
  detalleArea,
  seccionActivaData,
  partidasConsolidadas,
  totalPartidasPresupuestado,
  totalPartidasAgregado,
  totalPartidasQuitado,
  totalPartidasEjecutado,
  totalPartidasDisponible,
  pctPartidasGlobal,
  mesDesde,
  mesHasta,
  nombreMesDesde,
  nombreMesHasta,
  hayFiltroMeses,
  formatMoney,
}) => {
  if (!isOpen || !seccionActivaData) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:overflow-visible">
      <div className="bg-theme-surface border border-theme-border rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden print:max-w-none print:max-h-none print:border-none print:shadow-none print:w-full">
        {/* Barra de Controles Superior */}
        <div className="p-4 border-b border-theme-border flex items-center justify-between bg-theme-base/60 print:hidden">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-theme-primary/10 text-theme-primary">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-theme-main">Vista Previa - Reporte Oficial de Partidas</h3>
              <p className="text-[11px] text-theme-muted">
                {detalleArea?.area_nombre} • {seccionActivaData.seccion_nombre} • Gestión {activeGestion?.anio || detalleArea?.gestion_anio}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Hoja Imprimible Oficial */}
        <div className="p-4 sm:p-8 overflow-y-auto print:overflow-visible bg-white text-black">
          <div id="reporte-partidas-printable" className="w-full bg-white text-black max-w-4xl mx-auto space-y-6">
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
                    POA {activeGestion?.anio || detalleArea?.gestion_anio || '2026'}
                  </span>
                </div>
              </div>

              <div className="mt-4 text-center">
                <h2 className="text-base sm:text-lg font-black uppercase tracking-wide text-black underline underline-offset-4">
                  REPORTE CONSOLIDADO POR PARTIDAS PRESUPUESTARIAS
                </h2>
                <p className="text-xs font-bold text-gray-700 mt-1 uppercase">
                  {detalleArea?.area_nombre} — {seccionActivaData.seccion_nombre}
                </p>
              </div>
            </div>

            {/* Metadatos */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] border border-gray-400 bg-gray-50 p-3 rounded">
              <div>
                <span className="font-bold text-gray-500 block uppercase text-[9px]">Gestión Fiscal:</span>
                <span className="font-bold text-black">{activeGestion?.anio || detalleArea?.gestion_anio}</span>
              </div>
              <div>
                <span className="font-bold text-gray-500 block uppercase text-[9px]">Periodo Evaluado:</span>
                <span className="font-bold text-black">
                  {mesDesde === mesHasta ? nombreMesDesde : `${nombreMesDesde} - ${nombreMesHasta}`}
                </span>
              </div>
              <div>
                <span className="font-bold text-gray-500 block uppercase text-[9px]">Gerencia / Unidad:</span>
                <span className="font-bold text-black truncate block">
                  {detalleArea?.area_nombre} ({detalleArea?.area_codigo})
                </span>
              </div>
              <div>
                <span className="font-bold text-gray-500 block uppercase text-[9px]">Sección Operativa:</span>
                <span className="font-bold text-black truncate block">
                  {seccionActivaData.seccion_nombre}
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

            {/* Resumen Ejecutivo */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
              <div className="border border-gray-400 p-2 rounded bg-white">
                <p className="text-[8px] font-bold uppercase text-gray-600">Presupuestado</p>
                <p className="text-xs font-black text-black mt-0.5">{formatMoney(totalPartidasPresupuestado)}</p>
              </div>
              <div className="border border-gray-400 p-2 rounded bg-white">
                <p className="text-[8px] font-bold uppercase text-gray-600">Agregado (+)</p>
                <p className="text-xs font-black text-emerald-800 mt-0.5">+{formatMoney(totalPartidasAgregado)}</p>
              </div>
              <div className="border border-gray-400 p-2 rounded bg-white">
                <p className="text-[8px] font-bold uppercase text-gray-600">Quitado (-)</p>
                <p className="text-xs font-black text-red-800 mt-0.5">-{formatMoney(totalPartidasQuitado)}</p>
              </div>
              <div className="border border-gray-400 p-2 rounded bg-white">
                <p className="text-[8px] font-bold uppercase text-gray-600">
                  Ejecutado {hayFiltroMeses ? `(${nombreMesDesde.slice(0, 3)} - ${nombreMesHasta.slice(0, 3)})` : ''}
                </p>
                <p className="text-xs font-black text-red-700 mt-0.5">{formatMoney(totalPartidasEjecutado)}</p>
              </div>
              <div className="border border-gray-400 p-2 rounded bg-white">
                <p className="text-[8px] font-bold uppercase text-gray-600">Disponible</p>
                <p className="text-xs font-black text-emerald-700 mt-0.5">{formatMoney(totalPartidasDisponible)}</p>
              </div>
              <div className="border border-gray-400 p-2 rounded bg-white">
                <p className="text-[8px] font-bold uppercase text-gray-600">% Avance</p>
                <p className="text-xs font-black text-black mt-0.5">{pctPartidasGlobal}%</p>
              </div>
            </div>

            {/* Tabla de Partidas */}
            <div>
              <table className="w-full border-collapse border border-gray-400 text-[10px]">
                <thead>
                  <tr className="bg-gray-200 border-b border-gray-400 font-black text-black uppercase tracking-wider text-[9px]">
                    <th className="border border-gray-400 py-1.5 px-2 text-center w-8">Nº</th>
                    <th className="border border-gray-400 py-1.5 px-2 text-center w-20">Nº Partida</th>
                    <th className="border border-gray-400 py-1.5 px-3 text-left">Nombre de Partida</th>
                    <th className="border border-gray-400 py-1.5 px-2.5 text-right w-24">Total Presupuestado</th>
                    <th className="border border-gray-400 py-1.5 px-2.5 text-right w-20">Agregado (+)</th>
                    <th className="border border-gray-400 py-1.5 px-2.5 text-right w-20">Quitado (-)</th>
                    <th className="border border-gray-400 py-1.5 px-2.5 text-right w-24">
                      Ejecutado {hayFiltroMeses ? `(${nombreMesDesde.slice(0, 3)} - ${nombreMesHasta.slice(0, 3)})` : ''}
                    </th>
                    <th className="border border-gray-400 py-1.5 px-2.5 text-right w-24">Disponible</th>
                    <th className="border border-gray-400 py-1.5 px-2 text-center w-14">% Ejec.</th>
                  </tr>
                </thead>
                <tbody>
                  {partidasConsolidadas.map((p, idx) => (
                    <tr key={`print-p-${p.partida_codigo}`} className={idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="border border-gray-400 py-1.5 px-2 text-center font-bold text-gray-600">
                        {idx + 1}
                      </td>
                      <td className="border border-gray-400 py-1.5 px-2 text-center font-mono font-bold text-black">
                        {p.partida_codigo}
                      </td>
                      <td className="border border-gray-400 py-1.5 px-3 font-semibold text-black">
                        {p.partida_nombre}
                      </td>
                      <td className="border border-gray-400 py-1.5 px-2.5 text-right font-medium text-black">
                        {formatMoney(p.total_presupuestado)}
                      </td>
                      <td className="border border-gray-400 py-1.5 px-2.5 text-right font-medium text-emerald-800">
                        {p.total_agregado > 0 ? `+${formatMoney(p.total_agregado)}` : '0,00 Bs'}
                      </td>
                      <td className="border border-gray-400 py-1.5 px-2.5 text-right font-medium text-red-800">
                        {p.total_quitado > 0 ? `-${formatMoney(p.total_quitado)}` : '0,00 Bs'}
                      </td>
                      <td className="border border-gray-400 py-1.5 px-2.5 text-right font-medium text-red-700">
                        {formatMoney(p.total_ejecutado)}
                      </td>
                      <td className="border border-gray-400 py-1.5 px-2.5 text-right font-bold text-emerald-800">
                        {formatMoney(p.total_disponible)}
                      </td>
                      <td className="border border-gray-400 py-1.5 px-2 text-center font-bold text-black">
                        {p.porcentaje_ejecucion}%
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-300 border-t-2 border-black font-black text-black">
                    <td colSpan={3} className="border border-gray-400 py-2.5 px-3 text-right uppercase tracking-wider">
                      TOTAL GENERAL CONSOLIDADO:
                    </td>
                    <td className="border border-gray-400 py-2.5 px-2.5 text-right font-black">
                      {formatMoney(totalPartidasPresupuestado)}
                    </td>
                    <td className="border border-gray-400 py-2.5 px-2.5 text-right font-black text-emerald-800">
                      +{formatMoney(totalPartidasAgregado)}
                    </td>
                    <td className="border border-gray-400 py-2.5 px-2.5 text-right font-black text-red-800">
                      -{formatMoney(totalPartidasQuitado)}
                    </td>
                    <td className="border border-gray-400 py-2.5 px-2.5 text-right font-black text-red-800">
                      {formatMoney(totalPartidasEjecutado)}
                    </td>
                    <td className="border border-gray-400 py-2.5 px-2.5 text-right font-black text-emerald-800">
                      {formatMoney(totalPartidasDisponible)}
                    </td>
                    <td className="border border-gray-400 py-2.5 px-2 text-center font-black">
                      {pctPartidasGlobal}%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Firmas */}
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
                  <p className="text-[9px] text-gray-600 mt-1">Gerente de Área / Dirección EPTAM</p>
                  <p className="text-[8px] text-gray-500 mt-4">Firma y Sello</p>
                </div>
              </div>
            </div>

            {/* Nota al pie */}
            <div className="border-t border-gray-300 pt-2 text-[8px] text-gray-500 flex justify-between">
              <span>Sistema POA - EPTAM • Documento Oficial de Control por Partidas Presupuestarias</span>
              <span>Montos expresados en Bolivianos (Bs.)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
