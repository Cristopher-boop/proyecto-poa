import { useGuia } from "../../features/guia-interactiva";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useGestion } from '../../contexts/GestionContext';
import { useEjecucion } from '../../features/ejecucion/hooks/useEjecucion';
import {
  GastosTable,
  MemoriasSaldoTable,
  GastoFormModal,
  GastoDetalleModal,
  SolicitudesGastoTable,
  SolicitudGastoModal,
} from '../../features/ejecucion/components';
import {
  CertificacionDetalleModal,
  CertificacionRechazarModal,
} from '../../features/certificaciones/components';
import {
  TabsFilter,
  TabItem,
  FilterPanel,
  Button,
  PageHeader,
  GestionSelector,
  ResumenCards,
  ResumenCardItem,
} from '../../components/commons';
import { certificacionService } from '../../services/certificacionService';
import { CertificacionPOA, CertificacionFormData } from '../../types/certificacion';
import alertService from '../../utils/alerts';
import { Gasto } from '../../services/presupuestoService';
import {
  TrendingDown,
  Receipt,
  BookOpen,
  Plus,
  RefreshCw,
  Lock,
  FileText,
  HelpCircle,
  WalletCards,
  Coins,
} from 'lucide-react';

export default function EjecucionPage() {
  const { openGuia, activeLiveTour } = useGuia();
  const { user } = useAuth();
  const { gestiones, gestionActiva, gestionActivaId, setGestionActivaId, isGestionBloqueada } =
    useGestion();

  const rolName = (user?.rol_nombre || (user as any)?.rol?.nombre || '').toUpperCase().trim();
  const rolClean = rolName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const isSuperuser = Boolean(user?.is_superuser) || rolClean.includes('ADMIN');
  const isGerente = !isSuperuser && rolClean.includes('GERENT');
  const canSolicitar = isSuperuser || isGerente;
  const canManage = isSuperuser || rolClean === 'APROBADOR' || rolClean === 'PRESUPUESTOS' || rolClean === 'ADMINISTRADOR';

  const {
    loading,
    actionLoading,
    gastos,
    gastosFiltrados,
    presupuestosArea,
    areas,
    partidasDisponibles,
    renglonesDisponibles,
    renglonesFiltrados,
    metrics,
    filters,
    actions,
  } = useEjecucion();

  // ── Estados de Solicitudes de Gasto ──────────────────────────────────────────
  const [solicitudes, setSolicitudes] = useState<CertificacionPOA[]>([]);
  const [solicitudesLoading, setSolicitudesLoading] = useState<boolean>(false);
  const [showModalSolicitud, setShowModalSolicitud] = useState<boolean>(false);
  const [solicitudToEdit, setSolicitudToEdit] = useState<CertificacionPOA | null>(null);
  const [preselectedMemoriaSolicitud, setPreselectedMemoriaSolicitud] = useState<number | null>(null);
  const [preselectedPartidaSolicitud, setPreselectedPartidaSolicitud] = useState<number | null>(null);

  // Modales de detalle y cancelación de solicitudes
  const [showDetalleSolicitud, setShowDetalleSolicitud] = useState<boolean>(false);
  const [selectedCertParaDetalle, setSelectedCertParaDetalle] = useState<CertificacionPOA | null>(null);
  const [showModalCancelar, setShowModalCancelar] = useState<boolean>(false);
  const [selectedCertParaCancelar, setSelectedCertParaCancelar] = useState<CertificacionPOA | null>(null);

  // Modales de Gasto Directo
  const [showModalGasto, setShowModalGasto] = useState<boolean>(false);
  const [gastoToEdit, setGastoToEdit] = useState<Gasto | null>(null);
  const [selectedGastoParaDetalle, setSelectedGastoParaDetalle] = useState<Gasto | null>(null);

  // ── Carga de Solicitudes de Gasto ───────────────────────────────────────────
  const fetchSolicitudes = useCallback(async () => {
    if (!gestionActivaId) return;
    setSolicitudesLoading(true);
    try {
      const params: Record<string, any> = { gestion: gestionActivaId };
      if (!isSuperuser && user?.area_id) {
        params.area = user.area_id;
      }
      const data = await certificacionService.getCertificaciones(params);
      setSolicitudes(data);
    } catch (err) {
      console.error('Error al cargar solicitudes de gasto:', err);
    } finally {
      setSolicitudesLoading(false);
    }
  }, [gestionActivaId, isSuperuser, user?.area_id]);

  useEffect(() => {
    fetchSolicitudes();
  }, [fetchSolicitudes]);

  // Si es Gerente, inicia por defecto en la pestaña 'solicitudes'
  useEffect(() => {
    if (isGerente && filters.activeTab !== 'solicitudes') {
      filters.setActiveTab('solicitudes');
    }
  }, [isGerente]);

  // Filtrado de solicitudes reactivo al panel de filtros
  const solicitudesFiltradas = useMemo(() => {
    return solicitudes.filter((s) => {
      if (filters.filtroArea !== 'todas') {
        const matchArea =
          String(s.area) === filters.filtroArea ||
          s.area_nombre?.toLowerCase() === filters.filtroArea.toLowerCase();
        if (!matchArea) return false;
      }
      if (filters.filtroPartida !== 'todas') {
        if (filters.filtroPartida.startsWith('MC:')) {
          const mcCodigo = filters.filtroPartida.replace('MC:', '').trim();
          if (s.memoria_codigo !== mcCodigo) return false;
        } else {
          if (s.partida_codigo !== filters.filtroPartida) return false;
        }
      }
      if (filters.searchTerm.trim()) {
        const q = filters.searchTerm.toLowerCase();
        const matchHr = s.hoja_ruta?.toLowerCase().includes(q);
        const matchConc = s.concepto_gasto?.toLowerCase().includes(q);
        const matchPart =
          s.partida_codigo?.toLowerCase().includes(q) ||
          s.partida_nombre?.toLowerCase().includes(q);
        if (!matchHr && !matchConc && !matchPart) return false;
      }
      return true;
    });
  }, [solicitudes, filters.filtroArea, filters.filtroPartida, filters.searchTerm]);

  // ── Handlers de Solicitud de Gasto ──────────────────────────────────────────
  const handleOpenSolicitar = (preselectedMemoriaId?: number) => {
    setSolicitudToEdit(null);
    setPreselectedMemoriaSolicitud(preselectedMemoriaId || null);
    setPreselectedPartidaSolicitud(null);
    setShowModalSolicitud(true);
  };

  const handleOpenEditarSolicitud = (solicitud: CertificacionPOA) => {
    setSolicitudToEdit(solicitud);
    setPreselectedMemoriaSolicitud(solicitud.memoria || null);
    setPreselectedPartidaSolicitud(solicitud.partida || null);
    setShowModalSolicitud(true);
  };

  const handleSaveSolicitud = async (data: CertificacionFormData, enviarDirecto = false) => {
    try {
      let saved: CertificacionPOA;
      if (solicitudToEdit) {
        saved = await certificacionService.updateCertificacion(solicitudToEdit.id, data);
        alertService.toast('Solicitud actualizada con éxito.', 'success');
      } else {
        saved = await certificacionService.createCertificacion(data);
        alertService.toast('Solicitud de gasto registrada con éxito.', 'success');
      }

      if (enviarDirecto && saved?.id) {
        await certificacionService.enviarRevision(saved.id, { es_contratacion: data.es_contratacion });
        alertService.toast('Solicitud remitida a revisión exitosamente.', 'success');
      }

      setShowModalSolicitud(false);
      setSolicitudToEdit(null);
      await fetchSolicitudes();
    } catch (err: any) {
      throw err;
    }
  };

  const handleEnviarSolicitud = async (solicitud: CertificacionPOA) => {
    const destinoStr = solicitud.es_contratacion
      ? 'la Unidad de Planificación para Certificación POA'
      : 'la Unidad de Presupuestos para visto bueno financiero';

    const confirm = await alertService.confirm({
      title: '¿Enviar solicitud a revisión?',
      text: `La solicitud con Hoja de Ruta "${solicitud.hoja_ruta}" (${solicitud.es_contratacion ? 'Contratación POA' : 'Gasto Menor / Directo'}) será remitida a ${destinoStr}.`,
      confirmButtonText: 'Sí, enviar ahora',
      cancelButtonText: 'Cancelar',
      icon: 'question',
    });
    if (!confirm) return;

    try {
      await certificacionService.enviarRevision(solicitud.id, { es_contratacion: solicitud.es_contratacion });
      alertService.toast('Solicitud enviada a revisión exitosamente.', 'success');
      await fetchSolicitudes();
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Error al enviar la solicitud.';
      alertService.toast(msg, 'error');
    }
  };

  const handleDeleteSolicitud = async (solicitud: CertificacionPOA) => {
    const confirm = await alertService.confirm({
      title: '¿Eliminar borrador de solicitud?',
      text: `Se eliminará definitivamente la solicitud con Hoja de Ruta "${solicitud.hoja_ruta}".`,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      isDanger: true,
    });
    if (!confirm) return;

    try {
      await certificacionService.deleteCertificacion(solicitud.id);
      alertService.toast('Borrador eliminado correctamente.', 'success');
      await fetchSolicitudes();
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Error al eliminar la solicitud.';
      alertService.toast(msg, 'error');
    }
  };

  const handleConfirmCancelarSolicitud = async (motivo: string) => {
    if (!selectedCertParaCancelar) return;
    try {
      await certificacionService.cancelarCertificacion(selectedCertParaCancelar.id, motivo);
      alertService.toast('Solicitud cancelada por el área exitosamente.', 'info');
      setShowModalCancelar(false);
      setSelectedCertParaCancelar(null);
      await fetchSolicitudes();
    } catch (err: any) {
      throw err;
    }
  };

  // ── Handlers de Gasto Directo ───────────────────────────────────────────────
  const handleOpenCrearGastoDirecto = (preselectedMemoriaId?: number) => {
    if (preselectedMemoriaId) {
      setGastoToEdit({ memoria: preselectedMemoriaId } as any);
    } else {
      setGastoToEdit(null);
    }
    setShowModalGasto(true);
  };

  const handleOpenEditarGastoDirecto = (gasto: Gasto) => {
    setGastoToEdit(gasto);
    setShowModalGasto(true);
  };

  const formatMoney = (val: number | string) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
      minimumFractionDigits: 2,
    }).format(num || 0);
  };

  const kpiItems: ResumenCardItem[] = useMemo(() => [
    {
      id: 'techo-vigente',
      title: 'Techo Vigente (Presupuestos)',
      value: formatMoney(metrics.totalInicial),
      subtitle: 'Presupuesto total programado',
      icon: <WalletCards size={18} />,
      color: 'blue',
    },
    {
      id: 'gastado',
      title: 'Gasto Ejecutado (Devengado)',
      value: formatMoney(metrics.totalGastado),
      subtitle: `${metrics.pctGlobal.toFixed(1)}% ejecutado formalmente`,
      icon: <Receipt size={18} />,
      color: 'rose',
      progress: {
        value: metrics.pctGlobal,
        label: `${metrics.pctGlobal.toFixed(1)}%`,
      },
    },
    {
      id: 'disponible',
      title: 'Saldo Disponible Líquido',
      value: formatMoney(metrics.totalDisponible),
      subtitle: 'Habilitado para nuevas solicitudes',
      icon: <Coins size={18} />,
      color: 'emerald',
    },
    {
      id: 'ejecucion-pct',
      title: 'Eficacia Presupuestaria',
      value: `${metrics.pctGlobal.toFixed(1)}%`,
      subtitle: metrics.pctGlobal >= 70 ? 'Ritmo óptimo institucional' : 'En seguimiento operativo',
      icon: <TrendingDown size={18} />,
      color: metrics.pctGlobal >= 70 ? 'emerald' : metrics.pctGlobal >= 40 ? 'amber' : 'blue',
    },
  ], [metrics]);

  // Pestañas dinámicas
  const tabs: TabItem[] = [
    {
      id: 'solicitudes',
      label: 'Solicitudes de Gasto',
      count: solicitudesFiltradas.length,
      icon: <FileText size={13} />,
      activeColorClass: 'border-theme-primary text-theme-main font-bold',
      activeBadgeClass: 'bg-theme-primary/15 text-theme-primary font-bold font-mono',
      tourId: 'tour-tab-solicitudes',
    },
    {
      id: 'gastos',
      label: 'Gastos Ejecutados',
      count: metrics.isFiltered ? gastosFiltrados.length : gastos.length,
      icon: <Receipt size={13} />,
      activeColorClass: 'border-rose-500 text-rose-600 dark:text-rose-400 font-bold',
      activeBadgeClass: 'bg-rose-500/20 text-rose-700 dark:text-rose-400 font-bold font-mono',
      tourId: 'tour-tab-gastos',
    },
    {
      id: 'memorias',
      label: 'Memorias con Saldo',
      count: renglonesFiltrados.length,
      icon: <BookOpen size={13} />,
      activeColorClass: 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold',
      activeBadgeClass: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold font-mono',
      tourId: 'tour-tab-memorias',
    },
  ];

  const currentTabCounts = useMemo(() => {
    if (filters.activeTab === 'solicitudes') {
      return {
        filtered: solicitudesFiltradas.length,
        total: solicitudes.length,
        label: 'solicitudes',
      };
    }
    if (filters.activeTab === 'gastos') {
      return {
        filtered: gastosFiltrados.length,
        total: gastos.length,
        label: 'gastos contables',
      };
    }
    return {
      filtered: renglonesFiltrados.length,
      total: renglonesDisponibles.length,
      label: 'memorias con saldo',
    };
  }, [
    filters.activeTab,
    solicitudesFiltradas.length,
    solicitudes.length,
    gastosFiltrados.length,
    gastos.length,
    renglonesFiltrados.length,
    renglonesDisponibles.length,
  ]);

  const areaOptions = useMemo(() => {
    if (isGerente && user?.area_id) {
      return areas
        .filter((a) => a.id === user.area_id)
        .map((a) => ({
          value: String(a.id),
          label: a.nombre,
          badge: a.codigo,
        }));
    }
    return areas.map((a) => ({
      value: String(a.id),
      label: a.nombre,
      badge: a.codigo,
    }));
  }, [areas, isGerente, user?.area_id]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-200">
      {/* Cabecera Principal Unificada */}
      <PageHeader
        icon={<TrendingDown size={28} />}
        title="Módulo de Gastos y Ejecución Presupuestaria"
        subtitle="Formulación de solicitudes de gasto institucional, registro contable de ejecuciones y monitoreo de saldos POA."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <GestionSelector
              gestiones={gestiones}
              selectedGestionId={gestionActivaId}
              onSelectGestion={(id) => setGestionActivaId(id)}
            />
            <button
              type="button"
              onClick={() => openGuia('ejecucion', 'diagrama')}
              className="px-3 py-2 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              title="Ver diagrama de flujo del proceso de Ejecución y Pagos"
            >
              <HelpCircle size={15} /> Flujo del Módulo
            </button>

            {/* Botón Solicitar Gasto (Gerente o Admin) */}
            {canSolicitar && (
              <Button
                variant="primary"
                size="sm"
                disabled={isGestionBloqueada}
                onClick={() => handleOpenSolicitar()}
                icon={<Plus size={15} />}
                className="shadow-md shadow-theme-primary/20 font-bold"
              >
                Solicitar Gasto
              </Button>
            )}

            {/* Botón Registrar Gasto Contable Directo (Aprobador o Admin) */}
            {canManage && (
              <Button
                variant="danger"
                size="sm"
                disabled={isGestionBloqueada}
                onClick={() => handleOpenCrearGastoDirecto()}
                icon={<Plus size={15} />}
                className="shadow-md shadow-rose-600/20 font-bold"
              >
                Registrar Gasto
              </Button>
            )}
          </div>
        }
      >
        {/* Banner de Gestión Bloqueada */}
        {isGestionBloqueada && (
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-3 text-xs text-amber-800 dark:text-amber-300">
            <Lock size={18} className="shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              <strong>Gestión {gestionActiva?.anio} Finalizada:</strong> El ejercicio fiscal se encuentra cerrado y no se admiten nuevos registros o modificaciones de ejecución presupuestaria.
            </span>
          </div>
        )}
      </PageHeader>

      {/* Tarjetas KPI de Ejecución Institucional con ResumenCards */}
      <div data-tour="tour-kpis-ejecucion">
        <ResumenCards items={kpiItems} columns={4} />
      </div>

      {/* Panel Unificado de Pestañas y Filtros */}
      <FilterPanel
        tabs={tabs}
        activeTab={filters.activeTab}
        onTabChange={(id) => filters.setActiveTab(id as any)}
        totalCount={currentTabCounts.total}
        filteredCount={currentTabCounts.filtered}
        recordsLabel={currentTabCounts.label}
        searchTerm={filters.searchTerm}
        onSearchChange={filters.setSearchTerm}
        searchPlaceholder={
          filters.activeTab === 'solicitudes'
            ? 'Buscar por Hoja de Ruta, justificación, partida...'
            : filters.activeTab === 'gastos'
            ? 'Buscar por comprobante, preventivo, observación, código POA...'
            : 'Buscar por código POA, justificación técnica...'
        }
        areaOptions={areaOptions}
        selectedArea={filters.filtroArea}
        onAreaChange={filters.setFiltroArea}
        areaPlaceholder={isGerente ? undefined : "Todas las Áreas"}
        isGerente={isGerente}
        partidaOptions={partidasDisponibles}
        selectedPartida={filters.filtroPartida}
        onPartidaChange={filters.setFiltroPartida}
        partidaPlaceholder={isGerente ? "Mis Partidas / MCs" : "Todas las Partidas / MCs"}
        fechaDesde={filters.fechaDesde}
        fechaHasta={filters.fechaHasta}
        onFechaDesdeChange={filters.setFechaDesde}
        onFechaHastaChange={filters.setFechaHasta}
        mesDesde={filters.mesDesde}
        mesHasta={filters.mesHasta}
        onMesDesdeChange={filters.setMesDesde}
        onMesHastaChange={filters.setMesHasta}
        montoMin={filters.montoMin}
        montoMax={filters.montoMax}
        onMontoMinChange={filters.setMontoMin}
        onMontoMaxChange={filters.setMontoMax}
        gestionAnio={gestionActiva?.anio}
        hasActiveFilters={filters.hasActiveFilters}
        onResetFilters={filters.resetFilters}
        actions={
          <Button
            variant="secondary"
            size="md"
            onClick={async () => {
              actions.refetch();
              await fetchSolicitudes();
            }}
            icon={<RefreshCw size={15} className={loading || solicitudesLoading ? 'animate-spin' : ''} />}
            title="Actualizar datos"
          />
        }
      />



      {/* Contenido de Tablas por Pestaña */}
      {filters.activeTab === 'solicitudes' && (
        <SolicitudesGastoTable
          solicitudes={solicitudesFiltradas}
          loading={solicitudesLoading}
          canManage={canSolicitar}
          onEdit={handleOpenEditarSolicitud}
          onEnviar={handleEnviarSolicitud}
          onDelete={handleDeleteSolicitud}
          onCancel={(s) => {
            setSelectedCertParaCancelar(s);
            setShowModalCancelar(true);
          }}
          onViewDetail={(s) => {
            setSelectedCertParaDetalle(s);
            setShowDetalleSolicitud(true);
          }}
        />
      )}

      {filters.activeTab === 'gastos' && (
        <GastosTable
          gastos={gastosFiltrados}
          loading={loading}
          canManage={canManage && !isGestionBloqueada}
          onEdit={handleOpenEditarGastoDirecto}
          onViewDetail={(g) => setSelectedGastoParaDetalle(g)}
        />
      )}

      {filters.activeTab === 'memorias' && (
        <MemoriasSaldoTable
          memorias={renglonesFiltrados}
          loading={loading}
          canExecuteGasto={canManage && !isGestionBloqueada}
          onSelectMemoria={(memoriaId) => handleOpenCrearGastoDirecto(memoriaId)}
          canSolicitarGasto={canSolicitar && !isGestionBloqueada}
          onSolicitarGasto={(memoriaId) => handleOpenSolicitar(memoriaId)}
        />
      )}

      {/* ── Modales del Módulo ──────────────────────────────────────────────── */}
      {/* 1. Modal Formulación de Solicitud de Gasto */}
      <SolicitudGastoModal
        isOpen={showModalSolicitud}
        onClose={() => {
          setShowModalSolicitud(false);
          setSolicitudToEdit(null);
          setPreselectedMemoriaSolicitud(null);
          setPreselectedPartidaSolicitud(null);
        }}
        onSubmit={handleSaveSolicitud}
        initialData={solicitudToEdit}
        gestionId={gestionActivaId || 0}
        gestionAnio={gestionActiva?.anio || new Date().getFullYear()}
        areas={areas}
        userAreaId={user?.area_id || null}
        isSuperAdmin={isSuperuser}
        preselectedMemoriaId={preselectedMemoriaSolicitud}
        preselectedPartidaId={preselectedPartidaSolicitud}
      />

      {/* 2. Modal de Registro y Edición de Gasto Contable Directo */}
      {showModalGasto && (
        <GastoFormModal
          isOpen={showModalGasto}
          onClose={() => {
            setShowModalGasto(false);
            setGastoToEdit(null);
          }}
          gastoToEdit={gastoToEdit}
          memoriasDisponibles={renglonesDisponibles}
          onSave={async (payload) => {
            if (gastoToEdit && gastoToEdit.id) {
              return actions.updateGasto(gastoToEdit.id, payload);
            }
            return actions.createGasto(payload);
          }}
          loading={actionLoading}
        />
      )}

      {/* 3. Modal Detalle y Seguimiento de Solicitud */}
      <CertificacionDetalleModal
        isOpen={showDetalleSolicitud}
        onClose={() => {
          setShowDetalleSolicitud(false);
          setSelectedCertParaDetalle(null);
        }}
        certificacion={selectedCertParaDetalle}
        canCancel={canSolicitar}
        onCancelRequest={(cert) => {
          setShowDetalleSolicitud(false);
          setSelectedCertParaCancelar(cert);
          setShowModalCancelar(true);
        }}
      />

      {/* 4. Modal Cancelar Solicitud */}
      <CertificacionRechazarModal
        isOpen={showModalCancelar}
        onClose={() => {
          setShowModalCancelar(false);
          setSelectedCertParaCancelar(null);
        }}
        onSubmit={handleConfirmCancelarSolicitud}
        certificacion={selectedCertParaCancelar}
        modo="cancelar_gerente"
      />

      {/* 5. Modal Detalle de Gasto Contable */}
      <GastoDetalleModal
        isOpen={Boolean(selectedGastoParaDetalle)}
        onClose={() => setSelectedGastoParaDetalle(null)}
        gasto={selectedGastoParaDetalle}
        canEdit={canManage && !isGestionBloqueada}
        onEdit={(g) => {
          setSelectedGastoParaDetalle(null);
          handleOpenEditarGastoDirecto(g as Gasto);
        }}
      />
    </div>
  );
}
