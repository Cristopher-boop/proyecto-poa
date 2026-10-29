import React from 'react';
import { Printer, X, Building2 } from 'lucide-react';
import { Gestion } from '../../../services/presupuestoService';
import {
  ReportCategory,
  SubReportPresupuesto,
  SubReportMemoria,
  SubReportModificacion,
  SubReportGasto,
  PresupuestoAreaResumen,
  PartidaConsolidadaReporte,
  MemoriaEstadoRow,
  ItemRequerimientoRow,
  ModificacionRow,
  MatrizTraspasoRow,
  GastoReporteRow,
  CertificacionReporteRow,
  SemaforoAreaRow,
} from '../types/reportes.types';

interface ReporteImprimibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  gestionActiva: Gestion | null;
  activeCategory: ReportCategory;
  subReportPresupuesto: SubReportPresupuesto;
  subReportMemoria: SubReportMemoria;
  subReportModificacion: SubReportModificacion;
  subReportGasto: SubReportGasto;
  selectedAreaNombre: string;
  userNombre: string;
  userCargo: string;
  formatMoney: (val: number | string | undefined | null) => string;

  // Datasets
  presupuestosInstitucionales: PresupuestoAreaResumen[];
  partidasConsolidadas: PartidaConsolidadaReporte[];
  memoriasPorEstado: MemoriaEstadoRow[];
  itemsRequerimientos: ItemRequerimientoRow[];
  itemsContrataciones: ItemRequerimientoRow[];
  historialModificaciones: ModificacionRow[];
  matrizTraspasos: MatrizTraspasoRow[];
  incrementosPresupuestarios: ModificacionRow[];
  libroGastos: GastoReporteRow[];
  certificacionesPOA: CertificacionReporteRow[];
  semaforoEjecucion: SemaforoAreaRow[];
}

