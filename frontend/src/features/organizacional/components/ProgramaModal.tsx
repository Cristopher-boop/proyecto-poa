import React, { useState, useEffect } from 'react';
import { FolderTree, Save } from 'lucide-react';
import { Modal, Button } from '../../../components/commons';
import type { Programa, ProgramaFormValues } from '../types/organizacional.types';

interface ProgramaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ProgramaFormValues) => Promise<void>;
  editingPrograma: Programa | null;
}

export const ProgramaModal: React.FC<ProgramaModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingPrograma,
}) => {
  const [formData, setFormData] = useState<ProgramaFormValues>({
    codigo: '',
    nombre: '',
    descripcion: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingPrograma) {
      setFormData({
        codigo: editingPrograma.codigo,
        nombre: editingPrograma.nombre,
        descripcion: editingPrograma.descripcion || '',
      });
    } else {
      setFormData({
        codigo: '',
        nombre: '',
        descripcion: '',
      });
    }
  }, [editingPrograma, isOpen]);

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
      title={editingPrograma ? 'Editar Programa Institucional' : 'Nuevo Programa Institucional'}
      subtitle={
        editingPrograma
          ? `Modificando detalles del Programa ${editingPrograma.codigo}`
          : 'Registrar un nuevo programa presupuestario institucional'
      }
      icon={<FolderTree className="text-theme-primary" size={20} />}
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="programa-form"
            variant="primary"
            disabled={saving}
            className="flex items-center gap-1.5"
          >
            <Save size={14} />
            <span>{saving ? 'Guardando...' : editingPrograma ? 'Guardar Cambios' : 'Registrar'}</span>
          </Button>
        </div>
      }
    >
      <form id="programa-form" onSubmit={handleSubmit} className="space-y-3.5 text-xs">
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
              placeholder="Ej: 1, 10, 20, 410"
              className="block w-full px-3 py-2 text-xs font-mono font-bold bg-theme-base border border-theme-border rounded-xl text-theme-main focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-500 focus:border-slate-400 dark:focus:border-slate-500 transition-all uppercase"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-theme-muted mb-1.5">
              Nombre Oficial del Programa <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Ej: ADMINISTRACIÓN CENTRAL"
              className="block w-full px-3 py-2 text-xs bg-theme-base border border-theme-border rounded-xl text-theme-main focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-500 focus:border-slate-400 dark:focus:border-slate-500 transition-all"
            />
          </div>
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-theme-muted mb-1.5">
            Descripción / Alcance Institucional
          </label>
          <textarea
            rows={3}
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            placeholder="Objetivo o descripción del programa institucional..."
            className="block w-full px-3 py-2 text-xs bg-theme-base border border-theme-border rounded-xl text-theme-main focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-500 focus:border-slate-400 dark:focus:border-slate-500 transition-all resize-none"
          />
        </div>
      </form>
    </Modal>
  );
};
