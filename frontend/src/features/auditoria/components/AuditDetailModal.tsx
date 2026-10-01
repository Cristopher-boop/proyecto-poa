import React from 'react';
import { Eye, User, Calendar, Shield, Building2, Tag, FileText, CheckCircle2, Clock, Info } from 'lucide-react';
import { Modal, Button, StatusBadge } from '../../../components/commons';
import { AuditLogEntry } from '../types/auditoria.types';

interface AuditDetailModalProps {
  log: AuditLogEntry | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AuditDetailModal: React.FC<AuditDetailModalProps> = ({ log, isOpen, onClose }) => {
  if (!log) return null;

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREACIÓN':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'ELIMINACIÓN':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      case 'LOGIN':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      default:
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    }
  };

  const getModuleColor = (mod: string) => {
    switch (mod) {
      case 'MEMORIAS':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
      case 'EJECUCIÓN':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
      case 'MODIFICACIONES':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800';
      case 'CERTIFICACIONES':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800';
      case 'PRESUPUESTOS':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
      case 'AUTENTICACIÓN':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    }
  };

  const dateObj = new Date(log.action_time);
  const formattedDate = dateObj.toLocaleDateString('es-BO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = dateObj.toLocaleTimeString('es-BO', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      icon={<Eye size={20} className="text-theme-primary" />}
      title="Detalle del Evento de Auditoría"
      subtitle={`Registro institucional #${log.id} • Trazabilidad del sistema`}
      badge={
        <span
          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getActionColor(
            log.action_flag_display
          )}`}
        >
          {log.action_flag_display}
        </span>
      }
      footer={
        <div className="flex justify-end w-full">
          <Button variant="secondary" onClick={onClose}>
            Cerrar Detalle
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Cabecera del Servidor Público Responsable */}
        <div className="p-4 rounded-2xl bg-theme-surface-subtle border border-theme-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-theme-primary/10 text-theme-primary flex items-center justify-center font-bold text-base shrink-0 shadow-inner">
              {log.usuario_nombre ? log.usuario_nombre.substring(0, 2).toUpperCase() : 'SI'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-theme-main">{log.usuario_nombre}</h4>
                <span className="text-[11px] font-mono text-theme-muted">@{log.usuario_username}</span>
              </div>
              <p className="text-xs text-theme-muted mt-0.5 flex items-center gap-1.5">
                <Building2 size={13} className="shrink-0" />
                <span>{log.usuario_area || 'Administración Central'}</span>
                {log.usuario_cargo && <span>• {log.usuario_cargo}</span>}
              </p>
            </div>
          </div>

          <div className="flex sm:flex-col items-end gap-1.5 self-end sm:self-center">
            <span className="px-2.5 py-1 rounded-lg bg-theme-border/30 text-theme-main text-[11px] font-semibold border border-theme-border flex items-center gap-1">
              <Shield size={12} className="text-theme-primary" />
              {log.usuario_rol}
            </span>
            <span className="text-[10px] text-theme-muted">ID Usuario: {log.usuario_id || 'Sistema'}</span>
          </div>
        </div>

        {/* Ficha de Metadatos del Evento */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div className="p-3.5 rounded-xl border border-theme-border bg-theme-surface space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-muted flex items-center gap-1">
              <Calendar size={12} />
              Fecha y Hora de Ejecución
            </span>
            <p className="text-xs font-semibold text-theme-main capitalize">{formattedDate}</p>
            <p className="text-xs font-mono text-theme-muted flex items-center gap-1 mt-0.5">
              <Clock size={11} />
              {formattedTime}
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-theme-border bg-theme-surface space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-muted flex items-center gap-1">
              <Tag size={12} />
              Módulo y Clasificación
            </span>
            <div className="flex items-center gap-2 pt-0.5">
              <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${getModuleColor(log.modulo)}`}>
                {log.modulo}
              </span>
              <span className="text-xs text-theme-muted">Flag: {log.action_flag}</span>
            </div>
          </div>
        </div>

        {/* Objeto Afectado */}
        <div className="p-4 rounded-xl border border-theme-border bg-theme-surface space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-theme-muted flex items-center gap-1">
            <FileText size={12} />
            Objeto / Entidad Afectada
          </span>
          <p className="text-sm font-semibold font-mono text-theme-main bg-theme-surface-subtle p-2.5 rounded-lg border border-theme-border">
            {log.object_repr || 'Sin objeto específico'}
          </p>
        </div>

        {/* Mensaje de Cambio Detallado */}
        <div className="p-4 rounded-xl border border-theme-border bg-theme-surface space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-theme-muted flex items-center gap-1">
            <Info size={12} />
            Descripción Técnica del Cambio / Trazabilidad
          </span>
          <div className="p-3.5 rounded-lg bg-theme-surface-subtle border border-theme-border text-xs text-theme-main leading-relaxed font-sans whitespace-pre-wrap break-words">
            {log.change_message || 'Sin mensaje de cambio registrado en la bitácora.'}
          </div>
        </div>
      </div>
    </Modal>
  );
};
