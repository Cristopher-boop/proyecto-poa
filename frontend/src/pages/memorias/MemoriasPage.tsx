import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { getGestiones, getAreas } from '../../services/presupuestoService';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useMemorias } from '../../features/memorias/hooks/useMemorias';
import { MemoriasFilter } from '../../features/memorias/components/MemoriasFilter';
import { MemoriasList } from '../../features/memorias/components/MemoriasList';
import { MemoriaForm } from '../../features/memorias/components/MemoriaForm';
import { MemoriaDetalleModal } from '../../features/memorias/components/MemoriaDetalleModal';
import { Dropdown } from '../../components/commons';

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

  // Inicializar la pestaña según el rol del usuario autenticado
  useEffect(() => {
    if (!user) return;
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
      return;
    }
    if (isGerente) {
      setActiveTab('pendiente');
    } else if (isPlanificador) {
      setActiveTab('planificacion');
    } else if (isAprobador) {
      setActiveTab('finanzas');
    } else {
      setActiveTab('todas');
    }
  }, [user, isGerente, isPlanificador, isAprobador, searchParams]);

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

  const handleDelete = (id: number) => {
    // TODO: Implementar lógica de eliminación con memoriasApi.deleteMemoria
  };

  const handleEnviarTodas = () => {
    // TODO: Implementar con memoriasApi.enviarTodasGerencia
  };

  return (
    <div className="p-6">

      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-theme-primary/15 text-theme-main">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-theme-primary"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-theme-main tracking-tight">Módulo de Memorias de Cálculo</h1>
            <p className="mt-1 text-sm text-theme-muted">
              Formulación, sustento técnico ítem por ítem y ciclo de aprobación para la Planificación Operativa Anual (POA).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-theme-base/80 p-1.5 rounded-2xl border border-theme-border shadow-sm">
          <div className="flex items-center gap-2 px-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-theme-muted hidden sm:block"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            <span className="text-xs font-semibold uppercase tracking-wider text-theme-muted hidden sm:inline-block">Gestión:</span>
            <Dropdown
              items={gestiones.map((g: any) => ({
                id: g.id,
                label: `Gestión ${g.anio} (${g.estado_display})`,
                badge: String(g.anio),
              }))}
              value={selectedGestionId}
              onChange={(val) => setSelectedGestionId(Number(val))}
              className="min-w-[210px]"
              size="sm"
            />
          </div>

          {canCreate && (
            <button
              onClick={handleCreate}
              disabled={isGestionBloqueada}
              className="btn-primary text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 h-full transition-transform hover:scale-105"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> Formular Memoria
            </button>
          )}
        </div>
      </div>

      {isGestionBloqueada && (
        <div className="mb-4 p-3 bg-blue-50/70 border border-blue-200 dark:bg-blue-950/40 dark:border-blue-800 rounded-xl flex items-center gap-3 text-xs text-blue-800 dark:text-blue-300">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-blue-600 dark:text-blue-400"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          <span>
            <strong>Formulación de la Gestión {activeGestion?.anio} cerrada:</strong> Las memorias de cálculo están consolidadas para el presupuesto y no admiten modificaciones.
          </span>
        </div>
      )}

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
      />

      <MemoriasList
        memorias={memorias}
        loading={loading}
        canCreate={canCreate}
        isGerente={isGerente}
        isPlanificador={isPlanificador}
        isAprobador={isAprobador}
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
