import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useGestion } from '../../contexts/GestionContext';
import { useEjecucion } from '../../features/ejecucion/hooks/useEjecucion';
import {
  GastosTable,
  MemoriasSaldoTable,
  GastoFormModal,
} from '../../features/ejecucion/components';
import {
  ResumenCards,
  ResumenCardItem,
  TabsFilter,
  TabItem,
  FilterPanel,
  Button,
  PageHeader,
  GestionSelector,
} from '../../components/commons';
import { formatMoney, formatPercent } from '../../utils/formatters';
import { Gasto } from '../../services/presupuestoService';
import {
  TrendingDown,
  Receipt,
  BookOpen,
  Plus,
  RefreshCw,
  Lock,
  Calendar,
  DollarSign,
  WalletCards,
  PieChart,
} from 'lucide-react';

export default function EjecucionPage() {
  const { user } = useAuth();
  const { gestiones, gestionActiva, gestionActivaId, setGestionActivaId, isGestionBloqueada } =
    useGestion();

  const rolName = (user?.rol_nombre || (user as any)?.rol?.nombre || '').toUpperCase().trim();
  const rolClean = rolName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const isSuperuser = Boolean(user?.is_superuser);
  const canManage = isSuperuser || rolClean === 'APROBADOR' || rolClean === 'ADMINISTRADOR';

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

  // Modales
  const [showModalGasto, setShowModalGasto] = useState(false);
  const [gastoToEdit, setGastoToEdit] = useState<Gasto | null>(null);

  const handleOpenCrear = (preselectedMemoriaId?: number) => {
    if (preselectedMemoriaId) {
      // Abre con memoria pre-seleccionada
      setGastoToEdit({ memoria: preselectedMemoriaId } as any);
    } else {
      setGastoToEdit(null);
    }
    setShowModalGasto(true);
  };

  const handleOpenEditar = (gasto: Gasto) => {
    setGastoToEdit(gasto);
    setShowModalGasto(true);
  };

  const tabs: TabItem[] = [
    {
      id: 'gastos',
      label: 'Gastos Ejecutados',
      count: metrics.isFiltered ? gastosFiltrados.length : gastos.length,
      icon: <Receipt size={16} />,
      activeColorClass: 'border-rose-500 text-rose-600 dark:text-rose-400 font-bold bg-rose-500/[0.04]',
      activeBadgeClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold',
    },
    {
      id: 'memorias',
      label: 'Memorias con Saldo',
      count: renglonesDisponibles.length,
      icon: <BookOpen size={16} />,
      activeColorClass: 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/[0.04]',
      activeBadgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold',
    },
  ];

  const areaOptions = areas.map((a) => ({
    value: String(a.id),
    label: a.nombre,
  }));

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Cabecera Principal Unificada */}
      <PageHeader
        icon={<TrendingDown size={28} />}
        title="Módulo de Ejecución Presupuestaria"
        subtitle="Control, registro y monitoreo del gasto ejecutado contra memorias de cálculo POA aprobadas."
        className="mb-6"
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <GestionSelector
              gestiones={gestiones}
              selectedGestionId={gestionActivaId}
              onSelectGestion={(id) => setGestionActivaId(id)}
            />

            {canManage && (
              <Button
                variant="danger"
                size="sm"
                disabled={isGestionBloqueada}
                onClick={() => handleOpenCrear()}
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


      {/* Panel de Filtros Avanzados - ARRIBA de las cards de totales (Persistente en todas las pestañas) */}
      <FilterPanel
        searchTerm={filters.searchTerm}
        onSearchChange={filters.setSearchTerm}
        searchPlaceholder={
          filters.activeTab === 'gastos'
            ? 'Buscar por comprobante, preventivo, observación, código POA...'
            : 'Buscar por código POA, justificación técnica...'
        }
        areaOptions={areaOptions}
        selectedArea={filters.filtroArea}
        onAreaChange={filters.setFiltroArea}
        areaPlaceholder="Todas las Áreas"
        partidaOptions={partidasDisponibles}
        selectedPartida={filters.filtroPartida}
        onPartidaChange={filters.setFiltroPartida}
        partidaPlaceholder="Todas las Partidas"
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
            onClick={actions.refetch}
            icon={<RefreshCw size={15} className={loading ? 'animate-spin' : ''} />}
            title="Actualizar datos"
          />
        }
      />

      {/* Tarjetas KPI de Resumen Financiero */}
      <ResumenCards
        items={[
          {
            title: 'Presupuesto Asignado',
            value: formatMoney(metrics.totalInicial),
            icon: <DollarSign size={18} />,
            color: 'blue',
          },
          {
            title: 'Total Ejecutado',
            value: formatMoney(metrics.totalGastado),
            icon: <TrendingDown size={18} />,
            color: 'rose',
          },
          {
            title: 'Saldo Disponible',
            value: formatMoney(metrics.totalDisponible),
            icon: <WalletCards size={18} />,
            color: 'emerald',
          },
          {
            title: 'Ejecución POA',
            value: formatPercent(metrics.pctGlobal),
            icon: <PieChart size={18} />,
            color: 'primary',
            progress: {
              value: Math.min(100, metrics.pctGlobal),
            },
          },
        ]}
      />

      {/* Navegador de Pestañas - DEBAJO de las cards de totales */}
      <TabsFilter
        tabs={tabs}
        activeTab={filters.activeTab}
        onTabChange={(id) => filters.setActiveTab(id as any)}
      />

      {/* Contenido de Tablas por Pestaña */}
      {filters.activeTab === 'gastos' && (
        <GastosTable
          gastos={gastosFiltrados}
          loading={loading}
          canManage={canManage && !isGestionBloqueada}
          onEdit={handleOpenEditar}
        />
      )}

      {filters.activeTab === 'memorias' && (
        <MemoriasSaldoTable
          memorias={renglonesFiltrados}
          loading={loading}
          canExecuteGasto={canManage && !isGestionBloqueada}
          onSelectMemoria={(memoriaId) => handleOpenCrear(memoriaId)}
        />
      )}

      {/* Modal de Registro y Edición de Gasto */}
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
    </div>
  );
}
