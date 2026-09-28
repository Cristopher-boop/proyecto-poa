import React from 'react';
import {
  usePlanificacion,
  PlanificacionHeader,
  PlanificacionFilter,
  OperacionesList,
  OperacionModal,
  OperacionDetalleModal,
  AcpList,
  AcpModal,
  AcpDetalleModal,
  AmpList,
  AmpModal,
  AmpDetalleModal,
  ComparativaView,
} from '../../features/planificacion';

export default function PlanificacionPage() {
  const {
    // Roles & Permisos
    isAprobador,
    isPlanificador,
    canCreateOp,
    canEditOrToggleOp,
    canManageAmpOrAcp,
    userAreaId,

    // Tabs y Estado
    activeTab,
    setActiveTab,
    loading,

    // Filtros
    searchTerm,
    setSearchTerm,
    filterGestion,
    setFilterGestion,
    filterPrograma,
    setFilterPrograma,
    filterArea,
    setFilterArea,

    // Listas maestras
    programas,
    areas,
    gestiones,
    ampList,
    acpList,
    operacionesList,
    filteredOperaciones,
    filteredAcps,
    filteredAmps,

    // Modales: Operaciones
    showOpModal,
    setShowOpModal,
    editingOp,
    showOpDetalleModal,
    setShowOpDetalleModal,
    viewingOp,
    calculatedOpCode,
    handleOpenCreateOp,
    handleOpenEditOp,
    handleOpenViewOp,
    handleSaveOp,
    handleToggleOp,

    // Modales: ACP
    showAcpModal,
    setShowAcpModal,
    editingAcp,
    showAcpDetalleModal,
    setShowAcpDetalleModal,
    viewingAcp,
    calculatedAcpCode,
    handleOpenCreateAcp,
    handleOpenEditAcp,
    handleOpenViewAcp,
    handleSaveAcp,
    handleToggleAcp,

    // Modales: AMP
    showAmpModal,
    setShowAmpModal,
    editingAmp,
    showAmpDetalleModal,
    setShowAmpDetalleModal,
    viewingAmp,
    calculatedAmpCode,
    handleOpenCreateAmp,
    handleOpenEditAmp,
    handleOpenViewAmp,
    handleSaveAmp,
    handleToggleAmp,

    // Comparativa
    compGestionBase,
    setCompGestionBase,
    compGestionDestino,
    setCompGestionDestino,
    compAreaId,
    setCompAreaId,
    replicating,
    compOperacionesBase,
    compOperacionesDestino,
    handleReplicarOperaciones,
  } = usePlanificacion();

  const isAprobadorOrPlanificador = isAprobador || isPlanificador;

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterGestion('ALL');
    setFilterPrograma('ALL');
    if (isAprobadorOrPlanificador) {
      setFilterArea('ALL');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 px-2 sm:px-4">
      {/* 1. Cabecera Institucional y Pestañas */}
      <PlanificacionHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        operacionesCount={operacionesList.length}
        acpCount={acpList.length}
        ampCount={ampList.length}
        canCreateOp={canCreateOp}
        canManageAmpOrAcp={canManageAmpOrAcp}
        canReplicate={isAprobadorOrPlanificador}
        compGestionDestino={compGestionDestino}
        replicating={replicating}
        onOpenCreateOp={handleOpenCreateOp}
        onOpenCreateAcp={handleOpenCreateAcp}
        onOpenCreateAmp={handleOpenCreateAmp}
        onReplicar={handleReplicarOperaciones}
      />

      {/* 2. Barra de Búsqueda y Filtros */}
      {activeTab !== 'COMPARATIVA' && (
        <PlanificacionFilter
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterGestion={filterGestion}
          onGestionChange={setFilterGestion}
          filterPrograma={filterPrograma}
          onProgramaChange={setFilterPrograma}
          filterArea={filterArea}
          onAreaChange={setFilterArea}
          gestiones={gestiones}
          programas={programas}
          areas={areas}
          isAprobadorOrPlanificador={isAprobadorOrPlanificador}
          onResetFilters={handleResetFilters}
        />
      )}

      {/* 3. Contenido Principal */}
      {loading ? (
        <div className="p-16 rounded-2xl border border-theme-border bg-theme-surface text-center text-theme-muted space-y-3 shadow-sm">
          <div className="animate-spin inline-block w-7 h-7 border-2 border-theme-primary border-t-transparent rounded-full" />
          <p className="text-xs font-semibold uppercase tracking-wider">Cargando catálogo estratégico...</p>
        </div>
      ) : (
        <>
          {activeTab === 'OPERACIONES' && (
            <OperacionesList
              operaciones={filteredOperaciones}
              canEditOrToggle={canEditOrToggleOp}
              onView={handleOpenViewOp}
              onEdit={handleOpenEditOp}
              onToggle={handleToggleOp}
            />
          )}

          {activeTab === 'ACP' && (
            <AcpList
              acps={filteredAcps}
              canManage={canManageAmpOrAcp}
              onView={handleOpenViewAcp}
              onEdit={handleOpenEditAcp}
              onToggle={handleToggleAcp}
            />
          )}

          {activeTab === 'AMP' && (
            <AmpList
              amps={filteredAmps}
              canManage={canManageAmpOrAcp}
              onView={handleOpenViewAmp}
              onEdit={handleOpenEditAmp}
              onToggle={handleToggleAmp}
            />
          )}

          {activeTab === 'COMPARATIVA' && (
            <ComparativaView
              gestiones={gestiones}
              areas={areas}
              compGestionBase={compGestionBase}
              compGestionDestino={compGestionDestino}
              compAreaId={compAreaId}
              compOperacionesBase={compOperacionesBase}
              compOperacionesDestino={compOperacionesDestino}
              replicating={replicating}
              canReplicate={isAprobadorOrPlanificador}
              onGestionBaseChange={setCompGestionBase}
              onGestionDestinoChange={setCompGestionDestino}
              onAreaChange={setCompAreaId}
              onReplicar={handleReplicarOperaciones}
            />
          )}
        </>
      )}

      {/* 4. Modales de Operaciones */}
      {showOpModal && (
        <OperacionModal
          isOpen={showOpModal}
          operacion={editingOp}
          programas={programas}
          areas={areas}
          acpList={acpList}
          ampList={ampList}
          calculatedOpCode={calculatedOpCode}
          isAprobadorOrPlanificador={isAprobadorOrPlanificador}
          userAreaId={userAreaId}
          onClose={() => setShowOpModal(false)}
          onSave={handleSaveOp}
        />
      )}

      {showOpDetalleModal && (
        <OperacionDetalleModal
          isOpen={showOpDetalleModal}
          operacion={viewingOp}
          canEdit={canEditOrToggleOp}
          onClose={() => setShowOpDetalleModal(false)}
          onEdit={(op) => handleOpenEditOp(op)}
        />
      )}

      {/* 5. Modales de ACP */}
      {showAcpModal && (
        <AcpModal
          isOpen={showAcpModal}
          acp={editingAcp}
          programas={programas}
          ampList={ampList}
          gestiones={gestiones}
          calculatedAcpCode={calculatedAcpCode}
          onClose={() => setShowAcpModal(false)}
          onSave={handleSaveAcp}
        />
      )}

      {showAcpDetalleModal && (
        <AcpDetalleModal
          isOpen={showAcpDetalleModal}
          acp={viewingAcp}
          canEdit={canManageAmpOrAcp}
          onClose={() => setShowAcpDetalleModal(false)}
          onEdit={(acp) => handleOpenEditAcp(acp)}
        />
      )}

      {/* 6. Modales de AMP */}
      {showAmpModal && (
        <AmpModal
          isOpen={showAmpModal}
          amp={editingAmp}
          programas={programas}
          calculatedAmpCode={calculatedAmpCode}
          onClose={() => setShowAmpModal(false)}
          onSave={handleSaveAmp}
        />
      )}

      {showAmpDetalleModal && (
        <AmpDetalleModal
          isOpen={showAmpDetalleModal}
          amp={viewingAmp}
          canEdit={canManageAmpOrAcp}
          onClose={() => setShowAmpDetalleModal(false)}
          onEdit={(amp) => handleOpenEditAmp(amp)}
        />
      )}
    </div>
  );
}
