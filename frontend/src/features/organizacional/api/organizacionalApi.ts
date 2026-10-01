import { organizacionalService } from '../../../services/organizacionalService';
import type { Area, Programa, Seccion } from '../../../types/organizacional';

export const organizationalApi = {
  // Programas
  getProgramas: async (): Promise<Programa[]> => {
    const res = await organizacionalService.getProgramas();
    return res.data || [];
  },
  createPrograma: async (data: { codigo: string; nombre: string; descripcion?: string }) => {
    return organizacionalService.createPrograma(data);
  },
  updatePrograma: async (id: number, data: { codigo: string; nombre: string; descripcion?: string }) => {
    return organizacionalService.updatePrograma(id, data);
  },
  toggleEstadoPrograma: async (id: number, estado: boolean) => {
    return organizacionalService.toggleEstadoPrograma(id, estado);
  },

  // Áreas
  getAreas: async (): Promise<Area[]> => {
    const res = await organizacionalService.getAreas();
    return res.data || [];
  },
  createArea: async (data: { programa: number; codigo: string; nombre: string; tipo: 'GERENCIA' | 'UNIDAD'; descripcion?: string }) => {
    return organizacionalService.createArea(data);
  },
  updateArea: async (id: number, data: { programa: number; codigo: string; nombre: string; tipo: 'GERENCIA' | 'UNIDAD'; descripcion?: string }) => {
    return organizacionalService.updateArea(id, data);
  },
  toggleEstadoArea: async (id: number, estado: boolean) => {
    return organizacionalService.toggleEstadoArea(id, estado);
  },

  // Secciones
  getSecciones: async (): Promise<Seccion[]> => {
    const res = await organizacionalService.getSecciones();
    return res.data || [];
  },
  createSeccion: async (data: { area: number; nombre: string; descripcion?: string }) => {
    return organizacionalService.createSeccion(data);
  },
  updateSeccion: async (id: number, data: { area: number; nombre: string; descripcion?: string }) => {
    return organizacionalService.updateSeccion(id, data);
  },
  toggleEstadoSeccion: async (id: number, estado: boolean) => {
    return organizacionalService.toggleEstadoSeccion(id, estado);
  },
};
