import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  WalletCards,
  Plus,
  Lock,
  Unlock,
  Play,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  ArrowRightLeft,
  Building2,
  Calendar,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Receipt,
  FileText,
  BookOpenText,
  ChevronLeft,
  Printer,
  X,
  Search,
  RotateCcw,
  Filter,
} from 'lucide-react';
import {
  Gestion,
  PresupuestoArea,
  ResumenGestion,
  DetalleArea,
  Area,
  Gasto,
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
} from '../../services/presupuestoService';
import { useAuth } from '../../hooks/useAuth';
import { Pagination } from '../../components/commons/Pagination';
import { ResumenCards, ResumenCardItem } from '../../components/commons/ResumenCards';

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

const MESES = [
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

interface ResumenPrograma {
  id: number | string;
  codigo: string;
  nombre: string;
  total_inicial: number;
  total_ejecutado: number;
  total_disponible: number;
  porcentaje_ejecucion: number;
  areas: (PresupuestoArea & {
    monto_ejecutado_periodo: number;
    monto_disponible_periodo: number;
    porcentaje_ejecucion_periodo: number;
  })[];
}

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

export default function PresupuestosPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const rolName = user?.rol_nombre?.toUpperCase() || '';
  const isAprobador = user?.is_superuser || rolName === 'APROBADOR' || rolName === 'ADMINISTRADOR';

  // Base state
  const [gestiones, setGestiones] = useState<Gestion[]>([]);
  const [selectedGestionId, setSelectedGestionId] = useState<number | null>(null);
  const [resumen, setResumen] = useState<ResumenGestion | null>(null);
  const [presupuestosArea, setPresupuestosArea] = useState<PresupuestoArea[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // View state: 'general' (hybrid dashboard) | 'seccion' (section details) | 'reporte' (printable section)
  const [viewMode, setViewMode] = useState<'general' | 'seccion' | 'reporte'>('general');
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);
  const [selectedSeccionId, setSelectedSeccionId] = useState<number | null>(null);
  const [tabSeccion, setTabSeccion] = useState<'presupuesto' | 'gastos' | 'partidas'>('presupuesto');

  // Detailed area data
  const [detalleArea, setDetalleArea] = useState<DetalleArea | null>(null);
  const [detalleLoading, setDetalleLoading] = useState<boolean>(false);

  // Dashboard Filters & View Mode
  const [filtroAreaId, setFiltroAreaId] = useState<string>('todas');
  const [mesDesde, setMesDesde] = useState<number>(1);
  const [mesHasta, setMesHasta] = useState<number>(12);
  const [vistaAgrupacion, setVistaAgrupacion] = useState<'gerencias' | 'programas'>('gerencias');
  const [expandedProgramas, setExpandedProgramas] = useState<Record<string, boolean>>({});

  // Pagination states
  const [pageGerencias, setPageGerencias] = useState<number>(1);
  const pageSizeGerencias = 10;
  const [pageMemorias, setPageMemorias] = useState<number>(1);
  const pageSizeMemorias = 4;
  const [pageGastos, setPageGastos] = useState<number>(1);
  const pageSizeGastos = 10;
  const [pagePartidas, setPagePartidas] = useState<number>(1);
  const pageSizePartidas = 10;

  // Section interactive filters
  const [expandedMemorias, setExpandedMemorias] = useState<Set<number>>(new Set());
  const [expandedPartidas, setExpandedPartidas] = useState<Set<string>>(new Set());
  const [expandedPartidasConsolidadas, setExpandedPartidasConsolidadas] = useState<Set<string>>(new Set());
  const [busquedaPartida, setBusquedaPartida] = useState<string>('');

  // Modals
  const [showModalGestion, setShowModalGestion] = useState<boolean>(false);
  const [nuevoAnio, setNuevoAnio] = useState<number>(new Date().getFullYear() + 1);
  const [showModalReporte, setShowModalReporte] = useState<boolean>(false);
  const [tipoReporteImpresion, setTipoReporteImpresion] = useState<'gerencias' | 'programas'>('gerencias');
  const [showModalReportePartidas, setShowModalReportePartidas] = useState<boolean>(false);

  useEffect(() => {
    cargarBase();
  }, []);

  useEffect(() => {
    if (selectedGestionId) {
      cargarDatos(selectedGestionId);
    }
  }, [selectedGestionId]);

  async function cargarBase() {
    setLoading(true);
    try {
      const [gList, aList] = await Promise.all([getGestiones(), getAreas()]);
      setGestiones(gList);
      setAreas(aList);
      if (gList.length > 0) {
        const pref =
          gList.find((g) => g.estado === 'EN_EJECUCION') ||
          gList.find((g) => g.estado === 'FORMULACION') ||
          gList[0];
        setSelectedGestionId(pref.id);
      }
    } catch {
      mostrarMensaje('error', 'Error cargando gestiones iniciales.');
    } finally {
      setLoading(false);
    }
  }

  async function cargarDatos(gId: number) {
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
  }

  function mostrarMensaje(type: 'success' | 'error', text: string) {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4500);
  }

  const activeGestion = useMemo(
    () => (Array.isArray(gestiones) ? gestiones : []).find((g) => g.id === selectedGestionId) || null,
    [gestiones, selectedGestionId]
  );

  const formatMoney = (val: string | number) => {
    const n = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
      minimumFractionDigits: 2,
    }).format(n || 0);
  };

  const getBadgeEstado = (estado: string) => {
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
    return (
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${map[estado] || 'bg-gray-100 text-gray-600'}`}>
        {labels[estado] || estado}
      </span>
    );
  };

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
  const presupuestosCalculados = useMemo(() => {
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
  const programasResumen = useMemo(() => {
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
  async function handleSelectArea(areaId: number) {
    if (!selectedGestionId) return;
    setSelectedAreaId(areaId);
    setDetalleLoading(true);
    setViewMode('seccion');
    setPageMemorias(1);
    setPageGastos(1);
    setPagePartidas(1);
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
  }

  function irAGeneral() {
    setViewMode('general');
    setSelectedAreaId(null);
    setSelectedSeccionId(null);
    setDetalleArea(null);
  }

  function irAReporte() {
    setViewMode('reporte');
  }

  const toggleExpandPrograma = (codigo: string) => {
    setExpandedProgramas((prev) => ({ ...prev, [codigo]: !prev[codigo] }));
  };

  const abrirReporteGeneral = (tipo?: 'gerencias' | 'programas') => {
    setTipoReporteImpresion(tipo || vistaAgrupacion);
    setShowModalReporte(true);
  };

  // Acciones de Gestión
  async function handleCerrarFormulacion() {
    if (!selectedGestionId || !confirm('¿Desea cerrar la formulación? Se consolidarán automáticamente los techos presupuestarios.')) return;
    setActionLoading(true);
    try {
      const r = await cerrarFormulacionGestion(selectedGestionId);
      mostrarMensaje('success', r.message);
      await cargarBase();
    } catch (e: any) {
      mostrarMensaje('error', e.response?.data?.error || 'Error al cerrar formulación.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handlePasarEjecucion() {
    if (!selectedGestionId || !confirm('¿Pasar la gestión a estado EN EJECUCIÓN?')) return;
    setActionLoading(true);
    try {
      const r = await pasarAEjecucionGestion(selectedGestionId);
      mostrarMensaje('success', r.message);
      await cargarBase();
    } catch (e: any) {
      mostrarMensaje('error', e.response?.data?.error || 'Error.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReabrir() {
    if (!selectedGestionId || !confirm('¿Reabrir la formulación de esta gestión?')) return;
    setActionLoading(true);
    try {
      const r = await reabrirFormulacionGestion(selectedGestionId);
      mostrarMensaje('success', r.message);
      await cargarBase();
    } catch (e: any) {
      mostrarMensaje('error', e.response?.data?.error || 'Error.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleConsolidar() {
    if (!selectedGestionId) return;
    setActionLoading(true);
    try {
      const r = await consolidarPresupuestosGestion(selectedGestionId);
      mostrarMensaje('success', r.message);
      await cargarDatos(selectedGestionId);
    } catch (e: any) {
      mostrarMensaje('error', e.response?.data?.error || 'Error.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCrearGestion(e: React.FormEvent) {
    e.preventDefault();
    setActionLoading(true);
    try {
      await createGestion({ anio: nuevoAnio });
      mostrarMensaje('success', `Gestión ${nuevoAnio} creada.`);
      setShowModalGestion(false);
      await cargarBase();
    } catch (e: any) {
      mostrarMensaje('error', e.response?.data?.anio?.[0] || 'Error al crear gestión.');
    } finally {
      setActionLoading(false);
    }
  }

  // Sección activa data
  const seccionActivaData = useMemo(() => {
    if ((viewMode !== 'seccion' && viewMode !== 'reporte') || !detalleArea || !selectedSeccionId) return null;
    return detalleArea.secciones.find((s) => s.seccion_id === selectedSeccionId) || null;
  }, [viewMode, detalleArea, selectedSeccionId]);

  // Recolectar egresos cronológicos de la sección activa (filtrados por mes)
  const todosLosGastosSeccion = useMemo(() => {
    if (!seccionActivaData) return [];
    const list: Array<{
      gasto_id: number;
      fecha_gasto: string;
      monto: string;
      comprobante: string;
      observacion: string;
      item_descripcion: string;
      memoria_codigo: string;
      partida_codigo: string;
      partida_nombre: string;
    }> = [];

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
  const partidasConsolidadas = useMemo(() => {
    if (!seccionActivaData) return [];
    const map: Record<
      string,
      {
        partida_codigo: string;
        partida_nombre: string;
        total_presupuestado: number;
        total_agregado: number;
        total_quitado: number;
        total_ejecutado: number;
        total_disponible: number;
        porcentaje_ejecucion: number;
        memorias: Array<{
          memoria_id: number;
          memoria_codigo: string;
          justificacion: string;
          presupuestado: number;
          agregado: number;
          quitado: number;
          ejecutado: number;
          disponible: number;
          gastos_detalle: Array<{
            gasto_id: number;
            fecha_gasto: string;
            monto: string;
            comprobante: string;
            observacion: string;
            item_descripcion: string;
          }>;
        }>;
      }
    > = {};

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

  // Pagination slices
  const pagedGerencias = useMemo(() => {
    const start = (pageGerencias - 1) * pageSizeGerencias;
    return presupuestosCalculados.slice(start, start + pageSizeGerencias);
  }, [presupuestosCalculados, pageGerencias]);

  const pagedMemorias = useMemo(() => {
    if (!seccionActivaData) return [];
    const start = (pageMemorias - 1) * pageSizeMemorias;
    return seccionActivaData.memorias.slice(start, start + pageSizeMemorias);
  }, [seccionActivaData, pageMemorias]);

  const pagedGastos = useMemo(() => {
    const start = (pageGastos - 1) * pageSizeGastos;
    return todosLosGastosSeccion.slice(start, start + pageSizeGastos);
  }, [todosLosGastosSeccion, pageGastos]);

  const pagedPartidas = useMemo(() => {
    const start = (pagePartidas - 1) * pageSizePartidas;
    return partidasFiltradas.slice(start, start + pageSizePartidas);
  }, [partidasFiltradas, pagePartidas]);

  // ResumenCards configuration
  const resumenCardsItems: ResumenCardItem[] = useMemo(() => {
    return [
      {
        title: 'Presupuesto Inicial',
        value: formatMoney(totalInicial),
        subtitle: `Techo asignado Gestión ${activeGestion?.anio || ''}`,
        icon: <WalletCards size={18} />,
        color: 'blue',
      },
      {
        title: `Ejecutado (${nombreMesDesde.slice(0, 3)} - ${nombreMesHasta.slice(0, 3)})`,
        value: formatMoney(totalEjecutadoPeriodo),
        subtitle: 'Gastos en el periodo seleccionado',
        icon: <TrendingDown size={18} />,
        color: 'rose',
      },
      {
        title: 'Saldo Disponible',
        value: formatMoney(totalDisponiblePeriodo),
        subtitle: 'Remanente respecto al periodo',
        icon: <CheckCircle2 size={18} />,
        color: 'emerald',
      },
      {
        title: '% Avance',
        value: `${pctEjecucionPeriodo}%`,
        subtitle: 'del periodo evaluado',
        icon: <Building2 size={18} />,
        color: 'amber',
        progress: {
          value: Math.min(100, pctEjecucionPeriodo),
          label: `${pctEjecucionPeriodo}%`,
        },
      },
    ];
  }, [totalInicial, totalEjecutadoPeriodo, totalDisponiblePeriodo, pctEjecucionPeriodo, activeGestion, nombreMesDesde, nombreMesHasta]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw size={28} className="mx-auto mb-3 animate-spin text-theme-muted" />
          <p className="text-sm text-theme-muted">Cargando Módulo de Presupuestos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Feedback de acciones */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between shadow-md ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-100 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-900 border border-rose-200 dark:bg-rose-950/80 dark:text-rose-100 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span className="text-sm font-medium">{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-xs opacity-75 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* Header Institucional con Controles de Gestión */}
      <div className="card p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-theme-primary/15">
              <WalletCards size={26} className="text-theme-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-theme-main tracking-tight">Presupuestos & POA</h1>
              <p className="text-xs text-theme-muted mt-0.5">
                Control financiero institucional — Formulación, Aprobación y Ejecución Presupuestaria
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Selector de Gestión */}
            <div className="flex items-center gap-2 px-3 py-2 bg-theme-base rounded-xl border border-theme-border">
              <Calendar size={16} className="text-theme-muted" />
              <span className="text-xs font-semibold text-theme-muted">Gestión:</span>
              <select
                value={selectedGestionId || ''}
                onChange={(e) => {
                  setSelectedGestionId(Number(e.target.value));
                  irAGeneral();
                }}
                className="bg-transparent font-bold text-sm text-theme-main focus:outline-none cursor-pointer"
              >
                {gestiones.map((g) => (
                  <option key={g.id} value={g.id}>
                    Gestión {g.anio} — {g.estado_display}
                  </option>
                ))}
              </select>
            </div>

            {/* Acciones de ciclo de vida de la gestión */}
            {isAprobador && activeGestion?.estado === 'FORMULACION' && (
              <>
                <button
                  onClick={handleConsolidar}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-theme-border text-xs font-semibold text-theme-muted hover:text-theme-main transition-colors cursor-pointer"
                >
                  <RefreshCw size={14} /> Consolidar
                </button>
                <button
                  onClick={handleCerrarFormulacion}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-colors cursor-pointer shadow-sm"
                >
                  <Lock size={14} /> Cerrar Formulación
                </button>
              </>
            )}
            {isAprobador && activeGestion?.estado === 'CERRADO_FORMULACION' && (
              <>
                <button
                  onClick={handleReabrir}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-theme-border text-xs font-semibold text-theme-muted hover:text-theme-main transition-colors cursor-pointer"
                >
                  <Unlock size={14} /> Reabrir
                </button>
                <button
                  onClick={handlePasarEjecucion}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-theme-primary hover:bg-theme-primaryHover text-theme-primaryText text-xs font-semibold transition-colors cursor-pointer shadow-sm"
                >
                  <Play size={14} /> Pasar a Ejecución
                </button>
              </>
            )}

            {isAprobador && (
              <button
                onClick={() => setShowModalGestion(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-theme-primary/10 text-theme-primary hover:bg-theme-primary/20 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Plus size={14} /> Nueva Gestión
              </button>
            )}
          </div>
        </div>

        {/* Banner Informativo de Estado de Gestión */}
        {activeGestion && (
          <div className="mt-4 flex flex-wrap gap-3">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold ${
                activeGestion.estado === 'FORMULACION'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                  : activeGestion.estado === 'CERRADO_FORMULACION'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                  : activeGestion.estado === 'EN_EJECUCION'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {activeGestion.estado === 'FORMULACION' && (
                <>
                  <BookOpenText size={13} /> Formulación abierta — Las unidades pueden formular memorias de cálculo
                </>
              )}
              {activeGestion.estado === 'CERRADO_FORMULACION' && (
                <>
                  <Lock size={13} /> Formulación cerrada — Presupuestos consolidados y bloqueados
                </>
              )}
              {activeGestion.estado === 'EN_EJECUCION' && (
                <>
                  <Play size={13} /> En Ejecución — Registro y control activo de gastos operativos
                </>
              )}
              {activeGestion.estado === 'FINALIZADO' && (
                <>
                  <CheckCircle2 size={13} /> Gestión Finalizada
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* VISTA 1: DASHBOARD + RESUMEN PRESUPUESTARIO CONSOLIDADO */}
      {viewMode === 'general' && (
        <div className="space-y-6">
          {/* Barra de Filtros Interactivos (Meses y Área) */}
          <div className="card p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Filtro por Gerencia / Área */}
              <div className="flex items-center gap-2 bg-theme-base border border-theme-border px-3 py-1.5 rounded-xl text-xs">
                <Building2 size={14} className="text-theme-muted" />
                <span className="text-theme-muted font-semibold">Área:</span>
                <select
                  value={filtroAreaId}
                  onChange={(e) => {
                    setFiltroAreaId(e.target.value);
                    setPageGerencias(1);
                  }}
                  className="bg-transparent font-bold text-theme-main focus:outline-none cursor-pointer text-xs"
                >
                  <option value="todas">Todas las Áreas</option>
                  {presupuestosArea.map((p) => (
                    <option key={p.id} value={String(p.area)}>
                      {p.area_codigo} — {p.area_nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rango Mes Desde */}
              <div className="flex items-center gap-2 bg-theme-base border border-theme-border px-3 py-1.5 rounded-xl text-xs">
                <Calendar size={14} className="text-theme-muted" />
                <span className="text-theme-muted font-semibold">Mes Desde:</span>
                <select
                  value={mesDesde}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setMesDesde(val);
                    if (val > mesHasta) setMesHasta(val);
                  }}
                  className="bg-transparent font-bold text-theme-main focus:outline-none cursor-pointer text-xs"
                >
                  {MESES.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rango Mes Hasta */}
              <div className="flex items-center gap-2 bg-theme-base border border-theme-border px-3 py-1.5 rounded-xl text-xs">
                <Calendar size={14} className="text-theme-muted" />
                <span className="text-theme-muted font-semibold">Mes Hasta:</span>
                <select
                  value={mesHasta}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setMesHasta(val);
                    if (val < mesDesde) setMesDesde(val);
                  }}
                  className="bg-transparent font-bold text-theme-main focus:outline-none cursor-pointer text-xs"
                >
                  {MESES.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Limpiar Filtros */}
              {(hayFiltroMeses || filtroAreaId !== 'todas') && (
                <button
                  onClick={resetearFiltroMeses}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-all flex items-center gap-1 cursor-pointer"
                  title="Restablecer filtros a todo el año y todas las áreas"
                >
                  <RotateCcw size={13} />
                  Limpiar Filtros
                </button>
              )}
            </div>

            <div className="text-xs text-theme-muted flex items-center gap-1.5">
              <Filter size={13} className="text-theme-primary" />
              <span>
                Periodo: <strong>{nombreMesDesde} a {nombreMesHasta} {activeGestion?.anio || ''}</strong>
              </span>
            </div>
          </div>

          {/* Tarjetas de Indicadores Métricos Consolidados (ResumenCards) */}
          <ResumenCards items={resumenCardsItems} columns={4} />

          {/* TABLA PRINCIPAL DEL DASHBOARD: Por Gerencias o Por Programas */}
          <div className="card p-0 overflow-hidden shadow-sm">
            {/* Cabecera de la Tabla */}
            <div className="p-4 sm:p-5 border-b border-theme-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-theme-base/40">
              <div>
                <h3 className="text-sm font-bold text-theme-main">
                  {vistaAgrupacion === 'gerencias'
                    ? 'Presupuesto y Ejecución por Gerencia / Área'
                    : 'Presupuesto y Ejecución Consolidado por Programa'}
                </h3>
                <p className="text-xs text-theme-muted mt-0.5">
                  {vistaAgrupacion === 'gerencias'
                    ? `Techo asignado, gasto ejecutado y saldo disponible. Seleccione una fila para acceder directamente a la sección.`
                    : `Consolidación por programas estratégicos. Despliegue para ingresar a cada sección operativa.`}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Switch Agrupación: Gerencias vs Programas */}
                <div className="flex items-center p-1 bg-theme-surface border border-theme-border rounded-xl">
                  <button
                    onClick={() => {
                      setVistaAgrupacion('gerencias');
                      setPageGerencias(1);
                    }}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      vistaAgrupacion === 'gerencias'
                        ? 'bg-theme-primary text-theme-primaryText shadow-sm'
                        : 'text-theme-muted hover:text-theme-main'
                    }`}
                  >
                    <Building2 size={13} />
                    Por Gerencias
                  </button>
                  <button
                    onClick={() => setVistaAgrupacion('programas')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      vistaAgrupacion === 'programas'
                        ? 'bg-theme-primary text-theme-primaryText shadow-sm'
                        : 'text-theme-muted hover:text-theme-main'
                    }`}
                  >
                    <Layers size={13} />
                    Por Programas
                  </button>
                </div>

                <button
                  onClick={() => abrirReporteGeneral(vistaAgrupacion)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-theme-primary/10 text-theme-primary hover:bg-theme-primary/20 transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Generar e imprimir reporte según el filtro activo"
                >
                  <Printer size={13} />
                  Imprimir Reporte
                </button>
              </div>
            </div>

            {/* TABLA POR GERENCIAS */}
            {vistaAgrupacion === 'gerencias' && (
              <div className="flex flex-col">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-theme-border bg-theme-base/60 text-xs font-semibold uppercase tracking-wider text-theme-muted">
                        <th className="py-3 px-4">Gerencia / Unidad Organizacional</th>
                        <th className="py-3 px-4 text-right">Techo Inicial</th>
                        <th className="py-3 px-4 text-right">
                          Ejecutado ({nombreMesDesde.slice(0, 3)} - {nombreMesHasta.slice(0, 3)})
                        </th>
                        <th className="py-3 px-4 text-right">Disponible</th>
                        <th className="py-3 px-4 text-center">Avance</th>
                        <th className="py-3 px-4 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-border">
                      {pagedGerencias.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-theme-muted text-sm">
                            No hay registros presupuestarios para el criterio seleccionado.
                          </td>
                        </tr>
                      ) : (
                        pagedGerencias.map((p) => (
                          <tr
                            key={p.id}
                            onClick={() => handleSelectArea(p.area)}
                            className="hover:bg-theme-border/20 transition-colors cursor-pointer group"
                            title={`Ingresar directamente a la sección de ${p.area_nombre}`}
                          >
                            <td className="py-3.5 px-4 min-w-[200px]">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/90 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60 px-1.5 py-0.5 rounded">
                                  {p.area_codigo}
                                </span>
                                <span className="font-bold text-theme-main text-xs group-hover:text-theme-primary transition-colors">
                                  {p.area_nombre}
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-right font-medium text-theme-main">
                              {formatMoney(p.monto_inicial)}
                            </td>
                            <td className="py-3.5 px-4 text-right text-rose-600 dark:text-rose-400 font-semibold">
                              {formatMoney(p.monto_ejecutado_periodo)}
                            </td>
                            <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                              {formatMoney(p.monto_disponible_periodo)}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                  p.porcentaje_ejecucion_periodo > 80
                                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                    : p.porcentaje_ejecucion_periodo > 50
                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                    : 'bg-theme-border text-theme-main'
                                }`}
                              >
                                {p.porcentaje_ejecucion_periodo}%
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <span className="text-[11px] text-theme-primary font-semibold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                Ver Sección <ChevronRight size={13} />
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Paginación de la Tabla de Gerencias */}
                <Pagination
                  currentPage={pageGerencias}
                  totalItems={presupuestosCalculados.length}
                  pageSize={pageSizeGerencias}
                  onPageChange={setPageGerencias}
                  itemLabel="gerencias / unidades"
                />
              </div>
            )}

            {/* TABLA POR PROGRAMAS */}
            {vistaAgrupacion === 'programas' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-theme-border bg-theme-base/60 text-xs font-semibold uppercase tracking-wider text-theme-muted">
                      <th className="py-3 px-4">Programa Estratégico</th>
                      <th className="py-3 px-4 text-right">Techo Total Inicial</th>
                      <th className="py-3 px-4 text-right">
                        Ejecutado ({nombreMesDesde.slice(0, 3)} - {nombreMesHasta.slice(0, 3)})
                      </th>
                      <th className="py-3 px-4 text-right">Disponible</th>
                      <th className="py-3 px-4 text-center">Avance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-border">
                    {programasResumen.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-theme-muted text-sm">
                          No hay programas registrados para el criterio seleccionado.
                        </td>
                      </tr>
                    ) : (
                      programasResumen.map((prog) => {
                        const isExpanded = expandedProgramas[prog.codigo];
                        return (
                          <React.Fragment key={prog.codigo}>
                            <tr
                              onClick={() => toggleExpandPrograma(prog.codigo)}
                              className="hover:bg-theme-border/20 transition-colors cursor-pointer bg-theme-base/20"
                            >
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-2">
                                  <div className="text-theme-muted">
                                    {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                                  </div>
                                  <div>
                                    <span className="font-bold text-theme-main text-xs">{prog.nombre}</span>
                                    <span className="text-[10px] px-2 py-0.5 ml-2 rounded-full font-bold bg-theme-primary/10 text-theme-primary font-mono">
                                      {prog.areas.length} {prog.areas.length === 1 ? 'área' : 'áreas'}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-right font-bold text-theme-main">
                                {formatMoney(prog.total_inicial)}
                              </td>
                              <td className="py-4 px-4 text-right font-bold text-rose-600 dark:text-rose-400">
                                {formatMoney(prog.total_ejecutado)}
                              </td>
                              <td className="py-4 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                {formatMoney(prog.total_disponible)}
                              </td>
                              <td className="py-4 px-4 text-center">
                                <span
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                    prog.porcentaje_ejecucion > 80
                                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                      : prog.porcentaje_ejecucion > 50
                                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                      : 'bg-theme-border text-theme-main'
                                  }`}
                                >
                                  {prog.porcentaje_ejecucion}%
                                </span>
                              </td>
                            </tr>

                            {/* Desglose de Áreas dentro del Programa */}
                            {isExpanded &&
                              prog.areas.map((p) => (
                                <tr
                                  key={`prog-area-${p.id}`}
                                  onClick={() => handleSelectArea(p.area)}
                                  className="bg-theme-surface hover:bg-theme-border/20 transition-colors cursor-pointer group"
                                  title={`Ingresar directamente a la sección de ${p.area_nombre}`}
                                >
                                  <td className="py-3 px-4 pl-10">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 px-1.5 py-0.5 rounded">
                                        {p.area_codigo}
                                      </span>
                                      <span className="text-theme-main text-xs group-hover:text-theme-primary transition-colors">
                                        {p.area_nombre}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-right text-theme-muted font-medium">
                                    {formatMoney(p.monto_inicial)}
                                  </td>
                                  <td className="py-3 px-4 text-right text-rose-600/90 dark:text-rose-400 font-medium">
                                    {formatMoney(p.monto_ejecutado_periodo)}
                                  </td>
                                  <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                                    {formatMoney(p.monto_disponible_periodo)}
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <span className="text-[11px] font-bold text-theme-muted">
                                      {p.porcentaje_ejecucion_periodo}%
                                    </span>
                                  </td>
                                </tr>
                              ))}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VISTA 2: DETALLES DE SECCIÓN (DIRECTO AL TOCAR LA FILA) */}
      {viewMode === 'seccion' && (
        <div className="space-y-6">
          {/* Navegación y Breadcrumbs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-theme-base/60 p-3 rounded-2xl border border-theme-border">
            <button
              onClick={irAGeneral}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-theme-primary hover:underline cursor-pointer"
            >
              <ChevronLeft size={16} /> Volver a Resumen Presupuestario
            </button>

            <div className="flex items-center gap-2 text-xs font-medium text-theme-muted select-none flex-wrap">
              <span className="hover:text-theme-main cursor-pointer" onClick={irAGeneral}>
                Presupuestos
              </span>
              <ChevronRight size={12} />
              <span className="font-semibold text-theme-main">
                {detalleArea?.area_nombre || `Área ${selectedAreaId}`}
              </span>
              {seccionActivaData && (
                <>
                  <ChevronRight size={12} />
                  <span className="font-bold text-theme-primary">
                    {seccionActivaData.seccion_nombre}
                  </span>
                </>
              )}
            </div>
          </div>

          {detalleLoading ? (
            <div className="card p-12 text-center">
              <RefreshCw size={28} className="animate-spin mx-auto text-theme-muted mb-3" />
              <p className="text-sm font-semibold text-theme-main">Cargando detalles de la sección...</p>
              <p className="text-xs text-theme-muted mt-1">Obteniendo estructura POA, partidas y gastos auxiliares.</p>
            </div>
          ) : !detalleArea || !seccionActivaData ? (
            <div className="card p-12 text-center space-y-3">
              <FileText size={36} className="mx-auto opacity-30 text-theme-muted" />
              <p className="text-sm font-semibold text-theme-muted">Sección sin presupuesto formulado</p>
              <p className="text-xs text-theme-muted max-w-md mx-auto">
                No se encontraron memorias ni techos presupuestarios registrados en esta sección para la Gestión {activeGestion?.anio}.
              </p>
              <button onClick={irAGeneral} className="btn-primary text-xs px-4 py-2 mt-2">
                Volver al Resumen General
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Resumen Superior de la Sección Activa */}
              <div className="card p-5 bg-gradient-to-r from-theme-surface to-theme-base/30">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 font-mono uppercase">
                      {detalleArea?.area_codigo} — Sección Operativa
                    </span>
                    <h2 className="text-xl font-bold text-theme-main mt-1.5">{seccionActivaData.seccion_nombre}</h2>
                    <p className="text-xs text-theme-muted mt-0.5">Gerencia / Unidad: {detalleArea?.area_nombre}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={irAReporte}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all bg-theme-base border-theme-border text-theme-main hover:border-theme-primary hover:text-theme-primary cursor-pointer shadow-sm"
                    >
                      <Printer size={14} />
                      Generar Reporte Sección
                    </button>
                    <div className="text-right pl-3 border-l border-theme-border">
                      <span className="text-[10px] text-theme-muted font-semibold uppercase block">Memorias</span>
                      <span className="text-xl font-bold text-theme-main">{seccionActivaData.memorias.length}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
                  <div className="p-3.5 rounded-xl bg-theme-base border border-theme-border text-center">
                    <p className="text-[10px] font-semibold text-theme-muted uppercase">Presupuesto Formulado</p>
                    <p className="text-lg font-bold text-theme-main mt-0.5">
                      {formatMoney(seccionActivaData.total_presupuestado)}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-200/80 dark:bg-rose-950/30 dark:border-rose-800/60 text-center">
                    <p className="text-[10px] font-semibold text-rose-700 dark:text-rose-400 uppercase">Gasto Ejecutado</p>
                    <p className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                      {formatMoney(seccionActivaData.total_gastado)}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80 dark:bg-emerald-950/30 dark:border-emerald-800/60 text-center">
                    <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase">Saldo Disponible</p>
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {formatMoney(seccionActivaData.total_disponible)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sub-Tabs de la Sección */}
              <div className="flex border-b border-theme-border gap-2 overflow-x-auto">
                <button
                  onClick={() => setTabSeccion('presupuesto')}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                    tabSeccion === 'presupuesto'
                      ? 'border-theme-primary text-theme-main font-extrabold'
                      : 'border-transparent text-theme-muted hover:text-theme-main'
                  }`}
                >
                  <Layers size={14} /> Estructura POA y Memorias ({seccionActivaData.memorias.length})
                </button>
                <button
                  onClick={() => setTabSeccion('gastos')}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                    tabSeccion === 'gastos'
                      ? 'border-rose-500 text-rose-600 font-extrabold'
                      : 'border-transparent text-theme-muted hover:text-theme-main'
                  }`}
                >
                  <Receipt size={14} /> Libro Auxiliar de Gastos ({todosLosGastosSeccion.length})
                </button>
                <button
                  onClick={() => setTabSeccion('partidas')}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                    tabSeccion === 'partidas'
                      ? 'border-theme-primary text-theme-main font-extrabold'
                      : 'border-transparent text-theme-muted hover:text-theme-main'
                  }`}
                >
                  <BookOpenText size={14} /> Consolidado por Partidas ({partidasConsolidadas.length})
                </button>
              </div>

              {/* SUB-TAB 1: ESTRUCTURA POA Y MEMORIAS (CON TAMAÑO DEFINIDO Y PAGINACIÓN) */}
              {tabSeccion === 'presupuesto' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-theme-muted">
                        Memorias de Cálculo Formuladas en la Sección
                      </h3>
                      <p className="text-[11px] text-theme-muted">
                        Desglose de requerimientos, partidas imputadas y registro de gastos.
                      </p>
                    </div>
                  </div>

                  {seccionActivaData.memorias.length === 0 ? (
                    <div className="card p-10 text-center text-theme-muted space-y-2">
                      <FileText size={36} className="mx-auto opacity-30 text-theme-muted" />
                      <p className="font-semibold text-sm">No hay memorias de cálculo registradas en esta sección.</p>
                    </div>
                  ) : (
                    /* Contenedor con tamaño definido para evitar que se vea desproporcionado */
                    <div className="rounded-2xl border border-theme-border bg-theme-surface p-4 flex flex-col space-y-4 shadow-sm">
                      <div className="max-h-[580px] overflow-y-auto pr-2 space-y-3 scrollbar-thin">
                        {pagedMemorias.map((memoria) => {
                          const memExpanded = expandedMemorias.has(memoria.memoria_id);
                          return (
                            <div
                              key={memoria.memoria_id}
                              className="card border border-theme-border overflow-hidden bg-theme-surface transition-all"
                            >
                              {/* Cabecera de Memoria */}
                              <button
                                onClick={() => toggleMemoria(memoria.memoria_id)}
                                className="w-full flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 text-left hover:bg-theme-border/20 transition-colors cursor-pointer"
                              >
                                <div className="flex items-start gap-2.5 min-w-0">
                                  <FileText size={18} className="text-theme-muted shrink-0 mt-0.5" />
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-mono text-sm font-bold text-theme-main">
                                        {memoria.memoria_codigo}
                                      </span>
                                      {getBadgeEstado(memoria.estado)}
                                      {Number(memoria.monto_entrante || 0) > 0 && (
                                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                          <TrendingUp size={11} /> +{formatMoney(memoria.monto_entrante || 0)}
                                        </span>
                                      )}
                                      {Number(memoria.monto_saliente || 0) > 0 && (
                                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                          <TrendingDown size={11} /> -{formatMoney(memoria.monto_saliente || 0)}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-theme-muted mt-1 leading-normal line-clamp-2">
                                      {memoria.justificacion}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-4 ml-auto sm:ml-0 shrink-0 text-right">
                                  <div>
                                    <p className="text-[10px] text-theme-muted font-semibold uppercase">PRESUPUESTADO</p>
                                    <p className="text-sm font-bold text-theme-main">
                                      {formatMoney(memoria.total_presupuestado)}
                                    </p>
                                  </div>

                                  <div>
                                    <p className="text-[10px] text-theme-muted font-semibold uppercase">SALDO DISPONIBLE</p>
                                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                      {formatMoney(memoria.total_disponible)}
                                    </p>
                                  </div>
                                  <ChevronDown
                                    size={18}
                                    className={`text-theme-muted transition-transform ${
                                      memExpanded ? 'rotate-180' : ''
                                    }`}
                                  />
                                </div>
                              </button>

                              {/* Partidas y gastos asociados de la memoria */}
                              {memExpanded && (
                                <div className="border-t border-theme-border bg-theme-base/20 p-4 space-y-4">
                                  {memoria.partidas.length === 0 ? (
                                    <p className="text-xs text-theme-muted text-center py-2">
                                      Sin partidas asignadas en esta memoria.
                                    </p>
                                  ) : (
                                    memoria.partidas.map((partida) => {
                                      const pKey = `${memoria.memoria_id}-${partida.partida_codigo}`;
                                      const prtExpanded = expandedPartidas.has(pKey);
                                      const pctP =
                                        parseFloat(partida.presupuestado) > 0
                                          ? Math.min(
                                              100,
                                              Math.round(
                                                (parseFloat(partida.gastado) / parseFloat(partida.presupuestado)) *
                                                  10000
                                              ) / 100
                                            )
                                          : 0;

                                      return (
                                        <div
                                          key={pKey}
                                          className="border border-theme-border rounded-xl bg-theme-surface overflow-hidden shadow-sm"
                                        >
                                          {/* Cabecera Partida */}
                                          <button
                                            onClick={() => togglePartida(pKey)}
                                            className="w-full p-4 flex items-center justify-between gap-4 hover:bg-theme-border/20 transition-colors text-left cursor-pointer"
                                          >
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-2">
                                                <span className="font-mono text-xs font-bold text-theme-primary">
                                                  {partida.partida_codigo}
                                                </span>
                                                <span className="text-xs font-semibold text-theme-main truncate">
                                                  {partida.partida_nombre}
                                                </span>
                                              </div>

                                              <div className="grid grid-cols-3 gap-2 mt-3 text-left">
                                                <div>
                                                  <span className="text-[10px] text-theme-muted uppercase font-semibold">
                                                    Presupuesto
                                                  </span>
                                                  <p className="text-xs font-bold text-theme-main">
                                                    {formatMoney(partida.presupuestado)}
                                                  </p>
                                                </div>
                                                <div>
                                                  <span className="text-[10px] text-theme-muted text-rose-600 uppercase font-semibold">
                                                    Ejecutado
                                                  </span>
                                                  <p className="text-xs font-bold text-rose-600 dark:text-rose-400">
                                                    {formatMoney(partida.gastado)}
                                                  </p>
                                                </div>
                                                <div>
                                                  <span className="text-[10px] text-theme-muted text-emerald-600 uppercase font-semibold">
                                                    Disponible
                                                  </span>
                                                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                                    {formatMoney(partida.disponible)}
                                                  </p>
                                                </div>
                                              </div>

                                              <div className="w-full bg-theme-border/60 rounded-full h-1.5 mt-2.5 overflow-hidden">
                                                <div
                                                  className={`h-full ${
                                                    pctP > 80
                                                      ? 'bg-rose-500'
                                                      : pctP > 50
                                                      ? 'bg-amber-500'
                                                      : 'bg-theme-primary'
                                                  }`}
                                                  style={{ width: `${pctP}%` }}
                                                />
                                              </div>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                              {partida.gastos_detalle.length > 0 && (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                                                  {partida.gastos_detalle.length} gasto(s)
                                                </span>
                                              )}
                                              <ChevronDown
                                                size={15}
                                                className={`text-theme-muted transition-transform ${
                                                  prtExpanded ? 'rotate-180' : ''
                                                }`}
                                              />
                                            </div>
                                          </button>

                                          {/* Tabla de Gastos Ejecutados en Partida */}
                                          {prtExpanded && (
                                            <div className="border-t border-theme-border bg-theme-base/40">
                                              {partida.gastos_detalle.length === 0 ? (
                                                <p className="p-4 text-xs text-center text-theme-muted">
                                                  Sin gastos registrados todavía.
                                                </p>
                                              ) : (
                                                <div className="overflow-x-auto">
                                                  <table className="w-full text-xs border-collapse">
                                                    <thead>
                                                      <tr className="text-[10px] font-bold uppercase text-theme-muted border-b border-theme-border bg-theme-base/60">
                                                        <th className="py-2 px-4 text-left">Fecha</th>
                                                        <th className="py-2 px-4 text-left">Descripción del Ítem</th>
                                                        <th className="py-2 px-4 text-left">N° Comprobante</th>
                                                        <th className="py-2 px-4 text-left">Observación</th>
                                                        <th className="py-2 px-4 text-right">Monto</th>
                                                      </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-theme-border">
                                                      {partida.gastos_detalle.map((gasto) => (
                                                        <tr key={gasto.gasto_id} className="hover:bg-theme-border/20 transition-colors">
                                                          <td className="py-2.5 px-4 font-mono font-semibold text-theme-muted">
                                                            {gasto.fecha_gasto}
                                                          </td>
                                                          <td className="py-2.5 px-4 text-theme-main font-medium">
                                                            {gasto.item_descripcion}
                                                          </td>
                                                          <td className="py-2.5 px-4 font-mono font-bold text-theme-muted">
                                                            {gasto.comprobante || 'S/N'}
                                                          </td>
                                                          <td className="py-2.5 px-4 text-theme-muted">
                                                            {gasto.observacion || '—'}
                                                          </td>
                                                          <td className="py-2.5 px-4 text-right font-bold text-rose-600 dark:text-rose-400">
                                                            {formatMoney(gasto.monto)}
                                                          </td>
                                                        </tr>
                                                      ))}
                                                    </tbody>
                                                  </table>
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Paginación de Memorias */}
                      <Pagination
                        currentPage={pageMemorias}
                        totalItems={seccionActivaData.memorias.length}
                        pageSize={pageSizeMemorias}
                        onPageChange={setPageMemorias}
                        itemLabel="memorias formuladas"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* SUB-TAB 2: LIBRO AUXILIAR DE GASTOS (CON PAGINACIÓN) */}
              {tabSeccion === 'gastos' && (
                <div className="card overflow-hidden bg-theme-surface flex flex-col shadow-sm">
                  <div className="p-4 bg-theme-base/60 border-b border-theme-border flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-theme-main flex items-center gap-1.5">
                      <Receipt size={14} className="text-rose-500" />
                      Historial Detallado de Egresos y Gastos Ejecutados
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                      {todosLosGastosSeccion.length} transacción(es)
                    </span>
                  </div>

                  {todosLosGastosSeccion.length === 0 ? (
                    <div className="p-12 text-center text-theme-muted space-y-2">
                      <Receipt size={36} className="mx-auto opacity-30 text-rose-500" />
                      <p className="font-semibold text-sm">Sin gastos registrados en esta sección.</p>
                      <p className="text-xs max-w-sm mx-auto">
                        Los gastos se registran desde el Módulo de Ejecución Presupuestaria imputando renglones aprobados.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead>
                            <tr className="bg-theme-base/60 text-[10px] font-bold uppercase tracking-wider text-theme-muted border-b border-theme-border">
                              <th className="py-3 px-4">Fecha</th>
                              <th className="py-3 px-4">Memoria</th>
                              <th className="py-3 px-4">Partida Presupuestaria</th>
                              <th className="py-3 px-4">Renglón Imputado</th>
                              <th className="py-3 px-4">N° Comprobante</th>
                              <th className="py-3 px-4">Justificación / Observación</th>
                              <th className="py-3 px-4 text-right">Monto Ejecutado</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-theme-border">
                            {pagedGastos.map((gasto, index) => (
                              <tr key={gasto.gasto_id || index} className="hover:bg-theme-border/20 transition-colors">
                                <td className="py-3 px-4 whitespace-nowrap">
                                  <span className="inline-flex items-center gap-1 font-mono font-bold text-[11px] text-theme-muted bg-theme-base px-2 py-0.5 rounded border border-theme-border/60">
                                    <Clock size={11} />
                                    {gasto.fecha_gasto}
                                  </span>
                                </td>
                                <td className="py-3 px-4 font-mono font-bold text-[11px] text-theme-main">
                                  {gasto.memoria_codigo}
                                </td>
                                <td className="py-3 px-4">
                                  <p className="font-mono font-bold text-[11px] text-theme-main">{gasto.partida_codigo}</p>
                                  <p className="text-[10px] text-theme-muted line-clamp-1 truncate max-w-[150px]" title={gasto.partida_nombre}>
                                    {gasto.partida_nombre}
                                  </p>
                                </td>
                                <td className="py-3 px-4 font-medium text-theme-main max-w-xs">
                                  {gasto.item_descripcion}
                                </td>
                                <td className="py-3 px-4 whitespace-nowrap">
                                  <span className="font-mono font-bold px-2 py-0.5 rounded border border-theme-border bg-theme-base/40 text-theme-muted text-[11px]">
                                    {gasto.comprobante || 'S/N'}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-theme-muted max-w-xs truncate" title={gasto.observacion || ''}>
                                  {gasto.observacion || '—'}
                                </td>
                                <td className="py-3 px-4 text-right font-extrabold text-[13px] text-rose-600 dark:text-rose-400 whitespace-nowrap">
                                  {formatMoney(gasto.monto)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Paginación de Gastos */}
                      <Pagination
                        currentPage={pageGastos}
                        totalItems={todosLosGastosSeccion.length}
                        pageSize={pageSizeGastos}
                        onPageChange={setPageGastos}
                        itemLabel="gastos ejecutados"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* SUB-TAB 3: CONSOLIDADO POR PARTIDAS (CON PAGINACIÓN) */}
              {tabSeccion === 'partidas' && (
                <div className="space-y-4">
                  {/* Barra de Filtros de Partidas */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-theme-surface p-4 rounded-xl border border-theme-border shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-theme-primary/10 text-theme-primary">
                        <BookOpenText size={18} />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-theme-main">
                          Lista Consolidada por Orden de Partidas
                        </h3>
                        <p className="text-[11px] text-theme-muted">
                          Gestión {activeGestion?.anio || detalleArea?.gestion_anio} • {detalleArea?.area_nombre} ({detalleArea?.area_codigo})
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Búsqueda */}
                      <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted" />
                        <input
                          type="text"
                          placeholder="Buscar partida..."
                          value={busquedaPartida}
                          onChange={(e) => {
                            setBusquedaPartida(e.target.value);
                            setPagePartidas(1);
                          }}
                          className="pl-9 pr-3 py-1.5 text-xs rounded-xl bg-theme-base border border-theme-border text-theme-main placeholder:text-theme-muted focus:outline-none focus:border-theme-primary w-full sm:w-44"
                        />
                        {busquedaPartida && (
                          <button
                            onClick={() => setBusquedaPartida('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-main text-xs"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {/* Botón Imprimir Partidas */}
                      <button
                        onClick={() => setShowModalReportePartidas(true)}
                        className="px-3 py-1.5 rounded-xl bg-theme-primary text-theme-primaryText text-xs font-bold hover:bg-theme-primaryHover transition-all flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
                        title="Imprimir reporte oficial de partidas presupuestarias"
                      >
                        <Printer size={14} />
                        Imprimir Partidas
                      </button>
                    </div>
                  </div>

                  {/* Resumen KPIs de Partidas */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
                    <div className="card p-3 text-center">
                      <span className="text-[9px] font-bold text-theme-muted uppercase block">Total Presupuestado</span>
                      <p className="text-sm font-bold text-theme-main mt-0.5">{formatMoney(totalPartidasPresupuestado)}</p>
                    </div>
                    <div className="card p-3 text-center bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-800/40">
                      <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 uppercase block">Agregado (+)</span>
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">+{formatMoney(totalPartidasAgregado)}</p>
                    </div>
                    <div className="card p-3 text-center bg-rose-50/40 dark:bg-rose-950/20 border-rose-200/60 dark:border-rose-800/40">
                      <span className="text-[9px] font-bold text-rose-700 dark:text-rose-400 uppercase block">Quitado (-)</span>
                      <p className="text-sm font-bold text-rose-600 dark:text-rose-400 mt-0.5">-{formatMoney(totalPartidasQuitado)}</p>
                    </div>
                    <div className="card p-3 text-center bg-rose-50/30 dark:bg-rose-950/15 border-rose-200/50 dark:border-rose-800/30">
                      <span className="text-[9px] font-bold text-rose-700 dark:text-rose-400 uppercase block">
                        Ejecutado ({nombreMesDesde.slice(0, 3)} - {nombreMesHasta.slice(0, 3)})
                      </span>
                      <p className="text-sm font-bold text-rose-600 dark:text-rose-400 mt-0.5">{formatMoney(totalPartidasEjecutado)}</p>
                    </div>
                    <div className="card p-3 text-center bg-emerald-50/50 dark:bg-emerald-950/25 border-emerald-200/70 dark:border-emerald-800/50">
                      <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 uppercase block">Disponible</span>
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{formatMoney(totalPartidasDisponible)}</p>
                    </div>
                    <div className="card p-3 text-center">
                      <span className="text-[9px] font-bold text-theme-muted uppercase block">% Ejecución</span>
                      <p className="text-sm font-bold text-theme-main mt-0.5">{pctPartidasGlobal}%</p>
                    </div>
                  </div>

                  {/* Tabla Principal de Partidas */}
                  <div className="card overflow-hidden bg-theme-surface flex flex-col shadow-sm">
                    {partidasFiltradas.length === 0 ? (
                      <div className="p-12 text-center text-theme-muted space-y-2">
                        <BookOpenText size={36} className="mx-auto opacity-30 text-theme-primary" />
                        <p className="font-semibold text-sm">
                          {busquedaPartida ? 'No se encontraron partidas para la búsqueda.' : 'Sin partidas configuradas en esta sección.'}
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left border-collapse">
                            <thead>
                              <tr className="bg-theme-base/60 text-[10px] font-bold uppercase tracking-wider text-theme-muted border-b border-theme-border">
                                <th className="py-3 px-3 text-center w-10">Nº</th>
                                <th className="py-3 px-3 text-center w-24">Nº Partida</th>
                                <th className="py-3 px-4">Nombre de la Partida</th>
                                <th className="py-3 px-3 text-right">Total Presupuestado</th>
                                <th className="py-3 px-3 text-right text-emerald-700 dark:text-emerald-400">Agregado (+)</th>
                                <th className="py-3 px-3 text-right text-rose-700 dark:text-rose-400">Quitado (-)</th>
                                <th className="py-3 px-3 text-right text-rose-600 dark:text-rose-400">
                                  Ejecutado ({nombreMesDesde.slice(0, 3)} - {nombreMesHasta.slice(0, 3)})
                                </th>
                                <th className="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400">Disponible</th>
                                <th className="py-3 px-3 text-center w-20">Porcentaje</th>
                                <th className="py-3 px-2 text-center w-12">Detalle</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-theme-border">
                              {pagedPartidas.map((partida, idx) => {
                                const isExp = expandedPartidasConsolidadas.has(partida.partida_codigo);
                                const globalIdx = (pagePartidas - 1) * pageSizePartidas + idx + 1;

                                return (
                                  <React.Fragment key={`partida-${partida.partida_codigo}`}>
                                    <tr
                                      onClick={() => togglePartidaConsolidada(partida.partida_codigo)}
                                      className="hover:bg-theme-border/20 transition-colors cursor-pointer"
                                    >
                                      <td className="py-3 px-3 text-center font-bold text-theme-muted text-[11px]">
                                        {globalIdx}
                                      </td>
                                      <td className="py-3 px-3 text-center font-mono font-bold text-theme-primary text-xs">
                                        {partida.partida_codigo}
                                      </td>
                                      <td className="py-3 px-4 font-semibold text-theme-main text-xs">
                                        {partida.partida_nombre}
                                      </td>
                                      <td className="py-3 px-3 text-right font-medium text-theme-main text-xs">
                                        {formatMoney(partida.total_presupuestado)}
                                      </td>
                                      <td className="py-3 px-3 text-right font-medium text-emerald-600 dark:text-emerald-400 text-xs">
                                        {partida.total_agregado > 0 ? `+${formatMoney(partida.total_agregado)}` : '0,00 Bs'}
                                      </td>
                                      <td className="py-3 px-3 text-right font-medium text-rose-600 dark:text-rose-400 text-xs">
                                        {partida.total_quitado > 0 ? `-${formatMoney(partida.total_quitado)}` : '0,00 Bs'}
                                      </td>
                                      <td className="py-3 px-3 text-right font-bold text-rose-600 dark:text-rose-400 text-xs">
                                        {formatMoney(partida.total_ejecutado)}
                                      </td>
                                      <td className="py-3 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                                        {formatMoney(partida.total_disponible)}
                                      </td>
                                      <td className="py-3 px-3 text-center">
                                        <span
                                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                            partida.porcentaje_ejecucion > 80
                                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                              : partida.porcentaje_ejecucion > 50
                                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                              : 'bg-theme-border text-theme-main'
                                          }`}
                                        >
                                          {partida.porcentaje_ejecucion}%
                                        </span>
                                      </td>
                                      <td className="py-3 px-2 text-center text-theme-muted">
                                        {isExp ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                                      </td>
                                    </tr>

                                    {/* Desglose de Memorias al Expandir la Partida */}
                                    {isExp && (
                                      <tr className="bg-theme-base/30">
                                        <td colSpan={10} className="p-4 border-l-4 border-theme-primary/60">
                                          <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                              <span className="text-[11px] font-bold uppercase text-theme-muted">
                                                Memorias de Cálculo Asociadas a la Partida {partida.partida_codigo}:
                                              </span>
                                              <span className="text-[10px] text-theme-muted font-bold">
                                                {partida.memorias.length} memoria(s)
                                              </span>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                              {partida.memorias.map((mem) => (
                                                <div
                                                  key={`mem-${mem.memoria_id}`}
                                                  className="p-3 rounded-xl bg-theme-surface border border-theme-border text-xs space-y-2 shadow-sm"
                                                >
                                                  <div className="flex items-center justify-between">
                                                    <span className="font-mono font-bold text-theme-primary text-xs">
                                                      {mem.memoria_codigo}
                                                    </span>
                                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                      Disp: {formatMoney(mem.disponible)}
                                                    </span>
                                                  </div>
                                                  <p className="text-[11px] text-theme-muted line-clamp-2">
                                                    {mem.justificacion}
                                                  </p>
                                                  <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-theme-border/60 text-[10px]">
                                                    <div>
                                                      <span className="text-theme-muted block">Presupuesto:</span>
                                                      <span className="font-bold text-theme-main">
                                                        {formatMoney(mem.presupuestado)}
                                                      </span>
                                                    </div>
                                                    <div>
                                                      <span className="text-theme-muted block">Traspasos:</span>
                                                      <span className="font-bold text-blue-600 dark:text-blue-400">
                                                        +{formatMoney(mem.agregado)} / -{formatMoney(mem.quitado)}
                                                      </span>
                                                    </div>
                                                    <div>
                                                      <span className="text-theme-muted block">Ejecutado:</span>
                                                      <span className="font-bold text-rose-600 dark:text-rose-400">
                                                        {formatMoney(mem.ejecutado)}
                                                      </span>
                                                    </div>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Paginación de Partidas */}
                        <Pagination
                          currentPage={pagePartidas}
                          totalItems={partidasFiltradas.length}
                          pageSize={pageSizePartidas}
                          onPageChange={setPagePartidas}
                          itemLabel="partidas"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* VISTA 3: REPORTE IMPRIMIBLE OFICIAL DE LA SECCIÓN */}
      {viewMode === 'reporte' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-theme-surface p-4 rounded-xl border border-theme-border shadow-sm print:hidden">
            <button
              onClick={() => setViewMode('seccion')}
              className="flex items-center gap-1.5 text-xs font-bold text-theme-primary hover:underline cursor-pointer"
            >
              <ChevronLeft size={16} /> Volver a Detalles de Sección
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-theme-primary text-theme-primaryText text-xs font-bold hover:bg-theme-primaryHover transition-all flex items-center gap-1.5 shadow cursor-pointer"
            >
              <Printer size={15} /> Imprimir Reporte (PDF)
            </button>
          </div>

          {seccionActivaData ? (
            <div className="bg-white text-black p-6 sm:p-10 rounded-2xl shadow-lg border border-gray-300 max-w-4xl mx-auto space-y-6 print:border-none print:shadow-none print:p-0">
              <div className="border-b-2 border-black pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-600">
                      ESTADO PLURINACIONAL DE BOLIVIA
                    </p>
                    <h1 className="text-base sm:text-lg font-black uppercase tracking-wider text-black mt-0.5">
                      EMPRESA PÚBLICA DE TRANSPORTE AÉREO MILITAR - EPTAM
                    </h1>
                    <p className="text-[10px] font-semibold tracking-wide text-gray-500 uppercase">
                      SISTEMA INTEGRADO DE PROGRAMACIÓN OPERATIVA ANUAL (POA)
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block border-2 border-black px-2.5 py-1 text-xs font-black uppercase tracking-wider">
                      POA {activeGestion?.anio || detalleArea?.gestion_anio || '2026'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <h2 className="text-base sm:text-lg font-black uppercase tracking-wide text-black underline underline-offset-4">
                    ESTADO DE EJECUCIÓN PRESUPUESTARIA DE SECCIÓN
                  </h2>
                  <p className="text-xs font-bold text-gray-700 mt-1 uppercase">
                    {detalleArea?.area_nombre} — {seccionActivaData.seccion_nombre}
                  </p>
                </div>
              </div>

              {/* Metadatos */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] border border-gray-400 bg-gray-50 p-3 rounded">
                <div>
                  <span className="font-bold text-gray-500 block uppercase text-[9px]">Gestión Fiscal:</span>
                  <span className="font-bold text-black">{activeGestion?.anio || detalleArea?.gestion_anio}</span>
                </div>
                <div>
                  <span className="font-bold text-gray-500 block uppercase text-[9px]">Área / Gerencia:</span>
                  <span className="font-bold text-black">{detalleArea?.area_nombre}</span>
                </div>
                <div>
                  <span className="font-bold text-gray-500 block uppercase text-[9px]">Sección Operativa:</span>
                  <span className="font-bold text-black">{seccionActivaData.seccion_nombre}</span>
                </div>
                <div>
                  <span className="font-bold text-gray-500 block uppercase text-[9px]">Fecha de Emisión:</span>
                  <span className="font-medium text-black">{new Date().toLocaleDateString('es-BO')}</span>
                </div>
              </div>

              {/* Resumen Totales Sección */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="border border-gray-400 p-2.5 rounded bg-white">
                  <p className="text-[9px] font-bold uppercase text-gray-600">Presupuesto Formulado</p>
                  <p className="text-sm font-black text-black mt-0.5">{formatMoney(seccionActivaData.total_presupuestado)}</p>
                </div>
                <div className="border border-gray-400 p-2.5 rounded bg-white">
                  <p className="text-[9px] font-bold uppercase text-gray-600">Total Gastos Ejecutados</p>
                  <p className="text-sm font-black text-red-700 mt-0.5">{formatMoney(seccionActivaData.total_gastado)}</p>
                </div>
                <div className="border border-gray-400 p-2.5 rounded bg-white">
                  <p className="text-[9px] font-bold uppercase text-gray-600">Saldo Disponible</p>
                  <p className="text-sm font-black text-emerald-700 mt-0.5">{formatMoney(seccionActivaData.total_disponible)}</p>
                </div>
              </div>

              {/* Firmas */}
              <div className="pt-8 pb-4 mt-8">
                <div className="grid grid-cols-3 gap-6 text-center">
                  <div className="border-t border-black pt-2">
                    <p className="text-[10px] font-bold uppercase text-black">Elaborado por</p>
                    <p className="text-[9px] text-gray-600 mt-1">Responsable Operativo</p>
                    <p className="text-[8px] text-gray-500 mt-4">Firma y Sello</p>
                  </div>
                  <div className="border-t border-black pt-2">
                    <p className="text-[10px] font-bold uppercase text-black">Revisado por</p>
                    <p className="text-[9px] text-gray-600 mt-1">Jefe de Planificación</p>
                    <p className="text-[8px] text-gray-500 mt-4">Firma y Sello</p>
                  </div>
                  <div className="border-t border-black pt-2">
                    <p className="text-[10px] font-bold uppercase text-black">Aprobado por</p>
                    <p className="text-[9px] text-gray-600 mt-1">Gerente de Área</p>
                    <p className="text-[8px] text-gray-500 mt-4">Firma y Sello</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card p-10 text-center text-theme-muted">
              <p>No se encontraron datos para generar el reporte de sección.</p>
            </div>
          )}
        </div>
      )}

      {/* MODAL NUEVA GESTIÓN */}
      {showModalGestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card w-full max-w-sm shadow-2xl bg-theme-surface">
            <div className="p-5 border-b border-theme-border flex items-center justify-between">
              <h3 className="text-base font-bold text-theme-main">Nueva Gestión Presupuestaria</h3>
              <button
                onClick={() => setShowModalGestion(false)}
                className="text-theme-muted hover:text-theme-main font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCrearGestion} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-theme-muted mb-1">
                  Año de la Gestión
                </label>
                <input
                  type="number"
                  required
                  min={2020}
                  max={2050}
                  value={nuevoAnio}
                  onChange={(e) => setNuevoAnio(Number(e.target.value))}
                  className="input-theme text-sm font-bold"
                />
                <p className="text-[11px] text-theme-muted mt-1">
                  La gestión se creará en estado <strong>Formulación</strong>.
                </p>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModalGestion(false)}
                  className="px-4 py-2 rounded-xl border border-theme-border text-xs font-semibold text-theme-muted hover:text-theme-main cursor-pointer"
                >
                  Cancelar
                </button>
                <button type="submit" disabled={actionLoading} className="btn-primary text-xs px-5 py-2 cursor-pointer">
                  Crear Gestión
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE REPORTE E IMPRESIÓN OFICIAL DEL DASHBOARD (GERENCIAS / PROGRAMAS) */}
      {showModalReporte && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:overflow-visible">
          <div className="bg-theme-surface border border-theme-border rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden print:max-w-none print:max-h-none print:border-none print:shadow-none print:w-full">
            {/* Barra de Controles Superior */}
            <div className="p-4 border-b border-theme-border flex items-center justify-between bg-theme-base/60 print:hidden">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-theme-primary/10 text-theme-primary">
                  <Printer size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-theme-main">Vista Previa de Reporte Presupuestario</h3>
                  <p className="text-[11px] text-theme-muted">
                    Gestión Fiscal {activeGestion?.anio || '2026'} • Periodo: {nombreMesDesde} - {nombreMesHasta}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center p-0.5 bg-theme-surface border border-theme-border rounded-lg">
                  <button
                    onClick={() => setTipoReporteImpresion('gerencias')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded ${
                      tipoReporteImpresion === 'gerencias'
                        ? 'bg-theme-primary text-theme-primaryText shadow-sm'
                        : 'text-theme-muted'
                    }`}
                  >
                    Por Gerencias
                  </button>
                  <button
                    onClick={() => setTipoReporteImpresion('programas')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded ${
                      tipoReporteImpresion === 'programas'
                        ? 'bg-theme-primary text-theme-primaryText shadow-sm'
                        : 'text-theme-muted'
                    }`}
                  >
                    Por Programas
                  </button>
                </div>

                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-theme-primary text-theme-primaryText text-xs font-bold hover:bg-theme-primaryHover transition-all flex items-center gap-1.5 shadow cursor-pointer"
                >
                  <Printer size={15} />
                  Imprimir Reporte (PDF)
                </button>

                <button
                  onClick={() => setShowModalReporte(false)}
                  className="p-2 rounded-xl text-theme-muted hover:text-theme-main hover:bg-theme-border/40 transition-colors cursor-pointer"
                  title="Cerrar vista previa"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Hoja de Reporte Imprimible Oficial */}
            <div className="p-4 sm:p-8 overflow-y-auto print:overflow-visible bg-white text-black">
              <div id="reporte-dashboard-printable" className="w-full bg-white text-black max-w-4xl mx-auto space-y-6">
                {/* Cabecera Institucional */}
                <div className="border-b-2 border-black pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-600">
                        ESTADO PLURINACIONAL DE BOLIVIA
                      </p>
                      <h1 className="text-base sm:text-lg font-black uppercase tracking-wider text-black mt-0.5">
                        EMPRESA PÚBLICA DE TRANSPORTE AÉREO MILITAR - EPTAM
                      </h1>
                      <p className="text-[10px] font-semibold tracking-wide text-gray-500 uppercase">
                        SISTEMA INTEGRADO DE PROGRAMACIÓN OPERATIVA ANUAL (POA)
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block border-2 border-black px-2.5 py-1 text-xs font-black uppercase tracking-wider">
                        POA {activeGestion?.anio || '2026'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 text-center">
                    <h2 className="text-base sm:text-lg font-black uppercase tracking-wide text-black underline underline-offset-4">
                      REPORTE DE ESTADO Y EJECUCIÓN PRESUPUESTARIA
                    </h2>
                    <p className="text-xs font-bold text-gray-700 mt-1 uppercase">
                      {tipoReporteImpresion === 'gerencias'
                        ? 'CONSOLIDADO POR GERENCIAS Y UNIDADES ORGANIZACIONALES'
                        : 'CONSOLIDADO POR PROGRAMAS ESTRATÉGICOS'}
                    </p>
                  </div>
                </div>

                {/* Bloque de Metadatos y Filtros Aplicados */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] border border-gray-400 bg-gray-50 p-3 rounded">
                  <div>
                    <span className="font-bold text-gray-500 block uppercase text-[9px]">Gestión Fiscal:</span>
                    <span className="font-bold text-black">{activeGestion?.anio || '2026'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-500 block uppercase text-[9px]">Periodo Evaluado:</span>
                    <span className="font-bold text-black">
                      {nombreMesDesde === nombreMesHasta
                        ? `${nombreMesDesde} ${activeGestion?.anio || ''}`
                        : `${nombreMesDesde} - ${nombreMesHasta} ${activeGestion?.anio || ''}`}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-500 block uppercase text-[9px]">Área Filtrada:</span>
                    <span className="font-bold text-black truncate block">
                      {filtroAreaId === 'todas'
                        ? 'Todas las Áreas'
                        : presupuestosArea.find((a) => String(a.area) === filtroAreaId)?.area_nombre || 'Área'}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-500 block uppercase text-[9px]">Fecha de Emisión:</span>
                    <span className="font-medium text-black">
                      {new Date().toLocaleDateString('es-BO')}{' '}
                      {new Date().toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Cuadros Resumen Ejecutivo */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="border border-gray-400 p-2.5 rounded bg-white">
                    <p className="text-[9px] font-bold uppercase text-gray-600">Presupuesto Inicial</p>
                    <p className="text-sm font-black text-black mt-0.5">{formatMoney(totalInicial)}</p>
                  </div>
                  <div className="border border-gray-400 p-2.5 rounded bg-white">
                    <p className="text-[9px] font-bold uppercase text-gray-600">
                      Ejecutado ({nombreMesDesde.slice(0, 3)} - {nombreMesHasta.slice(0, 3)})
                    </p>
                    <p className="text-sm font-black text-red-700 mt-0.5">{formatMoney(totalEjecutadoPeriodo)}</p>
                  </div>
                  <div className="border border-gray-400 p-2.5 rounded bg-white">
                    <p className="text-[9px] font-bold uppercase text-gray-600">Saldo Disponible</p>
                    <p className="text-sm font-black text-emerald-700 mt-0.5">{formatMoney(totalDisponiblePeriodo)}</p>
                  </div>
                  <div className="border border-gray-400 p-2.5 rounded bg-white">
                    <p className="text-[9px] font-bold uppercase text-gray-600">% Avance / Ejecución</p>
                    <p className="text-sm font-black text-black mt-0.5">{pctEjecucionPeriodo}%</p>
                  </div>
                </div>

                {/* Tabla de Datos Principal */}
                <div>
                  <table className="w-full border-collapse border border-gray-400 text-[11px]">
                    <thead>
                      <tr className="bg-gray-200 border-b border-gray-400 font-black text-black uppercase tracking-wider text-[10px]">
                        <th className="border border-gray-400 py-2 px-2.5 text-center w-10">Nº</th>
                        <th className="border border-gray-400 py-2 px-2 text-center w-24">Código</th>
                        <th className="border border-gray-400 py-2 px-3 text-left">
                          {tipoReporteImpresion === 'gerencias'
                            ? 'Gerencia / Unidad Organizacional'
                            : 'Programa / Área'}
                        </th>
                        <th className="border border-gray-400 py-2 px-3 text-right w-28">Presupuesto Inicial (Bs.)</th>
                        <th className="border border-gray-400 py-2 px-3 text-right w-28">Ejecutado Periodo (Bs.)</th>
                        <th className="border border-gray-400 py-2 px-3 text-right w-28">Saldo Disponible (Bs.)</th>
                        <th className="border border-gray-400 py-2 px-2 text-center w-16">% Ejec.</th>
                      </tr>
                    </thead>

                    {tipoReporteImpresion === 'gerencias' ? (
                      <tbody>
                        {presupuestosCalculados.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="border border-gray-400 py-6 text-center text-gray-500 font-medium">
                              No existen datos presupuestarios para el criterio seleccionado.
                            </td>
                          </tr>
                        ) : (
                          presupuestosCalculados.map((p, idx) => (
                            <tr key={`print-area-${p.id}`} className={idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
                              <td className="border border-gray-400 py-1.5 px-2 text-center font-bold text-gray-600">
                                {idx + 1}
                              </td>
                              <td className="border border-gray-400 py-1.5 px-2 text-center font-mono font-bold text-black">
                                {p.area_codigo}
                              </td>
                              <td className="border border-gray-400 py-1.5 px-3 font-semibold text-black">
                                {p.area_nombre}
                              </td>
                              <td className="border border-gray-400 py-1.5 px-3 text-right font-medium text-black">
                                {formatMoney(p.monto_inicial)}
                              </td>
                              <td className="border border-gray-400 py-1.5 px-3 text-right font-medium text-red-700">
                                {formatMoney(p.monto_ejecutado_periodo)}
                              </td>
                              <td className="border border-gray-400 py-1.5 px-3 text-right font-bold text-emerald-800">
                                {formatMoney(p.monto_disponible_periodo)}
                              </td>
                              <td className="border border-gray-400 py-1.5 px-2 text-center font-bold text-black">
                                {p.porcentaje_ejecucion_periodo}%
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    ) : (
                      <tbody>
                        {programasResumen.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="border border-gray-400 py-6 text-center text-gray-500 font-medium">
                              No existen programas para el criterio seleccionado.
                            </td>
                          </tr>
                        ) : (
                          programasResumen.map((prog, pIdx) => (
                            <React.Fragment key={`print-prog-${prog.codigo}`}>
                              <tr className="bg-gray-300 font-bold border-t-2 border-black">
                                <td className="border border-gray-400 py-2 px-2 text-center text-black">
                                  {pIdx + 1}
                                </td>
                                <td className="border border-gray-400 py-2 px-2 text-center font-mono font-black text-black">
                                  {prog.codigo}
                                </td>
                                <td className="border border-gray-400 py-2 px-3 uppercase text-black font-black">
                                  {prog.nombre}
                                </td>
                                <td className="border border-gray-400 py-2 px-3 text-right font-black text-black">
                                  {formatMoney(prog.total_inicial)}
                                </td>
                                <td className="border border-gray-400 py-2 px-3 text-right font-black text-red-800">
                                  {formatMoney(prog.total_ejecutado)}
                                </td>
                                <td className="border border-gray-400 py-2 px-3 text-right font-black text-emerald-800">
                                  {formatMoney(prog.total_disponible)}
                                </td>
                                <td className="border border-gray-400 py-2 px-2 text-center font-black text-black">
                                  {prog.porcentaje_ejecucion}%
                                </td>
                              </tr>
                              {prog.areas.map((a, aIdx) => (
                                <tr key={`print-prog-area-${a.id}`} className={aIdx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
                                  <td className="border border-gray-400 py-1 px-2 text-center text-gray-500 text-[10px]">
                                    {pIdx + 1}.{aIdx + 1}
                                  </td>
                                  <td className="border border-gray-400 py-1 px-2 text-center font-mono text-gray-600 text-[10px]">
                                    {a.area_codigo}
                                  </td>
                                  <td className="border border-gray-400 py-1 px-3 text-gray-800 pl-6">
                                    {a.area_nombre}
                                  </td>
                                  <td className="border border-gray-400 py-1 px-3 text-right text-gray-700">
                                    {formatMoney(a.monto_inicial)}
                                  </td>
                                  <td className="border border-gray-400 py-1 px-3 text-right text-red-700">
                                    {formatMoney(a.monto_ejecutado_periodo)}
                                  </td>
                                  <td className="border border-gray-400 py-1 px-3 text-right text-emerald-800 font-semibold">
                                    {formatMoney(a.monto_disponible_periodo)}
                                  </td>
                                  <td className="border border-gray-400 py-1 px-2 text-center text-gray-700">
                                    {a.porcentaje_ejecucion_periodo}%
                                  </td>
                                </tr>
                              ))}
                            </React.Fragment>
                          ))
                        )}
                      </tbody>
                    )}

                    <tfoot>
                      <tr className="bg-gray-300 font-black border-t-2 border-black text-black">
                        <td colSpan={3} className="border border-gray-400 py-2.5 px-3 text-right uppercase tracking-wider">
                          TOTAL CONSOLIDADO GENERAL:
                        </td>
                        <td className="border border-gray-400 py-2.5 px-3 text-right font-black">
                          {formatMoney(totalInicial)}
                        </td>
                        <td className="border border-gray-400 py-2.5 px-3 text-right font-black text-red-800">
                          {formatMoney(totalEjecutadoPeriodo)}
                        </td>
                        <td className="border border-gray-400 py-2.5 px-3 text-right font-black text-emerald-800">
                          {formatMoney(totalDisponiblePeriodo)}
                        </td>
                        <td className="border border-gray-400 py-2.5 px-2 text-center font-black">
                          {pctEjecucionPeriodo}%
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Firmas Institucionales */}
                <div className="pt-8 pb-4 mt-8">
                  <div className="grid grid-cols-3 gap-6 text-center">
                    <div className="border-t border-black pt-2">
                      <p className="text-[10px] font-bold uppercase text-black">Elaborado por</p>
                      <p className="text-[9px] text-gray-600 mt-1">Responsable de Planificación y Presupuesto</p>
                      <p className="text-[8px] text-gray-500 mt-4">Firma y Sello</p>
                    </div>
                    <div className="border-t border-black pt-2">
                      <p className="text-[10px] font-bold uppercase text-black">Revisado por</p>
                      <p className="text-[9px] text-gray-600 mt-1">Jefe de Planificación Institucional</p>
                      <p className="text-[8px] text-gray-500 mt-4">Firma y Sello</p>
                    </div>
                    <div className="border-t border-black pt-2">
                      <p className="text-[10px] font-bold uppercase text-black">Aprobado por</p>
                      <p className="text-[9px] text-gray-600 mt-1">Gerente General / Máxima Autoridad EPTAM</p>
                      <p className="text-[8px] text-gray-500 mt-4">Firma y Sello</p>
                    </div>
                  </div>
                </div>

                {/* Nota de Pie de Página */}
                <div className="border-t border-gray-300 pt-2 text-[8px] text-gray-500 flex justify-between">
                  <span>Sistema POA - EPTAM • Documento Oficial de Seguimiento Financiero</span>
                  <span>Montos expresados en Bolivianos (Bs.)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE REPORTE E IMPRESIÓN OFICIAL POR PARTIDAS */}
      {showModalReportePartidas && seccionActivaData && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:overflow-visible">
          <div className="bg-theme-surface border border-theme-border rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden print:max-w-none print:max-h-none print:border-none print:shadow-none print:w-full">
            {/* Barra de Controles Superior */}
            <div className="p-4 border-b border-theme-border flex items-center justify-between bg-theme-base/60 print:hidden">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-theme-primary/10 text-theme-primary">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-theme-main">Vista Previa - Reporte Oficial de Partidas</h3>
                  <p className="text-[11px] text-theme-muted">
                    {detalleArea?.area_nombre} • {seccionActivaData.seccion_nombre} • Gestión {activeGestion?.anio || detalleArea?.gestion_anio}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-theme-primary text-theme-primaryText text-xs font-bold hover:bg-theme-primaryHover transition-all flex items-center gap-1.5 shadow cursor-pointer"
                >
                  <Printer size={15} />
                  Imprimir Reporte (PDF)
                </button>
                <button
                  onClick={() => setShowModalReportePartidas(false)}
                  className="p-2 rounded-xl text-theme-muted hover:text-theme-main hover:bg-theme-border/40 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Hoja Imprimible Oficial */}
            <div className="p-4 sm:p-8 overflow-y-auto print:overflow-visible bg-white text-black">
              <div id="reporte-partidas-printable" className="w-full bg-white text-black max-w-4xl mx-auto space-y-6">
                {/* Cabecera Institucional */}
                <div className="border-b-2 border-black pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-600">
                        ESTADO PLURINACIONAL DE BOLIVIA
                      </p>
                      <h1 className="text-base sm:text-lg font-black uppercase tracking-wider text-black mt-0.5">
                        EMPRESA PÚBLICA DE TRANSPORTE AÉREO MILITAR - EPTAM
                      </h1>
                      <p className="text-[10px] font-semibold tracking-wide text-gray-500 uppercase">
                        SISTEMA INTEGRADO DE PROGRAMACIÓN OPERATIVA ANUAL (POA)
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block border-2 border-black px-2.5 py-1 text-xs font-black uppercase tracking-wider">
                        POA {activeGestion?.anio || detalleArea?.gestion_anio || '2026'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 text-center">
                    <h2 className="text-base sm:text-lg font-black uppercase tracking-wide text-black underline underline-offset-4">
                      REPORTE CONSOLIDADO POR PARTIDAS PRESUPUESTARIAS
                    </h2>
                    <p className="text-xs font-bold text-gray-700 mt-1 uppercase">
                      {detalleArea?.area_nombre} — {seccionActivaData.seccion_nombre}
                    </p>
                  </div>
                </div>

                {/* Metadatos */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] border border-gray-400 bg-gray-50 p-3 rounded">
                  <div>
                    <span className="font-bold text-gray-500 block uppercase text-[9px]">Gestión Fiscal:</span>
                    <span className="font-bold text-black">{activeGestion?.anio || detalleArea?.gestion_anio}</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-500 block uppercase text-[9px]">Periodo Evaluado:</span>
                    <span className="font-bold text-black">
                      {mesDesde === mesHasta ? nombreMesDesde : `${nombreMesDesde} - ${nombreMesHasta}`}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-500 block uppercase text-[9px]">Gerencia / Unidad:</span>
                    <span className="font-bold text-black truncate block">
                      {detalleArea?.area_nombre} ({detalleArea?.area_codigo})
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-500 block uppercase text-[9px]">Sección Operativa:</span>
                    <span className="font-bold text-black truncate block">
                      {seccionActivaData.seccion_nombre}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-500 block uppercase text-[9px]">Fecha de Emisión:</span>
                    <span className="font-medium text-black">
                      {new Date().toLocaleDateString('es-BO')}{' '}
                      {new Date().toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Resumen Ejecutivo */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                  <div className="border border-gray-400 p-2 rounded bg-white">
                    <p className="text-[8px] font-bold uppercase text-gray-600">Presupuestado</p>
                    <p className="text-xs font-black text-black mt-0.5">{formatMoney(totalPartidasPresupuestado)}</p>
                  </div>
                  <div className="border border-gray-400 p-2 rounded bg-white">
                    <p className="text-[8px] font-bold uppercase text-gray-600">Agregado (+)</p>
                    <p className="text-xs font-black text-emerald-800 mt-0.5">+{formatMoney(totalPartidasAgregado)}</p>
                  </div>
                  <div className="border border-gray-400 p-2 rounded bg-white">
                    <p className="text-[8px] font-bold uppercase text-gray-600">Quitado (-)</p>
                    <p className="text-xs font-black text-red-800 mt-0.5">-{formatMoney(totalPartidasQuitado)}</p>
                  </div>
                  <div className="border border-gray-400 p-2 rounded bg-white">
                    <p className="text-[8px] font-bold uppercase text-gray-600">
                      Ejecutado {hayFiltroMeses ? `(${nombreMesDesde.slice(0, 3)} - ${nombreMesHasta.slice(0, 3)})` : ''}
                    </p>
                    <p className="text-xs font-black text-red-700 mt-0.5">{formatMoney(totalPartidasEjecutado)}</p>
                  </div>
                  <div className="border border-gray-400 p-2 rounded bg-white">
                    <p className="text-[8px] font-bold uppercase text-gray-600">Disponible</p>
                    <p className="text-xs font-black text-emerald-700 mt-0.5">{formatMoney(totalPartidasDisponible)}</p>
                  </div>
                  <div className="border border-gray-400 p-2 rounded bg-white">
                    <p className="text-[8px] font-bold uppercase text-gray-600">% Avance</p>
                    <p className="text-xs font-black text-black mt-0.5">{pctPartidasGlobal}%</p>
                  </div>
                </div>

                {/* Tabla de Partidas */}
                <div>
                  <table className="w-full border-collapse border border-gray-400 text-[10px]">
                    <thead>
                      <tr className="bg-gray-200 border-b border-gray-400 font-black text-black uppercase tracking-wider text-[9px]">
                        <th className="border border-gray-400 py-1.5 px-2 text-center w-8">Nº</th>
                        <th className="border border-gray-400 py-1.5 px-2 text-center w-20">Nº Partida</th>
                        <th className="border border-gray-400 py-1.5 px-3 text-left">Nombre de Partida</th>
                        <th className="border border-gray-400 py-1.5 px-2.5 text-right w-24">Total Presupuestado</th>
                        <th className="border border-gray-400 py-1.5 px-2.5 text-right w-20">Agregado (+)</th>
                        <th className="border border-gray-400 py-1.5 px-2.5 text-right w-20">Quitado (-)</th>
                        <th className="border border-gray-400 py-1.5 px-2.5 text-right w-24">
                          Ejecutado {hayFiltroMeses ? `(${nombreMesDesde.slice(0, 3)} - ${nombreMesHasta.slice(0, 3)})` : ''}
                        </th>
                        <th className="border border-gray-400 py-1.5 px-2.5 text-right w-24">Disponible</th>
                        <th className="border border-gray-400 py-1.5 px-2 text-center w-14">% Ejec.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partidasConsolidadas.map((p, idx) => (
                        <tr key={`print-p-${p.partida_codigo}`} className={idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="border border-gray-400 py-1.5 px-2 text-center font-bold text-gray-600">
                            {idx + 1}
                          </td>
                          <td className="border border-gray-400 py-1.5 px-2 text-center font-mono font-bold text-black">
                            {p.partida_codigo}
                          </td>
                          <td className="border border-gray-400 py-1.5 px-3 font-semibold text-black">
                            {p.partida_nombre}
                          </td>
                          <td className="border border-gray-400 py-1.5 px-2.5 text-right font-medium text-black">
                            {formatMoney(p.total_presupuestado)}
                          </td>
                          <td className="border border-gray-400 py-1.5 px-2.5 text-right font-medium text-emerald-800">
                            {p.total_agregado > 0 ? `+${formatMoney(p.total_agregado)}` : '0,00 Bs'}
                          </td>
                          <td className="border border-gray-400 py-1.5 px-2.5 text-right font-medium text-red-800">
                            {p.total_quitado > 0 ? `-${formatMoney(p.total_quitado)}` : '0,00 Bs'}
                          </td>
                          <td className="border border-gray-400 py-1.5 px-2.5 text-right font-medium text-red-700">
                            {formatMoney(p.total_ejecutado)}
                          </td>
                          <td className="border border-gray-400 py-1.5 px-2.5 text-right font-bold text-emerald-800">
                            {formatMoney(p.total_disponible)}
                          </td>
                          <td className="border border-gray-400 py-1.5 px-2 text-center font-bold text-black">
                            {p.porcentaje_ejecucion}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-300 border-t-2 border-black font-black text-black">
                        <td colSpan={3} className="border border-gray-400 py-2 px-3 text-right uppercase tracking-wider">
                          TOTAL GENERAL CONSOLIDADO:
                        </td>
                        <td className="border border-gray-400 py-2 px-2.5 text-right font-black">
                          {formatMoney(totalPartidasPresupuestado)}
                        </td>
                        <td className="border border-gray-400 py-2 px-2.5 text-right font-black text-emerald-800">
                          +{formatMoney(totalPartidasAgregado)}
                        </td>
                        <td className="border border-gray-400 py-2 px-2.5 text-right font-black text-red-800">
                          -{formatMoney(totalPartidasQuitado)}
                        </td>
                        <td className="border border-gray-400 py-2 px-2.5 text-right font-black text-red-800">
                          {formatMoney(totalPartidasEjecutado)}
                        </td>
                        <td className="border border-gray-400 py-2 px-2.5 text-right font-black text-emerald-800">
                          {formatMoney(totalPartidasDisponible)}
                        </td>
                        <td className="border border-gray-400 py-2 px-2 text-center font-black">
                          {pctPartidasGlobal}%
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Firmas */}
                <div className="pt-8 pb-4 mt-8">
                  <div className="grid grid-cols-3 gap-6 text-center">
                    <div className="border-t border-black pt-2">
                      <p className="text-[10px] font-bold uppercase text-black">Elaborado por</p>
                      <p className="text-[9px] text-gray-600 mt-1">Responsable de Planificación y Presupuesto</p>
                      <p className="text-[8px] text-gray-500 mt-4">Firma y Sello</p>
                    </div>
                    <div className="border-t border-black pt-2">
                      <p className="text-[10px] font-bold uppercase text-black">Revisado por</p>
                      <p className="text-[9px] text-gray-600 mt-1">Jefe de Planificación Institucional</p>
                      <p className="text-[8px] text-gray-500 mt-4">Firma y Sello</p>
                    </div>
                    <div className="border-t border-black pt-2">
                      <p className="text-[10px] font-bold uppercase text-black">Aprobado por</p>
                      <p className="text-[9px] text-gray-600 mt-1">Gerente de Área / Dirección EPTAM</p>
                      <p className="text-[8px] text-gray-500 mt-4">Firma y Sello</p>
                    </div>
                  </div>
                </div>

                {/* Nota al pie */}
                <div className="border-t border-gray-300 pt-2 text-[8px] text-gray-500 flex justify-between">
                  <span>Sistema POA - EPTAM • Documento Oficial de Control por Partidas Presupuestarias</span>
                  <span>Montos expresados en Bolivianos (Bs.)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
