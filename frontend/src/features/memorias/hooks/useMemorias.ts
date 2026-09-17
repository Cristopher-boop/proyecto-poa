import { useState, useCallback, useEffect } from 'react';
import { memoriasApi, MemoriaCalculo } from '../api/memoriasApi';
import alertService from '../../../utils/alerts';

export function useMemorias(gestionId: number | null, areaId: string, seccionId: string, activeTab: string, searchParams: any) {
  const [memorias, setMemorias] = useState<MemoriaCalculo[]>([]);
  const [conteos, setConteos] = useState<any>({
    todas: 0, borrador: 0, espera: 0, planificacion: 0, finanzas: 0, aprobadas: 0, rechazadas: 0
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const fetchMemorias = useCallback(async () => {
    if (!gestionId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params: any = { gestion: gestionId };
      if (areaId !== 'todas') params.area = areaId;
      if (seccionId !== 'todas') params.seccion = seccionId;
      
      // No enviamos el estado al backend porque algunas pestaÃ±as agrupan mÃºltiples estados (ej. "espera")
      const data = await memoriasApi.getMemorias(params);
      
      const newConteos = {
        todas: data.length,
        borrador: data.filter(m => m.estado === 'BORRADOR').length,
        espera: data.filter(m => ['PENDIENTE_GERENCIA', 'PENDIENTE_PLANIFICACION', 'APROBADO_GERENCIA', 'APROBADO_PLANIFICACION'].includes(m.estado)).length,
        planificacion: data.filter(m => m.estado === 'PENDIENTE_PLANIFICACION').length,
        finanzas: data.filter(m => ['APROBADO_GERENCIA', 'APROBADO_PLANIFICACION'].includes(m.estado)).length,
        aprobadas: data.filter(m => m.estado === 'APROBADO_FINANZAS').length,
        rechazadas: data.filter(m => m.estado === 'RECHAZADO').length,
        pendiente: data.filter(m => m.estado === 'PENDIENTE_GERENCIA').length,
      };
      setConteos(newConteos);
      
      // Filtro local exacto igual al legacy
      let filteredData = data;
      if (activeTab !== 'todas') {
        filteredData = data.filter(m => {
          if (activeTab === 'borrador') return m.estado === 'BORRADOR';
          if (activeTab === 'espera') {
            return ['PENDIENTE_GERENCIA', 'PENDIENTE_PLANIFICACION', 'APROBADO_GERENCIA', 'APROBADO_PLANIFICACION'].includes(m.estado);
          }
          if (activeTab === 'pendiente') return m.estado === 'PENDIENTE_GERENCIA';
          if (activeTab === 'planificacion') return m.estado === 'PENDIENTE_PLANIFICACION';
          if (activeTab === 'finanzas') return m.estado === 'APROBADO_GERENCIA' || m.estado === 'APROBADO_PLANIFICACION';
          if (activeTab === 'aprobadas') return m.estado === 'APROBADO_FINANZAS';
          if (activeTab === 'rechazadas') return m.estado === 'RECHAZADO';
          return true;
        });
      }
      
      setMemorias(filteredData);
    } catch (error) {
      console.error('Error fetching memorias:', error);
      alertService.error('Error al cargar memorias de cálculo');
    } finally {
      setLoading(false);
    }
  }, [gestionId, areaId, seccionId, activeTab]);

  useEffect(() => {
    fetchMemorias();
  }, [fetchMemorias]);

  const handleAction = async (actionFn: () => Promise<any>, successMsg: string) => {
    setActionLoading(true);
    try {
      await actionFn();
      alertService.success(successMsg);
      await fetchMemorias();
      return true;
    } catch (error: any) {
      console.error('Action error:', error);
      alertService.error(error?.response?.data?.error || 'Ocurrió un error en la operación');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  return {
    memorias,
    conteos,
    loading,
    actionLoading,
    refetch: fetchMemorias,
    handleAction,
  };
}
