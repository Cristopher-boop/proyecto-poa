import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Save } from 'lucide-react';
import { Modal, Button, Dropdown, type DropdownItem } from '../../../components/commons';
import { partidasApi } from '../api/partidasApi';
import type { Partida, PartidaFormData, ClasePartida } from '../types/partidas.types';
import alertService from '../../../utils/alerts';

interface PartidaModalProps {
  isOpen: boolean;
  partida?: Partida | null;
  onClose: () => void;
  onSave: () => void;
}

export const PartidaModal: React.FC<PartidaModalProps> = ({
  isOpen,
  partida,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<PartidaFormData>({
    codigo: '',
    nombre: '',
    clase: 'EGRESO',
    descripcion: '',
    estado: true,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (partida) {
      setFormData({
        codigo: partida.codigo || '',
        nombre: partida.nombre || '',
        clase: partida.clase || 'EGRESO',
        descripcion: partida.descripcion || '',
        estado: partida.estado ?? true,
      });
    } else {
      setFormData({
        codigo: '',
        nombre: '',
        clase: 'EGRESO',
        descripcion: '',
        estado: true,
      });
    }
  }, [partida, isOpen]);

  const claseItems: DropdownItem[] = [
    { id: 'EGRESO', label: 'Egreso (Gasto Operativo / Inversión)', badge: 'EGR' },
    { id: 'INGRESO', label: 'Ingreso (Recurso Institucional)', badge: 'ING' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (partida) {
        await partidasApi.updatePartida(partida.id, formData);
        alertService.success(
          'Partida actualizada',
          `La partida "${formData.codigo} - ${formData.nombre}" se guardó correctamente.`
        );
      } else {
        await partidasApi.createPartida(formData);
        alertService.success(
          'Partida registrada',
          `La partida "${formData.codigo} - ${formData.nombre}" fue creada exitosamente.`
        );
      }

      onSave();
      onClose();
    } catch (error: any) {
      console.error('Error al guardar la partida:', error);
      alertService.error(
        'No se pudo guardar la partida',
        error?.response?.data?.codigo?.[0] ||
          error?.response?.data?.nombre?.[0] ||
          error?.response?.data?.detail ||
          'Verifique que el código no esté duplicado y los campos sean válidos.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={partida ? 'Editar Partida Presupuestaria' : 'Nueva Partida Presupuestaria'}
      subtitle={
        partida
          ? `Modificando especificaciones de la partida "${partida.codigo}"`
          : 'Ingrese los datos técnicos para dar de alta la partida en el clasificador'
      }
      icon={<FileSpreadsheet size={20} className="text-theme-primary" />}
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="partida-form"
            variant="primary"
            loading={loading}
            className="flex items-center gap-1.5"
          >
            <Save size={14} />
            <span>{partida ? 'Guardar Cambios' : 'Registrar Partida'}</span>
          </Button>
        </div>
      }
    >
      <form id="partida-form" onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Código */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-theme-muted mb-1.5">
              Código de Partida <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.codigo}
              onChange={(e) => setFormData((prev) => ({ ...prev, codigo: e.target.value.trim() }))}
              required
              className="block w-full px-3 py-2 text-xs font-mono font-bold bg-theme-base border border-theme-border rounded-xl text-theme-main focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-500 focus:border-slate-400 dark:focus:border-slate-500 transition-all uppercase"
              placeholder="Ej: 11100, 22100, 31100"
              autoFocus={!partida}
            />
            <span className="text-[10px] text-theme-muted mt-1 block">
              Código clasificador numérico oficial
            </span>
          </div>

          {/* Clase con Dropdown de commons */}
          <div>
            <Dropdown
              label="Flujo Presupuestario"
              required
              items={claseItems}
              value={formData.clase}
              onChange={(val) => setFormData((prev) => ({ ...prev, clase: val as ClasePartida }))}
            />
          </div>
        </div>

        {/* Nombre / Denominación */}
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-theme-muted mb-1.5">
            Denominación Oficial <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={formData.nombre}
            onChange={(e) => setFormData((prev) => ({ ...prev, nombre: e.target.value }))}
            required
            className="block w-full px-3 py-2 text-xs bg-theme-base border border-theme-border rounded-xl text-theme-main focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-500 focus:border-slate-400 dark:focus:border-slate-500 transition-all"
            placeholder="Ej: Sueldos y Salarios, Pasajes al Interior del País..."
          />
        </div>

        {/* Descripción / Alcance */}
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-theme-muted mb-1.5">
            Descripción y Alcance del Gasto
          </label>
          <textarea
            value={formData.descripcion}
            onChange={(e) => setFormData((prev) => ({ ...prev, descripcion: e.target.value }))}
            rows={3}
            className="block w-full px-3 py-2 text-xs bg-theme-base border border-theme-border rounded-xl text-theme-main focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-500 focus:border-slate-400 dark:focus:border-slate-500 transition-all resize-none"
            placeholder="Detalle o conceptos que pueden imputarse técnicamente a esta partida..."
          />
        </div>
      </form>
    </Modal>
  );
};
