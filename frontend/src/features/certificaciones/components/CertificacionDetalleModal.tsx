import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Printer,
  ShieldCheck,
  AlertCircle,
  XCircle,
  Ban,
  CheckCircle2,
  Clock,
  Coins,
  ChevronDown,
  ChevronUp,
  Send,
} from 'lucide-react';
import { CertificacionPOA } from '../../../types/certificacion';
import { Modal, Button, StatusBadge } from '../../../components/commons';
import { CertificacionDocumentoOficial, cleanOficioSolicitud } from './CertificacionDocumentoOficial';
import alertService from '../../../utils/alerts';
import { useAuth } from '../../../hooks/useAuth';

interface CertificacionDetalleModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificacion: CertificacionPOA | null;
  canCertify?: boolean;
  canCancel?: boolean;
  onCancelRequest?: (cert: CertificacionPOA) => void;
  onCertificar?: (data: {
    codigo_certificacion?: string;
    numero_oficio_solicitud?: string;
    observacion?: string;
    categoria_programatica_codigo?: string;
    categoria_programatica?: string;
    notas?: string;
  }) => Promise<void>;
  onObservar?: (motivo: string) => Promise<void>;
  siguienteCorrelativoGlobal?: string;
  siguienteCorrelativoArea?: string;
}

