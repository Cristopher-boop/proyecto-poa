import React from 'react';
import {
  ArrowRightLeft,
  Calendar,
  Building2,
  UserCheck,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Layers,
  Check,
  X,
  ShieldCheck,
} from 'lucide-react';
import { ModificacionPresupuestaria } from '../../../services/presupuestoService';
import { Modal, Button, StatusBadge } from '../../../components/commons';

interface ModificacionDetalleModalProps {
  isOpen: boolean;
  onClose: () => void;
  modificacion: ModificacionPresupuestaria | null;
  canAprobar?: boolean;
  actionLoading?: boolean;
  onAprobar?: (mod: ModificacionPresupuestaria) => void;
  onRechazar?: (mod: ModificacionPresupuestaria) => void;
}

export const ModificacionDetalleModal: React.FC<ModificacionDetalleModalProps> = ({
  isOpen,
  onClose,
  modificacion,
  canAprobar = false,
  actionLoading = false,
  onAprobar,
  onRechazar,
}) => {
  if (!modificacion) return null;

  const formatMoney = (val: number | string) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB', minimumFractionDigits: 2 }).format(num || 0);
  };

  const isPending = modificacion.estado === 'PENDIENTE_PRESUPUESTOS';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <span>Modificación Presupuestaria {modificacion.codigo}</span>
          <StatusBadge
            status={modificacion.estado}
            label={
              modificacion.estado === 'PENDIENTE_PRESUPUESTOS'
                ? 'En Espera (Presupuestos)'
                : modificacion.estado_display || modificacion.estado
            }
            size="sm"
          />
        </div>
      }
      subtitle={`Traspaso intra-área compensado • Gestión ${modificacion.gestion_anio || 'Actual'}`}
      icon={<ArrowRightLeft className="text-theme-primary" size={24} />}
      size="3xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-theme-muted font-medium">
            Fecha de registro:{' '}
            {modificacion.created_at || modificacion.fecha
              ? new Date(modificacion.created_at || modificacion.fecha).toLocaleString('es-BO')
              : 'N/A'}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cerrar
            </Button>

            {canAprobar && isPending && (
              <>
                <Button
                  variant="danger"
                  onClick={() => onRechazar && onRechazar(modificacion)}
                  disabled={actionLoading}
                  icon={<X size={15} />}
                >
                  Rechazar Solicitud
                </Button>

                <Button
                  variant="primary"
                  onClick={() => onAprobar && onAprobar(modificacion)}
                  disabled={actionLoading}
                  loading={actionLoading}
                  icon={<Check size={15} />}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Aprobar Modificación
                </Button>
              </>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Tarjetas Superiores de Información */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          {/* Tarjeta Área y Solicitante */}
          <div className="p-3.5 rounded-xl border border-theme-border bg-theme-base/40 space-y-1.5">
            <div className="flex items-center gap-1.5 text-theme-muted font-bold text-[10px] uppercase tracking-wider">
              <Building2 size={13} />
              <span>Área Solicitante</span>
            </div>
            <p className="font-bold text-theme-main text-sm">{modificacion.area_nombre || 'N/A'}</p>
            {modificacion.usuario_registro_nombre && (
              <p className="text-[11px] text-theme-muted flex items-center gap-1">
                <UserCheck size={12} className="text-theme-primary" />
                <span>Solicitado por: <strong>{modificacion.usuario_registro_nombre}</strong></span>
              </p>
            )}
          </div>

          {/* Tarjeta Importe Compensado */}
          <div className="p-3.5 rounded-xl border border-theme-border bg-theme-base/40 space-y-1.5">
            <div className="flex items-center gap-1.5 text-theme-muted font-bold text-[10px] uppercase tracking-wider">
              <ArrowRightLeft size={13} />
              <span>Importe Compensado</span>
            </div>
            <p className="font-bold text-theme-main font-mono text-base">
              {formatMoney(modificacion.total_monto)}
            </p>
            <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
              <CheckCircle2 size={12} />
              <span>Operación Cuadrada (Suma Cero)</span>
            </p>
          </div>

          {/* Tarjeta Estado / Dictamen */}
          <div className="p-3.5 rounded-xl border border-theme-border bg-theme-base/40 space-y-1.5">
            <div className="flex items-center gap-1.5 text-theme-muted font-bold text-[10px] uppercase tracking-wider">
              <ShieldCheck size={13} />
              <span>Dictamen Presupuestario</span>
            </div>
            {modificacion.estado === 'APROBADO' ? (
              <div>
                <p className="font-bold text-emerald-600">Aprobado Oficialmente</p>
                {modificacion.aprobado_por_nombre && (
                  <p className="text-[11px] text-theme-muted mt-0.5">
                    Por {modificacion.aprobado_por_nombre} el{' '}
                    {modificacion.fecha_aprobacion
                      ? new Date(modificacion.fecha_aprobacion).toLocaleDateString('es-BO')
                      : ''}
                  </p>
                )}
              </div>
            ) : modificacion.estado === 'RECHAZADO' ? (
              <div>
                <p className="font-bold text-rose-600">Solicitud Rechazada</p>
                {modificacion.aprobado_por_nombre && (
                  <p className="text-[11px] text-theme-muted mt-0.5">
                    Por {modificacion.aprobado_por_nombre}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <p className="font-bold text-amber-600">En Espera de Visto Bueno</p>
                <p className="text-[11px] text-theme-muted mt-0.5">
                  Bandeja de Presupuestos (Lic. Acha)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Motivo de Rechazo si aplica */}
        {modificacion.estado === 'RECHAZADO' && modificacion.motivo_rechazo && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs space-y-1">
            <span className="font-bold uppercase tracking-wider text-[10px] block">
              Motivo u Observación de Rechazo:
            </span>
            <p className="leading-relaxed">{modificacion.motivo_rechazo}</p>
          </div>
        )}

        {/* Justificación Técnica */}
        <div className="p-4 rounded-xl bg-theme-base/30 border border-theme-border text-xs space-y-1.5">
          <span className="font-bold text-theme-muted uppercase tracking-wider text-[10px] flex items-center gap-1.5">
            <FileText size={13} />
            <span>Justificación Técnica Institucional</span>
          </span>
          <p className="text-theme-main leading-relaxed whitespace-pre-wrap">{modificacion.motivo}</p>
        </div>

        {/* Desglose de Partidas y Memorias: Cedentes vs Receptoras */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Panel Izquierdo: Partidas Cedentes (-) */}
          <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/[0.02] shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-theme-border mb-3">
                <span className="font-bold text-rose-600 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <span>(-) Partidas Cedentes (Salida)</span>
                </span>
                <span className="text-[11px] font-mono font-bold text-rose-600">
                  Total: -{formatMoney(modificacion.total_monto)}
                </span>
              </div>

              <div className="space-y-2.5">
                {(modificacion.origenes || []).map((orig, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-theme-surface border border-rose-500/15 shadow-sm flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="font-mono font-bold text-theme-main text-xs">
                        Partida {orig.partida_codigo || 'S/P'}{' '}
                        {orig.partida_nombre ? `- ${orig.partida_nombre}` : ''}
                      </p>
                      <p className="text-[11px] text-theme-muted font-mono mt-0.5">
                        Memoria de Cálculo: <strong className="text-theme-main">{orig.memoria_codigo}</strong>
                      </p>
                    </div>

                    <span className="font-mono font-bold text-rose-600 text-sm shrink-0">
                      -{formatMoney(orig.monto)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-theme-border flex items-center justify-between text-theme-muted text-[11px]">
              <span>Cantidad de memorias cedentes:</span>
              <span className="font-bold text-theme-main">{modificacion.origenes?.length || 0}</span>
            </div>
          </div>

          {/* Panel Derecho: Partidas Receptoras (+) */}
          <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.02] shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-theme-border mb-3">
                <span className="font-bold text-emerald-600 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <span>(+) Partidas Receptoras (Ingreso)</span>
                </span>
                <span className="text-[11px] font-mono font-bold text-emerald-600">
                  Total: +{formatMoney(modificacion.total_monto)}
                </span>
              </div>

              <div className="space-y-2.5">
                {(modificacion.destinos || []).map((dest, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-theme-surface border border-emerald-500/15 shadow-sm flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="font-mono font-bold text-theme-main text-xs">
                        Partida {dest.partida_codigo || 'S/P'}{' '}
                        {dest.partida_nombre ? `- ${dest.partida_nombre}` : ''}
                      </p>
                      <p className="text-[11px] text-theme-muted font-mono mt-0.5">
                        Memoria de Cálculo: <strong className="text-theme-main">{dest.memoria_codigo}</strong>
                      </p>
                    </div>

                    <span className="font-mono font-bold text-emerald-600 text-sm shrink-0">
                      +{formatMoney(dest.monto)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-theme-border flex items-center justify-between text-theme-muted text-[11px]">
              <span>Cantidad de memorias receptoras:</span>
              <span className="font-bold text-theme-main">{modificacion.destinos?.length || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
