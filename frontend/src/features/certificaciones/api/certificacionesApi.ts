import { certificacionService } from '../../../services/certificacionService';
import type { CertificacionPOA, CertificacionFormData } from '../../../types/certificacion';

export const certificacionesApi = {
  getAll: (params?: Record<string, any>) => certificacionService.getCertificaciones(params),
  getById: (id: number) => certificacionService.getCertificacionById(id),
  create: (data: CertificacionFormData) => certificacionService.createCertificacion(data),
  update: (id: number, data: Partial<CertificacionFormData>) => certificacionService.updateCertificacion(id, data),
  delete: (id: number) => certificacionService.deleteCertificacion(id),
  getSiguienteCorrelativo: (gestionId: number, areaId?: number) => certificacionService.getSiguienteCorrelativo(gestionId, areaId),
  enviarRevision: (id: number, data?: { es_contratacion?: boolean }) => certificacionService.enviarRevision(id, data),
  certificarPlanificacion: (
    id: number,
    data?: {
      codigo_certificacion?: string;
      numero_oficio_solicitud?: string;
      observacion?: string;
      categoria_programatica_codigo?: string;
      categoria_programatica?: string;
      notas?: string;
      memoria_id?: number;
      partida_id?: number;
      operacion_id?: number;
    }
  ) => certificacionService.certificarPlanificacion(id, data),
  aprobarPresupuestos: (
    id: number,
    data?: { observacion?: string; memoria_id?: number; partida_id?: number } | string
  ) => certificacionService.aprobarPresupuestos(id, data),
  observar: (id: number, observacion: string) => certificacionService.observarCertificacion(id, observacion),
  rechazar: (id: number, motivo: string) => certificacionService.rechazarCertificacion(id, motivo),
  cancelar: (id: number, motivo?: string) => certificacionService.cancelarCertificacion(id, motivo),
};
