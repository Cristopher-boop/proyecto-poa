export * from '../../../types/planificacion';

export type PlanificacionTab = 'OPERACIONES' | 'ACP' | 'AMP' | 'COMPARATIVA';

export interface AmpFormData {
  programa: string;
  codigo?: string;
  descripcion?: string;
  periodo_inicio: number;
  periodo_fin: number;
}

export interface AcpFormData {
  programa: string;
  accion_mediano_plazo: string;
  codigo?: string;
  descripcion?: string;
  gestion?: string;
}

export interface OpFormData {
  programa: string;
  accion_corto_plazo: string;
  area: string;
  codigo?: string;
  descripcion?: string;
  es_contratacion?: boolean;
}

export interface PlanificacionFilters {
  searchTerm: string;
  filterGestion: string;
  filterPrograma: string;
  filterArea: string;
}
