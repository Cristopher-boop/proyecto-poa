import React, { useMemo } from 'react';
import {
  WalletCards,
  BookOpenText,
  ArrowRightLeft,
  TrendingDown,
  PieChart,
} from 'lucide-react';
import {
  useReportes,
  ReportesHeader,
  ReportesFilter,
  ReportesPresupuestosView,
  ReportesMemoriasView,
  ReportesModificacionesView,
  ReportesGastosView,
  ReporteImprimibleModal,
  ReportesNoAutorizado,
  ReportCategory,
} from '../../features/reportes';
import { ResumenCards, ResumenCardItem } from '../../components/commons/ResumenCards';
import { TabsFilter, TabItem } from '../../components/commons/TabsFilter';

export default function ReportesPage() {
  const {
    // Permisos y Usuario
    user,
    canAccessReports,
    isGlobalRole,
    isGerente,
    userAreaNombre,

    // Gestión
    gestiones,
    selectedGestionId,
    setSelectedGestionId,
    gestionActiva,

    // Navegación
    activeCategory,
    setActiveCategory,
    subReportPresupuesto,
    setSubReportPresupuesto,
    subReportMemoria,
    setSubReportMemoria,
    subReportModificacion,
    setSubReportModificacion,
    subReportGasto,
    setSubReportGasto,

    // Filtros
    areas,
    selectedAreaId,
    setSelectedAreaId,
    searchTerm,
    setSearchTerm,
    estadoFilter,
    setEstadoFilter,

    // Modales
    showPrintModal,
    setShowPrintModal,

    // Datos procesados
    loading,
    refetch,
    formatMoney,
    presupuestosInstitucionales,
    partidasConsolidadas,
    memoriasPorEstado,
    itemsRequerimientos,
    itemsContrataciones,
    historialModificaciones,
    matrizTraspasos,
    incrementosPresupuestarios,
    libroGastos,
    certificacionesPOA,
    semaforoEjecucion,
    resumenKpis,

    // Acciones
    exportarExcelCSV,
  } = useReportes();

  // Si el rol es Elaborador o Trabajador, denegar el acceso a la reportería masiva
  if (!canAccessReports) {
    return <ReportesNoAutorizado />;
  }

  // Pestañas Maestras de Categorías
  const categoryTabs: TabItem[] = useMemo(
    () => [
      {
        id: 'presupuestos',
        label: 'Presupuestos y Techos',
        icon: <WalletCards size={15} />,
        count: presupuestosInstitucionales.length,
      },
      {
        id: 'memorias',
        label: 'Memorias de Cálculo (MC)',
        icon: <BookOpenText size={15} />,
        count: itemsRequerimientos.length,
      },
      {
        id: 'modificaciones',
        label: 'Modificaciones y Traspasos',
        icon: <ArrowRightLeft size={15} />,
        count: historialModificaciones.length,
      },
      {
        id: 'gastos',
        label: 'Gastos y Certificaciones',
        icon: <TrendingDown size={15} />,
        count: libroGastos.length,
      },
    ],
    [
      presupuestosInstitucionales.length,
      itemsRequerimientos.length,
      historialModificaciones.length,
      libroGastos.length,
    ]
  );

  // Tarjetas KPI adaptadas
  const kpiItems: ResumenCardItem[] = useMemo(() => {
    return [
      {
        id: 'kpi-1',
        title: resumenKpis.card1.title,
        value: resumenKpis.card1.value,
        subtitle: resumenKpis.card1.subtitle,
        icon: <PieChart size={18} />,
        color: resumenKpis.card1.color,
      },
      {
        id: 'kpi-2',
        title: resumenKpis.card2.title,
        value: resumenKpis.card2.value,
        subtitle: resumenKpis.card2.subtitle,
        icon: <TrendingDown size={18} />,
        color: resumenKpis.card2.color,
        progress: (resumenKpis.card2 as any).progress,
      },
      {
        id: 'kpi-3',
        title: resumenKpis.card3.title,
        value: resumenKpis.card3.value,
        subtitle: resumenKpis.card3.subtitle,
        icon: <WalletCards size={18} />,
        color: resumenKpis.card3.color,
      },
      {
        id: 'kpi-4',
        title: resumenKpis.card4.title,
        value: resumenKpis.card4.value,
        subtitle: resumenKpis.card4.subtitle,
        icon: <BookOpenText size={18} />,
        color: resumenKpis.card4.color,
      },
    ];
  }, [resumenKpis]);

  const selectedAreaObj = areas.find((a) => String(a.id) === selectedAreaId);
  const selectedAreaNombreDisplay =
    selectedAreaId === 'todas'
      ? 'Institucional Global (Todas las Áreas)'
      : selectedAreaObj?.nombre || userAreaNombre || 'Área Seleccionada';

  const userNombreCompleto =
    `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username || 'Usuario Responsable';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Cabecera Oficial del Módulo */}
      <ReportesHeader
        gestionActiva={gestionActiva}
        gestiones={gestiones}
        selectedGestionId={selectedGestionId}
        onSelectGestion={setSelectedGestionId}
        isGlobalRole={isGlobalRole}
        isGerente={isGerente}
        userAreaNombre={userAreaNombre}
        loading={loading}
        onRefresh={refetch}
        onExportCSV={exportarExcelCSV}
        onOpenPrint={() => setShowPrintModal(true)}
      />

      {/* 2. Tarjetas de Indicadores Clave (KPIs) */}
      <ResumenCards items={kpiItems} columns={4} />

      {/* 3. Navegación por Dominios Presupuestarios */}
      <TabsFilter
        tabs={categoryTabs}
        activeTab={activeCategory}
        onTabChange={(id) => setActiveCategory(id as ReportCategory)}
        variant="card"
      />

      {/* 4. Panel de Filtros Secundarios y Subreportes */}
      <ReportesFilter
        activeCategory={activeCategory}
        subReportPresupuesto={subReportPresupuesto}
        onSubReportPresupuestoChange={setSubReportPresupuesto}
        subReportMemoria={subReportMemoria}
        onSubReportMemoriaChange={setSubReportMemoria}
        subReportModificacion={subReportModificacion}
        onSubReportModificacionChange={setSubReportModificacion}
        subReportGasto={subReportGasto}
        onSubReportGastoChange={setSubReportGasto}
        areas={areas}
        selectedAreaId={selectedAreaId}
        onSelectArea={setSelectedAreaId}
        isGlobalRole={isGlobalRole}
        userAreaNombre={userAreaNombre}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        estadoFilter={estadoFilter}
        onEstadoFilterChange={setEstadoFilter}
      />

      {/* 5. Vistas Especializadas por Dominio */}
      {activeCategory === 'presupuestos' && (
        <ReportesPresupuestosView
          subReport={subReportPresupuesto}
          presupuestosInstitucionales={presupuestosInstitucionales}
          partidasConsolidadas={partidasConsolidadas}
          formatMoney={formatMoney}
          loading={loading}
        />
      )}

      {activeCategory === 'memorias' && (
        <ReportesMemoriasView
          subReport={subReportMemoria}
          memoriasPorEstado={memoriasPorEstado}
          itemsRequerimientos={itemsRequerimientos}
          itemsContrataciones={itemsContrataciones}
          formatMoney={formatMoney}
          loading={loading}
        />
      )}

      {activeCategory === 'modificaciones' && (
        <ReportesModificacionesView
          subReport={subReportModificacion}
          historialModificaciones={historialModificaciones}
          matrizTraspasos={matrizTraspasos}
          incrementosPresupuestarios={incrementosPresupuestarios}
          formatMoney={formatMoney}
          loading={loading}
        />
      )}

      {activeCategory === 'gastos' && (
        <ReportesGastosView
          subReport={subReportGasto}
          libroGastos={libroGastos}
          certificacionesPOA={certificacionesPOA}
          semaforoEjecucion={semaforoEjecucion}
          formatMoney={formatMoney}
          loading={loading}
        />
      )}

      {/* 6. Modal de Impresión Oficial Institucional */}
      <ReporteImprimibleModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        gestionActiva={gestionActiva}
        activeCategory={activeCategory}
        subReportPresupuesto={subReportPresupuesto}
        subReportMemoria={subReportMemoria}
        subReportModificacion={subReportModificacion}
        subReportGasto={subReportGasto}
        selectedAreaNombre={selectedAreaNombreDisplay}
        userNombre={userNombreCompleto}
        userCargo={user?.cargo || user?.rol_nombre || ''}
        formatMoney={formatMoney}
        presupuestosInstitucionales={presupuestosInstitucionales}
        partidasConsolidadas={partidasConsolidadas}
        memoriasPorEstado={memoriasPorEstado}
        itemsRequerimientos={itemsRequerimientos}
        itemsContrataciones={itemsContrataciones}
        historialModificaciones={historialModificaciones}
        matrizTraspasos={matrizTraspasos}
        incrementosPresupuestarios={incrementosPresupuestarios}
        libroGastos={libroGastos}
        certificacionesPOA={certificacionesPOA}
        semaforoEjecucion={semaforoEjecucion}
      />
    </div>
  );
}
