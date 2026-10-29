import api from '../../../services/api';
import {
  getPresupuestosArea,
  getResumenGestion,
  getDetalleArea,
  getMemorias,
  getDetallesPresupuesto,
  getModificaciones,
  getTraspasos,
  getGastos,
  getAreas,
  getPartidas,
  Area,
  Partida,
  PresupuestoArea,
  MemoriaCalculo,
  DetallePresupuestoMemoria,
  ModificacionPresupuestaria,
  Traspaso,
  Gasto,
  DetalleArea,
} from '../../../services/presupuestoService';
import { certificacionService } from '../../../services/certificacionService';
import { CertificacionPOA } from '../../../types/certificacion';

export const reportesApi = {
  getAreas: async (): Promise<Area[]> => {
    return getAreas();
  },

  getPartidas: async (): Promise<Partida[]> => {
    return getPartidas();
  },

  getPresupuestosArea: async (gestionId: number): Promise<PresupuestoArea[]> => {
    return getPresupuestosArea({ gestion: gestionId });
  },

  getResumenGestion: async (gestionId: number) => {
    return getResumenGestion({ gestion: gestionId });
  },

  getDetalleArea: async (gestionId: number, areaId: number): Promise<DetalleArea | null> => {
    try {
      return await getDetalleArea({ gestion: gestionId, area: areaId });
    } catch {
      return null;
    }
  },

  getMemorias: async (params?: { gestion?: number; area?: number; estado?: string }): Promise<MemoriaCalculo[]> => {
    return getMemorias(params);
  },

  getDetallesPresupuesto: async (params?: { gestion?: number; area?: number }): Promise<DetallePresupuestoMemoria[]> => {
    return getDetallesPresupuesto(params);
  },

  getModificaciones: async (params?: { gestion?: number; area?: number }): Promise<ModificacionPresupuestaria[]> => {
    return getModificaciones(params);
  },

  getTraspasos: async (params?: { gestion?: number; area?: number }): Promise<Traspaso[]> => {
    return getTraspasos(params);
  },

  getGastos: async (params?: { gestion?: number; area?: number }): Promise<Gasto[]> => {
    return getGastos(params);
  },

  getCertificaciones: async (params?: { gestion?: number; area?: number }): Promise<CertificacionPOA[]> => {
    return certificacionService.getCertificaciones(params);
  },
};
