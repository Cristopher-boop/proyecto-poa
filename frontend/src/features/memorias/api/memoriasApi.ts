import api from '../../../services/api';

export interface MemoriaCalculo {
  id: number;
  codigo: string;
  gestion: number;
  gestion_anio: number;
  seccion: number;
  seccion_nombre: string;
  area_nombre?: string;
  operacion: number | null;
  operacion_codigo?: string;
  justificacion: string;
  motivo_rechazo: string;
  es_contratacion: boolean;
  estado: string;
  fecha_aprobacion: string | null;
  total_presupuestado: string;
  total_ejecutado: string;
  monto_entrante: string;
  monto_saliente: string;
  saldo_disponible: string;
  detalles: any[];
  participantes: any[];
  partida_codigo?: string;
  partida_nombre?: string;
  total_items?: number;
}

export const memoriasApi = {
  getMemorias: async (params?: any): Promise<MemoriaCalculo[]> => {
    const response = await api.get('/api/v1/memorias/memorias-calculo/', { params });
    return response.data;
  },

  getMemoria: async (id: number): Promise<MemoriaCalculo> => {
    const response = await api.get(`/api/v1/memorias/memorias-calculo/${id}/`);
    return response.data;
  },

  createMemoria: async (data: any): Promise<MemoriaCalculo> => {
    const response = await api.post('/api/v1/memorias/memorias-calculo/', data);
    return response.data;
  },

  updateMemoria: async (id: number, data: any): Promise<MemoriaCalculo> => {
    const response = await api.patch(`/api/v1/memorias/memorias-calculo/${id}/`, data);
    return response.data;
  },

  deleteMemoria: async (id: number): Promise<void> => {
    await api.delete(`/api/v1/memorias/memorias-calculo/${id}/`);
  },

  enviarGerencia: async (id: number, motivo?: string) => {
    const response = await api.post(`/api/v1/memorias/memorias-calculo/${id}/enviar-gerencia/`, { motivo });
    return response.data;
  },

  enviarTodasGerencia: async (params?: { gestion?: number; seccion?: number }) => {
    const response = await api.post('/api/v1/memorias/memorias-calculo/enviar-todas-gerencia/', params);
    return response.data;
  },

  aprobarGerencia: async (id: number, nota?: string) => {
    const response = await api.post(`/api/v1/memorias/memorias-calculo/${id}/aprobar-gerencia/`, { nota });
    return response.data;
  },

  aprobarPlanificacion: async (id: number, nota?: string) => {
    const response = await api.post(`/api/v1/memorias/memorias-calculo/${id}/aprobar-planificacion/`, { nota });
    return response.data;
  },

  aprobarFinanzas: async (id: number, nota?: string) => {
    const response = await api.post(`/api/v1/memorias/memorias-calculo/${id}/aprobar-finanzas/`, { nota });
    return response.data;
  },

  rechazarMemoria: async (id: number, motivo: string) => {
    const response = await api.post(`/api/v1/memorias/memorias-calculo/${id}/rechazar/`, { motivo });
    return response.data;
  },

  volverBorrador: async (id: number, motivo: string) => {
    const response = await api.post(`/api/v1/memorias/memorias-calculo/${id}/volver-borrador/`, { motivo });
    return response.data;
  }
};
