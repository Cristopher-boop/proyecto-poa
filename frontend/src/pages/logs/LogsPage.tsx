import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  useAuditoria,
  AuditoriaControlBar,
  AuditoriaTimelineFeed,
  AuditoriaInspectorDrawer,
  FlujoTrabajadoresMatrix,
  ExpedienteTrabajadorDrawer,
  HistorialAccesosTable,
} from '../../features/auditoria';

export default function LogsPage() {
  const { user } = useAuth();
  const rolName = user?.rol_nombre?.toUpperCase() || '';
  const isAdmin = Boolean(user?.is_superuser || rolName === 'ADMINISTRADOR' || rolName === 'APROBADOR');

  const {
    activeTab,
    setActiveTab,
    loading,
    refreshing,
    resumen,
    logs,
    rawLogsCount,
    flujoTrabajadores,
    rawTrabajadoresCount,
    ultimosIngresos,
    rawIngresosCount,
    timeRange,
    setTimeRange,
    searchTerm,
    setSearchTerm,
    selectedModulo,
    setSelectedModulo,
    selectedActionFlag,
    setSelectedActionFlag,
    selectedWorkerFilter,
    setSelectedWorkerFilter,
    handleFilterByWorker,
    selectedLog,
    handleOpenLogModal,
    handleCloseLogModal,
    workerDetail,
    loadingWorkerDetail,
    handleOpenWorkerModal,
    handleCloseWorkerModal,
    handleRefresh,
    handleExportCSV,
  } = useAuditoria(isAdmin);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center max-w-md mx-auto">
        <div className="p-4 rounded-3xl bg-rose-500/10 text-rose-500 mb-4 border border-rose-500/20">
          <ShieldAlert size={44} />
        </div>
        <h2 className="text-lg font-bold text-theme-main">Acceso Exclusivo para Supervisión</h2>
        <p className="text-theme-muted mt-2 text-xs leading-relaxed">
          Solo los usuarios con privilegio de Superadministrador o Administrador tienen autorización para consultar la bitácora integral y trazabilidad institucional del POA.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Barra de Control, Cabecera y Resumen Métrico */}
      <AuditoriaControlBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        onRefresh={handleRefresh}
        onExport={handleExportCSV}
        refreshing={refreshing}
        loading={loading}
        resumen={resumen}
        totalLogsCount={rawLogsCount}
        totalWorkersCount={rawTrabajadoresCount}
        totalLoginsCount={rawIngresosCount}
      />

      {/* Vista de Bitácora General con Estilo de MCs */}
      {activeTab === 'BITACORA' && (
        <AuditoriaTimelineFeed
          logs={logs}
          loading={loading}
          trabajadores={flujoTrabajadores}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedModulo={selectedModulo}
          onModuloChange={setSelectedModulo}
          selectedActionFlag={selectedActionFlag}
          onActionFlagChange={setSelectedActionFlag}
          selectedWorkerFilter={selectedWorkerFilter}
          onWorkerFilterChange={setSelectedWorkerFilter}
          onSelectLog={handleOpenLogModal}
        />
      )}

      {/* Matriz de Flujo de Trabajo por Servidor Público */}
      {activeTab === 'TRABAJADORES' && (
        <FlujoTrabajadoresMatrix
          trabajadores={flujoTrabajadores}
          loading={loading}
          onOpenWorkerModal={handleOpenWorkerModal}
        />
      )}

      {/* Historial de Inicios de Sesión y Accesos */}
      {activeTab === 'LOGINS' && (
        <HistorialAccesosTable
          usuarios={ultimosIngresos}
          loading={loading}
        />
      )}

      {/* Inspector Lateral de Evento de Auditoría */}
      <AuditoriaInspectorDrawer
        log={selectedLog}
        isOpen={Boolean(selectedLog)}
        onClose={handleCloseLogModal}
        onFilterByWorker={handleFilterByWorker}
        onOpenWorkerExpediente={handleOpenWorkerModal}
      />

      {/* Expediente Operativo y Trazabilidad por Servidor */}
      <ExpedienteTrabajadorDrawer
        detail={workerDetail}
        loading={loadingWorkerDetail}
        isOpen={Boolean(workerDetail || loadingWorkerDetail)}
        onClose={handleCloseWorkerModal}
        onSelectLog={handleOpenLogModal}
      />
    </div>
  );
}
