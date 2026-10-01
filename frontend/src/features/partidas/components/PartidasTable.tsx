import React from 'react';
import { Eye, Edit3, Power, FileSpreadsheet } from 'lucide-react';
import { Pagination } from '../../../components/commons';
import type { Partida } from '../types/partidas.types';
import { getPartidaGrupo } from '../types/partidas.types';

interface PartidasTableProps {
  partidas: Partida[];
  loading: boolean;
  totalItems: number;
  currentPage: number;
  pageSize: number;
  canManage?: boolean;
  onPageChange: (page: number) => void;
  onView: (partida: Partida) => void;
  onEdit: (partida: Partida) => void;
  onToggleEstado: (partida: Partida) => void;
}

export const PartidasTable: React.FC<PartidasTableProps> = ({
  partidas,
  loading,
  totalItems,
  currentPage,
  pageSize,
  canManage = false,
  onPageChange,
  onView,
  onEdit,
  onToggleEstado,
}) => {
  if (loading && partidas.length === 0) {
    return (
      <div className="p-16 rounded-2xl border border-theme-border bg-theme-surface text-center text-theme-muted space-y-3 shadow-sm">
        <div className="animate-spin inline-block w-7 h-7 border-2 border-theme-primary border-t-transparent rounded-full" />
        <p className="text-xs font-semibold uppercase tracking-wider">
          Cargando catálogo de partidas...
        </p>
      </div>
    );
  }

  if (partidas.length === 0) {
    return (
      <div className="p-12 rounded-2xl border border-dashed border-theme-border bg-theme-surface text-center text-theme-muted space-y-3">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-700/60 flex items-center justify-center">
          <FileSpreadsheet size={24} />
        </div>
        <div>
          <p className="text-sm font-semibold text-theme-main">No hay partidas presupuestarias que coincidan</p>
          <p className="text-xs text-theme-muted mt-0.5">
            Ajuste los filtros o presione "Nueva Partida" para incorporar un clasificador al catálogo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-theme-border bg-theme-surface shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-theme-base/60 border-b border-theme-border text-theme-muted uppercase tracking-wider font-semibold">
            <tr>
              <th className="py-3 px-4">Código</th>
              <th className="py-3 px-4">Partida / Denominación</th>
              <th className="py-3 px-4">Capítulo / Rubro</th>
              <th className="py-3 px-4">Clase</th>
              <th className="py-3 px-4">Estado</th>
              <th className="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-theme-border">
            {partidas.map((partida) => {
              const grupo = getPartidaGrupo(partida.codigo);
              const isEgreso = (partida.clase || 'EGRESO').toUpperCase() === 'EGRESO';
              const isActiva = partida.estado;

              return (
                <tr
                  key={partida.id}
                  className={`hover:bg-theme-border/20 transition-colors ${
                    !isActiva ? 'opacity-65 bg-theme-base/30' : ''
                  }`}
                >
                  {/* Código */}
                  <td className="py-3.5 px-4 font-mono font-bold whitespace-nowrap">
                    <span className="bg-blue-50 text-blue-700 border border-blue-200/90 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60 px-2 py-0.5 rounded-md text-[11px]">
                      {partida.codigo}
                    </span>
                  </td>

                  {/* Denominación */}
                  <td className="py-3.5 px-4 font-semibold text-theme-main min-w-[220px]">
                    <div>
                      <p className="leading-tight">{partida.nombre}</p>
                      {partida.descripcion && (
                        <p className="text-[10px] text-theme-muted mt-0.5 line-clamp-1">
                          {partida.descripcion}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Capítulo / Rubro */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                      {grupo.nombre}
                    </span>
                  </td>

                  {/* Clase */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-900 border border-amber-200/90 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-800/50 font-mono">
                      {isEgreso ? 'Egreso' : 'Ingreso'}
                    </span>
                  </td>

                  {/* Estado */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border select-none ${
                        isActiva
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50'
                          : 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isActiva ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      />
                      {isActiva ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>

                  {/* Acciones */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Ojito: Ver detalles */}
                      <button
                        type="button"
                        onClick={() => onView(partida)}
                        className="p-1.5 rounded-lg text-theme-muted hover:text-theme-main hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Ver detalles de la partida"
                      >
                        <Eye size={15} />
                      </button>

                      {/* Lápiz: Editar */}
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => onEdit(partida)}
                          className="p-1.5 rounded-lg text-theme-muted hover:text-theme-main hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Editar partida"
                        >
                          <Edit3 size={15} />
                        </button>
                      )}

                      {/* Botón de encendido / apagado */}
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => onToggleEstado(partida)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isActiva
                              ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                              : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                          }`}
                          title={isActiva ? 'Desactivar partida' : 'Activar partida'}
                        >
                          <Power size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Paginación Estandarizada */}
      <Pagination
        currentPage={currentPage}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={onPageChange}
        itemLabel="partidas presupuestarias"
      />
    </div>
  );
};
