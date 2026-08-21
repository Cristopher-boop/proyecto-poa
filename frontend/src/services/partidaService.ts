import api from './api';
import type { Partida, PartidaFormData } from '../types/partida';

const API_BASE_URL = '/api/v1/presupuestos/partidas';

type ListResponse<T> = T[] | { results?: T[] };

const getList = async <T>(url: string, params?: Record<string, any>): Promise<{ data: T[] }> => {
  const response = await api.get<ListResponse<T>>(url, { params });
  const data = response.data;

  return {
    ...response,
    data: Array.isArray(data) ? data : (data?.results ?? []),
  };
};

export const partidaService = {
  getPartidas: (params?: { search?: string; clase?: string; estado?: boolean }) => {
    return getList<Partida>(`${API_BASE_URL}/`, params);
  },

  getPartida: (id: number) => {
    return api.get<Partida>(`${API_BASE_URL}/${id}/`);
  },

  createPartida: (data: PartidaFormData) => {
    return api.post<Partida>(`${API_BASE_URL}/`, data);
  },

  updatePartida: (id: number, data: Partial<PartidaFormData>) => {
    return api.patch<Partida>(`${API_BASE_URL}/${id}/`, data);
  },

  toggleEstadoPartida: (id: number, estado?: boolean) => {
    return api.post<{ detail: string; estado: boolean; id: number }>(`${API_BASE_URL}/${id}/toggle-estado/`, { estado });
  },

  deletePartida: (id: number) => {
    return api.delete(`${API_BASE_URL}/${id}/`);
  },
};

export default partidaService;
