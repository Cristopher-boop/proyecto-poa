import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Eye,
  RotateCcw,
  X,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { AuditLogEntry, WorkerWorkflowSummary } from '../types/auditoria.types';
import { Dropdown, DropdownItem } from '../../../components/commons';

interface AuditoriaTimelineFeedProps {
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

export const AuditoriaTimelineFeed: React.FC<AuditoriaTimelineFeedProps> = ({
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
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
      case 'ELIMINACIÓN':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20';
      case 'LOGIN':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20';
      default:
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
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
        return 'bg-theme-base/80 text-theme-main border-theme-border';
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
    { id: 'TODOS', label: 'Todos los Módulos', triggerLabel: 'Módulo: Todos' },
    { id: 'MEMORIAS', label: 'Memorias de Cálculo', triggerLabel: 'Módulo: Memorias' },
    { id: 'EJECUCIÓN', label: 'Ejecución Presupuestaria (Gastos)', triggerLabel: 'Módulo: Gastos' },
    { id: 'MODIFICACIONES', label: 'Modificaciones & Traspasos', triggerLabel: 'Módulo: Traspasos' },
    { id: 'CERTIFICACIONES', label: 'Certificaciones POA', triggerLabel: 'Módulo: Certificaciones' },
    { id: 'PRESUPUESTOS', label: 'Presupuestos & Techos', triggerLabel: 'Módulo: Presupuestos' },
    { id: 'GESTIONES', label: 'Gestiones Fiscales', triggerLabel: 'Módulo: Gestiones' },
    { id: 'AUTENTICACIÓN', label: 'Inicios de Sesión', triggerLabel: 'Módulo: Logins' },
    { id: 'ORGANIZACIONAL', label: 'Estructura Organizacional', triggerLabel: 'Módulo: Estructura' },
    { id: 'USUARIOS', label: 'Usuarios y Cuentas', triggerLabel: 'Módulo: Usuarios' },
  ], []);

  const actionItems: DropdownItem[] = useMemo(() => [
    { id: 'TODOS', label: 'Todas las Acciones', triggerLabel: 'Acción: Todas' },
    { id: '1', label: 'Creación (Adición)', triggerLabel: 'Acción: Creación' },
    { id: '2', label: 'Modificación (Cambio)', triggerLabel: 'Acción: Modificación' },
    { id: '3', label: 'Eliminación', triggerLabel: 'Acción: Eliminación' },
    { id: 'LOGIN', label: 'Inicio de Sesión', triggerLabel: 'Acción: Sesión' },
  ], []);

  const workerItems: DropdownItem[] = useMemo(() => [
    { id: 'TODOS', label: 'Todos los Servidores Públicos', triggerLabel: 'Servidor: Todos' },
    ...trabajadores.map((t) => ({
      id: String(t.id),
      label: `${t.nombre_completo} (@${t.username})`,
      triggerLabel: `Servidor: ${t.username}`,
      sublabel: t.cargo || t.area,
    })),
  ], [trabajadores]);

  return (
    <div className="space-y-4">
      {/* Panel de Filtros Operativos */}
      <div className="card p-4 bg-theme-surface border border-theme-border rounded-2xl shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Buscador Textual */}
          <div className="lg:col-span-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted" size={15} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar por código, usuario, objeto o detalle..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-theme-surface border border-theme-border rounded-xl focus:outline-none focus:border-theme-primary text-theme-main placeholder:text-theme-muted transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-main cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Filtro Módulo */}
          <div className="lg:col-span-3">
            <Dropdown
              items={moduloItems}
              value={selectedModulo}
              onChange={(val) => onModuloChange(String(val))}
              placeholder="Módulo: Todos"
              size="md"
            />
          </div>

          {/* Filtro Tipo de Acción */}
          <div className="lg:col-span-2">
            <Dropdown
              items={actionItems}
              value={selectedActionFlag}
              onChange={(val) => onActionFlagChange(String(val))}
              placeholder="Acción: Todas"
              size="md"
            />
          </div>

          {/* Filtro Servidor Público */}
          <div className="lg:col-span-3">
            <Dropdown
              items={workerItems}
              value={selectedWorkerFilter}
              onChange={(val) => onWorkerFilterChange(String(val))}
              placeholder="Servidor: Todos"
              size="md"
              searchable={workerItems.length > 5}
            />
          </div>
        </div>

        {/* Resumen de Filtros y Limpieza */}
        <div className="flex items-center justify-between text-xs text-theme-muted pt-1">
          <span>
            Mostrando <strong>{logs.length.toLocaleString()}</strong> eventos de auditoría
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

