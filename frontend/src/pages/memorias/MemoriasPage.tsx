import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { getGestiones, getAreas, deleteMemoria } from '../../services/presupuestoService';
import alertService from '../../utils/alerts';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useMemorias } from '../../features/memorias/hooks/useMemorias';
import { MemoriasFilter } from '../../features/memorias/components/MemoriasFilter';
import { MemoriasList } from '../../features/memorias/components/MemoriasList';
import { MemoriaForm } from '../../features/memorias/components/MemoriaForm';
import { MemoriaDetalleModal } from '../../features/memorias/components/MemoriaDetalleModal';
import { BookOpen, Plus } from 'lucide-react';
import { Dropdown, PageHeader, GestionSelector } from '../../components/commons';
import { memoriasApi } from '../../features/memorias/api/memoriasApi';

export default function MemoriasPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroArea, setFiltroArea] = useState('todas');
  
  // Modals state
  const [showForm, setShowForm] = useState(false);
  const [showDetalle, setShowDetalle] = useState(false);
  const [selectedMemoria, setSelectedMemoria] = useState<any>(null);

  const [selectedGestionId, setSelectedGestionId] = useState<number | null>(null);
  const [gestiones, setGestiones] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [gList, aList] = await Promise.all([
          getGestiones(),
          getAreas()
        ]);
        setGestiones(gList);
        setAreas(aList);
        if (gList.length > 0) {
          setSelectedGestionId(gList[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const activeGestion = gestiones.find(g => g.id === selectedGestionId);
  const isGestionBloqueada = activeGestion?.estado === 'FINALIZADO';
  const seccionId = 'todas';

  const { memorias, conteos, loading, actionLoading, refetch, handleAction } = useMemorias(
    selectedGestionId,
    filtroArea,
    seccionId,
    activeTab,
    searchParams
  );

  const rolName = (user?.rol_nombre || (user as any)?.rol?.nombre || '').toUpperCase().trim();
  const rolClean = rolName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const isSuperuser = !!user?.is_superuser;
  const isAprobador = isSuperuser || rolClean === 'APROBADOR' || rolClean === 'ADMINISTRADOR';
  const isPlanificador = !isSuperuser && rolClean.includes('PLANIFIC');
  const isGerente = !isSuperuser && !isPlanificador && rolClean === 'GERENTE';
  const isElaborador = !isSuperuser && !isAprobador && !isPlanificador && !isGerente && rolClean === 'ELABORADOR';
  
  const canCreate = isAprobador || isElaborador || isGerente;
  const canGlobalView = isAprobador || isPlanificador;
  const canEnviarBorradores = isSuperuser || isGerente || isElaborador;

  // Inicializar la pestaña según el rol del usuario autenticado
  useEffect(() => {
    if (!user) return;
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
      return;
    }
    if (isSuperuser || isGerente) {
      setActiveTab('espera');
    } else if (isPlanificador) {
      setActiveTab('planificacion');
    } else if (isAprobador) {
      setActiveTab('finanzas');
    } else {
      setActiveTab('todas');
    }
  }, [user, isSuperuser, isGerente, isPlanificador, isAprobador, searchParams]);

  const handleCreate = () => {
    setSelectedMemoria(null);
    setShowForm(true);
  };

  const handleEdit = (memoria: any) => {
    setSelectedMemoria(memoria);
    setShowForm(true);
  };

  const handleView = (id: number) => {
    setSelectedMemoria({ id });
    setShowDetalle(true);
  };

  const handleDelete = async (id: number) => {
    const confirm = await alertService.confirm({
      title: '¿Eliminar Memoria de Cálculo?',
      text: 'Esta acción eliminará de forma permanente el borrador de la memoria de cálculo y todos sus ítems presupuestados.',
      confirmButtonText: 'Sí, eliminar',
      isDanger: true,
    });
    if (!confirm) return;

    try {
      await deleteMemoria(id);
      alertService.success('Eliminado', 'La memoria de cálculo ha sido eliminada con éxito.');
      refetch();
    } catch (error: any) {
      console.error(error);
      alertService.error('Error', error?.response?.data?.detail || 'No se pudo eliminar la memoria de cálculo.');
    }
  };

  const handleEnviarTodas = async () => {
    if (!canEnviarBorradores) {
      alertService.warning('Acceso denegado', 'No tienes permisos para enviar memorias de cálculo.');
      return;
    }

    if (isGestionBloqueada) {
      alertService.warning('Gestión Bloqueada', 'La formulación para la gestión seleccionada está finalizada.');
      return;
    }

    const cantidadBorradores = conteos?.borrador || 0;
    if (cantidadBorradores === 0) {
      alertService.info('Sin borradores', 'No existen memorias de cálculo en estado Borrador para enviar.');
      return;
    }

    const confirmed = await alertService.confirm({
      title: '¿Enviar todos los borradores?',
      text: `¿Está seguro de enviar ${
        cantidadBorradores === 1
          ? 'la memoria de cálculo en borrador'
          : `las ${cantidadBorradores} memorias de cálculo en borrador`
      } a revisión formal de Gerencia?`,
      confirmButtonText: 'Sí, enviar borradores',
      cancelButtonText: 'Cancelar',
      icon: 'question',
    });

    if (!confirmed) return;

    try {
      const payload: { gestion?: number; seccion?: number; area?: number } = {};
      if (selectedGestionId) payload.gestion = selectedGestionId;
      if (filtroArea && filtroArea !== 'todas') payload.area = Number(filtroArea);

      await handleAction(
        () => memoriasApi.enviarTodasGerencia(payload),
        cantidadBorradores === 1
          ? 'Memoria enviada a revisión de Gerencia exitosamente.'
          : `Se enviaron ${cantidadBorradores} memorias a revisión de Gerencia exitosamente.`
      );
    } catch (err: any) {
      console.error('Error al enviar borradores:', err);
      alertService.error(
        'Error al enviar',
        err?.response?.data?.error || err?.response?.data?.message || 'No se pudieron enviar las memorias.'
      );
    }
  };

  return (
    <div className="p-6">

      {/* Cabecera Institucional Unificada */}
      <PageHeader
        icon={<BookOpen size={26} />}
        title="Módulo de Memorias de Cálculo"
        subtitle="Formulación, sustento técnico ítem por ítem y ciclo de aprobación para la Planificación Operativa Anual (POA)."
        className="mb-6"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <GestionSelector
              gestiones={gestiones}
              selectedGestionId={selectedGestionId}
              onSelectGestion={(id) => setSelectedGestionId(id)}
            />

            {canCreate && (
              <button
                type="button"
                onClick={handleCreate}
                disabled={isGestionBloqueada}
                className="btn-primary text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Plus size={15} /> Formular Memoria
              </button>
            )}
          </div>
        }
      >
        {isGestionBloqueada && (
          <div className="p-3 bg-blue-50/70 border border-blue-200 dark:bg-blue-950/40 dark:border-blue-800 rounded-xl flex items-center gap-3 text-xs text-blue-800 dark:text-blue-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-blue-600 dark:text-blue-400"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            <span>
              <strong>Formulación de la Gestión {activeGestion?.anio} cerrada:</strong> Las memorias de cálculo están consolidadas para el presupuesto y no admiten modificaciones.
            </span>
          </div>
        )}
      </PageHeader>


      <MemoriasFilter
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filtroArea={filtroArea}
        setFiltroArea={setFiltroArea}
        areas={areas}
        canCreate={canCreate}
        canGlobalView={canGlobalView}
        onRefresh={refetch}
        onCreate={handleCreate}
        onEnviarTodas={handleEnviarTodas}
        actionLoading={actionLoading}
        conteos={conteos}
        isElaborador={isElaborador}
        isTrabajador={!isSuperuser && !isAprobador && !isPlanificador && !isGerente && !isElaborador}
        isGerente={isGerente}
        isSuperuser={isSuperuser}
        isAprobador={isAprobador}
        isPlanificador={isPlanificador}
        canEnviarBorradores={canEnviarBorradores}
        isGestionBloqueada={isGestionBloqueada}
      />

      <MemoriasList
        memorias={memorias}
        loading={loading}
        canCreate={canCreate}
        isElaborador={isElaborador}
        isGerente={isGerente}
        isPlanificador={isPlanificador}
        isAprobador={isAprobador}
        isSuperuser={isSuperuser}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {showForm && (
        <MemoriaForm
          memoria={selectedMemoria}
          onClose={() => setShowForm(false)}
          onSaved={(savedId: number) => {
            setShowForm(false);
            refetch();
            if (savedId) {
              setSelectedMemoria({ id: savedId });
              setShowDetalle(true);
            }
          }}
        />
      )}

      {showDetalle && selectedMemoria?.id && (
        <MemoriaDetalleModal
          memoriaId={selectedMemoria.id}
          onClose={() => setShowDetalle(false)}
          onActionSuccess={(action?: string, mem?: any) => {
            if (action === "EDIT" && mem) {
              setSelectedMemoria(mem);
              setShowForm(true);
            } else {
              refetch();
            }
          }}
        />
      )}
    </div>
  );
}
