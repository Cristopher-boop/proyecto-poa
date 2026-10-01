import React, { useState, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  XCircle,
  X,
  Users,
  Shield,
  Building2,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { UserProfile } from '../../../services/authService';
import { Dropdown, DropdownItem } from '../../../components/commons';

const getRoleBadgeStyle = (rol: string, isSuper?: boolean) => {
  if (isSuper) {
    return 'bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/30 dark:border-purple-400/30';
  }
  const r = (rol || '').toUpperCase();
  if (r.includes('GERENTE') || r.includes('APROBADOR')) {
    return 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/30 dark:border-amber-400/30';
  }
  if (r.includes('PLANIFIC')) {
    return 'bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/30 dark:border-blue-400/30';
  }
  if (r.includes('ELABORADOR')) {
    return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/30 dark:border-emerald-400/30';
  }
  return 'bg-theme-border/30 text-theme-main border-theme-border';
};

interface HistorialAccesosTableProps {
  usuarios: UserProfile[];
  loading: boolean;
}

export const HistorialAccesosTable: React.FC<HistorialAccesosTableProps> = ({ usuarios, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('TODOS');
  const [selectedArea, setSelectedArea] = useState('TODAS');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const roleItems: DropdownItem[] = useMemo(() => {
    const set = new Set<string>();
    usuarios.forEach((u) => {
      if (u.is_superuser) set.add('SUPERADMINISTRADOR');
      else if (u.rol_nombre) set.add(u.rol_nombre);
    });
    return [
      { id: 'TODOS', label: 'Todos los Roles' },
      ...Array.from(set).sort().map((r) => ({
        id: r,
        label: r,
        triggerLabel: r.toUpperCase() === 'SUPERADMINISTRADOR' ? 'Superadmin' : r,
      })),
    ];
  }, [usuarios]);

  const areaItems: DropdownItem[] = useMemo(() => {
    const set = new Set<string>();
    usuarios.forEach((u) => {
      if (u.area_nombre) set.add(u.area_nombre);
    });
    return [
      { id: 'TODAS', label: 'Todas las Áreas' },
      ...Array.from(set).sort().map((a) => ({
        id: a,
        label: a,
        triggerLabel: a,
      })),
    ];
  }, [usuarios]);

  const filtered = useMemo(() => {
    return usuarios.filter((u) => {
      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        u.username.toLowerCase().includes(term) ||
        `${u.first_name} ${u.last_name}`.toLowerCase().includes(term) ||
        (u.rol_nombre || '').toLowerCase().includes(term) ||
        (u.area_nombre || '').toLowerCase().includes(term) ||
        (u.cargo || '').toLowerCase().includes(term);

      const matchRole =
        selectedRole === 'TODOS' ||
        (selectedRole === 'SUPERADMINISTRADOR' ? u.is_superuser : u.rol_nombre === selectedRole);

      const matchArea = selectedArea === 'TODAS' || u.area_nombre === selectedArea;

      return matchSearch && matchRole && matchArea;
    });
  }, [usuarios, searchTerm, selectedRole, selectedArea]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedRole, selectedArea]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  return (
    <div className="space-y-4">
      {/* Barra de Filtros de Accesos */}
      <div className="p-4 bg-theme-surface border border-theme-border rounded-2xl shadow-sm relative z-30 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 relative z-30 items-center">
          <div className="sm:col-span-6 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-theme-muted" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por usuario, servidor, rol o cargo..."
              className="block w-full pl-9 pr-8 py-2 bg-theme-base border border-theme-border rounded-xl text-theme-main text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-500 focus:border-slate-400 dark:focus:border-slate-500 transition-all placeholder:text-theme-muted"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-main p-0.5 rounded transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="sm:col-span-3">
            <Dropdown
              items={roleItems}
              value={selectedRole}
              onChange={(val) => setSelectedRole(String(val))}
              placeholder="Todos los Roles"
              icon={<Shield className="h-3.5 w-3.5 text-theme-muted" />}
              size="sm"
              searchable={false}
            />
          </div>

          <div className="sm:col-span-3">
            <Dropdown
              items={areaItems}
              value={selectedArea}
              onChange={(val) => setSelectedArea(String(val))}
              placeholder="Todas las Áreas"
              icon={<Building2 className="h-3.5 w-3.5 text-theme-muted" />}
              size="sm"
              searchable={areaItems.length > 5}
              searchPlaceholder="Buscar área..."
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-theme-muted pt-2.5 border-t border-theme-border/60">
          <span>
            Servidores registrados: <strong>{filtered.length}</strong>
          </span>
          {(searchTerm || selectedRole !== 'TODOS' || selectedArea !== 'TODAS') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedRole('TODOS');
                setSelectedArea('TODAS');
              }}
              className="text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw size={12} />
              <span>Limpiar filtros</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabla con Estilo de MCs */}
      <div className="bg-theme-surface rounded-2xl border border-theme-border overflow-hidden shadow-sm flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-theme-border bg-theme-base/60 text-xs font-semibold uppercase tracking-wider text-theme-muted">
                <th className="py-3.5 px-4 w-60">Servidor Público</th>
                <th className="py-3.5 px-4">Área & Cargo</th>
                <th className="py-3.5 px-4 w-40 text-center">Rol en el POA</th>
                <th className="py-3.5 px-4 w-32 text-center">Estado Cuenta</th>
                <th className="py-3.5 px-4 w-44">Último Acceso (Login)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-theme-muted">
                    <div className="inline-block w-6 h-6 border-2 border-theme-primary border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="font-semibold text-xs">Cargando servidores...</p>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-theme-muted">
                    <Users size={36} className="mx-auto mb-2 opacity-40" />
                    <p className="font-semibold text-xs text-theme-main">No se encontraron usuarios coincidentes</p>
                  </td>
                </tr>
              ) : (
                paginated.map((row) => {
                  const fullName = `${row.first_name || ''} ${row.last_name || ''}`.trim() || row.username;
                  const d = row.last_login ? new Date(row.last_login) : null;

                  return (
                    <tr key={row.id} className="hover:bg-theme-border/20 transition-colors group">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-400/15 dark:text-blue-300 border border-blue-500/20 dark:border-blue-400/25 font-bold text-xs flex items-center justify-center shrink-0">
                            {fullName.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-theme-main truncate text-xs group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{fullName}</p>
                            <span className="text-[11px] text-theme-muted font-mono block">@{row.username}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="min-w-0">
                          <p className="font-semibold text-theme-main truncate text-xs">
                            {row.area_nombre || 'Dirección General'}
                          </p>
                          <span className="text-[11px] text-theme-muted truncate block">
                            {row.cargo || 'Sin cargo asignado'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getRoleBadgeStyle(row.rol_nombre || '', row.is_superuser)}`}>
                          {row.is_superuser ? 'SUPERADMIN' : row.rol_nombre || 'USUARIO'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            row.estado
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                          }`}
                        >
                          {row.estado ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                          <span>{row.estado ? 'Habilitado' : 'Inactivo'}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {d ? (
                          <div>
                            <span className="font-semibold text-theme-main block text-xs">
                              {d.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </span>
                            <span className="text-[11px] font-mono text-theme-muted">
                              {d.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-theme-muted italic">Sin accesos registrados</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginador */}
        {filtered.length > pageSize && (
          <div className="px-4 py-3 border-t border-theme-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-theme-muted select-none">
            <div>
              Mostrando <strong className="text-theme-main font-semibold">{(currentPage - 1) * pageSize + 1}</strong> a{' '}
              <strong className="text-theme-main font-semibold">
                {Math.min(currentPage * pageSize, filtered.length)}
              </strong>{' '}
              de <strong className="text-theme-main font-semibold">{filtered.length}</strong> servidores
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
