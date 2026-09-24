import { useState, useCallback, useEffect, useMemo } from 'react';
import { partidasApi } from '../api/partidasApi';
import type { Partida, PartidaEstadoFilter, PartidaStats } from '../types/partidas.types';
import { GRUPOS_PRESUPUESTARIOS } from '../types/partidas.types';
import alertService from '../../../utils/alerts';

export function usePartidas() {
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [activeTab, setActiveTab] = useState<PartidaEstadoFilter>('todas');
  const [selectedGrupo, setSelectedGrupo] = useState<string>('todos');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 12;

  const fetchPartidas = useCallback(async () => {
    try {
      setLoading(true);
      const data = await partidasApi.getPartidas({ clase: 'EGRESO' });
      // Filtrar egresos en el cliente por seguridad
      const egresos = data.filter((p) => (p.clase || '').toUpperCase() === 'EGRESO');
      setPartidas(egresos);
    } catch (error) {
      console.error('Error al cargar catálogo de partidas:', error);
      alertService.error('Error de carga', 'No se pudieron obtener las partidas presupuestarias.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPartidas();
  }, [fetchPartidas]);

  // Al cambiar filtros o búsqueda, volver a la página 1
  const handleSearchChange = useCallback((term: string) => {
    setSearch(term);
    setCurrentPage(1);
  }, []);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab as PartidaEstadoFilter);
    setCurrentPage(1);
  }, []);

  const handleGrupoChange = useCallback((grupo: string) => {
    setSelectedGrupo(grupo);
    setCurrentPage(1);
  }, []);

  // js-combine-iterations: Cálculo de estadísticas y grupos en un solo pase
  const { stats, gruposOpciones } = useMemo(() => {
    let activas = 0;
    let inactivas = 0;
    const gruposMap = new Map<string, number>();

    for (let i = 0; i < partidas.length; i++) {
      const p = partidas[i];
      if (p.estado) {
        activas++;
      } else {
        inactivas++;
      }

      const digit = p.codigo?.trim().charAt(0) || '0';
      gruposMap.set(digit, (gruposMap.get(digit) || 0) + 1);
    }

    const grupos = Array.from(gruposMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([digit, count]) => ({
        id: `${digit}0000`,
        digit,
        label: GRUPOS_PRESUPUESTARIOS[digit] || `Grupo ${digit}0000`,
        count,
      }));

    const statsObj: PartidaStats = {
      total: partidas.length,
      activas,
      inactivas,
      totalGrupos: grupos.length,
    };

    return {
      stats: statsObj,
      gruposOpciones: grupos,
    };
  }, [partidas]);

  // Filtrado reactivo optimizado
  const partidasFiltradas = useMemo(() => {
    const term = search.trim().toLowerCase();

    return partidas.filter((partida) => {
      // 1. Filtro por Estado (Pestañas)
      if (activeTab === 'activas' && !partida.estado) return false;
      if (activeTab === 'inactivas' && partida.estado) return false;

      // 2. Filtro por Grupo presupuestario
      if (selectedGrupo !== 'todos') {
        const firstDigit = partida.codigo?.trim().charAt(0);
        if (selectedGrupo.startsWith(firstDigit) === false) return false;
      }

      // 3. Filtro por Búsqueda textual
      if (term) {
        const matchCodigo = partida.codigo?.toLowerCase().includes(term);
        const matchNombre = partida.nombre?.toLowerCase().includes(term);
        const matchDesc = (partida.descripcion ?? '').toLowerCase().includes(term);
        if (!matchCodigo && !matchNombre && !matchDesc) return false;
      }

      return true;
    });
  }, [partidas, search, activeTab, selectedGrupo]);

  // Paginación derivada
  const paginatedPartidas = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return partidasFiltradas.slice(start, start + pageSize);
  }, [partidasFiltradas, currentPage, pageSize]);

  // Acción para cambiar estado (Activar / Desactivar)
  const handleToggleEstado = useCallback(
    async (item: Partida) => {
      const nuevoEstado = !item.estado;

      const confirmado = await alertService.confirm({
        title: nuevoEstado ? '¿Activar partida presupuestaria?' : '¿Desactivar partida presupuestaria?',
        text: nuevoEstado
          ? `La partida "${item.codigo} - ${item.nombre}" se habilitará para nuevas formulaciones y memorias.`
          : `La partida "${item.codigo} - ${item.nombre}" quedará en baja lógica y no estará disponible para nuevas asignaciones.`,
        confirmButtonText: nuevoEstado ? 'Sí, activar' : 'Sí, desactivar',
        isDanger: !nuevoEstado,
      });

      if (!confirmado) return;

      setActionLoading(true);
      try {
        await partidasApi.toggleEstadoPartida(item.id, nuevoEstado);
        alertService.success(
          nuevoEstado ? 'Partida activada' : 'Partida desactivada',
          `La partida "${item.codigo}" fue actualizada a estado ${nuevoEstado ? 'Activa' : 'Inactiva'}.`
        );
        await fetchPartidas();
      } catch (error: any) {
        console.error('Error al cambiar estado de la partida:', error);
        alertService.error(
          'Error al actualizar',
          error?.response?.data?.detail || 'No se pudo actualizar el estado de la partida.'
        );
      } finally {
        setActionLoading(false);
      }
    },
    [fetchPartidas]
  );

  return {
    partidas,
    partidasFiltradas,
    paginatedPartidas,
    loading,
    actionLoading,
    stats,
    gruposOpciones,
    search,
    activeTab,
    selectedGrupo,
    currentPage,
    pageSize,
    totalFiltrados: partidasFiltradas.length,
    setSearch: handleSearchChange,
    setActiveTab: handleTabChange,
    setSelectedGrupo: handleGrupoChange,
    setCurrentPage,
    refetch: fetchPartidas,
    handleToggleEstado,
  };
}
