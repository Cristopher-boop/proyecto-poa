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

  getSiguienteCorrelativo: async (gestionId: number, areaId?: number): Promise<{
    gestion_id: number;
    gestion_anio: number;
    area_id?: number | null;
    correlativo_area: number;
    numero_oficio_solicitud: string;
    correlativo_global: number;
    codigo_certificacion: string;
  }> => {
    const params: Record<string, any> = { gestion: gestionId };
    if (areaId) params.area = areaId;
    const response = await api.get('/api/v1/ejecucion/certificaciones/siguiente-correlativo/', { params });
    return response.data;
  },

  enviarRevision: async (id: number, data?: { es_contratacion?: boolean }): Promise<{ status: string; estado: string; es_contratacion?: boolean }> => {
    const response = await api.post(`/api/v1/ejecucion/certificaciones/${id}/enviar-revision/`, data || {});
    return response.data;
  },

  certificarPlanificacion: async (
    id: number,
    data?: {
      codigo_certificacion?: string;
      numero_oficio_solicitud?: string;
      observacion?: string;
      categoria_programatica_codigo?: string;
      categoria_programatica?: string;
      notas?: string;
    }
  ): Promise<{ status: string; estado: string; codigo_certificacion?: string; numero_oficio_solicitud?: string }> => {
    const response = await api.post(`/api/v1/ejecucion/certificaciones/${id}/certificar-planificacion/`, data || {});
    return response.data;
  },

  aprobarPresupuestos: async (id: number, observacion?: string): Promise<{ status: string; estado: string }> => {
    const response = await api.post(`/api/v1/ejecucion/certificaciones/${id}/aprobar-presupuestos/`, { observacion });
    return response.data;
  },

  observarCertificacion: async (id: number, observacion: string): Promise<{ status: string; estado: string }> => {
    const response = await api.post(`/api/v1/ejecucion/certificaciones/${id}/observar/`, { observacion });
    return response.data;
  },

  rechazarCertificacion: async (id: number, motivo: string): Promise<{ status: string; estado: string }> => {
    const response = await api.post(`/api/v1/ejecucion/certificaciones/${id}/rechazar/`, { motivo });
    return response.data;
  },

  cancelarCertificacion: async (id: number, motivo?: string): Promise<{ status: string; estado: string }> => {
    const response = await api.post(`/api/v1/ejecucion/certificaciones/${id}/cancelar/`, { motivo });
    return response.data;
  },
};
