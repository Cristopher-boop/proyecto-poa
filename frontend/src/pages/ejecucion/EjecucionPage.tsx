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
  Edit3,
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
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  Gestion,
  Gasto,
  PresupuestoArea,
  MemoriaCalculo,
  ResumenEjecucion,
  Area,
  getGestiones,
  getGastos,
  createGasto,
  updateGasto,
  deleteGasto,
  getPresupuestosArea,
  getMemorias,
  getResumenEjecucion,
  getAreas,
} from '../../services/presupuestoService';
import { useAuth } from '../../hooks/useAuth';

export default function EjecucionPage() {
  const { user } = useAuth();
  const rolName = user?.rol_nombre?.toUpperCase() || '';
  const isAprobador = user?.is_superuser || rolName === 'APROBADOR' || rolName === 'ADMINISTRADOR';
  const isGerente = rolName === 'GERENTE';
  const isElaborador = rolName === 'ELABORADOR';
  const isTrabajador = rolName === 'TRABAJADOR';

  const canExecuteGasto = isAprobador;

  const [gestiones, setGestiones] = useState<Gestion[]>([]);
  const [selectedGestionId, setSelectedGestionId] = useState<number | null>(null);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [presupuestosArea, setPresupuestosArea] = useState<PresupuestoArea[]>([]);
  const [memorias, setMemorias] = useState<MemoriaCalculo[]>([]);
  const [resumen, setResumen] = useState<ResumenEjecucion | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);

  const [activeTab, setActiveTab] = useState<'gastos' | 'areas' | 'partidas' | 'memorias'>('gastos');
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [filtroArea, setFiltroArea] = useState<string>('todas');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Paginación
  const PAGE_SIZE = 10;
  const [currentPageGastos, setCurrentPageGastos] = useState<number>(1);
  const [currentPageItems, setCurrentPageItems] = useState<number>(1);

  // Filtros y Expansión Pestaña 3 (Control de Ítems)
  const [searchItem, setSearchItem] = useState<string>('');
  const [filtroAreaItem, setFiltroAreaItem] = useState<string>('todas');
  const [filtroEstadoItem, setFiltroEstadoItem] = useState<string>('todos');
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});

  const toggleExpandItem = (detalleId: number) => {
    setExpandedItems((prev) => ({ ...prev, [detalleId]: !prev[detalleId] }));
  };

  // Modal Registro / Edición de Gasto
  const [showModalGasto, setShowModalGasto] = useState<boolean>(false);
  const [editingGastoId, setEditingGastoId] = useState<number | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [searchModalGeneral, setSearchModalGeneral] = useState<string>('');
  const [searchModalCodigo, setSearchModalCodigo] = useState<string>('');
  const [searchModalDinero, setSearchModalDinero] = useState<string>('');
  const [searchModalArea, setSearchModalArea] = useState<string>('todas');
  const [formGasto, setFormGasto] = useState<{
    memoria: number | '';
    monto: number | '';
    fecha: string;
    comprobante: string;
    observacion: string;
  }>({
    memoria: '',
    monto: '',
    fecha: new Date().toISOString().split('T')[0],
    comprobante: '',
    observacion: '',
  });

  function handleOpenCrearGasto() {
    handleOpenCrearGastoConItem();
  }

  function handleOpenCrearGastoConItem(memoriaId?: number) {
    setEditingGastoId(null);
    setModalError(null);
    setSearchModalGeneral('');
    setSearchModalCodigo('');
    setSearchModalDinero('');
    setSearchModalArea('todas');
    setFormGasto({
      memoria: memoriaId || '',
      monto: '',
      fecha: new Date().toISOString().split('T')[0],
      comprobante: '',
      observacion: '',
    });
    setShowModalGasto(true);
  }

  function handleOpenEditarGasto(gasto: Gasto) {
    setEditingGastoId(gasto.id);
    setModalError(null);
    setSearchModalGeneral('');
    setSearchModalCodigo('');
    setSearchModalDinero('');
    setSearchModalArea('todas');
    setFormGasto({
      memoria: gasto.memoria,
      monto: typeof gasto.monto_ejecutado === 'string' ? parseFloat(gasto.monto_ejecutado) : gasto.monto_ejecutado,
      fecha: gasto.fecha_gasto,
      comprobante: gasto.comprobante_num || '',
      observacion: gasto.observacion || '',
    });
    setShowModalGasto(true);
  }

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
      const [listaGastos, techos, memoriasData, resData] = await Promise.all([
        getGastos({ gestion: gId }),
        getPresupuestosArea({ gestion: gId }),
        getMemorias({ gestion: gId }),
        getResumenEjecucion({ gestion: gId }).catch(() => null),
      ]);
      setGastos(Array.isArray(listaGastos) ? listaGastos : []);
      setPresupuestosArea(Array.isArray(techos) ? techos : []);
      setMemorias(Array.isArray(memoriasData) ? memoriasData : []);
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

  const formatFechaDMY = (fechaStr?: string | null) => {
    if (!fechaStr) return '-';
    const clean = fechaStr.split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) {
      const [yyyy, mm, dd] = parts;
      if (yyyy.length === 4) {
        return `${dd}/${mm}/${yyyy}`;
      }
    }
    return fechaStr;
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

  // Memorias aprobadas disponibles para ejecutar
  const renglonesDisponibles = useMemo(() => {
    return (Array.isArray(memorias) ? memorias : [])
      .filter((m) => ['APROBADO_FINANZAS', 'APROBADO_GERENCIA'].includes(m.estado || ''))
      .map((m) => {
        const totalMemoria = parseFloat(m.total_presupuesto || '0');
        const gastado = parseFloat(m.total_ejecutado || '0');
        const saldo = parseFloat(m.total_disponible || String(Math.max(0, totalMemoria - gastado)));
        
        let estadoGasto = 'PENDIENTE';
        if (gastado > 0 && saldo > 0) estadoGasto = 'EJECUTADO_PARCIAL';
        if (saldo <= 0 && gastado > 0) estadoGasto = 'COMPLETADO';
        
        const partidasString = m.detalles?.map(d => d.partida_codigo || '').join(' ') || m.partida_codigo || '';
        
        return {
          memoriaId: m.id,
          codigo: m.codigo,
          areaNombre: m.area_nombre || '',
          seccionNombre: m.seccion_nombre || '',
          partidasString,
          montoTotal: totalMemoria,
          montoGastado: gastado,
          saldoDisponible: saldo,
          estadoGasto: estadoGasto,
          gastosList: gastos.filter(g => g.memoria === m.id)
        };
      });
  }, [memorias, gastos]);

  // Memorias filtradas en Pestaña 3
  const renglonesFiltrados = useMemo(() => {
    return renglonesDisponibles.filter((r) => {
      const matchArea = filtroAreaItem === 'todas' || r.areaNombre.toLowerCase() === filtroAreaItem.toLowerCase();
      const matchEstado = filtroEstadoItem === 'todos' || r.estadoGasto === filtroEstadoItem;
      const term = searchItem.toLowerCase().trim();
      const matchSearch =
        !term ||
        r.codigo.toLowerCase().includes(term) ||
        r.seccionNombre.toLowerCase().includes(term) ||
        r.areaNombre.toLowerCase().includes(term) ||
        r.partidasString.toLowerCase().includes(term);
      return matchArea && matchEstado && matchSearch;
    });
  }, [renglonesDisponibles, filtroAreaItem, filtroEstadoItem, searchItem]);

  // Memorias filtradas dentro del Modal de Registro de Gasto (Filtros divididos)
  const modalRenglonesFiltrados = useMemo(() => {
    return renglonesDisponibles.filter((r) => {
      // 0. Filtro por Área
      const matchArea = searchModalArea === 'todas' || r.areaNombre.toLowerCase() === searchModalArea.toLowerCase();

      // 1. Buscador General: SOLO sección, área o partida
      const termGen = searchModalGeneral.toLowerCase().trim();
      const matchGeneral =
        !termGen ||
        r.seccionNombre.toLowerCase().includes(termGen) ||
        r.areaNombre.toLowerCase().includes(termGen) ||
        r.partidasString.toLowerCase().includes(termGen);

      // 2. Filtro por Código: SOLO código de memoria
      const termCod = searchModalCodigo.toLowerCase().trim();
      const matchCodigo =
        !termCod ||
        r.codigo.toLowerCase().includes(termCod);

      // 3. Filtro por Dinero: busca saldo disponible numérico o valor
      const termDin = searchModalDinero.trim();
      let matchDinero = true;
      if (termDin) {
        const valDin = parseFloat(termDin);
        if (!isNaN(valDin)) {
          matchDinero = r.saldoDisponible >= valDin || String(r.saldoDisponible).includes(termDin);
        }
      }

      return matchArea && matchGeneral && matchCodigo && matchDinero;
    });
  }, [renglonesDisponibles, searchModalGeneral, searchModalCodigo, searchModalDinero, searchModalArea]);

  const selectedItemForGasto = useMemo(() => {
    if (!formGasto.memoria) return null;
    return renglonesDisponibles.find((r) => r.memoriaId === Number(formGasto.memoria)) || null;
  }, [formGasto.memoria, renglonesDisponibles]);

  // Guardar Gasto (Crear o Editar)
  async function handleGuardarGasto(e: React.FormEvent) {
    e.preventDefault();
    if (!formGasto.memoria || !formGasto.monto || Number(formGasto.monto) <= 0) {
      mostrarMensaje('error', 'Seleccione un ítem presupuestario e indique un monto mayor a 0.');
      return;
    }

    setActionLoading(true);
    try {
      if (editingGastoId) {
        await updateGasto(editingGastoId, {
          memoria: Number(formGasto.memoria),
          monto_ejecutado: Number(formGasto.monto),
          fecha_gasto: formGasto.fecha,
          comprobante_num: formGasto.comprobante,
          observacion: formGasto.observacion,
        });
        mostrarMensaje('success', `Gasto ejecutado actualizado a ${formatMoney(formGasto.monto)} correctamente.`);
      } else {
        await createGasto({
          memoria: Number(formGasto.memoria),
          monto_ejecutado: Number(formGasto.monto),
          fecha_gasto: formGasto.fecha,
          comprobante_num: formGasto.comprobante,
          observacion: formGasto.observacion,
        });
        mostrarMensaje('success', `Gasto por ${formatMoney(formGasto.monto)} registrado correctamente. Presupuesto disponible actualizado.`);
      }

      setModalError(null);
      setShowModalGasto(false);
      setEditingGastoId(null);
      setFormGasto({
        memoria: '',
        monto: '',
        fecha: new Date().toISOString().split('T')[0],
        comprobante: '',
        observacion: '',
      });
      if (selectedGestionId) await cargarDatosEjecucion(selectedGestionId);
    } catch (err: any) {
      const msg =
        err.response?.data?.monto_ejecutado?.[0] ||
        err.response?.data?.non_field_errors?.[0] ||
        err.response?.data?.error ||
        'Error al guardar el gasto. Verifique los datos ingresados.';
      setModalError(msg);
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

  // Reset de páginas al cambiar filtros o gestión
  useEffect(() => {
    setCurrentPageItems(1);
  }, [searchItem, filtroAreaItem, filtroEstadoItem, selectedGestionId]);

  useEffect(() => {
    setCurrentPageGastos(1);
  }, [searchTerm, filtroArea, selectedGestionId]);

  const totalPagesItems = Math.ceil(renglonesFiltrados.length / PAGE_SIZE);

  const renglonesPaginados = useMemo(() => {
    const start = (currentPageItems - 1) * PAGE_SIZE;
    return renglonesFiltrados.slice(start, start + PAGE_SIZE);
  }, [renglonesFiltrados, currentPageItems]);

  // Gastos filtrados
  const gastosFiltrados = useMemo(() => {
    return (Array.isArray(gastos) ? gastos : []).filter((g) => {
      const matchArea = filtroArea === 'todas' || String(g.area_id) === filtroArea;
      const matchSearch =
        !searchTerm.trim() ||
        (g.comprobante_num && g.comprobante_num.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (g.observacion && g.observacion.toLowerCase().includes(searchTerm.toLowerCase())) ||
        g.area_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.partida_codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.partida_nombre.toLowerCase().includes(searchTerm.toLowerCase());
      return matchArea && matchSearch;
    });
  }, [gastos, filtroArea, searchTerm]);

  const totalPagesGastos = Math.ceil(gastosFiltrados.length / PAGE_SIZE);

  const gastosPaginados = useMemo(() => {
    const start = (currentPageGastos - 1) * PAGE_SIZE;
    return gastosFiltrados.slice(start, start + PAGE_SIZE);
  }, [gastosFiltrados, currentPageGastos]);

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
                Registro y control de gastos y deducción automática del presupuesto.
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

            {canExecuteGasto && (
              <button
                onClick={handleOpenCrearGasto}
                className="btn-primary text-xs font-semibold px-4 py-2 flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white"
              >
                <Plus size={15} /> Registrar Gasto
              </button>
            )}
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
            <span className="text-xs font-semibold uppercase tracking-wider text-theme-muted">Gastos Ejecutados</span>
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
            <span className="text-xs font-semibold uppercase tracking-wider text-theme-muted">Saldo Disponible</span>
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
          <Receipt size={16} /> 1. Historial de Gastos ({gastosFiltrados.length})
        </button>

        <button
          onClick={() => setActiveTab('areas')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${activeTab === 'areas' ? 'border-theme-primary text-theme-main font-bold' : 'border-transparent text-theme-muted hover:text-theme-main'
            }`}
        >
          <Building2 size={16} /> 2. Avance por Gerencia / Área ({presupuestosArea.length})
        </button>

        <button
          onClick={() => setActiveTab('memorias')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${activeTab === 'memorias' ? 'border-theme-primary text-theme-main font-bold' : 'border-transparent text-theme-muted hover:text-theme-main'
            }`}
        >
          <Layers size={16} /> 3. Control de Memorias ({renglonesFiltrados.length})
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
                placeholder="Buscar por hoja de ruta, observación, área, partida o ítem..."
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

            {(searchTerm || filtroArea !== 'todas') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFiltroArea('todas');
                }}
                className="text-xs text-theme-primary font-bold hover:underline whitespace-nowrap px-2"
              >
                Limpiar Filtros
              </button>
            )}
          </div>

          <div className="card overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-theme-border bg-theme-base/60 text-xs font-semibold uppercase tracking-wider text-theme-muted">
                  <th className="py-3.5 px-4">N° Hoja de Ruta</th>
                  <th className="py-3.5 px-4">Área / Sección</th>
                  <th className="py-3.5 px-4">N° de Partida</th>
                  <th className="py-3.5 px-4">Memoria Imputada</th>
                  <th className="py-3.5 px-4">Observación</th>
                  <th className="py-3.5 px-4">Fecha</th>
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
                        onClick={handleOpenCrearGasto}
                        className="btn-primary mt-3 text-xs bg-rose-600 hover:bg-rose-700 text-white"
                      >
                        Registrar Primer Gasto
                      </button>
                    </td>
                  </tr>
                ) : (
                  gastosPaginados.map((g) => (
                    <tr key={g.id} className="hover:bg-theme-border/20 transition-colors">
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
                      </td>
                      <td className="py-3.5 px-4 max-w-xs text-xs text-theme-muted">{g.observacion || '-'}</td>
                      <td className="py-3.5 px-4 font-mono text-xs text-theme-muted whitespace-nowrap">
                        {formatFechaDMY(g.fecha_gasto)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-rose-600 dark:text-rose-400 text-sm whitespace-nowrap">
                        {formatMoney(g.monto_ejecutado)}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-theme-muted whitespace-nowrap">{g.usuario_nombre || 'Admin'}</td>
                      <td className="py-3.5 px-4 text-center">
                        {canExecuteGasto && (
                          <button
                            onClick={() => handleOpenEditarGasto(g)}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-500/10 transition-colors"
                            title="Editar datos de la ejecución"
                          >
                            <Edit3 size={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Paginación de Gastos */}
            {totalPagesGastos > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-theme-border">
                <p className="text-xs text-theme-muted">
                  Mostrando {(currentPageGastos - 1) * PAGE_SIZE + 1}–{Math.min(currentPageGastos * PAGE_SIZE, gastosFiltrados.length)} de {gastosFiltrados.length} gastos
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPageGastos((p) => Math.max(1, p - 1))}
                    disabled={currentPageGastos === 1}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-theme-border text-theme-muted hover:text-theme-main disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Anterior
                  </button>
                  {Array.from({ length: totalPagesGastos }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPagesGastos || Math.abs(p - currentPageGastos) <= 1)
                    .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                      if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...');
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, idx) =>
                      p === '...' ? (
                        <span key={`ellipsis-gastos-${idx}`} className="px-2 text-xs text-theme-muted">…</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setCurrentPageGastos(p as number)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${currentPageGastos === p
                            ? 'border-theme-primary bg-theme-primary text-white'
                            : 'border-theme-border text-theme-muted hover:text-theme-main'
                            }`}
                        >
                          {p}
                        </button>
                      )
                    )}
                  <button
                    onClick={() => setCurrentPageGastos((p) => Math.min(totalPagesGastos, p + 1))}
                    disabled={currentPageGastos === totalPagesGastos}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-theme-border text-theme-muted hover:text-theme-main disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Siguiente →
                  </button>
                </div>
              </div>
            )}
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

      {/* PESTAÑA 3: CONTROL DE MEMORIAS */}
      {activeTab === 'memorias' && (
        <div className="space-y-4">
          {/* Barra de Filtros de Memorias */}
          <div className="card p-4 flex flex-col md:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-muted" />
              <input
                type="text"
                placeholder="Buscar por código de memoria, sección o área..."
                value={searchItem}
                onChange={(e) => setSearchItem(e.target.value)}
                className="input-theme pl-10 text-xs"
              />
            </div>

            <select
              value={filtroAreaItem}
              onChange={(e) => setFiltroAreaItem(e.target.value)}
              className="input-theme text-xs py-2 w-full md:w-52"
            >
              <option value="todas">Todas las Áreas</option>
              {areas.map((a) => (
                <option key={a.id} value={a.nombre}>
                  {a.nombre}
                </option>
              ))}
            </select>

            <select
              value={filtroEstadoItem}
              onChange={(e) => setFiltroEstadoItem(e.target.value)}
              className="input-theme text-xs py-2 w-full md:w-52"
            >
              <option value="todos">Todos los Estados</option>
              <option value="PENDIENTE">Pendientes</option>
              <option value="EJECUTADO_PARCIAL">Ejecutados Parciales</option>
              <option value="COMPLETADO">Completados</option>
            </select>

            {(searchItem || filtroAreaItem !== 'todas' || filtroEstadoItem !== 'todos') && (
              <button
                onClick={() => {
                  setSearchItem('');
                  setFiltroAreaItem('todas');
                  setFiltroEstadoItem('todos');
                }}
                className="text-xs text-theme-primary font-bold hover:underline whitespace-nowrap px-2"
              >
                Limpiar Filtros
              </button>
            )}
          </div>

          {/* Tabla de Memorias */}
          <div className="card overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-theme-border bg-theme-base/60 text-xs font-semibold uppercase tracking-wider text-theme-muted">
                  <th className="py-3.5 px-4">Código Memoria</th>
                  <th className="py-3.5 px-4">Área / Sección</th>
                  <th className="py-3.5 px-4 text-right">Presupuesto</th>
                  <th className="py-3.5 px-4 text-right">Gastado</th>
                  <th className="py-3.5 px-4 text-right">Saldo Restante</th>
                  <th className="py-3.5 px-4 text-center">Estado Gasto</th>
                  <th className="py-3.5 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border">
                {renglonesFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-theme-muted">
                      No hay memorias aprobadas que coincidan con los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  renglonesPaginados.map((r) => {
                    const isExpanded = !!expandedItems[r.memoriaId];
                    return (
                      <React.Fragment key={r.memoriaId}>
                        <tr className="hover:bg-theme-border/20 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-xs text-theme-main">{r.codigo}</td>
                          <td className="py-3.5 px-4 text-xs font-medium text-theme-main">
                            <p className="font-semibold">{r.areaNombre}</p>
                            <p className="text-[11px] text-theme-muted">{r.seccionNombre}</p>
                          </td>
                          <td className="py-3.5 px-4 text-right font-medium text-xs text-theme-main">{formatMoney(r.montoTotal)}</td>
                          <td className="py-3.5 px-4 text-right font-medium text-xs text-rose-600 dark:text-rose-400">
                            {formatMoney(r.montoGastado)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-xs text-emerald-600 dark:text-emerald-400">
                            {formatMoney(r.saldoDisponible)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                r.estadoGasto === 'COMPLETADO'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : r.estadoGasto === 'EJECUTADO_PARCIAL'
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              }`}
                            >
                              {r.estadoGasto}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Botón Acordeón Ver Gastos */}
                              <button
                                onClick={() => toggleExpandItem(r.memoriaId)}
                                className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                                  isExpanded
                                    ? 'bg-theme-primary/15 text-theme-primary'
                                    : 'bg-theme-base border border-theme-border text-theme-muted hover:text-theme-main'
                                }`}
                                title="Ver historial de ejecuciones/gastos de esta memoria"
                              >
                                {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                <span>{r.gastosList.length} gasto(s)</span>
                              </button>

                              {/* Botón Directo + Registrar Gasto */}
                              {canExecuteGasto && (
                                <button
                                  onClick={() => handleOpenCrearGastoConItem(r.memoriaId)}
                                  disabled={r.saldoDisponible <= 0}
                                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                                  title={r.saldoDisponible <= 0 ? 'Sin saldo disponible en esta memoria' : 'Registrar nuevo gasto en esta memoria'}
                                >
                                  <Plus size={13} />
                                  <span>Gasto</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Fila desplegable con el historial de gastos parciales */}
                        {isExpanded && (
                          <tr className="bg-theme-base/40 border-b border-theme-border">
                            <td colSpan={7} className="p-4">
                              <div className="p-4 rounded-xl border border-theme-border bg-theme-surface space-y-3 shadow-inner">
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-theme-border pb-2.5">
                                  <h4 className="text-xs font-bold text-theme-main flex items-center gap-2">
                                    <Receipt size={16} className="text-rose-500" />
                                    Gastos de la Memoria: <span className="font-mono text-theme-primary">{r.codigo}</span>
                                  </h4>
                                  <div className="flex items-center gap-3 text-xs">
                                    <span className="text-theme-muted">
                                      Gastos Registrados: <strong className="text-theme-main">{r.gastosList.length}</strong>
                                    </span>
                                    <span className="text-theme-muted">
                                      Saldo Restante: <strong className="text-emerald-600 dark:text-emerald-400">{formatMoney(r.saldoDisponible)}</strong>
                                    </span>
                                  </div>
                                </div>

                                {r.gastosList.length === 0 ? (
                                  <p className="text-xs text-theme-muted italic py-3 text-center">
                                    No hay gastos registrados para esta memoria todavía.
                                  </p>
                                ) : (
                                  <div className="overflow-x-auto rounded-lg border border-theme-border">
                                    <table className="w-full text-left text-xs">
                                      <thead>
                                        <tr className="bg-theme-base border-b border-theme-border text-[11px] font-semibold text-theme-muted uppercase">
                                          <th className="py-2.5 px-3">Fecha Gasto</th>
                                          <th className="py-2.5 px-3">N° Hoja de Ruta</th>
                                          <th className="py-2.5 px-3">Observación / Justificación</th>
                                          <th className="py-2.5 px-3">Registrado Por</th>
                                          <th className="py-2.5 px-3 text-right">Monto Ejecutado</th>
                                          <th className="py-2.5 px-3 text-center">Acción</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-theme-border/60">
                                        {r.gastosList.map((g) => (
                                          <tr key={g.id} className="hover:bg-theme-base/60 transition-colors">
                                            <td className="py-2.5 px-3 font-mono text-theme-muted">{formatFechaDMY(g.fecha_gasto)}</td>
                                            <td className="py-2.5 px-3 font-mono font-bold text-theme-main">{g.comprobante_num || 'S/N'}</td>
                                            <td className="py-2.5 px-3 text-theme-muted max-w-xs truncate">{g.observacion || '-'}</td>
                                            <td className="py-2.5 px-3 text-theme-muted">{g.usuario_nombre || 'Admin'}</td>
                                            <td className="py-2.5 px-3 text-right font-bold text-rose-600 dark:text-rose-400">
                                              {formatMoney(g.monto_ejecutado)}
                                            </td>
                                            <td className="py-2.5 px-3 text-center">
                                              {canExecuteGasto && (
                                                <button
                                                  onClick={() =>
                                                    handleOpenEditarGasto({
                                                      id: g.id,
                                                      monto_ejecutado: g.monto_ejecutado,
                                                      fecha_gasto: g.fecha_gasto,
                                                      comprobante_num: g.comprobante_num,
                                                      observacion: g.observacion,
                                                      memoria: r.memoriaId,
                                                      memoria_codigo: r.codigo,
                                                      partida_id: 0,
                                                      partida_codigo: '',
                                                      partida_nombre: '',
                                                      area_id: 0,
                                                      area_nombre: r.areaNombre,
                                                      seccion_nombre: r.seccionNombre,
                                                      gestion_id: 0,
                                                      gestion_anio: 0,
                                                      usuario_registro: 0,
                                                      usuario_nombre: g.usuario_nombre,
                                                      created_at: '',
                                                    } as any)
                                                  }
                                                  className="p-1 rounded text-blue-600 hover:bg-blue-500/10 transition-colors"
                                                  title="Editar este gasto parcial"
                                                >
                                                  <Edit3 size={14} />
                                                </button>
                                              )}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Paginación de Ítems */}
            {totalPagesItems > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-theme-border">
                <p className="text-xs text-theme-muted">
                  Mostrando {(currentPageItems - 1) * PAGE_SIZE + 1}–{Math.min(currentPageItems * PAGE_SIZE, renglonesFiltrados.length)} de {renglonesFiltrados.length} ítems
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPageItems((p) => Math.max(1, p - 1))}
                    disabled={currentPageItems === 1}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-theme-border text-theme-muted hover:text-theme-main disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Anterior
                  </button>
                  {Array.from({ length: totalPagesItems }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPagesItems || Math.abs(p - currentPageItems) <= 1)
                    .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                      if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...');
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, idx) =>
                      p === '...' ? (
                        <span key={`ellipsis-items-${idx}`} className="px-2 text-xs text-theme-muted">…</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setCurrentPageItems(p as number)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${currentPageItems === p
                            ? 'border-theme-primary bg-theme-primary text-white'
                            : 'border-theme-border text-theme-muted hover:text-theme-main'
                            }`}
                        >
                          {p}
                        </button>
                      )
                    )}
                  <button
                    onClick={() => setCurrentPageItems((p) => Math.min(totalPagesItems, p + 1))}
                    disabled={currentPageItems === totalPagesItems}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-theme-border text-theme-muted hover:text-theme-main disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Siguiente →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Registrar Gasto */}
      {showModalGasto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl bg-theme-surface overflow-hidden">
            {/* Header Fijo */}
            <div className="p-5 border-b border-theme-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <TrendingDown className="text-rose-500" size={22} />
                <h3 className="text-base font-bold text-theme-main">
                  {editingGastoId ? 'Editar Gasto Ejecutado' : 'Registrar Gasto'}
                </h3>
              </div>
              <button onClick={() => setShowModalGasto(false)} className="text-theme-muted hover:text-theme-main font-bold">
                ✕
              </button>
            </div>

            {/* Formulario con cuerpo con Scroll y Footer Fijo */}
            <form onSubmit={handleGuardarGasto} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Cuerpo scrolleable del formulario */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">

                {/* ── Banner de error dentro del modal ─────────────────── */}
                {modalError && (
                  <div className="flex items-start gap-3 p-3.5 rounded-xl border border-rose-300 bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:border-rose-700 dark:text-rose-200 shadow-sm">
                    <AlertCircle size={18} className="mt-0.5 shrink-0 text-rose-500" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs mb-0.5">No se pudo guardar el gasto</p>
                      <p className="text-xs leading-relaxed">{modalError}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setModalError(null)}
                      className="shrink-0 text-rose-400 hover:text-rose-700 transition-colors text-base leading-none"
                      title="Cerrar alerta"
                    >
                      ✕
                    </button>
                  </div>
                )}
                {/* ──────────────────────────────────────────────────────── */}

                <div>
                  <label className="block font-semibold uppercase text-theme-muted mb-1.5">
                    Seleccionar Memoria Aprobada *
                  </label>

                  {/* 4 Filtros Divididos */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-2">
                    {/* 0. Filtro por Área */}
                    <div className="relative">
                      <Building2 size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-theme-muted" />
                      <select
                        value={searchModalArea}
                        onChange={(e) => setSearchModalArea(e.target.value)}
                        className="input-theme pl-8 py-1.5 text-[11px]"
                        title="Filtra por Gerencia/Área"
                      >
                        <option value="todas">Todas las Áreas</option>
                        {areas.map((a) => (
                          <option key={a.id} value={a.nombre}>
                            {a.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 1. Buscador General: Descripción / Área */}
                    <div className="relative">
                      <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-theme-muted" />
                      <input
                        type="text"
                        placeholder="General (sección/partida)..."
                        value={searchModalGeneral}
                        onChange={(e) => setSearchModalGeneral(e.target.value)}
                        className="input-theme pl-8 py-1.5 text-[11px]"
                        title="Busca por sección o partida"
                      />
                    </div>

                    {/* 2. Filtro por Código */}
                    <div className="relative">
                      <FileText size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-theme-muted" />
                      <input
                        type="text"
                        placeholder="Código Memoria..."
                        value={searchModalCodigo}
                        onChange={(e) => setSearchModalCodigo(e.target.value)}
                        className="input-theme pl-8 py-1.5 text-[11px] font-mono"
                        title="Busca por código de memoria"
                      />
                    </div>

                    {/* 3. Filtro por Dinero (Saldo) */}
                    <div className="relative">
                      <DollarSign size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-600 dark:text-emerald-400" />
                      <input
                        type="number"
                        step="any"
                        placeholder="Saldo mín. (Bs.)..."
                        value={searchModalDinero}
                        onChange={(e) => setSearchModalDinero(e.target.value)}
                        className="input-theme pl-8 py-1.5 text-[11px] font-mono"
                        title="Filtra memorias con saldo disponible mínimo"
                      />
                    </div>
                  </div>

                  {(searchModalGeneral || searchModalCodigo || searchModalDinero || searchModalArea !== 'todas') && (
                    <div className="flex justify-end mb-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSearchModalGeneral('');
                          setSearchModalCodigo('');
                          setSearchModalDinero('');
                          setSearchModalArea('todas');
                        }}
                        className="text-[10px] text-theme-primary font-bold hover:underline"
                      >
                        Limpiar Filtros del Modal
                      </button>
                    </div>
                  )}

                  {/* Selector visual de opciones filtradas */}
                  <div className="max-h-40 overflow-y-auto rounded-xl border border-theme-border bg-theme-base divide-y divide-theme-border/60">
                    {modalRenglonesFiltrados.length === 0 ? (
                      <div className="p-3 text-center text-theme-muted text-xs">
                        No hay memorias que coincidan con los filtros aplicados.
                      </div>
                    ) : (
                      modalRenglonesFiltrados.map((r) => {
                        const isSelected = formGasto.memoria === r.memoriaId;
                        const isDisabled = r.saldoDisponible <= 0 && !editingGastoId && !isSelected;

                        return (
                          <div
                            key={r.memoriaId}
                            onClick={() => {
                              if (!isDisabled) {
                                setFormGasto({ ...formGasto, memoria: r.memoriaId });
                              }
                            }}
                            className={`p-2.5 flex items-center justify-between text-xs transition-colors ${
                              isDisabled
                                ? 'opacity-40 bg-theme-base/50 cursor-not-allowed select-none'
                                : isSelected
                                  ? 'bg-rose-500/10 border-l-4 border-rose-500 text-theme-main font-semibold cursor-pointer'
                                  : 'hover:bg-theme-border/30 text-theme-main cursor-pointer'
                            }`}
                          >
                            <div className="min-w-0 flex-1 pr-3">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-mono font-bold text-[11px] text-theme-primary px-1.5 py-0.5 rounded bg-theme-primary/10">
                                  {r.codigo}
                                </span>
                                {isDisabled && (
                                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                                    Sin saldo disponible
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-theme-main font-medium mt-1 truncate">
                                {r.areaNombre} - {r.seccionNombre}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-[10px] text-theme-muted uppercase block">Saldo</span>
                              <span className={`font-bold text-xs ${r.saldoDisponible <= 0 ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                {formatMoney(r.saldoDisponible)}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {selectedItemForGasto && (
                  <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-1">
                    <p className="font-semibold text-blue-900 dark:text-blue-200">
                      Memoria: {selectedItemForGasto.codigo} • Área: {selectedItemForGasto.areaNombre}
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
              </div>

              {/* Footer Fijo con Botón de Guardar y Cancelar siempre visibles */}
              <div className="p-4 border-t border-theme-border flex justify-end gap-3 shrink-0 bg-theme-surface">
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
                  {editingGastoId ? 'Guardar Cambios' : 'Registrar Gasto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
