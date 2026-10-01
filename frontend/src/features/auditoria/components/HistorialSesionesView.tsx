import React, { useState, useMemo } from 'react';
import { Search, Shield, Building2, Calendar, Clock, CheckCircle2, XCircle, LogIn, X } from 'lucide-react';
import { DataTable, Column, Pagination, StatusBadge } from '../../../components/commons';
import { UserProfile } from '../../../services/authService';

interface HistorialSesionesViewProps {
  usuarios: UserProfile[];
  loading: boolean;
}

export const HistorialSesionesView: React.FC<HistorialSesionesViewProps> = ({ usuarios, loading }) => {
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
        (u.area_nombre || '').toLowerCase().includes(term)
    );
  }, [usuarios, searchTerm]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const columns: Column<UserProfile>[] = [
    {
      header: 'Servidor Público',
      width: '240px',
      render: (row) => {
        const fullName = `${row.first_name || ''} ${row.last_name || ''}`.trim() || row.username;
        return (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-theme-primary/10 text-theme-primary font-bold text-xs flex items-center justify-center shrink-0">
              {fullName.substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-theme-main truncate">{fullName}</p>
              <p className="text-[11px] text-theme-muted font-mono truncate">@{row.username}</p>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Área & Cargo',
      render: (row) => (
        <div className="min-w-0">
          <p className="text-xs font-semibold text-theme-main truncate">
            {row.area_nombre || 'Dirección General'}
          </p>
          <p className="text-[11px] text-theme-muted truncate">{row.cargo || 'Sin cargo asignado'}</p>
        </div>
      ),
    },
    {
      header: 'Rol en el POA',
      width: '180px',
      align: 'center',
      render: (row) => (
        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-theme-border/30 text-theme-main border border-theme-border">
          {row.is_superuser ? 'SUPERADMIN' : row.rol_nombre || 'USUARIO'}
        </span>
      ),
    },
    {
      header: 'Estado de Cuenta',
      width: '130px',
      align: 'center',
      render: (row) => (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
            row.estado
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
          }`}
        >
          {row.estado ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
          <span>{row.estado ? 'Habilitado' : 'Inactivo'}</span>
        </span>
      ),
    },
    {
      header: 'Último Acceso (Login)',
      width: '180px',
      render: (row) => {
        if (!row.last_login) {
          return <span className="text-[11px] text-theme-muted italic">Sin accesos registrados</span>;
        }
        const d = new Date(row.last_login);
        return (
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-theme-main font-mono">
              {d.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </span>
            <span className="text-[11px] text-theme-muted font-mono">
              {d.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        );
      },
    },
  ];

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
            placeholder="Buscar por usuario, nombre, rol o área..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-theme-surface-subtle border border-theme-border rounded-xl focus:outline-none focus:border-theme-primary text-theme-main placeholder:text-theme-muted transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-main"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="text-xs text-theme-muted self-end sm:self-center">
          Servidores registrados: <strong>{filtered.length}</strong>
        </div>
      </div>

      {/* Tabla de Sesiones */}
      <DataTable
        columns={columns}
        data={paginated}
        keyExtractor={(row) => row.id}
        loading={loading}
        emptyMessage="No se encontraron servidores con el término de búsqueda."
      />

      {/* Paginación */}
      {filtered.length > pageSize && (
        <Pagination
          currentPage={currentPage}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          itemLabel="servidores registrados"
        />
      )}
    </div>
  );
};
