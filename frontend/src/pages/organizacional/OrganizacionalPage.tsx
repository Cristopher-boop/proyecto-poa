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

    // Permisos institucionales (Superadministración)
    canManageArea,

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
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-200">
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
        canCreateArea={canManageArea}
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
              canManageArea={canManageArea}
            />
          )}

          {activeTab === 'AREAS' && (
            <AreasList
              areas={filteredAreas}
              programas={programas}
              onView={handleOpenViewArea}
              onEdit={handleOpenEditArea}
              onToggleEstado={handleToggleArea}
              canManage={canManageArea}
            />
          )}

          {activeTab === 'SECCIONES' && (
            <SeccionesList
              secciones={filteredSecciones}
              areas={areas}
              onView={handleOpenViewSeccion}
              onEdit={handleOpenEditSeccion}
              onToggleEstado={handleToggleSeccion}
              canManage={canManageArea}
            />
          )}

          {activeTab === 'PROGRAMAS' && (
            <ProgramasList
              programas={filteredProgramas}
              onView={handleOpenViewPrograma}
              onEdit={handleOpenEditPrograma}
              onToggleEstado={handleTogglePrograma}
              canManage={canManageArea}
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
        canManage={canManageArea}
      />
      <AreaDetalleModal
        isOpen={showAreaDetalleModal}
        onClose={() => setShowAreaDetalleModal(false)}
        area={viewingArea}
        programas={programas}
        onEdit={handleOpenEditArea}
        canEdit={canManageArea && activeTab !== 'JERARQUIA'}
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
        canEdit={canManageArea}
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
        canEdit={canManageArea}
      />
    </div>
  );
}
