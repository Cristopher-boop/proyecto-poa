import React, { useMemo } from 'react';
import { Edit2, Power, FileSpreadsheet } from 'lucide-react';
import { DataTable } from '../../../components/commons';
import type { Column } from '../../../components/commons/DataTable';
import type { Partida } from '../types/partidas.types';
import { getPartidaGrupo } from '../types/partidas.types';

interface PartidasTableProps {
  partidas: Partida[];
  loading: boolean;
  totalItems: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onEdit: (partida: Partida) => void;
  onToggleEstado: (partida: Partida) => void;
}

export const PartidasTable: React.FC<PartidasTableProps> = ({
  partidas,
  loading,
  totalItems,
  currentPage,
  pageSize,
  onPageChange,
  onEdit,
  onToggleEstado,
}) => {
  // rerender-memo: Memoizar la definición de columnas para evitar recomputaciones innecesarias
  const columns: Column<Partida>[] = useMemo(
    () => [
      {
        header: 'Código',
        width: '120px',
        render: (partida) => (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-theme-primary/10 text-theme-primary border border-theme-primary/20 tracking-wider">
            {partida.codigo}
          </span>
        ),
      },
      {
        header: 'Nombre / Denominación',
        minWidth: '220px',
        render: (partida) => {
          const grupo = getPartidaGrupo(partida.codigo);
          return (
            <div>
              <p className="font-semibold text-theme-main text-xs">{partida.nombre}</p>
              <span className="text-[10px] text-theme-muted block mt-0.5 sm:hidden">
                {grupo.nombre}
              </span>
            </div>
          );
        },
      },
      {
        header: 'Capítulo / Rubro',
        width: '210px',
        className: 'hidden sm:table-cell',
        render: (partida) => {
          const grupo = getPartidaGrupo(partida.codigo);
          return (
            <span className="inline-block text-[11px] font-medium text-theme-muted bg-theme-base/60 px-2 py-0.5 rounded-md border border-theme-border/60 max-w-[200px] truncate" title={grupo.nombre}>
              {grupo.nombre}
            </span>
          );
        },
      },
      {
        header: 'Clase',
        width: '100px',
        align: 'center',
        render: (partida) => {
          const isEgreso = (partida.clase || 'EGRESO').toUpperCase() === 'EGRESO';
          return (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                isEgreso
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800/60'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
              }`}
            >
              {partida.clase_display || (isEgreso ? 'Egreso' : 'Ingreso')}
            </span>
          );
        },
      },
      {
        header: 'Descripción / Alcance',
        minWidth: '180px',
        className: 'hidden md:table-cell',
        render: (partida) => (
          <p
            className="text-xs text-theme-muted line-clamp-1 max-w-xs"
            title={partida.descripcion || ''}
          >
            {partida.descripcion ? (
              partida.descripcion
            ) : (
              <span className="italic opacity-50 text-[11px]">Sin descripción</span>
            )}
          </p>
        ),
      },
      {
        header: 'Estado',
        width: '110px',
        align: 'center',
        render: (partida) => (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border select-none ${
              partida.estado
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                partida.estado
                  ? 'bg-emerald-600 dark:bg-emerald-400'
                  : 'bg-rose-600 dark:bg-rose-400'
              }`}
            />
            {partida.estado ? 'Activa' : 'Inactiva'}
          </span>
        ),
      },
      {
        header: 'Acciones',
        width: '95px',
        align: 'right',
        render: (partida) => (
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(partida);
              }}
              className="p-1.5 rounded-lg text-theme-muted hover:text-blue-600 hover:bg-blue-500/10 dark:hover:text-blue-400 transition-colors"
              title="Editar información de la partida"
              aria-label={`Editar partida ${partida.codigo}`}
            >
              <Edit2 size={15} />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleEstado(partida);
              }}
              className={`p-1.5 rounded-lg transition-colors ${
                partida.estado
                  ? 'text-theme-muted hover:text-rose-600 hover:bg-rose-500/10 dark:hover:text-rose-400'
                  : 'text-theme-muted hover:text-emerald-600 hover:bg-emerald-500/10 dark:hover:text-emerald-400'
              }`}
              title={partida.estado ? 'Desactivar partida (Baja lógica)' : 'Activar partida'}
              aria-label={partida.estado ? `Desactivar partida ${partida.codigo}` : `Activar partida ${partida.codigo}`}
            >
              <Power size={15} />
            </button>
          </div>
        ),
      },
    ],
    [onEdit, onToggleEstado]
  );

  return (
    <DataTable<Partida>
      columns={columns}
      data={partidas}
      keyExtractor={(item) => item.id}
      loading={loading}
      emptyMessage="No se encontraron partidas presupuestarias con los filtros seleccionados."
      emptyIcon={<FileSpreadsheet size={36} className="text-theme-muted/40 mx-auto" />}
      pagination={{
        currentPage,
        pageSize,
        totalItems,
        onPageChange,
      }}
    />
  );
};
