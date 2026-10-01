import React from 'react';
import { Database, LogIn, AlertTriangle, Users } from 'lucide-react';
import { ResumenCards, ResumenCardItem } from '../../../components/commons';
import { AuditResumen } from '../types/auditoria.types';

interface AuditoriaKpisProps {
  resumen: AuditResumen | null;
  loading: boolean;
}

export const AuditoriaKpis: React.FC<AuditoriaKpisProps> = ({ resumen, loading }) => {
  if (loading || !resumen) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="card p-4 bg-theme-surface border border-theme-border rounded-2xl animate-pulse h-28 flex flex-col justify-between"
          >
            <div className="flex justify-between items-center">
              <div className="h-3 w-28 bg-theme-border/60 rounded" />
              <div className="w-8 h-8 bg-theme-border/60 rounded-xl" />
            </div>
            <div className="h-7 w-20 bg-theme-border/60 rounded mt-2" />
          </div>
        ))}
      </div>
    );
  }

  const items: ResumenCardItem[] = [
    {
      id: 'total_logs',
      title: 'Eventos Registrados',
      value: resumen.total_logs.toLocaleString(),
      subtitle: `${resumen.acciones_hoy} movimientos en la fecha de hoy`,
      icon: <Database size={18} />,
      color: 'primary',
    },
    {
      id: 'logins_hoy',
      title: 'Inicios de Sesión Hoy',
      value: resumen.logins_hoy.toLocaleString(),
      subtitle: `${resumen.usuarios_activos_total} de ${resumen.total_usuarios} usuarios con ingreso`,
      icon: <LogIn size={18} />,
      color: 'blue',
      progress: {
        value: resumen.total_usuarios > 0 ? (resumen.usuarios_activos_total / resumen.total_usuarios) * 100 : 0,
        label: 'Tasa de Acceso Activo',
      },
    },
    {
      id: 'modificaciones_criticas',
      title: 'Acciones Críticas',
      value: resumen.modificaciones_criticas.toLocaleString(),
      subtitle: 'Eliminaciones, rechazos y cierres',
      icon: <AlertTriangle size={18} />,
      color: 'amber',
    },
    {
      id: 'usuarios_activos',
      title: 'Personal Institucional',
      value: `${resumen.usuarios_activos_total} / ${resumen.total_usuarios}`,
      subtitle: 'Servidores con actividad en el sistema',
      icon: <Users size={18} />,
      color: 'emerald',
    },
  ];

  return <ResumenCards items={items} columns={4} />;
};
