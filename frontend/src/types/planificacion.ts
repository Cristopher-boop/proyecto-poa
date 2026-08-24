export interface AccionMedianoPlazo {
  id: number;
  programa: number;
  programa_codigo?: string;
  programa_nombre?: string;
  codigo: string;
  descripcion: string;
  periodo_inicio: number;
  periodo_fin: number;
  estado: boolean;
  acciones_corto_plazo?: AccionCortoPlazo[];
  created_at: string;
}

export interface AccionCortoPlazo {
  id: number;
  accion_mediano_plazo: number;
  amp_codigo?: string;
  gestion?: number;
  gestion_anio?: number;
  codigo: string;
  descripcion: string;
  estado: boolean;
  operaciones?: Operacion[];
  created_at: string;
}

export interface Tarea {
  id: number;
  operacion: number;
  operacion_codigo?: string;
  codigo: string;
  descripcion: string;
  estado: boolean;
  created_at: string;
}

export interface Operacion {
  id: number;
  accion_corto_plazo: number;
  acp_codigo?: string;
  area: number;
  area_codigo?: string;
  area_nombre?: string;
  codigo: string;
  descripcion: string;
  es_contratacion: boolean;
  estado: boolean;
  tareas?: Tarea[];
  created_at: string;
}
