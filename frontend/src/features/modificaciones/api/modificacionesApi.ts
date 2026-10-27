import api from '../../../services/api';
import {
  Area,
  MemoriaCalculo,
  ModificacionPresupuestaria,
  CrearModificacionPayload,
  Traspaso,
  Partida,
} from '../../../services/presupuestoService';

function unpackList<T>(data: any): T[] {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}

export const modificacionesApi = {
  getModificaciones: async (params?: {
    gestion?: number;
    area?: number;
    search?: string;
    estado?: string;
  }): Promise<ModificacionPresupuestaria[]> => {
    const { data } = await api.get<any>('/api/v1/memorias/modificaciones/', { params });
    return unpackList<ModificacionPresupuestaria>(data);
  },

  createModificacion: async (
    payload: CrearModificacionPayload
  ): Promise<ModificacionPresupuestaria> => {
    const { data } = await api.post<ModificacionPresupuestaria>(
      '/api/v1/memorias/modificaciones/',
      payload
    );
    return data;
  },

  aceptarGerencia: async (
    id: number,
    payload?: { nota?: string }
  ): Promise<ModificacionPresupuestaria> => {
    const { data } = await api.post<ModificacionPresupuestaria>(
      `/api/v1/memorias/modificaciones/${id}/aceptar-gerencia/`,
      payload || {}
    );
    return data;
  },

  rechazarGerencia: async (
    id: number,
    payload: { motivo: string }
  ): Promise<ModificacionPresupuestaria> => {
    const { data } = await api.post<ModificacionPresupuestaria>(
      `/api/v1/memorias/modificaciones/${id}/rechazar-gerencia/`,
      payload
    );
    return data;
  },

  aprobarModificacion: async (
    id: number,
    payload?: { observacion?: string }
  ): Promise<ModificacionPresupuestaria> => {
    const { data } = await api.post<ModificacionPresupuestaria>(
      `/api/v1/memorias/modificaciones/${id}/aprobar/`,
      payload || {}
    );
    return data;
  },

  aprobarLoteModificaciones: async (
    modificacionIds: number[]
  ): Promise<{
    aprobadas_count: number;
    total_monto: string;
    codigos: string[];
    mensaje: string;
  }> => {
    const { data } = await api.post<{
      aprobadas_count: number;
      total_monto: string;
      codigos: string[];
      mensaje: string;
    }>('/api/v1/memorias/modificaciones/aprobar-lote/', {
      modificacion_ids: modificacionIds,
    });
    return data;
  },

  rechazarModificacion: async (
    id: number,
    payload: { motivo: string }
  ): Promise<ModificacionPresupuestaria> => {
    const { data } = await api.post<ModificacionPresupuestaria>(
      `/api/v1/memorias/modificaciones/${id}/rechazar/`,
      payload
    );
    return data;
  },

  getMemorias: async (params?: {
    gestion?: number;
    area?: number;
    seccion?: number;
    estado?: string;
    para_modificacion?: boolean | string;
    para_traspaso?: boolean | string;
  }): Promise<MemoriaCalculo[]> => {
    const queryParams = { ...params, para_modificacion: true };
    const { data } = await api.get<any>('/api/v1/memorias/memorias-calculo/', { params: queryParams });
    return unpackList<MemoriaCalculo>(data);
  },

  getPartidas: async (): Promise<Partida[]> => {
    const { data } = await api.get<any>('/api/v1/presupuestos/partidas/');
    return unpackList<Partida>(data);
  },

  getOperaciones: async (params?: { area?: number; gestion?: number }): Promise<any[]> => {
    const { data } = await api.get<any>('/api/v1/planificacion/operaciones/', { params });
    return unpackList<any>(data);
  },

  getAreas: async (): Promise<Area[]> => {
    const { data } = await api.get<any>('/api/v1/organizacional/areas/');
    return unpackList<Area>(data);
  },

  getTraspasos: async (params?: {
    memoria?: number;
    area?: number;
    gestion?: number;
    search?: string;
  }): Promise<Traspaso[]> => {
    const { data } = await api.get<any>('/api/v1/memorias/traspasos/', { params });
    return unpackList<Traspaso>(data);
  },
};
