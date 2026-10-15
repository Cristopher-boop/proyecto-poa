export interface OperacionDetalle {
  id: number;
  codigo: string;
  descripcion: string;
  acp_id?: number | null;
  acp_codigo: string;
  acp_descripcion: string;
  amp_id?: number | null;
  amp_codigo: string;
  amp_descripcion: string;
  programa_id?: number | null;
  programa_codigo: string;
  programa_nombre: string;
}

export interface JerarquiaResumen {
  amps: { id: number; codigo: string; descripcion: string }[];
  acps: { id: number; codigo: string; descripcion: string }[];
  operaciones: { id: number; codigo: string; descripcion: string }[];
  programas: { id: number; codigo: string; nombre: string }[];
}

export type EstadoCertificacion =
  | 'BORRADOR'
  | 'PENDIENTE_PLANIFICACION'
  | 'PENDIENTE_PRESUPUESTOS'
  | 'PENDIENTE_TESORERIA'
  | 'APROBADO'
  | 'OBSERVADO'
  | 'RECHAZADO'
  | 'ANULADO';

export interface CertificacionPOA {
  id: number;
  codigo_certificacion: string;
  numero_oficio_solicitud: string;
  hoja_ruta: string;
  es_contratacion: boolean;
  gestion: number;
  gestion_anio: number;
  area: number;
  area_codigo: string;
  area_nombre: string;
  area_tipo: string;
  fecha: string;
  version: string;
  operaciones: number[];
  operaciones_detalle: OperacionDetalle[];
  jerarquia_resumen: JerarquiaResumen;
  memoria?: number | null;
  memoria_codigo?: string | null;
  memoria_saldo_disponible?: string | number;
  memoria_total_presupuestado?: string | number;
  memoria_justificacion?: string | null;
  partida?: number | null;
  partida_codigo?: string | null;
  partida_nombre?: string | null;
  partida_literal?: string | null;
  categoria_programatica_codigo?: string;
  categoria_programatica?: string;
  monto_solicitado: string | number;
  concepto_gasto?: string | null;
  notas: string;
  solicitante_nombre: string;
  solicitante_cargo: string;
  elaborador_nombre: string;
  elaborador_cargo: string;
  observacion_planificacion?: string | null;
  observacion_presupuestos?: string | null;
  estado: EstadoCertificacion;
  estado_display: string;
  creado_por?: number | null;
  creado_por_nombre?: string | null;
  aprobado_por?: number | null;
  aprobado_por_nombre?: string | null;
  fecha_aprobacion?: string | null;
  desembolsado_por?: number | null;
  desembolsado_por_nombre?: string | null;
  fecha_desembolso?: string | null;
  comprobante_pago?: string;
  created_at: string;
  updated_at: string;
}

export interface SiguienteCorrelativoResponse {
  gestion_id: number;
  gestion_anio: number;
  area_id?: number | null;
  correlativo_area: number;
  numero_oficio_solicitud: string;
  correlativo_global: number;
  codigo_certificacion: string;
}

export interface CertificacionFormData {
  codigo_certificacion?: string;
  numero_oficio_solicitud?: string;
  hoja_ruta: string;
  es_contratacion: boolean;
  gestion: number;
  area: number;
  fecha: string;
  version: string;
  operaciones: number[];
  memoria?: number | null;
  partida?: number | null;
  partida_literal?: string;
  categoria_programatica_codigo?: string;
  categoria_programatica?: string;
  monto_solicitado: number | string;
  concepto_gasto?: string;
  notas?: string;
  solicitante_nombre?: string;
  solicitante_cargo?: string;
  elaborador_nombre?: string;
  elaborador_cargo?: string;
  observacion_planificacion?: string;
  observacion_presupuestos?: string;
  estado?: EstadoCertificacion;
}
