// Tipos del módulo organizacional

export interface Programa {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  estado: boolean;
  areas_count?: number;
  areas?: Area[];
  created_at: string;
  updated_at: string;
}

export interface Area {
  id: number;
  programa: number;
  programa_nombre?: string;
  programa_codigo?: string;
  gestion?: number | null;
  gestion_anio?: number;
  codigo: string;
  nombre: string;
  tipo: 'GERENCIA' | 'UNIDAD';
  tipo_display?: string;
  descripcion: string | null;
  estado: boolean;
  secciones_count?: number;
  secciones?: Seccion[];
  created_at: string;
  updated_at: string;
}

export interface Seccion {
  id: number;
  area: number;
  area_nombre?: string;
  area_codigo?: string;
  area_tipo?: string;
  nombre: string;
  descripcion: string | null;
  estado: boolean;
  created_at: string;
  updated_at: string;
}

export interface Rol {
  id: number;
  nombre: string;
  descripcion: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Usuario {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  cargo: string | null;
  seccion: number | null;
  seccion_nombre?: string;
  rol: number | null;
  rol_nombre?: string;
  estado: boolean;
  is_active: boolean;
}

export interface ProgramaFormData {
  codigo: string;
  nombre: string;
  descripcion: string;
  estado: boolean;
}

export interface AreaFormData {
  programa: number | string;
  gestion?: number | string | null;
  codigo: string;
  nombre: string;
  tipo: 'GERENCIA' | 'UNIDAD';
  descripcion: string;
  estado: boolean;
}

export interface SeccionFormData {
  area: number | string;
  nombre: string;
  descripcion: string;
  estado: boolean;
}
