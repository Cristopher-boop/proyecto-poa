import api from './api';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface RegisterCredentials {
  username: string;
  password?: string;
  email: string;
  first_name: string;
  last_name: string;
  rol_id?: number | null;
  seccion_id?: number | null;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  cargo: string | null;
  estado: boolean;
  rol_nombre: string | null;
  area_id?: number | null;
  area_nombre?: string | null;
  seccion_nombre?: string | null;
  seccion?: number | null;
  is_superuser?: boolean;
  last_login?: string | null;
  date_joined?: string;
}

export async function loginUser(credentials: LoginCredentials): Promise<AuthTokens> {
  const { data } = await api.post<AuthTokens>('/api/v1/auth/token/', credentials);
  return data;
}

export async function registerUser(data: RegisterCredentials): Promise<UserProfile> {
  const res = await api.post<UserProfile>('/api/v1/usuarios/register/', data);
  return res.data;
}

export async function refreshAccessToken(refresh: string): Promise<AuthTokens> {
  const { data } = await api.post<AuthTokens>('/api/v1/auth/token/refresh/', { refresh });
  return data;
}

export async function getCurrentUser(): Promise<UserProfile> {
  const { data } = await api.get<UserProfile>('/api/v1/usuarios/me/');
  return data;
}

export interface Rol {
  id: number;
  nombre: string;
  descripcion: string;
}

export async function getRoles(): Promise<Rol[]> {
  const { data } = await api.get<any>('/api/v1/usuarios/roles/');
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}

export interface LogEntry {
  id: number;
  action_time: string;
  usuario_nombre: string;
  usuario_username: string;
  object_repr: string;
  action_flag: number;
  change_message: string;
}

export async function getLogs(params?: Record<string, any>): Promise<LogEntry[]> {
  const { data } = await api.get<any>('/api/v1/usuarios/logs/', { params });
  return Array.isArray(data) ? data : (data?.results || []);
}

export async function getLoginLogs(): Promise<LogEntry[]> {
  const { data } = await api.get<any>('/api/v1/usuarios/logs/', { params: { only_logins: 'true' } });
  return Array.isArray(data) ? data : (data?.results || []);
}

export async function getUltimosIngresos(): Promise<UserProfile[]> {
  const { data } = await api.get<any>('/api/v1/usuarios/ultimos-ingresos/');
  return Array.isArray(data) ? data : (data?.results || []);
}

export function saveTokens(tokens: AuthTokens) {
  localStorage.setItem('access_token', tokens.access);
  localStorage.setItem('refresh_token', tokens.refresh);
}

export function clearTokens() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

export function getStoredTokens(): Partial<AuthTokens> {
  return {
    access: localStorage.getItem('access_token') ?? undefined,
    refresh: localStorage.getItem('refresh_token') ?? undefined,
  };
}
