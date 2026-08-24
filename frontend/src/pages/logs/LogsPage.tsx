import React, { useState, useEffect } from 'react';
import { Activity, Search, RefreshCw, UserCheck, Shield, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getLogs, getLoginLogs, getUltimosIngresos, LogEntry, UserProfile } from '../../services/authService';

export default function LogsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'INGRESOS' | 'HISTORIAL_LOGINS' | 'LOGS_GENERALES'>('INGRESOS');
  
  const [ultimosIngresos, setUltimosIngresos] = useState<UserProfile[]>([]);
  const [loginLogs, setLoginLogs] = useState<LogEntry[]>([]);
  const [generalLogs, setGeneralLogs] = useState<LogEntry[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const rolName = user?.rol_nombre?.toUpperCase() || '';
  const isAdmin = user?.is_superuser || rolName === 'ADMINISTRADOR';

  const cargarDatos = async () => {
    setLoading(true);
    try {
      if (activeTab === 'INGRESOS') {
        const data = await getUltimosIngresos();
        setUltimosIngresos(data || []);
      } else if (activeTab === 'HISTORIAL_LOGINS') {
        const data = await getLoginLogs();
        setLoginLogs(data || []);
      } else {
        const data = await getLogs();
        setGeneralLogs(data || []);
      }
    } catch (err) {
      console.error('Error cargando auditoría:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      cargarDatos();
    } else {
      setLoading(false);
    }
  }, [isAdmin, activeTab]);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 text-center max-w-lg mx-auto">
        <div className="p-4 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 mb-4">
          <Shield size={48} />
        </div>
        <h2 className="text-xl font-bold text-theme-main">Acceso Exclusivo para Superadministrador</h2>
        <p className="text-theme-muted mt-2 text-sm">
          Solo los usuarios con privilegio de Superadministrador / Administrador tienen autorización para consultar el registro de accesos y auditoría del sistema.
        </p>
      </div>
    );
  }

  // Filtrado de búsquedas
  const filteredIngresos = ultimosIngresos.filter(
    (u) =>
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.rol_nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.area_nombre || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLoginLogs = loginLogs.filter(
    (l) =>
      l.usuario_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.usuario_username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.change_message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredGeneralLogs = generalLogs.filter(
    (l) =>
      l.object_repr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.usuario_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.change_message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Cabecera Principal */}
      <div className="card p-6 bg-gradient-to-r from-theme-surface via-theme-surface to-brand-50/20 dark:to-brand-900/10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3.5 rounded-2xl bg-theme-primary/15 text-theme-primary shadow-sm">
              <UserCheck size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-6 rounded-full bg-theme-primary" />
                <span className="text-xs font-semibold uppercase tracking-widest text-theme-primary">
                  Panel de Control Superadministrador
                </span>
              </div>
              <h1 className="text-2xl font-bold text-theme-main tracking-tight mt-0.5">
                Auditoría & Control de Accesos
              </h1>
              <p className="text-sm text-theme-muted">
                Monitoreo de ingresos de usuarios, accesos recientes e historial de sesiones.
              </p>
            </div>
          </div>

          <button onClick={cargarDatos} disabled={loading} className="btn-secondary text-xs flex items-center gap-2 self-start sm:self-auto">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Actualizar Datos
          </button>
        </div>
      </div>

      {/* Navegación por pestañas */}
      <div className="flex items-center gap-2 border-b border-theme-border pb-2">
        <button
          onClick={() => setActiveTab('INGRESOS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-colors ${
            activeTab === 'INGRESOS'
              ? 'bg-theme-primary text-white shadow-sm'
              : 'text-theme-muted hover:bg-theme-surface'
          }`}
        >
          <UserCheck size={16} />
          <span>Últimos Ingresos por Usuario</span>
        </button>

        <button
          onClick={() => setActiveTab('HISTORIAL_LOGINS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-colors ${
            activeTab === 'HISTORIAL_LOGINS'
              ? 'bg-theme-primary text-white shadow-sm'
              : 'text-theme-muted hover:bg-theme-surface'
          }`}
        >
          <Clock size={16} />
          <span>Historial de Logins (Sesiones)</span>
        </button>

        <button
          onClick={() => setActiveTab('LOGS_GENERALES')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-colors ${
            activeTab === 'LOGS_GENERALES'
              ? 'bg-theme-primary text-white shadow-sm'
              : 'text-theme-muted hover:bg-theme-surface'
          }`}
        >
          <Activity size={16} />
          <span>Auditoría General del Sistema</span>
        </button>
      </div>

      {/* Barra de Búsqueda */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted" size={16} />
          <input
            type="text"
            placeholder={
              activeTab === 'INGRESOS'
                ? 'Buscar por usuario, nombre, rol o área...'
                : 'Buscar por usuario o mensaje...'
            }
            className="input-theme pl-9 py-2 text-xs w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Contenido según Pestaña */}
      {loading ? (
        <div className="card p-12 text-center text-theme-muted">
          <div className="animate-spin inline-block w-6 h-6 border-2 border-theme-primary border-t-transparent rounded-full mb-2" />
          <p className="text-xs">Cargando registros de auditoría...</p>
        </div>
      ) : (
        <>
          {activeTab === 'INGRESOS' && (
            <div className="card overflow-hidden p-0 border border-theme-border">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="uppercase bg-theme-base/60 text-theme-muted font-bold border-b border-theme-border">
                    <tr>
                      <th className="py-3.5 px-4">Usuario</th>
                      <th className="py-3.5 px-4">Nombre Completo</th>
                      <th className="py-3.5 px-4">Rol Asignado</th>
                      <th className="py-3.5 px-4">Área / Unidad</th>
                      <th className="py-3.5 px-4">Último Inicio de Sesión</th>
                      <th className="py-3.5 px-4 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-border">
                    {filteredIngresos.map((u) => {
                      const fullName = `${u.first_name} ${u.last_name}`.trim() || u.username;
                      const hasLogin = Boolean(u.last_login);
                      return (
                        <tr key={u.id} className="hover:bg-theme-border/20 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-theme-primary">
                            @{u.username}
                          </td>
                          <td className="py-3 px-4 font-semibold text-theme-main">
                            {fullName}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                              {u.is_superuser ? 'Superadministrador' : u.rol_nombre || 'Sin Rol'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-theme-muted font-medium">
                            {u.area_nombre || 'General / Administración'}
                          </td>
                          <td className="py-3 px-4 font-semibold whitespace-nowrap">
                            {hasLogin ? (
                              <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                                <Clock size={13} />
                                {new Date(u.last_login!).toLocaleString('es-BO')}
                              </span>
                            ) : (
                              <span className="text-theme-muted font-normal italic">
                                Sin ingresos registrados
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {u.estado !== false ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                                <CheckCircle2 size={11} /> Activo
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 dark:bg-rose-900/30 px-2 py-0.5 rounded-full">
                                <XCircle size={11} /> Inactivo
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {filteredIngresos.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-theme-muted">
                          No se encontraron usuarios coincidentes.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'HISTORIAL_LOGINS' && (
            <div className="card overflow-hidden p-0 border border-theme-border">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="uppercase bg-theme-base/60 text-theme-muted font-bold border-b border-theme-border">
                    <tr>
                      <th className="py-3.5 px-4">Fecha y Hora</th>
                      <th className="py-3.5 px-4">Usuario</th>
                      <th className="py-3.5 px-4">Evento</th>
                      <th className="py-3.5 px-4">Detalles</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-border">
                    {filteredLoginLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-theme-border/20 transition-colors">
                        <td className="py-3 px-4 font-semibold text-theme-main whitespace-nowrap">
                          {new Date(log.action_time).toLocaleString('es-BO')}
                        </td>
                        <td className="py-3 px-4 font-medium text-theme-main">
                          {log.usuario_nombre}{' '}
                          <span className="text-theme-muted font-mono">(@{log.usuario_username})</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                            Inicio de Sesión (Login)
                          </span>
                        </td>
                        <td className="py-3 px-4 text-theme-muted font-mono">{log.change_message}</td>
                      </tr>
                    ))}
                    {filteredLoginLogs.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-theme-muted">
                          No hay eventos de inicio de sesión registrados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'LOGS_GENERALES' && (
            <div className="card overflow-hidden p-0 border border-theme-border">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="uppercase bg-theme-base/60 text-theme-muted font-bold border-b border-theme-border">
                    <tr>
                      <th className="py-3.5 px-4">Fecha</th>
                      <th className="py-3.5 px-4">Usuario</th>
                      <th className="py-3.5 px-4">Objeto Afectado</th>
                      <th className="py-3.5 px-4">Acción</th>
                      <th className="py-3.5 px-4">Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-border">
                    {filteredGeneralLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-theme-border/20 transition-colors">
                        <td className="py-3 px-4 text-theme-muted whitespace-nowrap">
                          {new Date(log.action_time).toLocaleString('es-BO')}
                        </td>
                        <td className="py-3 px-4 font-medium text-theme-main">
                          {log.usuario_nombre}{' '}
                          <span className="text-theme-muted font-mono">(@{log.usuario_username})</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-theme-main">{log.object_repr}</td>
                        <td className="py-3 px-4">
                          {log.action_flag === 1 && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Creación
                            </span>
                          )}
                          {log.action_flag === 2 && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                              Modificación
                            </span>
                          )}
                          {log.action_flag === 3 && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                              Eliminación
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-theme-muted">{log.change_message}</td>
                      </tr>
                    ))}
                    {filteredGeneralLogs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-theme-muted">
                          No se encontraron registros de auditoría.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
