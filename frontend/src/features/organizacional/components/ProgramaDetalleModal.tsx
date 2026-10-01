import React from 'react';
import { FolderTree, Edit3, Building2, CheckCircle2, XCircle } from 'lucide-react';
import { Modal, Button } from '../../../components/commons';
import type { Programa } from '../types/organizacional.types';
import { formatProgramaShort } from '../utils/organizacionalUtils';

interface ProgramaDetalleModalProps {
  isOpen: boolean;
  onClose: () => void;
  programa: Programa | null;
  onEdit: (prog: Programa) => void;
}

export const ProgramaDetalleModal: React.FC<ProgramaDetalleModalProps> = ({
  isOpen,
  onClose,
  programa,
  onEdit,
}) => {
  if (!isOpen || !programa) return null;

  const shortTitle = formatProgramaShort(programa);
  const isActivo = Boolean(programa.estado);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalles del Programa Institucional"
      subtitle="Ficha técnica del clasificador presupuestario oficial"
      badge={
        <span className="font-mono font-bold text-xs bg-amber-50 text-amber-900 border border-amber-200/90 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-800/50 px-2.5 py-0.5 rounded-lg">
          {programa.codigo}
        </span>
      }
      icon={<FolderTree size={20} className="text-theme-primary" />}
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => onEdit(programa)}
            className="flex items-center gap-1.5"
          >
            <Edit3 size={14} /> Editar Programa
          </Button>
        </div>
      }
    >
      <div className="space-y-3.5 text-xs">
        {/* Metadatos Rápidos: Programa y Estado */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="p-3 rounded-xl bg-theme-surface border border-theme-border">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-theme-muted block mb-1">
              Identificador Oficial
            </span>
            <span className="text-xs font-semibold text-theme-main">
              {shortTitle}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-theme-surface border border-theme-border">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-theme-muted block mb-1">
              Estado Presupuestario
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold border select-none ${
                isActivo
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
              }`}
            >
              {isActivo ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
              {isActivo ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>

        {/* Denominación Completa */}
        <div className="p-3 rounded-xl bg-theme-surface border border-theme-border space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-theme-muted block">
            Denominación Completa
          </span>
          <p className="text-xs font-semibold text-theme-main">{programa.nombre}</p>
        </div>

        {/* Gerencias / Unidades Vinculadas */}
        <div className="p-3 rounded-xl bg-theme-surface border border-theme-border flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-theme-muted flex items-center gap-1.5">
            <Building2 size={13} /> Gerencias / Unidades Vinculadas
          </span>
          <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 px-2 py-0.5 rounded">
            {programa.areas_count ?? programa.areas?.length ?? 0} registradas
          </span>
        </div>

        {/* Descripción */}
        <div className="p-3 rounded-xl bg-theme-surface border border-theme-border space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-theme-muted block">
            Descripción y Objetivos
          </span>
          <p className="text-xs text-theme-main font-normal leading-relaxed">
            {programa.descripcion || <span className="italic text-theme-muted">Sin descripción registrada.</span>}
          </p>
        </div>
      </div>
    </Modal>
  );
};
