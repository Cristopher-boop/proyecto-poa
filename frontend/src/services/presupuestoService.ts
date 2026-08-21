import api from './api';

export interface Gestion {
  id: number;
  anio: number;
  estado: 'FORMULACION' | 'CERRADO_FORMULACION' | 'EN_EJECUCION' | 'FINALIZADO';
  estado_display: string;
  fecha_cierre: string | null;
  total_memorias: number;
  total_presupuesto_inicial: string;
  total_presupuesto_ejecutado: string;
  total_presupuesto_disponible: string;
}

export interface Partida {
  id: number;
  codigo: string;
  nombre: string;
  clase: 'INGRESO' | 'EGRESO';
  clase_display: string;
  descripcion: string | null;
  estado: boolean;
}

export interface PresupuestoArea {
  id: number;
  gestion: number;
  gestion_anio: number;
  gestion_estado: string;
  area: number;
  area_nombre: string;
  area_codigo: string;
  area_tipo: 'GERENCIA' | 'UNIDAD';
  monto_inicial: string;
  monto_actual: string;
  monto_ejecutado: string;
  porcentaje_ejecucion: number;
  total_memorias_aprobadas: number;
  estado: 'ABIERTO' | 'CERRADO';
}

export interface DetallePresupuestoMemoria {
  id?: number;
  partida: number;
  partida_codigo?: string;
  partida_nombre?: string;
  partida_clase?: string;
  descripcion: string;
  unidad_medida: string;
  cantidad: number | string;
  precio_unitario: number | string;
  precio_total?: string;
  estado_ejecucion?: 'PENDIENTE' | 'EJECUTADO_PARCIAL' | 'COMPLETADO';
  monto_ejecutado?: string;
  monto_disponible?: string;
}

export interface RegistroParticipacion {
  id: number;
  usuario: number;
  usuario_nombre: string;
  usuario_username: string;
  tipo_participacion: 'ELABORADOR' | 'REVISOR' | 'APROBADOR';
  created_at: string;
}

export interface MemoriaCalculo {
  id: number;
  codigo: string;
  gestion: number;
  gestion_anio: number;
  gestion_estado: string;
  seccion: number;
  seccion_nombre: string;
  area_id: number;
  area_nombre: string;
  area_codigo: string;
  justificacion: string;
  estado: 'BORRADOR' | 'PENDIENTE_GERENCIA' | 'APROBADO_GERENCIA' | 'APROBADO_FINANZAS' | 'RECHAZADO';
  estado_display: string;
  fecha_aprobacion: string | null;
  partida_id?: number | null;
  partida_codigo?: string | null;
  partida_nombre?: string | null;
  detalles: DetallePresupuestoMemoria[];
  participaciones: RegistroParticipacion[];
  total_presupuesto: string;
  total_ejecutado: string;
  total_disponible: string;
  created_at: string;
  updated_at: string;
}

export interface Gasto {
  id: number;
  monto_ejecutado: string | number;
  fecha_gasto: string;
  comprobante_num: string | null;
  observacion: string | null;
  detalle_memoria: number;
  detalle_descripcion: string;
  partida_id: number;
  partida_codigo: string;
  partida_nombre: string;
  memoria_id: number;
  memoria_codigo: string;
  area_id: number;
  area_nombre: string;
  seccion_nombre: string;
  gestion_id: number;
  gestion_anio: number;
  usuario_registro: number;
  usuario_nombre: string;
  created_at: string;
}

