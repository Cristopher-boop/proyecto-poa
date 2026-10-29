import React from 'react';
import {
  X,
  PlayCircle,
  Sparkles,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  FileText,
  User,
  ArrowRight,
} from 'lucide-react';
import { FlowNode } from '../../types/guia.types';
import { Button } from '../../../../components/commons';

interface NodeDetailDrawerProps {
  node: FlowNode | null;
  onClose: () => void;
  onSimulate?: (stepId: number) => void;
}

export const NodeDetailDrawer: React.FC<NodeDetailDrawerProps> = ({
  node,
  onClose,
  onSimulate,
}) => {
  if (!node) return null;

  return (
    <div className="absolute right-4 bottom-4 top-4 w-96 max-w-[calc(100%-2rem)] bg-theme-surface/98 backdrop-blur-md border border-theme-border rounded-2xl shadow-2xl p-5 flex flex-col z-30 animate-in fade-in slide-in-from-right-4 duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-theme-border pb-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-theme-primary px-2 py-0.5 rounded-full bg-theme-primary/10">
            Detalle del Paso Operativo
          </span>
          <h3 className="text-base font-bold text-theme-main mt-1.5 leading-snug">
            {node.label}
          </h3>
          {node.subtitle && (
            <p className="text-xs text-theme-muted mt-0.5">{node.subtitle}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-theme-muted hover:text-theme-main hover:bg-theme-border/50 rounded-xl transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Body scrollable */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs pr-1">
        {/* Descripción */}
        <div>
          <h5 className="font-bold text-theme-main mb-1 flex items-center gap-1.5">
            <FileText size={13} className="text-theme-primary" /> ¿En qué consiste este paso?
          </h5>
          <p className="text-theme-muted leading-relaxed bg-theme-base/60 p-3 rounded-xl border border-theme-border">
            {node.description}
          </p>
        </div>

        {/* Responsable */}
        <div>
          <h5 className="font-bold text-theme-main mb-1 flex items-center gap-1.5">
            <User size={13} className="text-amber-500" /> Responsable Institucional
          </h5>
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold">
            {node.responsable}
          </div>
        </div>

        {/* Requisitos y Prerrequisitos */}
        {node.requisitos && node.requisitos.length > 0 && (
          <div>
            <h5 className="font-bold text-theme-main mb-1 flex items-center gap-1.5">
              <CheckCircle size={13} className="text-emerald-500" /> Requisitos Previos
            </h5>
            <ul className="space-y-1.5 bg-theme-base/40 p-2.5 rounded-xl border border-theme-border">
              {node.requisitos.map((req, i) => (
                <li key={i} className="flex items-start gap-2 text-theme-muted">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Regla de Negocio Crítica */}
        {node.reglaNegocio && (
          <div>
            <h5 className="font-bold text-theme-main mb-1 flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-indigo-500" /> Regla Institucional Obligatoria
            </h5>
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 leading-relaxed font-medium">
              {node.reglaNegocio}
            </div>
          </div>
        )}

        {/* Resultado / Salida */}
        {node.salida && (
          <div>
            <h5 className="font-bold text-theme-main mb-1 flex items-center gap-1.5">
              <AlertCircle size={13} className="text-theme-primary" /> Resultado / Nuevo Estado
            </h5>
            <div className="p-2.5 rounded-xl bg-theme-base/60 border border-theme-border text-theme-main font-mono text-[11px]">
              {node.salida}
            </div>
          </div>
        )}
      </div>

      {/* Footer / Acción de simulación */}
      <div className="border-t border-theme-border pt-3">
        {node.sandboxStepId && onSimulate ? (
          <Button
            variant="primary"
            className="w-full flex items-center justify-center gap-2 py-2.5 text-xs shadow-md"
            onClick={() => onSimulate(node.sandboxStepId!)}
          >
            <Sparkles size={15} /> Simular en el Sistema Real
          </Button>
        ) : (
          <p className="text-[11px] text-center text-theme-muted italic">
            Este paso es de validación sistémica o institucional.
          </p>
        )}
      </div>
    </div>
  );
};