export const ReporteImprimibleModal: React.FC<ReporteImprimibleModalProps> = ({
  isOpen,
  onClose,
  gestionActiva,
  activeCategory,
  subReportPresupuesto,
  subReportMemoria,
  subReportModificacion,
  subReportGasto,
  selectedAreaNombre,
  userNombre,
  userCargo,
  formatMoney,
  presupuestosInstitucionales,
  partidasConsolidadas,
  memoriasPorEstado,
  itemsRequerimientos,
  itemsContrataciones,
  historialModificaciones,
  matrizTraspasos,
  incrementosPresupuestarios,
  libroGastos,
  certificacionesPOA,
  semaforoEjecucion,
}) => {
  if (!isOpen) return null;

  // Determinar título del reporte
  let tituloReporte = 'REPORTE OFICIAL DEL PLAN OPERATIVO ANUAL (POA)';
  let subtituloReporte = 'DOCUMENTO OFICIAL DE CONTROL PRESUPUESTARIO INSTITUCIONAL';

  if (activeCategory === 'presupuestos') {
    if (subReportPresupuesto === 'institucional') {
      tituloReporte = 'CONSOLIDADO INSTITUCIONAL DE PRESUPUESTOS Y TECHOS POA';
      subtituloReporte = 'DISTRIBUCIÓN Y EJECUCIÓN FINANCIERA POR GERENCIAS Y ÁREAS ORGANIZACIONALES';
    } else {
      tituloReporte = 'CLASIFICADOR INSTITUCIONAL DE PARTIDAS PRESUPUESTARIAS';
      subtituloReporte = 'ESTADO DE ASIGNACIÓN Y DISPONIBILIDAD POR GRUPOS Y PARTIDAS DE GASTO';
    }
  } else if (activeCategory === 'memorias') {
    if (subReportMemoria === 'estados') {
      tituloReporte = 'ESTADO Y TRAZABILIDAD DEL CIRCUITO DE MEMORIAS DE CÁLCULO (MC)';
      subtituloReporte = 'RESUMEN DE AVANCE EN LA VALIDACIÓN FORMAL POR GERENCIAS Y UNIDADES';
    } else if (subReportMemoria === 'contrataciones_pac') {
      tituloReporte = 'PROGRAMA ANUAL DE CONTRATACIONES Y COMPRAS (PAC - POA)';
      subtituloReporte = 'REQUERIMIENTOS TÉCNICOS DESTINADOS A CONTRATACIÓN DE BIENES Y SERVICIOS';
    } else {
      tituloReporte = 'CATÁLOGO OFICIAL DE REQUERIMIENTOS TÉCNICOS E ÍTEMS FORMULADOS';
      subtituloReporte = 'JUSTIFICACIÓN DETALLADA DE BIENES, INSUMOS Y SERVICIOS PROGRAMADOS';
    }
  } else if (activeCategory === 'modificaciones') {
    if (subReportModificacion === 'matriz_traspasos') {
      tituloReporte = 'MATRIZ OFICIAL DE TRASPASOS PRESUPUESTARIOS COMPENSADOS';
      subtituloReporte = 'TRAZABILIDAD DE MOVIMIENTOS FINANCIEROS (ORIGEN CEDENTE → DESTINO RECEPTOR)';
    } else if (subReportModificacion === 'incrementos') {
      tituloReporte = 'REPORTE DE INCREMENTOS Y AMPLIACIONES DE TECHO POA';
      subtituloReporte = 'INYECCIONES Y CREACIONES PRESUPUESTARIAS AUTORIZADAS EN EJECUCIÓN';
    } else {
      tituloReporte = 'HISTORIAL MAESTRO DE MODIFICACIONES PRESUPUESTARIAS';
      subtituloReporte = 'REGISTRO CONSOLIDADO DE TRASPASOS, INCREMENTOS Y REDUCCIONES';
    }
  } else {
    if (subReportGasto === 'certificaciones') {
      tituloReporte = 'REPORTE DE CERTIFICACIONES POA EMITIDAS Y EN TRÁMITE';
      subtituloReporte = 'CONTROL PREVENTIVO DE CRÉDITO Y ALINEACIÓN ESTRATÉGICA DEL GASTO';
    } else if (subReportGasto === 'eficiencia_semaforo') {
      tituloReporte = 'SEMÁFORO DE EFICIENCIA Y RENDIMIENTO FINANCIERO POA';
      subtituloReporte = 'EVALUACIÓN DE VELOCIDAD DE EJECUCIÓN FRENTE AL TIEMPO FISCAL';
    } else {
      tituloReporte = 'LIBRO DIARIO DE GASTOS Y COMPROBANTES EJECUTADOS';
      subtituloReporte = 'REGISTRO CRONOLÓGICO DE DESEMBOLSOS Y PREVENTIVOS DEVENGADOS';
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:overflow-visible">
      <div className="bg-white text-black border border-gray-300 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden print:max-w-none print:max-h-none print:border-none print:shadow-none print:w-full">
        {/* Barra superior de control (Se oculta en la impresión) */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Printer size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Vista Previa de Impresión Oficial (PDF)
              </h3>
              <p className="text-[11px] text-gray-500">
                Formato institucional EPTAM con firmas y encabezados normativos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-blue-700 text-white text-xs font-bold hover:bg-blue-800 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer size={15} />
              Imprimir / Guardar en PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              title="Cerrar vista previa"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Hoja Imprimible Oficial (Adaptada para papel A4 y Carta) */}
        <div className="p-6 sm:p-10 overflow-y-auto print:overflow-visible print:p-4 bg-white text-black space-y-6">
          {/* 1. Encabezado Institucional del Estado Plurinacional */}
          <div className="border-b-2 border-black pb-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-700">
                  ESTADO PLURINACIONAL DE BOLIVIA
                </p>
                <h1 className="text-base sm:text-lg font-black uppercase tracking-wider text-black mt-0.5">
                  EMPRESA PÚBLICA DE TRANSPORTE AÉREO MILITAR - EPTAM
                </h1>
                <p className="text-[10px] font-semibold tracking-wide text-gray-600 uppercase">
                  SISTEMA INTEGRADO DE PROGRAMACIÓN OPERATIVA ANUAL (POA)
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block border-2 border-black px-3 py-1 text-xs font-black uppercase tracking-wider">
                  POA {gestionActiva?.anio || '2026'}
                </span>
              </div>
            </div>

            <div className="mt-4 text-center">
              <h2 className="text-sm sm:text-base font-black uppercase tracking-wide text-black underline underline-offset-4">
                {tituloReporte}
              </h2>
              <p className="text-[11px] font-bold text-gray-800 mt-1 uppercase">
                {subtituloReporte}
              </p>
            </div>
          </div>

          {/* 2. Cuadro de Metadatos del Reporte */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] border border-black bg-gray-50 p-2.5 rounded">
            <div>
              <span className="font-bold text-gray-600 block uppercase text-[9px]">
                Gestión Fiscal:
              </span>
              <span className="font-black text-black">{gestionActiva?.anio || '2026'}</span>
            </div>
            <div>
              <span className="font-bold text-gray-600 block uppercase text-[9px]">
                Fecha de Emisión:
              </span>
              <span className="font-bold text-black">
                {new Date().toLocaleDateString('es-BO')}{' '}
                {new Date().toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div>
              <span className="font-bold text-gray-600 block uppercase text-[9px]">
                Alcance Evaluado:
              </span>
              <span className="font-black text-black truncate block">
                {selectedAreaNombre}
              </span>
            </div>
            <div>
              <span className="font-bold text-gray-600 block uppercase text-[9px]">
                Emitido Por:
              </span>
              <span className="font-medium text-black truncate block">
                {userNombre} {userCargo ? `(${userCargo})` : ''}
              </span>
            </div>
          </div>

          {/* 3. Tablas de Datos del Reporte según la categoría activa */}
          <div className="overflow-x-auto">
            {activeCategory === 'presupuestos' && subReportPresupuesto === 'institucional' && (
              <table className="w-full text-[11px] border-collapse border border-black">
                <thead>
                  <tr className="bg-gray-100 text-black border-b border-black">
                    <th className="border border-black p-1.5 text-left font-black uppercase">Gerencia / Área</th>
                    <th className="border border-black p-1.5 text-left font-black uppercase">Programa</th>
                    <th className="border border-black p-1.5 text-right font-black uppercase">Presupuesto Inicial</th>
                    <th className="border border-black p-1.5 text-right font-black uppercase">Monto Vigente</th>
                    <th className="border border-black p-1.5 text-right font-black uppercase">Ejecutado</th>
                    <th className="border border-black p-1.5 text-right font-black uppercase">Disponible</th>
                    <th className="border border-black p-1.5 text-center font-black uppercase">% Ejec.</th>
                  </tr>
                </thead>
                <tbody>
                  {presupuestosInstitucionales.map((p, idx) => (
                    <tr key={idx} className="border-b border-gray-300">
                      <td className="border border-black p-1.5 font-semibold">{p.areaNombre}</td>
                      <td className="border border-black p-1.5 text-gray-700">{p.programaNombre}</td>
                      <td className="border border-black p-1.5 text-right font-mono">{formatMoney(p.montoInicial)}</td>
                      <td className="border border-black p-1.5 text-right font-mono font-semibold">{formatMoney(p.montoVigente)}</td>
                      <td className="border border-black p-1.5 text-right font-mono text-red-800 font-semibold">{formatMoney(p.montoEjecutado)}</td>
                      <td className="border border-black p-1.5 text-right font-mono text-emerald-800 font-bold">{formatMoney(p.saldoDisponible)}</td>
                      <td className="border border-black p-1.5 text-center font-bold">{p.porcentajeEjecucion}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeCategory === 'presupuestos' && subReportPresupuesto === 'por_partida' && (
              <table className="w-full text-[11px] border-collapse border border-black">
                <thead>
                  <tr className="bg-gray-100 text-black border-b border-black">
                    <th className="border border-black p-1.5 text-left font-black uppercase">Código</th>
                    <th className="border border-black p-1.5 text-left font-black uppercase">Partida Presupuestaria</th>
                    <th className="border border-black p-1.5 text-right font-black uppercase">Presupuestado</th>
                    <th className="border border-black p-1.5 text-right font-black uppercase">Ejecutado</th>
                    <th className="border border-black p-1.5 text-right font-black uppercase">Disponible</th>
                    <th className="border border-black p-1.5 text-center font-black uppercase">% Ejec.</th>
                  </tr>
                </thead>
                <tbody>
                  {partidasConsolidadas.map((p, idx) => (
                    <tr key={idx} className="border-b border-gray-300">
                      <td className="border border-black p-1.5 font-mono font-bold">{p.codigo}</td>
                      <td className="border border-black p-1.5">{p.nombre}</td>
                      <td className="border border-black p-1.5 text-right font-mono">{formatMoney(p.presupuestado)}</td>
                      <td className="border border-black p-1.5 text-right font-mono text-red-800">{formatMoney(p.ejecutado)}</td>
                      <td className="border border-black p-1.5 text-right font-mono text-emerald-800 font-bold">{formatMoney(p.disponible)}</td>
                      <td className="border border-black p-1.5 text-center font-bold">{p.porcentajeEjecucion}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeCategory === 'memorias' && subReportMemoria === 'estados' && (
              <table className="w-full text-[11px] border-collapse border border-black">
                <thead>
                  <tr className="bg-gray-100 text-black border-b border-black">
                    <th className="border border-black p-1.5 text-left font-black uppercase">Gerencia / Área</th>
                    <th className="border border-black p-1.5 text-center font-black uppercase">Total MCs</th>
                    <th className="border border-black p-1.5 text-center font-black uppercase">Borrador</th>
                    <th className="border border-black p-1.5 text-center font-black uppercase">Pend. Gerencia</th>
                    <th className="border border-black p-1.5 text-center font-black uppercase">Aprob. Gerencia</th>
                    <th className="border border-black p-1.5 text-center font-black uppercase">En Planificación</th>
                    <th className="border border-black p-1.5 text-center font-black uppercase">Aprob. Finanzas</th>
                    <th className="border border-black p-1.5 text-right font-black uppercase">Monto Formulado</th>
                  </tr>
                </thead>
                <tbody>
                  {memoriasPorEstado.map((m, idx) => (
                    <tr key={idx} className="border-b border-gray-300">
                      <td className="border border-black p-1.5 font-semibold">{m.areaNombre}</td>
                      <td className="border border-black p-1.5 text-center font-bold">{m.totalMemorias}</td>
                      <td className="border border-black p-1.5 text-center">{m.borrador}</td>
                      <td className="border border-black p-1.5 text-center text-amber-800">{m.pendienteGerencia}</td>
                      <td className="border border-black p-1.5 text-center text-blue-800">{m.aprobadoGerencia}</td>
                      <td className="border border-black p-1.5 text-center text-indigo-800">{m.pendientePlanificacion}</td>
                      <td className="border border-black p-1.5 text-center font-bold text-emerald-800">{m.aprobadoFinanzas}</td>
                      <td className="border border-black p-1.5 text-right font-mono font-semibold">{formatMoney(m.montoFormulado)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeCategory === 'memorias' && subReportMemoria !== 'estados' && (
              <table className="w-full text-[10px] border-collapse border border-black">
                <thead>
                  <tr className="bg-gray-100 text-black border-b border-black">
                    <th className="border border-black p-1.5 text-left font-black uppercase">Descripción del Requerimiento</th>
                    <th className="border border-black p-1.5 text-left font-black uppercase">Partida</th>
                    <th className="border border-black p-1.5 text-left font-black uppercase">Gerencia</th>
                    <th className="border border-black p-1.5 text-center font-black uppercase">U.M.</th>
                    <th className="border border-black p-1.5 text-center font-black uppercase">Cant.</th>
                    <th className="border border-black p-1.5 text-right font-black uppercase">P. Unitario</th>
                    <th className="border border-black p-1.5 text-right font-black uppercase">Total</th>
                    <th className="border border-black p-1.5 text-center font-black uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {(subReportMemoria === 'contrataciones_pac' ? itemsContrataciones : itemsRequerimientos).slice(0, 150).map((it, idx) => (
                    <tr key={idx} className="border-b border-gray-300">
                      <td className="border border-black p-1.5 font-medium">{it.descripcion}</td>
                      <td className="border border-black p-1.5">{it.partidaNombre}</td>
                      <td className="border border-black p-1.5">{it.areaNombre}</td>
                      <td className="border border-black p-1.5 text-center">{it.unidadMedida}</td>
                      <td className="border border-black p-1.5 text-center font-bold">{it.cantidad}</td>
                      <td className="border border-black p-1.5 text-right font-mono">{formatMoney(it.precioUnitario)}</td>
                      <td className="border border-black p-1.5 text-right font-mono font-bold">{formatMoney(it.precioTotal)}</td>
                      <td className="border border-black p-1.5 text-center">{it.estadoGasto}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeCategory === 'modificaciones' && subReportModificacion === 'matriz_traspasos' && (
              <table className="w-full text-[11px] border-collapse border border-black">
                <thead>
                  <tr className="bg-gray-100 text-black border-b border-black">
                    <th className="border border-black p-1.5 text-left font-black uppercase">Cód.</th>
                    <th className="border border-black p-1.5 text-left font-black uppercase">Origen (Cedente)</th>
                    <th className="border border-black p-1.5 text-left font-black uppercase">Destino (Receptor)</th>
                    <th className="border border-black p-1.5 text-right font-black uppercase">Monto Compensado</th>
                    <th className="border border-black p-1.5 text-left font-black uppercase">Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {matrizTraspasos.map((t, idx) => (
                    <tr key={idx} className="border-b border-gray-300">
                      <td className="border border-black p-1.5 font-mono font-bold">{t.modificacionCodigo}</td>
                      <td className="border border-black p-1.5">{t.origenArea} ({t.origenPartida})</td>
                      <td className="border border-black p-1.5">{t.destinoArea} ({t.destinoPartida})</td>
                      <td className="border border-black p-1.5 text-right font-mono font-bold">{formatMoney(t.monto)}</td>
                      <td className="border border-black p-1.5">{t.motivo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeCategory === 'modificaciones' && subReportModificacion !== 'matriz_traspasos' && (
              <table className="w-full text-[11px] border-collapse border border-black">
                <thead>
                  <tr className="bg-gray-100 text-black border-b border-black">
                    <th className="border border-black p-1.5 text-left font-black uppercase">Código</th>
                    <th className="border border-black p-1.5 text-left font-black uppercase">Fecha</th>
                    <th className="border border-black p-1.5 text-left font-black uppercase">Tipo</th>
                    <th className="border border-black p-1.5 text-left font-black uppercase">Gerencia Solicitante</th>
                    <th className="border border-black p-1.5 text-right font-black uppercase">Monto (Bs)</th>
                    <th className="border border-black p-1.5 text-center font-black uppercase">Estado</th>
                    <th className="border border-black p-1.5 text-left font-black uppercase">Justificación</th>
                  </tr>
                </thead>
                <tbody>
                  {(subReportModificacion === 'incrementos' ? incrementosPresupuestarios : historialModificaciones).map((m, idx) => (
                    <tr key={idx} className="border-b border-gray-300">
                      <td className="border border-black p-1.5 font-mono font-bold">{m.codigo}</td>
                      <td className="border border-black p-1.5">{m.fecha}</td>
                      <td className="border border-black p-1.5 font-semibold">{m.tipoDisplay}</td>
                      <td className="border border-black p-1.5">{m.areaSolicitante}</td>
                      <td className="border border-black p-1.5 text-right font-mono font-bold">{formatMoney(m.monto)}</td>
                      <td className="border border-black p-1.5 text-center font-bold">{m.estadoDisplay}</td>
                      <td className="border border-black p-1.5">{m.motivo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeCategory === 'gastos' && subReportGasto === 'libro_gastos' && (
              <table className="w-full text-[11px] border-collapse border border-black">
                <thead>
                  <tr className="bg-gray-100 text-black border-b border-black">
                    <th className="border border-black p-1.5 text-left font-black uppercase">Fecha</th>
                    <th className="border border-black p-1.5 text-left font-black uppercase">Comprobante</th>
                    <th className="border border-black p-1.5 text-left font-black uppercase">Gerencia</th>
                    <th className="border border-black p-1.5 text-left font-black uppercase">Partida</th>
                    <th className="border border-black p-1.5 text-left font-black uppercase">Concepto</th>
                    <th className="border border-black p-1.5 text-right font-black uppercase">Monto Ejecutado</th>
                  </tr>
                </thead>
                <tbody>
                  {libroGastos.map((g, idx) => (
                    <tr key={idx} className="border-b border-gray-300">
                      <td className="border border-black p-1.5">{g.fecha}</td>
                      <td className="border border-black p-1.5 font-mono font-bold">{g.comprobante}</td>
                      <td className="border border-black p-1.5">{g.areaNombre}</td>
                      <td className="border border-black p-1.5">{g.partidaNombre}</td>
                      <td className="border border-black p-1.5">{g.concepto}</td>
                      <td className="border border-black p-1.5 text-right font-mono font-bold text-red-900">{formatMoney(g.monto)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeCategory === 'gastos' && subReportGasto === 'certificaciones' && (
              <table className="w-full text-[11px] border-collapse border border-black">
                <thead>
                  <tr className="bg-gray-100 text-black border-b border-black">
                    <th className="border border-black p-1.5 text-left font-black uppercase">Nº Certificación</th>
                    <th className="border border-black p-1.5 text-left font-black uppercase">Fecha</th>
                    <th className="border border-black p-1.5 text-left font-black uppercase">Unidad Solicitante</th>
                    <th className="border border-black p-1.5 text-left font-black uppercase">Objeto del Gasto</th>
                    <th className="border border-black p-1.5 text-right font-black uppercase">Monto Solicitado</th>
                    <th className="border border-black p-1.5 text-center font-black uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {certificacionesPOA.map((c, idx) => (
                    <tr key={idx} className="border-b border-gray-300">
                      <td className="border border-black p-1.5 font-mono font-bold">{c.codigo}</td>
                      <td className="border border-black p-1.5">{c.fecha}</td>
                      <td className="border border-black p-1.5 font-semibold">{c.areaNombre}</td>
                      <td className="border border-black p-1.5">{c.concepto}</td>
                      <td className="border border-black p-1.5 text-right font-mono font-bold">{formatMoney(c.montoSolicitado)}</td>
                      <td className="border border-black p-1.5 text-center font-bold">{c.estadoDisplay}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeCategory === 'gastos' && subReportGasto === 'eficiencia_semaforo' && (
              <table className="w-full text-[11px] border-collapse border border-black">
                <thead>
                  <tr className="bg-gray-100 text-black border-b border-black">
                    <th className="border border-black p-1.5 text-left font-black uppercase">Gerencia / Área</th>
                    <th className="border border-black p-1.5 text-right font-black uppercase">Techo Asignado</th>
                    <th className="border border-black p-1.5 text-right font-black uppercase">Monto Ejecutado</th>
                    <th className="border border-black p-1.5 text-right font-black uppercase">Saldo Disponible</th>
                    <th className="border border-black p-1.5 text-center font-black uppercase">% Ejecución</th>
                    <th className="border border-black p-1.5 text-center font-black uppercase">Calificación POA</th>
                  </tr>
                </thead>
                <tbody>
                  {semaforoEjecucion.map((s, idx) => (
                    <tr key={idx} className="border-b border-gray-300">
                      <td className="border border-black p-1.5 font-semibold">{s.areaNombre}</td>
                      <td className="border border-black p-1.5 text-right font-mono">{formatMoney(s.techoAsignado)}</td>
                      <td className="border border-black p-1.5 text-right font-mono text-red-900">{formatMoney(s.montoEjecutado)}</td>
                      <td className="border border-black p-1.5 text-right font-mono text-emerald-900 font-bold">{formatMoney(s.saldoDisponible)}</td>
                      <td className="border border-black p-1.5 text-center font-bold">{s.porcentajeEjecucion}%</td>
                      <td className="border border-black p-1.5 text-center font-bold uppercase">
                        {s.estadoSemaforo === 'optimo'
                          ? 'Óptimo (≥70%)'
                          : s.estadoSemaforo === 'moderado'
                          ? 'Regular (40-69%)'
                          : 'Rezago (<40%)'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* 4. Bloque Institucional de Firmas Reglamentarias */}
          <div className="pt-12 mt-12 border-t border-black grid grid-cols-3 gap-6 text-center text-[10px]">
            <div>
              <div className="border-t border-black w-40 mx-auto mb-1"></div>
              <p className="font-bold uppercase text-black">Responsable de Gerencia</p>
              <p className="text-gray-600">Unidad Solicitante / Operativa</p>
            </div>
            <div>
              <div className="border-t border-black w-40 mx-auto mb-1"></div>
              <p className="font-bold uppercase text-black">Responsable de Planificación</p>
              <p className="text-gray-600">Alineación Estratégica PEI - POA</p>
            </div>
            <div>
              <div className="border-t border-black w-40 mx-auto mb-1"></div>
              <p className="font-bold uppercase text-black">Responsable de Presupuestos</p>
              <p className="text-gray-600">Gerencia Administrativa Financiera</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
