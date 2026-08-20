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
  Building2,
  Calendar,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  Layers,
  Receipt,
  FileText,
  ArrowRight,
  BookOpenText,
  ShieldCheck,
  BarChart3,
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

  // UI states
  const [showModalGestion, setShowModalGestion] = useState(false);
  const [nuevoAnio, setNuevoAnio] = useState(new Date().getFullYear() + 1);

  // Drill-down: área seleccionada para ver detalle
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);
  const [detalleArea, setDetalleArea] = useState<DetalleArea | null>(null);
  const [detalleLoading, setDetalleLoading] = useState(false);

  // Expansión de secciones / memorias
  const [expandedSecciones, setExpandedSecciones] = useState<Set<number>>(new Set());
  const [expandedMemorias, setExpandedMemorias] = useState<Set<number>>(new Set());
  const [expandedPartidas, setExpandedPartidas] = useState<Set<string>>(new Set());

  useEffect(() => { cargarBase(); }, []);
  useEffect(() => { if (selectedGestionId) cargarDatos(selectedGestionId); }, [selectedGestionId]);
  useEffect(() => {
    if (selectedGestionId && selectedAreaId) cargarDetalleArea(selectedGestionId, selectedAreaId);
    else setDetalleArea(null);
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
    setExpandedSecciones(new Set());
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

  const toggleSeccion = (id: number) => {
    setExpandedSecciones(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

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

  // Acciones de gestión
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

  const totalInicial = useMemo(() =>
    presupuestosArea.reduce((a, p) => a + parseFloat(p.monto_inicial || '0'), 0), [presupuestosArea]);
  const totalEjecutado = useMemo(() =>
    presupuestosArea.reduce((a, p) => a + parseFloat(p.monto_ejecutado || '0'), 0), [presupuestosArea]);
  const totalDisponible = useMemo(() =>
    presupuestosArea.reduce((a, p) => a + parseFloat(p.monto_actual || '0'), 0), [presupuestosArea]);
  const pctGlobal = useMemo(() =>
    totalInicial > 0 ? Math.min(100, Math.round(totalEjecutado / totalInicial * 10000) / 100) : 0,
    [totalInicial, totalEjecutado]);

  const selectedAreaPresupuesto = useMemo(() =>
    presupuestosArea.find(p => p.area === selectedAreaId) || null, [presupuestosArea, selectedAreaId]);

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
      {/* Feedback */}
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
                onChange={e => setSelectedGestionId(Number(e.target.value))}
                className="bg-transparent font-bold text-sm text-theme-main focus:outline-none"
              >
                {gestiones.map(g => (
                  <option key={g.id} value={g.id}>Gestión {g.anio} — {g.estado_display}</option>
                ))}
              </select>
            </div>

            {/* Acciones de flujo de gestión */}
            {activeGestion?.estado === 'FORMULACION' && (
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
            {activeGestion?.estado === 'CERRADO_FORMULACION' && (
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

            <button onClick={() => setShowModalGestion(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-theme-primary/10 text-theme-primary hover:bg-theme-primary/20 text-xs font-semibold transition-colors">
              <Plus size={14} /> Nueva Gestión
            </button>
          </div>
        </div>

        {/* Badge de estado actual de la gestión */}
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

      {/* KPI Cards Globales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-theme-muted">Presupuesto Inicial</span>
            <div className="p-2 rounded-xl bg-blue-500/10"><DollarSign size={16} className="text-blue-600 dark:text-blue-400" /></div>
          </div>
          <p className="text-xl font-bold text-theme-main">{formatMoney(totalInicial)}</p>
          <p className="text-[11px] text-theme-muted mt-1">{presupuestosArea.length} áreas con techo asignado</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-theme-muted">Total Ejecutado</span>
            <div className="p-2 rounded-xl bg-rose-500/10"><TrendingDown size={16} className="text-rose-600 dark:text-rose-400" /></div>
          </div>
          <p className="text-xl font-bold text-rose-600 dark:text-rose-400">{formatMoney(totalEjecutado)}</p>
          <p className="text-[11px] text-theme-muted mt-1">Gastos reales registrados</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-theme-muted">Saldo Disponible</span>
            <div className="p-2 rounded-xl bg-emerald-500/10"><WalletCards size={16} className="text-emerald-600 dark:text-emerald-400" /></div>
          </div>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatMoney(totalDisponible)}</p>
          <p className="text-[11px] text-theme-muted mt-1">Fondos aún disponibles</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-theme-muted">% Ejecutado</span>
            <div className="p-2 rounded-xl bg-amber-500/10"><BarChart3 size={16} className="text-amber-600 dark:text-amber-400" /></div>
          </div>
          <p className="text-xl font-bold text-theme-main">{pctGlobal}%</p>
          <div className="w-full bg-theme-border/60 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className={`h-full ${pctGlobal > 85 ? 'bg-rose-500' : pctGlobal > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${pctGlobal}%` }} />
          </div>
        </div>
      </div>

      {/* Accesos Rápidos a módulos relacionados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button onClick={() => navigate('/memorias')}
          className="card p-4 flex items-center gap-4 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all text-left group">
          <div className="p-3 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
            <BookOpenText size={22} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm text-theme-main">Módulo de Memorias de Cálculo</p>
            <p className="text-xs text-theme-muted mt-0.5">Formular, revisar y aprobar memorias de cálculo por área y gestión</p>
          </div>
          <ArrowRight size={18} className="text-theme-muted group-hover:text-blue-600 transition-colors" />
        </button>

        <button onClick={() => navigate('/ejecucion')}
          className="card p-4 flex items-center gap-4 hover:border-rose-300 dark:hover:border-rose-700 hover:shadow-md transition-all text-left group">
          <div className="p-3 rounded-xl bg-rose-500/10 group-hover:bg-rose-500/20 transition-colors">
            <TrendingDown size={22} className="text-rose-600 dark:text-rose-400" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm text-theme-main">Módulo de Ejecución Presupuestaria</p>
            <p className="text-xs text-theme-muted mt-0.5">Registrar gastos, controlar comprobantes y monitorear saldos en tiempo real</p>
          </div>
          <ArrowRight size={18} className="text-theme-muted group-hover:text-rose-600 transition-colors" />
        </button>
      </div>

      {/* Sección Principal: Panel de Áreas + Detalle */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">

        {/* Lista de Áreas con techos presupuestarios */}
        <div className="xl:col-span-2 space-y-2">
          <div className="flex items-center justify-between px-1 mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-theme-muted flex items-center gap-2">
              <Building2 size={15} /> Áreas / Gerencias
            </h2>
            <span className="text-xs text-theme-muted">{presupuestosArea.length > 0 ? `${presupuestosArea.length} con techo` : 'Sin datos'}</span>
          </div>

          {presupuestosArea.length === 0 ? (
            <div className="card p-8 text-center">
              <Building2 size={32} className="mx-auto mb-3 opacity-30 text-theme-muted" />
              <p className="text-sm font-medium text-theme-muted">Sin presupuestos consolidados</p>
              <p className="text-xs text-theme-muted mt-1">
                {activeGestion?.estado === 'FORMULACION'
                  ? 'Cierra la formulación para consolidar los techos.'
                  : 'Aprueba memorias de cálculo y consolida los presupuestos.'}
              </p>
            </div>
          ) : (
            presupuestosArea.map(p => {
              const pct = p.porcentaje_ejecucion || 0;
              const isSelected = selectedAreaId === p.area;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedAreaId(isSelected ? null : p.area)}
                  className={`w-full text-left card p-4 transition-all hover:shadow-md ${
                    isSelected ? 'ring-2 ring-theme-primary bg-theme-primary/5' : 'hover:border-theme-primary/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-theme-border/80 text-theme-muted font-mono">
                          {p.area_codigo}
                        </span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          p.area_tipo === 'GERENCIA' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300' : 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300'
                        }`}>{p.area_tipo}</span>
                      </div>
                      <p className="text-sm font-semibold text-theme-main leading-tight truncate">{p.area_nombre}</p>
                    </div>
                    <ChevronRight size={15} className={`text-theme-muted mt-1 shrink-0 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-[10px] text-theme-muted">Inicial</p>
                      <p className="text-xs font-bold text-theme-main">{formatMoney(p.monto_inicial)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-theme-muted">Ejecutado</p>
                      <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{formatMoney(p.monto_ejecutado)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-theme-muted">Disponible</p>
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{formatMoney(p.monto_actual)}</p>
                    </div>
                  </div>

                  <div className="mt-2.5 w-full bg-theme-border/60 rounded-full h-1.5 overflow-hidden">
                    <div className={`h-full transition-all ${pct > 80 ? 'bg-rose-500' : pct > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-[10px] text-theme-muted text-right mt-0.5">{pct}% ejecutado</p>
                </button>
              );
            })
          )}

          {/* Áreas sin techo asignado todavía */}
          {areas.filter(a => !presupuestosArea.find(p => p.area === a.id)).map(a => (
            <button key={a.id}
              onClick={() => setSelectedAreaId(selectedAreaId === a.id ? null : a.id)}
              className={`w-full text-left card p-4 opacity-60 hover:opacity-80 transition-all ${
                selectedAreaId === a.id ? 'ring-2 ring-theme-primary' : ''
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-theme-border/80 text-theme-muted">{a.codigo}</span>
              </div>
              <p className="text-sm font-semibold text-theme-main">{a.nombre}</p>
              <p className="text-[11px] text-theme-muted mt-1">Sin presupuesto asignado en Gestión {activeGestion?.anio}</p>
            </button>
          ))}
        </div>

        {/* Panel de Detalle del Área seleccionada */}
        <div className="xl:col-span-3">
          {!selectedAreaId ? (
            <div className="card p-12 text-center h-full flex flex-col items-center justify-center">
              <Building2 size={42} className="text-theme-muted/40 mb-4" />
              <p className="font-semibold text-theme-muted">Selecciona un Área</p>
              <p className="text-xs text-theme-muted mt-1">Haz clic en un área para ver el desglose financiero por sección, memoria de cálculo y partida presupuestaria.</p>
            </div>
          ) : detalleLoading ? (
            <div className="card p-12 text-center h-full flex flex-col items-center justify-center">
              <RefreshCw size={24} className="animate-spin text-theme-muted mb-3" />
              <p className="text-sm text-theme-muted">Cargando desglose financiero...</p>
            </div>
          ) : !detalleArea ? (
            <div className="card p-12 text-center h-full flex flex-col items-center justify-center">
              <FileText size={36} className="text-theme-muted/40 mb-3" />
              <p className="font-semibold text-theme-muted">Sin memorias registradas</p>
              <p className="text-xs text-theme-muted mt-1">Esta área no tiene memorias de cálculo en la gestión seleccionada.</p>
              <button onClick={() => navigate('/memorias')} className="btn-primary mt-4 text-xs flex items-center gap-1.5">
                <BookOpenText size={14} /> Ir a Módulo de Memorias
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header del Área */}
              <div className="card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-theme-border/80 text-theme-muted">{detalleArea.area_codigo}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        detalleArea.area_tipo === 'GERENCIA' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300' : 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300'
                      }`}>{detalleArea.area_tipo}</span>
                    </div>
                    <h2 className="text-lg font-bold text-theme-main">{detalleArea.area_nombre}</h2>
                    <p className="text-xs text-theme-muted">Gestión {detalleArea.gestion_anio}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-theme-muted uppercase font-semibold">% Ejecución</p>
                    <p className="text-2xl font-bold text-theme-main">{detalleArea.porcentaje_ejecucion}%</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-theme-base border border-theme-border text-center">
                    <p className="text-[10px] font-semibold uppercase text-theme-muted">Presupuesto Inicial</p>
                    <p className="text-sm font-bold text-theme-main mt-0.5">{formatMoney(detalleArea.monto_inicial)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-200/80 dark:bg-rose-950/30 dark:border-rose-800/60 text-center">
                    <p className="text-[10px] font-semibold uppercase text-rose-700 dark:text-rose-400">Gastado</p>
                    <p className="text-sm font-bold text-rose-600 dark:text-rose-400 mt-0.5">{formatMoney(detalleArea.monto_ejecutado)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/80 dark:bg-emerald-950/30 dark:border-emerald-800/60 text-center">
                    <p className="text-[10px] font-semibold uppercase text-emerald-700 dark:text-emerald-400">Disponible</p>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{formatMoney(detalleArea.monto_actual)}</p>
                  </div>
                </div>

                <div className="mt-3 w-full bg-theme-border/60 rounded-full h-2 overflow-hidden">
                  <div className={`h-full transition-all ${detalleArea.porcentaje_ejecucion > 80 ? 'bg-rose-500' : detalleArea.porcentaje_ejecucion > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${detalleArea.porcentaje_ejecucion}%` }} />
                </div>
              </div>

              {/* Desglose por Sección */}
              {detalleArea.secciones.length === 0 ? (
                <div className="card p-8 text-center">
                  <p className="text-sm text-theme-muted">No hay secciones con memorias registradas.</p>
                </div>
              ) : (
                detalleArea.secciones.map(seccion => {
                  const secExpanded = expandedSecciones.has(seccion.seccion_id);
                  const pctSec = parseFloat(seccion.total_presupuestado) > 0
                    ? Math.min(100, Math.round(parseFloat(seccion.total_gastado) / parseFloat(seccion.total_presupuestado) * 10000) / 100)
                    : 0;

                  return (
                    <div key={seccion.seccion_id} className="card overflow-hidden">
                      {/* Cabecera de sección */}
                      <button
                        onClick={() => toggleSeccion(seccion.seccion_id)}
                        className="w-full flex items-center gap-3 p-4 hover:bg-theme-border/20 transition-colors text-left"
                      >
                        <div className={`p-1.5 rounded-lg ${secExpanded ? 'bg-theme-primary/15 text-theme-primary' : 'bg-theme-border/60 text-theme-muted'}`}>
                          <Layers size={15} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-theme-main">{seccion.seccion_nombre}</span>
                            <span className="text-[10px] text-theme-muted">({seccion.memorias.length} memória{seccion.memorias.length !== 1 ? 's' : ''})</span>
                          </div>
                          <div className="flex items-center gap-4 mt-0.5 text-[11px]">
                            <span className="text-theme-muted">Presup: <strong className="text-theme-main">{formatMoney(seccion.total_presupuestado)}</strong></span>
                            <span className="text-rose-600 dark:text-rose-400">Gasto: <strong>{formatMoney(seccion.total_gastado)}</strong></span>
                            <span className="text-emerald-600 dark:text-emerald-400">Disp: <strong>{formatMoney(seccion.total_disponible)}</strong></span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`text-xs font-bold ${pctSec > 80 ? 'text-rose-600' : pctSec > 50 ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {pctSec}%
                          </span>
                        </div>
                        <ChevronDown size={16} className={`text-theme-muted transition-transform ${secExpanded ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Contenido expandido de sección */}
                      {secExpanded && (
                        <div className="border-t border-theme-border divide-y divide-theme-border/60">
                          {seccion.memorias.length === 0 ? (
                            <div className="p-6 text-center text-xs text-theme-muted">Sin memorias en esta sección.</div>
                          ) : (
                            seccion.memorias.map(memoria => {
                              const memExpanded = expandedMemorias.has(memoria.memoria_id);
                              return (
                                <div key={memoria.memoria_id}>
                                  {/* Cabecera de Memoria */}
                                  <button
                                    onClick={() => toggleMemoria(memoria.memoria_id)}
                                    className="w-full flex items-center gap-3 p-3.5 pl-8 hover:bg-theme-border/15 transition-colors text-left"
                                  >
                                    <FileText size={14} className="text-theme-muted shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-mono text-xs font-bold text-theme-main">{memoria.memoria_codigo}</span>
                                        {getBadgeEstado(memoria.estado)}
                                        <span className="text-[10px] text-theme-muted">{memoria.partidas.length} partida{memoria.partidas.length !== 1 ? 's' : ''}</span>
                                      </div>
                                      <p className="text-[11px] text-theme-muted mt-0.5 line-clamp-1">{memoria.justificacion}</p>
                                    </div>
                                    <div className="text-right text-[11px] shrink-0">
                                      <p className="text-theme-main font-semibold">{formatMoney(memoria.total_presupuestado)}</p>
                                      <p className="text-rose-600 dark:text-rose-400">{formatMoney(memoria.total_gastado)} gasto</p>
                                    </div>
                                    <ChevronDown size={14} className={`text-theme-muted transition-transform shrink-0 ${memExpanded ? 'rotate-180' : ''}`} />
                                  </button>

                                  {/* Partidas de la Memoria */}
                                  {memExpanded && (
                                    <div className="pl-12 pr-4 pb-3 space-y-2">
                                      {memoria.partidas.length === 0 ? (
                                        <p className="text-xs text-theme-muted py-2">Sin partidas asociadas.</p>
                                      ) : (
                                        memoria.partidas.map(partida => {
                                          const pKey = `${memoria.memoria_id}-${partida.partida_codigo}`;
                                          const prtExpanded = expandedPartidas.has(pKey);
                                          const pctP = parseFloat(partida.presupuestado) > 0
                                            ? Math.min(100, Math.round(parseFloat(partida.gastado) / parseFloat(partida.presupuestado) * 10000) / 100)
                                            : 0;

                                          return (
                                            <div key={pKey} className="border border-theme-border/80 rounded-xl overflow-hidden">
                                              <button
                                                onClick={() => togglePartida(pKey)}
                                                className="w-full flex items-center gap-3 p-3 hover:bg-theme-border/20 transition-colors text-left"
                                              >
                                                <div className="flex-1 min-w-0">
                                                  <div className="flex items-center gap-2">
                                                    <span className="font-mono text-[11px] font-bold text-theme-muted">{partida.partida_codigo}</span>
                                                    <span className="text-xs font-medium text-theme-main truncate">{partida.partida_nombre}</span>
                                                  </div>
                                                  <div className="flex items-center gap-3 mt-1 text-[10px]">
                                                    <span className="text-theme-muted">Presup: <strong className="text-theme-main">{formatMoney(partida.presupuestado)}</strong></span>
                                                    <span className="text-rose-600 dark:text-rose-400">Gasto: <strong>{formatMoney(partida.gastado)}</strong></span>
                                                    <span className="text-emerald-600 dark:text-emerald-400">Saldo: <strong>{formatMoney(partida.disponible)}</strong></span>
                                                  </div>
                                                  <div className="w-full bg-theme-border/60 rounded-full h-1 mt-1.5 overflow-hidden">
                                                    <div className={`h-full ${pctP > 80 ? 'bg-rose-500' : pctP > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                      style={{ width: `${pctP}%` }} />
                                                  </div>
                                                </div>
                                                <div className="shrink-0 flex items-center gap-2">
                                                  {partida.gastos_detalle.length > 0 && (
                                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                                                      {partida.gastos_detalle.length} gasto{partida.gastos_detalle.length !== 1 ? 's' : ''}
                                                    </span>
                                                  )}
                                                  <ChevronDown size={13} className={`text-theme-muted transition-transform ${prtExpanded ? 'rotate-180' : ''}`} />
                                                </div>
                                              </button>

                                              {/* Gastos individuales de la partida */}
                                              {prtExpanded && (
                                                <div className="border-t border-theme-border/60 bg-theme-base/60">
                                                  {partida.gastos_detalle.length === 0 ? (
                                                    <p className="p-4 text-xs text-center text-theme-muted">Sin gastos ejecutados en esta partida.</p>
                                                  ) : (
                                                    <table className="w-full text-xs border-collapse">
                                                      <thead>
                                                        <tr className="text-[10px] font-semibold uppercase text-theme-muted border-b border-theme-border/60">
                                                          <th className="py-2 px-3 text-left">Fecha</th>
                                                          <th className="py-2 px-3 text-left">Ítem / Descripción</th>
                                                          <th className="py-2 px-3 text-left">N° Comprobante</th>
                                                          <th className="py-2 px-3 text-left">Observación</th>
                                                          <th className="py-2 px-3 text-right">Monto</th>
                                                        </tr>
                                                      </thead>
                                                      <tbody className="divide-y divide-theme-border/40">
                                                        {partida.gastos_detalle.map(g => (
                                                          <tr key={g.gasto_id} className="hover:bg-theme-border/20">
                                                            <td className="py-2 px-3 font-mono text-theme-muted whitespace-nowrap">{g.fecha_gasto}</td>
                                                            <td className="py-2 px-3 text-theme-main font-medium">{g.item_descripcion}</td>
                                                            <td className="py-2 px-3 font-mono text-theme-muted">{g.comprobante || 'S/N'}</td>
                                                            <td className="py-2 px-3 text-theme-muted">{g.observacion || '—'}</td>
                                                            <td className="py-2 px-3 text-right font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                                                              {formatMoney(g.monto)}
                                                            </td>
                                                          </tr>
                                                        ))}
                                                      </tbody>
                                                      <tfoot>
                                                        <tr className="border-t border-theme-border/60 bg-theme-base">
                                                          <td colSpan={4} className="py-2 px-3 text-[10px] font-bold uppercase text-theme-muted text-right">Total gastado en partida:</td>
                                                          <td className="py-2 px-3 text-right font-bold text-rose-600 dark:text-rose-400 text-xs">{formatMoney(partida.gastado)}</td>
                                                        </tr>
                                                      </tfoot>
                                                    </table>
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
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

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
