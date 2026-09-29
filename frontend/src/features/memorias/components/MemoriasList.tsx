import React, { useState } from 'react';
import { MemoriaCalculo } from '../api/memoriasApi';
import { Eye, Edit3, Trash2, Send, FileText } from 'lucide-react';
import { Pagination } from '../../../components/commons';

interface MemoriasListProps {
  memorias: MemoriaCalculo[];
  loading: boolean;
  canCreate: boolean;
  isElaborador?: boolean;
  isGerente: boolean;
  isPlanificador: boolean;
  isAprobador: boolean;
  isSuperuser?: boolean;
  onView: (id: number) => void;
  onEdit: (memoria: MemoriaCalculo) => void;
  onDelete: (id: number) => void;
  onEnviarGerencia?: (id: number) => void;
}

export const MemoriasList: React.FC<MemoriasListProps> = ({
  memorias,
  loading,
  canCreate,
  isElaborador = false,
  isGerente,
  isPlanificador,
  isAprobador,
  isSuperuser = false,
  onView,
  onEdit,
  onDelete,
  onEnviarGerencia
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  if (loading) {
    return (
      <div className="bg-theme-surface rounded-xl border border-theme-border p-8 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary"></div>
      </div>
    );
  }

  const totalPages = Math.ceil(memorias.length / itemsPerPage);
  const currentItems = memorias.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  return (
    <div className="bg-theme-surface rounded-xl border border-theme-border flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-theme-border bg-theme-base/60 text-xs font-semibold uppercase tracking-wider text-theme-muted">
              <th className="py-3.5 px-4">Código</th>
              <th className="py-3.5 px-4">Área</th>
              <th className="py-3.5 px-4">Partida Presupuestaria</th>
              <th className="py-3.5 px-4">Justificación</th>
              <th className="py-3.5 px-4 text-center">Ítems</th>
              <th className="py-3.5 px-4 text-right">Total Presupuestado</th>
              <th className="py-3.5 px-4 text-center">Estado</th>
              <th className="py-3.5 px-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-theme-border">
            {currentItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-theme-muted">
                  <FileText size={36} className="mx-auto mb-2 opacity-40" />
                  <p className="font-medium">No se encontraron memorias en esta bandeja.</p>
                </td>
              </tr>
            ) : (
              currentItems.map((mem) => {
                const memoria = mem as any;
                const total = parseFloat(String(memoria.total_presupuestado || memoria.total_presupuesto || '0'));
                const formatMoney = (val: any) => new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(Number(val) || 0);

                const getEstadoBadge = (estado: string) => {
                  const est = estado || '';
                  if (est.includes('BORRADOR')) return <span className="px-2 py-0.5 bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500/20 rounded-md text-[10px] font-bold">Borrador</span>;
                  if (est.includes('GERENCIA')) return <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-md text-[10px] font-bold">Rev. Gerencia</span>;
                  if (est.includes('PLANIFICACION')) return <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-md text-[10px] font-bold">Rev. Planificación</span>;
                  if (est.includes('FINANZAS')) return <span className="px-2 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 rounded-md text-[10px] font-bold">Aprobado</span>;
                  if (est.includes('RECHAZADO')) return <span className="px-2 py-0.5 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 rounded-md text-[10px] font-bold">Rechazado</span>;
                  return <span className="px-2 py-0.5 bg-theme-border/30 text-theme-muted rounded-md text-[10px] font-bold">{est.replace(/_/g, ' ')}</span>;
                };

                return (
                  <tr key={memoria.id} className="transition-all duration-500 hover:bg-theme-border/20">
                    <td className="py-3.5 px-4 font-mono font-bold text-xs text-theme-main">{memoria.codigo}</td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-theme-main text-xs">{memoria.area_nombre || memoria.seccion_nombre}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-mono font-bold text-xs text-theme-main">{memoria.partida_codigo || 'Partida'}</p>
                      <p className="text-[11px] text-theme-muted line-clamp-1">{memoria.partida_nombre || 'Sin partida'}</p>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-xs text-theme-main line-clamp-2">{memoria.justificacion}</p>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-theme-primary/10 text-theme-primary">
                        {memoria.total_items ?? (memoria.detalles ? memoria.detalles.length : 0)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-theme-main text-xs">{formatMoney(total)}</td>
                    <td className="py-3.5 px-4 text-center">
                      {getEstadoBadge(memoria.estado)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {(() => {
                        const isAprobada = Boolean(memoria.estado && memoria.estado.includes('APROBADO'));
                        const canEditMemoria = !isAprobada && (isSuperuser || isAprobador || isGerente || isElaborador);
                        const canDeleteMemoria = memoria.estado === 'BORRADOR' && (isSuperuser || isGerente || isElaborador);

                        return (
                          <div className="flex items-center justify-center gap-1">
                            {/* Ojito - Ver Ficha Técnica para todos los roles */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onView(memoria.id);
                              }}
                              className="p-1.5 text-theme-muted hover:text-indigo-500 hover:bg-indigo-500/10 rounded-lg transition-colors"
                              title="Ver Ficha Técnica y Detalles"
                              aria-label={`Ver detalle de ${memoria.codigo}`}
                            >
                              <Eye size={16} />
                            </button>

                            {/* Lápiz - Modificar solo si NO ha sido aprobada */}
                            {canEditMemoria && (
                              <button
                                type="button"
                                onClick={(e) => {
                                e.stopPropagation();
                                onEdit(memoria);
                              }}
                              className="p-1.5 text-theme-muted hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors"
                              title="Editar Memoria de Cálculo"
                              aria-label={`Editar ${memoria.codigo}`}
                            >
                              <Edit3 size={16} />
                            </button>
                          )}

                          {/* Basurero - Eliminar solo si está en BORRADOR */}
                          {canDeleteMemoria && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(memoria.id);
                              }}
                              className="p-1.5 text-theme-muted hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                              title="Eliminar Memoria en Borrador"
                              aria-label={`Eliminar ${memoria.codigo}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      );
                    })()}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      <Pagination
        currentPage={currentPage}
        totalItems={memorias.length}
        pageSize={itemsPerPage}
        onPageChange={setCurrentPage}
        itemLabel="resultados"
      />
    </div>
  );
};
