export type ClasePartida = 'EGRESO' | 'INGRESO';

export interface Partida {
  id: number;
  codigo: string;
  nombre: string;
  clase: ClasePartida;
  clase_display?: string;
  descripcion: string | null;
  estado: boolean;
  created_at: string;
  updated_at?: string;
}

export interface PartidaFormData {
  codigo: string;
  nombre: string;
  clase: ClasePartida;
  descripcion: string;
  estado: boolean;
}
