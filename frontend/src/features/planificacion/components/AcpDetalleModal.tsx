import React from 'react';
import { Target, Compass, Layers, Calendar, Edit3, CheckCircle2, XCircle } from 'lucide-react';
import { Modal, Button } from '../../../components/commons';
import type { AccionCortoPlazo } from '../types/planificacion.types';

interface AcpDetalleModalProps {
  isOpen: boolean;
  acp: AccionCortoPlazo | null;
  canEdit?: boolean;
  onClose: () => void;
  onEdit?: (acp: AccionCortoPlazo) => void;
}

export const AcpDetalleModal: React.FC<AcpDetalleModalProps> = ({
  isOpen,
  acp,
  canEdit = false,
  onClose,
  onEdit,
}) => {
  if (!isOpen || !acp) return null;

  const isActiva = Boolean(acp.estado);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalle de Acción a Corto Plazo (ACP)"
      subtitle="Meta institucional de corto plazo alineada al Plan Operativo Anual (POA)"
      badge={
        <span className="font-mono font-bold text-xs bg-indigo-50 text-indigo-700 border border-indigo-200/90 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60 px-2.5 py-1 rounded-lg">
          {acp.codigo}
        </span>
      }
      icon={<Target size={20} className="text-indigo-600 dark:text-indigo-400" />}
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cerrar
          </Button>

          {canEdit && onEdit && (
            <Button
              type="button"
              variant="primary"
              onClick={() => onEdit(acp)}
              className="flex items-center gap-1.5"
            >
              <Edit3 size={15} /> Editar ACP
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Fila 1: Código y Estado */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="p-3 rounded-xl bg-theme-surface border border-theme-border">
            <span className="text-[10px] font-semibold uppercase text-theme-muted block mb-1">
              Código ACP
            </span>
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-xs bg-indigo-50 text-indigo-700 border border-indigo-200/90 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60 px-2 py-0.5 rounded">
                {acp.codigo}
              </span>
              <span className="text-[10px] text-theme-muted">
                Objetivo POA
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-theme-surface border border-theme-border">
            <span className="text-[10px] font-semibold uppercase text-theme-muted block mb-1">
              Estado
            </span>
            <div className="flex items-center justify-between">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border select-none ${
                  isActiva
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                }`}
              >
                {isActiva ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                {isActiva ? 'Activa' : 'Inactiva'}
              </span>
              <span className="text-[10px] text-theme-muted">
                {isActiva ? 'Vigente en formulación' : 'Baja lógica'}
              </span>
            </div>
          </div>
        </div>

        {/* Fila 2: Descripción */}
        <div className="p-3.5 rounded-xl bg-theme-surface border border-theme-border space-y-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-theme-muted block">
            Descripción del Objetivo POA
          </span>
          <p className="text-xs text-theme-main font-medium leading-relaxed whitespace-pre-wrap">
            {acp.descripcion || (
              <span className="italic text-theme-muted">Sin descripción detallada registrada.</span>
            )}
          </p>
        </div>

        {/* Fila 3: Programa Institucional y Gestión */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="p-3 rounded-xl bg-theme-surface border border-theme-border">
            <span className="text-[10px] font-semibold uppercase text-theme-muted block mb-1.5 flex items-center gap-1">
              <Layers size={12} className="text-theme-muted" />
              Programa Institucional
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs bg-amber-50 text-amber-900 border border-amber-200/90 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-800/50 px-2 py-0.5 rounded shrink-0">
                {acp.programa_codigo || 'P-01'}
              </span>
              <span className="text-xs font-semibold text-theme-main line-clamp-1">
                {acp.programa_nombre || 'Programa General'}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-theme-surface border border-theme-border">
            <span className="text-[10px] font-semibold uppercase text-theme-muted block mb-1.5 flex items-center gap-1">
              <Calendar size={12} className="text-theme-muted" />
              Gestión Fiscal POA
            </span>
            <span className="font-mono font-bold text-xs text-theme-main">
              {acp.gestion_anio ? `Gestión ${acp.gestion_anio}` : 'Gestión Vigente / Global'}
            </span>
          </div>
        </div>

        {/* Fila 4: AMP Vinculada */}
        <div className="p-3 rounded-xl bg-theme-surface border border-theme-border">
          <span className="text-[10px] font-semibold uppercase text-theme-muted block mb-1.5 flex items-center gap-1">
            <Compass size={12} className="text-theme-muted" />
            Acción a Mediano Plazo Vinculada (AMP PEI)
          </span>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono font-bold text-xs bg-violet-50 text-violet-700 border border-violet-200/90 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800/60 px-2 py-0.5 rounded">
              {acp.amp_codigo || 'AMP'}
            </span>
          </div>
          <p className="text-[11px] text-theme-muted line-clamp-2">
            {acp.amp_descripcion || 'Plan Estratégico Quinquenal Institucional'}
          </p>
        </div>
      </div>
    </Modal>
  );
};
