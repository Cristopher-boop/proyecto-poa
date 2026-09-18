import React from 'react';
import { Loader2, Inbox, ChevronLeft, ChevronRight } from 'lucide-react';

export interface Column<T> {
  header: React.ReactNode;
  accessor?: keyof T | ((row: T) => React.ReactNode);
  render?: (row: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string;
  minWidth?: string;
  maxWidth?: string;
  className?: string;
}

export interface PaginationConfig {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string | number;
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  onRowClick?: (row: T) => void;
  pagination?: PaginationConfig;
  className?: string;
  tableClassName?: string;
  layout?: 'auto' | 'fixed';
  minWidth?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  emptyMessage = 'No se encontraron registros.',
  emptyIcon,
  onRowClick,
  pagination,
  className = '',
  tableClassName = '',
  layout,
  minWidth,
}: DataTableProps<T>) {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  const totalPages = pagination
    ? Math.max(1, Math.ceil(pagination.totalItems / pagination.pageSize))
    : 1;

  const isFixed = layout === 'fixed' || (layout !== 'auto' && columns.some((c) => Boolean(c.width)));

  const getColStyle = (col: Column<T>): React.CSSProperties => {
    const style: React.CSSProperties = {};
    if (col.width) style.width = col.width;
    if (col.minWidth) style.minWidth = col.minWidth;
    if (col.maxWidth) style.maxWidth = col.maxWidth;
    return style;
  };

  return (
    <div className={`bg-theme-surface rounded-2xl border border-theme-border overflow-hidden shadow-sm ${className}`}>
      <div className="overflow-x-auto">
        <table
          className={`w-full text-left text-xs border-collapse ${isFixed ? 'table-fixed' : ''} ${tableClassName}`}
          style={minWidth ? { minWidth } : undefined}
        >
          <colgroup>
            {columns.map((col, idx) => (
              <col key={idx} style={getColStyle(col)} />
            ))}
          </colgroup>
          <thead>
            <tr className="border-b border-theme-border bg-theme-base/60 text-[11px] font-bold uppercase tracking-wider text-theme-muted select-none">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  style={getColStyle(col)}
                  className={`py-3.5 px-4 ${alignClasses[col.align || 'left']} ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-theme-border">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center text-theme-muted">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-7 h-7 animate-spin text-theme-primary" />
                    <span className="font-semibold text-xs text-theme-main">Cargando registros...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center text-theme-muted">
                  <div className="flex flex-col items-center justify-center gap-2">
                    {emptyIcon || <Inbox size={36} className="text-theme-muted/50" />}
                    <p className="font-medium text-xs text-theme-main">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => {
                const isClickable = Boolean(onRowClick);
                return (
                  <tr
                    key={keyExtractor(row, rowIdx)}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={`transition-colors duration-150 ${
                      isClickable
                        ? 'cursor-pointer hover:bg-theme-border/25 active:bg-theme-border/35'
                        : 'hover:bg-theme-border/15'
                    }`}
                  >
                    {columns.map((col, colIdx) => {
                      let cellContent: React.ReactNode = null;
                      if (col.render) {
                        cellContent = col.render(row, rowIdx);
                      } else if (col.accessor) {
                        if (typeof col.accessor === 'function') {
                          cellContent = col.accessor(row);
                        } else {
                          cellContent = row[col.accessor] as unknown as React.ReactNode;
                        }
                      }

                      return (
                        <td
                          key={colIdx}
                          style={getColStyle(col)}
                          className={`py-3.5 px-4 ${alignClasses[col.align || 'left']} ${col.className || ''}`}
                        >
                          {cellContent}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación opcional */}
      {pagination && pagination.totalItems > 0 && (
        <div className="px-4 py-3 border-t border-theme-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-theme-muted bg-theme-base/30">
          <div>
            Mostrando{' '}
            <strong className="text-theme-main font-bold">
              {Math.min(
                (pagination.currentPage - 1) * pagination.pageSize + 1,
                pagination.totalItems
              )}
            </strong>{' '}
            a{' '}
            <strong className="text-theme-main font-bold">
              {Math.min(
                pagination.currentPage * pagination.pageSize,
                pagination.totalItems
              )}
            </strong>{' '}
            de <strong className="text-theme-main font-bold">{pagination.totalItems}</strong> registros
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1}
              className="p-1.5 rounded-lg border border-theme-border text-theme-main hover:bg-theme-border/20 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              aria-label="Página anterior"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="px-3 font-semibold text-theme-main font-mono">
              {pagination.currentPage} / {totalPages}
            </span>

            <button
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= totalPages}
              className="p-1.5 rounded-lg border border-theme-border text-theme-main hover:bg-theme-border/20 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              aria-label="Página siguiente"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
