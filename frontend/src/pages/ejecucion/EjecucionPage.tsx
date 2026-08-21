import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingDown,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  Layers,
  Trash2,
  WalletCards,
  FileText,
  DollarSign,
  PieChart,
  ArrowRight,
  ShieldCheck,
  Receipt,
  Check,
  Clock,
} from 'lucide-react';
import {
  Gestion,
  Gasto,
  PresupuestoArea,
  DetallePresupuestoMemoria,
  ResumenEjecucion,
  Area,
  getGestiones,
  getGastos,
  createGasto,
  deleteGasto,
  getPresupuestosArea,
  getDetallesPresupuesto,
  getResumenEjecucion,
  getAreas,
} from '../../services/presupuestoService';

export default function EjecucionPage() {
  const [gestiones, setGestiones] = useState<Gestion[]>([]);
  const [selectedGestionId, setSelectedGestionId] = useState<number | null>(null);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [presupuestosArea, setPresupuestosArea] = useState<PresupuestoArea[]>([]);
  const [detallesPresupuesto, setDetallesPresupuesto] = useState<DetallePresupuestoMemoria[]>([]);
  const [resumen, setResumen] = useState<ResumenEjecucion | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);

  const [activeTab, setActiveTab] = useState<'gastos' | 'areas' | 'partidas' | 'items'>('gastos');
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [filtroArea, setFiltroArea] = useState<string>('todas');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal Registro de Gasto
  const [showModalGasto, setShowModalGasto] = useState<boolean>(false);
  const [formGasto, setFormGasto] = useState<{
    detalleMemoriaId: number | '';
    monto: number | '';
    fecha: string;
    comprobante: string;
    observacion: string;
  }>({
    detalleMemoriaId: '',
    monto: '',
    fecha: new Date().toISOString().split('T')[0],
    comprobante: '',
    observacion: '',
  });

  useEffect(() => {
    cargarBase();
  }, []);

  useEffect(() => {
    if (selectedGestionId) {
      cargarDatosEjecucion(selectedGestionId);
    }
  }, [selectedGestionId]);

  async function cargarBase() {
    setLoading(true);
    try {
      const [gList, aList] = await Promise.all([getGestiones(), getAreas()]);
      setGestiones(gList);
      setAreas(aList);

      if (gList.length > 0) {
        const enEjecucionG = gList.find((g) => g.estado === 'EN_EJECUCION');
        setSelectedGestionId(enEjecucionG ? enEjecucionG.id : gList[0].id);
      }
    } catch (err) {
      console.error(err);
      mostrarMensaje('error', 'Error al cargar gestiones.');
    } finally {
      setLoading(false);
    }
  }

  async function cargarDatosEjecucion(gId: number) {
    try {
      const [listaGastos, techos, detalles, resData] = await Promise.all([
        getGastos({ gestion: gId }),
        getPresupuestosArea({ gestion: gId }),
        getDetallesPresupuesto({ gestion: gId }),
        getResumenEjecucion({ gestion: gId }).catch(() => null),
      ]);
      setGastos(Array.isArray(listaGastos) ? listaGastos : []);
      setPresupuestosArea(Array.isArray(techos) ? techos : []);
      setDetallesPresupuesto(Array.isArray(detalles) ? detalles : []);
      setResumen(resData);
    } catch (err) {
      console.error(err);
    }
  }

  function mostrarMensaje(type: 'success' | 'error', text: string) {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4000);
  }

  const activeGestion = useMemo(() => {
    return (Array.isArray(gestiones) ? gestiones : []).find((g) => g.id === selectedGestionId) || null;
  }, [gestiones, selectedGestionId]);

  const formatMoney = (val: number | string) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB', minimumFractionDigits: 2 }).format(num || 0);
  };

  // Métricas
  const totalInicial = useMemo(() => {
    return (Array.isArray(presupuestosArea) ? presupuestosArea : []).reduce(
      (acc, p) => acc + parseFloat(p.monto_inicial || '0'),
      0
    );
  }, [presupuestosArea]);

  const totalGastado = useMemo(() => {
    return (Array.isArray(gastos) ? gastos : []).reduce(
      (acc, g) => acc + parseFloat(String(g.monto_ejecutado) || '0'),
      0
    );
  }, [gastos]);

  const totalDisponible = useMemo(() => {
    return Math.max(0, totalInicial - totalGastado);
  }, [totalInicial, totalGastado]);

  const pctGlobal = useMemo(() => {
    if (totalInicial <= 0) return 0;
    return Math.min(100, Math.round((totalGastado / totalInicial) * 10000) / 100);
  }, [totalInicial, totalGastado]);

  // Ítems aprobados disponibles para ejecutar
  const renglonesDisponibles = useMemo(() => {
    return (Array.isArray(detallesPresupuesto) ? detallesPresupuesto : [])
      .filter((d) => ['APROBADO_FINANZAS', 'APROBADO_GERENCIA'].includes(d.memoria_estado || ''))
      .map((d) => {
        const totalItem = parseFloat(d.precio_total || '0');
        const gastado = parseFloat(d.monto_ejecutado || '0');
        const saldo = parseFloat(d.monto_disponible || String(Math.max(0, totalItem - gastado)));
        return {
          detalleId: d.id!,
          descripcion: d.descripcion,
          memoriaCodigo: d.memoria_codigo || '',
          areaNombre: d.area_nombre || '',
          partidaCodigo: d.partida_codigo || '',
          partidaNombre: d.partida_nombre || '',
          montoTotal: totalItem,
          montoGastado: gastado,
          saldoDisponible: saldo,
          estadoGasto: d.estado_ejecucion || 'PENDIENTE',
        };
      });
  }, [detallesPresupuesto]);

  const selectedItemForGasto = useMemo(() => {
    if (!formGasto.detalleMemoriaId) return null;
    return renglonesDisponibles.find((r) => r.detalleId === Number(formGasto.detalleMemoriaId)) || null;
  }, [formGasto.detalleMemoriaId, renglonesDisponibles]);

  // Guardar Gasto
  async function handleGuardarGasto(e: React.FormEvent) {
    e.preventDefault();
    if (!formGasto.detalleMemoriaId || !formGasto.monto || Number(formGasto.monto) <= 0) {
      mostrarMensaje('error', 'Seleccione un ítem presupuestario e indique un monto mayor a 0.');
      return;
    }

    setActionLoading(true);
    try {
      await createGasto({
        detalle_memoria: Number(formGasto.detalleMemoriaId),
        monto_ejecutado: Number(formGasto.monto),
        fecha_gasto: formGasto.fecha,
        comprobante_num: formGasto.comprobante,
        observacion: formGasto.observacion,
      });

      mostrarMensaje('success', 'Gasto ejecutado registrado. Presupuesto disponible actualizado en tiempo real.');
      setShowModalGasto(false);
      setFormGasto({
        detalleMemoriaId: '',
        monto: '',
        fecha: new Date().toISOString().split('T')[0],
        comprobante: '',
        observacion: '',
      });
      if (selectedGestionId) await cargarDatosEjecucion(selectedGestionId);
    } catch (err: any) {
      mostrarMensaje('error', err.response?.data?.monto_ejecutado?.[0] || 'Error al registrar el gasto.');
    } finally {
      setActionLoading(false);
    }
  }

  // Eliminar / Anular Gasto
  async function handleAnularGasto(id: number) {
    if (!confirm('¿Está seguro de anular este gasto? El saldo disponible será reintegrado automáticamente.')) return;
    try {
      await deleteGasto(id);
      mostrarMensaje('success', 'Gasto anulado y saldo reintegrado.');
      if (selectedGestionId) await cargarDatosEjecucion(selectedGestionId);
    } catch (err) {
      mostrarMensaje('error', 'Error al anular gasto.');
    }
  }

  // Gastos filtrados
  const gastosFiltrados = useMemo(() => {
    return (Array.isArray(gastos) ? gastos : []).filter((g) => {
      const matchArea = filtroArea === 'todas' || String(g.area_id) === filtroArea;
      const matchSearch =
        !searchTerm.trim() ||
        (g.comprobante_num && g.comprobante_num.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (g.observacion && g.observacion.toLowerCase().includes(searchTerm.toLowerCase())) ||
        g.area_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.detalle_descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.partida_codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.partida_nombre.toLowerCase().includes(searchTerm.toLowerCase());
      return matchArea && matchSearch;
    });
  }, [gastos, filtroArea, searchTerm]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Feedback */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between shadow-md ${feedbackMsg.type === 'success'
            ? 'bg-emerald-50 text-emerald-900 border border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-100 dark:border-emerald-800'
            : 'bg-rose-50 text-rose-900 border border-rose-200 dark:bg-rose-950/80 dark:text-rose-100 dark:border-rose-800'
            }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span className="text-sm font-medium">{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-xs opacity-75 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="card p-6 bg-gradient-to-r from-theme-surface via-theme-surface to-brand-50/20 dark:to-brand-900/10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
              <TrendingDown size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-theme-main tracking-tight">Módulo de Ejecución Presupuestaria</h1>
              <p className="text-sm text-theme-muted">
                Registro de facturas, control de gastos reales y deducción automática del presupuesto.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-theme-base/80 p-2 rounded-2xl border border-theme-border">
            <div className="flex items-center gap-2 px-3 py-1">
              <Calendar size={18} className="text-theme-muted" />
              <span className="text-xs font-semibold uppercase tracking-wider text-theme-muted">Gestión:</span>
              <select
                value={selectedGestionId || ''}
                onChange={(e) => setSelectedGestionId(Number(e.target.value))}
                className="bg-theme-surface font-bold text-sm px-3 py-1.5 rounded-xl border border-theme-border text-theme-main focus:outline-none"
              >
                {gestiones.map((g) => (
                  <option key={g.id} value={g.id}>
                    Gestión {g.anio} ({g.estado_display})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowModalGasto(true)}
              className="btn-primary text-xs font-semibold px-4 py-2 flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white"
            >
              <Plus size={15} /> Registrar Gasto Real
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-theme-muted">Presupuesto Asignado</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <DollarSign size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-theme-main mt-3 tracking-tight">{formatMoney(totalInicial)}</p>
          <p className="text-xs text-theme-muted mt-1">Techo consolidado de memorias</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-theme-muted">Gastos Ejecutados Reales</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <Receipt size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-3 tracking-tight">
            {formatMoney(totalGastado)}
          </p>
          <p className="text-xs text-theme-muted mt-1">{gastos.length} gasto(s) procesados</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-theme-muted">Saldo Disponible ($Monto\_Actual$)</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <WalletCards size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-3 tracking-tight">
            {formatMoney(totalDisponible)}
          </p>
          <p className="text-xs text-theme-muted mt-1">Fondos disponibles en tiempo real</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-theme-muted">% de Ejecución Global</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <PieChart size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-theme-main tracking-tight">{pctGlobal}%</span>
            <span className="text-xs text-theme-muted">ejecutado</span>
          </div>
          <div className="w-full bg-theme-border/60 rounded-full h-2 mt-2 overflow-hidden">
            <div
              className={`h-full ${pctGlobal > 85 ? 'bg-rose-500' : pctGlobal > 50 ? 'bg-amber-500' : 'bg-theme-primary'}`}
              style={{ width: `${pctGlobal}%` }}
            />
          </div>
        </div>
      </div>

      {/* Pestañas del Módulo de Ejecución */}
      <div className="flex border-b border-theme-border gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('gastos')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${activeTab === 'gastos' ? 'border-rose-500 text-rose-600 font-bold' : 'border-transparent text-theme-muted hover:text-theme-main'
            }`}
        >
          <Receipt size={16} /> 1. Historial de Gastos y Comprobantes ({gastos.length})
        </button>

        <button
          onClick={() => setActiveTab('areas')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${activeTab === 'areas' ? 'border-theme-primary text-theme-main font-bold' : 'border-transparent text-theme-muted hover:text-theme-main'
            }`}
        >
          <Building2 size={16} /> 2. Avance por Gerencia / Área ({presupuestosArea.length})
        </button>

        <button
          onClick={() => setActiveTab('items')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${activeTab === 'items' ? 'border-theme-primary text-theme-main font-bold' : 'border-transparent text-theme-muted hover:text-theme-main'
            }`}
        >
          <Layers size={16} /> 3. Control de Ítems Presupuestados ({renglonesDisponibles.length})
        </button>
      </div>

      {/* PESTAÑA 1: HISTORIAL DE GASTOS */}
      {activeTab === 'gastos' && (
        <div className="space-y-4">
          <div className="card p-4 flex flex-col md:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-muted" />
              <input
                type="text"
                placeholder="Buscar por comprobante, observación, área o partida..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-theme pl-10 text-xs"
              />
            </div>

            <select
              value={filtroArea}
              onChange={(e) => setFiltroArea(e.target.value)}
              className="input-theme text-xs py-2 w-full md:w-56"
            >
              <option value="todas">Todas las Áreas</option>
              {areas.map((a) => (
                <option key={a.id} value={String(a.id)}>
                  {a.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="card overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-theme-border bg-theme-base/60 text-xs font-semibold uppercase tracking-wider text-theme-muted">
                  <th className="py-3.5 px-4">Fecha</th>
                  <th className="py-3.5 px-4">N° Comprobante</th>
                  <th className="py-3.5 px-4">Área / Sección</th>
                  <th className="py-3.5 px-4">Partida Presupuestaria</th>
                  <th className="py-3.5 px-4">Ítem / Renglón Imputado</th>
                  <th className="py-3.5 px-4">Observación</th>
                  <th className="py-3.5 px-4 text-right">Monto Ejecutado</th>
                  <th className="py-3.5 px-4">Responsable</th>
                  <th className="py-3.5 px-4 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border">
                {gastosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-theme-muted">
                      <Receipt size={36} className="mx-auto mb-2 opacity-40" />
                      <p className="font-medium">No hay registros de gasto en esta gestión.</p>
                      <button
                        onClick={() => setShowModalGasto(true)}
                        className="btn-primary mt-3 text-xs bg-rose-600 hover:bg-rose-700 text-white"
                      >
                        Registrar Primer Gasto
                      </button>
                    </td>
                  </tr>
                ) : (
                  gastosFiltrados.map((g) => (
                    <tr key={g.id} className="hover:bg-theme-border/20 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-xs text-theme-muted whitespace-nowrap">{g.fecha_gasto}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-xs text-theme-main whitespace-nowrap">
                        {g.comprobante_num || 'S/N'}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-xs text-theme-main">{g.area_nombre}</p>
                        <p className="text-[11px] text-theme-muted">{g.seccion_nombre}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs font-bold text-theme-muted">{g.partida_codigo}</span>
                        <p className="text-[11px] text-theme-muted line-clamp-1">{g.partida_nombre}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
                          {g.memoria_codigo}
                        </span>
                        <p className="text-xs text-theme-main font-medium mt-1">{g.detalle_descripcion}</p>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs text-xs text-theme-muted">{g.observacion || '-'}</td>
                      <td className="py-3.5 px-4 text-right font-bold text-rose-600 dark:text-rose-400 text-sm whitespace-nowrap">
                        {formatMoney(g.monto_ejecutado)}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-theme-muted whitespace-nowrap">{g.usuario_nombre || 'Admin'}</td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleAnularGasto(g.id)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-500/10 transition-colors"
                          title="Anular gasto y restituir saldo"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: AVANCE POR GERENCIA / ÁREA */}
      {activeTab === 'areas' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {presupuestosArea.map((p) => {
            const inicial = parseFloat(p.monto_inicial || '0');
            const ejecutado = parseFloat(p.monto_ejecutado || '0');
            const actual = parseFloat(p.monto_actual || '0');
            const pct = p.porcentaje_ejecucion || 0;

            return (
              <div key={p.id} className="card p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                      {p.area_codigo}
                    </span>
                    <h3 className="text-base font-bold text-theme-main mt-1.5">{p.area_nombre}</h3>
                    <span className="text-xs text-theme-muted">{p.area_tipo}</span>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-theme-border text-theme-main">
                    {pct}% Ejecutado
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-theme-base border border-theme-border text-center">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-theme-muted block">Presupuesto Inicial</span>
                    <p className="font-bold text-xs text-theme-main mt-0.5">{formatMoney(inicial)}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-theme-muted block">Ejecutado</span>
                    <p className="font-bold text-xs text-rose-600 dark:text-rose-400 mt-0.5">{formatMoney(ejecutado)}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-theme-muted block">Disponible</span>
                    <p className="font-bold text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">{formatMoney(actual)}</p>
                  </div>
                </div>

                <div className="w-full bg-theme-border/60 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${pct > 80 ? 'bg-rose-500' : pct > 40 ? 'bg-amber-500' : 'bg-theme-primary'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PESTAÑA 3: CONTROL DE ÍTEMS DE MEMORIA */}
      {activeTab === 'items' && (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-theme-border bg-theme-base/60 text-xs font-semibold uppercase tracking-wider text-theme-muted">
                <th className="py-3.5 px-4">Memoria</th>
                <th className="py-3.5 px-4">Área</th>
                <th className="py-3.5 px-4">Partida</th>
                <th className="py-3.5 px-4">Descripción del Ítem</th>
                <th className="py-3.5 px-4 text-right">Presupuesto Ítem</th>
                <th className="py-3.5 px-4 text-right">Gastado</th>
                <th className="py-3.5 px-4 text-right">Saldo Restante</th>
                <th className="py-3.5 px-4 text-center">Estado Gasto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-border">
              {renglonesDisponibles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-theme-muted">
                    No hay ítems aprobados disponibles en esta gestión.
                  </td>
                </tr>
              ) : (
                renglonesDisponibles.map((r) => (
                  <tr key={r.detalleId} className="hover:bg-theme-border/20 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-xs text-theme-main">{r.memoriaCodigo}</td>
                    <td className="py-3.5 px-4 text-xs font-medium text-theme-main">{r.areaNombre}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-theme-muted">{r.partidaCodigo}</td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-theme-main">{r.descripcion}</td>
                    <td className="py-3.5 px-4 text-right font-medium text-xs text-theme-main">{formatMoney(r.montoTotal)}</td>
                    <td className="py-3.5 px-4 text-right font-medium text-xs text-rose-600 dark:text-rose-400">
                      {formatMoney(r.montoGastado)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-xs text-emerald-600 dark:text-emerald-400">
                      {formatMoney(r.saldoDisponible)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.estadoGasto === 'COMPLETADO'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : r.estadoGasto === 'EJECUTADO_PARCIAL'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                      >
                        {r.estadoGasto}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Registrar Gasto */}
      {showModalGasto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card w-full max-w-lg shadow-2xl bg-theme-surface">
            <div className="p-5 border-b border-theme-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="text-rose-500" size={22} />
                <h3 className="text-base font-bold text-theme-main">Registrar Gasto Real</h3>
              </div>
              <button onClick={() => setShowModalGasto(false)} className="text-theme-muted hover:text-theme-main font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarGasto} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold uppercase text-theme-muted mb-1">
                  Ítem / Renglón de Memoria Aprobada *
                </label>
                <select
                  required
                  value={formGasto.detalleMemoriaId}
                  onChange={(e) => setFormGasto({ ...formGasto, detalleMemoriaId: Number(e.target.value) })}
                  className="input-theme text-xs"
                >
                  <option value="">Seleccione ítem a imputar...</option>
                  {renglonesDisponibles.map((r) => (
                    <option key={r.detalleId} value={r.detalleId}>
                      [{r.memoriaCodigo}] {r.descripcion} • Saldo: {formatMoney(r.saldoDisponible)}
                    </option>
                  ))}
                </select>
              </div>

              {selectedItemForGasto && (
                <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-1">
                  <p className="font-semibold text-blue-900 dark:text-blue-200">
                    Área: {selectedItemForGasto.areaNombre} • Partida: {selectedItemForGasto.partidaCodigo}
                  </p>
                  <div className="flex justify-between text-[11px] text-blue-800 dark:text-blue-300">
                    <span>Total Presupuestado: {formatMoney(selectedItemForGasto.montoTotal)}</span>
                    <span className="font-bold">Saldo Disponible: {formatMoney(selectedItemForGasto.saldoDisponible)}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase text-theme-muted mb-1">Monto del Gasto (Bs.) *</label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="any"
                    placeholder="0.00"
                    value={formGasto.monto}
                    onChange={(e) => setFormGasto({ ...formGasto, monto: parseFloat(e.target.value) || '' })}
                    className="input-theme text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase text-theme-muted mb-1">Fecha del Gasto *</label>
                  <input
                    type="date"
                    required
                    value={formGasto.fecha}
                    onChange={(e) => setFormGasto({ ...formGasto, fecha: e.target.value })}
                    className="input-theme text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase text-theme-muted mb-1">N° Hoja de ruta</label>
                <input
                  type="text"
                  placeholder="Ej.TAMP-GEROP-XXXXX-2026"
                  value={formGasto.comprobante}
                  onChange={(e) => setFormGasto({ ...formGasto, comprobante: e.target.value })}
                  className="input-theme text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase text-theme-muted mb-1">Observación / Justificación</label>
                <textarea
                  rows={2}
                  placeholder="Detalle operativo del gasto incurrido..."
                  value={formGasto.observacion}
                  onChange={(e) => setFormGasto({ ...formGasto, observacion: e.target.value })}
                  className="input-theme text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-theme-border">
                <button
                  type="button"
                  onClick={() => setShowModalGasto(false)}
                  className="px-4 py-2 rounded-xl border border-theme-border text-xs font-semibold text-theme-muted hover:text-theme-main"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn-primary text-xs px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold"
                >
                  Registrar Gasto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
