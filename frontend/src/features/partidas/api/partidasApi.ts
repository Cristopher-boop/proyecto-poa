import api from '../../../services/api';
import type { Partida, PartidaFormData } from '../types/partidas.types';

const API_BASE_URL = '/api/v1/presupuestos/partidas';

type ListResponse<T> = T[] | { results?: T[] };

const getList = async <T>(url: string, params?: Record<string, any>): Promise<T[]> => {
  const response = await api.get<ListResponse<T>>(url, { params });
  const data = response.data;
  return Array.isArray(data) ? data : (data?.results ?? []);
};

export const partidasApi = {
  getPartidas: async (params?: { search?: string; clase?: string; estado?: boolean }): Promise<Partida[]> => {
    return getList<Partida>(`${API_BASE_URL}/`, params);
  },

  getPartida: async (id: number): Promise<Partida> => {
    const res = await api.get<Partida>(`${API_BASE_URL}/${id}/`);
    return res.data;
  },

  createPartida: async (data: PartidaFormData): Promise<Partida> => {
    const res = await api.post<Partida>(`${API_BASE_URL}/`, data);
    return res.data;
  },

  updatePartida: async (id: number, data: Partial<PartidaFormData>): Promise<Partida> => {
    const res = await api.patch<Partida>(`${API_BASE_URL}/${id}/`, data);
    return res.data;
  },

  toggleEstadoPartida: async (id: number, estado?: boolean): Promise<{ detail: string; estado: boolean; id: number }> => {
    const res = await api.post<{ detail: string; estado: boolean; id: number }>(
      `${API_BASE_URL}/${id}/toggle-estado/`,
      { estado }
    );
    return res.data;
  },

  deletePartida: async (id: number): Promise<{ detail: string }> => {
    const res = await api.delete(`${API_BASE_URL}/${id}/`);
    return res.data;
  },
};

export default partidasApi;
