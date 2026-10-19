import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import {
  getGestiones,
  getAreas,
  deleteMemoria,
  getEstadoTechoArea,
  toggleExclusionTecho,
  enviarReajusteTecho,
  EstadoTechoArea,
} from '../../services/presupuestoService';
import alertService from '../../utils/alerts';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useMemorias } from '../../features/memorias/hooks/useMemorias';
import { MemoriasFilter } from '../../features/memorias/components/MemoriasFilter';
import { MemoriasList } from '../../features/memorias/components/MemoriasList';
import { MemoriaForm } from '../../features/memorias/components/MemoriaForm';
import { MemoriaDetalleModal } from '../../features/memorias/components/MemoriaDetalleModal';
import { MemoriaExcelDuplicatorModal } from '../../features/memorias/components/MemoriaExcelDuplicatorModal';
import { CopiaGastosModal } from '../../features/memorias/components/CopiaGastosModal';
import { AlertaRecorteTecho } from '../../features/memorias/components/AlertaRecorteTecho';
import { BookOpen, Plus, Copy } from 'lucide-react';
import { Dropdown, PageHeader, GestionSelector } from '../../components/commons';
import { useGestion } from '../../contexts/GestionContext';
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
  const [showCopiaGastosModal, setShowCopiaGastosModal] = useState(false);
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [selectedOrigenParaEditor, setSelectedOrigenParaEditor] = useState<number | undefined>(undefined);
  const [selectedMemoria, setSelectedMemoria] = useState<any>(null);

  const {
    gestiones,
    gestionActivaId: selectedGestionId,
    gestionActiva: activeGestion,
    setGestionActivaId: setSelectedGestionId,
    isGestionBloqueada,
  } = useGestion();
  const [areas, setAreas] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const aList = await getAreas();
        setAreas(aList);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);
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

  // Estado para el flujo de recorte de techo presupuestario (Lic. Acha)
  const [estadoTecho, setEstadoTecho] = useState<EstadoTechoArea | null>(null);
  const [enviandoReajuste, setEnviandoReajuste] = useState(false);

  const resolvedAreaId = (filtroArea && filtroArea !== 'todas')
    ? Number(filtroArea)
    : (user?.area_id ? Number(user.area_id) : undefined);

  const cargarEstadoTecho = useCallback(async () => {
    if (!selectedGestionId) {
      setEstadoTecho(null);
      return;
    }
    // Si tiene vista global institucional y está viendo todas las áreas, no se muestra alerta individual
    if (canGlobalView && (!filtroArea || filtroArea === 'todas')) {
      setEstadoTecho(null);
      return;
    }

    try {
      const params: { gestion: number; area?: number } = { gestion: selectedGestionId };
      if (resolvedAreaId) {
        params.area = resolvedAreaId;
      }
      const data = await getEstadoTechoArea(params);
      setEstadoTecho(data);
    } catch (err: any) {
      setEstadoTecho(null);
    }
  }, [selectedGestionId, resolvedAreaId, canGlobalView, filtroArea]);

  useEffect(() => {
    cargarEstadoTecho();
  }, [cargarEstadoTecho]);

  const isRecorteTechoActive = Boolean(
    estadoTecho && (estadoTecho.techo_reducido || estadoTecho.requiere_ajuste)
  );

  const handleToggleExclusion = async (memoriaId: number, excluida: boolean) => {
    try {
      const res = await toggleExclusionTecho(memoriaId, excluida);
      alertService.toast(
        excluida ? 'Memoria excluida del POA (No enviar)' : 'Memoria re-incluida en el POA',
        'info'
      );
      if (res.estado_area) {
        setEstadoTecho(res.estado_area);
      } else {
        await cargarEstadoTecho();
      }
      refetch();
    } catch (error: any) {
      console.error('Error al cambiar inclusión de memoria:', error);
      alertService.error('Error', error?.response?.data?.error || 'No se pudo actualizar el estado de la memoria.');
    }
  };

  const handleEnviarPaseDirecto = async () => {
    if (!estadoTecho || !selectedGestionId) return;
    const areaId = estadoTecho.area_id || resolvedAreaId;
    if (!areaId) return;

    if (!estadoTecho.puede_pase_directo) {
      const deficitFormatted = new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(Number(estadoTecho.deficit_recorte || 0));
      alertService.warning(
        'Meta de recorte pendiente',
        `El total formulado supera el nuevo techo presupuestario asignado. Aún debe recortar o excluir memorias por al menos -${deficitFormatted} para habilitar el Pase Directo.`
      );
      return;
    }

    const memoriasIncluidasIds = (estadoTecho.memorias || [])
      .filter((m) => !m.excluida_por_techo)
      .map((m) => m.id);

    if (memoriasIncluidasIds.length === 0) {
      alertService.warning('Sin memorias', 'Debe incluir al menos una memoria de cálculo en el POA.');
      return;
    }

    const confirmed = await alertService.confirm({
      title: '¿Confirmar Envío de Adecuación con Pase Directo?',
      text: `Se regularizarán y aprobaran directamente ${memoriasIncluidasIds.length} memorias de cálculo hacia Presupuestos/Finanzas, adecuándose al nuevo techo presupuestario. Las memorias desmarcadas quedarán en borrador como excluidas. ¿Desea proceder?`,
      confirmButtonText: 'Sí, enviar con Pase Directo',
      cancelButtonText: 'Cancelar',
      icon: 'question',
    });

    if (!confirmed) return;

    try {
      setEnviandoReajuste(true);
      const res = await enviarReajusteTecho({
        gestion: selectedGestionId,
        area: areaId,
        memorias_seleccionadas: memoriasIncluidasIds,
        nota: 'Adecuación presupuestaria por recorte de techo (Pase Directo)',
      });

      alertService.success(
        'Adecuación Aprobada Directamente',
        res.mensaje || 'Se han aprobado directamente las memorias de cálculo cumpliendo el nuevo techo presupuestario.'
      );
      await cargarEstadoTecho();
      refetch();
    } catch (error: any) {
      console.error('Error en pase directo:', error);
      alertService.error(
        'Error al enviar adecuación',
        error?.response?.data?.error || error?.response?.data?.message || 'Ocurrió un error al enviar la adecuación.'
      );
    } finally {
      setEnviandoReajuste(false);
    }
  };

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
      cargarEstadoTecho();
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
              isRecorteTechoActive ? (
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-bold shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                  <span>Adecuación de Techo Activa — Formulación Bloqueada</span>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setShowCopiaGastosModal(true)}
                    disabled={isGestionBloqueada}
                    className="px-3.5 py-2 rounded-xl border border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-300 hover:bg-blue-500/20 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors shadow-xs"
                    title="Duplicar memorias de cálculo desde una gestión anterior"
                  >
                    <Copy size={15} className="text-blue-600 dark:text-blue-400" /> Duplicar Memorias de Gestión Anterior
                  </button>
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={isGestionBloqueada}
                    className="btn-primary text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Plus size={15} /> Formular Memoria
                  </button>
                </>
              )
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

      {/* Alerta Obligatoria de Recorte de Techo si está activa */}
      {isRecorteTechoActive && estadoTecho && (
        <AlertaRecorteTecho
          estadoTecho={estadoTecho}
          onEnviarPaseDirecto={handleEnviarPaseDirecto}
          actionLoading={enviandoReajuste}
        />
      )}

      <MemoriasFilter
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filtroArea={filtroArea}
        setFiltroArea={setFiltroArea}
        areas={areas}
        canCreate={canCreate && !isRecorteTechoActive}
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
        canCreate={canCreate && !isRecorteTechoActive}
        isElaborador={isElaborador}
        isGerente={isGerente}
        isPlanificador={isPlanificador}
        isAprobador={isAprobador}
        isSuperuser={isSuperuser}
        isRecorteTechoActive={isRecorteTechoActive}
        onToggleExclusion={handleToggleExclusion}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {showForm && (
        <MemoriaForm
          memoria={selectedMemoria}
          isRecorteTechoActive={isRecorteTechoActive}
          onClose={() => setShowForm(false)}
          onSaved={(savedId: number) => {
            setShowForm(false);
            refetch();
            cargarEstadoTecho();
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
              cargarEstadoTecho();
            }
          }}
        />
      )}

      {showCopiaGastosModal && (
        <CopiaGastosModal
          isOpen={showCopiaGastosModal}
          onClose={() => setShowCopiaGastosModal(false)}
          activeGestion={activeGestion}
          gestiones={gestiones}
          user={user}
          currentAreaId={filtroArea !== 'todas' ? filtroArea : undefined}
          onOpenEditor={(origenId) => {
            setSelectedOrigenParaEditor(origenId);
            setShowEditorModal(true);
          }}
          onSuccess={() => {
            refetch();
            cargarEstadoTecho();
          }}
        />
      )}

      {showEditorModal && (
        <MemoriaExcelDuplicatorModal
          isOpen={showEditorModal}
          onClose={() => setShowEditorModal(false)}
          activeGestion={activeGestion}
          gestiones={gestiones}
          user={user}
          currentAreaId={filtroArea !== 'todas' ? filtroArea : undefined}
          initialOrigenId={selectedOrigenParaEditor}
          onSuccess={() => {
            refetch();
            cargarEstadoTecho();
          }}
        />
      )}
    </div>
  );
}
