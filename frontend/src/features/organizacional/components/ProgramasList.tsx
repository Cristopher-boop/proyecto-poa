import React, { useState, useEffect } from 'react';
import { FolderTree, Eye, Edit3, Power } from 'lucide-react';
import { Pagination } from '../../../components/commons';
import type { Programa } from '../types/organizacional.types';
import { formatProgramaShort } from '../utils/organizacionalUtils';

interface ProgramasListProps {
  programas: Programa[];
  onView: (prog: Programa) => void;
  onEdit: (prog: Programa) => void;
  onToggleEstado: (prog: Programa) => void;
}

export const ProgramasList: React.FC<ProgramasListProps> = ({
  programas,
  onView,
  onEdit,
  onToggleEstado,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [programas.length]);

  if (programas.length === 0) {
    return (
      <div className="p-12 rounded-2xl border border-dashed border-theme-border bg-theme-surface text-center text-theme-muted space-y-3">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-700/60 flex items-center justify-center">
          <FolderTree size={24} />
        </div>
        <div>
          <p className="text-sm font-semibold text-theme-main">No hay programas registrados</p>
          <p className="text-xs text-theme-muted mt-0.5">
            Ajuste los filtros o presione "Nuevo Programa" para incorporar un programa institucional.
          </p>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(programas.length / pageSize);
  const activePage = Math.min(currentPage, Math.max(1, totalPages));
  const pagedProgramas = programas.slice((activePage - 1) * pageSize, activePage * pageSize);

  return (
    <div className="rounded-2xl border border-theme-border bg-theme-surface shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-theme-base/60 border-b border-theme-border text-theme-muted uppercase tracking-wider font-semibold">
            <tr>
              <th className="py-3 px-4">Programa</th>
              <th className="py-3 px-4">Descripción</th>
              <th className="py-3 px-4">Áreas Activas</th>
              <th className="py-3 px-4">Estado</th>
              <th className="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-theme-border">
            {pagedProgramas.map((prog) => {
              const isActivo = prog.estado;
              // Clean program display: "Programa X", NO BREAKDOWN!
              const shortTitle = formatProgramaShort(prog);

              return (
                <tr
                  key={prog.id}
                  className={`hover:bg-theme-border/20 transition-colors ${
                    !isActivo ? 'opacity-65 bg-theme-base/30' : ''
                  }`}
                >
                  {/* Nombre Programa (Clean "Programa X") */}
                  <td className="py-3.5 px-4 font-semibold text-theme-main min-w-[200px]">
                    <span className="text-xs sm:text-sm font-semibold">{shortTitle}</span>
                  </td>

                  {/* Descripción */}
                  <td className="py-3.5 px-4 text-theme-muted max-w-sm truncate">
                    {prog.descripcion || <span className="italic opacity-60">Sin descripción</span>}
                  </td>

                  {/* Áreas Activas Conteo */}
                  <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-theme-muted">
                    {prog.areas_count ?? prog.areas?.length ?? 0}
                  </td>

                  {/* Estado */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border select-none ${
                        isActivo
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50'
                          : 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isActivo ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      />
                      {isActivo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>

                  {/* Acciones */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Ojito: Ver detalles */}
                      <button
                        type="button"
                        onClick={() => onView(prog)}
                        className="p-1.5 rounded-lg text-theme-muted hover:text-theme-main hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Ver detalles del programa"
                      >
                        <Eye size={15} />
                      </button>

                      {/* Lápiz: Editar */}
                      <button
                        type="button"
                        onClick={() => onEdit(prog)}
                        className="p-1.5 rounded-lg text-theme-muted hover:text-theme-main hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Editar programa"
                      >
                        <Edit3 size={15} />
                      </button>

                      {/* Botón de encendido / apagado */}
                      <button
                        type="button"
                        onClick={() => onToggleEstado(prog)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isActivo
                            ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                            : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                        }`}
                        title={isActivo ? 'Desactivar programa' : 'Activar programa'}
                      >
                        <Power size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <Pagination
        currentPage={activePage}
        totalItems={programas.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        itemLabel="programas presupuestarios"
      />
    </div>
  );
};
