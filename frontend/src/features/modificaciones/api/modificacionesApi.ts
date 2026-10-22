import api from '../../../services/api';
import {
  Area,
  MemoriaCalculo,
  ModificacionPresupuestaria,
  CrearModificacionPayload,
  Traspaso,
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
  }): Promise<MemoriaCalculo[]> => {
    const { data } = await api.get<any>('/api/v1/memorias/memorias-calculo/', { params });
    return unpackList<MemoriaCalculo>(data);
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
