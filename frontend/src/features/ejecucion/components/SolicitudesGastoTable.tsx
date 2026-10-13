import React, { useState } from 'react';
import { DataTable, Column, StatusBadge, Button } from '../../../components/commons';
import { CertificacionPOA } from '../../../types/certificacion';
import {
  FileText,
  Edit3,
  Send,
  Trash2,
  Ban,
  Eye,
  Layers,
  Wallet,
  Clock,
  Sparkles,
} from 'lucide-react';

interface SolicitudesGastoTableProps {
  solicitudes: CertificacionPOA[];
  loading: boolean;
  canManage: boolean;
  onEdit: (solicitud: CertificacionPOA) => void;
  onEnviar: (solicitud: CertificacionPOA) => void;
  onDelete: (solicitud: CertificacionPOA) => void;
  onCancel: (solicitud: CertificacionPOA) => void;
  onViewDetail: (solicitud: CertificacionPOA) => void;
}

export const SolicitudesGastoTable: React.FC<SolicitudesGastoTableProps> = ({
  solicitudes,
  loading,
  canManage,
  onEdit,
  onEnviar,
  onDelete,
  onCancel,
  onViewDetail,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return solicitudes.slice(start, start + PAGE_SIZE);
  }, [solicitudes, currentPage]);

  const columns: Column<CertificacionPOA>[] = [
    {
      header: 'Hoja de Ruta / CITE',
      minWidth: '180px',
      render: (s) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-theme-main">
            <FileText size={15} className="text-theme-primary shrink-0" />
            <span className="truncate font-mono" title={s.hoja_ruta}>
              {s.hoja_ruta}
            </span>
          </div>
          <span
            className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-md border ${
              s.es_contratacion
                ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20'
                : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
            }`}
          >
            {s.es_contratacion ? 'Contratación POA' : 'Gasto Menor / Directo'}
          </span>
        </div>
      ),
    },
    {
      header: 'Operación POA',
      minWidth: '160px',
      render: (s) => {
        const ops = s.operaciones_detalle || [];
        if (ops.length === 0) {
          return <span className="text-[11px] text-theme-muted italic">Sin operación</span>;
        }
        return (
          <div className="space-y-0.5 text-xs">
            <div className="flex items-center gap-1 font-bold text-theme-primary font-mono">
              <Layers size={13} className="shrink-0" />
              <span>{ops.map((o) => o.codigo).join(', ')}</span>
            </div>
            <p className="text-[11px] text-theme-muted truncate" title={ops[0]?.descripcion || ''}>
              {ops[0]?.descripcion || 'Operación institucional'}
            </p>
          </div>
        );
      },
    },
    {
      header: 'Partida Presupuestaria',
      minWidth: '170px',
      render: (s) => (
        <div className="space-y-0.5 text-xs">
          <div className="flex items-center gap-1 font-semibold text-theme-main font-mono">
            <Wallet size={13} className="text-theme-muted shrink-0" />
            <span>Partida {s.partida_codigo || '---'}</span>
          </div>
          <p
            className="text-[11px] text-theme-muted truncate"
            title={s.partida_nombre || s.partida_literal || ''}
          >
            {s.partida_nombre || s.partida_literal || 'Partida general'}
          </p>
        </div>
      ),
    },
    {
      header: 'Monto Solicitado',
      align: 'right',
      minWidth: '140px',
      render: (s) => {
        const monto = Number(s.monto_solicitado) || 0;
        return (
          <span className="font-mono font-extrabold text-sm text-theme-main whitespace-nowrap">
            Bs. {monto.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
          </span>
        );
      },
    },
    {
      header: 'Estado',
      align: 'center',
      minWidth: '140px',
      render: (s) => <StatusBadge status={s.estado} size="sm" />,
    },
    {
      header: 'Acciones',
      align: 'right',
      minWidth: '160px',
      render: (s) => {
        const isBorrador = s.estado === 'BORRADOR';
        const isObservado = s.estado === 'OBSERVADO';
        const isAprobado = s.estado === 'APROBADO';
        const isAnulado = s.estado === 'ANULADO' || s.estado === 'RECHAZADO';

        return (
          <div className="flex items-center justify-end gap-1.5">
            {/* Editar / Enviar para Gerente si está en Borrador u Observado */}
            {(isBorrador || isObservado) && canManage && (
              <>
                <button
                  type="button"
                  onClick={() => onEdit(s)}
                  title="Editar Solicitud"
                  className="p-1.5 rounded-lg text-theme-muted hover:text-theme-primary hover:bg-theme-base transition"
                >
                  <Edit3 size={15} />
                </button>

                <button
                  type="button"
                  onClick={() => onEnviar(s)}
                  title="Enviar a Revisión"
                  className="p-1.5 rounded-lg text-theme-muted hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-theme-base transition"
                >
                  <Send size={15} />
                </button>

                {isBorrador && (
                  <button
                    type="button"
                    onClick={() => onDelete(s)}
                    title="Eliminar Borrador"
                    className="p-1.5 rounded-lg text-theme-muted hover:text-rose-600 dark:hover:text-rose-400 hover:bg-theme-base transition"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </>
            )}

            {/* Cancelar Solicitud si no ha finalizado */}
            {canManage && !isAprobado && !isAnulado && (
              <button
                type="button"
                onClick={() => onCancel(s)}
                title="Cancelar Solicitud de Gasto"
                className="p-1.5 rounded-lg text-theme-muted hover:text-rose-600 dark:hover:text-rose-400 hover:bg-theme-base transition"
              >
                <Ban size={15} />
              </button>
            )}

            {/* Ver Detalle y Seguimiento */}
            <button
              type="button"
              onClick={() => onViewDetail(s)}
              title="Ver Detalle y Seguimiento"
              className="p-1.5 rounded-lg text-theme-muted hover:text-theme-main hover:bg-theme-base transition"
            >
              <Eye size={15} />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={paginatedData}
      keyExtractor={(s) => s.id}
      loading={loading}
      emptyMessage="No se encontraron solicitudes de gasto registradas en este período."
      emptyIcon={<FileText size={36} className="text-theme-muted/50" />}
      pagination={{
        currentPage,
        pageSize: PAGE_SIZE,
        totalItems: solicitudes.length,
        onPageChange: setCurrentPage,
      }}
    />
  );
};
