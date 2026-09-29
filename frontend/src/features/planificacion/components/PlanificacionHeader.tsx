import React from 'react';
import { Compass, Target, FileCheck2, History, Plus, Copy } from 'lucide-react';
import type { PlanificacionTab } from '../types/planificacion.types';

import { PageHeader } from '../../../components/commons';

interface PlanificacionHeaderProps {
  activeTab: PlanificacionTab;
  onTabChange: (tab: PlanificacionTab) => void;
  operacionesCount: number;
  acpCount: number;
  ampCount: number;
  canCreateOp: boolean;
  canManageAmpOrAcp: boolean;
  canReplicate: boolean;
  compGestionDestino: number;
  replicating: boolean;
  onOpenCreateOp: () => void;
  onOpenCreateAcp: () => void;
  onOpenCreateAmp: () => void;
  onReplicar: () => void;
}

export const PlanificacionHeader: React.FC<PlanificacionHeaderProps> = ({
  activeTab,
  onTabChange,
  operacionesCount,
  acpCount,
  ampCount,
  canCreateOp,
  canManageAmpOrAcp,
  canReplicate,
  compGestionDestino,
  replicating,
  onOpenCreateOp,
  onOpenCreateAcp,
  onOpenCreateAmp,
  onReplicar,
}) => {
  return (
    <div className="space-y-4">
      {/* Cabecera Principal Unificada */}
      <PageHeader
        icon={<Compass size={26} />}
        title="Planificación Estratégica Institucional"
        subtitle="Catálogo de Operaciones por Programa, Objetivos POA (ACP) y Planes Quinquenales (AMP)."
        actions={
          <>
            {activeTab === 'OPERACIONES' && canCreateOp && (
              <button
                type="button"
                onClick={onOpenCreateOp}
                className="px-4 py-2 rounded-xl bg-theme-primary text-theme-primaryText font-semibold text-xs shadow-sm hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus size={15} /> Nueva Operación
              </button>
            )}

            {activeTab === 'ACP' && canManageAmpOrAcp && (
              <button
                type="button"
                onClick={onOpenCreateAcp}
                className="px-4 py-2 rounded-xl bg-theme-primary text-theme-primaryText font-semibold text-xs shadow-sm hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus size={15} /> Nueva ACP
              </button>
            )}

            {activeTab === 'AMP' && canManageAmpOrAcp && (
              <button
                type="button"
                onClick={onOpenCreateAmp}
                className="px-4 py-2 rounded-xl bg-theme-primary text-theme-primaryText font-semibold text-xs shadow-sm hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus size={15} /> Nueva AMP
              </button>
            )}

            {activeTab === 'COMPARATIVA' && canReplicate && (
              <button
                type="button"
                onClick={onReplicar}
                disabled={replicating}
                className="px-4 py-2 rounded-xl bg-theme-primary text-theme-primaryText font-semibold text-xs shadow-sm hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <Copy size={14} /> {replicating ? 'Replicando...' : `Replicar Base a ${compGestionDestino}`}
              </button>
            )}
          </>
        }
      />

      {/* Pestañas de Navegación */}
      <div className="flex flex-wrap items-center gap-2 border-b border-theme-border/80 pb-2.5">
        <button
          type="button"
          onClick={() => onTabChange('OPERACIONES')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs transition-all ${
            activeTab === 'OPERACIONES'
              ? 'bg-theme-primary text-theme-primaryText shadow-sm'
              : 'text-theme-muted hover:bg-theme-surface hover:text-theme-main'
          }`}
        >
          <FileCheck2 size={15} />
          <span>Operaciones por Área</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              activeTab === 'OPERACIONES'
                ? 'bg-black/10 dark:bg-white/20 text-theme-primaryText'
                : 'bg-slate-200/70 text-slate-700 border border-slate-300/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
            }`}
          >
            {operacionesCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('ACP')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs transition-all ${
            activeTab === 'ACP'
              ? 'bg-theme-primary text-theme-primaryText shadow-sm'
              : 'text-theme-muted hover:bg-theme-surface hover:text-theme-main'
          }`}
        >
          <Target size={15} />
          <span>Acciones Corto Plazo</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              activeTab === 'ACP'
                ? 'bg-black/10 dark:bg-white/20 text-theme-primaryText'
                : 'bg-slate-200/70 text-slate-700 border border-slate-300/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
            }`}
          >
            {acpCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('AMP')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs transition-all ${
            activeTab === 'AMP'
              ? 'bg-theme-primary text-theme-primaryText shadow-sm'
              : 'text-theme-muted hover:bg-theme-surface hover:text-theme-main'
          }`}
        >
          <Compass size={15} />
          <span>Acciones Mediano Plazo</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              activeTab === 'AMP'
                ? 'bg-black/10 dark:bg-white/20 text-theme-primaryText'
                : 'bg-slate-200/70 text-slate-700 border border-slate-300/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
            }`}
          >
            {ampCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('COMPARATIVA')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs transition-all ${
            activeTab === 'COMPARATIVA'
              ? 'bg-theme-primary text-theme-primaryText shadow-sm'
              : 'text-theme-muted hover:bg-theme-surface hover:text-theme-main'
          }`}
        >
          <History size={15} />
          <span>Comparativa Interanual Gestiones</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
              activeTab === 'COMPARATIVA'
                ? 'bg-black/10 dark:bg-white/20 text-theme-primaryText'
                : 'bg-slate-200/70 text-slate-700 border border-slate-300/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
            }`}
          >
            Multi-Gestión
          </span>
        </button>
      </div>
    </div>
  );
};
