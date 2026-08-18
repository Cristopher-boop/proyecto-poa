import axios from 'axios';

const API_BASE_URL = '/api/v1/organizacional';
const USUARIOS_API_BASE_URL = '/api/v1/usuarios';

const api = axios.create({
    // En desarrollo Vite usa el proxy definido en vite.config.ts.
    // En producción puede definirse VITE_API_BASE_URL.
    baseURL: import.meta.env.VITE_API_BASE_URL || '',
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('Error en la petición:', error);
        return Promise.reject(error);
    }
);

/**
 * Django REST Framework tiene paginación global habilitada.
 * Una petición de listado puede devolver { results: [...] } o directamente [...].
 * Normalizamos ambos formatos para que los componentes siempre reciban un array.
 */
const getList = (url: string) =>
    api.get(url).then((response) => {
        const data = response.data;
        response.data = Array.isArray(data) ? data : (data?.results ?? []);
        return response;
    });

export const organizacionalService = {
    // ============ PROGRAMAS ============
    getProgramas: () => getList(`${API_BASE_URL}/programas/`),
    getPrograma: (id: number) => api.get(`${API_BASE_URL}/programas/${id}/`),
    createPrograma: (data: unknown) => api.post(`${API_BASE_URL}/programas/`, data),
    updatePrograma: (id: number, data: unknown) => api.put(`${API_BASE_URL}/programas/${id}/`, data),
    deletePrograma: (id: number) => api.delete(`${API_BASE_URL}/programas/${id}/`),
    getProgramaAreas: (id: number) => getList(`${API_BASE_URL}/programas/${id}/areas/`),
    getProgramaSecciones: (id: number) => getList(`${API_BASE_URL}/programas/${id}/secciones/`),

    // ============ ÁREAS ============
    getAreas: () => getList(`${API_BASE_URL}/areas/`),
    getArea: (id: number) => api.get(`${API_BASE_URL}/areas/${id}/`),
    createArea: (data: unknown) => api.post(`${API_BASE_URL}/areas/`, data),
    updateArea: (id: number, data: unknown) => api.put(`${API_BASE_URL}/areas/${id}/`, data),
    deleteArea: (id: number) => api.delete(`${API_BASE_URL}/areas/${id}/`),
    getAreaSecciones: (id: number) => getList(`${API_BASE_URL}/areas/${id}/secciones/`),
    getAreasPorPrograma: (programaId: number) =>
        getList(`${API_BASE_URL}/areas/por_programa/?programa_id=${programaId}`),

    // ============ SECCIONES ============
    getSecciones: () => getList(`${API_BASE_URL}/secciones/`),
    getSeccion: (id: number) => api.get(`${API_BASE_URL}/secciones/${id}/`),
    createSeccion: (data: unknown) => api.post(`${API_BASE_URL}/secciones/`, data),
    updateSeccion: (id: number, data: unknown) => api.put(`${API_BASE_URL}/secciones/${id}/`, data),
    deleteSeccion: (id: number) => api.delete(`${API_BASE_URL}/secciones/${id}/`),
    getSeccionesPorArea: (areaId: number) =>
        getList(`${API_BASE_URL}/secciones/por_area/?area_id=${areaId}`),

    // ============ ROLES ============
    getRoles: () => getList(`${API_BASE_URL}/roles/`),
    getRol: (id: number) => api.get(`${API_BASE_URL}/roles/${id}/`),
    createRol: (data: unknown) => api.post(`${API_BASE_URL}/roles/`, data),
    updateRol: (id: number, data: unknown) => api.put(`${API_BASE_URL}/roles/${id}/`, data),
    deleteRol: (id: number) => api.delete(`${API_BASE_URL}/roles/${id}/`),

    // ============ USUARIOS ============
    getUsuarios: () => getList(`${USUARIOS_API_BASE_URL}/usuarios/`),
    getUsuario: (id: number) => api.get(`${USUARIOS_API_BASE_URL}/usuarios/${id}/`),
    deleteUsuario: (id: number) => api.delete(`${USUARIOS_API_BASE_URL}/usuarios/${id}/`),
};
