import React, { useState, useEffect, useMemo } from 'react';
import {
  WalletCards,
  Plus,
  Lock,
  Unlock,
  Play,
  RefreshCw,
  DollarSign,
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
  ArrowRight,
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
  SeccionDetalleArea,
  MemoriaDetalleArea,
  PartidaDetalleArea,
  ItemDetalleArea,
  TraspasoDetalleArea,
  Area,
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
} from '../../services/presupuestoService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const MESES = [
  { value: 1, label: "Enero" },
  { value: 2, label: "Febrero" },
  { value: 3, label: "Marzo" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Mayo" },
  { value: 6, label: "Junio" },
  { value: 7, label: "Julio" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Septiembre" },
  { value: 10, label: "Octubre" },
  { value: 11, label: "Noviembre" },
  { value: 12, label: "Diciembre" },
];

export default function PresupuestosPage() {
  const navigate = useNavigate();

  const [gestiones, setGestiones] = useState<Gestion[]>([]);
  const [selectedGestionId, setSelectedGestionId] = useState<number | null>(null);
  const [resumen, setResumen] = useState<ResumenGestion | null>(null);
  const [presupuestosArea, setPresupuestosArea] = useState<PresupuestoArea[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { user } = useAuth();
  const rolName = user?.rol_nombre?.toUpperCase() || '';
  const isAprobador = user?.is_superuser || rolName === 'APROBADOR' || rolName === 'ADMINISTRADOR';

  // UI Navigation states
  const [viewMode, setViewMode] = useState<'general' | 'area' | 'seccion' | 'reporte'>('general');
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);
  const [selectedSeccionId, setSelectedSeccionId] = useState<number | null>(null);
  const [tabSeccion, setTabSeccion] = useState<'presupuesto' | 'gastos' | 'partidas'>('presupuesto');

  const [detalleArea, setDetalleArea] = useState<DetalleArea | null>(null);
  const [detalleLoading, setDetalleLoading] = useState(false);

  // UI state for creating gestion
  const [showModalGestion, setShowModalGestion] = useState(false);
  const [nuevoAnio, setNuevoAnio] = useState(new Date().getFullYear() + 1);

  // Expansiones y filtros en vista sección
  const [expandedMemorias, setExpandedMemorias] = useState<Set<number>>(new Set());
  const [expandedPartidas, setExpandedPartidas] = useState<Set<string>>(new Set());
  const [expandedPartidasConsolidadas, setExpandedPartidasConsolidadas] = useState<Set<string>>(new Set());
  const [busquedaPartida, setBusquedaPartida] = useState<string>('');
  const [showModalReportePartidas, setShowModalReportePartidas] = useState<boolean>(false);

  // Filtro por meses de evaluación (mes a mes)
  const [mesDesde, setMesDesde] = useState<number>(1);
  const [mesHasta, setMesHasta] = useState<number>(12);

  useEffect(() => { cargarBase(); }, []);
  useEffect(() => { if (selectedGestionId) cargarDatos(selectedGestionId); }, [selectedGestionId]);
  useEffect(() => {
    if (selectedGestionId && selectedAreaId) {
      cargarDetalleArea(selectedGestionId, selectedAreaId);
    } else {
      setDetalleArea(null);
    }
  }, [selectedGestionId, selectedAreaId]);

  async function cargarBase() {
    setLoading(true);
    try {
      const [gList, aList] = await Promise.all([getGestiones(), getAreas()]);
      setGestiones(gList);
      setAreas(aList);
      if (gList.length > 0) {
        const pref = gList.find(g => g.estado === 'EN_EJECUCION') || gList.find(g => g.estado === 'FORMULACION') || gList[0];
        setSelectedGestionId(pref.id);
      }
    } catch { mostrarMensaje('error', 'Error cargando gestiones.'); }
    finally { setLoading(false); }
  }

  async function cargarDatos(gId: number) {
    try {
      const [res, techos] = await Promise.all([
        getResumenGestion({ gestion: gId }).catch(() => null),
        getPresupuestosArea({ gestion: gId }),
      ]);
      setResumen(res);
      setPresupuestosArea(Array.isArray(techos) ? techos : []);
    } catch { /* silencio */ }
  }

  async function cargarDetalleArea(gId: number, aId: number) {
    setDetalleLoading(true);
    setExpandedMemorias(new Set());
    setExpandedPartidas(new Set());
    try {
      const data = await getDetalleArea({ gestion: gId, area: aId });
      setDetalleArea(data);
    } catch { setDetalleArea(null); }
    finally { setDetalleLoading(false); }
  }

  function mostrarMensaje(type: 'success' | 'error', text: string) {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4500);
  }

  const activeGestion = useMemo(() =>
    (Array.isArray(gestiones) ? gestiones : []).find(g => g.id === selectedGestionId) || null,
    [gestiones, selectedGestionId]
  );

  const formatMoney = (val: string | number) => {
    const n = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB', minimumFractionDigits: 2 }).format(n || 0);
  };

  const getBadgeEstado = (estado: string) => {
    const map: Record<string, string> = {
      'BORRADOR': 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
      'PENDIENTE_GERENCIA': 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
      'APROBADO_GERENCIA': 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
      'APROBADO_FINANZAS': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
      'RECHAZADO': 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
    };
    const labels: Record<string, string> = {
      'BORRADOR': 'Borrador',
      'PENDIENTE_GERENCIA': 'Pendiente Gerencia',
      'APROBADO_GERENCIA': 'Aprobado Gerencia',
      'APROBADO_FINANZAS': 'Aprobado Finanzas',
      'RECHAZADO': 'Rechazado',
    };
    return (
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${map[estado] || 'bg-gray-100 text-gray-600'}`}>
        {labels[estado] || estado}
      </span>
    );
  };

  // Navegación
  function irAGeneral() {
    setViewMode('general');
    setSelectedAreaId(null);
    setSelectedSeccionId(null);
  }

  function irAArea(areaId: number) {
    setSelectedAreaId(areaId);
    setSelectedSeccionId(null);
    setViewMode('area');
  }

  function irASeccion(seccionId: number) {
    setSelectedSeccionId(seccionId);
    setViewMode('seccion');
  }

  function irAReporte() {
    setViewMode('reporte');
  }

  const toggleMemoria = (id: number) => {
    setExpandedMemorias(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const togglePartida = (key: string) => {
    setExpandedPartidas(prev => {
      const s = new Set(prev);
      s.has(key) ? s.delete(key) : s.add(key);
      return s;
    });
  };

  // Acciones de la gestión
  async function handleCerrarFormulacion() {
    if (!selectedGestionId || !confirm('¿Desea cerrar la formulación? Se consolidarán automáticamente los techos presupuestarios.')) return;
    setActionLoading(true);
    try {
      const r = await cerrarFormulacionGestion(selectedGestionId);
      mostrarMensaje('success', r.message);
      await cargarBase();
    } catch (e: any) { mostrarMensaje('error', e.response?.data?.error || 'Error al cerrar formulación.'); }
    finally { setActionLoading(false); }
  }

  async function handlePasarEjecucion() {
    if (!selectedGestionId || !confirm('¿Pasar la gestión a estado EN EJECUCIÓN?')) return;
    setActionLoading(true);
    try {
      const r = await pasarAEjecucionGestion(selectedGestionId);
      mostrarMensaje('success', r.message);
      await cargarBase();
    } catch (e: any) { mostrarMensaje('error', e.response?.data?.error || 'Error.'); }
    finally { setActionLoading(false); }
  }

  async function handleReabrir() {
    if (!selectedGestionId || !confirm('¿Reabrir la formulación de esta gestión?')) return;
    setActionLoading(true);
    try {
      const r = await reabrirFormulacionGestion(selectedGestionId);
      mostrarMensaje('success', r.message);
      await cargarBase();
    } catch (e: any) { mostrarMensaje('error', e.response?.data?.error || 'Error.'); }
    finally { setActionLoading(false); }
  }

  async function handleConsolidar() {
    if (!selectedGestionId) return;
    setActionLoading(true);
    try {
      const r = await consolidarPresupuestosGestion(selectedGestionId);
      mostrarMensaje('success', r.message);
      if (selectedGestionId) await cargarDatos(selectedGestionId);
    } catch (e: any) { mostrarMensaje('error', e.response?.data?.error || 'Error.'); }
    finally { setActionLoading(false); }
  }

  async function handleCrearGestion(e: React.FormEvent) {
    e.preventDefault();
    setActionLoading(true);
    try {
      await createGestion({ anio: nuevoAnio });
      mostrarMensaje('success', `Gestión ${nuevoAnio} creada.`);
      setShowModalGestion(false);
      await cargarBase();
    } catch (e: any) { mostrarMensaje('error', e.response?.data?.anio?.[0] || 'Error al crear gestión.'); }
    finally { setActionLoading(false); }
  }

  // Cálculos globales
  const totalInicial = useMemo(() =>
    presupuestosArea.reduce((a, p) => a + parseFloat(p.monto_inicial || '0'), 0), [presupuestosArea]);
  const totalEjecutado = useMemo(() =>
    presupuestosArea.reduce((a, p) => a + parseFloat(p.monto_ejecutado || '0'), 0), [presupuestosArea]);
  const totalDisponible = useMemo(() =>
    presupuestosArea.reduce((a, p) => a + parseFloat(p.monto_actual || '0'), 0), [presupuestosArea]);
  const pctGlobal = useMemo(() =>
    totalInicial > 0 ? Math.min(100, Math.round(totalEjecutado / totalInicial * 10000) / 100) : 0,
    [totalInicial, totalEjecutado]);

  // Sección activa en vista sección o reporte
  const seccionActivaData = useMemo(() => {
    if ((viewMode !== 'seccion' && viewMode !== 'reporte') || !detalleArea || !selectedSeccionId) return null;
    return detalleArea.secciones.find(s => s.seccion_id === selectedSeccionId) || null;
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

    seccionActivaData.memorias.forEach(mem => {
      mem.partidas.forEach(part => {
        part.gastos_detalle.forEach(g => {
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
            partida_nombre: part.partida_nombre
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

        // Filtrar gastos de la partida por el rango [mesDesde, mesHasta]
        const gastosPeriodo = (partida.gastos_detalle || []).filter(g => {
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

    // Ordenar ascendentemente por número / código de partida
    return list.sort((a, b) => {
      const numA = parseInt(a.partida_codigo.replace(/\D/g, ''), 10);
      const numB = parseInt(b.partida_codigo.replace(/\D/g, ''), 10);
      if (!isNaN(numA) && !isNaN(numB) && numA !== numB) {
        return numA - numB;
      }
      return a.partida_codigo.localeCompare(b.partida_codigo);
    });
  }, [seccionActivaData, mesDesde, mesHasta]);

  // Partidas filtradas por búsqueda
  const partidasFiltradas = useMemo(() => {
    if (!busquedaPartida.trim()) return partidasConsolidadas;
    const q = busquedaPartida.trim().toLowerCase();
    return partidasConsolidadas.filter(
      (p) =>
        p.partida_codigo.toLowerCase().includes(q) ||
        p.partida_nombre.toLowerCase().includes(q)
    );
  }, [partidasConsolidadas, busquedaPartida]);

  // Totales de la pestaña de Partidas
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

  const togglePartidaConsolidada = (codigo: string) => {
    setExpandedPartidasConsolidadas((prev) => {
      const s = new Set(prev);
      s.has(codigo) ? s.delete(codigo) : s.add(codigo);
      return s;
    });
  };

  const nombreMesDesde = MESES.find((m) => m.value === mesDesde)?.label || "Enero";
  const nombreMesHasta = MESES.find((m) => m.value === mesHasta)?.label || "Diciembre";
  const hayFiltroMeses = mesDesde !== 1 || mesHasta !== 12;
  const resetearFiltroMeses = () => {
    setMesDesde(1);
    setMesHasta(12);
  };

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
        <div className={`p-4 rounded-xl flex items-center justify-between shadow-md ${
          feedbackMsg.type === 'success'
            ? 'bg-emerald-50 text-emerald-900 border border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-100 dark:border-emerald-800'
            : 'bg-rose-50 text-rose-900 border border-rose-200 dark:bg-rose-950/80 dark:text-rose-100 dark:border-rose-800'
        }`}>
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span className="text-sm font-medium">{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-xs opacity-75 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Header con controles de Gestión */}
      <div className="card p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-theme-primary/15">
              <WalletCards size={26} className="text-theme-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-theme-main tracking-tight">Presupuestos & POA</h1>
              <p className="text-xs text-theme-muted mt-0.5">Control financiero institucional — Formulación, Aprobación y Ejecución Presupuestaria</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Selector de Gestión */}
            <div className="flex items-center gap-2 px-3 py-2 bg-theme-base rounded-xl border border-theme-border">
              <Calendar size={16} className="text-theme-muted" />
              <span className="text-xs font-semibold text-theme-muted">Gestión:</span>
              <select
                value={selectedGestionId || ''}
                onChange={e => {
                  setSelectedGestionId(Number(e.target.value));
                  irAGeneral();
                }}
                className="bg-transparent font-bold text-sm text-theme-main focus:outline-none"
              >
                {gestiones.map(g => (
                  <option key={g.id} value={g.id}>Gestión {g.anio} — {g.estado_display}</option>
                ))}
              </select>
            </div>

            {/* Acciones de flujo de gestión */}
            {isAprobador && activeGestion?.estado === 'FORMULACION' && (
              <>
                <button onClick={handleConsolidar} disabled={actionLoading}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-theme-border text-xs font-semibold text-theme-muted hover:text-theme-main transition-colors">
                  <RefreshCw size={14} /> Consolidar
                </button>
                <button onClick={handleCerrarFormulacion} disabled={actionLoading}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-colors">
                  <Lock size={14} /> Cerrar Formulación
                </button>
              </>
            )}
            {isAprobador && activeGestion?.estado === 'CERRADO_FORMULACION' && (
              <>
                <button onClick={handleReabrir} disabled={actionLoading}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-theme-border text-xs font-semibold text-theme-muted hover:text-theme-main transition-colors">
                  <Unlock size={14} /> Reabrir
                </button>
                <button onClick={handlePasarEjecucion} disabled={actionLoading}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-theme-primary hover:bg-theme-primary/80 text-white text-xs font-semibold transition-colors">
                  <Play size={14} /> Pasar a Ejecución
                </button>
              </>
            )}

            {isAprobador && (
              <button onClick={() => setShowModalGestion(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-theme-primary/10 text-theme-primary hover:bg-theme-primary/20 text-xs font-semibold transition-colors">
                <Plus size={14} /> Nueva Gestión
              </button>
            )}
          </div>
        </div>

        {/* Banner Informativo */}
        {activeGestion && (
          <div className="mt-4 flex flex-wrap gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold ${
              activeGestion.estado === 'FORMULACION' ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800' :
              activeGestion.estado === 'CERRADO_FORMULACION' ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800' :
              activeGestion.estado === 'EN_EJECUCION' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' :
              'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}>
              {activeGestion.estado === 'FORMULACION' && <><BookOpenText size={13} /> Formulación abierta — Las áreas pueden formular memorias de cálculo</>}
              {activeGestion.estado === 'CERRADO_FORMULACION' && <><Lock size={13} /> Formulación cerrada — Presupuestos consolidados y bloqueados</>}
              {activeGestion.estado === 'EN_EJECUCION' && <><Play size={13} /> En Ejecución — Registro activo de gastos operativos</>}
              {activeGestion.estado === 'FINALIZADO' && <><CheckCircle2 size={13} /> Gestión Finalizada</>}
            </div>
          </div>
        )}
      </div>

      {/* Breadcrumbs de Navegación */}
      <div className="flex items-center gap-2 px-1 text-xs font-medium text-theme-muted bg-theme-base p-2.5 rounded-xl border border-theme-border/60 font-semibold">
        <button onClick={irAGeneral} className="hover:text-theme-primary transition-colors flex items-center gap-1">
          <WalletCards size={13} /> Presupuestos
        </button>
        {selectedAreaId && (
          <>
            <ChevronRight size={12} />
            <button
              onClick={() => irAArea(selectedAreaId)}
              className={`hover:text-theme-primary transition-colors ${viewMode === 'area' ? 'text-theme-main font-bold' : ''}`}
            >
              {detalleArea?.area_nombre || `Área ${selectedAreaId}`}
            </button>
          </>
        )}
        {selectedSeccionId && seccionActivaData && (
          <>
            <ChevronRight size={12} />
            <span className="text-theme-main font-bold">
              {seccionActivaData.seccion_nombre}
            </span>
          </>
        )}
      </div>

      {/* VISTA GENERAL: Cards de Áreas */}
      {viewMode === 'general' && (
        <div className="space-y-6">
          {/* KPI Cards Globales */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-theme-muted block">Presupuesto Inicial</span>
              <p className="text-2xl font-bold text-theme-main mt-1.5">{formatMoney(totalInicial)}</p>
            </div>
            <div className="card p-5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-theme-muted block">Total Ejecutado</span>
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1.5">{formatMoney(totalEjecutado)}</p>
            </div>
            <div className="card p-5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-theme-muted block">Saldo Disponible</span>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1.5">{formatMoney(totalDisponible)}</p>
            </div>
            <div className="card p-5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-theme-muted block">% Ejecutado</span>
              <p className="text-2xl font-bold text-theme-main mt-1.5">{pctGlobal}%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {presupuestosArea.map(p => {
              const pct = p.porcentaje_ejecucion || 0;
              return (
                <div key={p.id} className="card p-5 flex flex-col justify-between hover:border-theme-primary/40 hover:shadow-md transition-all">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-theme-border/85 text-theme-muted font-mono">
                        {p.area_codigo}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        p.area_tipo === 'GERENCIA' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300' : 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300'
                      }`}>{p.area_tipo}</span>
                    </div>
                    <h3 className="text-base font-bold text-theme-main leading-tight line-clamp-2 min-h-[2.5rem]">
                      {p.area_nombre}
                    </h3>
                  </div>

                  <div className="space-y-2 mt-4">
                    <div className="flex justify-between text-xs">
                      <span className="text-theme-muted">Presupuesto Inicial:</span>
                      <span className="font-bold text-theme-main">{formatMoney(p.monto_inicial)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-theme-muted">Gasto Ejecutado:</span>
                      <span className="font-bold text-rose-600 dark:text-rose-400">{formatMoney(p.monto_ejecutado)}</span>
                    </div>
                    <div className="flex justify-between text-xs border-t border-theme-border/60 pt-1.5">
                      <span className="text-theme-muted font-medium">Disponible:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatMoney(p.monto_actual)}</span>
                    </div>

                    <div className="w-full bg-theme-border/60 rounded-full h-2 mt-3 overflow-hidden">
                      <div className={`h-full transition-all ${pct > 80 ? 'bg-rose-500' : pct > 50 ? 'bg-amber-500' : 'bg-theme-primary'}`}
                        style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-theme-muted mt-1">
                      <span>Progreso de Ejecución</span>
                      <span className="font-bold text-theme-main">{pct}%</span>
                    </div>
                  </div>

                  <button
                    onClick={() => irAArea(p.area)}
                    className="btn-primary mt-5 text-xs py-2 w-full flex items-center justify-center gap-1.5 bg-theme-primary/10 text-theme-primary hover:bg-theme-primary hover:text-white"
                  >
                    Ingresar al Área <ArrowRight size={14} />
                  </button>
                </div>
              );
            })}

            {/* Áreas sin presupuesto inicial asignado */}
            {areas.filter(a => !presupuestosArea.find(p => p.area === a.id)).map(a => (
              <div key={a.id} className="card p-5 opacity-60 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-theme-border/80 text-theme-muted">{a.codigo}</span>
                  <h3 className="text-base font-bold text-theme-main mt-2 leading-tight">{a.nombre}</h3>
                </div>
                <div className="mt-6">
                  <p className="text-xs text-theme-muted">Sin presupuesto formulado en la Gestión {activeGestion?.anio}.</p>
                  <button
                    onClick={() => irAArea(a.id)}
                    className="w-full border border-theme-border/80 hover:bg-theme-base/60 text-xs text-theme-muted font-bold py-2 mt-4 rounded-xl flex items-center justify-center gap-1"
                  >
                    Ver detalles de sección
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VISTA DETALLE DE ÁREA: Secciones */}
      {viewMode === 'area' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button onClick={irAGeneral} className="flex items-center gap-1.5 text-xs font-bold text-theme-primary hover:underline">
              <ChevronLeft size={16} /> Volver a General
            </button>
          </div>

          {detalleLoading ? (
            <div className="card p-12 text-center">
              <RefreshCw size={24} className="animate-spin mx-auto text-theme-muted mb-3" />
              <p className="text-sm text-theme-muted">Cargando secciones...</p>
            </div>
          ) : !detalleArea ? (
            <div className="card p-12 text-center">
              <FileText size={36} className="mx-auto mb-3 opacity-30 text-theme-muted" />
              <p className="text-sm font-semibold text-theme-muted">Área sin presupuesto configurado</p>
              <p className="text-xs text-theme-muted mt-1">No hay presupuestos ni memorias para este periodo.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Resumen del Área */}
              <div className="card p-5 bg-gradient-to-r from-theme-surface to-theme-base/30">
                <h2 className="text-xl font-bold text-theme-main">{detalleArea.area_nombre}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                  <div>
                    <span className="text-[10px] text-theme-muted uppercase font-semibold">Techo Inicial</span>
                    <p className="text-lg font-bold text-theme-main mt-0.5">{formatMoney(detalleArea.monto_inicial)}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-theme-muted uppercase font-semibold">Monto Ejecutado</span>
                    <p className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-0.5">{formatMoney(detalleArea.monto_ejecutado)}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-theme-muted uppercase font-semibold">Disponible</span>
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{formatMoney(detalleArea.monto_actual)}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-theme-muted uppercase font-semibold">Porcentaje de Avance</span>
                    <p className="text-lg font-bold text-theme-main mt-0.5">{detalleArea.porcentaje_ejecucion}%</p>
                  </div>
                </div>
              </div>

              {/* Grid de Secciones */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {detalleArea.secciones.map(sec => {
                  const pres = parseFloat(sec.total_presupuestado);
                  const gast = parseFloat(sec.total_gastado);
                  const disp = parseFloat(sec.total_disponible);
                  const pct = pres > 0 ? Math.min(100, Math.round(gast / pres * 10000) / 100) : 0;

                  return (
                    <div key={sec.seccion_id} className="card p-5 flex flex-col justify-between hover:border-theme-primary/40 hover:shadow-md transition-all">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="p-1 rounded bg-theme-primary/10 text-theme-primary"><Layers size={14} /></span>
                          <span className="text-[10px] font-bold text-theme-muted uppercase">Sección Operativa</span>
                        </div>
                        <h3 className="text-base font-bold text-theme-main min-h-[2.5rem] line-clamp-2 leading-snug">
                          {sec.seccion_nombre}
                        </h3>
                        <p className="text-xs text-theme-muted mt-1">{sec.memorias.length} memoria(s) de cálculo formuladas.</p>
                      </div>

                      <div className="space-y-2 mt-5 border-t border-theme-border/60 pt-4">
                        <div className="flex justify-between text-xs">
                          <span className="text-theme-muted">Presupuesto Formulado:</span>
                          <span className="font-semibold text-theme-main">{formatMoney(pres)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-theme-muted">Gasto Real:</span>
                          <span className="font-semibold text-rose-600 dark:text-rose-400">{formatMoney(gast)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-theme-muted font-medium">Disponible:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatMoney(disp)}</span>
                        </div>

                        <div className="w-full bg-theme-border/60 rounded-full h-1.5 mt-3 overflow-hidden">
                          <div className={`h-full ${pct > 80 ? 'bg-rose-500' : pct > 50 ? 'bg-amber-500' : 'bg-theme-primary'}`}
                            style={{ width: `${pct}%` }} />
                        </div>
                      </div>

                      <button
                        onClick={() => irASeccion(sec.seccion_id)}
                        className="btn-primary mt-5 text-xs py-2 w-full flex items-center justify-center gap-1.5 bg-theme-primary/10 text-theme-primary hover:bg-theme-primary hover:text-white"
                      >
                        Explorar Presupuestos <ArrowRight size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VISTA DETALLE DE SECCIÓN: Memorias, Partidas y Gastos detallados con fecha */}
      {viewMode === 'seccion' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button onClick={() => irAArea(selectedAreaId!)} className="flex items-center gap-1.5 text-xs font-bold text-theme-primary hover:underline">
              <ChevronLeft size={16} /> Volver al Área
            </button>
          </div>

          {seccionActivaData ? (
            <div className="space-y-6">
              {/* Banner de Sección */}
              <div className="card p-5 bg-gradient-to-r from-theme-surface to-theme-base/30">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-theme-border text-theme-muted font-mono uppercase">
                      {detalleArea?.area_codigo} — Sección
                    </span>
                    <h2 className="text-lg font-bold text-theme-main mt-1">{seccionActivaData.seccion_nombre}</h2>
                    <p className="text-xs text-theme-muted mt-0.5">Área: {detalleArea?.area_nombre}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={irAReporte}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all bg-theme-base border-theme-border text-theme-main hover:border-theme-primary hover:text-theme-primary"
                    >
                      <Printer size={14} />
                      Generar Reporte
                    </button>
                    <div className="text-right">
                      <span className="text-[10px] text-theme-muted font-semibold uppercase block">Memorias</span>
                      <span className="text-xl font-bold text-theme-main">{seccionActivaData.memorias.length}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-5">
                  <div className="p-3 rounded-xl bg-theme-base border border-theme-border text-center">
                    <p className="text-[10px] font-semibold text-theme-muted uppercase">Presupuestado</p>
                    <p className="text-base font-bold text-theme-main mt-0.5">{formatMoney(seccionActivaData.total_presupuestado)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-200/80 dark:bg-rose-950/30 dark:border-rose-800/60 text-center">
                    <p className="text-[10px] font-semibold text-rose-700 dark:text-rose-400 uppercase">Ejecutado</p>
                    <p className="text-base font-bold text-rose-600 dark:text-rose-400 mt-0.5">{formatMoney(seccionActivaData.total_gastado)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/80 dark:bg-emerald-950/30 dark:border-emerald-800/60 text-center">
                    <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase">Disponible</p>
                    <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{formatMoney(seccionActivaData.total_disponible)}</p>
                  </div>
                </div>
              </div>

              {/* Sub-Tabs de Sección */}
              <div className="flex border-b border-theme-border gap-2">
                <button
                  onClick={() => setTabSeccion('presupuesto')}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                    tabSeccion === 'presupuesto' ? 'border-theme-primary text-theme-main font-extrabold' : 'border-transparent text-theme-muted hover:text-theme-main'
                  }`}
                >
                  <Layers size={14} /> Estructura POA y Partidas
                </button>
                <button
                  onClick={() => setTabSeccion('gastos')}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                    tabSeccion === 'gastos' ? 'border-rose-500 text-rose-600 font-extrabold' : 'border-transparent text-theme-muted hover:text-theme-main'
                  }`}
                >
                  <Receipt size={14} /> Libro Auxiliar de Gastos ({
                    seccionActivaData.memorias.reduce((total, m) =>
                      total + m.partidas.reduce((ptotal, p) => ptotal + p.gastos_detalle.length, 0), 0
                    )
                  })
                </button>
                <button
                  onClick={() => setTabSeccion('partidas')}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                    tabSeccion === 'partidas' ? 'border-theme-primary text-theme-main font-extrabold' : 'border-transparent text-theme-muted hover:text-theme-main'
                  }`}
                >
                  <BookOpenText size={14} /> Consolidado por Partidas ({partidasConsolidadas.length})
                </button>
              </div>

              {/* PESTAÑA 1: ESTRUCTURA POA Y PARTIDAS */}
              {tabSeccion === 'presupuesto' && (
                <div className="space-y-4">
                  <div className="px-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-theme-muted">
                      Estructura y Desglose de Presupuestos Formulados
                    </h3>
                  </div>

                  {seccionActivaData.memorias.length === 0 ? (
                    <div className="card p-10 text-center text-theme-muted">
                      No hay memorias de cálculo aprobadas en esta sección.
                    </div>
                  ) : (
                    seccionActivaData.memorias.map(memoria => {
                      const memExpanded = expandedMemorias.has(memoria.memoria_id);
                      return (
                        <div key={memoria.memoria_id} className="card overflow-hidden">
                          {/* Cabecera de Memoria */}
                          <button
                            onClick={() => toggleMemoria(memoria.memoria_id)}
                            className="w-full flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 text-left hover:bg-theme-border/10 transition-colors"
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <FileText size={18} className="text-theme-muted shrink-0 mt-0.5" />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono text-sm font-bold text-theme-main">{memoria.memoria_codigo}</span>
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
                                <p className="text-xs text-theme-muted mt-1 leading-normal">{memoria.justificacion}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 ml-auto sm:ml-0 shrink-0 text-right">
                              <div>
                                <p className="text-[10px] text-theme-muted font-semibold">PRESUPUESTADO</p>
                                <p className="text-sm font-bold text-theme-main">{formatMoney(memoria.total_presupuestado)}</p>
                              </div>

                              {(Number(memoria.monto_entrante || 0) > 0 || Number(memoria.monto_saliente || 0) > 0) && (
                                <div>
                                  <p className="text-[10px] text-theme-muted font-semibold">TRASPASOS (ENT / SAL)</p>
                                  <p className="text-xs font-mono font-bold">
                                    <span className="text-emerald-600 dark:text-emerald-400">+{formatMoney(memoria.monto_entrante || 0)}</span> /{' '}
                                    <span className="text-rose-600 dark:text-rose-400">-{formatMoney(memoria.monto_saliente || 0)}</span>
                                  </p>
                                </div>
                              )}

                              <div>
                                <p className="text-[10px] text-theme-muted font-semibold">SALDO DISPONIBLE</p>
                                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatMoney(memoria.total_disponible)}</p>
                              </div>
                              <ChevronDown size={18} className={`text-theme-muted transition-transform ${memExpanded ? 'rotate-180' : ''}`} />
                            </div>
                          </button>

                          {/* Partidas y gastos asociados de la memoria */}
                          {memExpanded && (
                            <div className="border-t border-theme-border bg-theme-base/20 p-4 space-y-4">
                              {(Number(memoria.monto_entrante || 0) > 0 || Number(memoria.monto_saliente || 0) > 0) && (
                                <div className="p-3 bg-blue-50/70 border border-blue-200 text-blue-900 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                                  <div className="flex items-center gap-2">
                                    <ArrowRightLeft size={16} className="text-blue-600 dark:text-blue-400 shrink-0" />
                                    <span>
                                      <strong>Aviso de Traspasos Presupuestarios:</strong> El saldo disponible real incluye traspasos de saldo.
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 font-mono text-[11px] font-bold shrink-0">
                                    {Number(memoria.monto_entrante || 0) > 0 && (
                                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                        + {formatMoney(memoria.monto_entrante || 0)} Recibido
                                      </span>
                                    )}
                                    {Number(memoria.monto_saliente || 0) > 0 && (
                                      <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                        - {formatMoney(memoria.monto_saliente || 0)} Cedido
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                              {memoria.partidas.length === 0 ? (
                                <p className="text-xs text-theme-muted text-center py-2">Sin partidas asignadas en esta memoria.</p>
                              ) : (
                                memoria.partidas.map(partida => {
                                  const pKey = `${memoria.memoria_id}-${partida.partida_codigo}`;
                                  const prtExpanded = expandedPartidas.has(pKey);
                                  const pctP = parseFloat(partida.presupuestado) > 0
                                    ? Math.min(100, Math.round(parseFloat(partida.gastado) / parseFloat(partida.presupuestado) * 10000) / 100)
                                    : 0;

                                  const tieneTraspasosP = Number(partida.monto_entrante || 0) > 0 || Number(partida.monto_saliente || 0) > 0;
                                  return (
                                    <div key={pKey} className="border border-theme-border rounded-xl bg-theme-surface overflow-hidden">
                                      {/* Cabecera Partida */}
                                      <button
                                        onClick={() => togglePartida(pKey)}
                                        className="w-full p-4 flex items-center justify-between gap-4 hover:bg-theme-border/10 transition-colors text-left"
                                      >
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs font-bold text-theme-primary">{partida.partida_codigo}</span>
                                            <span className="text-xs font-semibold text-theme-main truncate">{partida.partida_nombre}</span>
                                          </div>

                                          <div className={`grid gap-2 mt-3 text-left ${tieneTraspasosP ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`}>
                                            <div>
                                              <span className="text-[10px] text-theme-muted">Presupuesto</span>
                                              <p className="text-xs font-bold text-theme-main">{formatMoney(partida.presupuestado)}</p>
                                            </div>
                                            {tieneTraspasosP && (
                                              <div>
                                                <span className="text-[10px] text-theme-muted">Traspasos (Ent / Sal)</span>
                                                <p className="text-xs font-mono font-bold">
                                                  <span className="text-emerald-600 dark:text-emerald-400">+{formatMoney(partida.monto_entrante || 0)}</span> /{' '}
                                                  <span className="text-rose-600 dark:text-rose-400">-{formatMoney(partida.monto_saliente || 0)}</span>
                                                </p>
                                              </div>
                                            )}
                                            <div>
                                              <span className="text-[10px] text-theme-muted text-rose-600">Ejecutado</span>
                                              <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{formatMoney(partida.gastado)}</p>
                                            </div>
                                            <div>
                                              <span className="text-[10px] text-theme-muted text-emerald-600">Disponible</span>
                                              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{formatMoney(partida.disponible)}</p>
                                            </div>
                                          </div>

                                          <div className="w-full bg-theme-border/60 rounded-full h-1.5 mt-2.5 overflow-hidden">
                                            <div className={`h-full ${pctP > 80 ? 'bg-rose-500' : pctP > 50 ? 'bg-amber-500' : 'bg-theme-primary'}`}
                                              style={{ width: `${pctP}%` }} />
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                          {partida.gastos_detalle.length > 0 && (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                                              {partida.gastos_detalle.length} gasto(s)
                                            </span>
                                          )}
                                          <ChevronDown size={15} className={`text-theme-muted transition-transform ${prtExpanded ? 'rotate-180' : ''}`} />
                                        </div>
                                      </button>

                                      {/* Tabla de Gastos Ejecutados */}
                                      {prtExpanded && (
                                        <div className="border-t border-theme-border/80 bg-theme-base/40">
                                          {partida.gastos_detalle.length === 0 ? (
                                            <p className="p-4 text-xs text-center text-theme-muted">Sin gastos registrados todavía.</p>
                                          ) : (
                                            <div className="overflow-x-auto">
                                              <table className="w-full text-xs border-collapse">
                                                <thead>
                                                  <tr className="text-[10px] font-bold uppercase text-theme-muted border-b border-theme-border/60 bg-theme-base/60">
                                                    <th className="py-2 px-4 text-left">Fecha de Gasto</th>
                                                    <th className="py-2 px-4 text-left">Descripción del Ítem</th>
                                                    <th className="py-2 px-4 text-left">N° Comprobante / Factura</th>
                                                    <th className="py-2 px-4 text-left">Observación</th>
                                                    <th className="py-2 px-4 text-right">Monto</th>
                                                  </tr>
                                                </thead>
                                                <tbody className="divide-y divide-theme-border/40">
                                                  {partida.gastos_detalle.map(gasto => (
                                                    <tr key={gasto.gasto_id} className="hover:bg-theme-border/10">
                                                      <td className="py-2.5 px-4 font-mono font-semibold text-theme-muted">{gasto.fecha_gasto}</td>
                                                      <td className="py-2.5 px-4 text-theme-main font-medium">{gasto.item_descripcion}</td>
                                                      <td className="py-2.5 px-4 font-mono font-bold text-theme-muted">{gasto.comprobante || 'S/N'}</td>
                                                      <td className="py-2.5 px-4 text-theme-muted">{gasto.observacion || '—'}</td>
                                                      <td className="py-2.5 px-4 text-right font-bold text-rose-600 dark:text-rose-400">
                                                        {formatMoney(gasto.monto)}
                                                      </td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                                <tfoot>
                                                  <tr className="bg-theme-base/80 font-bold border-t border-theme-border/60">
                                                    <td colSpan={4} className="py-2 px-4 text-right uppercase text-theme-muted text-[10px]">
                                                      Total Gastado en Partida:
                                                    </td>
                                                    <td className="py-2 px-4 text-right text-rose-600 dark:text-rose-400 text-xs">
                                                      {formatMoney(partida.gastado)}
                                                    </td>
                                                  </tr>
                                                </tfoot>
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
                    })
                  )}
                </div>
              )}

              {/* PESTAÑA 2: LIBRO AUXILIAR DE GASTOS */}
              {tabSeccion === 'gastos' && (
                <div className="card overflow-hidden bg-theme-surface">
                  <div className="p-4 bg-theme-base/60 border-b border-theme-border/60 flex items-center justify-between">
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
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="bg-theme-base/40 text-[10px] font-bold uppercase tracking-wider text-theme-muted border-b border-theme-border/60">
                            <th className="py-3 px-4">Fecha</th>
                            <th className="py-3 px-4">Memoria</th>
                            <th className="py-3 px-4">Partida Presupuestaria</th>
                            <th className="py-3 px-4">Renglón Imputado</th>
                            <th className="py-3 px-4">N° Comprobante / Factura</th>
                            <th className="py-3 px-4">Justificación / Observación</th>
                            <th className="py-3 px-4 text-right">Monto Ejecutado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-theme-border/50">
                          {todosLosGastosSeccion.map((gasto, index) => (
                            <tr key={gasto.gasto_id || index} className="hover:bg-theme-border/10 transition-colors">
                              {/* Fecha */}
                              <td className="py-3 px-4 whitespace-nowrap">
                                <span className="inline-flex items-center gap-1 font-mono font-bold text-[11px] text-theme-muted bg-theme-base px-2 py-0.5 rounded">
                                  <Clock size={11} />
                                  {gasto.fecha_gasto}
                                </span>
                              </td>
                              {/* Código memoria */}
                              <td className="py-3 px-4 font-mono font-bold text-[11px] text-theme-main">
                                {gasto.memoria_codigo}
                              </td>
                              {/* Partida */}
                              <td className="py-3 px-4">
                                <p className="font-mono font-bold text-[11px] text-theme-main">{gasto.partida_codigo}</p>
                                <p className="text-[10px] text-theme-muted line-clamp-1 truncate max-w-[150px]" title={gasto.partida_nombre}>
                                  {gasto.partida_nombre}
                                </p>
                              </td>
                              {/* Renglón */}
                              <td className="py-3 px-4 font-medium text-theme-main max-w-xs">
                                {gasto.item_descripcion}
                              </td>
                              {/* Comprobante */}
                              <td className="py-3 px-4 whitespace-nowrap">
                                <span className="font-mono font-bold px-2 py-0.5 rounded border border-theme-border bg-theme-base/40 text-theme-muted text-[11px]">
                                  {gasto.comprobante || 'S/N'}
                                </span>
                              </td>
                              {/* Observación */}
                              <td className="py-3 px-4 text-theme-muted max-w-xs truncate" title={gasto.observacion || ''}>
                                {gasto.observacion || '—'}
                              </td>
                              {/* Monto */}
                              <td className="py-3 px-4 text-right font-extrabold text-[13px] text-rose-600 dark:text-rose-400 whitespace-nowrap">
                                {formatMoney(gasto.monto)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-theme-base font-bold border-t border-theme-border/60 text-xs">
                            <td colSpan={6} className="py-3 px-4 text-right uppercase text-theme-muted text-[10px]">
                              Total acumulado ejecutado en sección:
                            </td>
                            <td className="py-3 px-4 text-right text-rose-600 dark:text-rose-400 text-sm">
                              {formatMoney(seccionActivaData.total_gastado)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* PESTAÑA 3: CONSOLIDADO POR PARTIDAS */}
              {tabSeccion === 'partidas' && (
                <div className="space-y-4">
                  {/* Barra de herramientas de la pestaña de partidas */}
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
                          Gestión {activeGestion?.anio || detalleArea?.gestion_anio} • {detalleArea?.area_nombre} ({detalleArea?.area_codigo}) • {seccionActivaData.seccion_nombre}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Filtro Mes Desde */}
                      <div className="flex items-center gap-1.5 bg-theme-base border border-theme-border px-2.5 py-1.5 rounded-xl text-xs">
                        <Calendar size={13} className="text-theme-muted" />
                        <label className="text-theme-muted font-medium text-[11px]">Desde:</label>
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

                      {/* Filtro Mes Hasta */}
                      <div className="flex items-center gap-1.5 bg-theme-base border border-theme-border px-2.5 py-1.5 rounded-xl text-xs">
                        <Calendar size={13} className="text-theme-muted" />
                        <label className="text-theme-muted font-medium text-[11px]">Hasta:</label>
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

                      {/* Botón Limpiar Filtro de Meses */}
                      {hayFiltroMeses && (
                        <button
                          onClick={resetearFiltroMeses}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-all flex items-center gap-1"
                          title="Restablecer a todo el año (Enero a Diciembre)"
                        >
                          <RotateCcw size={12} />
                          Limpiar
                        </button>
                      )}

                      {/* Input de Búsqueda */}
                      <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted" />
                        <input
                          type="text"
                          placeholder="Buscar partida..."
                          value={busquedaPartida}
                          onChange={(e) => setBusquedaPartida(e.target.value)}
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

                      {/* Botón de Impresión de Reporte */}
                      <button
                        onClick={() => setShowModalReportePartidas(true)}
                        className="px-3 py-1.5 rounded-xl bg-theme-primary text-theme-primaryText text-xs font-bold hover:bg-theme-primaryHover transition-all flex items-center gap-1.5 shadow-sm shrink-0"
                        title="Imprimir reporte oficial de partidas presupuestarias"
                      >
                        <Printer size={14} />
                        Imprimir Partidas
                      </button>
                    </div>
                  </div>

                  {/* Indicador de Rango de Meses Activo */}
                  {hayFiltroMeses && (
                    <div className="text-[11px] px-3 py-1.5 rounded-xl bg-theme-primary/10 border border-theme-primary/20 text-theme-main flex items-center gap-2">
                      <Filter size={13} className="text-theme-primary shrink-0" />
                      <span>
                        Evaluando ejecución presupuestaria correspondiente al periodo: <strong>{nombreMesDesde} a {nombreMesHasta} {activeGestion?.anio || ''}</strong>
                      </span>
                    </div>
                  )}

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

                  {/* Tabla Principal de Partidas Consolidadas */}
                  <div className="card overflow-hidden bg-theme-surface">
                    {partidasFiltradas.length === 0 ? (
                      <div className="p-12 text-center text-theme-muted space-y-2">
                        <BookOpenText size={36} className="mx-auto opacity-30 text-theme-primary" />
                        <p className="font-semibold text-sm">
                          {busquedaPartida ? 'No se encontraron partidas para la búsqueda.' : 'Sin partidas configuradas en esta sección.'}
                        </p>
                      </div>
                    ) : (
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
                          <tbody className="divide-y divide-theme-border/60">
                            {partidasFiltradas.map((partida, idx) => {
                              const isExp = expandedPartidasConsolidadas.has(partida.partida_codigo);
                              return (
                                <React.Fragment key={`partida-${partida.partida_codigo}`}>
                                  <tr
                                    onClick={() => togglePartidaConsolidada(partida.partida_codigo)}
                                    className="hover:bg-theme-border/20 transition-colors cursor-pointer"
                                  >
                                    <td className="py-3 px-3 text-center font-bold text-theme-muted text-[11px]">
                                      {idx + 1}
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
                                                className="p-3 rounded-xl bg-theme-surface border border-theme-border text-xs space-y-2"
                                              >
                                                <div className="flex items-center justify-between">
                                                  <span className="font-mono font-bold text-theme-primary text-xs">
                                                    {mem.memoria_codigo}
                                                  </span>
                                                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                    Disp: {formatMoney(mem.disponible)}
                                                  </span>
                                                </div>
                                                <p className="text-[11px] text-theme-muted line-clamp-2">{mem.justificacion}</p>
                                                <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-theme-border/60 text-[10px]">
                                                  <div>
                                                    <span className="text-theme-muted block">Presupuesto:</span>
                                                    <span className="font-bold text-theme-main">{formatMoney(mem.presupuestado)}</span>
                                                  </div>
                                                  <div>
                                                    <span className="text-theme-muted block">Traspasos:</span>
                                                    <span className="font-bold text-blue-600 dark:text-blue-400">
                                                      +{formatMoney(mem.agregado)} / -{formatMoney(mem.quitado)}
                                                    </span>
                                                  </div>
                                                  <div>
                                                    <span className="text-theme-muted block">Ejecutado:</span>
                                                    <span className="font-bold text-rose-600 dark:text-rose-400">{formatMoney(mem.ejecutado)}</span>
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
                          <tfoot>
                            <tr className="bg-theme-base/80 font-black border-t-2 border-theme-border text-xs text-theme-main">
                              <td colSpan={3} className="py-3 px-4 text-right uppercase tracking-wider text-[11px]">
                                TOTAL CONSOLIDADO DE PARTIDAS:
                              </td>
                              <td className="py-3 px-3 text-right text-xs">
                                {formatMoney(totalPartidasPresupuestado)}
                              </td>
                              <td className="py-3 px-3 text-right text-xs text-emerald-600 dark:text-emerald-400">
                                +{formatMoney(totalPartidasAgregado)}
                              </td>
                              <td className="py-3 px-3 text-right text-xs text-rose-600 dark:text-rose-400">
                                -{formatMoney(totalPartidasQuitado)}
                              </td>
                              <td className="py-3 px-3 text-right text-xs text-rose-600 dark:text-rose-400">
                                {formatMoney(totalPartidasEjecutado)}
                              </td>
                              <td className="py-3 px-3 text-right text-xs text-emerald-600 dark:text-emerald-400">
                                {formatMoney(totalPartidasDisponible)}
                              </td>
                              <td className="py-3 px-3 text-center text-xs">
                                {pctPartidasGlobal}%
                              </td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card p-10 text-center">Sección no encontrada.</div>
          )}
        </div>
      )}

      {/* VISTA REPORTE DE GASTOS DETALLADOS POR SECCIÓN */}
      {viewMode === 'reporte' && (
        seccionActivaData ? (
        <div className="space-y-4">
          {/* Breadcrumb / Toolbar */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setViewMode('seccion')}
              className="flex items-center gap-1.5 text-xs font-bold text-theme-primary hover:underline"
            >
              <ChevronLeft size={16} /> Volver a la Sección
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-theme-primary text-white text-xs font-bold hover:opacity-90 transition-opacity shadow"
            >
              <Printer size={14} /> Imprimir Reporte
            </button>
          </div>

          {/* Contenido Imprimible */}
          <div id="reporte-seccion-printable" className="bg-white text-black rounded-2xl border border-theme-border shadow-sm overflow-hidden">

            {/* Cabecera del Reporte */}
            <div className="p-6 border-b-2 border-black">
              <div className="text-center mb-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  ESTADO PLURINACIONAL DE BOLIVIA
                </p>
                <h1 className="text-lg font-extrabold uppercase tracking-wide text-black mt-1">
                  REPORTE DE GASTOS DETALLADOS POR SECCIÓN
                </h1>
                <p className="text-xs font-semibold text-gray-600 mt-1">
                  {detalleArea?.area_nombre} — {seccionActivaData.seccion_nombre}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Gestión: {detalleArea?.gestion_anio} &nbsp;|&nbsp; Fecha de Generación: {new Date().toLocaleDateString('es-BO')}
                </p>
              </div>

              {/* Resumen totales de la sección */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="border border-gray-300 rounded p-2 text-center">
                  <p className="text-[9px] font-bold uppercase text-gray-500">Total Presupuestado</p>
                  <p className="text-sm font-extrabold text-black">{formatMoney(seccionActivaData.total_presupuestado)}</p>
                </div>
                <div className="border border-gray-300 rounded p-2 text-center">
                  <p className="text-[9px] font-bold uppercase text-gray-500">Total Ejecutado</p>
                  <p className="text-sm font-extrabold text-black">{formatMoney(seccionActivaData.total_gastado)}</p>
                </div>
                <div className="border border-gray-300 rounded p-2 text-center">
                  <p className="text-[9px] font-bold uppercase text-gray-500">Saldo Disponible</p>
                  <p className="text-sm font-extrabold text-black">{formatMoney(seccionActivaData.total_disponible)}</p>
                </div>
              </div>
            </div>

            {/* Memorias */}
            <div className="divide-y divide-gray-200">
              {seccionActivaData.memorias.map((memoria) => {
                const totalPres = parseFloat(memoria.total_presupuestado || '0');
                const totalGast = parseFloat(memoria.total_gastado || '0');
                const totalDisp = parseFloat(memoria.total_disponible || '0');
                const hasTraspasos = (memoria.traspasos || []).length > 0;

                return (
                  <div key={memoria.memoria_id} className="p-5">
                    {/* Encabezado de Memoria */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm font-extrabold text-black">{memoria.memoria_codigo}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-gray-400 text-gray-600 uppercase">{memoria.estado_display}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <p className="text-[9px] text-gray-500 font-semibold uppercase">Presupuestado</p>
                        <p className="text-sm font-extrabold text-black">{formatMoney(totalPres)}</p>
                      </div>
                    </div>

                    {/* Traspasos de la Memoria (movido abajo) */}

                    {/* Tabla de Ítems */}
                    {(memoria.items || []).length === 0 ? (
                      <p className="text-xs text-gray-400 italic">Sin ítems registrados en esta memoria.</p>
                    ) : (
                      <table className="w-full text-xs border-collapse border border-gray-400">
                        <thead>
                          <tr style={{ backgroundColor: '#002060', color: '#ffffff' }} className="text-[9px] font-bold uppercase">
                            <th className="border border-gray-600 p-1.5 text-center w-6">N°</th>
                            <th className="border border-gray-600 p-1.5 text-left">Descripción del Ítem</th>
                            <th className="border border-gray-600 p-1.5 text-left">Partida</th>
                            <th className="border border-gray-600 p-1.5 text-center w-16">Cantidad</th>
                            <th className="border border-gray-600 p-1.5 text-center w-16">Unidad</th>
                            <th className="border border-gray-600 p-1.5 text-right w-24">P. Unitario</th>
                            <th className="border border-gray-600 p-1.5 text-right w-24">Presupuestado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {memoria.items.map((item, iIdx) => (
                            <tr key={item.detalle_id} className="bg-gray-50">
                              <td className="border border-gray-300 p-1.5 text-center font-bold text-gray-600">{iIdx + 1}</td>
                              <td className="border border-gray-300 p-1.5 font-semibold text-black">{item.descripcion}</td>
                              <td className="border border-gray-300 p-1.5">
                                <span className="font-mono text-[9px] font-bold text-gray-700">{item.partida_codigo}</span>
                              </td>
                              <td className="border border-gray-300 p-1.5 text-center font-mono">{item.cantidad}</td>
                              <td className="border border-gray-300 p-1.5 text-center uppercase text-gray-600">{item.unidad_medida}</td>
                              <td className="border border-gray-300 p-1.5 text-right font-mono">{formatMoney(item.precio_unitario)}</td>
                              <td className="border border-gray-300 p-1.5 text-right font-bold text-black">{formatMoney(item.precio_total)}</td>
                            </tr>
                          ))}
                        </tbody>
                        {/* Subtotales de la Memoria */}
                        <tfoot>
                          <tr style={{ backgroundColor: '#002060', color: '#ffffff' }} className="font-extrabold text-[10px]">
                            <td colSpan={5} className="border border-gray-600 p-1.5 text-right uppercase">Totales Memoria {memoria.memoria_codigo}:</td>
                            <td className="border border-gray-600 p-1.5 text-right">Presupuestado:</td>
                            <td className="border border-gray-600 p-1.5 text-right">{formatMoney(totalPres)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    )}

                    {/* Movimientos y Gastos de la Memoria */}
                    {(() => {
                      const gastosMemoria = memoria.partidas && memoria.partidas[0] ? memoria.partidas[0].gastos_detalle : [];
                      const traspasosMemoria = memoria.traspasos || [];
                      
                      const movimientos = [
                        ...gastosMemoria.map(g => ({
                          tipo: 'GASTO',
                          fecha: g.fecha_gasto,
                          detalle: `Comprobante: ${g.comprobante || 'S/N'}`,
                          observacion: g.observacion || '—',
                          montoStr: g.monto,
                          montoVal: parseFloat(g.monto || '0')
                        })),
                        ...traspasosMemoria.map(t => ({
                          tipo: t.tipo === 'ENTRADA' ? 'TRASPASO_ENTRADA' : 'TRASPASO_SALIDA',
                          fecha: t.fecha,
                          detalle: `Contraparte: ${t.memoria_contraparte_codigo}`,
                          observacion: t.motivo || '—',
                          montoStr: t.monto,
                          montoVal: parseFloat(t.monto || '0')
                        }))
                      ];

                      // Ordenar por fecha cronológicamente
                      movimientos.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

                      if (movimientos.length > 0) {
                        return (
                          <div className="mt-3 border border-gray-300 bg-gray-50 rounded p-3">
                            <p className="text-[10px] font-extrabold uppercase text-black mb-2 flex items-center gap-1">
                              <RefreshCw size={11} /> Movimientos y Gastos Registrados en la Memoria
                            </p>
                            <table className="w-full text-xs border-collapse">
                              <thead>
                                <tr className="text-[9px] font-bold uppercase text-black border-b border-gray-300">
                                  <th className="py-1 pr-3 text-left">Fecha</th>
                                  <th className="py-1 pr-3 text-left">Tipo</th>
                                  <th className="py-1 pr-3 text-left">Detalle / Contraparte</th>
                                  <th className="py-1 pr-3 text-left">Motivo / Observación</th>
                                  <th className="py-1 text-right">Monto</th>
                                </tr>
                              </thead>
                              <tbody>
                                {movimientos.map((mov, idx) => {
                                  let textColor = 'text-gray-700';
                                  let sign = '';
                                  let tipoLabel = '';
                                  
                                  if (mov.tipo === 'GASTO') {
                                    textColor = 'text-rose-700';
                                    sign = '-';
                                    tipoLabel = 'Gasto';
                                  } else if (mov.tipo === 'TRASPASO_ENTRADA') {
                                    textColor = 'text-emerald-700';
                                    sign = '+';
                                    tipoLabel = '▲ Traspaso Entrada';
                                  } else {
                                    textColor = 'text-rose-700';
                                    sign = '-';
                                    tipoLabel = '▼ Traspaso Salida';
                                  }

                                  return (
                                    <tr key={idx} className="border-b border-gray-200 last:border-0 hover:bg-gray-100 transition-colors">
                                      <td className="py-1 pr-3 font-mono text-gray-700 whitespace-nowrap">{mov.fecha}</td>
                                      <td className={`py-1 pr-3 font-bold text-[10px] uppercase ${textColor}`}>{tipoLabel}</td>
                                      <td className="py-1 pr-3 font-mono font-bold text-black">{mov.detalle}</td>
                                      <td className="py-1 pr-3 text-gray-700 max-w-sm truncate" title={mov.observacion}>{mov.observacion}</td>
                                      <td className={`py-1 text-right font-extrabold whitespace-nowrap ${textColor}`}>{sign}{formatMoney(mov.montoStr)}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Totales Resumen al Final de la Memoria */}
                    <div className="mt-4 flex flex-wrap gap-x-8 gap-y-3 justify-end items-center bg-gray-50 border border-gray-200 rounded p-3">
                      <div className="text-right">
                        <p className="text-[9px] text-gray-500 font-semibold uppercase">Total Presupuestado</p>
                        <p className="text-sm font-extrabold text-black">{formatMoney(totalPres)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-gray-500 font-semibold uppercase">Adicionado (Traspasos)</p>
                        <p className="text-sm font-extrabold text-emerald-600">+{formatMoney(memoria.monto_entrante || '0')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-gray-500 font-semibold uppercase">Retirado (Traspasos)</p>
                        <p className="text-sm font-extrabold text-rose-600">-{formatMoney(memoria.monto_saliente || '0')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-gray-500 font-semibold uppercase">Total Ejecutado (Gastos)</p>
                        <p className="text-sm font-extrabold text-rose-600">-{formatMoney(totalGast)}</p>
                      </div>
                      <div className="text-right pl-4 border-l border-gray-300">
                        <p className="text-[9px] text-gray-500 font-semibold uppercase">Saldo Disponible</p>
                        <p className={`text-sm font-extrabold ${totalDisp >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatMoney(totalDisp)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Totales Generales de la Sección */}
            <div className="p-5" style={{ backgroundColor: '#002060', color: '#ffffff' }}>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-[9px] font-bold uppercase" style={{ color: '#93c5fd' }}>TOTAL PRESUPUESTADO SECCIÓN</p>
                  <p className="text-base font-extrabold">{formatMoney(seccionActivaData.total_presupuestado)}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase" style={{ color: '#93c5fd' }}>TOTAL EJECUTADO SECCIÓN</p>
                  <p className="text-base font-extrabold" style={{ color: '#fca5a5' }}>{formatMoney(seccionActivaData.total_gastado)}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase" style={{ color: '#93c5fd' }}>SALDO DISPONIBLE SECCIÓN</p>
                  <p className="text-base font-extrabold" style={{ color: '#6ee7b7' }}>{formatMoney(seccionActivaData.total_disponible)}</p>
                </div>
              </div>
              <p className="text-center text-[9px] mt-3" style={{ color: '#94a3b8' }}>
                Reporte generado el {new Date().toLocaleString('es-BO')} — Sistema de Formulación y Ejecución Presupuestaria
              </p>
            </div>
          </div>
        </div>
        ) : (
          <div className="card p-10 text-center text-theme-muted space-y-3">
            <p>No se encontraron datos de la sección para el reporte.</p>
            <button onClick={() => setViewMode('general')} className="btn-primary text-xs px-4 py-2">
              Volver al inicio
            </button>
          </div>
        )
      )}

      {/* Modal Crear Gestión */}
      {showModalGestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card w-full max-w-sm shadow-2xl bg-theme-surface">
            <div className="p-5 border-b border-theme-border flex items-center justify-between">
              <h3 className="text-base font-bold text-theme-main">Nueva Gestión Presupuestaria</h3>
              <button onClick={() => setShowModalGestion(false)} className="text-theme-muted hover:text-theme-main font-bold">✕</button>
            </div>
            <form onSubmit={handleCrearGestion} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-theme-muted mb-1">Año de la Gestión</label>
                <input
                  type="number"
                  required
                  min={2020}
                  max={2050}
                  value={nuevoAnio}
                  onChange={e => setNuevoAnio(Number(e.target.value))}
                  className="input-theme text-sm font-bold"
                />
                <p className="text-[11px] text-theme-muted mt-1">La gestión se creará en estado <strong>Formulación</strong>.</p>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModalGestion(false)}
                  className="px-4 py-2 rounded-xl border border-theme-border text-xs font-semibold text-theme-muted hover:text-theme-main">
                  Cancelar
                </button>
                <button type="submit" disabled={actionLoading} className="btn-primary text-xs px-5 py-2">
                  Crear Gestión
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE REPORTE E IMPRESIÓN OFICIAL POR PARTIDAS */}
      {showModalReportePartidas && seccionActivaData && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:overflow-visible">
          <div className="bg-theme-surface border border-theme-border rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden print:max-w-none print:max-h-none print:border-none print:shadow-none print:w-full">
            {/* Barra de Controles Superior (Oculta al Imprimir) */}
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
                  className="px-4 py-2 rounded-xl bg-theme-primary text-theme-primaryText text-xs font-bold hover:bg-theme-primaryHover transition-all flex items-center gap-1.5 shadow"
                >
                  <Printer size={15} />
                  Imprimir Reporte (PDF)
                </button>
                <button
                  onClick={() => setShowModalReportePartidas(false)}
                  className="p-2 rounded-xl text-theme-muted hover:text-theme-main hover:bg-theme-border/40 transition-colors"
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
                      {new Date().toLocaleDateString('es-BO')} {new Date().toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}
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
