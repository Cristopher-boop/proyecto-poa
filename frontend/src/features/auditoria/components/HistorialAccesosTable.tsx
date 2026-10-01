import React, { useState, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  XCircle,
  X,
  Users,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { UserProfile } from '../../../services/authService';

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
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return usuarios;
    const term = searchTerm.toLowerCase().trim();
    return usuarios.filter(
      (u) =>
        u.username.toLowerCase().includes(term) ||
        `${u.first_name} ${u.last_name}`.toLowerCase().includes(term) ||
        (u.rol_nombre || '').toLowerCase().includes(term) ||
        (u.area_nombre || '').toLowerCase().includes(term) ||
        (u.cargo || '').toLowerCase().includes(term)
    );
  }, [usuarios, searchTerm]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  return (
    <div className="space-y-4">
      {/* Barra de Búsqueda */}
      <div className="card p-4 bg-theme-surface border border-theme-border rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted" size={15} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por usuario, servidor, rol o área..."
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

        <div className="text-xs text-theme-muted self-end sm:self-center">
          Servidores registrados: <strong className="text-theme-main">{filtered.length}</strong>
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
