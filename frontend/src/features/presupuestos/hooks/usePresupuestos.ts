import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Gestion,
  PresupuestoArea,
  ResumenGestion,
  DetalleArea,
  Area,
  Gasto,
  PresupuestoViewMode,
  AgrupacionViewMode,
  TabSeccionMode,
  PresupuestoAreaCalculado,
  ResumenPrograma,
  PartidaConsolidada,
  GastoAuxiliarItem,
  MesOption,
} from '../types/presupuestos.types';
import {
  getGestiones,
  createGestion,
  cerrarFormulacionGestion,
  pasarAEjecucionGestion,
  reabrirFormulacionGestion,
  consolidarPresupuestosGestion,
  getPresupuestosArea,
  getResumenGestion,
  getDetalleArea,
  getAreas,
  getGastos,
} from '../../../services/presupuestoService';
import { useAuth } from '../../../hooks/useAuth';
import { useGestion } from '../../../contexts/GestionContext';
import alertService from '../../../utils/alerts';

export const MESES: MesOption[] = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
];

const AREA_ORDER_WEIGHTS: Record<string, number> = {
  // 1. Gerencias Centrales / Principales
  GAA: 1,
  GAE: 2,
  AE: 2,
  GO: 3,
  GC: 4,
  GI: 5,
  IF: 5,
  SMS: 6,

  // 2. Gerencias Regionales y Agencias
  EA: 10,
  LP: 11,
  CB: 12,
  SC: 13,
  CIJ: 14,
  GYA: 15,
  RIB: 16,
  TDD: 17,

  // 3. Unidades
  PL: 20,
  UT: 21,
  AI: 22,
  AJ: 23,
  CIAC: 24,
  OD: 25,
};

function getAreaCodeShort(code?: string): string {
  if (!code) return '';
  const clean = code.trim().toUpperCase();
  const parts = clean.split('-');
  return parts[parts.length - 1];
}

function getAreaOrderWeight(code?: string): number {
  const shortCode = getAreaCodeShort(code);
  return AREA_ORDER_WEIGHTS[shortCode] ?? 999;
}

