import React from 'react';
import {
  Calendar,
  Building2,
  UserCheck,
  CheckCircle2,
  FileText,
  Layers,
  Receipt,
  Edit3,
  TrendingDown,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { Modal, Button, StatusBadge } from '../../../components/commons';
import { formatMoney, formatDate } from '../../../utils/formatters';

export interface GastoDetalleData {
  id?: number;
  gasto_id?: number;
  monto_ejecutado?: string | number;
  monto?: string | number;
  fecha_gasto: string;
  comprobante_num?: string | null;
  comprobante?: string | null;
  observacion?: string | null;
  memoria?: number;
  memoria_codigo?: string;
  partida_id?: number;
  partida_codigo?: string;
  partida_nombre?: string;
  area_id?: number;
  area_nombre?: string;
  seccion_nombre?: string;
  gestion_id?: number;
  gestion_anio?: number;
  usuario_registro?: number;
  usuario_nombre?: string;
  created_at?: string;
  certificacion?: number | null;
  item_descripcion?: string;
}

interface GastoDetalleModalProps {
  isOpen: boolean;
  onClose: () => void;
  gasto: GastoDetalleData | null;
  canEdit?: boolean;
  onEdit?: (gasto: GastoDetalleData) => void;
}

export const GastoDetalleModal: React.FC<GastoDetalleModalProps> = ({
  isOpen,
  onClose,
  gasto,
  canEdit = false,
  onEdit,
}) => {
  if (!gasto) return null;

  const gastoId = gasto.id ?? gasto.gasto_id ?? 0;
  const comprobante = gasto.comprobante_num || gasto.comprobante;
  const monto = gasto.monto_ejecutado ?? gasto.monto ?? 0;
  const observacionTexto = gasto.observacion?.trim();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-bold text-base text-theme-main">
            Comprobante de Egreso
          </span>
          <span className="font-bold text-xs bg-theme-base px-2.5 py-0.5 rounded-lg border border-theme-border text-theme-main">
            {comprobante ? `Nº ${comprobante}` : `#${gastoId}`}
          </span>
          <StatusBadge
            status="EJECUTADO"
            label="Ejecutado"
            size="sm"
          />
        </div>
      }
      subtitle={`Imputación presupuestaria contable • Gestión Fiscal ${gasto.gestion_anio || 'Actual'}`}
      icon={<Receipt className="text-theme-primary" size={24} />}
      size="2xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-theme-muted font-medium">
            {gasto.created_at ? (
              <span>
                Registrado el: <strong className="text-theme-main font-semibold">{new Date(gasto.created_at).toLocaleString('es-BO')}</strong>
              </span>
            ) : (
              <span>
                Transacción registrada en el sistema #{gastoId || 'S/N'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cerrar
            </Button>

            {canEdit && onEdit && (
              <Button
                variant="primary"
                onClick={() => onEdit(gasto)}
                icon={<Edit3 size={15} />}
              >
                Editar Gasto
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-xs font-sans">
        {/* 1. Tarjeta Hero: Importe Imputado + Identificadores Rápidos */}
        <div className="p-4 sm:p-5 rounded-2xl border border-theme-border bg-theme-surface flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-theme-muted font-bold text-[10px] uppercase tracking-wider">
              <TrendingDown size={13} className="text-rose-500" />
              <span>Importe Total Imputado</span>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold font-mono text-rose-600 dark:text-rose-400 tracking-tight">
              {formatMoney(monto)}
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5 pt-0.5">
              <CheckCircle2 size={12} />
              <span>Deducido del saldo disponible de la memoria de cálculo</span>
            </p>
          </div>

          {/* Pastillas de Referencia con tipografía uniforme y armonía visual */}
          <div className="flex sm:flex-col items-start sm:items-end gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl bg-theme-base border border-theme-border text-theme-main shadow-xs">
              <Calendar size={13} className="text-theme-primary shrink-0" />
              <span>{formatDate(gasto.fecha_gasto)}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl bg-theme-base border border-theme-border text-theme-muted shadow-xs">
              <Clock size={13} className="text-theme-muted shrink-0" />
              <span>Gestión {gasto.gestion_anio || 'Actual'}</span>
            </span>
          </div>
        </div>

        {/* 2. Dos Columnas: Imputación Presupuestaria (POA) + Origen Organizacional */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Bloque Izquierdo: Imputación Presupuestaria */}
          <div className="p-4 rounded-2xl border border-theme-border bg-theme-surface space-y-3 shadow-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-theme-border/60">
              <div className="p-1.5 rounded-lg bg-theme-primary/10 text-theme-primary">
                <Layers size={14} />
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-theme-main">
                Imputación Presupuestaria
              </h4>
            </div>

            {/* Partida */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase text-theme-muted block">
                Partida de Gasto
              </span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-theme-primary bg-theme-primary/10 border border-theme-primary/20 px-2.5 py-1 rounded-lg shrink-0">
                  {gasto.partida_codigo || 'S/P'}
                </span>
                <span className="font-semibold text-xs text-theme-main line-clamp-1" title={gasto.partida_nombre || ''}>
                  {gasto.partida_nombre || 'Sin denominación de partida'}
                </span>
              </div>
            </div>

            {/* Memoria de Cálculo */}
            <div className="space-y-1 pt-2.5 border-t border-theme-border/50">
              <span className="text-[10px] font-bold uppercase text-theme-muted block">
                Memoria de Cálculo (POA)
              </span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-theme-main bg-theme-base border border-theme-border px-2.5 py-1 rounded-lg shrink-0">
                  {gasto.memoria_codigo ? `POA: ${gasto.memoria_codigo}` : 'Sin Memoria Directa'}
                </span>
                <span className="text-xs text-theme-muted truncate" title={gasto.item_descripcion || 'Gasto Imputado a la Asignación'}>
                  {gasto.item_descripcion || 'Imputación presupuestaria POA'}
                </span>
              </div>
            </div>

            {/* Certificación POA vinculada si existe */}
            {gasto.certificacion ? (
              <div className="pt-2.5 border-t border-theme-border/50 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-theme-muted">
                  Certificación POA:
                </span>
                <span className="font-semibold text-xs text-theme-primary bg-theme-primary/10 border border-theme-primary/20 px-2.5 py-0.5 rounded-lg flex items-center gap-1.5">
                  <ShieldCheck size={12} />
                  <span>Nº {gasto.certificacion}</span>
                </span>
              </div>
            ) : null}
          </div>

          {/* Bloque Derecho: Origen Organizacional y Responsable */}
          <div className="p-4 rounded-2xl border border-theme-border bg-theme-surface space-y-3 shadow-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-theme-border/60">
              <div className="p-1.5 rounded-lg bg-theme-base text-theme-muted border border-theme-border">
                <Building2 size={14} />
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-theme-main">
                Origen y Responsable
              </h4>
            </div>

            {/* Área */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase text-theme-muted block">
                Área / Gerencia Solicitante
              </span>
              <p className="font-bold text-xs text-theme-main truncate" title={gasto.area_nombre || ''}>
                {gasto.area_nombre || 'Área Institucional General'}
              </p>
            </div>

            {/* Sección */}
            <div className="space-y-1 pt-2.5 border-t border-theme-border/50">
              <span className="text-[10px] font-bold uppercase text-theme-muted block">
                Sección Operativa
              </span>
              <p className="text-xs text-theme-muted font-medium truncate" title={gasto.seccion_nombre || ''}>
                {gasto.seccion_nombre || 'Sección General'}
              </p>
            </div>

            {/* Usuario de Registro */}
            <div className="space-y-1 pt-2.5 border-t border-theme-border/50">
              <span className="text-[10px] font-bold uppercase text-theme-muted block">
                Registrado por
              </span>
              <div className="flex items-center gap-1.5 text-xs text-theme-main font-semibold">
                <UserCheck size={13} className="text-theme-primary shrink-0" />
                <span className="truncate">{gasto.usuario_nombre || 'Sistema Institucional'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Bloque Completo: Concepto y Justificación del Gasto */}
        <div className="p-4 rounded-2xl border border-theme-border bg-theme-surface space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between pb-1.5 border-b border-theme-border/50">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-theme-main">
              <FileText size={14} className="text-theme-primary" />
              <span>Concepto y Justificación del Gasto</span>
            </div>
            {observacionTexto && (
              <span className="text-[10px] font-medium text-theme-muted">
                {observacionTexto.length} caracteres
              </span>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-theme-base/50 border border-theme-border/60">
            <p className="text-xs text-theme-main leading-relaxed whitespace-pre-wrap font-sans">
              {observacionTexto || 'Sin observación o concepto detallado registrado para esta transacción.'}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
