export type TipoNotificacion =
  | 'REVISION_PENDIENTE'
  | 'APROBACION'
  | 'RECHAZO'
  | 'ALERTA_PRESUPUESTO'
  | 'SISTEMA';

export interface Notificacion {
  id: number;
  usuario_destino: number;
  usuario_origen?: number;
  origen_nombre?: string;
  origen_username?: string;
  titulo: string;
  mensaje: string;
  tipo: TipoNotificacion;
  enlace?: string;
  leido: boolean;
  fecha_lectura?: string;
  created_at: string;
}
