import React from 'react';
import {
  UserCheck,
  Building,
  FileCheck2,
  Coins,
  ShieldCheck,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { FlowNode, RolInstitucional } from '../../types/guia.types';

interface FlowNodeCardProps {
  node: FlowNode;
  isSelected: boolean;
  onClick: () => void;
  onSimulateStep?: (stepId: number) => void;
}

const getRoleConfig = (role: RolInstitucional) => {
  switch (role) {
    case 'GERENTE':
      return {
        label: 'Gerente',
        icon: Building,
        badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
        ringColor: 'ring-amber-500/30',
      };
    case 'ELABORADOR':
      return {
        label: 'Elaborador',
        icon: UserCheck,
        badgeBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
        ringColor: 'ring-blue-500/30',
      };
    case 'PLANIFICACION':
      return {
        label: 'Planificación',
        icon: FileCheck2,
        badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        ringColor: 'ring-emerald-500/30',
      };
    case 'PRESUPUESTOS':
      return {
        label: 'Presupuestos',
        icon: ShieldCheck,
        badgeBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
        ringColor: 'ring-indigo-500/30',
      };
    case 'TESORERIA':
      return {
        label: 'Tesorería',
        icon: Coins,
        badgeBg: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30',
        ringColor: 'ring-violet-500/30',
      };
    case 'SISTEMA':
    default:
      return {
        label: 'Sistema POA',
        icon: Cpu,
        badgeBg: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30',
        ringColor: 'ring-slate-500/30',
      };
  }
};

const getNodeTypeClasses = (type: FlowNode['type'], isSelected: boolean) => {
  if (isSelected) {
    return 'border-theme-primary ring-2 ring-theme-primary shadow-xl shadow-theme-primary/10 scale-[1.02] bg-theme-surface';
  }

  switch (type) {
    case 'start':
      return 'border-blue-400/40 hover:border-blue-500 bg-theme-surface hover:shadow-md';
    case 'process':
      return 'border-theme-border hover:border-theme-primary/60 bg-theme-surface hover:shadow-md';
    case 'decision':
      return 'border-amber-400/50 hover:border-amber-500 bg-amber-50/20 dark:bg-amber-950/10 hover:shadow-md';
    case 'review':
      return 'border-indigo-400/50 hover:border-indigo-500 bg-theme-surface hover:shadow-md';
    case 'success':
      return 'border-emerald-500/60 hover:border-emerald-600 bg-emerald-50/20 dark:bg-emerald-950/10 hover:shadow-md';
    case 'warning':
      return 'border-amber-500/60 hover:border-amber-600 bg-amber-50/20 dark:bg-amber-950/10 hover:shadow-md';
    case 'danger':
      return 'border-rose-500/60 hover:border-rose-600 bg-rose-50/20 dark:bg-rose-950/10 hover:shadow-md';
    default:
      return 'border-theme-border bg-theme-surface';
  }
};

export const FlowNodeCard: React.FC<FlowNodeCardProps> = ({
  node,
  isSelected,
  onClick,
  onSimulateStep,
}) => {
  const roleCfg = getRoleConfig(node.role);
  const RoleIcon = roleCfg.icon;

  return (
    <div
      onClick={onClick}
      className={`relative w-64 rounded-2xl border p-4 text-left transition-all duration-200 cursor-pointer select-none group ${getNodeTypeClasses(
        node.type,
        isSelected
      )}`}
      style={{
        minHeight: '130px',
      }}
    >
      {/* Indicador de Tipo de Nodo */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleCfg.badgeBg}`}
        >
          <RoleIcon size={11} />
          {roleCfg.label}
        </span>

        {node.type === 'success' && (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={13} /> Conforme
          </span>
        )}
        {node.type === 'decision' && (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
            <Clock size={13} /> Decisión
          </span>
        )}
        {node.type === 'danger' && (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
            <AlertTriangle size={13} /> Rechazo
          </span>
        )}
      </div>

      {/* Título Principal */}
      <h4 className="text-xs font-bold text-theme-main group-hover:text-theme-primary transition-colors line-clamp-2">
        {node.label}
      </h4>

      {/* Subtítulo / Descripción corta */}
      {node.subtitle && (
        <p className="text-[11px] text-theme-muted mt-1 line-clamp-1">
          {node.subtitle}
        </p>
      )}

      {/* Footer / Botón de simulación rápido si aplica */}
      <div className="mt-3 pt-2 border-t border-theme-border/60 flex items-center justify-between text-[10px]">
        <span className="text-theme-muted font-medium truncate max-w-[140px]">
          {node.responsable}
        </span>
        {node.sandboxStepId && onSimulateStep && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSimulateStep(node.sandboxStepId!);
            }}
            className="text-theme-primary font-bold hover:underline flex items-center gap-0.5"
            title="Simular en el Sistema Real"
          >
            Simular <ArrowRight size={10} />
          </button>
        )}
      </div>

      {/* Halo animado en selección */}
      {isSelected && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-theme-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-theme-primary"></span>
        </span>
      )}
    </div>
  );
};
