import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Eye,
  Building2,
  Calendar,
  Clock,
  User,
  Shield,
  RotateCcw,
  CheckCircle2,
  X,
} from 'lucide-react';
import { DataTable, Column, Pagination, Button } from '../../../components/commons';
import { AuditLogEntry, WorkerWorkflowSummary } from '../types/auditoria.types';

interface AuditoriaLogsTableProps {
  logs: AuditLogEntry[];
  loading: boolean;
  trabajadores: WorkerWorkflowSummary[];
  searchTerm: string;
  onSearchChange: (val: string) => void;
  selectedModulo: string;
  onModuloChange: (val: string) => void;
  selectedActionFlag: string;
  onActionFlagChange: (val: string) => void;
  selectedWorkerFilter: string;
  onWorkerFilterChange: (val: string) => void;
  onSelectLog: (log: AuditLogEntry) => void;
}

export const AuditoriaLogsTable: React.FC<AuditoriaLogsTableProps> = ({
  logs,
  loading,
  trabajadores,
  searchTerm,
  onSearchChange,
  selectedModulo,
  onModuloChange,
  selectedActionFlag,
  onActionFlagChange,
  selectedWorkerFilter,
  onWorkerFilterChange,
  onSelectLog,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedModulo, selectedActionFlag, selectedWorkerFilter]);

  const totalPages = Math.max(1, Math.ceil(logs.length / pageSize));
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return logs.slice(start, start + pageSize);
  }, [logs, currentPage, pageSize]);

  const getActionBadge = (flag: string) => {
    switch (flag) {
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

  const hasActiveFilters =
    Boolean(searchTerm) ||
    selectedModulo !== 'TODOS' ||
    selectedActionFlag !== 'TODOS' ||
    selectedWorkerFilter !== 'TODOS';

  const handleResetFilters = () => {
    onSearchChange('');
    onModuloChange('TODOS');
    onActionFlagChange('TODOS');
    onWorkerFilterChange('TODOS');
  };

  const columns: Column<AuditLogEntry>[] = [
    {
      header: 'Fecha & Hora',
      width: '150px',
      render: (row) => {
        const d = new Date(row.action_time);
        const dateStr = d.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const timeStr = d.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-theme-main">{dateStr}</span>
            <span className="text-[11px] font-mono text-theme-muted">{timeStr}</span>
          </div>
        );
      },
    },
    {
      header: 'Servidor Público',
      width: '240px',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-theme-primary/10 text-theme-primary font-bold text-xs flex items-center justify-center shrink-0">
            {row.usuario_nombre ? row.usuario_nombre.substring(0, 2).toUpperCase() : 'SI'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-bold text-theme-main truncate">{row.usuario_nombre}</p>
              <span className="text-[10px] text-theme-muted font-mono">@{row.usuario_username}</span>
            </div>
            <p className="text-[11px] text-theme-muted truncate mt-0.5">
              {row.usuario_area || 'Administración Central'}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: 'Módulo',
      width: '130px',
      align: 'center',
      render: (row) => (
        <span
          className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold border ${getModuleBadge(
            row.modulo
          )}`}
        >
          {row.modulo}
        </span>
      ),
    },
    {
      header: 'Acción',
      width: '120px',
      align: 'center',
      render: (row) => (
        <span
          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getActionBadge(
            row.action_flag_display
          )}`}
        >
          {row.action_flag_display}
        </span>
      ),
    },
    {
      header: 'Detalle del Evento / Objeto',
      render: (row) => (
        <div className="space-y-0.5 pr-2">
          <p className="text-xs font-semibold text-theme-main font-mono truncate">{row.object_repr}</p>
          <p className="text-[11px] text-theme-muted line-clamp-1">{row.change_message}</p>
        </div>
      ),
    },
    {
      header: 'Acción',
      width: '80px',
      align: 'center',
      render: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onSelectLog(row);
          }}
          className="p-1.5 text-theme-muted hover:text-theme-primary"
          title="Ver detalle completo del evento"
        >
          <Eye size={15} />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Barra de Filtros Desacoplada y Avanzada */}
      <div className="card p-4 bg-theme-surface border border-theme-border rounded-2xl shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Buscador Textual */}
          <div className="lg:col-span-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted" size={15} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar por código, usuario, objeto o descripción..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-theme-surface-subtle border border-theme-border rounded-xl focus:outline-none focus:border-theme-primary text-theme-main placeholder:text-theme-muted transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-main"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Filtro Módulo */}
          <div className="lg:col-span-3">
            <select
              value={selectedModulo}
              onChange={(e) => onModuloChange(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-theme-surface-subtle border border-theme-border rounded-xl focus:outline-none focus:border-theme-primary text-theme-main cursor-pointer"
            >
              <option value="TODOS">Módulo: Todos los Módulos</option>
              <option value="MEMORIAS">Memorias de Cálculo</option>
              <option value="EJECUCIÓN">Ejecución Presupuestaria (Gastos)</option>
              <option value="MODIFICACIONES">Modificaciones & Traspasos</option>
              <option value="CERTIFICACIONES">Certificaciones POA</option>
              <option value="PRESUPUESTOS">Presupuestos & Techos</option>
              <option value="GESTIONES">Gestiones Fiscales</option>
              <option value="AUTENTICACIÓN">Inicios de Sesión</option>
              <option value="ORGANIZACIONAL">Estructura Organizacional</option>
              <option value="USUARIOS">Usuarios y Cuentas</option>
            </select>
          </div>

          {/* Filtro Tipo de Acción */}
          <div className="lg:col-span-2">
            <select
              value={selectedActionFlag}
              onChange={(e) => onActionFlagChange(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-theme-surface-subtle border border-theme-border rounded-xl focus:outline-none focus:border-theme-primary text-theme-main cursor-pointer"
            >
              <option value="TODOS">Acción: Todas</option>
              <option value="1">Creación (Adición)</option>
              <option value="2">Modificación (Cambio)</option>
              <option value="3">Eliminación</option>
              <option value="LOGIN">Inicio de Sesión</option>
            </select>
          </div>

          {/* Filtro Servidor Público */}
          <div className="lg:col-span-3">
            <select
              value={selectedWorkerFilter}
              onChange={(e) => onWorkerFilterChange(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-theme-surface-subtle border border-theme-border rounded-xl focus:outline-none focus:border-theme-primary text-theme-main cursor-pointer"
            >
              <option value="TODOS">Servidor Público: Todos</option>
              {trabajadores.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre_completo} (@{t.username})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Resumen de Resultados & Botón Limpiar */}
        <div className="flex items-center justify-between text-xs text-theme-muted pt-1">
          <span>
            Mostrando <strong>{logs.length.toLocaleString()}</strong> eventos coincidentes
          </span>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="text-theme-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw size={12} />
              <span>Limpiar filtros</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabla Principal */}
      <DataTable
        columns={columns}
        data={paginatedLogs}
        keyExtractor={(row) => row.id}
        loading={loading}
        emptyMessage="No se encontraron eventos de auditoría con los criterios seleccionados."
        onRowClick={(row) => onSelectLog(row)}
      />

      {/* Paginación */}
      {logs.length > pageSize && (
        <Pagination
          currentPage={currentPage}
          totalItems={logs.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          itemLabel="eventos de auditoría"
        />
      )}
    </div>
  );
};
