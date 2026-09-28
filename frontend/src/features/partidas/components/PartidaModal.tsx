import React, { useState, useEffect } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { Modal, Button } from '../../../components/commons';
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
          ? 'Modifique la información o denominación de la partida seleccionada'
          : 'Ingrese los datos técnicos para dar de alta la partida en el clasificador'
      }
      icon={<FileSpreadsheet size={20} />}
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
            type="button"
            variant="primary"
            loading={loading}
            onClick={handleSubmit}
          >
            {partida ? 'Guardar Cambios' : 'Registrar Partida'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Código */}
          <div>
            <label className="block text-xs font-semibold text-theme-main mb-1.5">
              Código de Partida <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.codigo}
              onChange={(e) => setFormData((prev) => ({ ...prev, codigo: e.target.value.trim() }))}
              required
              className="input-theme text-xs font-mono font-bold w-full"
              placeholder="Ej: 11100, 22100, 31100"
              autoFocus={!partida}
            />
            <span className="text-[10px] text-theme-muted mt-1 block">
              Código clasificador numérico oficial
            </span>
          </div>

          {/* Clase de Gasto */}
          <div>
            <label className="block text-xs font-semibold text-theme-main mb-1.5">
              Clase <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.clase}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, clase: e.target.value as ClasePartida }))
              }
              required
              className="w-full rounded-xl border border-theme-border bg-theme-surface px-3 py-2 text-xs text-theme-main focus:border-theme-primary focus:ring-1 focus:ring-theme-primary focus:outline-none transition-colors"
            >
              <option value="EGRESO">Egreso (Gasto)</option>
              <option value="INGRESO">Ingreso (Recurso)</option>
            </select>
            <span className="text-[10px] text-theme-muted mt-1 block">
              Tipo de flujo presupuestario
            </span>
          </div>
        </div>

        {/* Nombre / Denominación */}
        <div>
          <label className="block text-xs font-semibold text-theme-main mb-1.5">
            Nombre / Denominación Oficial <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={formData.nombre}
            onChange={(e) => setFormData((prev) => ({ ...prev, nombre: e.target.value }))}
            required
            className="input-theme text-xs w-full"
            placeholder="Ej: Sueldos y Salarios, Pasajes al Interior del País..."
          />
        </div>

        {/* Descripción / Alcance */}
        <div>
          <label className="block text-xs font-semibold text-theme-main mb-1.5">
            Descripción y Alcance del Gasto
          </label>
          <textarea
            value={formData.descripcion}
            onChange={(e) => setFormData((prev) => ({ ...prev, descripcion: e.target.value }))}
            rows={3}
            className="input-theme text-xs w-full resize-none"
            placeholder="Detalle o conceptos que pueden imputarse técnicamente a esta partida..."
          />
        </div>
      </form>
    </Modal>
  );
};
