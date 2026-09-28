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
      title="Detalle de Partida Presupuestaria"
      subtitle="Consulta técnica de la información y clasificación en el clasificador presupuestario"
      badge={
        <span className="font-mono font-bold text-xs bg-theme-base px-2 py-0.5 rounded border border-theme-border text-theme-main">
          {partida.codigo}
        </span>
      }
      icon={<FileSpreadsheet size={20} className="text-theme-primary" />}
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Cerrar
          </Button>

          {canManage && onEdit && (
            <Button
              type="button"
              variant="primary"
              onClick={() => onEdit(partida)}
              className="flex items-center gap-1.5"
            >
              <Edit3 size={15} /> Editar Partida
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {/* Fila 1: Código y Clase */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Código */}
          <div>
            <label className="block text-xs font-semibold text-theme-main mb-1.5">
              Código de Partida
            </label>
            <div className="input-theme text-xs font-mono font-bold w-full bg-theme-base/50 flex items-center justify-between border border-theme-border py-2 px-3 rounded-xl select-all">
              <span>{partida.codigo}</span>
              <span className="text-[10px] font-sans font-normal text-theme-muted">
                Clasificador Numérico
              </span>
            </div>
            <span className="text-[10px] text-theme-muted mt-1 block">
              Código clasificador numérico oficial
            </span>
          </div>

          {/* Clase */}
          <div>
            <label className="block text-xs font-semibold text-theme-main mb-1.5">
              Clase
            </label>
            <div className="w-full rounded-xl border border-theme-border bg-theme-base/50 px-3 py-2 text-xs font-semibold flex items-center justify-between">
              <span className={isEgreso ? 'text-blue-700 dark:text-blue-300' : 'text-emerald-700 dark:text-emerald-300'}>
                {isEgreso ? 'Egreso (Gasto)' : 'Ingreso (Recurso)'}
              </span>
              <span className="text-[10px] font-normal text-theme-muted">
                {partida.clase_display || (isEgreso ? 'Egreso' : 'Ingreso')}
              </span>
            </div>
            <span className="text-[10px] text-theme-muted mt-1 block">
              Tipo de flujo presupuestario
            </span>
          </div>
        </div>

        {/* Fila 2: Nombre / Denominación Oficial */}
        <div>
          <label className="block text-xs font-semibold text-theme-main mb-1.5">
            Nombre / Denominación Oficial
          </label>
          <div className="input-theme text-xs font-medium w-full bg-theme-base/50 border border-theme-border py-2 px-3 rounded-xl select-all text-theme-main">
            {partida.nombre}
          </div>
        </div>

        {/* Fila 3: Capítulo / Rubro */}
        <div>
          <label className="block text-xs font-semibold text-theme-main mb-1.5">
            Capítulo / Rubro Institucional
          </label>
          <div className="input-theme text-xs w-full bg-theme-base/50 border border-theme-border py-2 px-3 rounded-xl text-theme-muted">
            {grupo.codigo} — {grupo.nombre}
          </div>
        </div>

        {/* Fila 4: Descripción y Alcance */}
        <div>
          <label className="block text-xs font-semibold text-theme-main mb-1.5">
            Descripción y Alcance del Gasto
          </label>
          <div className="input-theme text-xs w-full bg-theme-base/50 border border-theme-border py-2 px-3 rounded-xl min-h-[72px] whitespace-pre-wrap leading-relaxed text-theme-main">
            {partida.descripcion ? (
              partida.descripcion
            ) : (
              <span className="italic text-theme-muted">
                Sin descripción técnica o alcance específico registrado.
              </span>
            )}
          </div>
        </div>

        {/* Fila 5: Estado activo / inactivo (mismo formato visual que la edición) */}
        <div className="pt-1">
          <div className="flex items-center gap-3 text-xs text-theme-main p-3 rounded-xl border border-theme-border bg-theme-base/40 select-none">
            <div className="w-5 h-5 rounded-md flex items-center justify-center bg-theme-surface border border-theme-border">
              {isActiva ? (
                <CheckCircle2 size={14} className="text-emerald-500" />
              ) : (
                <XCircle size={14} className="text-rose-500" />
              )}
            </div>
            <div>
              <span className="font-semibold block text-theme-main flex items-center gap-1.5">
                {isActiva ? 'Partida Activa' : 'Partida Inactiva'}
              </span>
              <span className="text-[11px] text-theme-muted block mt-0.5">
                {isActiva
                  ? 'Disponible para selección en la formulación de Memorias de Cálculo.'
                  : 'Partida inactiva. No se puede seleccionar en nuevas formulaciones.'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
