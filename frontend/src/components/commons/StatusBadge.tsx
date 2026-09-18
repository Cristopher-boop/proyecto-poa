import React from 'react';
import {
  Clock,
  Send,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Activity,
  Lock,
} from 'lucide-react';

export interface StatusBadgeProps {
  status: string;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'md',
  className = '',
}) => {
  const norm = (status || '').toUpperCase().trim();

  let style = 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/20';
  let Icon = FileText;
  let defaultLabel = norm.replace(/_/g, ' ');

  if (norm.includes('BORRADOR')) {
    style = 'bg-gray-500/15 text-gray-700 dark:text-gray-300 border-gray-500/25';
    Icon = Clock;
    defaultLabel = 'Borrador';
  } else if (norm.includes('PENDIENTE_GERENCIA') || norm.includes('REV_GERENCIA')) {
    style = 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30';
    Icon = Send;
    defaultLabel = 'Pendiente Gerencia';
  } else if (norm.includes('PENDIENTE_PLANIFICACION') || norm.includes('REV_PLANIFICACION')) {
    style = 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30';
    Icon = AlertCircle;
    defaultLabel = 'Rev. Planificación';
  } else if (norm.includes('APROBADO_GERENCIA') || norm.includes('APROBADO_PLANIFICACION')) {
    style = 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30';
    Icon = CheckCircle2;
    defaultLabel = 'Rev. Presupuestos';
  } else if (norm.includes('APROBADO') || norm.includes('APROBADO_FINANZAS')) {
    style = 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
    Icon = CheckCircle2;
    defaultLabel = 'Aprobado POA';
  } else if (norm.includes('RECHAZADO') || norm.includes('ANULADO')) {
    style = 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30';
    Icon = XCircle;
    defaultLabel = 'Rechazado';
  } else if (norm === 'FORMULACION') {
    style = 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30';
    Icon = Clock;
    defaultLabel = 'En Formulación';
  } else if (norm === 'EN_EJECUCION' || norm === 'EJECUTADO') {
    style = 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
    Icon = Activity;
    defaultLabel = 'En Ejecución';
  } else if (norm === 'FINALIZADO') {
    style = 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30';
    Icon = Lock;
    defaultLabel = 'Cerrado / Finalizado';
  }

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  const iconSizes = {
    sm: 11,
    md: 13,
  };

  return (
    <span
      className={`inline-flex items-center font-bold rounded-lg border shadow-sm select-none ${style} ${sizeClasses[size]} ${className}`}
    >
      <Icon size={iconSizes[size]} className="shrink-0" />
      <span>{label || defaultLabel}</span>
    </span>
  );
};
