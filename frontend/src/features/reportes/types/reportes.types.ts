import { ReactNode } from 'react';
import { Area, Partida, Gestion, PresupuestoArea } from '../../../services/presupuestoService';

export type ReportCategory = 'presupuestos' | 'memorias' | 'modificaciones' | 'gastos' | 'consolidado';

export type SubReportPresupuesto = 'institucional' | 'por_area' | 'por_partida';
export type SubReportMemoria = 'estados' | 'items_requerimientos' | 'contrataciones_pac';
export type SubReportModificacion = 'historial' | 'matriz_traspasos' | 'incrementos';
export type SubReportGasto = 'libro_gastos' | 'certificaciones' | 'eficiencia_semaforo';
export type SubReportConsolidado = 'ficha_ejecutiva';

export type AnySubReport =
  | SubReportPresupuesto
  | SubReportMemoria
  | SubReportModificacion
  | SubReportGasto
  | SubReportConsolidado;

export interface PresupuestoAreaResumen {
  areaId: number;
  areaNombre: string;
  areaTipo: 'GERENCIA' | 'UNIDAD';
  programaNombre: string;
  montoInicial: number;
  modificacionesEntrantes: number;
  modificacionesSalientes: number;
  montoVigente: number;
  montoEjecutado: number;
  saldoDisponible: number;
  porcentajeEjecucion: number;
}

export interface PartidaConsolidadaReporte {
  partidaId: number;
  codigo: string;
  nombre: string;
  clase: string;
  presupuestado: number;
  incrementos: number;
  disminuciones: number;
  vigente: number;
  ejecutado: number;
  disponible: number;
  porcentajeEjecucion: number;
}

export interface MemoriaEstadoRow {
  areaId: number;
  areaNombre: string;
  totalMemorias: number;
  borrador: number;
  pendienteGerencia: number;
  aprobadoGerencia: number;
  pendientePlanificacion: number;
  aprobadoPlanificacion: number;
  aprobadoFinanzas: number;
  rechazado: number;
  montoFormulado: number;
  montoAprobadoFinanzas: number;
}

export interface ItemRequerimientoRow {
  id: number;
  descripcion: string;
  unidadMedida: string;
  cantidad: number;
  precioUnitario: number;
  precioTotal: number;
  partidaCodigo: string;
  partidaNombre: string;
  areaNombre: string;
  seccionNombre: string;
  esContratacion: boolean;
  estadoGasto: string;
  mesRequerido?: string;
  memoriaCodigo: string;
}

export interface ModificacionRow {
  id: number;
  codigo: string;
  fecha: string;
  tipo: string;
  tipoDisplay: string;
  areaSolicitante: string;
  areaCedente?: string;
  motivo: string;
  monto: number;
  estado: string;
  estadoDisplay: string;
  usuarioSolicitante: string;
  aprobadoPor?: string;
}

export interface MatrizTraspasoRow {
  id: number;
  modificacionCodigo: string;
  fecha: string;
  origenArea: string;
  origenPartida: string;
  origenMemoria: string;
  destinoArea: string;
  destinoPartida: string;
  destinoMemoria: string;
  monto: number;
  motivo: string;
}

export interface GastoReporteRow {
  id: number;
  fecha: string;
  comprobante: string;
  areaNombre: string;
  seccionNombre: string;
  partidaCodigo: string;
  partidaNombre: string;
  memoriaCodigo: string;
  concepto: string;
  monto: number;
  registradoPor: string;
}

export interface CertificacionReporteRow {
  id: number;
  codigo: string;
  fecha: string;
  areaNombre: string;
  montoSolicitado: number;
  concepto: string;
  estado: string;
  estadoDisplay: string;
  esContratacion: boolean;
  operacionCodigo?: string;
  numeroOficio?: string;
  comprobantePago?: string;
  solicitante: string;
}

export interface SemaforoAreaRow {
  areaId: number;
  areaNombre: string;
  techoAsignado: number;
  montoEjecutado: number;
  saldoDisponible: number;
  porcentajeEjecucion: number;
  estadoSemaforo: 'optimo' | 'moderado' | 'critico';
  diasTranscurridos: number;
}
