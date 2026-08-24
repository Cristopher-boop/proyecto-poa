import api from './api';
import { AccionMedianoPlazo, AccionCortoPlazo, Operacion, Tarea } from '../types/planificacion';

export const planificacionService = {
  // AMP (PEI)
  getAccionesMedianoPlazo: async (params?: Record<string, any>) => {
    const response = await api.get('/api/v1/planificacion/acciones-mediano-plazo/', { params });
    const data = response.data;
    return (Array.isArray(data) ? data : data?.results || []) as AccionMedianoPlazo[];
  },
  createAccionMedianoPlazo: async (data: Partial<AccionMedianoPlazo>) => {
    const response = await api.post<AccionMedianoPlazo>('/api/v1/planificacion/acciones-mediano-plazo/', data);
    return response.data;
  },

  // ACP (POA)
  getAccionesCortoPlazo: async (params?: Record<string, any>) => {
    const response = await api.get('/api/v1/planificacion/acciones-corto-plazo/', { params });
    const data = response.data;
    return (Array.isArray(data) ? data : data?.results || []) as AccionCortoPlazo[];
  },
  createAccionCortoPlazo: async (data: Partial<AccionCortoPlazo>) => {
    const response = await api.post<AccionCortoPlazo>('/api/v1/planificacion/acciones-corto-plazo/', data);
    return response.data;
  },

  // Operaciones
  getOperaciones: async (params?: Record<string, any>) => {
    const response = await api.get('/api/v1/planificacion/operaciones/', { params });
    const data = response.data;
    return (Array.isArray(data) ? data : data?.results || []) as Operacion[];
  },
  createOperacion: async (data: Partial<Operacion>) => {
    const response = await api.post<Operacion>('/api/v1/planificacion/operaciones/', data);
    return response.data;
  },

  // Tareas
  getTareas: async (params?: Record<string, any>) => {
    const response = await api.get('/api/v1/planificacion/tareas/', { params });
    const data = response.data;
    return (Array.isArray(data) ? data : data?.results || []) as Tarea[];
  },
  createTarea: async (data: Partial<Tarea>) => {
    const response = await api.post<Tarea>('/api/v1/planificacion/tareas/', data);
    return response.data;
  },
};
