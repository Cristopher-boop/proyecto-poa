import React from 'react';
import {
  useOrganizacional,
  OrganizacionalHeader,
  OrganizacionalFilter,
  EstructuraJerarquicaView,
  AreasList,
  SeccionesList,
  ProgramasList,
  AreaModal,
  AreaDetalleModal,
  SeccionModal,
  SeccionDetalleModal,
  ProgramaModal,
  ProgramaDetalleModal,
} from '../../features/organizacional';

export default function OrganizacionalPage() {
  const {
    activeTab,
    setActiveTab,
    loading,

    // Filters
    searchTerm,
    setSearchTerm,
    selectedPrograma,
    setSelectedPrograma,
    selectedTipo,
    setSelectedTipo,
    selectedEstado,
    setSelectedEstado,
    handleResetFilters,

    // Lists
    programas,
    areas,
    filteredAreas,
    filteredSecciones,
    filteredProgramas,
    hierarchicalItems,

    // Counts
    areasCount,
    seccionesCount,
    programasCount,
    totalCount,

    // Modals: Area
    showAreaModal,
    setShowAreaModal,
    editingArea,
    showAreaDetalleModal,
    setShowAreaDetalleModal,
    viewingArea,
    handleOpenCreateArea,
    handleOpenEditArea,
    handleOpenViewArea,
    handleSaveArea,
    handleToggleArea,

    // Modals: Seccion
    showSeccionModal,
    setShowSeccionModal,
    editingSeccion,
    showSeccionDetalleModal,
    setShowSeccionDetalleModal,
    viewingSeccion,
    handleOpenCreateSeccion,
    handleOpenEditSeccion,
    handleOpenViewSeccion,
    handleSaveSeccion,
    handleToggleSeccion,

    // Modals: Programa
    showProgramaModal,
    setShowProgramaModal,
    editingPrograma,
    showProgramaDetalleModal,
    setShowProgramaDetalleModal,
    viewingPrograma,
    handleOpenCreatePrograma,
    handleOpenEditPrograma,
    handleOpenViewPrograma,
    handleSavePrograma,
    handleTogglePrograma,
  } = useOrganizacional();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 px-2 sm:px-4">
      {/* 1. Cabecera Institucional y Pestañas */}
      <OrganizacionalHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        areasCount={areasCount}
        seccionesCount={seccionesCount}
        programasCount={programasCount}
        totalCount={totalCount}
        onOpenCreateArea={handleOpenCreateArea}
        onOpenCreateSeccion={() => handleOpenCreateSeccion()}
        onOpenCreatePrograma={handleOpenCreatePrograma}
      />

      {/* 2. Barra de Búsqueda y Filtros */}
      <OrganizacionalFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedPrograma={selectedPrograma}
        onProgramaChange={setSelectedPrograma}
        selectedTipo={selectedTipo}
        onTipoChange={setSelectedTipo}
        selectedEstado={selectedEstado}
        onEstadoChange={setSelectedEstado}
        programas={programas}
        onResetFilters={handleResetFilters}
      />

      {/* 3. Contenido Principal */}
      {loading ? (
        <div className="p-16 rounded-2xl border border-theme-border bg-theme-surface text-center text-theme-muted space-y-3 shadow-sm">
          <div className="animate-spin inline-block w-7 h-7 border-2 border-theme-primary border-t-transparent rounded-full" />
          <p className="text-xs font-semibold uppercase tracking-wider">
            Sincronizando estructura institucional...
          </p>
        </div>
      ) : (
        <>
          {activeTab === 'JERARQUIA' && (
            <EstructuraJerarquicaView
              items={hierarchicalItems}
              areas={areas}
              onViewArea={handleOpenViewArea}
              onEditArea={handleOpenEditArea}
              onToggleArea={handleToggleArea}
              onOpenCreateSeccionForArea={handleOpenCreateSeccion}
            />
          )}

          {activeTab === 'AREAS' && (
            <AreasList
              areas={filteredAreas}
              programas={programas}
              onView={handleOpenViewArea}
              onEdit={handleOpenEditArea}
              onToggleEstado={handleToggleArea}
            />
          )}

          {activeTab === 'SECCIONES' && (
            <SeccionesList
              secciones={filteredSecciones}
              areas={areas}
              onView={handleOpenViewSeccion}
              onEdit={handleOpenEditSeccion}
              onToggleEstado={handleToggleSeccion}
            />
          )}

          {activeTab === 'PROGRAMAS' && (
            <ProgramasList
              programas={filteredProgramas}
              onView={handleOpenViewPrograma}
              onEdit={handleOpenEditPrograma}
              onToggleEstado={handleTogglePrograma}
            />
          )}
        </>
      )}

      {/* Modales: Áreas */}
      <AreaModal
        isOpen={showAreaModal}
        onClose={() => setShowAreaModal(false)}
        onSave={handleSaveArea}
        editingArea={editingArea}
        programas={programas}
      />
      <AreaDetalleModal
        isOpen={showAreaDetalleModal}
        onClose={() => setShowAreaDetalleModal(false)}
        area={viewingArea}
        programas={programas}
        onEdit={handleOpenEditArea}
        canEdit={activeTab !== 'JERARQUIA'}
      />

      {/* Modales: Secciones */}
      <SeccionModal
        isOpen={showSeccionModal}
        onClose={() => setShowSeccionModal(false)}
        onSave={handleSaveSeccion}
        editingSeccion={editingSeccion}
        areas={areas}
      />
      <SeccionDetalleModal
        isOpen={showSeccionDetalleModal}
        onClose={() => setShowSeccionDetalleModal(false)}
        seccion={viewingSeccion}
        areas={areas}
        onEdit={handleOpenEditSeccion}
      />

      {/* Modales: Programas */}
      <ProgramaModal
        isOpen={showProgramaModal}
        onClose={() => setShowProgramaModal(false)}
        onSave={handleSavePrograma}
        editingPrograma={editingPrograma}
      />
      <ProgramaDetalleModal
        isOpen={showProgramaDetalleModal}
        onClose={() => setShowProgramaDetalleModal(false)}
        programa={viewingPrograma}
        onEdit={handleOpenEditPrograma}
      />
    </div>
  );
}
