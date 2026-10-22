import React from 'react';
import { XCircle, X } from 'lucide-react';
import { ModificacionPresupuestaria } from '../../../services/presupuestoService';
import { Modal, Button } from '../../../components/commons';

interface RechazarModificacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  modificacion: ModificacionPresupuestaria | null;
  motivoRechazo: string;
  onMotivoChange: (val: string) => void;
  onConfirmar: (e: React.FormEvent) => Promise<void>;
  actionLoading?: boolean;
}

export const RechazarModificacionModal: React.FC<RechazarModificacionModalProps> = ({
  isOpen,
  onClose,
  modificacion,
  motivoRechazo,
  onMotivoChange,
  onConfirmar,
  actionLoading = false,
}) => {
  if (!modificacion) return null;

  const formatMoney = (val: number | string) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB', minimumFractionDigits: 2 }).format(num || 0);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rechazar Modificación Presupuestaria"
      subtitle={`Operación ${modificacion.codigo} • Monto: ${formatMoney(modificacion.total_monto)}`}
      icon={<XCircle className="text-rose-600" size={24} />}
      size="md"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={onConfirmar}
            disabled={actionLoading || !motivoRechazo.trim()}
            loading={actionLoading}
            icon={<X size={15} />}
          >
            Confirmar Rechazo
          </Button>
        </div>
      }
    >
      <form onSubmit={onConfirmar} className="space-y-4">
        <p className="text-xs text-theme-muted">
          Indica detalladamente la observación o motivo por el cual no procede esta solicitud presupuestaria. El área
          solicitante ({modificacion.area_nombre}) recibirá esta notificación.
        </p>

        <div>
          <label className="block text-xs font-semibold uppercase text-theme-muted mb-1">
            Motivo u Observación de Rechazo *
          </label>
          <textarea
            required
            rows={4}
            value={motivoRechazo}
            onChange={(e) => onMotivoChange(e.target.value)}
            className="input-theme text-xs"
            placeholder="Escribe el motivo del rechazo..."
          />
        </div>
      </form>
    </Modal>
  );
};
