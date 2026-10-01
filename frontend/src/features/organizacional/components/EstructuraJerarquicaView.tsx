import React, { useState, useEffect } from 'react';
import { Building2, Layers3, ChevronRight } from 'lucide-react';
import { Pagination } from '../../../components/commons';
import type { HierarchicalAreaItem, Area } from '../types/organizacional.types';

interface EstructuraJerarquicaViewProps {
  items: HierarchicalAreaItem[];
  areas: Area[];
  onViewArea: (area: Area) => void;
  onEditArea?: (area: Area) => void;
  onToggleArea?: (area: Area) => void;
  onOpenCreateSeccionForArea?: (areaId: number) => void;
}

export const EstructuraJerarquicaView: React.FC<EstructuraJerarquicaViewProps> = ({
  items,
  areas,
  onViewArea,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Reset page when items filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [items.length]);

  if (items.length === 0) {
    return (
      <div className="p-12 rounded-2xl border border-dashed border-theme-border bg-theme-surface text-center text-theme-muted space-y-3">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-700/60 flex items-center justify-center">
          <Building2 size={24} />
        </div>
        <div>
          <p className="text-sm font-semibold text-theme-main">No hay gerencias o unidades que coincidan con la búsqueda</p>
          <p className="text-xs text-theme-muted mt-0.5">
            Ajuste los filtros o presione "Nueva Gerencia / Unidad" para incorporar una unidad a la estructura.
          </p>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(items.length / pageSize);
  const activePage = Math.min(currentPage, Math.max(1, totalPages));
  const pagedItems = items.slice((activePage - 1) * pageSize, activePage * pageSize);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {pagedItems.map((item) => {
          const fullArea = areas.find((a) => a.id === item.id) || {
            id: item.id,
            programa: item.programaId,
            codigo: item.codigo,
            nombre: item.nombre,
            tipo: item.tipo,
            descripcion: null,
            estado: item.estado,
            created_at: '',
            updated_at: '',
          };

          return (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => onViewArea(fullArea)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onViewArea(fullArea);
                }
              }}
              className={`p-4 rounded-2xl border border-theme-border bg-theme-surface hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-md transition-all flex flex-col justify-between gap-3 shadow-sm cursor-pointer group select-none ${
                !item.estado ? 'opacity-65 bg-theme-base/40' : ''
              }`}
              title="Haz clic para ver detalles y diagrama organizacional"
            >
              {/* Encabezado: Badges y Estado */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-mono font-bold text-xs bg-blue-50 text-blue-700 border border-blue-200/90 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60 px-2 py-0.5 rounded-md">
                      {item.codigo}
                    </span>

                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-900 border border-amber-200/90 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-800/50 font-mono">
                      {item.programaNombre}
                    </span>

                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                      {item.tipo_display}
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border select-none shrink-0 ${
                      item.estado
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50'
                        : 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        item.estado ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    />
                    {item.estado ? 'Activa' : 'Inactiva'}
                  </span>
                </div>

                {/* Nombre de la Gerencia / Unidad */}
                <div className="flex items-start gap-2 pt-1">
                  <Building2 size={16} className="text-theme-primary shrink-0 mt-0.5" />
                  <h3 className="text-xs sm:text-sm font-bold text-theme-main leading-snug group-hover:text-theme-primary transition-colors">
                    {item.nombre}
                  </h3>
                </div>
              </div>

              {/* Pie de tarjeta: Conteo de secciones y enlace sutil */}
              <div className="pt-2 border-t border-theme-border/60 flex items-center justify-between text-xs text-theme-muted">
                <div className="flex items-center gap-1.5">
                  <Layers3 size={13} className="text-theme-muted" />
                  <span className="font-medium text-[11px]">
                    {item.secciones.length}{' '}
                    {item.secciones.length === 1 ? 'sección dependiente' : 'secciones dependientes'}
                  </span>
                </div>

                <div className="flex items-center gap-0.5 text-[11px] font-semibold text-theme-primary group-hover:translate-x-0.5 transition-transform">
                  <span>Ver detalles</span>
                  <ChevronRight size={13} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Paginación */}
      <Pagination
        currentPage={activePage}
        totalItems={items.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        itemLabel="unidades en estructura"
        className="rounded-2xl border border-theme-border bg-theme-surface shadow-sm"
      />
    </div>
  );
};