export const CertificacionDetalleModal: React.FC<CertificacionDetalleModalProps> = ({
  isOpen,
  onClose,
  certificacion,
  canCertify = false,
  canCancel = false,
  onCancelRequest,
  onCertificar,
  onObservar,
  siguienteCorrelativoGlobal = '',
  siguienteCorrelativoArea = '',
}) => {
  const { user } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);

  // Estados de edición para Planificación
  const [codigoCert, setCodigoCert] = useState<string>('');
  const [oficioSolicitud, setOficioSolicitud] = useState<string>('');
  const [catProgCodigo, setCatProgCodigo] = useState<string>('210.0.0');
  const [catProgNombre, setCatProgNombre] = useState<string>('');
  const [notas, setNotas] = useState<string>('');
  const [elaboradorNombre, setElaboradorNombre] = useState<string>('');
  const [elaboradorCargo, setElaboradorCargo] = useState<string>('');
  const [observacionPlanif, setObservacionPlanif] = useState<string>('');

  // Estados de acciones
  const [showObservarPanel, setShowObservarPanel] = useState<boolean>(false);
  const [motivoObservacion, setMotivoObservacion] = useState<string>('');
  const [showTrazabilidad, setShowTrazabilidad] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && certificacion) {
      setCodigoCert(
        certificacion.codigo_certificacion || siguienteCorrelativoGlobal || ''
      );
      const rawOficio =
        certificacion.numero_oficio_solicitud ||
        siguienteCorrelativoArea ||
        certificacion.hoja_ruta ||
        '';
      setOficioSolicitud(
        cleanOficioSolicitud(
          rawOficio,
          certificacion.area_codigo,
          certificacion.area_nombre
        )
      );

      const defaultProgCod =
        certificacion.categoria_programatica_codigo ||
        certificacion.operaciones_detalle?.[0]?.programa_codigo ||
        certificacion.jerarquia_resumen?.programas?.[0]?.codigo ||
        '210.0.0';
      const defaultProgNom =
        certificacion.categoria_programatica ||
        certificacion.operaciones_detalle?.[0]?.programa_nombre ||
        certificacion.jerarquia_resumen?.programas?.[0]?.nombre ||
        'Programas de Producción y/o Servicios Institucionales EPTAM';

      setCatProgCodigo(defaultProgCod);
      setCatProgNombre(defaultProgNom);
      setNotas(certificacion.notas || '');

      const userFullName = user
        ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username
        : 'Responsable de Planificación';
      setElaboradorNombre(certificacion.elaborador_nombre || userFullName);
      setElaboradorCargo(
        certificacion.elaborador_cargo || user?.cargo || 'Unidad de Planificación y Control de Gestión'
      );
      setObservacionPlanif(certificacion.observacion_planificacion || '');
      setShowObservarPanel(false);
      setMotivoObservacion('');
    }
  }, [isOpen, certificacion, siguienteCorrelativoGlobal, siguienteCorrelativoArea, user]);

  if (!certificacion) return null;

  const montoNum = Number(certificacion.monto_solicitado) || 0;
  const estado = certificacion.estado;
  const isPendientePlanif = estado === 'PENDIENTE_PLANIFICACION';
  const isAprobado = estado === 'APROBADO';

  // Flujo / Trazabilidad: cálculo de pasos
  let paso1Estado: 'completado' | 'actual' | 'error' = 'actual';
  let paso2Estado: 'pendiente' | 'actual' | 'completado' | 'error' = 'pendiente';
  let paso3Estado: 'pendiente' | 'actual' | 'completado' | 'error' = 'pendiente';

  if (estado === 'BORRADOR') {
    paso1Estado = 'actual';
  } else if (estado === 'PENDIENTE_PLANIFICACION') {
    paso1Estado = 'completado';
    paso2Estado = 'actual';
  } else if (estado === 'PENDIENTE_PRESUPUESTOS') {
    paso1Estado = 'completado';
    paso2Estado = 'completado';
    paso3Estado = 'actual';
  } else if (estado === 'APROBADO') {
    paso1Estado = 'completado';
    paso2Estado = 'completado';
    paso3Estado = 'completado';
  } else if (estado === 'OBSERVADO') {
    paso1Estado = 'completado';
    paso2Estado = certificacion.observacion_planificacion ? 'error' : 'completado';
    paso3Estado = certificacion.observacion_presupuestos ? 'error' : 'pendiente';
  } else if (estado === 'RECHAZADO') {
    paso1Estado = 'completado';
    paso2Estado = 'error';
    paso3Estado = 'error';
  } else if (estado === 'ANULADO') {
    paso1Estado = 'error';
  }

  const handlePrint = () => {
    window.print();
  };

  const handleCertificarAction = async () => {
    if (!codigoCert.trim()) {
      alertService.toast('El Nº de Certificación POA es obligatorio.', 'error');
      return;
    }
    if (!oficioSolicitud.trim()) {
      alertService.toast('El Nº de Oficio de Solicitud es obligatorio.', 'error');
      return;
    }

    const confirm = await alertService.confirm({
      title: '¿Emitir Certificación POA?',
      text: `Se emitirá oficialmente la Certificación con código "${codigoCert.trim()}". Se notificará a la Gerencia ${certificacion.area_nombre} para que recoja el certificado emitido y la solicitud pasará a Presupuestos para visto bueno financiero.`,
      confirmButtonText: 'Sí, certificar y notificar',
      cancelButtonText: 'Cancelar',
      icon: 'question',
    });
    if (!confirm) return;

    setSubmitting(true);
    try {
      if (onCertificar) {
        await onCertificar({
          codigo_certificacion: codigoCert.trim(),
          numero_oficio_solicitud: oficioSolicitud.trim(),
          observacion: observacionPlanif.trim(),
          categoria_programatica_codigo: catProgCodigo.trim(),
          categoria_programatica: catProgNombre.trim(),
          notas: notas.trim(),
        });
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      alertService.toast(err?.response?.data?.error || 'Error al emitir la certificación.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleObservarAction = async () => {
    if (!motivoObservacion.trim()) {
      alertService.toast('Debe ingresar el motivo de la observación.', 'error');
      return;
    }

    const confirm = await alertService.confirm({
      title: '¿Observar y devolver solicitud?',
      text: `La solicitud será devuelta a ${certificacion.area_nombre} para ajuste técnico con las observaciones indicadas.`,
      confirmButtonText: 'Sí, devolver con observación',
      cancelButtonText: 'Cancelar',
      isDanger: true,
    });
    if (!confirm) return;

    setSubmitting(true);
    try {
      if (onObservar) {
        await onObservar(motivoObservacion.trim());
      }
      setShowObservarPanel(false);
      onClose();
    } catch (err: any) {
      console.error(err);
      alertService.toast(err?.response?.data?.error || 'Error al observar la solicitud.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Certificación POA — ${certificacion.hoja_ruta || 'S/N'}`}
      size="xl"
    >
      <div className="space-y-5">
        {/* ── Barra Superior Informativa ─────────────────────────────────────── */}
        <div className="p-3.5 rounded-xl bg-theme-surface border border-theme-border flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            <StatusBadge status={certificacion.estado} />
            <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-theme-primary/10 text-theme-primary border border-theme-primary/20">
              {certificacion.es_contratacion ? 'Contratación POA' : 'Gasto Directo'}
            </span>
            {certificacion.memoria_codigo && (
              <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-theme-base border border-theme-border text-theme-main">
                MC: {certificacion.memoria_codigo}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-theme-muted block">
                Monto Solicitado
              </span>
              <strong className="text-sm font-extrabold font-mono text-theme-main">
                Bs. {montoNum.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
              </strong>
            </div>

            {isAprobado && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                icon={<Printer size={14} />}
                className="font-bold print:hidden"
              >
                Imprimir
              </Button>
            )}
          </div>
        </div>

        {/* ── Banner de Acción para Planificador (si está en PENDIENTE_PLANIFICACION) ── */}
        {isPendientePlanif && canCertify && (
          <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-bold text-indigo-700 dark:text-indigo-400 text-sm">
                <ShieldCheck size={18} />
                <span>Revisión de Planificación y Emisión de Certificado POA</span>
              </div>
              <span className="text-[11px] text-theme-muted">
                Valida el documento en vista previa y asigna los correlativos oficiales
              </span>
            </div>

            {/* Panel de Devolver con Observación */}
            {showObservarPanel ? (
              <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30 space-y-2.5 animate-in fade-in duration-150">
                <span className="font-bold text-amber-800 dark:text-amber-300 block text-xs">
                  Motivo de la Observación (Se devolverá a la gerencia solicitante para ajuste):
                </span>
                <textarea
                  value={motivoObservacion}
                  onChange={(e) => setMotivoObservacion(e.target.value)}
                  placeholder="Detalla qué aspectos requieren corrección (ej: error en imputación, justificación insuficiente, ajuste de especificaciones)..."
                  rows={3}
                  className="w-full text-xs p-2 rounded-lg border border-amber-300 dark:border-amber-700 bg-theme-surface focus:outline-none focus:ring-1 focus:ring-amber-500 text-theme-main"
                />
                <div className="flex items-center justify-end gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowObservarPanel(false)}
                    disabled={submitting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={handleObservarAction}
                    loading={submitting}
                    icon={<AlertCircle size={14} />}
                    className="font-bold"
                  >
                    Confirmar Observación y Devolver
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowObservarPanel(true)}
                  icon={<AlertCircle size={14} />}
                  className="text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 border-amber-500/30 font-bold"
                >
                  Observar y Devolver
                </Button>

                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleCertificarAction}
                  loading={submitting}
                  icon={<ShieldCheck size={15} />}
                  className="font-bold shadow-md shadow-theme-primary/20"
                >
                  Certificar y Notificar
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ── DOCUMENTO OFICIAL: VISTA PREVIA DIRECTA DE LA CERTIFICACIÓN POA ─── */}
        <div className="rounded-2xl overflow-hidden border border-theme-border/60 shadow-sm bg-slate-100 dark:bg-slate-900/60 p-2 sm:p-4">
          <CertificacionDocumentoOficial
            certificacion={certificacion}
            modoEdicion={isPendientePlanif && canCertify}
            valoresEdicion={{
              codigo_certificacion: codigoCert,
              numero_oficio_solicitud: oficioSolicitud,
              categoria_programatica_codigo: catProgCodigo,
              categoria_programatica: catProgNombre,
              notas: notas,
              elaborador_nombre: elaboradorNombre,
              elaborador_cargo: elaboradorCargo,
            }}
            onChangeEdicion={(fields) => {
              if (fields.codigo_certificacion !== undefined) setCodigoCert(fields.codigo_certificacion);
              if (fields.numero_oficio_solicitud !== undefined) setOficioSolicitud(fields.numero_oficio_solicitud);
              if (fields.categoria_programatica_codigo !== undefined) setCatProgCodigo(fields.categoria_programatica_codigo);
              if (fields.categoria_programatica !== undefined) setCatProgNombre(fields.categoria_programatica);
              if (fields.notas !== undefined) setNotas(fields.notas);
              if (fields.elaborador_nombre !== undefined) setElaboradorNombre(fields.elaborador_nombre);
              if (fields.elaborador_cargo !== undefined) setElaboradorCargo(fields.elaborador_cargo);
            }}
            printRef={printRef}
          />
        </div>

        {/* ── TRAZABILIDAD E HISTORIAL DEL TRÁMITE (AL FINAL DEL TODO) ────────── */}
        <div className="rounded-xl border border-theme-border bg-theme-base overflow-hidden">
          <button
            type="button"
            onClick={() => setShowTrazabilidad(!showTrazabilidad)}
            className="w-full flex items-center justify-between p-3.5 text-left text-xs font-bold text-theme-muted hover:text-theme-main transition-colors"
          >
            <div className="flex items-center gap-2">
              <Clock size={15} />
              <span>Trazabilidad del Flujo Institucional (Seguimiento del Trámite)</span>
            </div>
            {showTrazabilidad ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>

          {showTrazabilidad && (
            <div className="p-4 pt-1 space-y-3.5 border-t border-theme-border text-xs animate-in fade-in duration-150">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {/* Paso 1: Solicitud de Gerencia */}
                <div
                  className={`p-3 rounded-xl border text-xs space-y-1 ${
                    paso1Estado === 'completado'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                      : paso1Estado === 'error'
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300'
                      : 'bg-theme-surface border-theme-primary/40 text-theme-main'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    {paso1Estado === 'completado' ? (
                      <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : paso1Estado === 'error' ? (
                      <Ban size={15} className="text-rose-600 dark:text-rose-400 shrink-0" />
                    ) : (
                      <Clock size={15} className="text-theme-primary shrink-0" />
                    )}
                    <span>1. Solicitud de Gerencia</span>
                  </div>
                  <p className="text-[11px] opacity-80 truncate">
                    {certificacion.solicitante_nombre || certificacion.area_nombre}
                  </p>
                  <span className="text-[10px] font-mono opacity-70 block">
                    CITE: {certificacion.hoja_ruta}
                  </span>
                </div>

                {/* Paso 2: Planificación */}
                <div
                  className={`p-3 rounded-xl border text-xs space-y-1 ${
                    paso2Estado === 'completado'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                      : paso2Estado === 'actual'
                      ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-800 dark:text-indigo-300 ring-1 ring-indigo-500/30'
                      : paso2Estado === 'error'
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300'
                      : 'bg-theme-surface border-theme-border opacity-50 text-theme-muted'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    {paso2Estado === 'completado' ? (
                      <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : paso2Estado === 'error' ? (
                      <AlertCircle size={15} className="text-rose-600 dark:text-rose-400 shrink-0" />
                    ) : paso2Estado === 'actual' ? (
                      <Clock size={15} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                    ) : (
                      <ShieldCheck size={15} className="shrink-0" />
                    )}
                    <span>2. Certificación Técnica (Planif.)</span>
                  </div>
                  <p className="text-[11px] opacity-80 truncate">
                    {paso2Estado === 'completado'
                      ? certificacion.codigo_certificacion || 'Certificado Emitido'
                      : paso2Estado === 'actual'
                      ? 'En revisión de Planificación'
                      : paso2Estado === 'error'
                      ? 'Observada / Rechazada'
                      : 'Pendiente de turno'}
                  </p>
                  {certificacion.codigo_certificacion && (
                    <span className="text-[10px] font-mono font-bold block truncate">
                      {certificacion.codigo_certificacion}
                    </span>
                  )}
                </div>

                {/* Paso 3: Presupuestos */}
                <div
                  className={`p-3 rounded-xl border text-xs space-y-1 ${
                    paso3Estado === 'completado'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                      : paso3Estado === 'actual'
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-800 dark:text-amber-300 ring-1 ring-amber-500/30'
                      : paso3Estado === 'error'
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300'
                      : 'bg-theme-surface border-theme-border opacity-50 text-theme-muted'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    {paso3Estado === 'completado' ? (
                      <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : paso3Estado === 'error' ? (
                      <AlertCircle size={15} className="text-rose-600 dark:text-rose-400 shrink-0" />
                    ) : paso3Estado === 'actual' ? (
                      <Clock size={15} className="text-amber-600 dark:text-amber-400 shrink-0" />
                    ) : (
                      <Coins size={15} className="shrink-0" />
                    )}
                    <span>3. Visto Bueno (Presupuestos)</span>
                  </div>
                  <p className="text-[11px] opacity-80 truncate">
                    {paso3Estado === 'completado'
                      ? 'Aprobación Definitiva Otorgada'
                      : paso3Estado === 'actual'
                      ? 'En verificación de fondos'
                      : paso3Estado === 'error'
                      ? 'Observada / Denegada'
                      : 'Pendiente de visto bueno'}
                  </p>
                  {certificacion.fecha_aprobacion && (
                    <span className="text-[10px] font-mono opacity-70 block">
                      {new Date(certificacion.fecha_aprobacion).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Observaciones registradas si las hay */}
              {certificacion.observacion_planificacion && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs">
                  <strong>Observación Planificación:</strong> {certificacion.observacion_planificacion}
                </div>
              )}
              {certificacion.observacion_presupuestos && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs">
                  <strong>Observación Presupuestos:</strong> {certificacion.observacion_presupuestos}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Pie de Botones ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-2 border-t border-theme-border">
          <div>
            {canCancel &&
              (certificacion.estado === 'BORRADOR' ||
                certificacion.estado === 'OBSERVADO' ||
                certificacion.estado === 'PENDIENTE_PLANIFICACION') && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => onCancelRequest?.(certificacion)}
                  icon={<Ban size={14} />}
                >
                  Cancelar Solicitud
                </Button>
              )}
          </div>

          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
};
