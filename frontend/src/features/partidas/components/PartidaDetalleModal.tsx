import React from 'react';
import { FileSpreadsheet, CheckCircle2, Edit3, XCircle } from 'lucide-react';
import { Modal, Button } from '../../../components/commons';
import type { Partida } from '../types/partidas.types';
import { getPartidaGrupo } from '../types/partidas.types';

interface PartidaDetalleModalProps {
  isOpen: boolean;
  partida: Partida | null;
  canManage?: boolean;
  onClose: () => void;
  onEdit?: (partida: Partida) => void;
}

export const PartidaDetalleModal: React.FC<PartidaDetalleModalProps> = ({
  isOpen,
  partida,
  canManage = false,
  onClose,
  onEdit,
}) => {
  if (!isOpen || !partida) return null;

  const grupo = getPartidaGrupo(partida.codigo);
  const isEgreso = (partida.clase || 'EGRESO').toUpperCase() === 'EGRESO';
  const isActiva = Boolean(partida.estado);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalles de la Partida Presupuestaria"
      subtitle="Ficha técnica de consulta y clasificación oficial del clasificador"
      badge={
        <span className="font-mono font-bold text-xs bg-blue-50 text-blue-700 border border-blue-200/90 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60 px-2.5 py-0.5 rounded-lg">
          {partida.codigo}
        </span>
      }
      icon={<FileSpreadsheet size={20} className="text-theme-primary" />}
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cerrar
          </Button>

          {canManage && onEdit && (
            <Button
              type="button"
              variant="primary"
              onClick={() => onEdit(partida)}
              className="flex items-center gap-1.5"
            >
              <Edit3 size={14} /> Editar Partida
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-3.5 text-xs">
        {/* Metadatos Rápidos: Código, Clase y Estado */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="p-3 rounded-xl bg-theme-surface border border-theme-border">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-theme-muted block mb-1">
              Código Oficial
            </span>
            <span className="font-mono font-bold text-xs bg-blue-50 text-blue-700 border border-blue-200/90 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60 px-2 py-0.5 rounded inline-block">
              {partida.codigo}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-theme-surface border border-theme-border">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-theme-muted block mb-1">
              Flujo / Clase
            </span>
            <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200/90 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-800/50 font-mono inline-block">
              {isEgreso ? 'Egreso (Gasto)' : 'Ingreso (Recurso)'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-theme-surface border border-theme-border">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-theme-muted block mb-1">
              Estado
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

        {/* Denominación Oficial */}
        <div className="p-3 rounded-xl bg-theme-surface border border-theme-border space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-theme-muted block">
            Denominación Oficial
          </span>
          <p className="text-xs font-semibold text-theme-main">{partida.nombre}</p>
        </div>

        {/* Capítulo / Rubro */}
        <div className="p-3 rounded-xl bg-theme-surface border border-theme-border space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-theme-muted block">
            Capítulo / Rubro Institucional
          </span>
          <p className="text-xs font-medium text-theme-main">
            {grupo.codigo} — {grupo.nombre}
          </p>
        </div>

        {/* Descripción y Alcance */}
        <div className="p-3 rounded-xl bg-theme-surface border border-theme-border space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-theme-muted block">
            Descripción y Alcance del Gasto
          </span>
          <p className="text-xs text-theme-main font-normal leading-relaxed whitespace-pre-wrap">
            {partida.descripcion || (
              <span className="italic text-theme-muted">
                Sin descripción técnica o alcance específico registrado.
              </span>
            )}
          </p>
        </div>
      </div>
    </Modal>
  );
};
