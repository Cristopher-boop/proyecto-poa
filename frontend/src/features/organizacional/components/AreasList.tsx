import React, { useState, useEffect } from 'react';
import { Building2, Eye, Edit3, Power } from 'lucide-react';
import { Pagination } from '../../../components/commons';
import type { Area, Programa } from '../types/organizacional.types';
import { formatProgramaShort } from '../utils/organizacionalUtils';

interface AreasListProps {
  areas: Area[];
  programas: Programa[];
  onView: (area: Area) => void;
  onEdit: (area: Area) => void;
  onToggleEstado: (area: Area) => void;
}

export const AreasList: React.FC<AreasListProps> = ({
  areas,
  programas,
  onView,
  onEdit,
  onToggleEstado,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [areas.length]);

  if (areas.length === 0) {
    return (
      <div className="p-12 rounded-2xl border border-dashed border-theme-border bg-theme-surface text-center text-theme-muted space-y-3">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-700/60 flex items-center justify-center">
          <Building2 size={24} />
        </div>
        <div>
          <p className="text-sm font-semibold text-theme-main">No hay gerencias o unidades que coincidan con la búsqueda</p>
          <p className="text-xs text-theme-muted mt-0.5">
            Ajuste los filtros o presione "Nueva Gerencia / Unidad" para incorporar una gerencia o unidad a la estructura.
          </p>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(areas.length / pageSize);
  const activePage = Math.min(currentPage, Math.max(1, totalPages));
  const pagedAreas = areas.slice((activePage - 1) * pageSize, activePage * pageSize);

  return (
    <div className="rounded-2xl border border-theme-border bg-theme-surface shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-theme-base/60 border-b border-theme-border text-theme-muted uppercase tracking-wider font-semibold">
            <tr>
              <th className="py-3 px-4">Código</th>
              <th className="py-3 px-4">Gerencia / Unidad</th>
              <th className="py-3 px-4">Tipo</th>
              <th className="py-3 px-4">Programa</th>
              <th className="py-3 px-4">Secciones</th>
              <th className="py-3 px-4">Estado</th>
              <th className="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-theme-border">
            {pagedAreas.map((area) => {
              const progObj = programas.find((p) => p.id === area.programa);
              const progLabel = formatProgramaShort(progObj, area.programa_codigo, area.programa_nombre);
              const isActiva = area.estado;

              return (
                <tr
                  key={area.id}
                  className={`hover:bg-theme-border/20 transition-colors ${
                    !isActiva ? 'opacity-65 bg-theme-base/30' : ''
                  }`}
                >
                  {/* Código */}
                  <td className="py-3.5 px-4 font-mono font-bold whitespace-nowrap">
                    <span className="bg-blue-50 text-blue-700 border border-blue-200/90 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60 px-2 py-0.5 rounded-md text-[11px]">
                      {area.codigo}
                    </span>
                  </td>

                  {/* Nombre */}
                  <td className="py-3.5 px-4 font-semibold text-theme-main min-w-[200px]">
                    <div>
                      <p className="leading-tight">{area.nombre}</p>
                      {area.descripcion && (
                        <p className="text-[10px] text-theme-muted mt-0.5 line-clamp-1">
                          {area.descripcion}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Tipo */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                      {area.tipo === 'GERENCIA' ? 'Gerencia' : 'Unidad'}
                    </span>
                  </td>

                  {/* Programa Badge: "Programa X", NO PURPLE */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-900 border border-amber-200/90 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-800/50 font-mono">
                      {progLabel}
                    </span>
                  </td>

                  {/* Secciones Conteo */}
                  <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-theme-muted">
                    {area.secciones_count ?? area.secciones?.length ?? 0}
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
                        onClick={() => onView(area)}
                        className="p-1.5 rounded-lg text-theme-muted hover:text-theme-main hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Ver detalles del área"
                      >
                        <Eye size={15} />
                      </button>

                      {/* Lápiz: Editar */}
                      <button
                        type="button"
                        onClick={() => onEdit(area)}
                        className="p-1.5 rounded-lg text-theme-muted hover:text-theme-main hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Editar área"
                      >
                        <Edit3 size={15} />
                      </button>

                      {/* Botón de encendido / apagado */}
                      <button
                        type="button"
                        onClick={() => onToggleEstado(area)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isActiva
                            ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                            : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                        }`}
                        title={isActiva ? 'Desactivar área institucional' : 'Activar área institucional'}
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
        totalItems={areas.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        itemLabel="gerencias / unidades"
      />
    </div>
  );
};
