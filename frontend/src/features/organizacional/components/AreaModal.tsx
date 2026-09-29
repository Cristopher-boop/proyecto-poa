import React, { useState, useEffect } from 'react';
import { Building2, Save } from 'lucide-react';
import { Modal, Dropdown, Button, type DropdownItem } from '../../../components/commons';
import type { Area, Programa, AreaFormValues } from '../types/organizacional.types';
import { formatProgramaShort } from '../utils/organizacionalUtils';

interface AreaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AreaFormValues) => Promise<void>;
  editingArea: Area | null;
  programas: Programa[];
}

export const AreaModal: React.FC<AreaModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingArea,
  programas,
}) => {
  const [formData, setFormData] = useState<AreaFormValues>({
    programa: '',
    codigo: '',
    nombre: '',
    tipo: 'GERENCIA',
    descripcion: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingArea) {
      setFormData({
        programa: String(editingArea.programa),
        codigo: editingArea.codigo,
        nombre: editingArea.nombre,
        tipo: editingArea.tipo,
        descripcion: editingArea.descripcion || '',
      });
    } else {
      const defaultProg = programas.length > 0 ? String(programas[0].id) : '';
      setFormData({
        programa: defaultProg,
        codigo: '',
        nombre: '',
        tipo: 'GERENCIA',
        descripcion: '',
      });
    }
  }, [editingArea, programas, isOpen]);

  const programaItems: DropdownItem[] = programas.map((p) => ({
    id: String(p.id),
    label: formatProgramaShort(p),
    badge: p.codigo,
  }));

  const tipoItems: DropdownItem[] = [
    { id: 'GERENCIA', label: 'Gerencia de Área' },
    { id: 'UNIDAD', label: 'Unidad Operativa' },
  ];

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
      title={editingArea ? 'Editar Gerencia / Unidad' : 'Nueva Gerencia / Unidad'}
      subtitle={
        editingArea
          ? `Modificando especificaciones de "${editingArea.codigo}"`
          : 'Registrar una nueva Gerencia de Área o Unidad Operativa'
      }
      icon={<Building2 className="text-theme-primary" size={20} />}
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="area-form"
            variant="primary"
            disabled={saving}
            className="flex items-center gap-1.5"
          >
            <Save size={14} />
            <span>{saving ? 'Guardando...' : editingArea ? 'Guardar Cambios' : 'Registrar'}</span>
          </Button>
        </div>
      }
    >
      <form id="area-form" onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        {/* Programa Selector */}
        <div>
          <Dropdown
            label="Programa Institucional"
            required
            items={programaItems}
            value={formData.programa}
            onChange={(val) => setFormData({ ...formData, programa: String(val) })}
            placeholder="Seleccione el Programa..."
            searchable
          />
        </div>

        {/* Tipo (Gerencia / Unidad) */}
        <div>
          <Dropdown
            label="Clasificación Institucional"
            required
            items={tipoItems}
            value={formData.tipo}
            onChange={(val) => setFormData({ ...formData, tipo: val as 'GERENCIA' | 'UNIDAD' })}
          />
        </div>

        {/* Código y Nombre */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-1">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-theme-muted mb-1.5">
              Código <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
              placeholder="Ej: GG, GAF, UAI, DAF"
              className="block w-full px-3 py-2 text-xs font-mono font-bold bg-theme-base border border-theme-border rounded-xl text-theme-main focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-500 focus:border-slate-400 dark:focus:border-slate-500 transition-all uppercase"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-theme-muted mb-1.5">
              Denominación <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Ej: Gerencia General, Unidad de Auditoría"
              className="block w-full px-3 py-2 text-xs bg-theme-base border border-theme-border rounded-xl text-theme-main focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-500 focus:border-slate-400 dark:focus:border-slate-500 transition-all"
            />
          </div>
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-theme-muted mb-1.5">
            Descripción / Funciones
          </label>
          <textarea
            rows={3}
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            placeholder="Funciones o alcance operativo..."
            className="block w-full px-3 py-2 text-xs bg-theme-base border border-theme-border rounded-xl text-theme-main focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-500 focus:border-slate-400 dark:focus:border-slate-500 transition-all resize-none"
          />
        </div>
      </form>
    </Modal>
  );
};
