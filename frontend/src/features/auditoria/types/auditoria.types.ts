export type ActionFlagType = 1 | 2 | 3;
export type ActionFlagDisplay = 'CREACIÓN' | 'MODIFICACIÓN' | 'ELIMINACIÓN' | 'LOGIN';

export type ModuloAuditoria =
  | 'MEMORIAS'
  | 'EJECUCIÓN'
  | 'MODIFICACIONES'
  | 'CERTIFICACIONES'
  | 'PRESUPUESTOS'
  | 'GESTIONES'
  | 'PLANIFICACIÓN'
  | 'AUTENTICACIÓN'
  | 'ORGANIZACIONAL'
  | 'USUARIOS'
  | 'SISTEMA';

export interface AuditLogEntry {
  id: number;
  action_time: string;
  usuario_id: number | null;
  usuario_nombre: string;
  usuario_username: string;
  usuario_cargo: string;
  usuario_rol: string;
  usuario_area: string;
  object_repr: string;
  action_flag: ActionFlagType;
  action_flag_display: ActionFlagDisplay;
  change_message: string;
  modulo: ModuloAuditoria;
}

export interface TendenciaDia {
  fecha: string;
  label: string;
  count: number;
}

export interface AuditResumen {
  total_logs: number;
  logins_hoy: number;
  acciones_hoy: number;
  modificaciones_criticas: number;
  total_usuarios: number;
  usuarios_activos_total: number;
  distribucion_modulos: Record<string, number>;
  distribucion_acciones: Record<string, number>;
  tendencia_7_dias: TendenciaDia[];
  actividad_reciente: AuditLogEntry[];
}

export interface UltimaActividadWorker {
  action_time: string;
  descripcion: string;
  action_flag: number;
}

export interface WorkerWorkflowSummary {
  id: number;
  username: string;
  nombre_completo: string;
  email: string;
  cargo: string;
  rol: string;
  area: string;
  seccion: string;
  estado: boolean;
  last_login: string | null;
  date_joined: string;
  total_acciones: number;
  memorias_elaboradas: number;
  memorias_revisadas: number;
  memorias_aprobadas: number;
  gastos_registrados: number;
  monto_total_ejecutado: number;
  traspasos_registrados: number;
  certificaciones_creadas: number;
  ultima_actividad: UltimaActividadWorker | null;
}

export interface WorkerMemoriaItem {
  id: number;
  codigo: string;
  rol_participacion: string;
  rol_participacion_display: string;
  estado: string;
  estado_display: string;
  gestion: number;
  area: string;
  total_presupuestado: number;
  saldo_disponible: number;
  fecha_creacion: string;
}

export interface WorkerGastoItem {
  id: number;
  monto_ejecutado: number;
  fecha_gasto: string;
  comprobante_num: string;
  memoria_codigo: string;
  observacion: string;
}

export interface WorkerTraspasoItem {
  id: number;
  monto: number;
  memoria_origen: string;
  memoria_destino: string;
  motivo: string;
  created_at: string;
}

export interface WorkerCertificacionItem {
  id: number;
  codigo: string;
  area: string;
  monto_solicitado: number;
  estado: string;
  fecha: string;
}

export interface WorkerDetailActivity {
  usuario: {
    id: number;
    username: string;
    nombre_completo: string;
    email: string;
    cargo: string;
    rol: string;
    area: string;
    seccion: string;
    estado: boolean;
    last_login: string | null;
    date_joined: string;
  };
  memorias: WorkerMemoriaItem[];
  gastos: WorkerGastoItem[];
  traspasos: WorkerTraspasoItem[];
  certificaciones: WorkerCertificacionItem[];
  logs: AuditLogEntry[];
}

export interface AuditFilterParams {
  search?: string;
  modulo?: string;
  action_flag?: number | string;
  user_id?: number | string;
  only_logins?: boolean;
  exclude_logins?: boolean;
  start_date?: string;
  end_date?: string;
  limit?: number;
}
