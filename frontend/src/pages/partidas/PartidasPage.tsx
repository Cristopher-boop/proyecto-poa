import React, { useState, useCallback } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import {
  usePartidas,
  PartidasResumen,
  PartidasFilter,
  PartidasTable,
  PartidaModal,
  Partida,
} from '../../features/partidas';

export default function PartidasPage() {
  const {
    partidas,
    paginatedPartidas,
    loading,
    stats,
    gruposOpciones,
    search,
    activeTab,
    selectedGrupo,
    currentPage,
    pageSize,
    totalFiltrados,
    setSearch,
    setActiveTab,
    setSelectedGrupo,
    setCurrentPage,
    refetch,
    handleToggleEstado,
  } = usePartidas();

  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingPartida, setEditingPartida] = useState<Partida | null>(null);

  const handleCreateNew = useCallback(() => {
    setEditingPartida(null);
    setShowModal(true);
  }, []);

  const handleEdit = useCallback((partida: Partida) => {
    setEditingPartida(partida);
    setShowModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setEditingPartida(null);
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Cabecera Principal */}
      <div className="card p-6 bg-gradient-to-r from-theme-surface via-theme-surface to-brand-50/20 dark:to-brand-900/10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3.5 rounded-2xl bg-theme-primary/15 text-theme-primary shadow-sm">
              <FileSpreadsheet size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-6 rounded-full bg-theme-primary" />
                <span className="text-xs font-semibold uppercase tracking-widest text-theme-primary">
                  Clasificador Presupuestario
                </span>
              </div>
              <h1 className="text-2xl font-bold text-theme-main tracking-tight mt-0.5">
                Partidas Presupuestarias
              </h1>
              <p className="text-sm text-theme-muted">
                Catálogo oficial de partidas presupuestarias por objeto del gasto para la formulación del POA.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Indicadores Resumen (KPI Cards) */}
      <PartidasResumen stats={stats} />

      {/* Filtros, Pestañas y Acciones */}
      <PartidasFilter
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchTerm={search}
        onSearchChange={setSearch}
        selectedGrupo={selectedGrupo}
        onGrupoChange={setSelectedGrupo}
        gruposOpciones={gruposOpciones}
        stats={stats}
        totalFiltrados={totalFiltrados}
        loading={loading}
        onRefresh={refetch}
        onCreateNew={handleCreateNew}
      />

      {/* Tabla de Partidas */}
      <PartidasTable
        partidas={paginatedPartidas}
        loading={loading}
        totalItems={totalFiltrados}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onEdit={handleEdit}
        onToggleEstado={handleToggleEstado}
      />

      {/* Modal Crear / Editar (rendering-conditional-render: ternario) */}
      {showModal ? (
        <PartidaModal
          isOpen={showModal}
          partida={editingPartida}
          onClose={handleCloseModal}
          onSave={refetch}
        />
      ) : null}
    </div>
  );
}
