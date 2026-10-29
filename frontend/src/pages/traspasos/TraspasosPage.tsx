import { useGuia } from "../../features/guia-interactiva";
import React from 'react';
import {
  ArrowRightLeft,
  Plus,
  CheckCircle2,
  AlertCircle,
  Lock,
  Eye,
  HelpCircle,
} from 'lucide-react';
import { PageHeader, GestionSelector, Button } from '../../components/commons';
import {
  useModificaciones,
  ModificacionesKpis,
  ModificacionesFilter,
  ModificacionesBatchBar,
  ModificacionesTable,
  ModificacionDetalleModal,
  NuevaModificacionModal,
  RechazarModificacionModal,
} from '../../features/modificaciones';

export default function TraspasosPage() {
  const { openGuia, activeLiveTour } = useGuia();
  const {
    user,
    isAdmin,
    isPresupuestos,
    isGerente,
    canSolicitar,
    canAprobar,
    canAceptarGerencia,
    isReadOnly,
    userAreaId,
    gestiones,
    selectedGestionId,
    setSelectedGestionId,
    activeGestion,
    isGestionBloqueada,
    areas,
    partidas,
    operaciones,
    memorias,
    loading,
    actionLoading,
    feedbackMsg,
    activeTab,
    setActiveTab,
    filtroArea,
    setFiltroArea,
    searchTerm,
    setSearchTerm,
    modificaciones,
    modificacionesFiltradas,
    modificacionesPaginadas,
    currentPage,
    setCurrentPage,
    totalPages,
    PAGE_SIZE,
    countPendientesGerencia,
    countPendientesPresupuestos,
    countPendientes,
    countAprobadas,
    countRechazadas,
    totalMontoPendienteGerencia,
    totalMontoPendientePresupuestos,
    totalMontoPendiente,
    totalMontoAprobado,
    pendingVisiblesEnPagina,
    areAllPendingOnPageSelected,
    selectedModIds,
    setSelectedModIds,
    totalSelectedMonto,
    handleToggleSelectAllPending,
    handleToggleSelectRow,
    handleAprobarLote,
    handleAprobarIndividual,
    handleAceptarGerencia,
    handleOpenRechazoModal,
    handleConfirmarRechazo,
    handleCrearModificacion,
    showCreateModal,
    setShowCreateModal,
    selectedModDetalle,
    setSelectedModDetalle,
    showRejectModal,
    setShowRejectModal,
    modToReject,
    motivoRechazo,
    setMotivoRechazo,
  } = useModificaciones();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-200">
      {/* Mensaje Feedback Toast */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-xs font-semibold shadow-lg transition-all animate-in fade-in slide-in-from-top-2 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400'
          }`}
        >
          {feedbackMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Cabecera Principal */}
      <PageHeader
        icon={<ArrowRightLeft size={24} />}
        title="Modificaciones Presupuestarias"
        subtitle="Traspasos internos y solicitudes inter-gerencias por fuerza mayor con dictamen presupuestario"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <GestionSelector
              gestiones={gestiones}
              selectedGestionId={selectedGestionId}
              onSelectGestion={(id) => setSelectedGestionId(id)}
            />
            <button
              type="button"
              onClick={() => openGuia('modificaciones', 'diagrama')}
              className="px-3 py-2 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              title="Ver diagrama de flujo del proceso de Modificaciones Presupuestarias"
            >
              <HelpCircle size={15} /> Flujo del Módulo
            </button>

            {/* Botón Nueva Solicitud (Solo Gerente, Administrador o Modo Simulación) */}
            {(canSolicitar || activeLiveTour?.moduloId === 'modificaciones') && (
              <Button
                onClick={() => setShowCreateModal(true)}
                disabled={isGestionBloqueada || loading}
                icon={<Plus size={15} />}
                variant="primary"
                data-tour="tour-btn-traspaso"
                title={
                  isGestionBloqueada
                    ? 'Las modificaciones solo están permitidas en gestiones En Ejecución'
                    : undefined
                }
              >
                <span>Nueva Solicitud</span>
              </Button>
            )}
          </div>
        }
      >
        {/* Banner Informativo para Roles de Solo Lectura */}
        {isReadOnly && (
          <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 flex items-center gap-3 text-xs">
            <Eye size={18} className="shrink-0 text-blue-600 dark:text-blue-400" />
            <div>
              <span className="font-bold">Modo Consulta Institucional: </span>
              Tiene acceso de solo lectura para supervisar y auditar los traspasos presupuestarios entre partidas del POA.
            </div>
          </div>
        )}

        {/* Advertencia si Gestión Bloqueada */}
        {isGestionBloqueada && activeGestion && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 flex items-center gap-3 text-xs font-medium">
            <Lock size={18} className="shrink-0" />
            <div>
              <span className="font-bold">Gestión {activeGestion.anio} ({activeGestion.estado.replace('_', ' ')}): </span>
              Las modificaciones presupuestarias entre partidas están inhabilitadas porque la gestión no se encuentra en estado <strong>EN EJECUCIÓN</strong>.
            </div>
          </div>
        )}
      </PageHeader>

      {/* Tarjetas KPI de Estado */}
      <ModificacionesKpis
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        countPendientesGerencia={countPendientesGerencia}
        totalMontoPendienteGerencia={totalMontoPendienteGerencia}
        countPendientesPresupuestos={countPendientesPresupuestos}
        totalMontoPendientePresupuestos={totalMontoPendientePresupuestos}
        countAprobadas={countAprobadas}
        totalMontoAprobado={totalMontoAprobado}
        totalCount={modificaciones.length}
      />

      {/* Barra de Filtros con Pestañas y Dropdown de Área */}
      <ModificacionesFilter
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        areas={areas}
        filtroArea={filtroArea}
        onAreaChange={setFiltroArea}
        totalCount={modificaciones.length}
        countPendientesGerencia={countPendientesGerencia}
        countPendientesPresupuestos={countPendientesPresupuestos}
        countAprobadas={countAprobadas}
        countRechazadas={countRechazadas}
        gestionAnio={activeGestion?.anio}
        filteredCount={modificacionesFiltradas.length}
      />

      {/* Barra Flotante para Aprobación "De Golpe" (Presupuestos / Lic. Acha) */}
      {canAprobar && (
        <ModificacionesBatchBar
          selectedCount={selectedModIds.length}
          totalSelectedMonto={totalSelectedMonto}
          actionLoading={actionLoading}
          onClearSelection={() => setSelectedModIds([])}
          onAprobarLote={handleAprobarLote}
        />
      )}

      {/* Tabla Principal */}
      <ModificacionesTable
        modificaciones={modificacionesPaginadas}
        loading={loading}
        canAprobar={canAprobar}
        canAceptarGerencia={canAceptarGerencia}
        selectedModIds={selectedModIds}
        areAllPendingOnPageSelected={areAllPendingOnPageSelected}
        pendingVisiblesCount={pendingVisiblesEnPagina.length}
        onToggleSelectAllPending={handleToggleSelectAllPending}
        onToggleSelectRow={handleToggleSelectRow}
        onVerDetalle={(mod) => setSelectedModDetalle(mod)}
        onAprobarIndividual={handleAprobarIndividual}
        onAceptarGerencia={handleAceptarGerencia}
        onRechazarIndividual={handleOpenRechazoModal}
        actionLoading={actionLoading}
        currentPage={currentPage}
        totalPages={totalPages}
        totalFilteredCount={modificacionesFiltradas.length}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
      />

      {/* Modal Dedicado para Visualizar Detalles Completos */}
      <ModificacionDetalleModal
        isOpen={Boolean(selectedModDetalle)}
        onClose={() => setSelectedModDetalle(null)}
        modificacion={selectedModDetalle}
        canAprobar={canAprobar}
        canAceptarGerencia={selectedModDetalle ? canAceptarGerencia(selectedModDetalle) : false}
        actionLoading={actionLoading}
        onAprobar={handleAprobarIndividual}
        onAceptarGerencia={handleAceptarGerencia}
        onRechazar={handleOpenRechazoModal}
      />

      {/* Modal Nueva Solicitud con Dropdowns de Partidas */}
      <NuevaModificacionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCrearModificacion}
        areas={areas}
        memorias={memorias}
        partidas={partidas}
        operaciones={operaciones}
        selectedGestionId={selectedGestionId}
        gestionAnio={activeGestion?.anio}
        isGestionBloqueada={isGestionBloqueada}
        userAreaId={userAreaId}
        userAreaNombre={user?.area_nombre}
        isAdmin={isAdmin}
        isGerente={isGerente}
        actionLoading={actionLoading}
      />

      {/* Modal de Rechazo con Justificación */}
      <RechazarModificacionModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        modificacion={modToReject}
        motivoRechazo={motivoRechazo}
        onMotivoChange={setMotivoRechazo}
        onConfirmar={handleConfirmarRechazo}
        actionLoading={actionLoading}
      />
    </div>
  );
}
