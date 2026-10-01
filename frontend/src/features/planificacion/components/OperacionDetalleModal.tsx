import React from 'react';
import { FileCheck2, Building2, Layers, Target, Compass, Edit3, CheckCircle2, XCircle } from 'lucide-react';
import { Modal, Button } from '../../../components/commons';
import type { Operacion } from '../types/planificacion.types';

interface OperacionDetalleModalProps {
  isOpen: boolean;
  operacion: Operacion | null;
  canEdit?: boolean;
  onClose: () => void;
  onEdit?: (op: Operacion) => void;
}

export const OperacionDetalleModal: React.FC<OperacionDetalleModalProps> = ({
  isOpen,
  operacion,
  canEdit = false,
  onClose,
  onEdit,
}) => {
  if (!isOpen || !operacion) return null;

  const isActiva = Boolean(operacion.estado);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalle de la Operación"
      subtitle="Consulta técnica y articulación estratégica del Plan Operativo Anual (POA)"
      badge={
        <span className="font-mono font-bold text-xs bg-blue-50 text-blue-700 border border-blue-200/90 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60 px-2.5 py-1 rounded-lg">
          {operacion.codigo}
        </span>
      }
      icon={<FileCheck2 size={20} className="text-blue-600 dark:text-blue-400" />}
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
              onClick={() => onEdit(operacion)}
              className="flex items-center gap-1.5"
            >
              <Edit3 size={15} /> Editar Operación
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
               Código de Operación
            </span>
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-xs bg-blue-50 text-blue-700 border border-blue-200/90 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60 px-2 py-0.5 rounded">
                {operacion.codigo}
              </span>
              <span className="text-[10px] text-theme-muted">
                Autogenerado SPO
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-theme-surface border border-theme-border">
            <span className="text-[10px] font-semibold uppercase text-theme-muted block mb-1">
              Estado Operativo
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
                {isActiva ? 'Vigente en catálogo' : 'Baja lógica'}
              </span>
            </div>
          </div>
        </div>

        {/* Fila 2: Descripción y Alcance */}
        <div className="p-3.5 rounded-xl bg-theme-surface border border-theme-border space-y-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-theme-muted block">
            Descripción y Alcance de la Operación
          </span>
          <p className="text-xs text-theme-main font-medium leading-relaxed whitespace-pre-wrap">
            {operacion.descripcion || (
              <span className="italic text-theme-muted">Sin descripción detallada registrada.</span>
            )}
          </p>
        </div>

        {/* Fila 3: Programa Institucional y Área Responsable */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="p-3 rounded-xl bg-theme-surface border border-theme-border">
            <span className="text-[10px] font-semibold uppercase text-theme-muted block mb-1.5 flex items-center gap-1">
              <Layers size={12} className="text-theme-muted" />
              Programa Institucional
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs bg-amber-50 text-amber-900 border border-amber-200/90 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-800/50 px-2 py-0.5 rounded shrink-0">
                {operacion.area_programa_codigo || operacion.acp_programa_codigo || 'P-01'}
              </span>
              <span className="text-xs font-semibold text-theme-main line-clamp-1">
                {operacion.area_programa_nombre || 'Programa General'}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-theme-surface border border-theme-border">
            <span className="text-[10px] font-semibold uppercase text-theme-muted block mb-1.5 flex items-center gap-1">
              <Building2 size={12} className="text-theme-muted" />
              Área / Gerencia Responsable
            </span>
            <div className="flex items-center gap-2">
              {operacion.area_codigo && (
                <span className="font-mono font-bold text-xs text-theme-main bg-theme-base px-2 py-0.5 rounded border border-theme-border shrink-0">
                  [{operacion.area_codigo}]
                </span>
              )}
              <span className="text-xs font-semibold text-theme-main line-clamp-1">
                {operacion.area_nombre || 'Área no asignada'}
              </span>
            </div>
          </div>
        </div>

        {/* Fila 4: Articulación Estratégica: ACP y AMP (PEI) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="p-3 rounded-xl bg-theme-surface border border-theme-border">
            <span className="text-[10px] font-semibold uppercase text-theme-muted block mb-1.5 flex items-center gap-1">
              <Target size={12} className="text-theme-muted" />
              Acción a Corto Plazo (ACP - POA)
            </span>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="font-mono font-bold text-xs bg-indigo-50 text-indigo-700 border border-indigo-200/90 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60 px-2 py-0.5 rounded">
                {operacion.acp_codigo || 'ACP'}
              </span>
            </div>
            <p className="text-[11px] text-theme-muted line-clamp-2">
              {operacion.acp_descripcion || 'Objetivo Anual de Gestión'}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-theme-surface border border-theme-border">
            <span className="text-[10px] font-semibold uppercase text-theme-muted block mb-1.5 flex items-center gap-1">
              <Compass size={12} className="text-theme-muted" />
              Acción a Mediano Plazo (AMP - PEI)
            </span>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="font-mono font-bold text-xs bg-violet-50 text-violet-700 border border-violet-200/90 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800/60 px-2 py-0.5 rounded">
                {operacion.amp_codigo || 'AMP'}
              </span>
            </div>
            <p className="text-[11px] text-theme-muted line-clamp-2">
              {operacion.amp_descripcion || 'Plan Estratégico Quinquenal'}
            </p>
          </div>
        </div>

        {/* Fila 5: Gestión y Modalidad Contratación */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="p-3 rounded-xl bg-theme-surface border border-theme-border">
            <span className="text-[10px] font-semibold uppercase text-theme-muted block mb-1">
              Gestión Fiscal
            </span>
            <span className="font-mono font-bold text-xs text-theme-main">
              {operacion.gestion_anio ? `Gestión ${operacion.gestion_anio}` : 'Vigente / Interanual'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-theme-surface border border-theme-border">
            <span className="text-[10px] font-semibold uppercase text-theme-muted block mb-1">
              Modalidad de Adquisición
            </span>
            <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-md border border-theme-border bg-theme-border/30 text-theme-main">
              {operacion.es_contratacion ? '✓ Aplica a Contrataciones / PAC' : 'Gasto Corriente Operativo'}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
};
