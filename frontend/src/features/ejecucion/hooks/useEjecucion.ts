import { useState, useEffect, useCallback, useMemo } from 'react';
import { ejecucionApi } from '../api/ejecucionApi';
import { Gasto, PresupuestoArea, MemoriaCalculo, ResumenEjecucion, Area } from '../../../services/presupuestoService';
import { useGestion } from '../../../contexts/GestionContext';
import alertService from '../../../utils/alerts';

export function useEjecucion() {
  const { gestionActiva, gestionActivaId, isGestionBloqueada } = useGestion();

  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [presupuestosArea, setPresupuestosArea] = useState<PresupuestoArea[]>([]);
  const [memorias, setMemorias] = useState<MemoriaCalculo[]>([]);
  const [resumen, setResumen] = useState<ResumenEjecucion | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);

  // Filtros
  const [activeTab, setActiveTab] = useState<'gastos' | 'memorias'>('gastos');
  const [filtroArea, setFiltroArea] = useState<string>('todas');
  const [filtroPartida, setFiltroPartida] = useState<string>('todas');
  const [fechaDesde, setFechaDesde] = useState<string>('');
  const [fechaHasta, setFechaHasta] = useState<string>('');
  const [mesDesde, setMesDesde] = useState<number>(1);
  const [mesHasta, setMesHasta] = useState<number>(12);
  const [montoMin, setMontoMin] = useState<string>('');
  const [montoMax, setMontoMax] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setFiltroArea('todas');
    setFiltroPartida('todas');
    setFechaDesde('');
    setFechaHasta('');
    setMesDesde(1);
    setMesHasta(12);
    setMontoMin('');
    setMontoMax('');
  }, []);

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      searchTerm.trim() ||
      filtroArea !== 'todas' ||
      filtroPartida !== 'todas' ||
      fechaDesde ||
      fechaHasta ||
      mesDesde !== 1 ||
      mesHasta !== 12 ||
      montoMin !== '' ||
      montoMax !== ''
    );
  }, [
    searchTerm,
    filtroArea,
    filtroPartida,
    fechaDesde,
    fechaHasta,
    mesDesde,
    mesHasta,
    montoMin,
    montoMax,
  ]);

  const fetchData = useCallback(async () => {
    if (!gestionActivaId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [gList, techos, memList, resData, aList] = await Promise.all([
        ejecucionApi.getGastos({ gestion: gestionActivaId }),
        ejecucionApi.getPresupuestosArea({ gestion: gestionActivaId }),
        ejecucionApi.getMemorias({ gestion: gestionActivaId }),
        ejecucionApi.getResumenEjecucion({ gestion: gestionActivaId }).catch(() => null),
        ejecucionApi.getAreas(),
      ]);

      setGastos(gList);
      setPresupuestosArea(techos);
      setMemorias(memList);
      setResumen(resData);
      setAreas(aList);
    } catch (err) {
      console.error('Error al cargar datos de ejecución presupuestaria:', err);
      alertService.error('Error', 'No se pudieron cargar los datos de ejecución presupuestaria.');
    } finally {
      setLoading(false);
    }
  }, [gestionActivaId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Cálculos de KPIs Institucionales Globales
  const totalInicialGlobal = useMemo(() => {
    return presupuestosArea.reduce((acc, p) => acc + parseFloat(p.monto_inicial || '0'), 0);
  }, [presupuestosArea]);

  const totalGastadoGlobal = useMemo(() => {
    return gastos.reduce((acc, g) => acc + parseFloat(String(g.monto_ejecutado) || '0'), 0);
  }, [gastos]);

  const totalDisponibleGlobal = useMemo(() => {
    return Math.max(0, totalInicialGlobal - totalGastadoGlobal);
  }, [totalInicialGlobal, totalGastadoGlobal]);

  const pctGlobalInstitucional = useMemo(() => {
    if (totalInicialGlobal <= 0) return 0;
    return Math.min(100, Math.round((totalGastadoGlobal / totalInicialGlobal) * 10000) / 100);
  }, [totalInicialGlobal, totalGastadoGlobal]);

  // Memorias con saldo para imputar gastos
  const renglonesDisponibles = useMemo(() => {
    return memorias
      .filter((m) => ['APROBADO_FINANZAS', 'APROBADO_GERENCIA'].includes(m.estado || ''))
      .map((m) => {
        const totalMemoria = parseFloat((m as any).total_presupuestado || m.total_presupuesto || '0');
        const gastado = parseFloat(m.total_ejecutado || '0');
        const saldo = parseFloat(m.saldo_disponible || (m as any).total_disponible || String(Math.max(0, totalMemoria - gastado)));

        let estadoGasto = 'PENDIENTE';
        if (gastado > 0 && saldo > 0) estadoGasto = 'EJECUTADO_PARCIAL';
        if (saldo <= 0 && gastado > 0) estadoGasto = 'COMPLETADO';

        const partidasString =
          m.detalles?.map((d) => d.partida_codigo || '').join(' ') || m.partida_codigo || '';

        return {
          memoriaId: m.id,
          codigo: m.codigo,
          areaNombre: m.area_nombre || '',
          seccionNombre: m.seccion_nombre || '',
          partidasString,
          partidaNombre: m.partida_nombre || (m.detalles?.[0]?.partida_nombre || 'Partida de gasto'),
          justificacion: m.justificacion,
          montoTotal: totalMemoria,
          montoGastado: gastado,
          saldoDisponible: saldo,
          estadoGasto,
          gastosList: gastos.filter((g) => g.memoria === m.id),
        };
      });
  }, [memorias, gastos]);

  // Lista consolidada de partidas presupuestarias únicas disponibles en esta gestión
  const partidasDisponibles = useMemo(() => {
    const map = new Map<string, string>();
    gastos.forEach((g) => {
      if (g.partida_codigo) {
        map.set(g.partida_codigo, g.partida_nombre || g.partida_codigo);
      }
    });
    memorias.forEach((m) => {
      if (m.partida_codigo) {
        map.set(m.partida_codigo, m.partida_nombre || m.partida_codigo);
      }
      m.detalles?.forEach((d) => {
        if (d.partida_codigo) {
          map.set(d.partida_codigo, d.partida_nombre || d.partida_codigo);
        }
      });
    });
    return Array.from(map.entries())
      .map(([codigo, nombre]) => ({
        value: codigo,
        label: `${codigo} - ${nombre}`,
      }))
      .sort((a, b) => a.value.localeCompare(b.value));
  }, [gastos, memorias]);

  // Filtrado de gastos para la tabla principal
  const gastosFiltrados = useMemo(() => {
    const hayFiltroMeses = mesDesde !== 1 || mesHasta !== 12;

    return gastos.filter((g) => {
      // 1. Filtro por Área
      const matchArea =
        filtroArea === 'todas' ||
        String(g.area_id) === filtroArea ||
        g.area_nombre?.toLowerCase() === filtroArea.toLowerCase();

      // 2. Filtro por Partida Presupuestaria
      const matchPartida =
        filtroPartida === 'todas' ||
        g.partida_codigo === filtroPartida;

      // 3. Filtro por Rango de Fechas / Meses (de la gestión activa)
      let matchFecha = true;
      if (g.fecha_gasto) {
        if (fechaDesde && g.fecha_gasto < fechaDesde) matchFecha = false;
        if (fechaHasta && g.fecha_gasto > fechaHasta) matchFecha = false;

        if (hayFiltroMeses) {
          const parts = g.fecha_gasto.split('-');
          if (parts.length >= 2) {
            const mesNum = parseInt(parts[1], 10);
            if (mesNum < mesDesde || mesNum > mesHasta) {
              matchFecha = false;
            }
          }
        }
      }

      // 4. Filtro por Monto Mínimo y Máximo
      let matchMonto = true;
      const montoNum = parseFloat(String(g.monto_ejecutado) || '0');
      if (montoMin !== '' && !isNaN(Number(montoMin))) {
        if (montoNum < Number(montoMin)) matchMonto = false;
      }
      if (montoMax !== '' && !isNaN(Number(montoMax))) {
        if (montoNum > Number(montoMax)) matchMonto = false;
      }

      // 5. Buscador General DESACOPLADO:
      // Ojo: no debe buscar nada que los filtros específicos ya buscan (área, partida, fechas, montos).
      // Solo busca en comprobante/preventivo/factura, observación y código POA de la memoria.
      let matchSearch = true;
      const term = searchTerm.toLowerCase().trim();
      if (term) {
        matchSearch = Boolean(
          (g.comprobante_num && g.comprobante_num.toLowerCase().includes(term)) ||
          (g.observacion && g.observacion.toLowerCase().includes(term)) ||
          (g.memoria_codigo && g.memoria_codigo.toLowerCase().includes(term))
        );
      }

      return matchArea && matchPartida && matchFecha && matchMonto && matchSearch;
    });
  }, [
    gastos,
    filtroArea,
    filtroPartida,
    fechaDesde,
    fechaHasta,
    mesDesde,
    mesHasta,
    montoMin,
    montoMax,
    searchTerm,
  ]);

  // 1. Total Ejecutado según filtros activos de gastos
  const totalGastadoFiltrado = useMemo(() => {
    return gastosFiltrados.reduce(
      (acc, g) => acc + parseFloat(String(g.monto_ejecutado) || '0'),
      0
    );
  }, [gastosFiltrados]);

  // 2. Presupuesto Asignado según alcance filtrado (Área / Partida / Institucional)
  const totalInicialFiltrado = useMemo(() => {
    // Si no hay filtro de área ni de partida, es el total global de la gestión
    if (filtroArea === 'todas' && filtroPartida === 'todas') {
      return totalInicialGlobal;
    }

    // Si se especificó una partida:
    if (filtroPartida !== 'todas') {
      let sumaPartida = 0;
      memorias
        .filter((m) => ['APROBADO_FINANZAS', 'APROBADO_GERENCIA'].includes(m.estado || ''))
        .filter((m) => {
          if (filtroArea === 'todas') return true;
          return (
            String(m.area_id) === filtroArea ||
            (m as any).area === Number(filtroArea) ||
            m.area_nombre?.toLowerCase() === filtroArea.toLowerCase()
          );
        })
        .forEach((m) => {
          const totalMem = parseFloat(m.total_presupuesto || (m as any).total_presupuestado || '0');
          if (m.detalles && m.detalles.length > 0) {
            let tieneDetalleMatch = false;
            m.detalles.forEach((d) => {
              if (d.partida_codigo === filtroPartida) {
                tieneDetalleMatch = true;
                const totalItem =
                  parseFloat(d.precio_total || '0') ||
                  parseFloat(String(d.total_programado || '0')) ||
                  (parseFloat(String(d.cantidad || '0')) * parseFloat(String(d.precio_unitario || '0')));
                sumaPartida += totalItem;
              }
            });
            if (!tieneDetalleMatch && m.partida_codigo === filtroPartida) {
              sumaPartida += totalMem;
            }
          } else if (m.partida_codigo === filtroPartida) {
            sumaPartida += totalMem;
          }
        });

      if (sumaPartida > 0) return sumaPartida;

      // Fallback: si no hay desglose en memorias, calculamos con los gastos existentes de esa partida
      const gastosDePartida = gastos.filter((g) => {
        const matchArea =
          filtroArea === 'todas' ||
          String(g.area_id) === filtroArea ||
          g.area_nombre?.toLowerCase() === filtroArea.toLowerCase();
        return matchArea && g.partida_codigo === filtroPartida;
      });
      return gastosDePartida.reduce(
        (acc, g) => acc + parseFloat(String(g.monto_ejecutado) || '0'),
        0
      );
    }

    // Si solo hay filtro de área (filtroPartida === 'todas'):
    const pArea = presupuestosArea.find(
      (p) =>
        String(p.area) === filtroArea ||
        String(p.id) === filtroArea ||
        p.area_nombre?.toLowerCase() === filtroArea.toLowerCase()
    );
    if (pArea) return parseFloat(pArea.monto_inicial || '0');

    const sumMemsArea = memorias
      .filter((m) => ['APROBADO_FINANZAS', 'APROBADO_GERENCIA'].includes(m.estado || ''))
      .filter(
        (m) =>
          String(m.area_id) === filtroArea ||
          (m as any).area === Number(filtroArea) ||
          m.area_nombre?.toLowerCase() === filtroArea.toLowerCase()
      )
      .reduce((acc, m) => acc + parseFloat(m.total_presupuesto || (m as any).total_presupuestado || '0'), 0);
    return sumMemsArea;
  }, [filtroArea, filtroPartida, totalInicialGlobal, memorias, presupuestosArea, gastos]);

  // 3. Saldo Disponible en alcance filtrado
  const totalDisponibleFiltrado = useMemo(() => {
    if (totalInicialFiltrado <= 0) return 0;
    return Math.max(0, totalInicialFiltrado - totalGastadoFiltrado);
  }, [totalInicialFiltrado, totalGastadoFiltrado]);

  // 4. Porcentaje de Ejecución en alcance filtrado
  const pctFiltrado = useMemo(() => {
    if (totalInicialFiltrado <= 0) return 0;
    return Math.min(100, Math.round((totalGastadoFiltrado / totalInicialFiltrado) * 10000) / 100);
  }, [totalInicialFiltrado, totalGastadoFiltrado]);

  // Memorias con saldo filtradas por área, partida y buscador general (los filtros avanzados de fechas/montos no aplican aquí)
  const renglonesFiltrados = useMemo(() => {
    return renglonesDisponibles.filter((m) => {
      const matchArea =
        filtroArea === 'todas' ||
        m.areaNombre?.toLowerCase().includes(filtroArea.toLowerCase());

      const matchPartida =
        filtroPartida === 'todas' ||
        m.partidasString?.includes(filtroPartida);

      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        m.codigo?.toLowerCase().includes(term) ||
        m.justificacion?.toLowerCase().includes(term);

      return matchArea && matchPartida && matchSearch;
    });
  }, [renglonesDisponibles, filtroArea, filtroPartida, searchTerm]);

  // Métricas reactivas a la pestaña activa:
  // En 'gastos', las métricas reflejan todos los filtros (área, partida, fechas, meses, montos, buscador).
  // En 'memorias', reflejan el alcance de área, partida y búsqueda, sin interferencia de fechas/montos.
  const activeMetrics = useMemo(() => {
    if (activeTab === 'gastos') {
      return {
        totalInicial: totalInicialFiltrado,
        totalGastado: totalGastadoFiltrado,
        totalDisponible: totalDisponibleFiltrado,
        pctGlobal: pctFiltrado,
        isFiltered: hasActiveFilters,
      };
    }
    // activeTab === 'memorias'
    const tInicial = renglonesFiltrados.reduce((acc, m) => acc + m.montoTotal, 0);
    const tGastado = renglonesFiltrados.reduce((acc, m) => acc + m.montoGastado, 0);
    const tDisp = Math.max(0, tInicial - tGastado);
    const pct = tInicial > 0 ? Math.min(100, Math.round((tGastado / tInicial) * 10000) / 100) : 0;
    return {
      totalInicial: tInicial,
      totalGastado: tGastado,
      totalDisponible: tDisp,
      pctGlobal: pct,
      isFiltered: filtroArea !== 'todas' || filtroPartida !== 'todas' || Boolean(searchTerm.trim()),
    };
  }, [
    activeTab,
    hasActiveFilters,
    totalInicialFiltrado,
    totalGastadoFiltrado,
    totalDisponibleFiltrado,
    pctFiltrado,
    renglonesFiltrados,
    filtroArea,
    filtroPartida,
    searchTerm,
  ]);

  // Acciones
  const handleCreateGasto = async (payload: {
    memoria: number;
    monto_ejecutado: number;
    fecha_gasto: string;
    comprobante_num?: string;
    observacion?: string;
  }) => {
    setActionLoading(true);
    try {
      await ejecucionApi.createGasto(payload);
      alertService.success('Gasto Registrado', 'La ejecución presupuestaria fue registrada exitosamente.');
      await fetchData();
      return true;
    } catch (err: any) {
      console.error(err);
      const errMsg =
        err?.response?.data?.non_field_errors?.[0] ||
        err?.response?.data?.monto_ejecutado?.[0] ||
        err?.response?.data?.error ||
        'Error al registrar la ejecución presupuestaria.';
      alertService.error('Error', errMsg);
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateGasto = async (
    id: number,
    payload: {
      monto_ejecutado?: number;
      fecha_gasto?: string;
      comprobante_num?: string;
      observacion?: string;
    }
  ) => {
    setActionLoading(true);
    try {
      await ejecucionApi.updateGasto(id, payload);
      alertService.success('Gasto Actualizado', 'El gasto fue modificado exitosamente.');
      await fetchData();
      return true;
    } catch (err: any) {
      console.error(err);
      const errMsg =
        err?.response?.data?.non_field_errors?.[0] ||
        err?.response?.data?.monto_ejecutado?.[0] ||
        err?.response?.data?.error ||
        'Error al actualizar el gasto.';
      alertService.error('Error', errMsg);
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteGasto = async (gasto: Gasto) => {
    const confirm = await alertService.confirm({
      title: '¿Anular Gasto Ejecutado?',
      text: `Se eliminará el gasto de Bs. ${parseFloat(String(gasto.monto_ejecutado)).toLocaleString('es-BO', { minimumFractionDigits: 2 })} y el saldo retornará a la memoria ${gasto.memoria_codigo}.`,
      confirmButtonText: 'Sí, anular gasto',
      isDanger: true,
    });
    if (!confirm) return false;

    setActionLoading(true);
    try {
      await ejecucionApi.deleteGasto(gasto.id);
      alertService.success('Gasto Anulado', 'El gasto fue anulado y el saldo restituido.');
      await fetchData();
      return true;
    } catch (err: any) {
      console.error(err);
      alertService.error('Error', 'No se pudo anular el gasto.');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  return {
    gestionActiva,
    gestionActivaId,
    isGestionBloqueada,
    loading,
    actionLoading,
    gastos,
    gastosFiltrados,
    presupuestosArea,
    resumen,
    areas,
    partidasDisponibles,
    renglonesDisponibles,
    renglonesFiltrados,
    metrics: {
      totalInicial: activeMetrics.totalInicial,
      totalGastado: activeMetrics.totalGastado,
      totalDisponible: activeMetrics.totalDisponible,
      pctGlobal: activeMetrics.pctGlobal,
      isFiltered: activeMetrics.isFiltered,
      totalInicialGlobal,
      totalGastadoGlobal,
      totalDisponibleGlobal,
      pctGlobalInstitucional,
      totalMontoGastosFiltrados: totalGastadoFiltrado,
    },
    filters: {
      activeTab,
      setActiveTab,
      filtroArea,
      setFiltroArea,
      filtroPartida,
      setFiltroPartida,
      fechaDesde,
      setFechaDesde,
      fechaHasta,
      setFechaHasta,
      mesDesde,
      setMesDesde,
      mesHasta,
      setMesHasta,
      montoMin,
      setMontoMin,
      montoMax,
      setMontoMax,
      searchTerm,
      setSearchTerm,
      hasActiveFilters,
      resetFilters,
    },
    actions: {
      refetch: fetchData,
      createGasto: handleCreateGasto,
      updateGasto: handleUpdateGasto,
      deleteGasto: handleDeleteGasto,
    },
  };
};
