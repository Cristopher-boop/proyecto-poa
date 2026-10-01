import api from '../../../services/api';
import {
  AuditLogEntry,
  AuditResumen,
  WorkerWorkflowSummary,
  WorkerDetailActivity,
  AuditFilterParams,
} from '../types/auditoria.types';
import { UserProfile } from '../../../services/authService';

/**
 * Obtiene el resumen macro y analítica de auditoría.
 */
export async function getAuditoriaResumen(): Promise<AuditResumen> {
  const { data } = await api.get<AuditResumen>('/api/v1/usuarios/auditoria/resumen/');
  return data;
}

/**
 * Obtiene la lista de registros de auditoría filtrados.
 */
export async function getAuditoriaLogs(params?: AuditFilterParams): Promise<AuditLogEntry[]> {
  const queryParams: Record<string, any> = {};

  if (params?.search) queryParams.search = params.search;
  if (params?.modulo && params.modulo !== 'TODOS') queryParams.modulo = params.modulo;
  if (params?.action_flag) queryParams.action_flag = params.action_flag;
  if (params?.user_id) queryParams.user_id = params.user_id;
  if (params?.only_logins) queryParams.only_logins = 'true';
  if (params?.exclude_logins) queryParams.exclude_logins = 'true';
  if (params?.start_date) queryParams.start_date = params.start_date;
  if (params?.end_date) queryParams.end_date = params.end_date;
  if (params?.limit) queryParams.limit = params.limit;

  const { data } = await api.get<any>('/api/v1/usuarios/logs/', { params: queryParams });
  // Soportar tanto formato directo como paginado de DRF { results: [...] }
  return Array.isArray(data) ? data : (data.results || []);
}

/**
 * Obtiene el flujo de trabajo y métricas operativas por cada trabajador.
 */
export async function getFlujoTrabajadores(): Promise<WorkerWorkflowSummary[]> {
  const { data } = await api.get<WorkerWorkflowSummary[]>('/api/v1/usuarios/auditoria/flujo-trabajadores/');
  return data;
}

/**
 * Obtiene el detalle y expediente de actividad de un trabajador específico.
 */
export async function getTrabajadorDetalle(userId: number): Promise<WorkerDetailActivity> {
  const { data } = await api.get<WorkerDetailActivity>(`/api/v1/usuarios/auditoria/trabajadores/${userId}/`);
  return data;
}

/**
 * Obtiene los últimos ingresos de usuarios.
 */
export async function getUltimosIngresos(): Promise<UserProfile[]> {
  const { data } = await api.get<UserProfile[]>('/api/v1/usuarios/ultimos-ingresos/');
  return data;
}

/**
 * Exporta un conjunto de registros de auditoría a archivo CSV con codificación UTF-8.
 */
export function exportLogsToCSV(logs: AuditLogEntry[], filename = 'auditoria_poa.csv'): void {
  if (!logs || logs.length === 0) return;

  const headers = [
    'ID',
    'Fecha y Hora',
    'Servidor Público',
    'Usuario',
    'Cargo',
    'Rol',
    'Área Institucional',
    'Módulo',
    'Tipo de Acción',
    'Objeto Afectado',
    'Detalle / Mensaje de Cambio',
  ];

  const escapeCSV = (value: any) => {
    if (value === null || value === undefined) return '""';
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = logs.map((log) => [
    escapeCSV(log.id),
    escapeCSV(new Date(log.action_time).toLocaleString('es-BO')),
    escapeCSV(log.usuario_nombre),
    escapeCSV(log.usuario_username),
    escapeCSV(log.usuario_cargo || 'Sin cargo'),
    escapeCSV(log.usuario_rol),
    escapeCSV(log.usuario_area),
    escapeCSV(log.modulo),
    escapeCSV(log.action_flag_display),
    escapeCSV(log.object_repr),
    escapeCSV(log.change_message),
  ]);

  const csvContent = [headers.map(escapeCSV).join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  // Agregar BOM para UTF-8 para visualización perfecta en Microsoft Excel
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
