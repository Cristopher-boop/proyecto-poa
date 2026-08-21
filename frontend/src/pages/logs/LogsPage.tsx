import React, { useEffect, useState } from 'react';
import { ShieldAlert, Activity, FileText } from 'lucide-react';
import { getLogs, LogEntry } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';
import { Navigate } from 'react-router-dom';

export default function LogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLogs()
      .then(setLogs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (!user?.is_superuser) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="card p-6 bg-gradient-to-r from-theme-surface via-theme-surface to-brand-50/20 dark:to-brand-900/10">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-theme-primary/15 text-theme-main">
            <ShieldAlert size={28} className="text-theme-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-theme-main tracking-tight">Registro de Auditoría</h1>
            <p className="text-sm text-theme-muted">
              Logs del sistema (solo visible para superadministradores).
            </p>
          </div>
        </div>
      </div>

      <div className="card overflow-x-auto p-4">
        {loading ? (
          <p className="text-sm text-theme-muted text-center py-8">Cargando logs...</p>
        ) : (
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-theme-border bg-theme-base/60 text-xs font-semibold uppercase tracking-wider text-theme-muted">
                <th className="py-3.5 px-4">Fecha</th>
                <th className="py-3.5 px-4">Usuario</th>
                <th className="py-3.5 px-4">Acción</th>
                <th className="py-3.5 px-4">Modelo</th>
                <th className="py-3.5 px-4">Objeto</th>
                <th className="py-3.5 px-4">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-border">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-theme-muted">
                    <Activity size={36} className="mx-auto mb-2 opacity-40" />
                    <p className="font-medium">No hay registros de auditoría disponibles.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-theme-border/20 transition-colors">
                    <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                      {new Date(log.action_time).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-xs">{log.actor}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${
                        log.accion === 'Añadido' ? 'bg-emerald-100 text-emerald-800' :
                        log.accion === 'Modificado' ? 'bg-blue-100 text-blue-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {log.accion}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono">{log.modelo}</td>
                    <td className="py-3.5 px-4 text-xs">{log.object_repr}</td>
                    <td className="py-3.5 px-4 text-xs max-w-xs truncate" title={log.change_message}>
                      {log.change_message || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
