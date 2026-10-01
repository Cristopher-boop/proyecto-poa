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
  Layers,
  Activity,
} from 'lucide-react';
import { DataTable, Column, Pagination, Button, Dropdown, DropdownItem } from '../../../components/commons';
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

  const moduloItems: DropdownItem[] = useMemo(() => [
    { id: 'TODOS', label: 'Todos los Módulos' },
    { id: 'MEMORIAS', label: 'Memorias de Cálculo', triggerLabel: 'Memorias' },
    { id: 'EJECUCIÓN', label: 'Ejecución Presupuestaria (Gastos)', triggerLabel: 'Gastos' },
    { id: 'MODIFICACIONES', label: 'Modificaciones & Traspasos', triggerLabel: 'Traspasos' },
    { id: 'CERTIFICACIONES', label: 'Certificaciones POA', triggerLabel: 'Certificaciones' },
    { id: 'PRESUPUESTOS', label: 'Presupuestos & Techos', triggerLabel: 'Presupuestos' },
    { id: 'GESTIONES', label: 'Gestiones Fiscales', triggerLabel: 'Gestiones' },
    { id: 'AUTENTICACIÓN', label: 'Inicios de Sesión', triggerLabel: 'Logins' },
    { id: 'ORGANIZACIONAL', label: 'Estructura Organizacional', triggerLabel: 'Estructura' },
    { id: 'USUARIOS', label: 'Usuarios y Cuentas', triggerLabel: 'Usuarios' },
  ], []);

  const actionItems: DropdownItem[] = useMemo(() => [
    { id: 'TODOS', label: 'Todas las Acciones' },
    { id: '1', label: 'Creación (Adición)', triggerLabel: 'Creación' },
    { id: '2', label: 'Modificación (Cambio)', triggerLabel: 'Modificación' },
    { id: '3', label: 'Eliminación', triggerLabel: 'Eliminación' },
    { id: 'LOGIN', label: 'Inicio de Sesión', triggerLabel: 'Sesión' },
  ], []);

  const workerItems: DropdownItem[] = useMemo(() => [
    { id: 'TODOS', label: 'Todos los Servidores Públicos', triggerLabel: 'Todos los Servidores' },
    ...trabajadores.map((t) => ({
      id: String(t.id),
      label: `${t.nombre_completo} (@${t.username})`,
      triggerLabel: t.nombre_completo,
      sublabel: t.cargo || t.area,
    })),
  ], [trabajadores]);

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
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-400/15 dark:text-blue-300 border border-blue-500/20 dark:border-blue-400/25 font-bold text-xs flex items-center justify-center shrink-0">
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
      <div className="card p-4 bg-theme-surface border border-theme-border rounded-2xl shadow-sm space-y-3 relative z-30">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 relative z-30 items-center">
          {/* Buscador Textual */}
          <div className="lg:col-span-4 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-theme-muted" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar por código, usuario, objeto o descripción..."
              className="block w-full pl-9 pr-8 py-2 bg-theme-base border border-theme-border rounded-xl text-theme-main text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-500 focus:border-slate-400 dark:focus:border-slate-500 transition-all placeholder:text-theme-muted"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-main p-0.5 rounded transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filtro Módulo */}
          <div className="lg:col-span-3">
            <Dropdown
              items={moduloItems}
              value={selectedModulo}
              onChange={(val) => onModuloChange(String(val))}
              placeholder="Todos los Módulos"
              icon={<Layers className="h-3.5 w-3.5 text-theme-muted" />}
              size="sm"
              searchable={false}
            />
          </div>

          {/* Filtro Tipo de Acción */}
          <div className="lg:col-span-2">
            <Dropdown
              items={actionItems}
              value={selectedActionFlag}
              onChange={(val) => onActionFlagChange(String(val))}
              placeholder="Todas las Acciones"
              icon={<Activity className="h-3.5 w-3.5 text-theme-muted" />}
              size="sm"
              searchable={false}
            />
          </div>

          {/* Filtro Servidor Público */}
          <div className="lg:col-span-3">
            <Dropdown
              items={workerItems}
              value={selectedWorkerFilter}
              onChange={(val) => onWorkerFilterChange(String(val))}
              placeholder="Todos los Servidores"
              icon={<User className="h-3.5 w-3.5 text-theme-muted" />}
              size="sm"
              searchable={workerItems.length > 5}
              searchPlaceholder="Buscar servidor..."
            />
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
              className="text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
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
