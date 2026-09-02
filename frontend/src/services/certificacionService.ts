import api from './api';
import { CertificacionPOA, CertificacionFormData } from '../types/certificacion';

export const certificacionService = {
  getCertificaciones: async (params?: Record<string, any>): Promise<CertificacionPOA[]> => {
    const response = await api.get('/api/v1/ejecucion/certificaciones/', { params });
    const data = response.data;
    return (Array.isArray(data) ? data : data?.results || []) as CertificacionPOA[];
  },

  getCertificacionById: async (id: number): Promise<CertificacionPOA> => {
    const response = await api.get<CertificacionPOA>(`/api/v1/ejecucion/certificaciones/${id}/`);
    return response.data;
  },

  createCertificacion: async (data: CertificacionFormData): Promise<CertificacionPOA> => {
    const response = await api.post<CertificacionPOA>('/api/v1/ejecucion/certificaciones/', data);
    return response.data;
  },

  updateCertificacion: async (id: number, data: Partial<CertificacionFormData>): Promise<CertificacionPOA> => {
    const response = await api.patch<CertificacionPOA>(`/api/v1/ejecucion/certificaciones/${id}/`, data);
    return response.data;
  },

  deleteCertificacion: async (id: number): Promise<void> => {
    await api.delete(`/api/v1/ejecucion/certificaciones/${id}/`);
  },

  aprobarCertificacion: async (id: number): Promise<{ status: string; estado: string }> => {
    const response = await api.post(`/api/v1/ejecucion/certificaciones/${id}/aprobar/`);
    return response.data;
  },
};
