import React, { useState, useEffect, useMemo } from 'react';
import { FileCheck2 } from 'lucide-react';
import { Modal, Button, Dropdown, type DropdownItem } from '../../../components/commons';
import type { Operacion, OpFormData } from '../types/planificacion.types';
import type { Area, Programa } from '../../../types/organizacional';
import type { AccionCortoPlazo, AccionMedianoPlazo } from '../types/planificacion.types';

interface OperacionModalProps {
  isOpen: boolean;
  operacion?: Operacion | null;
  programas: Programa[];
  areas: Area[];
  acpList: AccionCortoPlazo[];
  ampList: AccionMedianoPlazo[];
  calculatedOpCode: string;
  isAprobadorOrPlanificador: boolean;
  userAreaId?: number | null;
  onClose: () => void;
  onSave: (data: OpFormData) => Promise<void>;
}

export const OperacionModal: React.FC<OperacionModalProps> = ({
  isOpen,
  operacion,
  programas,
  areas,
  acpList,
  ampList,
  calculatedOpCode,
  isAprobadorOrPlanificador,
  userAreaId,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<OpFormData>({
    programa: '',
    accion_corto_plazo: '',
    area: '',
    descripcion: '',
    es_contratacion: true,
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (operacion) {
      const progId =
        operacion.area_programa_id ||
        operacion.acp_programa_id ||
        areas.find((a) => a.id === operacion.area)?.programa;

      setFormData({
        programa: progId ? String(progId) : '',
        accion_corto_plazo: String(operacion.accion_corto_plazo),
        area: String(operacion.area),
        descripcion: operacion.descripcion || '',
        es_contratacion: operacion.es_contratacion ?? true,
      });
    } else {
      let initProg = programas[0]?.id ? String(programas[0].id) : '';
      let initArea = '';

      if (userAreaId && !isAprobadorOrPlanificador) {
        const userAreaObj = areas.find((a) => a.id === userAreaId);
        if (userAreaObj) {
          initProg = String(userAreaObj.programa);
          initArea = String(userAreaObj.id);
        }
      } else {
        const areasOfProg = areas.filter((a) => String(a.programa) === initProg && a.estado);
        initArea = areasOfProg[0]?.id ? String(areasOfProg[0].id) : '';
      }

      const acpsOfProg = acpList.filter((acp) => {
        const progId = acp.programa_id || ampList.find((m) => m.id === acp.accion_mediano_plazo)?.programa;
        return String(progId) === initProg && acp.estado;
      });
      const initAcp = acpsOfProg[0]?.id ? String(acpsOfProg[0].id) : '';

      setFormData({
        programa: initProg,
        accion_corto_plazo: initAcp,
        area: initArea,
        descripcion: '',
        es_contratacion: true,
      });
    }
  }, [operacion, isOpen, programas, areas, acpList, ampList, userAreaId, isAprobadorOrPlanificador]);

  // Available ACPs for selected Programa
  const availableAcps = useMemo(() => {
    if (!formData.programa) return [];
    return acpList.filter((acp) => {
      const progId = acp.programa_id || ampList.find((m) => m.id === acp.accion_mediano_plazo)?.programa;
      return String(progId) === String(formData.programa) && acp.estado;
    });
  }, [formData.programa, acpList, ampList]);

  // Available Areas for selected Programa
  const availableAreas = useMemo(() => {
    if (!formData.programa) return [];
    return areas.filter((area) => String(area.programa) === String(formData.programa) && area.estado);
  }, [formData.programa, areas]);

  // Dropdown Items
  const programaDropdownItems = useMemo((): DropdownItem[] => {
    return programas.map((p) => ({
      id: String(p.id),
      label: p.nombre,
      badge: p.codigo,
    }));
  }, [programas]);

  const acpDropdownItems = useMemo((): DropdownItem[] => {
    return availableAcps.map((a) => ({
      id: String(a.id),
      label: a.descripcion,
      badge: a.codigo,
      sublabel: a.amp_codigo ? `PEI: ${a.amp_codigo}` : undefined,
    }));
  }, [availableAcps]);

  const areaDropdownItems = useMemo((): DropdownItem[] => {
    return availableAreas.map((ar) => ({
      id: String(ar.id),
      label: ar.nombre,
      badge: ar.codigo,
    }));
  }, [availableAreas]);

  const handleProgramChange = (newProg: string) => {
    const acpsOfProg = acpList.filter((acp) => {
      const progId = acp.programa_id || ampList.find((m) => m.id === acp.accion_mediano_plazo)?.programa;
      return String(progId) === newProg && acp.estado;
    });
    const areasOfProg = areas.filter((a) => String(a.programa) === newProg && a.estado);

    setFormData((prev) => ({
      ...prev,
      programa: newProg,
      accion_corto_plazo: acpsOfProg[0]?.id ? String(acpsOfProg[0].id) : '',
      area: isAprobadorOrPlanificador ? (areasOfProg[0]?.id ? String(areasOfProg[0].id) : '') : prev.area,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };

  const displayCode = operacion ? operacion.codigo : calculatedOpCode;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={operacion ? 'Editar Operación Institucional' : 'Nueva Operación por Área'}
      subtitle="Defina la articulación de la operación con el Programa Institucional y la Acción a Corto Plazo"
      badge={
        <span className="font-mono font-bold text-xs bg-blue-50 text-blue-700 border border-blue-200/90 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60 px-2.5 py-1 rounded-lg">
          {displayCode}
        </span>
      }
      icon={<FileCheck2 size={20} className="text-blue-600 dark:text-blue-400" />}
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="button" variant="primary" loading={saving} onClick={handleSubmit}>
            {operacion ? 'Guardar Cambios' : 'Registrar Operación'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Paso 1: Programa Institucional */}
        <div>
          <label className="block text-xs font-semibold text-theme-main mb-1.5">
            1. Programa Institucional <span className="text-rose-500">*</span>
          </label>
          <Dropdown
            items={programaDropdownItems}
            value={formData.programa}
            onChange={(val) => handleProgramChange(String(val))}
            placeholder="Seleccione Programa Institucional..."
            searchable
            searchPlaceholder="Buscar por código o nombre..."
            size="md"
          />
          <span className="text-[10px] text-theme-muted mt-1 block">
            Eje estructural presupuestario que agrupa los objetivos
          </span>
        </div>

        {/* Paso 2: Acción a Corto Plazo (ACP) */}
        <div>
          <label className="block text-xs font-semibold text-theme-main mb-1.5">
            2. Acción a Corto Plazo (ACP - POA) <span className="text-rose-500">*</span>
          </label>
          <Dropdown
            items={acpDropdownItems}
            value={formData.accion_corto_plazo}
            onChange={(val) => setFormData((prev) => ({ ...prev, accion_corto_plazo: String(val) }))}
            placeholder={
              !formData.programa
                ? 'Primero seleccione un Programa Institucional...'
                : availableAcps.length === 0
                ? 'Sin ACPs activas en este programa'
                : 'Seleccionar Acción a Corto Plazo...'
            }
            disabled={!formData.programa}
            searchable
            searchPlaceholder="Buscar por código o descripción..."
            size="md"
          />
          <span className="text-[10px] text-theme-muted mt-1 block">
            Objetivo anual de gestión asignado al programa
          </span>
        </div>

        {/* Paso 3: Área Responsable */}
        <div>
          <label className="block text-xs font-semibold text-theme-main mb-1.5">
            3. Área / Gerencia Responsable <span className="text-rose-500">*</span>
          </label>
          <Dropdown
            items={areaDropdownItems}
            value={formData.area}
            onChange={(val) => setFormData((prev) => ({ ...prev, area: String(val) }))}
            placeholder={
              !formData.programa
                ? 'Primero seleccione un Programa Institucional...'
                : availableAreas.length === 0
                ? 'Sin áreas asignadas a este programa'
                : 'Seleccionar Área Responsable...'
            }
            disabled={!isAprobadorOrPlanificador || !formData.programa}
            searchable
            searchPlaceholder="Buscar por código o nombre de área..."
            size="md"
          />
          <span className="text-[10px] text-theme-muted mt-1 block">
            {isAprobadorOrPlanificador
              ? 'Unidad o Gerencia que ejecutará los recursos de esta operación'
              : 'Asignado a su área institucional'}
          </span>
        </div>

        {/* Paso 4: Descripción de la Operación */}
        <div>
          <label className="block text-xs font-semibold text-theme-main mb-1.5">
            4. Descripción y Alcance de la Operación
          </label>
          <textarea
            value={formData.descripcion}
            onChange={(e) => setFormData((prev) => ({ ...prev, descripcion: e.target.value }))}
            rows={3}
            placeholder="Ingrese la descripción de la operación o deje vacío para generar automáticamente con base en el área y ACP..."
            className="input-theme text-xs w-full resize-none font-medium"
          />
          <span className="text-[10px] text-theme-muted mt-1 block">
            Opcional. Si se deja en blanco, el sistema autogenerará el alcance técnico institucional.
          </span>
        </div>
      </form>
    </Modal>
  );
};