export function usePresupuestos() {
  const { user } = useAuth();
  const rolName = user?.rol_nombre?.toUpperCase() || '';
  const isAprobador = user?.is_superuser || rolName === 'APROBADOR' || rolName === 'ADMINISTRADOR';

  // Global Gestion context
  const {
    gestiones: contextGestiones,
    gestionActivaId,
    setGestionActivaId,
    refetchGestiones,
  } = useGestion();

  const [localGestiones, setLocalGestiones] = useState<Gestion[]>([]);
  const gestiones = contextGestiones.length > 0 ? contextGestiones : localGestiones;

  const [selectedGestionId, setSelectedGestionId] = useState<number | null>(gestionActivaId);
  const [resumen, setResumen] = useState<ResumenGestion | null>(null);
  const [presupuestosArea, setPresupuestosArea] = useState<PresupuestoArea[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [searchParams] = useSearchParams();
  const urlAreaParam = searchParams.get('area');

  // View state
  const [viewMode, setViewMode] = useState<PresupuestoViewMode>('general');
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);
  const [selectedSeccionId, setSelectedSeccionId] = useState<number | null>(null);
  const [tabSeccion, setTabSeccion] = useState<TabSeccionMode>('presupuesto');

  // Detailed area data
  const [detalleArea, setDetalleArea] = useState<DetalleArea | null>(null);
  const [detalleLoading, setDetalleLoading] = useState<boolean>(false);

  // Dashboard Filters & View Mode
  const [filtroAreaId, setFiltroAreaId] = useState<string>('todas');
  const [mesDesde, setMesDesde] = useState<number>(1);
  const [mesHasta, setMesHasta] = useState<number>(12);
  const [vistaAgrupacion, setVistaAgrupacion] = useState<AgrupacionViewMode>('gerencias');
  const [expandedProgramas, setExpandedProgramas] = useState<Record<string, boolean>>({});

  // Section interactive filters
  const [expandedMemorias, setExpandedMemorias] = useState<Set<number>>(new Set());
  const [expandedPartidas, setExpandedPartidas] = useState<Set<string>>(new Set());
  const [expandedPartidasConsolidadas, setExpandedPartidasConsolidadas] = useState<Set<string>>(new Set());
  const [busquedaPartida, setBusquedaPartida] = useState<string>('');

  // Modals
  const [showModalGestion, setShowModalGestion] = useState<boolean>(false);
  const [nuevoAnio, setNuevoAnio] = useState<number>(new Date().getFullYear() + 1);
  const [showModalReporte, setShowModalReporte] = useState<boolean>(false);
  const [tipoReporteImpresion, setTipoReporteImpresion] = useState<AgrupacionViewMode>('gerencias');
  const [showModalReportePartidas, setShowModalReportePartidas] = useState<boolean>(false);

  // Initial load
  useEffect(() => {
    cargarBase();
  }, []);

  // Sync selectedGestionId with context
  useEffect(() => {
    if (gestionActivaId && !selectedGestionId) {
      setSelectedGestionId(gestionActivaId);
    }
  }, [gestionActivaId, selectedGestionId]);

  useEffect(() => {
    if (selectedGestionId) {
      cargarDatos(selectedGestionId);
    }
  }, [selectedGestionId]);

  const cargarBase = async () => {
    setLoading(true);
    try {
      const [gList, aList] = await Promise.all([getGestiones(), getAreas()]);
      setLocalGestiones(gList);
      setAreas(aList);
      if (gList.length > 0 && !selectedGestionId) {
        const pref =
          gList.find((g) => g.estado === 'EN_EJECUCION') ||
          gList.find((g) => g.estado === 'FORMULACION') ||
          gList[0];
        setSelectedGestionId(pref.id);
        setGestionActivaId(pref.id);
      }
    } catch {
      mostrarMensaje('error', 'Error cargando gestiones iniciales.');
    } finally {
      setLoading(false);
    }
  };

  const cargarDatos = async (gId: number) => {
    try {
      const [res, techos, gastosData] = await Promise.all([
        getResumenGestion({ gestion: gId }).catch(() => null),
        getPresupuestosArea({ gestion: gId }),
        getGastos({ gestion: gId }),
      ]);
      setResumen(res);
      setPresupuestosArea(Array.isArray(techos) ? techos : []);
      setGastos(Array.isArray(gastosData) ? gastosData : []);
    } catch (err) {
      console.error('Error cargando datos de gestión:', err);
    }
  };

  const mostrarMensaje = (type: 'success' | 'error', text: string) => {
    setFeedbackMsg({ type, text });
    if (type === 'success') {
      alertService.toast(text, 'success');
    } else {
      alertService.error('Presupuestos', text);
    }
    setTimeout(() => setFeedbackMsg(null), 4500);
  };

  const activeGestion = useMemo(
    () => (Array.isArray(gestiones) ? gestiones : []).find((g) => g.id === selectedGestionId) || null,
    [gestiones, selectedGestionId]
  );

  const formatMoney = useCallback((val: string | number) => {
    const n = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
      minimumFractionDigits: 2,
    }).format(n || 0);
  }, []);

  const getBadgeEstado = useCallback((estado: string) => {
    const map: Record<string, string> = {
      BORRADOR: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
      PENDIENTE_GERENCIA: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
      APROBADO_GERENCIA: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
      APROBADO_FINANZAS: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
      RECHAZADO: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
    };
    const labels: Record<string, string> = {
      BORRADOR: 'Borrador',
      PENDIENTE_GERENCIA: 'Pendiente Gerencia',
      APROBADO_GERENCIA: 'Aprobado Gerencia',
      APROBADO_FINANZAS: 'Aprobado Finanzas',
      RECHAZADO: 'Rechazado',
    };
    return {
      className: map[estado] || 'bg-gray-100 text-gray-600',
      label: labels[estado] || estado,
    };
  }, []);

  // Mapa de gastos por área en el rango de meses seleccionado [mesDesde, mesHasta]
  const gastosPorAreaPeriodo = useMemo(() => {
    const map: Record<number, number> = {};
    (Array.isArray(gastos) ? gastos : []).forEach((g) => {
      if (!g.fecha_gasto) return;
      const parts = g.fecha_gasto.split('-');
      if (parts.length >= 2) {
        const month = parseInt(parts[1], 10);
        if (month >= mesDesde && month <= mesHasta) {
          const areaId = g.area_id;
          const monto = parseFloat(String(g.monto_ejecutado) || '0');
          if (areaId) {
            map[areaId] = (map[areaId] || 0) + monto;
          }
        }
      }
    });
    return map;
  }, [gastos, mesDesde, mesHasta]);

  // Presupuestos calculados con filtros de meses aplicados y orden institucional
  const presupuestosCalculados = useMemo((): PresupuestoAreaCalculado[] => {
    let list = Array.isArray(presupuestosArea) ? presupuestosArea : [];

    if (filtroAreaId !== 'todas') {
      list = list.filter((p) => String(p.area) === filtroAreaId || String(p.id) === filtroAreaId);
    }

    const computedList = list.map((p) => {
      const inicial = parseFloat(p.monto_inicial || '0');
      const ejecutadoPeriodo = gastosPorAreaPeriodo[p.area] || 0;
      const disponiblePeriodo = Math.max(0, inicial - ejecutadoPeriodo);
      const porcentajePeriodo =
        inicial > 0 ? Math.round((ejecutadoPeriodo / inicial) * 10000) / 100 : 0;

      return {
        ...p,
        monto_ejecutado_periodo: ejecutadoPeriodo,
        monto_disponible_periodo: disponiblePeriodo,
        porcentaje_ejecucion_periodo: porcentajePeriodo,
      };
    });

    return computedList.sort((a, b) => {
      const weightA = getAreaOrderWeight(a.area_codigo);
      const weightB = getAreaOrderWeight(b.area_codigo);
      if (weightA !== weightB) {
        return weightA - weightB;
      }
      return (a.area_nombre || '').localeCompare(b.area_nombre || '');
    });
  }, [presupuestosArea, filtroAreaId, gastosPorAreaPeriodo]);

  // Totales generales para los KPI cards considerando los filtros activos
  const totalInicial = useMemo(() => {
    return presupuestosCalculados.reduce((acc, p) => acc + parseFloat(p.monto_inicial || '0'), 0);
  }, [presupuestosCalculados]);

  const totalEjecutadoPeriodo = useMemo(() => {
    return presupuestosCalculados.reduce((acc, p) => acc + (p.monto_ejecutado_periodo || 0), 0);
  }, [presupuestosCalculados]);

  const totalDisponiblePeriodo = Math.max(0, totalInicial - totalEjecutadoPeriodo);
  const pctEjecucionPeriodo =
    totalInicial > 0 ? Math.round((totalEjecutadoPeriodo / totalInicial) * 10000) / 100 : 0;

  // Agrupación por Programas con los filtros de meses aplicados
  const programasResumen = useMemo((): ResumenPrograma[] => {
    const map: Record<
      string,
      ResumenPrograma & {
        monto_inicial_num: number;
        monto_ejecutado_num: number;
        monto_disponible_num: number;
      }
    > = {};

    presupuestosCalculados.forEach((p) => {
      let progCod = p.programa_codigo || '';
      let progNom = p.programa_nombre || '';

      if (!progCod && p.area_codigo) {
        const parts = p.area_codigo.split('-');
        if (parts.length >= 2) {
          progCod = parts[0] + '-' + parts[1];
        }
      }

      if (!progCod) progCod = 'OTRO';
      if (!progNom) {
        if (progCod.includes('1') && !progCod.includes('210') && !progCod.includes('410')) {
          progNom = 'PROGRAMA 1 - ADMINISTRACIÓN CENTRAL';
        } else if (progCod.includes('2') && !progCod.includes('210')) {
          progNom = 'PROGRAMA 2 - GESTIÓN FINANCIERA';
        } else if (progCod.includes('210')) {
          progNom = 'PROGRAMA 210 - OPERACIONES FLOTA EPTAM';
        } else if (progCod.includes('410')) {
          progNom = 'PROGRAMA 410 - SERVICIOS DE TRANSPORTE AÉREO';
        } else {
          progNom = `PROGRAMA ${progCod}`;
        }
      }

      if (!map[progCod]) {
        map[progCod] = {
          id: p.programa_id || progCod,
          codigo: progCod,
          nombre: progNom,
          total_inicial: 0,
          total_ejecutado: 0,
          total_disponible: 0,
          porcentaje_ejecucion: 0,
          monto_inicial_num: 0,
          monto_ejecutado_num: 0,
          monto_disponible_num: 0,
          areas: [],
        };
      }

      const inicial = parseFloat(p.monto_inicial || '0');
      const ejecutado = p.monto_ejecutado_periodo || 0;
      const disponible = p.monto_disponible_periodo || 0;

      map[progCod].monto_inicial_num += inicial;
      map[progCod].monto_ejecutado_num += ejecutado;
      map[progCod].monto_disponible_num += disponible;
      map[progCod].areas.push(p);
    });

    const list = Object.values(map);

    list.forEach((item) => {
      item.total_inicial = item.monto_inicial_num;
      item.total_ejecutado = item.monto_ejecutado_num;
      item.total_disponible = item.monto_disponible_num;
      item.porcentaje_ejecucion =
        item.total_inicial > 0
          ? Math.round((item.total_ejecutado / item.total_inicial) * 10000) / 100
          : 0;
      item.areas.sort((a, b) => getAreaOrderWeight(a.area_codigo) - getAreaOrderWeight(b.area_codigo));
    });

    return list.sort((a, b) => {
      const codeA = a.codigo.replace(/\D/g, '');
      const codeB = b.codigo.replace(/\D/g, '');
      const numA = parseInt(codeA, 10) || 999;
      const numB = parseInt(codeB, 10) || 999;
      return numA - numB;
    });
  }, [presupuestosCalculados]);

  // Selección directa a Sección al hacer click en una fila de Área/Gerencia
  const handleSelectArea = async (areaId: number) => {
    if (!selectedGestionId) return;
    setSelectedAreaId(areaId);
    setDetalleLoading(true);
    setViewMode('seccion');
    setExpandedMemorias(new Set());
    setExpandedPartidas(new Set());
    setExpandedPartidasConsolidadas(new Set());

    try {
      const data = await getDetalleArea({ gestion: selectedGestionId, area: areaId });
      setDetalleArea(data);
      if (data && data.secciones && data.secciones.length > 0) {
        setSelectedSeccionId(data.secciones[0].seccion_id);
      } else {
        setSelectedSeccionId(null);
      }
    } catch (err) {
      console.error('Error cargando detalle de área:', err);
      setDetalleArea(null);
      setSelectedSeccionId(null);
    } finally {
      setDetalleLoading(false);
    }
  };

  // Auto-seleccionar área si viene en la URL (?area=12 o ?area=GAA)
  useEffect(() => {
    if (urlAreaParam && selectedGestionId && presupuestosArea.length > 0) {
      const target = presupuestosArea.find(
        (p) =>
          String(p.area) === urlAreaParam ||
          String(p.id) === urlAreaParam ||
          (p.area_codigo && p.area_codigo.toLowerCase() === urlAreaParam.toLowerCase())
      );
      if (target && selectedAreaId !== target.area) {
        handleSelectArea(target.area);
      }
    }
  }, [urlAreaParam, selectedGestionId, presupuestosArea]);

  const irAGeneral = () => {
    setViewMode('general');
    setSelectedAreaId(null);
    setSelectedSeccionId(null);
    setDetalleArea(null);
  };

  const irAReporte = () => {
    setViewMode('reporte');
  };

  const toggleExpandPrograma = (codigo: string) => {
    setExpandedProgramas((prev) => ({ ...prev, [codigo]: !prev[codigo] }));
  };

  const abrirReporteGeneral = (tipo?: AgrupacionViewMode) => {
    setTipoReporteImpresion(tipo || vistaAgrupacion);
    setShowModalReporte(true);
  };

  // Acciones de Gestión
  const handleCerrarFormulacion = async () => {
    if (!selectedGestionId) return;
    const confirm = await alertService.confirm({
      title: 'Cerrar Formulación',
      text: '¿Desea cerrar la formulación? Se consolidarán automáticamente los techos presupuestarios.',
      icon: 'warning',
      isDanger: true,
      confirmButtonText: 'Sí, cerrar formulación',
    });
    if (!confirm) return;

    setActionLoading(true);
    try {
      const r = await cerrarFormulacionGestion(selectedGestionId);
      mostrarMensaje('success', r.message);
      await refetchGestiones();
      await cargarBase();
    } catch (e: any) {
      mostrarMensaje('error', e.response?.data?.error || 'Error al cerrar formulación.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePasarEjecucion = async () => {
    if (!selectedGestionId) return;
    const confirm = await alertService.confirm({
      title: 'Pasar a Ejecución',
      text: '¿Pasar la gestión a estado EN EJECUCIÓN? Esta acción iniciará el control de partidas en fase operativa.',
      icon: 'question',
      confirmButtonText: 'Sí, pasar a ejecución',
    });
    if (!confirm) return;

    setActionLoading(true);
    try {
      const r = await pasarAEjecucionGestion(selectedGestionId);
      mostrarMensaje('success', r.message);
      await refetchGestiones();
      await cargarBase();
    } catch (e: any) {
      mostrarMensaje('error', e.response?.data?.error || 'Error al pasar a ejecución.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReabrir = async () => {
    if (!selectedGestionId) return;
    const confirm = await alertService.confirm({
      title: 'Reabrir Formulación',
      text: '¿Reabrir la formulación de esta gestión? Se permitirán nuevamente ajustes a los presupuestos iniciales.',
      icon: 'warning',
      confirmButtonText: 'Sí, reabrir',
    });
    if (!confirm) return;

    setActionLoading(true);
    try {
      const r = await reabrirFormulacionGestion(selectedGestionId);
      mostrarMensaje('success', r.message);
      await refetchGestiones();
      await cargarBase();
    } catch (e: any) {
      mostrarMensaje('error', e.response?.data?.error || 'Error al reabrir formulación.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConsolidar = async () => {
    if (!selectedGestionId) return;
    const confirm = await alertService.confirm({
      title: 'Consolidar Presupuestos',
      text: '¿Desea consolidar y recalcular los techos presupuestarios de todas las áreas para esta gestión?',
      icon: 'question',
      confirmButtonText: 'Sí, consolidar',
    });
    if (!confirm) return;

    setActionLoading(true);
    try {
      const r = await consolidarPresupuestosGestion(selectedGestionId);
      mostrarMensaje('success', r.message);
      await cargarDatos(selectedGestionId);
    } catch (e: any) {
      mostrarMensaje('error', e.response?.data?.error || 'Error al consolidar presupuestos.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCrearGestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await createGestion({ anio: nuevoAnio });
      mostrarMensaje('success', `Gestión ${nuevoAnio} creada.`);
      setShowModalGestion(false);
      await refetchGestiones();
      await cargarBase();
    } catch (e: any) {
      mostrarMensaje('error', e.response?.data?.anio?.[0] || 'Error al crear gestión.');
    } finally {
      setActionLoading(false);
    }
  };

  // Sección activa data
  const seccionActivaData = useMemo(() => {
    if ((viewMode !== 'seccion' && viewMode !== 'reporte') || !detalleArea || !selectedSeccionId) return null;
    return detalleArea.secciones.find((s) => s.seccion_id === selectedSeccionId) || null;
  }, [viewMode, detalleArea, selectedSeccionId]);

  // Recolectar egresos cronológicos de la sección activa (filtrados por mes)
  const todosLosGastosSeccion = useMemo((): GastoAuxiliarItem[] => {
    if (!seccionActivaData) return [];
    const list: GastoAuxiliarItem[] = [];

    seccionActivaData.memorias.forEach((mem) => {
      mem.partidas.forEach((part) => {
        part.gastos_detalle.forEach((g) => {
          if (g.fecha_gasto) {
            const parts = g.fecha_gasto.split('-');
            if (parts.length >= 2) {
              const m = parseInt(parts[1], 10);
              if (m < mesDesde || m > mesHasta) return;
            }
          }
          list.push({
            ...g,
            memoria_codigo: mem.memoria_codigo,
            partida_codigo: part.partida_codigo,
            partida_nombre: part.partida_nombre,
          });
        });
      });
    });

    return list.sort((a, b) => new Date(b.fecha_gasto).getTime() - new Date(a.fecha_gasto).getTime());
  }, [seccionActivaData, mesDesde, mesHasta]);

  // Consolidado por Partidas de la Sección Activa (Ordenadas Numéricamente y Filtradas por Mes)
  const partidasConsolidadas = useMemo((): PartidaConsolidada[] => {
    if (!seccionActivaData) return [];
    const map: Record<string, PartidaConsolidada> = {};

    seccionActivaData.memorias.forEach((memoria) => {
      memoria.partidas.forEach((partida) => {
        const cod = (partida.partida_codigo || '').trim();
        const nom = (partida.partida_nombre || '').trim();
        if (!cod) return;

        if (!map[cod]) {
          map[cod] = {
            partida_codigo: cod,
            partida_nombre: nom || `Partida ${cod}`,
            total_presupuestado: 0,
            total_agregado: 0,
            total_quitado: 0,
            total_ejecutado: 0,
            total_disponible: 0,
            porcentaje_ejecucion: 0,
            memorias: [],
          };
        }

        const pres = parseFloat(partida.presupuestado || '0');
        const agr = parseFloat(partida.monto_entrante || '0');
        const quit = parseFloat(partida.monto_saliente || '0');

        const gastosPeriodo = (partida.gastos_detalle || []).filter((g) => {
          if (!g.fecha_gasto) return true;
          const parts = g.fecha_gasto.split('-');
          if (parts.length >= 2) {
            const m = parseInt(parts[1], 10);
            return m >= mesDesde && m <= mesHasta;
          }
          return true;
        });

        const ejec = gastosPeriodo.reduce((sum, g) => sum + parseFloat(g.monto || '0'), 0);
        const disp = Math.max(0, pres + agr - quit - ejec);

        map[cod].total_presupuestado += pres;
        map[cod].total_agregado += agr;
        map[cod].total_quitado += quit;
        map[cod].total_ejecutado += ejec;
        map[cod].total_disponible += disp;

        map[cod].memorias.push({
          memoria_id: memoria.memoria_id,
          memoria_codigo: memoria.memoria_codigo,
          justificacion: memoria.justificacion,
          presupuestado: pres,
          agregado: agr,
          quitado: quit,
          ejecutado: ejec,
          disponible: disp,
          gastos_detalle: gastosPeriodo,
        });
      });
    });

    const list = Object.values(map);

    list.forEach((p) => {
      const base = p.total_presupuestado + p.total_agregado - p.total_quitado;
      p.porcentaje_ejecucion =
        base > 0
          ? Math.min(100, Math.round((p.total_ejecutado / base) * 10000) / 100)
          : p.total_presupuestado > 0
          ? Math.min(100, Math.round((p.total_ejecutado / p.total_presupuestado) * 10000) / 100)
          : 0;
    });

    return list.sort((a, b) => {
      const numA = parseInt(a.partida_codigo.replace(/\D/g, ''), 10);
      const numB = parseInt(b.partida_codigo.replace(/\D/g, ''), 10);
      if (!isNaN(numA) && !isNaN(numB) && numA !== numB) {
        return numA - numB;
      }
      return a.partida_codigo.localeCompare(b.partida_codigo);
    });
  }, [seccionActivaData, mesDesde, mesHasta]);

  const partidasFiltradas = useMemo(() => {
    if (!busquedaPartida.trim()) return partidasConsolidadas;
    const q = busquedaPartida.trim().toLowerCase();
    return partidasConsolidadas.filter(
      (p) =>
        p.partida_codigo.toLowerCase().includes(q) ||
        p.partida_nombre.toLowerCase().includes(q)
    );
  }, [partidasConsolidadas, busquedaPartida]);

  const totalPartidasPresupuestado = useMemo(() => {
    return partidasConsolidadas.reduce((acc, p) => acc + p.total_presupuestado, 0);
  }, [partidasConsolidadas]);

  const totalPartidasAgregado = useMemo(() => {
    return partidasConsolidadas.reduce((acc, p) => acc + p.total_agregado, 0);
  }, [partidasConsolidadas]);

  const totalPartidasQuitado = useMemo(() => {
    return partidasConsolidadas.reduce((acc, p) => acc + p.total_quitado, 0);
  }, [partidasConsolidadas]);

  const totalPartidasEjecutado = useMemo(() => {
    return partidasConsolidadas.reduce((acc, p) => acc + p.total_ejecutado, 0);
  }, [partidasConsolidadas]);

  const totalPartidasDisponible = useMemo(() => {
    return partidasConsolidadas.reduce((acc, p) => acc + p.total_disponible, 0);
  }, [partidasConsolidadas]);

  const pctPartidasGlobal = useMemo(() => {
    const base = totalPartidasPresupuestado + totalPartidasAgregado - totalPartidasQuitado;
    if (base > 0) {
      return Math.min(100, Math.round((totalPartidasEjecutado / base) * 10000) / 100);
    }
    return totalPartidasPresupuestado > 0
      ? Math.min(100, Math.round((totalPartidasEjecutado / totalPartidasPresupuestado) * 10000) / 100)
      : 0;
  }, [totalPartidasPresupuestado, totalPartidasAgregado, totalPartidasQuitado, totalPartidasEjecutado]);

  const toggleMemoria = (id: number) => {
    setExpandedMemorias((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const togglePartida = (key: string) => {
    setExpandedPartidas((prev) => {
      const s = new Set(prev);
      s.has(key) ? s.delete(key) : s.add(key);
      return s;
    });
  };

  const togglePartidaConsolidada = (codigo: string) => {
    setExpandedPartidasConsolidadas((prev) => {
      const s = new Set(prev);
      s.has(codigo) ? s.delete(codigo) : s.add(codigo);
      return s;
    });
  };

  const nombreMesDesde = MESES.find((m) => m.value === mesDesde)?.label || 'Enero';
  const nombreMesHasta = MESES.find((m) => m.value === mesHasta)?.label || 'Diciembre';
  const hayFiltroMeses = mesDesde !== 1 || mesHasta !== 12;

  const resetearFiltroMeses = () => {
    setMesDesde(1);
    setMesHasta(12);
    setFiltroAreaId('todas');
  };

  return {
    // Auth & Permissions
    isAprobador,
    // Gestiones & Selection
    gestiones,
    selectedGestionId,
    setSelectedGestionId,
    activeGestion,
    loading,
    actionLoading,
    feedbackMsg,
    setFeedbackMsg,
    resumen,
    areas,
    // View modes
    viewMode,
    setViewMode,
    selectedAreaId,
    selectedSeccionId,
    tabSeccion,
    setTabSeccion,
    detalleArea,
    detalleLoading,
    handleSelectArea,
    irAGeneral,
    irAReporte,
    // Filters
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
    // Calculations
    presupuestosCalculados,
    programasResumen,
    totalInicial,
    totalEjecutadoPeriodo,
    totalDisponiblePeriodo,
    pctEjecucionPeriodo,
    // Section data
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
    // Section interactive expansions
    expandedMemorias,
    toggleMemoria,
    expandedPartidas,
    togglePartida,
    expandedPartidasConsolidadas,
    togglePartidaConsolidada,
    busquedaPartida,
    setBusquedaPartida,
    // Modals
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
    // Action handlers
    handleCerrarFormulacion,
    handlePasarEjecucion,
    handleReabrir,
    handleConsolidar,
    handleCrearGestion,
    // Formatters
    formatMoney,
    getBadgeEstado,
  };
}
