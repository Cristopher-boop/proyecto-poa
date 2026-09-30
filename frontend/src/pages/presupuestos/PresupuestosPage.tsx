import React, { useMemo } from 'react';
import {
  WalletCards,
  TrendingDown,
  CheckCircle2,
  Building2,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  Printer,
} from 'lucide-react';
import {
  usePresupuestos,
  PresupuestosHeader,
  PresupuestosFilter,
  PresupuestosTable,
  PresupuestoSectionView,
  NuevaGestionModal,
  ReporteGeneralModal,
  ReportePartidasModal,
} from '../../features/presupuestos';
import { ResumenCards, ResumenCardItem } from '../../components/commons/ResumenCards';

export default function PresupuestosPage() {
  const {
    isAprobador,
    gestiones,
    selectedGestionId,
    setSelectedGestionId,
    activeGestion,
    loading,
    actionLoading,
    feedbackMsg,
    setFeedbackMsg,
    viewMode,
    setViewMode,
    selectedAreaId,
    tabSeccion,
    setTabSeccion,
    detalleArea,
    detalleLoading,
    handleSelectArea,
    irAGeneral,
    irAReporte,
    filtroAreaId,
    setFiltroAreaId,
    mesDesde,
    setMesDesde,
    mesHasta,
    setMesHasta,
    vistaAgrupacion,
    setVistaAgrupacion,
    expandedProgramas,
    toggleExpandPrograma,
    nombreMesDesde,
    nombreMesHasta,
    hayFiltroMeses,
    resetearFiltroMeses,
    presupuestosCalculados,
    programasResumen,
    totalInicial,
    totalEjecutadoPeriodo,
    totalDisponiblePeriodo,
    pctEjecucionPeriodo,
    seccionActivaData,
    todosLosGastosSeccion,
    partidasConsolidadas,
    partidasFiltradas,
    totalPartidasPresupuestado,
    totalPartidasAgregado,
    totalPartidasQuitado,
    totalPartidasEjecutado,
    totalPartidasDisponible,
    pctPartidasGlobal,
    expandedMemorias,
    toggleMemoria,
    expandedPartidas,
    togglePartida,
    expandedPartidasConsolidadas,
    togglePartidaConsolidada,
    busquedaPartida,
    setBusquedaPartida,
    showModalGestion,
    setShowModalGestion,
    nuevoAnio,
    setNuevoAnio,
    showModalReporte,
    setShowModalReporte,
    tipoReporteImpresion,
    setTipoReporteImpresion,
    abrirReporteGeneral,
    showModalReportePartidas,
    setShowModalReportePartidas,
    handleCerrarFormulacion,
    handlePasarEjecucion,
    handleReabrir,
    handleConsolidar,
    handleCrearGestion,
    formatMoney,
    getBadgeEstado,
  } = usePresupuestos();

  // ResumenCards configuration
  const resumenCardsItems: ResumenCardItem[] = useMemo(() => {
    return [
      {
        title: 'Presupuesto Inicial',
        value: formatMoney(totalInicial),
        subtitle: `Techo asignado Gestión ${activeGestion?.anio || ''}`,
        icon: <WalletCards size={18} />,
        color: 'blue',
      },
      {
        title: `Ejecutado (${nombreMesDesde.slice(0, 3)} - ${nombreMesHasta.slice(0, 3)})`,
        value: formatMoney(totalEjecutadoPeriodo),
        subtitle: 'Gastos en el periodo seleccionado',
        icon: <TrendingDown size={18} />,
        color: 'rose',
      },
      {
        title: 'Saldo Disponible',
        value: formatMoney(totalDisponiblePeriodo),
        subtitle: 'Remanente respecto al periodo',
        icon: <CheckCircle2 size={18} />,
        color: 'emerald',
      },
      {
        title: '% Avance',
        value: `${pctEjecucionPeriodo}%`,
        subtitle: 'del periodo evaluado',
        icon: <Building2 size={18} />,
        color: 'amber',
        progress: {
          value: Math.min(100, pctEjecucionPeriodo),
          label: `${pctEjecucionPeriodo}%`,
        },
      },
    ];
  }, [totalInicial, totalEjecutadoPeriodo, totalDisponiblePeriodo, pctEjecucionPeriodo, activeGestion, nombreMesDesde, nombreMesHasta, formatMoney]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw size={28} className="mx-auto mb-3 animate-spin text-theme-muted" />
          <p className="text-sm text-theme-muted">Cargando Módulo de Presupuestos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast de Retroalimentación de Acciones */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between shadow-md ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-100 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-900 border border-rose-200 dark:bg-rose-950/80 dark:text-rose-100 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span className="text-sm font-medium">{feedbackMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="text-xs opacity-75 hover:opacity-100 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Cabecera y Controles de la Gestión */}
      <PresupuestosHeader
        gestiones={gestiones}
        selectedGestionId={selectedGestionId}
        activeGestion={activeGestion}
        isAprobador={isAprobador}
        actionLoading={actionLoading}
        onSelectGestion={(id) => {
          setSelectedGestionId(id);
          irAGeneral();
        }}
        onConsolidar={handleConsolidar}
        onCerrarFormulacion={handleCerrarFormulacion}
        onReabrir={handleReabrir}
        onPasarEjecucion={handlePasarEjecucion}
        onOpenNuevaGestion={() => setShowModalGestion(true)}
      />

      {/* VISTA 1: DASHBOARD + TABLA CONSOLIDADA */}
      {viewMode === 'general' && (
        <div className="space-y-6">
          {/* Barra de Filtros Interactivos */}
          <PresupuestosFilter
            presupuestosArea={presupuestosCalculados}
            filtroAreaId={filtroAreaId}
            onFilterAreaChange={setFiltroAreaId}
            mesDesde={mesDesde}
            onMesDesdeChange={setMesDesde}
            mesHasta={mesHasta}
            onMesHastaChange={setMesHasta}
            hayFiltroMeses={hayFiltroMeses}
            onResetFiltros={resetearFiltroMeses}
            nombreMesDesde={nombreMesDesde}
            nombreMesHasta={nombreMesHasta}
            gestionAnio={activeGestion?.anio}
          />

          {/* Tarjetas Métricas de Indicadores Consolidados */}
          <ResumenCards items={resumenCardsItems} columns={4} />

          {/* Tabla Principal: Por Gerencias y Por Programas */}
          <PresupuestosTable
            vistaAgrupacion={vistaAgrupacion}
            onVistaAgrupacionChange={setVistaAgrupacion}
            onOpenReporteGeneral={() => abrirReporteGeneral(vistaAgrupacion)}
            presupuestosCalculados={presupuestosCalculados}
            programasResumen={programasResumen}
            expandedProgramas={expandedProgramas}
            onToggleExpandPrograma={toggleExpandPrograma}
            onSelectArea={handleSelectArea}
            formatMoney={formatMoney}
            nombreMesDesde={nombreMesDesde}
            nombreMesHasta={nombreMesHasta}
          />
        </div>
      )}

      {/* VISTA 2: DETALLES DE LA SECCIÓN OPERATIVA */}
      {viewMode === 'seccion' && (
        <PresupuestoSectionView
          detalleArea={detalleArea}
          seccionActivaData={seccionActivaData}
          selectedAreaId={selectedAreaId}
          detalleLoading={detalleLoading}
          onVolverGeneral={irAGeneral}
          onOpenReporteSeccion={irAReporte}
          tabSeccion={tabSeccion}
          onTabSeccionChange={setTabSeccion}
          expandedMemorias={expandedMemorias}
          onToggleMemoria={toggleMemoria}
          expandedPartidas={expandedPartidas}
          onTogglePartida={togglePartida}
          getBadgeEstado={getBadgeEstado}
          todosLosGastosSeccion={todosLosGastosSeccion}
          partidasConsolidadas={partidasConsolidadas}
          partidasFiltradas={partidasFiltradas}
          busquedaPartida={busquedaPartida}
          onBusquedaPartidaChange={setBusquedaPartida}
          expandedPartidasConsolidadas={expandedPartidasConsolidadas}
          onTogglePartidaConsolidada={togglePartidaConsolidada}
          onOpenReportePartidas={() => setShowModalReportePartidas(true)}
          totalPartidasPresupuestado={totalPartidasPresupuestado}
          totalPartidasAgregado={totalPartidasAgregado}
          totalPartidasQuitado={totalPartidasQuitado}
          totalPartidasEjecutado={totalPartidasEjecutado}
          totalPartidasDisponible={totalPartidasDisponible}
          pctPartidasGlobal={pctPartidasGlobal}
          formatMoney={formatMoney}
          nombreMesDesde={nombreMesDesde}
          nombreMesHasta={nombreMesHasta}
          gestionAnio={activeGestion?.anio || detalleArea?.gestion_anio}
        />
      )}

      {/* VISTA 3: REPORTE IMPRIMIBLE DE LA SECCIÓN */}
      {viewMode === 'reporte' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-theme-surface p-4 rounded-xl border border-theme-border shadow-sm print:hidden">
            <button
              type="button"
              onClick={() => setViewMode('seccion')}
              className="flex items-center gap-1.5 text-xs font-bold text-theme-primary hover:underline cursor-pointer"
            >
              <ChevronLeft size={16} /> Volver a Detalles de Sección
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-theme-primary text-theme-primaryText text-xs font-bold hover:bg-theme-primaryHover transition-all flex items-center gap-1.5 shadow cursor-pointer"
            >
              <Printer size={15} /> Imprimir Reporte (PDF)
            </button>
          </div>

          {seccionActivaData ? (
            <div className="bg-white text-black p-6 sm:p-10 rounded-2xl shadow-lg border border-gray-300 max-w-4xl mx-auto space-y-6 print:border-none print:shadow-none print:p-0">
              <div className="border-b-2 border-black pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-600">
                      ESTADO PLURINACIONAL DE BOLIVIA
                    </p>
                    <h1 className="text-base sm:text-lg font-black uppercase tracking-wider text-black mt-0.5">
                      EMPRESA PÚBLICA DE TRANSPORTE AÉREO MILITAR - EPTAM
                    </h1>
                    <p className="text-[10px] font-semibold tracking-wide text-gray-500 uppercase">
                      SISTEMA INTEGRADO DE PROGRAMACIÓN OPERATIVA ANUAL (POA)
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block border-2 border-black px-2.5 py-1 text-xs font-black uppercase tracking-wider">
                      POA {activeGestion?.anio || detalleArea?.gestion_anio || '2026'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <h2 className="text-base sm:text-lg font-black uppercase tracking-wide text-black underline underline-offset-4">
                    ESTADO DE EJECUCIÓN PRESUPUESTARIA DE SECCIÓN
                  </h2>
                  <p className="text-xs font-bold text-gray-700 mt-1 uppercase">
                    {detalleArea?.area_nombre} — {seccionActivaData.seccion_nombre}
                  </p>
                </div>
              </div>

              {/* Metadatos */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] border border-gray-400 bg-gray-50 p-3 rounded">
                <div>
                  <span className="font-bold text-gray-500 block uppercase text-[9px]">Gestión Fiscal:</span>
                  <span className="font-bold text-black">{activeGestion?.anio || detalleArea?.gestion_anio}</span>
                </div>
                <div>
                  <span className="font-bold text-gray-500 block uppercase text-[9px]">Área / Gerencia:</span>
                  <span className="font-bold text-black">{detalleArea?.area_nombre}</span>
                </div>
                <div>
                  <span className="font-bold text-gray-500 block uppercase text-[9px]">Sección Operativa:</span>
                  <span className="font-bold text-black">{seccionActivaData.seccion_nombre}</span>
                </div>
                <div>
                  <span className="font-bold text-gray-500 block uppercase text-[9px]">Fecha de Emisión:</span>
                  <span className="font-medium text-black">{new Date().toLocaleDateString('es-BO')}</span>
                </div>
              </div>

              {/* Resumen Totales Sección */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="border border-gray-400 p-2.5 rounded bg-white">
                  <p className="text-[9px] font-bold uppercase text-gray-600">Presupuesto Formulado</p>
                  <p className="text-sm font-black text-black mt-0.5">{formatMoney(seccionActivaData.total_presupuestado)}</p>
                </div>
                <div className="border border-gray-400 p-2.5 rounded bg-white">
                  <p className="text-[9px] font-bold uppercase text-gray-600">Total Gastos Ejecutados</p>
                  <p className="text-sm font-black text-red-700 mt-0.5">{formatMoney(seccionActivaData.total_gastado)}</p>
                </div>
                <div className="border border-gray-400 p-2.5 rounded bg-white">
                  <p className="text-[9px] font-bold uppercase text-gray-600">Saldo Disponible</p>
                  <p className="text-sm font-black text-emerald-700 mt-0.5">{formatMoney(seccionActivaData.total_disponible)}</p>
                </div>
              </div>

              {/* Firmas */}
              <div className="pt-8 pb-4 mt-8">
                <div className="grid grid-cols-3 gap-6 text-center">
                  <div className="border-t border-black pt-2">
                    <p className="text-[10px] font-bold uppercase text-black">Elaborado por</p>
                    <p className="text-[9px] text-gray-600 mt-1">Responsable Operativo</p>
                    <p className="text-[8px] text-gray-500 mt-4">Firma y Sello</p>
                  </div>
                  <div className="border-t border-black pt-2">
                    <p className="text-[10px] font-bold uppercase text-black">Revisado por</p>
                    <p className="text-[9px] text-gray-600 mt-1">Jefe de Planificación</p>
                    <p className="text-[8px] text-gray-500 mt-4">Firma y Sello</p>
                  </div>
                  <div className="border-t border-black pt-2">
                    <p className="text-[10px] font-bold uppercase text-black">Aprobado por</p>
                    <p className="text-[9px] text-gray-600 mt-1">Gerente de Área</p>
                    <p className="text-[8px] text-gray-500 mt-4">Firma y Sello</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card p-10 text-center text-theme-muted">
              <p>No se encontraron datos para generar el reporte de sección.</p>
            </div>
          )}
        </div>
      )}

      {/* MODAL NUEVA GESTIÓN */}
      <NuevaGestionModal
        isOpen={showModalGestion}
        onClose={() => setShowModalGestion(false)}
        nuevoAnio={nuevoAnio}
        onNuevoAnioChange={setNuevoAnio}
        onSubmit={handleCrearGestion}
        actionLoading={actionLoading}
      />

      {/* MODAL DE REPORTE OFICIAL DEL DASHBOARD (GERENCIAS / PROGRAMAS) */}
      <ReporteGeneralModal
        isOpen={showModalReporte}
        onClose={() => setShowModalReporte(false)}
        tipoReporteImpresion={tipoReporteImpresion}
        onTipoReporteImpresionChange={setTipoReporteImpresion}
        activeGestion={activeGestion}
        filtroAreaId={filtroAreaId}
        presupuestosArea={presupuestosCalculados}
        presupuestosCalculados={presupuestosCalculados}
        programasResumen={programasResumen}
        totalInicial={totalInicial}
        totalEjecutadoPeriodo={totalEjecutadoPeriodo}
        totalDisponiblePeriodo={totalDisponiblePeriodo}
        pctEjecucionPeriodo={pctEjecucionPeriodo}
        nombreMesDesde={nombreMesDesde}
        nombreMesHasta={nombreMesHasta}
        formatMoney={formatMoney}
      />

      {/* MODAL DE REPORTE OFICIAL DE PARTIDAS CONSOLIDADAS */}
      <ReportePartidasModal
        isOpen={showModalReportePartidas}
        onClose={() => setShowModalReportePartidas(false)}
        activeGestion={activeGestion}
        detalleArea={detalleArea}
        seccionActivaData={seccionActivaData}
        partidasConsolidadas={partidasConsolidadas}
        totalPartidasPresupuestado={totalPartidasPresupuestado}
        totalPartidasAgregado={totalPartidasAgregado}
        totalPartidasQuitado={totalPartidasQuitado}
        totalPartidasEjecutado={totalPartidasEjecutado}
        totalPartidasDisponible={totalPartidasDisponible}
        pctPartidasGlobal={pctPartidasGlobal}
        mesDesde={mesDesde}
        mesHasta={mesHasta}
        nombreMesDesde={nombreMesDesde}
        nombreMesHasta={nombreMesHasta}
        hayFiltroMeses={hayFiltroMeses}
        formatMoney={formatMoney}
      />
    </div>
  );
}
