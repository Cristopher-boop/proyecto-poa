import React, { useState, useEffect, useMemo } from 'react';
import { Target } from 'lucide-react';
import { Modal, Button, Dropdown, type DropdownItem } from '../../../components/commons';
import type { AccionCortoPlazo, AcpFormData, AccionMedianoPlazo } from '../types/planificacion.types';
import type { Programa } from '../../../types/organizacional';
import type { Gestion } from '../../../services/presupuestoService';

interface AcpModalProps {
  isOpen: boolean;
  acp?: AccionCortoPlazo | null;
  programas: Programa[];
  ampList: AccionMedianoPlazo[];
  gestiones: Gestion[];
  calculatedAcpCode: string;
  onClose: () => void;
  onSave: (data: AcpFormData) => Promise<void>;
}

export const AcpModal: React.FC<AcpModalProps> = ({
  isOpen,
  acp,
  programas,
  ampList,
  gestiones,
  calculatedAcpCode,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<AcpFormData>({
    programa: '',
    accion_mediano_plazo: '',
    gestion: '',
    descripcion: '',
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (acp) {
      const progId = acp.programa_id || ampList.find((m) => m.id === acp.accion_mediano_plazo)?.programa;
      setFormData({
        programa: progId ? String(progId) : '',
        accion_mediano_plazo: String(acp.accion_mediano_plazo),
        gestion: acp.gestion ? String(acp.gestion) : '',
        descripcion: acp.descripcion || '',
      });
    } else {
      const defaultProg = programas[0]?.id ? String(programas[0].id) : '';
      const matchingAmps = ampList.filter((a) => String(a.programa) === defaultProg && a.estado);
      const defaultAmp = matchingAmps[0]?.id ? String(matchingAmps[0].id) : '';
      const defaultGestion = gestiones[0]?.id ? String(gestiones[0].id) : '';

      setFormData({
        programa: defaultProg,
        accion_mediano_plazo: defaultAmp,
        gestion: defaultGestion,
        descripcion: '',
      });
    }
  }, [acp, isOpen, programas, ampList, gestiones]);

  // Available AMPs for selected Programa
  const availableAmps = useMemo(() => {
    if (!formData.programa) return [];
    return ampList.filter((amp) => String(amp.programa) === String(formData.programa) && amp.estado);
  }, [formData.programa, ampList]);

  // Dropdown Items
  const programaDropdownItems = useMemo((): DropdownItem[] => {
    return programas.map((p) => ({
      id: String(p.id),
      label: p.nombre,
      badge: p.codigo,
    }));
  }, [programas]);

  const ampDropdownItems = useMemo((): DropdownItem[] => {
    return availableAmps.map((a) => ({
      id: String(a.id),
      label: a.descripcion,
      badge: a.codigo,
      sublabel: `Período: ${a.periodo_inicio} - ${a.periodo_fin}`,
    }));
  }, [availableAmps]);

  const gestionDropdownItems = useMemo((): DropdownItem[] => {
    return [
      { id: '', label: 'Gestión General / Vigente' },
      ...gestiones.map((g) => ({
        id: String(g.id),
        label: `Gestión ${g.anio}`,
        badge: g.estado_display || undefined,
      })),
    ];
  }, [gestiones]);

  const handleProgramChange = (newProg: string) => {
    const matchingAmps = ampList.filter((a) => String(a.programa) === newProg && a.estado);
    setFormData((prev) => ({
      ...prev,
      programa: newProg,
      accion_mediano_plazo: matchingAmps[0]?.id ? String(matchingAmps[0].id) : '',
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

  const displayCode = acp ? acp.codigo : calculatedAcpCode;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={acp ? 'Editar Acción a Corto Plazo' : 'Nueva Acción a Corto Plazo (POA)'}
      subtitle="Defina el objetivo anual vinculado a la Acción a Mediano Plazo del PEI"
      badge={
        <span className="font-mono font-bold text-xs bg-indigo-50 text-indigo-700 border border-indigo-200/90 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60 px-2.5 py-1 rounded-lg">
          {displayCode}
        </span>
      }
      icon={<Target size={20} className="text-indigo-600 dark:text-indigo-400" />}
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="button" variant="primary" loading={saving} onClick={handleSubmit}>
            {acp ? 'Guardar Cambios' : 'Registrar ACP'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Paso 1: Programa General */}
        <div>
          <label className="block text-xs font-semibold text-theme-main mb-1.5">
            1. Programa General <span className="text-rose-500">*</span>
          </label>
          <Dropdown
            items={programaDropdownItems}
            value={formData.programa}
            onChange={(val) => handleProgramChange(String(val))}
            placeholder="Seleccione Programa..."
            searchable
            searchPlaceholder="Buscar por código o nombre..."
            size="md"
          />
        </div>

        {/* Paso 2: Acción a Mediano Plazo */}
        <div>
          <label className="block text-xs font-semibold text-theme-main mb-1.5">
            2. Acción a Mediano Plazo (AMP del Programa) <span className="text-rose-500">*</span>
          </label>
          <Dropdown
            items={ampDropdownItems}
            value={formData.accion_mediano_plazo}
            onChange={(val) => setFormData((prev) => ({ ...prev, accion_mediano_plazo: String(val) }))}
            placeholder={
              !formData.programa
                ? 'Primero seleccione un Programa...'
                : availableAmps.length === 0
                ? 'Sin AMPs en este programa'
                : 'Seleccione AMP...'
            }
            disabled={!formData.programa}
            searchable
            searchPlaceholder="Buscar por código o descripción..."
            size="md"
          />
        </div>

        {/* Paso 3: Gestión POA */}
        <div>
          <label className="block text-xs font-semibold text-theme-main mb-1.5">
            3. Gestión Fiscal POA
          </label>
          <Dropdown
            items={gestionDropdownItems}
            value={formData.gestion}
            onChange={(val) => setFormData((prev) => ({ ...prev, gestion: String(val) }))}
            placeholder="Gestión General / Vigente"
            size="md"
          />
        </div>

        {/* Paso 4: Descripción */}
        <div>
          <label className="block text-xs font-semibold text-theme-main mb-1.5">
            4. Descripción del Objetivo Anual
          </label>
          <textarea
            value={formData.descripcion}
            onChange={(e) => setFormData((prev) => ({ ...prev, descripcion: e.target.value }))}
            rows={3}
            placeholder="Ingrese la descripción de la meta o deje en blanco para autogenerar..."
            className="input-theme text-xs w-full resize-none font-medium"
          />
        </div>
      </form>
    </Modal>
  );
};
