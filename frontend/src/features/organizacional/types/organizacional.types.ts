export * from '../../../types/organizacional';

export type OrganizacionalTab = 'JERARQUIA' | 'AREAS' | 'SECCIONES' | 'PROGRAMAS';

export interface AreaFormValues {
  programa: string | number;
  codigo: string;
  nombre: string;
  tipo: 'GERENCIA' | 'UNIDAD';
  descripcion?: string;
}

export interface SeccionFormValues {
  area: string | number;
  nombre: string;
  descripcion?: string;
}

export interface ProgramaFormValues {
  codigo: string;
  nombre: string;
  descripcion?: string;
}

export interface HierarchicalAreaItem {
  id: number;
  codigo: string;
  nombre: string;
  tipo: 'GERENCIA' | 'UNIDAD';
  tipo_display?: string;
  programaId: number;
  programaNombre: string;
  programaCodigo: string;
  estado: boolean;
  secciones: {
    id: number;
    nombre: string;
    descripcion: string | null;
    estado: boolean;
  }[];
}