      {/* Tabla con Estilo de MCs (Sin líneas blancas, bordes suaves de tema) */}
      <div className="bg-theme-surface rounded-2xl border border-theme-border overflow-hidden shadow-sm flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-theme-border bg-theme-base/60 text-xs font-semibold uppercase tracking-wider text-theme-muted">
                <th className="py-3.5 px-4 w-40">Fecha & Hora</th>
                <th className="py-3.5 px-4 w-60">Servidor Público</th>
                <th className="py-3.5 px-4 w-32 text-center">Módulo</th>
                <th className="py-3.5 px-4 w-28 text-center">Acción</th>
                <th className="py-3.5 px-4">Objeto & Detalle de la Operación</th>
                <th className="py-3.5 px-4 w-20 text-center">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-theme-muted">
                    <div className="inline-block w-6 h-6 border-2 border-theme-primary border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="font-semibold text-xs">Cargando registros de auditoría...</p>
                  </td>
                </tr>
              ) : paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-theme-muted">
                    <FileText size={36} className="mx-auto mb-2 opacity-40" />
                    <p className="font-semibold text-xs text-theme-main">No se encontraron eventos</p>
                    <p className="text-[11px] mt-0.5">Prueba ajustando los filtros o el rango de fechas.</p>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => {
                  const d = new Date(log.action_time);
                  const dateStr = d.toLocaleDateString('es-BO', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  });
                  const timeStr = d.toLocaleTimeString('es-BO', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });

                  return (
                    <tr
                      key={log.id}
                      onClick={() => onSelectLog(log)}
                      className="hover:bg-theme-border/20 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-theme-main block">{dateStr}</span>
                        <span className="text-[11px] font-mono text-theme-muted">{timeStr}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-theme-primary/10 text-theme-primary font-bold text-xs flex items-center justify-center shrink-0">
                            {log.usuario_nombre ? log.usuario_nombre.substring(0, 2).toUpperCase() : 'SI'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-theme-main truncate block text-xs group-hover:text-theme-primary transition-colors">
                                {log.usuario_nombre}
                              </span>
                              <span className="text-[10px] text-theme-muted font-mono">@{log.usuario_username}</span>
                            </div>
                            <span className="text-[11px] text-theme-muted truncate block mt-0.5">
                              {log.usuario_area || 'Administración Central'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${getModuleBadge(
                            log.modulo
                          )}`}
                        >
                          {log.modulo}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getActionBadge(
                            log.action_flag_display
                          )}`}
                        >
                          {log.action_flag_display}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <p className="font-mono text-xs font-semibold text-theme-main truncate">
                            {log.object_repr}
                          </p>
                          <p className="text-[11px] text-theme-muted line-clamp-1">{log.change_message}</p>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectLog(log);
                          }}
                          className="p-1.5 rounded-lg text-theme-muted hover:text-theme-primary hover:bg-theme-surface-subtle transition-colors cursor-pointer"
                          title="Inspeccionar evento"
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginador Integrado */}
        {logs.length > pageSize && (
          <div className="px-4 py-3 border-t border-theme-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-theme-muted select-none">
            <div>
              Mostrando <strong className="text-theme-main font-semibold">{(currentPage - 1) * pageSize + 1}</strong> a{' '}
              <strong className="text-theme-main font-semibold">
                {Math.min(currentPage * pageSize, logs.length)}
              </strong>{' '}
              de <strong className="text-theme-main font-semibold">{logs.length.toLocaleString()}</strong> eventos
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage <= 1}
                className="p-1.5 rounded-lg border border-theme-border text-theme-muted hover:text-theme-main hover:bg-theme-border/20 disabled:opacity-25 disabled:pointer-events-none transition-colors cursor-pointer"
                title="Primera página"
              >
                <ChevronsLeft size={14} />
              </button>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="p-1.5 rounded-lg border border-theme-border text-theme-muted hover:text-theme-main hover:bg-theme-border/20 disabled:opacity-25 disabled:pointer-events-none transition-colors cursor-pointer"
                title="Página anterior"
              >
                <ChevronLeft size={14} />
              </button>

              <span className="px-3 py-1 font-semibold text-theme-main">
                {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded-lg border border-theme-border text-theme-muted hover:text-theme-main hover:bg-theme-border/20 disabled:opacity-25 disabled:pointer-events-none transition-colors cursor-pointer"
                title="Página siguiente"
              >
                <ChevronRight size={14} />
              </button>

              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded-lg border border-theme-border text-theme-muted hover:text-theme-main hover:bg-theme-border/20 disabled:opacity-25 disabled:pointer-events-none transition-colors cursor-pointer"
                title="Última página"
              >
                <ChevronsRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
