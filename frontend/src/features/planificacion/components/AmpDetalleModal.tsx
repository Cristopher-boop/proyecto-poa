import React from 'react';
import { Compass, Layers, Calendar, Edit3, CheckCircle2, XCircle } from 'lucide-react';
import { Modal, Button } from '../../../components/commons';
import type { AccionMedianoPlazo } from '../types/planificacion.types';

interface AmpDetalleModalProps {
  isOpen: boolean;
  amp: AccionMedianoPlazo | null;
  canEdit?: boolean;
  onClose: () => void;
  onEdit?: (amp: AccionMedianoPlazo) => void;
}

export const AmpDetalleModal: React.FC<AmpDetalleModalProps> = ({
  isOpen,
  amp,
  canEdit = false,
  onClose,
  onEdit,
}) => {
  if (!isOpen || !amp) return null;

  const isActiva = Boolean(amp.estado);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalle de Acción a Mediano Plazo (AMP)"
      subtitle="Objetivo Estratégico Quinquenal articulado al Plan Estratégico Institucional (PEI)"
      badge={
        <span className="font-mono font-bold text-xs bg-theme-base px-2.5 py-1 rounded-lg border border-theme-border text-theme-primary">
          {amp.codigo}
        </span>
      }
      icon={<Compass size={20} className="text-theme-primary" />}
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
              onClick={() => onEdit(amp)}
              className="flex items-center gap-1.5"
            >
              <Edit3 size={15} /> Editar AMP
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
              Código AMP
            </span>
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-xs text-theme-primary bg-theme-base px-2 py-0.5 rounded border border-theme-border">
                {amp.codigo}
              </span>
              <span className="text-[10px] text-theme-muted">
                Objetivo PEI
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
                {isActiva ? 'Vigente en quinquenio' : 'Baja lógica'}
              </span>
            </div>
          </div>
        </div>

        {/* Fila 2: Descripción */}
        <div className="p-3.5 rounded-xl bg-theme-surface border border-theme-border space-y-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-theme-muted block">
            Descripción del Objetivo Quinquenal
          </span>
          <p className="text-xs text-theme-main font-medium leading-relaxed whitespace-pre-wrap">
            {amp.descripcion || (
              <span className="italic text-theme-muted">Sin descripción detallada del objetivo quinquenal.</span>
            )}
          </p>
        </div>

        {/* Fila 3: Programa Institucional y Período Quinquenal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="p-3 rounded-xl bg-theme-surface border border-theme-border">
            <span className="text-[10px] font-semibold uppercase text-theme-muted block mb-1.5 flex items-center gap-1">
              <Layers size={12} className="text-theme-muted" />
              Programa Institucional
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs text-theme-primary bg-theme-base px-2 py-0.5 rounded border border-theme-border shrink-0">
                {amp.programa_codigo || 'P-01'}
              </span>
              <span className="text-xs font-semibold text-theme-main line-clamp-1">
                {amp.programa_nombre || 'Programa General'}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-theme-surface border border-theme-border">
            <span className="text-[10px] font-semibold uppercase text-theme-muted block mb-1.5 flex items-center gap-1">
              <Calendar size={12} className="text-theme-muted" />
              Período de Vigencia Quinquenal
            </span>
            <span className="font-mono font-bold text-xs text-theme-main">
              {amp.periodo_inicio} — {amp.periodo_fin} ({Number(amp.periodo_fin) - Number(amp.periodo_inicio) + 1} Años)
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
};
