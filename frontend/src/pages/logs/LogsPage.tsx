import { useState, useEffect } from 'react';
import { Activity, Search, RefreshCw } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getLogs, LogEntry } from '../../services/authService';

export default function LogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const rolName = user?.rol_nombre?.toUpperCase() || '';
  const isAdmin = user?.is_superuser || rolName === 'ADMINISTRADOR' || rolName === 'APROBADOR';

  useEffect(() => {
    if (isAdmin) {
      cargarLogs();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  async function cargarLogs() {
    setLoading(true);
    try {
      const data = await getLogs();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <Activity size={48} className="text-theme-muted mb-4 opacity-50" />
        <h2 className="text-xl font-bold text-theme-main">Acceso Restringido</h2>
        <p className="text-theme-muted mt-2">Solo los administradores pueden ver los registros de auditoría.</p>
      </div>
    );
  }

  const filteredLogs = logs.filter(
    (l) =>
      l.object_repr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.usuario_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.change_message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-theme-main flex items-center gap-2">
            <Activity className="text-theme-primary" />
            Auditoría del Sistema
          </h1>
          <p className="text-theme-muted mt-1 text-sm">
            Historial de cambios y acciones realizadas por los usuarios.
          </p>
        </div>
        <button onClick={cargarLogs} disabled={loading} className="btn-secondary text-sm">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Actualizar
        </button>
      </div>

      <div className="mb-6 flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted" size={16} />
          <input
            type="text"
            placeholder="Buscar por memoria, usuario o acción..."
            className="input-theme pl-9 py-2 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-theme-surface border border-theme-border rounded-xl shadow-sm flex-1 overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1 p-0">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-theme-base/50 text-theme-muted sticky top-0 backdrop-blur-md z-10 border-b border-theme-border">
              <tr>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Usuario</th>
                <th className="py-3 px-4">Objeto</th>
                <th className="py-3 px-4">Acción</th>
                <th className="py-3 px-4">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-border">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-theme-border/10">
                  <td className="py-3 px-4 text-theme-muted whitespace-nowrap">
                    {new Date(log.action_time).toLocaleString('es-BO')}
                  </td>
                  <td className="py-3 px-4 font-medium text-theme-main">
                    {log.usuario_nombre} <span className="text-theme-muted text-xs font-normal">({log.usuario_username})</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-xs">{log.object_repr}</td>
                  <td className="py-3 px-4">
                    {log.action_flag === 1 && <span className="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-md text-xs font-medium">Creación</span>}
                    {log.action_flag === 2 && <span className="text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md text-xs font-medium">Modificación</span>}
                    {log.action_flag === 3 && <span className="text-rose-600 bg-rose-50 dark:bg-rose-900/30 px-2 py-1 rounded-md text-xs font-medium">Eliminación</span>}
                  </td>
                  <td className="py-3 px-4 text-theme-muted">{log.change_message}</td>
                </tr>
              ))}
              {filteredLogs.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-theme-muted">
                    No se encontraron registros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
