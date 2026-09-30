import React from 'react';
import { Plus } from 'lucide-react';
import { Modal } from '../../../components/commons/Modal';
import { Button } from '../../../components/commons/Button';

interface NuevaGestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  nuevoAnio: number;
  onNuevoAnioChange: (anio: number) => void;
  onSubmit: (e: React.FormEvent) => void;
  actionLoading: boolean;
}

export const NuevaGestionModal: React.FC<NuevaGestionModalProps> = ({
  isOpen,
  onClose,
  nuevoAnio,
  onNuevoAnioChange,
  onSubmit,
  actionLoading,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nueva Gestión Presupuestaria"
      subtitle="Crear un nuevo año fiscal para la formulación del POA"
      icon={<Plus className="w-5 h-5 text-theme-primary" />}
      size="sm"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase text-theme-muted mb-1.5">
            Año de la Gestión
          </label>
          <input
            type="number"
            required
            min={2020}
            max={2050}
            value={nuevoAnio}
            onChange={(e) => onNuevoAnioChange(Number(e.target.value))}
            className="input-theme text-sm font-bold"
          />
          <p className="text-[11px] text-theme-muted mt-1.5">
            La nueva gestión se creará automáticamente en estado <strong>Formulación</strong>.
          </p>
        </div>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-theme-border">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={actionLoading}
          >
            Crear Gestión
          </Button>
        </div>
      </form>
    </Modal>
  );
};
