import React, { useState, useEffect } from 'react';
import { Layers3, Save } from 'lucide-react';
import { Modal, Dropdown, Button, type DropdownItem } from '../../../components/commons';
import type { Seccion, Area, SeccionFormValues } from '../types/organizacional.types';

interface SeccionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SeccionFormValues) => Promise<void>;
  editingSeccion: Seccion | null;
  areas: Area[];
}

export const SeccionModal: React.FC<SeccionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingSeccion,
  areas,
}) => {
  const [formData, setFormData] = useState<SeccionFormValues>({
    area: '',
    nombre: '',
    descripcion: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingSeccion) {
      setFormData({
        area: String(editingSeccion.area || ''),
        nombre: editingSeccion.nombre || '',
        descripcion: editingSeccion.descripcion || '',
      });
    } else {
      const defaultArea = areas.length > 0 ? String(areas[0].id) : '';
      setFormData({
        area: defaultArea,
        nombre: '',
        descripcion: '',
      });
    }
  }, [editingSeccion, areas, isOpen]);

  const areaItems: DropdownItem[] = areas
    .filter((a) => a.estado)
    .map((a) => ({
      id: String(a.id),
      label: `${a.codigo} - ${a.nombre}`,
      badge: a.tipo === 'GERENCIA' ? 'GER' : 'UNI',
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingSeccion?.id ? 'Editar Sección Operativa' : 'Nueva Sección Operativa'}
      subtitle={
        editingSeccion?.id
          ? `Modificando detalles de "${editingSeccion.nombre}"`
          : 'Registrar una sección dependiente de una gerencia o unidad'
      }
      icon={<Layers3 className="text-theme-primary" size={20} />}
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="seccion-form"
            variant="primary"
            disabled={saving}
            className="flex items-center gap-1.5"
          >
            <Save size={14} />
            <span>{saving ? 'Guardando...' : editingSeccion?.id ? 'Guardar Cambios' : 'Registrar Sección'}</span>
          </Button>
        </div>
      }
    >
      <form id="seccion-form" onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        {/* Selector de Gerencia / Unidad */}
        <div>
          <Dropdown
            label="Gerencia / Unidad Dependiente"
            required
            items={areaItems}
            value={formData.area}
            onChange={(val) => setFormData({ ...formData, area: String(val) })}
            placeholder="Seleccione la gerencia o unidad..."
            searchable
          />
        </div>

        {/* Nombre de la Sección */}
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-theme-muted mb-1.5">
            Nombre de la Sección <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            placeholder="Ej: Sección Contabilidad, Unidad Legal"
            className="block w-full px-3 py-2 text-xs bg-theme-base border border-theme-border rounded-xl text-theme-main focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-500 focus:border-slate-400 dark:focus:border-slate-500 transition-all"
          />
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-theme-muted mb-1.5">
            Descripción / Alcance Operativo
          </label>
          <textarea
            rows={3}
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            placeholder="Descripción de tareas u objetivo de la sección..."
            className="block w-full px-3 py-2 text-xs bg-theme-base border border-theme-border rounded-xl text-theme-main focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-500 focus:border-slate-400 dark:focus:border-slate-500 transition-all resize-none"
          />
        </div>
      </form>
    </Modal>
  );
};
