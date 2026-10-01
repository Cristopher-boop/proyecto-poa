import React from 'react';
import { Layers3, Edit3, Building2, CheckCircle2, XCircle } from 'lucide-react';
import { Modal, Button } from '../../../components/commons';
import type { Seccion, Area } from '../types/organizacional.types';

interface SeccionDetalleModalProps {
  isOpen: boolean;
  onClose: () => void;
  seccion: Seccion | null;
  areas: Area[];
  onEdit: (sec: Seccion) => void;
}

export const SeccionDetalleModal: React.FC<SeccionDetalleModalProps> = ({
  isOpen,
  onClose,
  seccion,
  areas,
  onEdit,
}) => {
  if (!isOpen || !seccion) return null;

  const parentArea = areas.find((a) => a.id === seccion.area);
  const isActiva = Boolean(seccion.estado);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalles de la Sección Operativa"
      subtitle="Ficha técnica de consulta organizacional"
      badge={
        <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 px-2 py-0.5 rounded">
          ID #{seccion.id}
        </span>
      }
      icon={<Layers3 size={20} className="text-theme-primary" />}
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => onEdit(seccion)}
            className="flex items-center gap-1.5"
          >
            <Edit3 size={14} /> Editar Sección
          </Button>
        </div>
      }
    >
      <div className="space-y-3.5 text-xs">
        {/* Metadatos Rápidos: Gerencia Dependiente y Estado */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="p-3 rounded-xl bg-theme-surface border border-theme-border">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-theme-muted block mb-1">
              Gerencia / Unidad Dependiente
            </span>
            {parentArea ? (
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-xs bg-blue-50 text-blue-700 border border-blue-200/90 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60 px-2 py-0.5 rounded shrink-0">
                  {parentArea.codigo}
                </span>
                <span className="text-xs font-semibold text-theme-main truncate">
                  {parentArea.nombre}
                </span>
              </div>
            ) : (
              <span className="text-xs text-theme-muted italic">Área ID: {seccion.area}</span>
            )}
          </div>

          <div className="p-3 rounded-xl bg-theme-surface border border-theme-border">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-theme-muted block mb-1">
              Estado Operativo
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold border select-none ${
                isActiva
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
              }`}
            >
              {isActiva ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
              {isActiva ? 'Activa' : 'Inactiva'}
            </span>
          </div>
        </div>

        {/* Nombre de la Sección */}
        <div className="p-3 rounded-xl bg-theme-surface border border-theme-border space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-theme-muted block">
            Nombre de la Sección
          </span>
          <p className="text-xs font-semibold text-theme-main">{seccion.nombre}</p>
        </div>

        {/* Descripción */}
        <div className="p-3 rounded-xl bg-theme-surface border border-theme-border space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-theme-muted block">
            Descripción / Alcance Operativo
          </span>
          <p className="text-xs text-theme-main font-normal leading-relaxed">
            {seccion.descripcion || <span className="italic text-theme-muted">Sin descripción registrada.</span>}
          </p>
        </div>
      </div>
    </Modal>
  );
};
