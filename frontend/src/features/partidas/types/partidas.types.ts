import { Partida, PartidaFormData, ClasePartida } from '../../../types/partida';

export type { Partida, PartidaFormData, ClasePartida };

export type PartidaEstadoFilter = 'todas' | 'activas' | 'inactivas';

export interface PartidaStats {
  total: number;
  activas: number;
  inactivas: number;
  totalGrupos: number;
}

export interface PartidaGrupoInfo {
  codigo: string;
  nombre: string;
  color?: string;
}

export const GRUPOS_PRESUPUESTARIOS: Record<string, string> = {
  '1': '10000 - Servicios Personales',
  '2': '20000 - Servicios No Personales',
  '3': '30000 - Materiales y Suministros',
  '4': '40000 - Activos Reales',
  '5': '50000 - Activos Financieros',
  '6': '60000 - Servicio de la Deuda Pública',
  '7': '70000 - Transferencias',
  '8': '80000 - Impuestos, Regalías y Tasas',
  '9': '90000 - Otros Gastos',
};

export function getPartidaGrupo(codigo: string): PartidaGrupoInfo {
  if (!codigo) return { codigo: '0', nombre: 'Sin Clasificar' };
  const firstDigit = codigo.trim().charAt(0);
  const nombre = GRUPOS_PRESUPUESTARIOS[firstDigit] || `Grupo ${firstDigit}0000`;
  return {
    codigo: `${firstDigit}0000`,
    nombre,
  };
}
