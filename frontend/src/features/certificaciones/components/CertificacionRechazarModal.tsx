import React, { useState } from 'react';
import { AlertTriangle, XCircle, Ban, Send } from 'lucide-react';
import { Modal, Button } from '../../../components/commons';
import { CertificacionPOA } from '../../../types/certificacion';

export type ModoRechazo = 'rechazar_planificacion' | 'denegar_presupuestos' | 'cancelar_gerente';

interface CertificacionRechazarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (motivo: string) => Promise<void>;
  certificacion: CertificacionPOA | null;
  modo: ModoRechazo;
}

export const CertificacionRechazarModal: React.FC<CertificacionRechazarModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  certificacion,
  modo,
}) => {
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!certificacion) return null;

  const isCancelar = modo === 'cancelar_gerente';
  const isPlanif = modo === 'rechazar_planificacion';

  const titulo = isCancelar
    ? 'Cancelar Solicitud de Gasto'
    : isPlanif
    ? 'Rechazar Solicitud de Certificación POA (Planificación)'
    : 'Denegar Visto Bueno Financiero (Presupuestos)';

  const subtituloUnidad = isCancelar
    ? 'Gerencia Solicitante'
    : isPlanif
    ? 'Unidad de Planificación'
    : 'Unidad de Presupuestos';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const texto = motivo.trim();
    if (!isCancelar && !texto) {
      setError('El motivo del rechazo o denegación es obligatorio.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await onSubmit(texto);
      setMotivo('');
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Error al procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={titulo}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Banner de Advertencia Institucional */}
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-800 dark:text-rose-300 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-rose-600 dark:text-rose-400">
            {isCancelar ? <Ban size={15} /> : <XCircle size={15} />}
            <span>{subtituloUnidad} — Acción Irreversible</span>
          </div>
          <p>
            <strong>Área:</strong> {certificacion.area_nombre} &bull;{' '}
            <strong>Hoja de Ruta:</strong> {certificacion.hoja_ruta}
          </p>
          <p className="text-[11px] text-rose-700/80 dark:text-rose-400/80">
            {isCancelar
              ? 'Al cancelar la solicitud, pasará a estado ANULADO y quedará archivada sin opción a continuar el trámite.'
              : isPlanif
              ? 'Se notificará formalmente a la Gerencia solicitante y a la Unidad de Presupuestos del rechazo técnico de esta solicitud.'
              : 'Se notificará formalmente a la Gerencia solicitante y a la Unidad de Planificación de la denegación financiera de esta certificación.'}
          </p>
        </div>

        {/* Campo de Motivo */}
        <div>
          <label className="block text-xs font-semibold text-theme-main mb-1.5">
            {isCancelar ? 'Motivo de Cancelación (Opcional)' : 'Motivo / Causa del Rechazo'}{' '}
            {!isCancelar && <span className="text-rose-500">*</span>}
          </label>
          <textarea
            value={motivo}
            onChange={(e) => {
              setMotivo(e.target.value);
              if (error) setError(null);
            }}
            placeholder={
              isCancelar
                ? 'Indique si lo desea la razón por la que se da de baja la solicitud...'
                : isPlanif
                ? 'Especifique el error detectado (ej. partida presupuestaria mal asignada, gasto no programado en el POA, etc.)...'
                : 'Especifique el motivo de la denegación (ej. falta de techo disponible en la partida, inviabilidad financiera, etc.)...'
            }
            rows={4}
            className="w-full px-3 py-2 text-sm rounded-xl border border-theme-border bg-theme-base text-theme-main placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition"
            required={!isCancelar}
          />
          {error && (
            <p className="text-xs text-rose-500 dark:text-rose-400 mt-1 font-medium">{error}</p>
          )}
        </div>

        {/* Botones de Acción */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-theme-border">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={loading}
          >
            Volver
          </Button>
          <Button
            type="submit"
            variant="danger"
            loading={loading}
            icon={isCancelar ? <Ban size={15} /> : <XCircle size={15} />}
          >
            {isCancelar ? 'Confirmar Cancelación' : 'Confirmar Rechazo'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
