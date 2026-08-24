import api from './api';
import { Notificacion } from '../types/notificacion';

export const notificacionService = {
  getNotificaciones: async () => {
    const response = await api.get('/api/v1/notificaciones/');
    const data = response.data;
    return (Array.isArray(data) ? data : data?.results || []) as Notificacion[];
  },
  getUnreadCount: async () => {
    const response = await api.get<{ unread_count: number }>('/api/v1/notificaciones/no-leidas-count/');
    return response.data.unread_count;
  },
  marcarLeida: async (id: number) => {
    const response = await api.post(`/api/v1/notificaciones/${id}/marcar-leida/`);
    return response.data;
  },
  marcarTodasLeidas: async () => {
    const response = await api.post('/api/v1/notificaciones/marcar-todas-leidas/');
    return response.data;
  },
};
