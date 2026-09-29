import React, { useState, useCallback } from 'react';
import {
  usePartidas,
  PartidasHeader,
  PartidasResumen,
  PartidasFilter,
  PartidasTable,
  PartidaModal,
  PartidaDetalleModal,
  type Partida,
} from '../../features/partidas';

export default function PartidasPage() {
  const {
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
    canManage,
    setSearch,
    setActiveTab,
    setSelectedGrupo,
    setCurrentPage,
    refetch,
    handleToggleEstado,
  } = usePartidas();

  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingPartida, setEditingPartida] = useState<Partida | null>(null);
  const [viewingPartida, setViewingPartida] = useState<Partida | null>(null);

  const handleCreateNew = useCallback(() => {
    setEditingPartida(null);
    setShowModal(true);
  }, []);

  const handleEdit = useCallback((partida: Partida) => {
    setEditingPartida(partida);
    setShowModal(true);
  }, []);

  const handleView = useCallback((partida: Partida) => {
    setViewingPartida(partida);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setEditingPartida(null);
  }, []);

  const handleCloseViewModal = useCallback(() => {
    setViewingPartida(null);
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 px-2 sm:px-4">
      {/* 1. Cabecera Principal */}
      <PartidasHeader
        canManage={canManage}
        onCreateNew={handleCreateNew}
      />

      {/* 2. Indicadores Resumen (KPI Cards) */}
      <PartidasResumen stats={stats} />

      {/* 3. Filtros y Búsqueda (Buscador, Capítulo y Filtro de Estado Todas/Activas/Inactivas) */}
      <PartidasFilter
        searchTerm={search}
        onSearchChange={setSearch}
        selectedGrupo={selectedGrupo}
        onGrupoChange={setSelectedGrupo}
        gruposOpciones={gruposOpciones}
        selectedEstado={activeTab}
        onEstadoChange={setActiveTab}
        stats={stats}
        totalFiltrados={totalFiltrados}
        loading={loading}
        onRefresh={refetch}
      />

      {/* 4. Tabla de Partidas con Paginación Centralizada */}
      <PartidasTable
        partidas={paginatedPartidas}
        loading={loading}
        totalItems={totalFiltrados}
        currentPage={currentPage}
        pageSize={pageSize}
        canManage={canManage}
        onPageChange={setCurrentPage}
        onView={handleView}
        onEdit={handleEdit}
        onToggleEstado={handleToggleEstado}
      />

      {/* Modales: Crear / Editar y Detalle */}
      {showModal && (
        <PartidaModal
          isOpen={showModal}
          partida={editingPartida}
          onClose={handleCloseModal}
          onSave={refetch}
        />
      )}

      {viewingPartida && (
        <PartidaDetalleModal
          isOpen={Boolean(viewingPartida)}
          partida={viewingPartida}
          canManage={canManage}
          onClose={handleCloseViewModal}
          onEdit={(p) => {
            handleCloseViewModal();
            handleEdit(p);
          }}
        />
      )}
    </div>
  );
}
