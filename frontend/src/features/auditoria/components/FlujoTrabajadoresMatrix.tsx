import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Building2,
  FileSpreadsheet,
  DollarSign,
  Shuffle,
  Clock,
  ArrowRight,
  Shield,
  X,
  Briefcase,
  CheckCircle2,
} from 'lucide-react';
import { WorkerWorkflowSummary } from '../types/auditoria.types';
import { Dropdown, DropdownItem } from '../../../components/commons';

interface FlujoTrabajadoresMatrixProps {
  trabajadores: WorkerWorkflowSummary[];
  loading: boolean;
  onOpenWorkerModal: (workerId: number) => void;
}

export const FlujoTrabajadoresMatrix: React.FC<FlujoTrabajadoresMatrixProps> = ({
  trabajadores,
  loading,
  onOpenWorkerModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('TODOS');
  const [selectedArea, setSelectedArea] = useState<string>('TODAS');

  const roles = Array.from(new Set(trabajadores.map((t) => t.rol).filter(Boolean)));
  const areas = Array.from(new Set(trabajadores.map((t) => t.area).filter(Boolean)));

  const filtered = trabajadores.filter((t) => {
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      const match =
        t.nombre_completo.toLowerCase().includes(term) ||
        t.username.toLowerCase().includes(term) ||
        t.cargo.toLowerCase().includes(term) ||
        t.area.toLowerCase().includes(term);
      if (!match) return false;
    }
    if (selectedRole !== 'TODOS' && t.rol !== selectedRole) return false;
    if (selectedArea !== 'TODAS' && t.area !== selectedArea) return false;
    return true;
  });

  const getRoleBadgeStyle = (rol: string) => {
    const r = rol.toUpperCase();
    if (r.includes('SUPERADMIN')) {
      return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20';
    }
    if (r.includes('GERENTE') || r.includes('APROBADOR')) {
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
    }
    if (r.includes('PLANIFIC')) {
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20';
    }
    if (r.includes('ELABORADOR')) {
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
    }
    return 'bg-theme-border/30 text-theme-main border border-theme-border';
  };

  const roleItems: DropdownItem[] = useMemo(() => [
    { id: 'TODOS', label: 'Todos los Roles', triggerLabel: 'Rol: Todos' },
    ...roles.map((r) => ({
      id: r,
      label: r,
      triggerLabel: `Rol: ${r.toUpperCase() === 'SUPERADMINISTRADOR' ? 'Superadmin' : r}`,
    })),
  ], [roles]);

  const areaItems: DropdownItem[] = useMemo(() => [
    { id: 'TODAS', label: 'Todas las Áreas', triggerLabel: 'Área: Todas' },
    ...areas.map((a) => ({
      id: a,
      label: a,
      triggerLabel: `Área: ${a}`,
    })),
  ], [areas]);

  return (
    <div className="space-y-4">
      {/* Barra de Filtros de Trabajadores */}
      <div className="card p-4 bg-theme-surface border border-theme-border rounded-2xl shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted" size={15} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, usuario, cargo o gerencia..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-theme-surface border border-theme-border rounded-xl focus:outline-none focus:border-theme-primary text-theme-main placeholder:text-theme-muted transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-main cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="sm:col-span-3">
            <Dropdown
              items={roleItems}
              value={selectedRole}
              onChange={(val) => setSelectedRole(String(val))}
              placeholder="Rol: Todos"
              size="md"
            />
          </div>

          <div className="sm:col-span-3">
            <Dropdown
              items={areaItems}
              value={selectedArea}
              onChange={(val) => setSelectedArea(String(val))}
              placeholder="Área: Todas"
              size="md"
              searchable={areaItems.length > 5}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-theme-muted pt-2.5 border-t border-theme-border/60 mt-3">
          <span>
            Servidores públicos identificados: <strong>{filtered.length}</strong>
          </span>
          {(searchTerm || selectedRole !== 'TODOS' || selectedArea !== 'TODAS') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedRole('TODOS');
                setSelectedArea('TODAS');
              }}
              className="text-theme-primary font-semibold hover:underline text-xs cursor-pointer"
            >
              Restablecer filtros
            </button>
          )}
        </div>
      </div>

      {/* Grid de Tarjetas de Flujo */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="card p-5 bg-theme-surface border border-theme-border rounded-2xl animate-pulse h-64"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center bg-theme-surface border border-theme-border rounded-2xl text-theme-muted">
          <Users size={40} className="mx-auto text-theme-muted mb-2 opacity-40" />
          <p className="text-sm font-semibold text-theme-main">No se encontraron trabajadores</p>
          <p className="text-xs mt-0.5">Prueba ajustando los términos de búsqueda o los selectores de rol.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((worker) => {
            const hasRecentActivity = Boolean(worker.ultima_actividad);

            return (
              <div
                key={worker.id}
                className="card p-5 bg-theme-surface border border-theme-border rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Encabezado del Servidor */}
                  <div className="flex items-start justify-between gap-2.5 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-theme-primary/10 text-theme-primary font-bold text-xs flex items-center justify-center shrink-0">
                        {worker.nombre_completo.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4
                          className="text-xs sm:text-sm font-bold text-theme-main truncate group-hover:text-theme-primary transition-colors leading-tight"
                          title={worker.nombre_completo}
                        >
                          {worker.nombre_completo}
                        </h4>
                        <span className="text-[11px] font-mono text-theme-muted block truncate mt-0.5">
                          @{worker.username}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 whitespace-nowrap self-start ${getRoleBadgeStyle(
                        worker.rol
                      )}`}
                      title={worker.rol}
                    >
                      {worker.rol.toUpperCase() === 'SUPERADMINISTRADOR' ? 'SUPERADMIN' : worker.rol}
                    </span>
                  </div>

                  {/* Área y Cargo */}
                  <div className="space-y-1 mb-3.5 text-xs text-theme-muted border-b border-theme-border/60 pb-3">
                    <p className="flex items-center gap-1.5 truncate">
                      <Building2 size={13} className="shrink-0 text-theme-muted" />
                      <span className="truncate">{worker.area || 'Dirección General'}</span>
                    </p>
                    <p className="truncate pl-5 text-[11px] text-theme-muted">
                      {worker.cargo || 'Sin cargo especificado'}
                    </p>
                  </div>

                  {/* Métricas de Participación */}
                  <div className="grid grid-cols-3 gap-2 text-center mb-3.5">
                    <div className="p-2 rounded-xl bg-theme-surface-subtle">
                      <span className="text-[10px] font-bold uppercase text-theme-muted block">Memorias</span>
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                        {worker.memorias_elaboradas + worker.memorias_revisadas + worker.memorias_aprobadas}
                      </span>
                      <span className="text-[9px] text-theme-muted block">({worker.memorias_elaboradas} elab.)</span>
                    </div>

                    <div className="p-2 rounded-xl bg-theme-surface-subtle">
                      <span className="text-[10px] font-bold uppercase text-theme-muted block">Gastos</span>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {worker.gastos_registrados}
                      </span>
                      <span className="text-[9px] text-theme-muted block truncate">
                        Bs. {worker.monto_total_ejecutado.toLocaleString('es-BO', { maximumFractionDigits: 0 })}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-theme-surface-subtle">
                      <span className="text-[10px] font-bold uppercase text-theme-muted block">Bitácora</span>
                      <span className="text-xs font-bold text-theme-main">{worker.total_acciones}</span>
                      <span className="text-[9px] text-theme-muted block">acciones</span>
                    </div>
                  </div>

                  {/* Última Acción Registrada */}
                  {hasRecentActivity && (
                    <div className="mb-4 p-2.5 rounded-xl bg-theme-surface-subtle text-[11px]">
                      <span className="text-[10px] uppercase font-bold text-theme-muted flex items-center gap-1 mb-1">
                        <Clock size={11} />
                        Último movimiento
                      </span>
                      <p className="line-clamp-1 text-theme-main font-mono text-[11px]">
                        {worker.ultima_actividad?.descripcion}
                      </p>
                      <span className="text-[10px] text-theme-muted mt-0.5 block">
                        {new Date(worker.ultima_actividad!.action_time).toLocaleString('es-BO', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Botón de Expediente */}
                <button
                  onClick={() => onOpenWorkerModal(worker.id)}
                  className="w-full py-2 px-3 rounded-xl border border-theme-border text-xs font-semibold text-theme-main hover:bg-theme-primary hover:text-theme-primaryText dark:hover:text-white hover:border-theme-primary transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm group-hover:border-theme-primary/50"
                >
                  <span>Ver Expediente Operativo</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
