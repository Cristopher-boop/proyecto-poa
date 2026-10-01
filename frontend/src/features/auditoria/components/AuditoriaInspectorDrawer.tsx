import React, { useEffect } from 'react';
import {
  X,
  User,
  Shield,
  Building2,
  Calendar,
  Clock,
  Tag,
  FileText,
  ExternalLink,
  Filter,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { AuditLogEntry } from '../types/auditoria.types';
import { Button } from '../../../components/commons';

interface AuditoriaInspectorDrawerProps {
  log: AuditLogEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onFilterByWorker: (userId: number | string) => void;
  onOpenWorkerExpediente?: (userId: number) => void;
}

export const AuditoriaInspectorDrawer: React.FC<AuditoriaInspectorDrawerProps> = ({
  log,
  isOpen,
  onClose,
  onFilterByWorker,
  onOpenWorkerExpediente,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !log) return null;

  const getActionBadge = (action: string) => {
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

  const getModuleBadge = (mod: string) => {
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
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-theme-surface border-l border-theme-border shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
          {/* Header del Inspector */}
          <div className="p-5 border-b border-theme-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-theme-primary" />
              <div>
                <h3 className="text-sm font-bold text-theme-main">Inspección de Registro #{log.id}</h3>
                <span className="text-[11px] text-theme-muted font-mono">Trazabilidad Operativa POA</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-theme-muted hover:text-theme-main hover:bg-theme-surface-subtle transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Cuerpo Desplazable del Inspector */}
          <div className="p-5 overflow-y-auto space-y-5 flex-1">
            {/* Etiquetas de Estado y Módulo */}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-2.5 py-1 rounded-md text-xs font-bold border ${getActionBadge(
                  log.action_flag_display
                )}`}
              >
                {log.action_flag_display}
              </span>

              <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${getModuleBadge(log.modulo)}`}>
                {log.modulo}
              </span>

              <span className="text-[11px] font-mono text-theme-muted ml-auto">
                Flag: {log.action_flag}
              </span>
            </div>

            {/* Tarjeta del Servidor Público */}
            <div className="p-4 rounded-xl bg-theme-surface-subtle border border-theme-border space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-400/15 dark:text-blue-300 border border-blue-500/20 dark:border-blue-400/25 font-bold text-sm flex items-center justify-center shrink-0">
                  {log.usuario_nombre ? log.usuario_nombre.substring(0, 2).toUpperCase() : 'SI'}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-theme-main truncate">{log.usuario_nombre}</h4>
                  <span className="text-[11px] text-theme-muted font-mono block">@{log.usuario_username}</span>
                  <p className="text-[11px] text-theme-muted truncate mt-0.5">{log.usuario_cargo || 'Sin cargo'}</p>
                </div>
              </div>

              <div className="pt-2.5 border-t border-theme-border/60 flex items-center justify-between text-xs text-theme-muted">
                <span className="flex items-center gap-1 truncate">
                  <Building2 size={12} className="shrink-0" />
                  <span className="truncate">{log.usuario_area || 'Dirección General'}</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-theme-border/30 text-theme-main font-semibold text-[10px]">
                  {log.usuario_rol}
                </span>
              </div>

              {/* Botones de Acción de Servidor */}
              {log.usuario_id && (
                <div className="pt-1 flex gap-2">
                  <button
                    onClick={() => {
                      onFilterByWorker(log.usuario_id!);
                      onClose();
                    }}
                    className="flex-1 py-1.5 px-2 text-[11px] font-semibold rounded-lg bg-theme-base border border-theme-border hover:bg-theme-border/20 text-theme-main transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Filter size={11} />
                    <span>Filtrar su actividad</span>
                  </button>

                  {onOpenWorkerExpediente && (
                    <button
                      onClick={() => {
                        onOpenWorkerExpediente(log.usuario_id!);
                        onClose();
                      }}
                      className="py-1.5 px-2.5 text-[11px] font-semibold rounded-lg bg-theme-primary text-white hover:bg-theme-primary/90 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <ExternalLink size={11} />
                      <span>Expediente</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Fecha y Hora Exacta */}
            <div className="p-3.5 rounded-xl border border-theme-border bg-theme-surface space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-theme-muted flex items-center gap-1">
                <Calendar size={12} />
                Fecha y Hora de Registro
              </span>
              <p className="text-xs font-semibold text-theme-main capitalize">{formattedDate}</p>
              <p className="text-xs font-mono text-theme-muted flex items-center gap-1">
                <Clock size={11} />
                {formattedTime}
              </p>
            </div>

            {/* Objeto Afectado */}
            <div className="p-3.5 rounded-xl border border-theme-border bg-theme-surface space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-theme-muted flex items-center gap-1">
                <FileText size={12} />
                Objeto / Entidad del Sistema
              </span>
              <p className="text-xs font-mono font-bold text-theme-main bg-theme-surface-subtle p-2.5 rounded-lg border border-theme-border break-all">
                {log.object_repr || 'Sin objeto específico'}
              </p>
            </div>

            {/* Detalle y Mensaje de Cambio */}
            <div className="p-3.5 rounded-xl border border-theme-border bg-theme-surface space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-theme-muted flex items-center gap-1">
                <Info size={12} />
                Descripción Técnica de la Operación
              </span>
              <div className="p-3 rounded-lg bg-theme-surface-subtle border border-theme-border text-xs text-theme-main leading-relaxed font-sans whitespace-pre-wrap break-words">
                {log.change_message || 'Sin mensaje de cambio registrado.'}
              </div>
            </div>
          </div>

          {/* Footer del Inspector */}
          <div className="p-4 border-t border-theme-border bg-theme-surface flex justify-end">
            <Button variant="secondary" onClick={onClose}>
              Cerrar Inspector
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
