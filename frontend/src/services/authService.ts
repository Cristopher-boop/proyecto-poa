import api from './api';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  cargo: string | null;
  estado: boolean;
  is_superuser: boolean;
  rol_nombre: string | null;
  rol: number | null;
  seccion: number | null;
  seccion_nombre: string | null;
  area_id: number | null;
  area_nombre: string | null;
}

export async function loginUser(credentials: LoginCredentials): Promise<AuthTokens> {
  const { data } = await api.post<AuthTokens>('/api/v1/auth/token/', credentials);
  return data;
}

export async function registerUser(userData: any): Promise<any> {
  const { data } = await api.post<any>('/api/v1/usuarios/register/', userData);
  return data;
}

export async function refreshAccessToken(refresh: string): Promise<AuthTokens> {
  const { data } = await api.post<AuthTokens>('/api/v1/auth/token/refresh/', { refresh });
  return data;
}

export interface LogEntry {
  id: number;
  action_time: string;
  actor: string;
  accion: string;
  modelo: string;
  object_repr: string;
  change_message: string;
}

export async function getLogs(): Promise<LogEntry[]> {
  const { data } = await api.get<any>('/api/v1/usuarios/logs/');
  // Dependiendo de paginación o list directa:
  if (data && Array.isArray(data.results)) {
    return data.results;
  } else if (Array.isArray(data)) {
    return data;
  }
  return [];
}

export async function getCurrentUser(): Promise<UserProfile> {
  const { data } = await api.get<UserProfile>('/api/v1/usuarios/me/');
  return data;
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