export interface Traspaso {
  id: number;
  monto: string | number;
  motivo: string;
  estado: string;
  estado_display?: string;
  memoria_origen: number;
  memoria_origen_codigo?: string;
  memoria_destino: number;
  memoria_destino_codigo?: string;
  usuario_registro?: number | null;
  usuario_registro_nombre?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SaldoMemoria {
  monto_asignado: string;
  monto_ejecutado: string;
  monto_entrante: string;
  monto_saliente: string;
  disponible: string;
}

export interface ResumenGestion {
  gestion: Gestion;
  total_inicial: string;
  total_disponible: string;
  total_ejecutado: string;
  porcentaje_global: number;
  areas: PresupuestoArea[];
}

export interface Programa {
  id: number;
  codigo: string;
  nombre: string;
}

export interface Area {
  id: number;
  codigo: string;
  nombre: string;
  tipo: 'GERENCIA' | 'UNIDAD';
  secciones: Seccion[];
}

export interface Seccion {
  id: number;
  nombre: string;
  area: number;
  area_nombre?: string;
}

function unpackList<T>(data: any): T[] {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}

// ── Gestiones ─────────────────────────────────────────────────────────────
export async function getGestiones(): Promise<Gestion[]> {
  const { data } = await api.get<any>('/api/v1/presupuestos/gestiones/');
  return unpackList<Gestion>(data);
}

export async function createGestion(payload: { anio: number; estado?: string }): Promise<Gestion> {
  const { data } = await api.post<Gestion>('/api/v1/presupuestos/gestiones/', payload);
  return data;
}

export async function cerrarFormulacionGestion(id: number): Promise<{ message: string; gestion: Gestion }> {
  const { data } = await api.post<{ message: string; gestion: Gestion }>(`/api/v1/presupuestos/gestiones/${id}/cerrar-formulacion/`);
  return data;
}

export async function pasarAEjecucionGestion(id: number): Promise<{ message: string; gestion: Gestion }> {
  const { data } = await api.post<{ message: string; gestion: Gestion }>(`/api/v1/presupuestos/gestiones/${id}/pasar-a-ejecucion/`);
  return data;
}

export async function reabrirFormulacionGestion(id: number): Promise<{ message: string; gestion: Gestion }> {
  const { data } = await api.post<{ message: string; gestion: Gestion }>(`/api/v1/presupuestos/gestiones/${id}/reabrir-formulacion/`);
  return data;
}

export async function consolidarPresupuestosGestion(id: number): Promise<{ message: string; gestion: Gestion }> {
  const { data } = await api.post<{ message: string; gestion: Gestion }>(`/api/v1/presupuestos/gestiones/${id}/consolidar-presupuestos/`);
  return data;
}

// ── Partidas ──────────────────────────────────────────────────────────────
export async function getPartidas(params?: { search?: string; clase?: string; estado?: boolean }): Promise<Partida[]> {
  const { data } = await api.get<any>('/api/v1/presupuestos/partidas/', { params });
  return unpackList<Partida>(data);
}

// ── Presupuestos por Área ─────────────────────────────────────────────────
export async function getPresupuestosArea(params?: { gestion?: number; anio?: number; area?: number }): Promise<PresupuestoArea[]> {
  const { data } = await api.get<any>('/api/v1/presupuestos/techos-area/', { params });
  return unpackList<PresupuestoArea>(data);
}

export async function getResumenGestion(params?: { gestion?: number; anio?: number }): Promise<ResumenGestion> {
  const { data } = await api.get<ResumenGestion>('/api/v1/presupuestos/techos-area/resumen-gestion/', { params });
  return data;
}

export interface GastoDetalle {
  gasto_id: number;
  fecha_gasto: string;
  monto: string;
  comprobante: string;
  observacion: string;
  item_descripcion: string;
}

export interface PartidaDetalleArea {
  partida_codigo: string;
  partida_nombre: string;
  presupuestado: string;
  monto_entrante?: string;
  monto_saliente?: string;
  gastado: string;
  disponible: string;
  gastos_detalle: GastoDetalle[];
}

export interface MemoriaDetalleArea {
  memoria_id: number;
  memoria_codigo: string;
  estado: string;
  estado_display: string;
  justificacion: string;
  total_presupuestado: string;
  total_gastado: string;
  total_disponible: string;
  partidas: PartidaDetalleArea[];
}

export interface SeccionDetalleArea {
  seccion_id: number;
  seccion_nombre: string;
  total_presupuestado: string;
  total_gastado: string;
  total_disponible: string;
  memorias: MemoriaDetalleArea[];
}

export interface DetalleArea {
  area_id: number;
  area_codigo: string;
  area_nombre: string;
  area_tipo: string;
  gestion_anio: number;
  gestion_estado: string;
  monto_inicial: string;
  monto_actual: string;
  monto_ejecutado: string;
  porcentaje_ejecucion: number;
  secciones: SeccionDetalleArea[];
}

export async function getDetalleArea(params: { gestion: number; area: number }): Promise<DetalleArea> {
  const { data } = await api.get<DetalleArea>('/api/v1/presupuestos/techos-area/detalle-area/', { params });
  return data;
}

// ── Memorias de Cálculo ───────────────────────────────────────────────────
export async function getMemorias(params?: {
  gestion?: number;
  anio?: number;
  area?: number;
  seccion?: number;
  estado?: string;
  search?: string;
  partida?: number;
}): Promise<MemoriaCalculo[]> {
  const { data } = await api.get<any>('/api/v1/memorias/memorias-calculo/', { params });
  return unpackList<MemoriaCalculo>(data);
}

export async function getMemoria(id: number): Promise<MemoriaCalculo> {
  const { data } = await api.get<MemoriaCalculo>(`/api/v1/memorias/memorias-calculo/${id}/`);
  return data;
}

export async function createMemoria(payload: {
  codigo: string;
  gestion: number;
  seccion: number;
  justificacion: string;
  partida_id?: number;
  detalles: Array<{
    partida?: number;
    partida_id?: number;
    descripcion: string;
    unidad_medida: string;
    cantidad: number;
    precio_unitario: number;
  }>;
}): Promise<MemoriaCalculo> {
  const { data } = await api.post<MemoriaCalculo>('/api/v1/memorias/memorias-calculo/', payload);
  return data;
}

export async function updateMemoria(
  id: number,
  payload: Partial<{
    codigo: string;
    seccion: number;
    justificacion: string;
    partida_id?: number;
    detalles: Array<{
      partida?: number;
      partida_id?: number;
      descripcion: string;
      unidad_medida: string;
      cantidad: number;
      precio_unitario: number;
    }>;
  }>
): Promise<MemoriaCalculo> {
  const { data } = await api.put<MemoriaCalculo>(`/api/v1/memorias/memorias-calculo/${id}/`, payload);
  return data;
}

export async function deleteMemoria(id: number): Promise<void> {
  await api.delete(`/api/v1/memorias/memorias-calculo/${id}/`);
}

export async function enviarMemoriaGerencia(id: number): Promise<{ message: string; memoria: MemoriaCalculo }> {
  const { data } = await api.post<{ message: string; memoria: MemoriaCalculo }>(`/api/v1/memorias/memorias-calculo/${id}/enviar-gerencia/`);
  return data;
}

export async function aprobarMemoriaGerencia(id: number): Promise<{ message: string; memoria: MemoriaCalculo }> {
  const { data } = await api.post<{ message: string; memoria: MemoriaCalculo }>(`/api/v1/memorias/memorias-calculo/${id}/aprobar-gerencia/`);
  return data;
}

export async function aprobarMemoriaFinanzas(id: number): Promise<{ message: string; memoria: MemoriaCalculo }> {
  const { data } = await api.post<{ message: string; memoria: MemoriaCalculo }>(`/api/v1/memorias/memorias-calculo/${id}/aprobar-finanzas/`);
  return data;
}

export async function rechazarMemoria(id: number, motivo?: string): Promise<{ message: string; memoria: MemoriaCalculo }> {
  const { data } = await api.post<{ message: string; memoria: MemoriaCalculo }>(`/api/v1/memorias/memorias-calculo/${id}/rechazar/`, { motivo });
  return data;
}

export async function volverMemoriaBorrador(id: number): Promise<{ message: string; memoria: MemoriaCalculo }> {
  const { data } = await api.post<{ message: string; memoria: MemoriaCalculo }>(`/api/v1/memorias/memorias-calculo/${id}/volver-borrador/`);
  return data;
}

// ── Gastos / Ejecución ───────────────────────────────────────────────────
export async function getGastos(params?: {
  gestion?: number;
  anio?: number;
  area?: number;
  memoria?: number;
  partida?: number;
  search?: string;
}): Promise<Gasto[]> {
  const { data } = await api.get<any>('/api/v1/ejecucion/gastos/', { params });
  return unpackList<Gasto>(data);
}

export async function createGasto(payload: {
  detalle_memoria: number;
  monto_ejecutado: number | string;
  fecha_gasto: string;
  comprobante_num?: string;
  observacion?: string;
}): Promise<Gasto> {
  const { data } = await api.post<Gasto>('/api/v1/ejecucion/gastos/', payload);
  return data;
}

export interface ResumenEjecucion {
  gestion_id: number;
  gestion_anio: number;
  gestion_estado: string;
  total_inicial: string;
  total_ejecutado: string;
  total_disponible: string;
  porcentaje_global: number;
  por_area: Array<{
    area_id: number;
    area_codigo: string;
    area_nombre: string;
    monto_inicial: string;
    monto_ejecutado: string;
    monto_disponible: string;
    porcentaje_ejecucion: number;
  }>;
  por_partida: Array<{
    partida_codigo: string;
    partida_nombre: string;
    monto_ejecutado: string;
  }>;
}

export async function getResumenEjecucion(params?: { gestion?: number; anio?: number }): Promise<ResumenEjecucion> {
  const { data } = await api.get<ResumenEjecucion>('/api/v1/ejecucion/gastos/resumen-ejecucion/', { params });
  return data;
}

export async function deleteGasto(id: number): Promise<void> {
  await api.delete(`/api/v1/ejecucion/gastos/${id}/`);
}

// ── Organizacional ────────────────────────────────────────────────────────
export async function getAreas(): Promise<Area[]> {
  const { data } = await api.get<any>('/api/v1/organizacional/areas/');
  return unpackList<Area>(data);
}

export async function getSecciones(areaId?: number): Promise<Seccion[]> {
  const { data } = await api.get<any>('/api/v1/organizacional/secciones/', {
    params: areaId ? { area: areaId } : undefined,
  });
  return unpackList<Seccion>(data);
}

// ── Traspasos Presupuestarios ─────────────────────────────────────────────
export async function getTraspasos(params?: {
  memoria?: number;
  area?: number;
  gestion?: number;
  search?: string;
}): Promise<Traspaso[]> {
  const { data } = await api.get<any>('/api/v1/memorias/traspasos/', { params });
  return unpackList<Traspaso>(data);
}

export async function createTraspaso(payload: {
  memoria_origen: number;
  memoria_destino: number;
  monto: number | string;
  motivo: string;
}): Promise<Traspaso> {
  const { data } = await api.post<Traspaso>('/api/v1/memorias/traspasos/', payload);
  return data;
}

export async function getSaldoMemoria(memoriaId: number): Promise<SaldoMemoria> {
  const { data } = await api.get<SaldoMemoria>(`/api/v1/memorias/memorias-calculo/${memoriaId}/saldo-disponible/`);
  return data;
}
