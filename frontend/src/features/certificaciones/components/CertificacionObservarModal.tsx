import React, { useState } from 'react';
import { AlertCircle, Send, X } from 'lucide-react';
import { Modal, Button } from '../../../components/commons';

interface CertificacionObservarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (motivo: string) => Promise<void>;
  solicitudInfo?: {
    hojaRuta: string;
    areaNombre: string;
    monto: number | string;
    origen: 'Planificación' | 'Presupuestos';
  };
}

export const CertificacionObservarModal: React.FC<CertificacionObservarModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  solicitudInfo,
}) => {
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const texto = motivo.trim();
    if (!texto) {
      setError('El motivo u observación es obligatorio para devolver la solicitud.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onSubmit(texto);
      setMotivo('');
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Error al registrar la observación.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Observar Solicitud de Certificación (${solicitudInfo?.origen || 'Revisión'})`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {solicitudInfo && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold">
              <AlertCircle size={14} className="shrink-0 text-amber-600 dark:text-amber-400" />
              <span>Devolución a la Gerencia Solicitante</span>
            </div>
            <p>
              <strong>Área:</strong> {solicitudInfo.areaNombre} &bull; <strong>Hoja de Ruta:</strong> {solicitudInfo.hojaRuta}
            </p>
            <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80">
              Al observar, la solicitud volverá al estado <strong>OBSERVADO</strong> y se notificará inmediatamente a los responsables para que subsanen las observaciones.
            </p>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Motivo / Detalle de la Observación <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={motivo}
            onChange={(e) => {
              setMotivo(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Especifique con claridad los motivos técnicos, financieros o de formato por los cuales se observa esta solicitud..."
            rows={4}
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
            required
          />
          {error && (
            <p className="text-xs text-rose-500 dark:text-rose-400 mt-1 font-medium">{error}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="danger"
            loading={loading}
            icon={<AlertCircle size={15} />}
          >
            Confirmar Observación y Devolver
          </Button>
        </div>
      </form>
    </Modal>
  );
};
