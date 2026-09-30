import {
  Gestion,
  PresupuestoArea,
  ResumenGestion,
  DetalleArea,
  SeccionDetalleArea,
  MemoriaDetalleArea,
  PartidaDetalleArea,
  ItemDetalleArea,
  TraspasoDetalleArea,
  Area,
  Gasto,
  MemoriaCalculo,
} from '../../../services/presupuestoService';

export type {
  Gestion,
  PresupuestoArea,
  ResumenGestion,
  DetalleArea,
  SeccionDetalleArea,
  MemoriaDetalleArea,
  PartidaDetalleArea,
  ItemDetalleArea,
  TraspasoDetalleArea,
  Area,
  Gasto,
  MemoriaCalculo,
};

export type PresupuestoViewMode = 'general' | 'seccion' | 'reporte';
export type AgrupacionViewMode = 'gerencias' | 'programas';
export type TabSeccionMode = 'presupuesto' | 'gastos' | 'partidas';

export type PresupuestoAreaCalculado = PresupuestoArea & {
  monto_ejecutado_periodo: number;
  monto_disponible_periodo: number;
  porcentaje_ejecucion_periodo: number;
};

export interface ResumenPrograma {
  id: number | string;
  codigo: string;
  nombre: string;
  total_inicial: number;
  total_ejecutado: number;
  total_disponible: number;
  porcentaje_ejecucion: number;
  areas: PresupuestoAreaCalculado[];
}

export interface PartidaConsolidada {
  partida_codigo: string;
  partida_nombre: string;
  total_presupuestado: number;
  total_agregado: number;
  total_quitado: number;
  total_ejecutado: number;
  total_disponible: number;
  porcentaje_ejecucion: number;
  memorias: Array<{
    memoria_id: number;
    memoria_codigo: string;
    justificacion: string;
    presupuestado: number;
    agregado: number;
    quitado: number;
    ejecutado: number;
    disponible: number;
    gastos_detalle: Array<{
      gasto_id: number;
      fecha_gasto: string;
      monto: string;
      comprobante: string;
      observacion: string;
      item_descripcion: string;
    }>;
  }>;
}

export interface GastoAuxiliarItem {
  gasto_id: number;
  fecha_gasto: string;
  monto: string;
  comprobante: string;
  observacion: string;
  item_descripcion: string;
  memoria_codigo: string;
  partida_codigo: string;
  partida_nombre: string;
}

export interface MesOption {
  value: number;
  label: string;
}
