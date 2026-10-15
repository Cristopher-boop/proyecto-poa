import React, { useState } from 'react';
import {
  Coins,
  AlertCircle,
  CheckCircle2,
  Building2,
  Calendar,
  Wallet,
  ShieldCheck,
  FileText,
  Hash,
  Layers,
  Sparkles,
} from 'lucide-react';
import { CertificacionPOA } from '../../../types/certificacion';
import { Modal, Button } from '../../../components/commons';
import alertService from '../../../utils/alerts';

interface CertificacionPresupuestosModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificacion: CertificacionPOA | null;
  onAprobar: (observacion?: string) => Promise<void>;
  onObservar: () => void;
  onRechazar?: () => void;
}

export const CertificacionPresupuestosModal: React.FC<CertificacionPresupuestosModalProps> = ({
  isOpen,
  onClose,
  certificacion,
  onAprobar,
  onObservar,
  onRechazar,
}) => {
  const [checkCertificado, setCheckCertificado] = useState<boolean>(false);
  const [checkFondos, setCheckFondos] = useState<boolean>(false);
  const [observacion, setObservacion] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!certificacion) return null;

  const montoSol = Number(certificacion.monto_solicitado) || 0;
  const saldoDisp = Number(certificacion.memoria_saldo_disponible) || 0;
  const saldoRestante = Math.max(0, saldoDisp - montoSol);
  const tieneMemoria = Boolean(certificacion.memoria);
  const fondosSuficientes = !tieneMemoria || saldoDisp >= montoSol;

  const handleConfirmAprobar = async () => {
    if (!checkCertificado || !checkFondos) {
      setError('Debe completar el doble chequeo (validar la certificación y verificar los fondos) antes de aprobar.');
      return;
    }

    const confirm = await alertService.confirm({
      title: '¿Otorgar Visto Bueno Financiero Definitivo?',
      text: `Se aprobará formalmente la Certificación POA "${certificacion.codigo_certificacion || certificacion.hoja_ruta}" para la ejecución del gasto por Bs. ${montoSol.toLocaleString('es-BO', { minimumFractionDigits: 2 })}.`,
      confirmButtonText: 'Sí, aprobar definitivamente',
      cancelButtonText: 'Cancelar',
      icon: 'question',
    });
    if (!confirm) return;

    setError(null);
    setLoading(true);
    try {
      await onAprobar(observacion.trim());
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Error al aprobar la certificación en Presupuestos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Doble Control y Visto Bueno Financiero — Unidad de Presupuestos"
      size="xl"
    >
      <div className="space-y-6">
        {/* Banner Institucional del Double Check */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-theme-main space-y-1">
          <div className="flex items-center gap-2 font-bold text-xs text-amber-600 dark:text-amber-400">
            <Coins size={18} />
            <span>Double Check Presupuestario y Financiero ("El Okey en cuestión de plata")</span>
          </div>
          <p className="text-xs text-theme-muted leading-relaxed">
            Presupuestos realiza la segunda verificación formal: valida que los datos y códigos del certificado emitido por Planificación sean correctos, y comprueba la disponibilidad financiera en la partida y memoria de cálculo antes de la aprobación definitiva.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* ── ENCABEZADO CON LOS 2 CÓDIGOS OFICIALES DE LA CERTIFICACIÓN ─────────── */}
        <div className="p-4 rounded-2xl bg-theme-surface border border-theme-border shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-theme-border pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-theme-primary/15 text-theme-primary">
                <Hash size={16} />
              </span>
              <h5 className="text-xs font-bold text-theme-main">
                Identificación de la Certificación Emitida por Planificación
              </h5>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-theme-primary/15 text-theme-primary font-mono">
              {certificacion.area_codigo} &bull; {certificacion.area_nombre}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-2.5 rounded-xl bg-theme-base border border-theme-border">
              <span className="text-theme-muted text-[10px] uppercase font-semibold block">
                1. Nº Certificación POA (Global)
              </span>
              <strong className="text-indigo-700 dark:text-indigo-300 font-mono text-xs block truncate" title={certificacion.codigo_certificacion}>
                {certificacion.codigo_certificacion || 'PENDIENTE / S.N.'}
              </strong>
            </div>

            <div className="p-2.5 rounded-xl bg-theme-base border border-theme-border">
              <span className="text-theme-muted text-[10px] uppercase font-semibold block">
                2. Nº Oficio Solicitud (Gerencia)
              </span>
              <strong className="text-theme-main font-mono text-xs block truncate" title={certificacion.numero_oficio_solicitud}>
                {certificacion.numero_oficio_solicitud || 'PENDIENTE / S.N.'}
              </strong>
            </div>

            <div className="p-2.5 rounded-xl bg-theme-base border border-theme-border">
              <span className="text-theme-muted text-[10px] uppercase font-semibold block">
                Hoja de Ruta / CITE
              </span>
              <strong className="text-theme-main font-mono text-xs block truncate" title={certificacion.hoja_ruta}>
                {certificacion.hoja_ruta}
              </strong>
            </div>
          </div>
        </div>

        {/* ── PARTE 1: DOUBLE CHECK DEL CERTIFICADO Y OPERACIONES POA ───────────── */}
        <div className="p-4 rounded-2xl bg-theme-surface border border-theme-border shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-theme-primary/15 text-theme-primary">
                <ShieldCheck size={16} />
              </span>
              <h5 className="text-xs font-bold text-theme-main">
                Control 1: Revisión de la Certificación y Articulación POA
              </h5>
            </div>
            <span className="text-xs text-theme-muted font-mono">
              {certificacion.operaciones_detalle?.length || 0} operación(es)
            </span>
          </div>

          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {(certificacion.operaciones_detalle || []).map((op) => (
              <div
                key={op.id}
                className="p-2.5 rounded-xl bg-theme-base border border-theme-border text-xs flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-theme-primary font-mono text-xs">
                    {op.codigo}
                  </span>
                  {op.acp_codigo && (
                    <span className="px-1.5 py-0.5 rounded bg-theme-surface border border-theme-border text-theme-main text-[11px] font-mono font-semibold">
                      ACP: {op.acp_codigo}
                    </span>
                  )}
                  {op.amp_codigo && (
                    <span className="px-1.5 py-0.5 rounded bg-theme-surface border border-theme-border text-theme-muted text-[11px] font-mono">
                      PEE: {op.amp_codigo}
                    </span>
                  )}
                </div>
                <span className="text-xs text-theme-main truncate max-w-sm" title={op.descripcion}>
                  {op.descripcion}
                </span>
              </div>
            ))}
          </div>

          {certificacion.observacion_planificacion && (
            <div className="p-3 rounded-xl bg-theme-base border border-theme-border text-xs">
              <span className="text-theme-muted text-[10px] uppercase font-semibold block mb-0.5">
                Dictamen Técnico emitido por Planificación
              </span>
              <p className="text-theme-main leading-relaxed">
                {certificacion.observacion_planificacion}
              </p>
            </div>
          )}

          {/* Check de validación del certificado */}
          <label
            onClick={() => setCheckCertificado(!checkCertificado)}
            className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-3 select-none ${
              checkCertificado
                ? 'bg-emerald-500/10 border-emerald-500/40 text-theme-main font-medium shadow-xs'
                : 'bg-theme-base border-theme-border hover:border-theme-primary/40 text-theme-muted'
            }`}
          >
            <input
              type="checkbox"
              checked={checkCertificado}
              onChange={() => {}}
              className="mt-0.5 rounded text-theme-primary focus:ring-0 cursor-pointer"
            />
            <div className="leading-snug">
              <strong className="text-theme-main block font-bold">
                Double Check del Certificado Realizado
              </strong>
              <span className="text-[11px] text-theme-muted">
                He comprobado que la Certificación POA emitida por Planificación cuenta con los dos códigos oficiales y la correlación estratégica correcta.
              </span>
            </div>
          </label>
        </div>

        {/* ── PARTE 2: DOUBLE CHECK DE FONDOS Y PARTIDA FINANCIERA ───────────────── */}
        <div className="p-4 rounded-2xl bg-theme-surface border border-theme-border shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <Coins size={16} />
              </span>
              <h5 className="text-xs font-bold text-theme-main">
                Control 2: Verificación de Dinero y Partida Presupuestaria
              </h5>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-theme-base border border-theme-border">
              <span className="text-theme-muted text-[10px] uppercase font-semibold block">
                Partida Imputada
              </span>
              <strong className="text-theme-main font-mono text-xs block">
                {certificacion.partida_codigo || '---'}
              </strong>
              <span className="text-[11px] text-theme-muted truncate block">
                {certificacion.partida_nombre || certificacion.partida_literal || 'Partida general'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-theme-base border border-theme-border">
              <span className="text-theme-muted text-[10px] uppercase font-semibold block">
                Monto del Gasto a Comprometer
              </span>
              <strong className="text-theme-main font-mono text-sm block">
                Bs. {montoSol.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
              </strong>
            </div>

            <div className={`p-3 rounded-xl border ${
              fondosSuficientes
                ? 'bg-theme-base border-theme-border'
                : 'bg-rose-500/10 border-rose-500/30'
            }`}>
              <span className="text-theme-muted text-[10px] uppercase font-semibold block">
                Saldo Disponible en Memoria
              </span>
              <strong className={`font-mono text-sm block ${fondosSuficientes ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                Bs. {saldoDisp.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
              </strong>
            </div>
          </div>

          {/* Check de validación financiera */}
          <label
            onClick={() => setCheckFondos(!checkFondos)}
            className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-3 select-none ${
              checkFondos
                ? 'bg-emerald-500/10 border-emerald-500/40 text-theme-main font-medium shadow-xs'
                : 'bg-theme-base border-theme-border hover:border-theme-primary/40 text-theme-muted'
            }`}
          >
            <input
              type="checkbox"
              checked={checkFondos}
              onChange={() => {}}
              className="mt-0.5 rounded text-theme-primary focus:ring-0 cursor-pointer"
            />
            <div className="leading-snug">
              <strong className="text-theme-main block font-bold">
                Solvencia Presupuestaria y Fondos Verificados ("Okey de Plata")
              </strong>
              <span className="text-[11px] text-theme-muted">
                Confirmo que la partida cuenta con recursos disponibles y autorizo el compromiso financiero definitivo de la certificación.
              </span>
            </div>
          </label>
        </div>

        {/* Observación de Presupuestos (opcional) */}
        <div>
          <label className="block text-xs font-bold text-theme-main mb-1">
            Observación / Nota Presupuestaria de Aprobación (Opcional)
          </label>
          <textarea
            rows={2}
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
            placeholder="Aprobado financieramente conforme al clasificador presupuestario y techo asignado..."
            className="w-full bg-theme-base border border-theme-border rounded-xl p-3 text-xs text-theme-main placeholder:text-theme-muted focus:outline-none focus:ring-1 focus:ring-theme-primary"
          />
        </div>

        {/* Acciones del pie del modal */}
        <div className="flex items-center justify-between pt-2 border-t border-theme-border">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onObservar}>
              Devolver con Observación
            </Button>
            {onRechazar && (
              <Button variant="danger" size="sm" onClick={onRechazar}>
                Denegar / Rechazar
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <Button variant="ghost" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>

            <Button
              variant="primary"
              disabled={!checkCertificado || !checkFondos || !fondosSuficientes}
              loading={loading}
              onClick={handleConfirmAprobar}
              icon={<Coins size={16} />}
            >
              Otorgar Visto Bueno y Aprobar
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
