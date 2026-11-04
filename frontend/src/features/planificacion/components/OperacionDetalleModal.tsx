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
  const cleanAcpCode = operacion.acp_codigo || 'ACP';
  const cleanAmpCode = (operacion.amp_codigo || 'AMP').replace(/-\d+$/, '');
  const rawProg = operacion.area_programa_codigo || operacion.acp_programa_codigo || '1';
  const progNumber = rawProg.replace(/^P-?/i, '');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalle de la Operación"
      subtitle="Consulta técnica y articulación estratégica del Plan Operativo Anual (POA)"
      badge={
        <span className="font-mono font-bold text-xs text-theme-primary">
          {operacion.codigo}
        </span>
      }
      icon={<FileCheck2 size={20} className="text-theme-primary" />}
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
              <span className="font-mono font-bold text-xs text-theme-primary">
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
              <span className="italic text-theme-muted">Operación sin descripción técnica detallada.</span>
            )}
          </p>
        </div>

        {/* Fila 3: Programa Institucional y Área */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="p-3 rounded-xl bg-theme-surface border border-theme-border">
            <span className="text-[10px] font-semibold uppercase text-theme-muted block mb-1.5 flex items-center gap-1">
              <Layers size={12} className="text-theme-muted" />
              Programa Institucional
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-theme-main">
                Programa {progNumber}
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
              <span className="font-mono font-bold text-xs text-theme-primary">
                {cleanAcpCode}
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
              <span className="font-mono font-bold text-xs text-theme-primary">
                {cleanAmpCode}
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
              {operacion.gestion_anio ? `Gestión ${operacion.gestion_anio}` : 'Gestión Vigente'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-theme-surface border border-theme-border">
            <span className="text-[10px] font-semibold uppercase text-theme-muted block mb-1">
              Alcance de la Operación
            </span>
            <span
              className={`inline-block px-2.5 py-0.5 rounded-md font-mono text-[11px] font-bold border ${
                operacion.es_contratacion
                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              {operacion.es_contratacion ? 'Contrataciones y Compras' : 'Operación Regular'}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
};
