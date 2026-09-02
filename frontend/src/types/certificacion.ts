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

export interface CertificacionPOA {
  id: number;
  codigo_certificacion: string;
  numero_oficio_solicitud: string;
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
  partida?: number | null;
  partida_codigo?: string | null;
  partida_nombre?: string | null;
  partida_literal?: string | null;
  monto_solicitado: string | number;
  concepto_gasto?: string | null;
  notas: string;
  solicitante_nombre: string;
  solicitante_cargo: string;
  elaborador_nombre: string;
  elaborador_cargo: string;
  estado: 'BORRADOR' | 'APROBADO' | 'ANULADO';
  estado_display: string;
  creado_por?: number | null;
  creado_por_nombre?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CertificacionFormData {
  codigo_certificacion: string;
  numero_oficio_solicitud: string;
  gestion: number;
  area: number;
  fecha: string;
  version: string;
  operaciones: number[];
  memoria?: number | null;
  partida?: number | null;
  partida_literal?: string;
  monto_solicitado?: number | string;
  concepto_gasto?: string;
  notas: string;
  solicitante_nombre: string;
  solicitante_cargo: string;
  elaborador_nombre: string;
  elaborador_cargo: string;
  estado?: 'BORRADOR' | 'APROBADO' | 'ANULADO';
}
