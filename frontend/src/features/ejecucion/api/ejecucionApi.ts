import api from '../../../services/api';
import { Gasto, PresupuestoArea, MemoriaCalculo, ResumenEjecucion, Area } from '../../../services/presupuestoService';

export const ejecucionApi = {
  getGastos: async (params?: {
    gestion?: number;
    anio?: number;
    area?: number;
    memoria?: number;
    partida?: number;
    search?: string;
  }): Promise<Gasto[]> => {
    const response = await api.get('/api/v1/ejecucion/gastos/', { params });
    const data = response.data;
    return Array.isArray(data) ? data : data?.results || [];
  },

  createGasto: async (payload: {
    memoria: number;
    monto_ejecutado: number;
    fecha_gasto: string;
    comprobante_num?: string;
    observacion?: string;
  }): Promise<Gasto> => {
    const response = await api.post('/api/v1/ejecucion/gastos/', payload);
    return response.data;
  },

  updateGasto: async (
    id: number,
    payload: {
      monto_ejecutado?: number;
      fecha_gasto?: string;
      comprobante_num?: string;
      observacion?: string;
    }
  ): Promise<Gasto> => {
    const response = await api.patch(`/api/v1/ejecucion/gastos/${id}/`, payload);
    return response.data;
  },

  deleteGasto: async (id: number): Promise<void> => {
    await api.delete(`/api/v1/ejecucion/gastos/${id}/`);
  },

  getResumenEjecucion: async (params?: { gestion?: number; anio?: number }): Promise<ResumenEjecucion> => {
    const response = await api.get('/api/v1/ejecucion/gastos/resumen-ejecucion/', { params });
    return response.data;
  },

  getPresupuestosArea: async (params?: { gestion?: number }): Promise<PresupuestoArea[]> => {
    const response = await api.get('/api/v1/presupuestos/techos-area/', { params });
    const data = response.data;
    return Array.isArray(data) ? data : data?.results || [];
  },

  getMemorias: async (params?: { gestion?: number; area?: number; estado?: string }): Promise<MemoriaCalculo[]> => {
    const response = await api.get('/api/v1/memorias/memorias-calculo/', { params });
    const data = response.data;
    return Array.isArray(data) ? data : data?.results || [];
  },

  getAreas: async (): Promise<Area[]> => {
    const response = await api.get('/api/v1/organizacional/areas/');
    const data = response.data;
    return Array.isArray(data) ? data : data?.results || [];
  },
};
