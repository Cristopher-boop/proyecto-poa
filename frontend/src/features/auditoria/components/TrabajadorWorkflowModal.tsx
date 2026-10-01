import React, { useState } from 'react';
import {
  User,
  Shield,
  Building2,
  FileSpreadsheet,
  DollarSign,
  Shuffle,
  Award,
  Clock,
  Calendar,
  CheckCircle2,
  Layers,
  ArrowRight,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { Modal, Button, StatusBadge, DataTable, Column } from '../../../components/commons';
import {
  WorkerDetailActivity,
  WorkerMemoriaItem,
  WorkerGastoItem,
  WorkerTraspasoItem,
  WorkerCertificacionItem,
  AuditLogEntry,
} from '../types/auditoria.types';

interface TrabajadorWorkflowModalProps {
  detail: WorkerDetailActivity | null;
  loading: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSelectLog: (log: AuditLogEntry) => void;
}

export const TrabajadorWorkflowModal: React.FC<TrabajadorWorkflowModalProps> = ({
  detail,
  loading,
  isOpen,
  onClose,
  onSelectLog,
}) => {
  const [subTab, setSubTab] = useState<'MEMORIAS' | 'GASTOS' | 'TRASPASOS' | 'CERTIFICACIONES' | 'BITACORA'>('MEMORIAS');

  if (!isOpen) return null;

  if (loading || !detail) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="3xl" title="Cargando expediente...">
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-theme-muted">
          <Loader2 className="animate-spin text-theme-primary" size={32} />
          <p className="text-xs">Recuperando flujo de trabajo y expediente del servidor público...</p>
        </div>
      </Modal>
    );
  }

  const { usuario, memorias, gastos, traspasos, certificaciones, logs } = detail;

  const totalMontoGastos = gastos.reduce((sum, g) => sum + g.monto_ejecutado, 0);

  // Columnas para Memorias
  const memoriasColumns: Column<WorkerMemoriaItem>[] = [
    {
      header: 'Código Memoria',
      width: '140px',
      render: (row) => <span className="font-mono font-bold text-theme-main text-xs">{row.codigo}</span>,
    },
    {
      header: 'Rol en la Memoria',
      width: '160px',
      render: (row) => (
        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-theme-primary/10 text-theme-primary border border-theme-primary/20">
          {row.rol_participacion_display}
        </span>
      ),
    },
    {
      header: 'Gestión',
      width: '90px',
      align: 'center',
      render: (row) => <span className="text-xs font-semibold text-theme-main">{row.gestion || '-'}</span>,
    },
    {
      header: 'Estado',
      width: '140px',
      align: 'center',
      render: (row) => <StatusBadge status={row.estado} label={row.estado_display} />,
    },
    {
      header: 'Presupuestado',
      width: '130px',
      align: 'right',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-theme-main">
          Bs. {row.total_presupuestado.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
  ];

  // Columnas para Gastos
  const gastosColumns: Column<WorkerGastoItem>[] = [
    {
      header: 'Fecha',
      width: '110px',
      render: (row) => <span className="text-xs text-theme-muted">{row.fecha_gasto}</span>,
    },
    {
      header: 'Comprobante',
      width: '130px',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-theme-main">{row.comprobante_num || 'S/N'}</span>
      ),
    },
    {
      header: 'Memoria de Cálculo',
      width: '140px',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-theme-primary">{row.memoria_codigo}</span>
      ),
    },
    {
      header: 'Monto Ejecutado',
      width: '130px',
      align: 'right',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
          Bs. {row.monto_ejecutado.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Observación',
      render: (row) => <p className="text-xs text-theme-muted line-clamp-1">{row.observacion || '-'}</p>,
    },
  ];

  // Columnas para Traspasos
  const traspasosColumns: Column<WorkerTraspasoItem>[] = [
    {
      header: 'Fecha y Hora',
      width: '150px',
      render: (row) => (
        <span className="text-xs text-theme-muted">
          {new Date(row.created_at).toLocaleDateString('es-BO')}
        </span>
      ),
    },
    {
      header: 'Monto',
      width: '130px',
      align: 'right',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
          Bs. {row.monto.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Movimiento Presupuestario',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span className="font-bold text-theme-main">{row.memoria_origen}</span>
          <ArrowRight size={12} className="text-theme-muted" />
          <span className="font-bold text-emerald-600 dark:text-emerald-400">{row.memoria_destino}</span>
        </div>
      ),
    },
    {
      header: 'Justificación / Motivo',
      render: (row) => <p className="text-xs text-theme-muted line-clamp-1">{row.motivo}</p>,
    },
  ];

  // Columnas para Certificaciones
  const certificacionesColumns: Column<WorkerCertificacionItem>[] = [
    {
      header: 'Código Certificación',
      width: '170px',
      render: (row) => <span className="font-mono text-xs font-bold text-theme-main">{row.codigo}</span>,
    },
    {
      header: 'Área Solicitante',
      render: (row) => <span className="text-xs text-theme-muted">{row.area}</span>,
    },
    {
      header: 'Fecha',
      width: '110px',
      render: (row) => <span className="text-xs text-theme-muted">{row.fecha}</span>,
    },
    {
      header: 'Estado',
      width: '120px',
      align: 'center',
      render: (row) => <StatusBadge status={row.estado} label={row.estado} />,
    },
    {
      header: 'Monto Solicitado',
      width: '130px',
      align: 'right',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400">
          Bs. {row.monto_solicitado.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="3xl"
      icon={<User size={22} className="text-theme-primary" />}
      title="Flujo Operativo y Expediente del Servidor Público"
      subtitle={`Trazabilidad completa de actividades de @${usuario.username}`}
      badge={
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-theme-primary/10 text-theme-primary border border-theme-primary/20">
          {usuario.rol}
        </span>
      }
      footer={
        <div className="flex justify-end w-full">
          <Button variant="secondary" onClick={onClose}>
            Cerrar Expediente
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Cabecera del Perfil del Trabajador */}
        <div className="p-4 rounded-2xl bg-theme-surface-subtle border border-theme-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-theme-primary to-brand-700 text-white font-bold text-lg flex items-center justify-center shadow-sm">
              {usuario.nombre_completo.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-theme-main">{usuario.nombre_completo}</h3>
                <span className="text-xs font-mono text-theme-muted">@{usuario.username}</span>
              </div>
              <p className="text-xs text-theme-muted mt-0.5 flex items-center gap-1.5 flex-wrap">
                <Building2 size={13} className="shrink-0" />
                <span>{usuario.area || 'Dirección General'}</span>
                {usuario.seccion && <span>/ {usuario.seccion}</span>}
                <span>• {usuario.cargo}</span>
              </p>
            </div>
          </div>

          <div className="flex sm:flex-col items-end gap-1 text-xs text-theme-muted">
            <span>
              Último acceso:{' '}
              <strong className="text-theme-main">
                {usuario.last_login
                  ? new Date(usuario.last_login).toLocaleDateString('es-BO')
                  : 'Sin ingresos'}
              </strong>
            </span>
            <span>
              Registro institucional:{' '}
              {new Date(usuario.date_joined).toLocaleDateString('es-BO')}
            </span>
          </div>
        </div>

        {/* 4 Mini Tarjetas de Impacto Operativo */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-theme-surface border border-theme-border">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-muted">
              Memorias Vinculadas
            </span>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-0.5">
              {memorias.length}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-theme-surface border border-theme-border">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-muted">
              Gastos Ejecutados
            </span>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {gastos.length}
              <span className="text-[10px] text-theme-muted font-normal ml-1">
                (Bs. {totalMontoGastos.toLocaleString('es-BO', { maximumFractionDigits: 0 })})
              </span>
            </p>
          </div>

          <div className="p-3 rounded-xl bg-theme-surface border border-theme-border">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-muted">
              Traspasos Realizados
            </span>
            <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
              {traspasos.length}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-theme-surface border border-theme-border">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-muted">
              Eventos en Bitácora
            </span>
            <p className="text-lg font-bold text-theme-main mt-0.5">
              {logs.length}
            </p>
          </div>
        </div>

        {/* Sub-navegación por Pestañas Internas */}
        <div className="border-b border-theme-border flex gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSubTab('MEMORIAS')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              subTab === 'MEMORIAS'
                ? 'border-theme-primary text-theme-primary font-bold'
                : 'border-transparent text-theme-muted hover:text-theme-main'
            }`}
          >
            <FileSpreadsheet size={14} />
            <span>Memorias de Cálculo ({memorias.length})</span>
          </button>

          <button
            onClick={() => setSubTab('GASTOS')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              subTab === 'GASTOS'
                ? 'border-theme-primary text-theme-primary font-bold'
                : 'border-transparent text-theme-muted hover:text-theme-main'
            }`}
          >
            <DollarSign size={14} />
            <span>Gastos Registrados ({gastos.length})</span>
          </button>

          <button
            onClick={() => setSubTab('TRASPASOS')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              subTab === 'TRASPASOS'
                ? 'border-theme-primary text-theme-primary font-bold'
                : 'border-transparent text-theme-muted hover:text-theme-main'
            }`}
          >
            <Shuffle size={14} />
            <span>Traspasos ({traspasos.length})</span>
          </button>

          <button
            onClick={() => setSubTab('CERTIFICACIONES')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              subTab === 'CERTIFICACIONES'
                ? 'border-theme-primary text-theme-primary font-bold'
                : 'border-transparent text-theme-muted hover:text-theme-main'
            }`}
          >
            <Award size={14} />
            <span>Certificaciones ({certificaciones.length})</span>
          </button>

          <button
            onClick={() => setSubTab('BITACORA')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              subTab === 'BITACORA'
                ? 'border-theme-primary text-theme-primary font-bold'
                : 'border-transparent text-theme-muted hover:text-theme-main'
            }`}
          >
            <Clock size={14} />
            <span>Bitácora Individual ({logs.length})</span>
          </button>
        </div>

        {/* Contenido de la Sub-Pestaña Activa */}
        <div>
          {subTab === 'MEMORIAS' && (
            <DataTable
              columns={memoriasColumns}
              data={memorias}
              keyExtractor={(row) => row.id}
              emptyMessage="Este servidor público no tiene memorias de cálculo asignadas o participaciones registradas."
            />
          )}

          {subTab === 'GASTOS' && (
            <DataTable
              columns={gastosColumns}
              data={gastos}
              keyExtractor={(row) => row.id}
              emptyMessage="No registra comprobantes de gasto ejecutados en el sistema."
            />
          )}

          {subTab === 'TRASPASOS' && (
            <DataTable
              columns={traspasosColumns}
              data={traspasos}
              keyExtractor={(row) => row.id}
              emptyMessage="No ha registrado traspasos presupuestarios entre memorias."
            />
          )}

          {subTab === 'CERTIFICACIONES' && (
            <DataTable
              columns={certificacionesColumns}
              data={certificaciones}
              keyExtractor={(row) => row.id}
              emptyMessage="No ha emitido certificaciones POA en la plataforma."
            />
          )}

          {subTab === 'BITACORA' && (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {logs.length === 0 ? (
                <div className="p-8 text-center text-xs text-theme-muted">
                  No se registran eventos de bitácora para este usuario.
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    onClick={() => onSelectLog(log)}
                    className="p-3 rounded-xl border border-theme-border bg-theme-surface hover:bg-theme-surface-subtle transition-colors flex items-center justify-between gap-3 cursor-pointer group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-theme-primary/10 text-theme-primary">
                          {log.modulo}
                        </span>
                        <span className="text-xs font-mono font-semibold text-theme-main">
                          {log.object_repr}
                        </span>
                      </div>
                      <p className="text-xs text-theme-muted mt-1 line-clamp-1">
                        {log.change_message}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-mono text-theme-muted block">
                        {new Date(log.action_time).toLocaleDateString('es-BO')}{' '}
                        {new Date(log.action_time).toLocaleTimeString('es-BO', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="text-[10px] text-theme-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        Ver detalle
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
