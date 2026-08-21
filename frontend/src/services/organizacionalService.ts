import api from './api';
import type { Area, Programa, Seccion } from '../types/organizacional';

const API_BASE_URL = '/api/v1/organizacional';

type ListResponse<T> = T[] | { results?: T[] };

const getList = async <T>(url: string): Promise<{ data: T[] }> => {
    const response = await api.get<ListResponse<T>>(url);
    const data = response.data;

    return {
        ...response,
        data: Array.isArray(data) ? data : (data?.results ?? []),
    };
};

export const organizacionalService = {
    // ============ PROGRAMAS ============
    getProgramas: () => getList<Programa>(`${API_BASE_URL}/programas/`),
    getPrograma: (id: number) => api.get(`${API_BASE_URL}/programas/${id}/`),
    createPrograma: (data: unknown) => api.post(`${API_BASE_URL}/programas/`, data),
    updatePrograma: (id: number, data: unknown) => api.patch(`${API_BASE_URL}/programas/${id}/`, data),
    toggleEstadoPrograma: (id: number, estado?: boolean) =>
        api.post(`${API_BASE_URL}/programas/${id}/toggle-estado/`, { estado }),
    deletePrograma: (id: number) => api.delete(`${API_BASE_URL}/programas/${id}/`),
    getProgramaAreas: (id: number) => getList<Area>(`${API_BASE_URL}/programas/${id}/areas/`),
    getProgramaSecciones: (id: number) => getList<Seccion>(`${API_BASE_URL}/programas/${id}/secciones/`),

    // ============ ÁREAS ============
    getAreas: (params?: { programa?: number; tipo?: string; estado?: boolean }) => {
        const query = new URLSearchParams();
        if (params?.programa !== undefined) query.set('programa', String(params.programa));
        if (params?.tipo) query.set('tipo', params.tipo);
        if (params?.estado !== undefined) query.set('estado', String(params.estado));
        const suffix = query.toString() ? `?${query.toString()}` : '';
        return getList<Area>(`${API_BASE_URL}/areas/${suffix}`);
    },
    getArea: (id: number) => api.get(`${API_BASE_URL}/areas/${id}/`),
    createArea: (data: unknown) => api.post(`${API_BASE_URL}/areas/`, data),
    updateArea: (id: number, data: unknown) => api.patch(`${API_BASE_URL}/areas/${id}/`, data),
    toggleEstadoArea: (id: number, estado?: boolean) =>
        api.post(`${API_BASE_URL}/areas/${id}/toggle-estado/`, { estado }),
    deleteArea: (id: number) => api.delete(`${API_BASE_URL}/areas/${id}/`),
    getAreaSecciones: (id: number) => getList<Seccion>(`${API_BASE_URL}/areas/${id}/secciones/`),
    getAreasPorPrograma: (programaId: number) =>
        getList<Area>(`${API_BASE_URL}/areas/por_programa/?programa_id=${programaId}`),

    // ============ SECCIONES ============
    getSecciones: (params?: { area?: number; estado?: boolean }) => {
        const query = new URLSearchParams();
        if (params?.area !== undefined) query.set('area', String(params.area));
        if (params?.estado !== undefined) query.set('estado', String(params.estado));
        const suffix = query.toString() ? `?${query.toString()}` : '';
        return getList<Seccion>(`${API_BASE_URL}/secciones/${suffix}`);
    },
    getSeccion: (id: number) => api.get(`${API_BASE_URL}/secciones/${id}/`),
    createSeccion: (data: unknown) => api.post(`${API_BASE_URL}/secciones/`, data),
    updateSeccion: (id: number, data: unknown) => api.patch(`${API_BASE_URL}/secciones/${id}/`, data),
    toggleEstadoSeccion: (id: number, estado?: boolean) =>
        api.post(`${API_BASE_URL}/secciones/${id}/toggle-estado/`, { estado }),
    deleteSeccion: (id: number) => api.delete(`${API_BASE_URL}/secciones/${id}/`),
    getSeccionesPorArea: (areaId: number) =>
        getList<Seccion>(`${API_BASE_URL}/secciones/por_area/?area_id=${areaId}`),
};
