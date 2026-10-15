import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  AlertCircle,
  CheckCircle2,
  Building2,
  Calendar,
  Layers,
  Wallet,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Hash,
  Sparkles,
  Bell,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { CertificacionPOA } from '../../../types/certificacion';
import { Modal, Button } from '../../../components/commons';
import alertService from '../../../utils/alerts';

interface CertificacionPlanificacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificacion: CertificacionPOA | null;
  onCertificar: (data: {
    codigo_certificacion?: string;
    numero_oficio_solicitud?: string;
    observacion?: string;
  }) => Promise<void>;
  onObservar: () => void;
  onRechazar?: () => void;
  siguienteCorrelativoGlobal?: string;
  siguienteCorrelativoArea?: string;
}

export const CertificacionPlanificacionModal: React.FC<CertificacionPlanificacionModalProps> = ({
  isOpen,
  onClose,
  certificacion,
  onCertificar,
  onObservar,
  onRechazar,
  siguienteCorrelativoGlobal = '',
  siguienteCorrelativoArea = '',
}) => {
  // Asistente Paso a Paso (1: Alineación ACP, 2: Fondos y Partida, 3: Emisión y Códigos)
  const [step, setStep] = useState<number>(1);

  // Validaciones de pasos
  const [alineacionConfirmada, setAlineacionConfirmada] = useState<boolean>(false);
  const [fondosConfirmados, setFondosConfirmados] = useState<boolean>(false);

  // Datos del Paso 3
  const [codigoCertificacion, setCodigoCertificacion] = useState<string>('');
  const [numeroOficioSolicitud, setNumeroOficioSolicitud] = useState<string>('');
  const [observacion, setObservacion] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && certificacion) {
      setStep(1);
      setAlineacionConfirmada(false);
      setFondosConfirmados(false);
      setCodigoCertificacion(
        certificacion.codigo_certificacion || siguienteCorrelativoGlobal || ''
      );
      setNumeroOficioSolicitud(
        certificacion.numero_oficio_solicitud || siguienteCorrelativoArea || ''
      );
      setObservacion(certificacion.observacion_planificacion || '');
      setError(null);
    }
  }, [isOpen, certificacion, siguienteCorrelativoGlobal, siguienteCorrelativoArea]);

  if (!certificacion) return null;

  const montoSol = Number(certificacion.monto_solicitado) || 0;
  const saldoDisp = Number(certificacion.memoria_saldo_disponible) || 0;
  const tieneMemoria = Boolean(certificacion.memoria);
  const saldoSuficiente = !tieneMemoria || saldoDisp >= montoSol;

  const handleConfirmCertificar = async () => {
    if (!codigoCertificacion.trim()) {
      setError('El Nº de Certificación POA (Global) es obligatorio.');
      return;
    }
    if (!numeroOficioSolicitud.trim()) {
      setError('El Nº de Oficio de Solicitud (Por Gerencia) es obligatorio.');
      return;
    }

    const confirm = await alertService.confirm({
      title: '¿Emitir Certificación POA?',
      text: `Se asignarán los códigos oficiales y se notificará a la Gerencia ${certificacion.area_nombre} para que recoja el certificado impreso. La solicitud avanzará a Presupuestos para el visto bueno financiero.`,
      confirmButtonText: 'Sí, emitir y notificar',
      cancelButtonText: 'Cancelar',
      icon: 'question',
    });
    if (!confirm) return;

    setError(null);
    setLoading(true);
    try {
      await onCertificar({
        codigo_certificacion: codigoCertificacion.trim(),
        numero_oficio_solicitud: numeroOficioSolicitud.trim(),
        observacion: observacion.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Error al emitir la certificación POA.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Asistente de Certificación POA — Unidad de Planificación"
      size="xl"
    >
      <div className="space-y-6">
        {/* ── STEPPER HEADER ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-2">
          {/* Paso 1 */}
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`p-3 rounded-xl border text-left transition-all ${
              step === 1
                ? 'bg-theme-primary/10 border-theme-primary text-theme-main shadow-xs'
                : alineacionConfirmada
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-theme-surface border-theme-border text-theme-muted hover:border-theme-primary/40'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Paso 1</span>
              {alineacionConfirmada ? (
                <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Layers size={14} />
              )}
            </div>
            <strong className="text-xs block truncate">1. Alineación POA (ACP)</strong>
          </button>

          {/* Paso 2 */}
          <button
            type="button"
            onClick={() => {
              if (alineacionConfirmada) setStep(2);
            }}
            disabled={!alineacionConfirmada}
            className={`p-3 rounded-xl border text-left transition-all ${
              step === 2
                ? 'bg-theme-primary/10 border-theme-primary text-theme-main shadow-xs'
                : fondosConfirmados
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-theme-surface border-theme-border text-theme-muted disabled:opacity-50'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Paso 2</span>
              {fondosConfirmados ? (
                <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Wallet size={14} />
              )}
            </div>
            <strong className="text-xs block truncate">2. Fondos y Partida</strong>
          </button>

          {/* Paso 3 */}
          <button
            type="button"
            onClick={() => {
              if (alineacionConfirmada && fondosConfirmados) setStep(3);
            }}
            disabled={!alineacionConfirmada || !fondosConfirmados}
            className={`p-3 rounded-xl border text-left transition-all ${
              step === 3
                ? 'bg-theme-primary/10 border-theme-primary text-theme-main shadow-xs'
                : 'bg-theme-surface border-theme-border text-theme-muted disabled:opacity-50'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Paso 3</span>
              <ShieldCheck size={14} />
            </div>
            <strong className="text-xs block truncate">3. Emisión y Códigos</strong>
          </button>
        </div>

        {/* Mensaje de Error */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* ── PASO 1: VERIFICACIÓN DE ALINEACIÓN ACP / POA ─────────────────────── */}
        {step === 1 && (
          <div className="space-y-4 animate-fadeIn">
            {/* Resumen de la Solicitud del Gerente */}
            <div className="p-4 rounded-2xl bg-theme-surface border border-theme-border shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-theme-border pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-theme-primary/15 text-theme-primary">
                    <FileText size={16} />
                  </span>
                  <div>
                    <h5 className="text-xs font-bold text-theme-main">
                      Datos de la Solicitud remitida por la Gerencia
                    </h5>
                    <span className="text-[11px] text-theme-muted">
                      Hoja de Ruta: <strong className="text-theme-main font-mono">{certificacion.hoja_ruta}</strong>
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-theme-primary/15 text-theme-primary">
                  {certificacion.area_nombre} ({certificacion.area_codigo})
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-theme-muted text-[10px] uppercase font-semibold block">
                    Solicitante
                  </span>
                  <strong className="text-theme-main">
                    {certificacion.solicitante_nombre || 'Gerente de Área'}
                  </strong>
                  <span className="text-theme-muted block text-[11px]">
                    {certificacion.solicitante_cargo || 'Cargo no especificado'}
                  </span>
                </div>
                <div>
                  <span className="text-theme-muted text-[10px] uppercase font-semibold block">
                    Monto Solicitado
                  </span>
                  <strong className="text-theme-main font-mono text-sm">
                    Bs. {montoSol.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                  </strong>
                </div>
              </div>

              <div>
                <span className="text-theme-muted text-[10px] uppercase font-semibold block mb-1">
                  Objeto / Justificación del Gasto
                </span>
                <p className="text-xs text-theme-main bg-theme-base p-3 rounded-xl border border-theme-border leading-relaxed">
                  {certificacion.concepto_gasto || 'Sin descripción ingresada.'}
                </p>
              </div>
            </div>

            {/* Operaciones POA Asociadas y Jerarquía */}
            <div className="p-4 rounded-2xl bg-theme-surface border border-theme-border shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-theme-primary/15 text-theme-primary">
                    <Layers size={16} />
                  </span>
                  <h5 className="text-xs font-bold text-theme-main">
                    Operaciones POA y Articulación Institucional
                  </h5>
                </div>
                <span className="text-xs text-theme-muted">
                  {certificacion.operaciones_detalle?.length || 0} operación(es) vinculada(s)
                </span>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {(certificacion.operaciones_detalle || []).map((op) => (
                  <div
                    key={op.id}
                    className="p-3 rounded-xl bg-theme-base border border-theme-border text-xs space-y-1.5"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-theme-primary font-mono text-xs">
                        {op.codigo}
                      </span>
                      {op.acp_codigo && (
                        <span className="px-2 py-0.5 rounded-md bg-theme-surface border border-theme-border text-theme-main font-mono font-bold text-[11px]">
                          ACP: {op.acp_codigo}
                        </span>
                      )}
                      {op.amp_codigo && (
                        <span className="px-2 py-0.5 rounded-md bg-theme-surface border border-theme-border text-theme-muted font-mono text-[11px]">
                          PEE: {op.amp_codigo}
                        </span>
                      )}
                      {op.programa_codigo && (
                        <span className="px-2 py-0.5 rounded-md bg-theme-surface border border-theme-border text-theme-muted font-mono text-[11px]">
                          Prog: {op.programa_codigo}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-theme-main leading-relaxed">
                      {op.descripcion}
                    </p>
                  </div>
                ))}
              </div>

              {/* Check de confirmación obligatoria para pasar al paso 2 */}
              <label
                onClick={() => setAlineacionConfirmada(!alineacionConfirmada)}
                className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-3 mt-3 select-none ${
                  alineacionConfirmada
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-theme-main font-medium shadow-xs'
                    : 'bg-theme-base border-theme-border hover:border-theme-primary/40 text-theme-muted'
                }`}
              >
                <input
                  type="checkbox"
                  checked={alineacionConfirmada}
                  onChange={() => {}}
                  className="mt-0.5 rounded text-theme-primary focus:ring-0 cursor-pointer"
                />
                <div className="leading-snug">
                  <strong className="text-theme-main block font-bold">
                    Validar Alineación de Operaciones de Corto Plazo (ACP / POA)
                  </strong>
                  <span className="text-[11px] text-theme-muted">
                    Confirmo como Unidad de Planificación que la solicitud se encuentra debidamente articulada a las metas operativas y acciones de corto plazo del Plan Operativo Anual.
                  </span>
                </div>
              </label>
            </div>

            {/* Acciones del Paso 1 */}
            <div className="flex items-center justify-between pt-2 border-t border-theme-border">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={onObservar}>
                  Devolver con Observación
                </Button>
                {onRechazar && (
                  <Button variant="danger" size="sm" onClick={onRechazar}>
                    Rechazar
                  </Button>
                )}
              </div>

              <Button
                variant="primary"
                disabled={!alineacionConfirmada}
                onClick={() => setStep(2)}
                icon={<ArrowRight size={16} />}
              >
                Siguiente: Verificar Fondos
              </Button>
            </div>
          </div>
        )}

        {/* ── PASO 2: VERIFICACIÓN DE FONDOS Y PARTIDA ─────────────────────────── */}
        {step === 2 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="p-4 rounded-2xl bg-theme-surface border border-theme-border shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <Wallet size={16} />
                </span>
                <h5 className="text-xs font-bold text-theme-main">
                  Verificación de Techo y Disponibilidad Presupuestaria
                </h5>
              </div>

              {/* Datos de Memoria y Partida */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-theme-base border border-theme-border space-y-1">
                  <span className="text-theme-muted text-[10px] uppercase font-semibold block">
                    Memoria de Cálculo Vinculada
                  </span>
                  <strong className="text-theme-main font-mono text-xs block">
                    {certificacion.memoria_codigo || 'Sin vinculación directa a Memoria'}
                  </strong>
                  <p className="text-[11px] text-theme-muted truncate" title={certificacion.memoria_justificacion || ''}>
                    {certificacion.memoria_justificacion || 'No especificada'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-theme-base border border-theme-border space-y-1">
                  <span className="text-theme-muted text-[10px] uppercase font-semibold block">
                    Partida Presupuestaria Imputada
                  </span>
                  <strong className="text-theme-main font-mono text-xs block">
                    Partida {certificacion.partida_codigo || '---'}
                  </strong>
                  <p className="text-[11px] text-theme-muted truncate" title={certificacion.partida_nombre || ''}>
                    {certificacion.partida_nombre || certificacion.partida_literal || 'Partida por asignar'}
                  </p>
                </div>
              </div>

              {/* Indicadores Financieros */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                <div className="p-3 rounded-xl bg-theme-base border border-theme-border">
                  <span className="text-theme-muted text-[10px] uppercase font-semibold block">
                    Monto Solicitado
                  </span>
                  <strong className="text-theme-main font-mono text-sm">
                    Bs. {montoSol.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                  </strong>
                </div>

                <div className="p-3 rounded-xl bg-theme-base border border-theme-border">
                  <span className="text-theme-muted text-[10px] uppercase font-semibold block">
                    Saldo Disponible en Memoria
                  </span>
                  <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                    Bs. {saldoDisp.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                  </strong>
                </div>

                <div className={`p-3 rounded-xl border ${
                  saldoSuficiente
                    ? 'bg-theme-base border-theme-border'
                    : 'bg-rose-500/10 border-rose-500/30'
                }`}>
                  <span className="text-theme-muted text-[10px] uppercase font-semibold block">
                    Saldo Remanente Proyectado
                  </span>
                  <strong className={`font-mono text-sm ${saldoSuficiente ? 'text-theme-main' : 'text-rose-600 font-bold'}`}>
                    Bs. {Math.max(0, saldoDisp - montoSol).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                  </strong>
                </div>
              </div>

              {!saldoSuficiente && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>
                    <strong>Atención:</strong> El monto solicitado supera el saldo disponible de la Memoria de Cálculo. Debe devolverse con observación a la gerencia para ajuste presupuestario.
                  </span>
                </div>
              )}

              {/* Check de confirmación de fondos */}
              <label
                onClick={() => setFondosConfirmados(!fondosConfirmados)}
                className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-3 mt-3 select-none ${
                  fondosConfirmados
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-theme-main font-medium shadow-xs'
                    : 'bg-theme-base border-theme-border hover:border-theme-primary/40 text-theme-muted'
                }`}
              >
                <input
                  type="checkbox"
                  checked={fondosConfirmados}
                  onChange={() => {}}
                  className="mt-0.5 rounded text-theme-primary focus:ring-0 cursor-pointer"
                />
                <div className="leading-snug">
                  <strong className="text-theme-main block font-bold">
                    Verificar Disponibilidad Presupuestaria y Respaldo Financiero
                  </strong>
                  <span className="text-[11px] text-theme-muted">
                    Confirmo que se ha revisado la partida presupuestaria y que existe saldo suficiente en la memoria vinculada para cubrir este requerimiento.
                  </span>
                </div>
              </label>
            </div>

            {/* Acciones del Paso 2 */}
            <div className="flex items-center justify-between pt-2 border-t border-theme-border">
              <Button variant="ghost" onClick={() => setStep(1)} icon={<ArrowLeft size={16} />}>
                Anterior
              </Button>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={onObservar}>
                  Devolver con Observación
                </Button>
                {onRechazar && (
                  <Button variant="danger" size="sm" onClick={onRechazar}>
                    Rechazar
                  </Button>
                )}

                <Button
                  variant="primary"
                  disabled={!fondosConfirmados || !saldoSuficiente}
                  onClick={() => setStep(3)}
                  icon={<ArrowRight size={16} />}
                >
                  Siguiente: Asignar Códigos y Emitir
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── PASO 3: EMISIÓN DE CERTIFICACIÓN Y ASIGNACIÓN DE LOS 2 CÓDIGOS ───── */}
        {step === 3 && (
          <div className="space-y-4 animate-fadeIn">
            {/* Aviso Informativo Institucional */}
            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-theme-main space-y-1">
              <div className="flex items-center gap-2 font-bold text-xs text-indigo-700 dark:text-indigo-300">
                <Bell size={15} />
                <span>Emisión Oficial y Notificación Automática</span>
              </div>
              <p className="text-xs text-theme-muted leading-relaxed">
                Al emitir esta certificación, se asignarán oficialmente los dos códigos correlativos. El sistema <strong>notificará a la Gerencia {certificacion.area_nombre}</strong> para que recoja el certificado físico, y remitirá la solicitud a la <strong>Unidad de Presupuestos</strong> para su verificación final.
              </p>
            </div>

            {/* Los 2 Códigos Oficiales */}
            <div className="p-4 rounded-2xl bg-theme-surface border border-theme-border shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-theme-primary/15 text-theme-primary">
                  <Hash size={16} />
                </span>
                <h5 className="text-xs font-bold text-theme-main">
                  Asignación Oficial de los 2 Códigos Correlativos
                </h5>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Código 1: Global General de Planificación */}
                <div>
                  <label className="block text-xs font-bold text-theme-main mb-1">
                    1. Nº Certificación POA (Global General) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={codigoCertificacion}
                    onChange={(e) => setCodigoCertificacion(e.target.value)}
                    placeholder="Ej: UPLANIF.EPTAM.CP. Nº 001/2026"
                    className="w-full bg-theme-base border border-theme-border rounded-xl px-3.5 py-2.5 text-xs text-theme-main font-bold font-mono focus:outline-none focus:ring-1 focus:ring-theme-primary uppercase"
                  />
                  <span className="text-[10px] text-theme-muted mt-1 block">
                    Correlativo propio del certificado que incrementa en general.
                  </span>
                </div>

                {/* Código 2: Correlativo por Gerencia */}
                <div>
                  <label className="block text-xs font-bold text-theme-main mb-1">
                    2. Nº Oficio de Solicitud (Por Gerencia) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={numeroOficioSolicitud}
                    onChange={(e) => setNumeroOficioSolicitud(e.target.value)}
                    placeholder="Ej: GCIA.INF.EPTAM. STRÍA Nº 001/26"
                    className="w-full bg-theme-base border border-theme-border rounded-xl px-3.5 py-2.5 text-xs text-theme-main font-bold font-mono focus:outline-none focus:ring-1 focus:ring-theme-primary uppercase"
                  />
                  <span className="text-[10px] text-theme-muted mt-1 block">
                    Correlativo propio según la gerencia solicitante.
                  </span>
                </div>
              </div>

              {/* Observación de Planificación */}
              <div>
                <label className="block text-xs font-bold text-theme-main mb-1">
                  Observación / Dictamen Técnico de Planificación (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={observacion}
                  onChange={(e) => setObservacion(e.target.value)}
                  placeholder="Alineado debidamente a las metas institucionales de la gestión..."
                  className="w-full bg-theme-base border border-theme-border rounded-xl p-3 text-xs text-theme-main placeholder:text-theme-muted focus:outline-none focus:ring-1 focus:ring-theme-primary"
                />
              </div>
            </div>

            {/* Acciones del Paso 3 */}
            <div className="flex items-center justify-between pt-2 border-t border-theme-border">
              <Button variant="ghost" onClick={() => setStep(2)} icon={<ArrowLeft size={16} />}>
                Anterior
              </Button>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={onObservar}>
                  Devolver con Observación
                </Button>
                {onRechazar && (
                  <Button variant="danger" size="sm" onClick={onRechazar}>
                    Rechazar Solicitud
                  </Button>
                )}

                <Button
                  variant="primary"
                  loading={loading}
                  onClick={handleConfirmCertificar}
                  icon={<ShieldCheck size={16} />}
                >
                  Emitir Certificación POA y Remitir a Presupuestos
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
