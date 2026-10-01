import { planificacionService } from '../../../services/planificacionService';
import { organizacionalService } from '../../../services/organizacionalService';
import { getGestiones } from '../../../services/presupuestoService';

export const planificacionApi = {
  // AMP (PEI)
  getAmps: planificacionService.getAccionesMedianoPlazo,
  createAmp: planificacionService.createAccionMedianoPlazo,
  updateAmp: planificacionService.updateAccionMedianoPlazo,
  toggleEstadoAmp: planificacionService.toggleEstadoAMP,
  deleteAmp: planificacionService.deleteAMP,

  // ACP (POA)
  getAcps: planificacionService.getAccionesCortoPlazo,
  createAcp: planificacionService.createAccionCortoPlazo,
  updateAcp: planificacionService.updateAccionCortoPlazo,
  toggleEstadoAcp: planificacionService.toggleEstadoACP,
  deleteAcp: planificacionService.deleteACP,

  // Operaciones
  getOperaciones: planificacionService.getOperaciones,
  createOperacion: planificacionService.createOperacion,
  updateOperacion: planificacionService.updateOperacion,
  toggleEstadoOperacion: planificacionService.toggleEstadoOperacion,
  deleteOperacion: planificacionService.deleteOperacion,

  // Tareas
  getTareas: planificacionService.getTareas,
  createTarea: planificacionService.createTarea,
  updateTarea: planificacionService.updateTarea,
  toggleEstadoTarea: planificacionService.toggleEstadoTarea,
  deleteTarea: planificacionService.deleteTarea,

  // Organizacional & Gestiones
  getProgramas: () => organizacionalService.getProgramas().then((res) => res.data || []),
  getAreas: () => organizacionalService.getAreas().then((res) => res.data || []),
  getGestiones: () => getGestiones().catch(() => []),
};
