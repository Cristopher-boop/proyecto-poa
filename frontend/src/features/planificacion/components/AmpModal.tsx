import React, { useState, useEffect, useMemo } from 'react';
import { Compass } from 'lucide-react';
import { Modal, Button, Dropdown, type DropdownItem } from '../../../components/commons';
import type { AccionMedianoPlazo, AmpFormData } from '../types/planificacion.types';
import type { Programa } from '../../../types/organizacional';

interface AmpModalProps {
  isOpen: boolean;
  amp?: AccionMedianoPlazo | null;
  programas: Programa[];
  calculatedAmpCode: string;
  onClose: () => void;
  onSave: (data: AmpFormData) => Promise<void>;
}

export const AmpModal: React.FC<AmpModalProps> = ({
  isOpen,
  amp,
  programas,
  calculatedAmpCode,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<AmpFormData>({
    programa: '',
    periodo_inicio: 2026,
    periodo_fin: 2030,
    descripcion: '',
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (amp) {
      setFormData({
        programa: String(amp.programa),
        periodo_inicio: amp.periodo_inicio,
        periodo_fin: amp.periodo_fin,
        descripcion: amp.descripcion || '',
      });
    } else {
      const defaultProg = programas[0]?.id ? String(programas[0].id) : '';
      setFormData({
        programa: defaultProg,
        periodo_inicio: 2026,
        periodo_fin: 2030,
        descripcion: '',
      });
    }
  }, [amp, isOpen, programas]);

  const programaDropdownItems = useMemo((): DropdownItem[] => {
    return programas.map((p) => ({
      id: String(p.id),
      label: p.nombre,
      badge: p.codigo,
    }));
  }, [programas]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };

  const displayCode = amp ? amp.codigo : calculatedAmpCode;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={amp ? 'Editar Acción a Mediano Plazo' : 'Nueva Acción a Mediano Plazo (PEI)'}
      subtitle="Defina el objetivo estratégico quinquenal del Plan Estratégico Institucional"
      badge={
        <span className="font-mono font-bold text-xs bg-violet-50 text-violet-700 border border-violet-200/90 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800/60 px-2.5 py-1 rounded-lg">
          {displayCode}
        </span>
      }
      icon={<Compass size={20} className="text-violet-600 dark:text-violet-400" />}
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="button" variant="primary" loading={saving} onClick={handleSubmit}>
            {amp ? 'Guardar Cambios' : 'Registrar AMP'}
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
            onChange={(val) => setFormData((prev) => ({ ...prev, programa: String(val) }))}
            placeholder="Seleccione Programa..."
            searchable
            searchPlaceholder="Buscar por código o nombre..."
            size="md"
          />
        </div>

        {/* Paso 2: Período Quinquenal */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-theme-main mb-1.5">
              Año Inicio Quinquenio <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              value={formData.periodo_inicio}
              onChange={(e) => setFormData((prev) => ({ ...prev, periodo_inicio: Number(e.target.value) }))}
              required
              className="w-full px-3 py-2 text-xs rounded-xl border border-theme-border bg-theme-surface text-theme-main focus:outline-none focus:border-theme-primary font-mono font-bold"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-theme-main mb-1.5">
              Año Fin Quinquenio <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              value={formData.periodo_fin}
              onChange={(e) => setFormData((prev) => ({ ...prev, periodo_fin: Number(e.target.value) }))}
              required
              className="w-full px-3 py-2 text-xs rounded-xl border border-theme-border bg-theme-surface text-theme-main focus:outline-none focus:border-theme-primary font-mono font-bold"
            />
          </div>
        </div>

        {/* Paso 3: Descripción */}
        <div>
          <label className="block text-xs font-semibold text-theme-main mb-1.5">
            3. Descripción del Objetivo Estratégico PEI
          </label>
          <textarea
            value={formData.descripcion}
            onChange={(e) => setFormData((prev) => ({ ...prev, descripcion: e.target.value }))}
            rows={3}
            placeholder="Ingrese la descripción del objetivo quinquenal o deje en blanco para autogenerar..."
            className="input-theme text-xs w-full resize-none font-medium"
          />
        </div>
      </form>
    </Modal>
  );
};
