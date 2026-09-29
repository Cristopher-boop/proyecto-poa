import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
  itemLabel?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  className = '',
  itemLabel = 'registros',
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers with smart ellipsis
  let pages: (number | string)[] = [];
  if (totalPages <= 7) {
    pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  } else if (currentPage <= 4) {
    pages = [1, 2, 3, 4, 5, 'ellipsis-end', totalPages];
  } else if (currentPage >= totalPages - 3) {
    pages = [1, 'ellipsis-start', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  } else {
    pages = [1, 'ellipsis-start', currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2, 'ellipsis-end', totalPages];
  }

  return (
    <div
      className={`px-4 py-3 border-t border-theme-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-theme-muted select-none ${className}`}
    >
      <div>
        Mostrando <strong className="text-theme-main font-semibold">{startItem}</strong> a{' '}
        <strong className="text-theme-main font-semibold">{endItem}</strong> de{' '}
        <strong className="text-theme-main font-semibold">{totalItems}</strong> {itemLabel}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          {/* Primera página */}
          <button
            type="button"
            onClick={() => onPageChange(1)}
            disabled={currentPage <= 1}
            className="p-1.5 rounded-lg border border-theme-border text-theme-muted hover:text-theme-main hover:bg-theme-border/20 disabled:opacity-25 disabled:pointer-events-none transition-colors cursor-pointer"
            title="Primera página"
            aria-label="Primera página"
          >
            <ChevronsLeft size={15} />
          </button>

          {/* Página anterior */}
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-1.5 rounded-lg border border-theme-border text-theme-muted hover:text-theme-main hover:bg-theme-border/20 disabled:opacity-25 disabled:pointer-events-none transition-colors cursor-pointer"
            title="Página anterior"
            aria-label="Página anterior"
          >
            <ChevronLeft size={15} />
          </button>

          {/* Números de página */}
          {pages.map((p, idx) => {
            if (typeof p === 'string') {
              return (
                <span key={`${p}-${idx}`} className="px-1 text-xs text-theme-muted font-mono">
                  ...
                </span>
              );
            }

            const isCurrent = p === currentPage;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={`min-w-[28px] h-7 px-1.5 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer ${
                  isCurrent
                    ? 'bg-theme-primary text-theme-primaryText shadow-xs font-bold'
                    : 'text-theme-muted hover:text-theme-main hover:bg-theme-border/20'
                }`}
              >
                {p}
              </button>
            );
          })}

          {/* Página siguiente */}
          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-1.5 rounded-lg border border-theme-border text-theme-muted hover:text-theme-main hover:bg-theme-border/20 disabled:opacity-25 disabled:pointer-events-none transition-colors cursor-pointer"
            title="Página siguiente"
            aria-label="Página siguiente"
          >
            <ChevronRight size={15} />
          </button>

          {/* Última página */}
          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage >= totalPages}
            className="p-1.5 rounded-lg border border-theme-border text-theme-muted hover:text-theme-main hover:bg-theme-border/20 disabled:opacity-25 disabled:pointer-events-none transition-colors cursor-pointer"
            title="Última página"
            aria-label="Última página"
          >
            <ChevronsRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
};
