import React, { useState, useEffect } from 'react';
import { Layers3, Eye, Edit3, Power } from 'lucide-react';
import { Pagination } from '../../../components/commons';
import type { Seccion, Area } from '../types/organizacional.types';

interface SeccionesListProps {
  secciones: Seccion[];
  areas: Area[];
  onView: (sec: Seccion) => void;
  onEdit: (sec: Seccion) => void;
  onToggleEstado: (sec: Seccion) => void;
}

export const SeccionesList: React.FC<SeccionesListProps> = ({
  secciones,
  areas,
  onView,
  onEdit,
  onToggleEstado,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [secciones.length]);

  if (secciones.length === 0) {
    return (
      <div className="p-12 rounded-2xl border border-dashed border-theme-border bg-theme-surface text-center text-theme-muted space-y-3">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-700/60 flex items-center justify-center">
          <Layers3 size={24} />
        </div>
        <div>
          <p className="text-sm font-semibold text-theme-main">No hay secciones que coincidan con la búsqueda</p>
          <p className="text-xs text-theme-muted mt-0.5">
            Ajuste los filtros o presione "Nueva Sección" para agregar una unidad operativa.
          </p>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(secciones.length / pageSize);
  const activePage = Math.min(currentPage, Math.max(1, totalPages));
  const pagedSecciones = secciones.slice((activePage - 1) * pageSize, activePage * pageSize);

  return (
    <div className="rounded-2xl border border-theme-border bg-theme-surface shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-theme-base/80 border-b border-theme-border text-theme-muted uppercase tracking-wider font-semibold">
            <tr>
              <th className="py-3 px-4">Sección Operativa</th>
              <th className="py-3 px-4">Gerencia / Unidad Dependiente</th>
              <th className="py-3 px-4">Descripción</th>
              <th className="py-3 px-4">Estado</th>
              <th className="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-theme-border/50">
            {pagedSecciones.map((sec) => {
              const parentArea = areas.find((a) => a.id === sec.area);
              const isActiva = sec.estado;

              return (
                <tr
                  key={sec.id}
                  className={`hover:bg-theme-base/50 transition-colors ${
                    !isActiva ? 'opacity-65 bg-theme-base/30' : ''
                  }`}
                >
                  {/* Nombre Sección */}
                  <td className="py-3.5 px-4 font-semibold text-theme-main min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          isActiva ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}
                      />
                      <span>{sec.nombre}</span>
                    </div>
                  </td>

                  {/* Área Dependiente */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {parentArea ? (
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 px-1.5 py-0.5 rounded">
                          {parentArea.codigo}
                        </span>
                        <span className="text-theme-main font-medium">{parentArea.nombre}</span>
                      </div>
                    ) : (
                      <span className="text-theme-muted italic">Área ID: {sec.area}</span>
                    )}
                  </td>

                  {/* Descripción */}
                  <td className="py-3.5 px-4 text-theme-muted max-w-xs truncate">
                    {sec.descripcion || <span className="italic opacity-60">Sin descripción</span>}
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
                        onClick={() => onView(sec)}
                        className="p-1.5 rounded-lg text-theme-muted hover:text-theme-main hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Ver detalles de la sección"
                      >
                        <Eye size={15} />
                      </button>

                      {/* Lápiz: Editar */}
                      <button
                        type="button"
                        onClick={() => onEdit(sec)}
                        className="p-1.5 rounded-lg text-theme-muted hover:text-theme-main hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Editar sección"
                      >
                        <Edit3 size={15} />
                      </button>

                      {/* Botón de encendido / apagado */}
                      <button
                        type="button"
                        onClick={() => onToggleEstado(sec)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isActiva
                            ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                            : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                        }`}
                        title={isActiva ? 'Desactivar sección' : 'Activar sección'}
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
        totalItems={secciones.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        itemLabel="secciones operativas"
      />
    </div>
  );
};
