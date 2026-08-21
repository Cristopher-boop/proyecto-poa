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
} from 'lucide-react';
import {
  Gestion,
  PresupuestoArea,
  ResumenGestion,
  DetalleArea,
  SeccionDetalleArea,
  MemoriaDetalleArea,
  PartidaDetalleArea,
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
  const [viewMode, setViewMode] = useState<'general' | 'area' | 'seccion'>('general');
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);
  const [selectedSeccionId, setSelectedSeccionId] = useState<number | null>(null);
  const [tabSeccion, setTabSeccion] = useState<'presupuesto' | 'gastos'>('presupuesto');

  const [detalleArea, setDetalleArea] = useState<DetalleArea | null>(null);
  const [detalleLoading, setDetalleLoading] = useState(false);

  // UI state for creating gestion
  const [showModalGestion, setShowModalGestion] = useState(false);
  const [nuevoAnio, setNuevoAnio] = useState(new Date().getFullYear() + 1);

  // Expansiones en vista sección
  const [expandedMemorias, setExpandedMemorias] = useState<Set<number>>(new Set());
  const [expandedPartidas, setExpandedPartidas] = useState<Set<string>>(new Set());

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

  // Sección activa en vista sección
  const seccionActivaData = useMemo(() => {
    if (viewMode !== 'seccion' || !detalleArea || !selectedSeccionId) return null;
    return detalleArea.secciones.find(s => s.seccion_id === selectedSeccionId) || null;
  }, [viewMode, detalleArea, selectedSeccionId]);

  // Recolectar egresos cronológicos de la sección activa
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
  }, [seccionActivaData]);

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
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-theme-muted font-semibold uppercase block">Memorias</span>
                    <span className="text-xl font-bold text-theme-main">{seccionActivaData.memorias.length}</span>
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
              </div>

              {tabSeccion === 'presupuesto' ? (
                /* Listado de Memorias de Cálculo */
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
              ) : (
                /* Libro Auxiliar de Gastos - Historial Cronológico Detallado */
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
            </div>
          ) : (
            <div className="card p-10 text-center">Sección no encontrada.</div>
          )}
        </div>
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
    </div>
  );
}
