import React, { useState, useEffect, useMemo } from 'react';
import {
  WalletCards,
  Plus,
  Lock,
  Unlock,
  Play,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  AlertCircle,
  FileText,
  DollarSign,
  TrendingDown,
  Building2,
  Calendar,
  Layers,
  Eye,
  Trash2,
  Edit3,
  HelpCircle,
  ChevronRight,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import {
  Gestion,
  PresupuestoArea,
  MemoriaCalculo,
  Gasto,
  Partida,
  Area,
  Seccion,
  getGestiones,
  createGestion,
  cerrarFormulacionGestion,
  pasarAEjecucionGestion,
  reabrirFormulacionGestion,
  consolidarPresupuestosGestion,
  getPresupuestosArea,
  getResumenGestion,
  getMemorias,
  createMemoria,
  updateMemoria,
  deleteMemoria,
  enviarMemoriaGerencia,
  aprobarMemoriaGerencia,
  aprobarMemoriaFinanzas,
  rechazarMemoria,
  volverMemoriaBorrador,
  getGastos,
  createGasto,
  deleteGasto,
  getPartidas,
  getAreas,
  getSecciones,
} from '../../services/presupuestoService';

export default function PresupuestosPage() {
  // ── Estados Principales ────────────────────────────────────────────────────
  const [gestiones, setGestiones] = useState<Gestion[]>([]);
  const [selectedGestionId, setSelectedGestionId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'techos' | 'memorias' | 'ejecucion'>('techos');
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ── Datos de la Gestión Activa ─────────────────────────────────────────────
  const [presupuestosArea, setPresupuestosArea] = useState<PresupuestoArea[]>([]);
  const [memorias, setMemorias] = useState<MemoriaCalculo[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [secciones, setSecciones] = useState<Seccion[]>([]);

  // ── Filtros ────────────────────────────────────────────────────────────────
  const [filtroArea, setFiltroArea] = useState<string>('todas');
  const [filtroEstadoMemoria, setFiltroEstadoMemoria] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // ── Modales ────────────────────────────────────────────────────────────────
  const [showModalGestion, setShowModalGestion] = useState<boolean>(false);
  const [nuevoAnio, setNuevoAnio] = useState<number>(new Date().getFullYear() + 1);

  const [showModalMemoria, setShowModalMemoria] = useState<boolean>(false);
  const [editingMemoria, setEditingMemoria] = useState<MemoriaCalculo | null>(null);
  const [showDetalleMemoriaModal, setShowDetalleMemoriaModal] = useState<MemoriaCalculo | null>(null);

  const [showModalGasto, setShowModalGasto] = useState<boolean>(false);
  const [showModalConfirmCierre, setShowModalConfirmCierre] = useState<boolean>(false);

  // ── Formulario Memoria ─────────────────────────────────────────────────────
  const [formMemoria, setFormMemoria] = useState<{
    codigo: string;
    seccionId: number | '';
    justificacion: string;
    partidaId: number | '';
    renglones: Array<{
      descripcion: string;
      unidad_medida: string;
      cantidad: number;
      precio_unitario: number;
    }>;
  }>({
    codigo: '',
    seccionId: '',
    justificacion: '',
    partidaId: '',
    renglones: [{ descripcion: '', unidad_medida: 'UNIDAD', cantidad: 1, precio_unitario: 0 }],
  });

  const [searchPartidaQuery, setSearchPartidaQuery] = useState<string>('');

  // ── Formulario Gasto ───────────────────────────────────────────────────────
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

  // ── Carga Inicial ──────────────────────────────────────────────────────────
  useEffect(() => {
    cargarGestionesYBase();
  }, []);

  useEffect(() => {
    if (selectedGestionId) {
      cargarDatosGestion(selectedGestionId);
    }
  }, [selectedGestionId]);

  async function cargarGestionesYBase() {
    setLoading(true);
    try {
      const [listaGestiones, listaPartidas, listaAreas, listaSecciones] = await Promise.all([
        getGestiones(),
        getPartidas(),
        getAreas(),
        getSecciones(),
      ]);

      setGestiones(Array.isArray(listaGestiones) ? listaGestiones : []);
      setPartidas(Array.isArray(listaPartidas) ? listaPartidas : []);
      setAreas(Array.isArray(listaAreas) ? listaAreas : []);
      setSecciones(Array.isArray(listaSecciones) ? listaSecciones : []);

      if (Array.isArray(listaGestiones) && listaGestiones.length > 0) {
        const formulacionG = listaGestiones.find((g) => g.estado === 'FORMULACION');
        const defaultG = formulacionG || listaGestiones[0];
        setSelectedGestionId(defaultG.id);
      }
    } catch (err) {
      console.error(err);
      mostrarMensaje('error', 'Error al cargar gestiones o catálogos base.');
    } finally {
      setLoading(false);
    }
  }

  async function cargarDatosGestion(gestionId: number) {
    try {
      const [techos, mems, listaGastos] = await Promise.all([
        getPresupuestosArea({ gestion: gestionId }),
        getMemorias({ gestion: gestionId }),
        getGastos({ gestion: gestionId }),
      ]);
      setPresupuestosArea(Array.isArray(techos) ? techos : []);
      setMemorias(Array.isArray(mems) ? mems : []);
      setGastos(Array.isArray(listaGastos) ? listaGastos : []);
    } catch (err) {
      console.error(err);
      mostrarMensaje('error', 'Error al cargar los datos de la gestión.');
    }
  }

  function mostrarMensaje(type: 'success' | 'error', text: string) {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 5000);
  }

  const activeGestion = useMemo(() => {
    if (!Array.isArray(gestiones)) return null;
    return gestiones.find((g) => g.id === selectedGestionId) || null;
  }, [gestiones, selectedGestionId]);

  // ── Cálculos Globales ──────────────────────────────────────────────────────
  const totalPresupuestoInicial = useMemo(() => {
    return presupuestosArea.reduce((acc, p) => acc + parseFloat(p.monto_inicial || '0'), 0);
  }, [presupuestosArea]);

  const totalGastosEjecutados = useMemo(() => {
    return gastos.reduce((acc, g) => acc + parseFloat(String(g.monto_ejecutado) || '0'), 0);
  }, [gastos]);

  const totalPresupuestoDisponible = useMemo(() => {
    return Math.max(0, totalPresupuestoInicial - totalGastosEjecutados);
  }, [totalPresupuestoInicial, totalGastosEjecutados]);

  const porcentajeGlobalEjecucion = useMemo(() => {
    if (totalPresupuestoInicial <= 0) return 0;
    return Math.min(100, Math.round((totalGastosEjecutados / totalPresupuestoInicial) * 10000) / 100);
  }, [totalPresupuestoInicial, totalGastosEjecutados]);

  // ── Partidas Filtradas para Selector ───────────────────────────────────────
  const filteredPartidas = useMemo(() => {
    if (!searchPartidaQuery.trim()) return partidas.slice(0, 15);
    const q = searchPartidaQuery.toLowerCase();
    return partidas
      .filter((p) => p.codigo.toLowerCase().includes(q) || p.nombre.toLowerCase().includes(q))
      .slice(0, 25);
  }, [partidas, searchPartidaQuery]);

  // ── Acciones de Gestión ────────────────────────────────────────────────────
  async function handleCrearGestion(e: React.FormEvent) {
    e.preventDefault();
    setActionLoading(true);
    try {
      const nueva = await createGestion({ anio: Number(nuevoAnio), estado: 'FORMULACION' });
      setGestiones([nueva, ...gestiones]);
      setSelectedGestionId(nueva.id);
      setShowModalGestion(false);
      mostrarMensaje('success', `Gestión ${nueva.anio} creada exitosamente.`);
    } catch (err: any) {
      mostrarMensaje('error', err.response?.data?.anio?.[0] || 'Error al crear la gestión.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCerrarFormulacion() {
    if (!selectedGestionId) return;
    setActionLoading(true);
    try {
      const res = await cerrarFormulacionGestion(selectedGestionId);
      mostrarMensaje('success', res.message);
      setShowModalConfirmCierre(false);
      await cargarGestionesYBase();
      if (selectedGestionId) await cargarDatosGestion(selectedGestionId);
    } catch (err: any) {
      mostrarMensaje('error', err.response?.data?.error || 'Error al cerrar formulación.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handlePasarAEjecucion() {
    if (!selectedGestionId) return;
    setActionLoading(true);
    try {
      const res = await pasarAEjecucionGestion(selectedGestionId);
      mostrarMensaje('success', res.message);
      await cargarGestionesYBase();
      if (selectedGestionId) await cargarDatosGestion(selectedGestionId);
    } catch (err: any) {
      mostrarMensaje('error', 'Error al pasar a ejecución.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReabrirFormulacion() {
    if (!selectedGestionId) return;
    setActionLoading(true);
    try {
      const res = await reabrirFormulacionGestion(selectedGestionId);
      mostrarMensaje('success', res.message);
      await cargarGestionesYBase();
      if (selectedGestionId) await cargarDatosGestion(selectedGestionId);
    } catch (err: any) {
      mostrarMensaje('error', 'Error al reabrir formulación.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleConsolidarPresupuestos() {
    if (!selectedGestionId) return;
    setActionLoading(true);
    try {
      const res = await consolidarPresupuestosGestion(selectedGestionId);
      mostrarMensaje('success', res.message);
      await cargarDatosGestion(selectedGestionId);
    } catch (err: any) {
      mostrarMensaje('error', 'Error al consolidar presupuestos.');
    } finally {
      setActionLoading(false);
    }
  }

  // ── Acciones de Memorias de Cálculo ────────────────────────────────────────
  function handleOpenCrearMemoria() {
    const defaultSeccion = secciones[0]?.id || '';
    const anioActual = activeGestion?.anio || new Date().getFullYear();
    const correlativo = String(memorias.length + 1).padStart(3, '0');
    setEditingMemoria(null);
    setFormMemoria({
      codigo: `MEM-${anioActual}-${correlativo}`,
      seccionId: defaultSeccion,
      justificacion: '',
      partidaId: partidas[0]?.id || '',
      renglones: [{ descripcion: '', unidad_medida: 'UNIDAD', cantidad: 1, precio_unitario: 0 }],
    });
    setSearchPartidaQuery('');
    setShowModalMemoria(true);
  }

  function handleOpenEditarMemoria(mem: MemoriaCalculo) {
    setEditingMemoria(mem);
    setFormMemoria({
      codigo: mem.codigo,
      seccionId: mem.seccion,
      justificacion: mem.justificacion,
      partidaId: mem.partida_id || partidas[0]?.id || '',
      renglones: mem.detalles.map((d) => ({
        descripcion: d.descripcion,
        unidad_medida: d.unidad_medida,
        cantidad: Number(d.cantidad),
        precio_unitario: Number(d.precio_unitario),
      })),
    });
    setSearchPartidaQuery('');
    setShowModalMemoria(true);
  }

  function handleAddRenglon() {
    setFormMemoria({
      ...formMemoria,
      renglones: [
        ...formMemoria.renglones,
        { descripcion: '', unidad_medida: 'UNIDAD', cantidad: 1, precio_unitario: 0 },
      ],
    });
  }

  function handleRemoveRenglon(index: number) {
    if (formMemoria.renglones.length <= 1) return;
    const nuevos = formMemoria.renglones.filter((_, i) => i !== index);
    setFormMemoria({ ...formMemoria, renglones: nuevos });
  }

  function handleUpdateRenglon(index: number, field: string, value: any) {
    const nuevos = [...formMemoria.renglones];
    nuevos[index] = { ...nuevos[index], [field]: value };
    setFormMemoria({ ...formMemoria, renglones: nuevos });
  }

  const totalCalculadoMemoria = useMemo(() => {
    return formMemoria.renglones.reduce((acc, r) => {
      const cant = Number(r.cantidad) || 0;
      const pu = Number(r.precio_unitario) || 0;
      return acc + cant * pu;
    }, 0);
  }, [formMemoria.renglones]);

  async function handleGuardarMemoria(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedGestionId || !formMemoria.seccionId || !formMemoria.partidaId) {
      mostrarMensaje('error', 'Complete todos los campos obligatorios y seleccione la partida.');
      return;
    }

    if (formMemoria.renglones.some((r) => !r.descripcion.trim() || r.cantidad <= 0 || r.precio_unitario < 0)) {
      mostrarMensaje('error', 'Verifique que todos los renglones tengan descripción, cantidad mayor a 0 y precio unitario válido.');
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        codigo: formMemoria.codigo,
        gestion: selectedGestionId,
        seccion: Number(formMemoria.seccionId),
        justificacion: formMemoria.justificacion,
        partida_id: Number(formMemoria.partidaId),
        detalles: formMemoria.renglones.map((r) => ({
          partida: Number(formMemoria.partidaId),
          partida_id: Number(formMemoria.partidaId),
          descripcion: r.descripcion,
          unidad_medida: r.unidad_medida,
          cantidad: Number(r.cantidad),
          precio_unitario: Number(r.precio_unitario),
        })),
      };

      if (editingMemoria) {
        await updateMemoria(editingMemoria.id, payload);
        mostrarMensaje('success', 'Memoria de cálculo actualizada con éxito.');
      } else {
        await createMemoria(payload);
        mostrarMensaje('success', 'Memoria de cálculo registrada en estado Borrador.');
      }

      setShowModalMemoria(false);
      await cargarDatosGestion(selectedGestionId);
    } catch (err: any) {
      console.error(err);
      const errMsg =
        err.response?.data?.non_field_errors?.[0] ||
        err.response?.data?.codigo?.[0] ||
        err.response?.data?.justificacion?.[0] ||
        err.response?.data?.detail ||
        'Error al guardar la memoria.';
      mostrarMensaje('error', errMsg);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeleteMemoria(id: number) {
    if (!confirm('¿Está seguro de eliminar esta memoria de cálculo?')) return;
    setActionLoading(true);
    try {
      await deleteMemoria(id);
      mostrarMensaje('success', 'Memoria eliminada.');
      if (selectedGestionId) await cargarDatosGestion(selectedGestionId);
    } catch (err: any) {
      mostrarMensaje('error', 'No se pudo eliminar la memoria.');
    } finally {
      setActionLoading(false);
    }
  }

  // ── Flujo de Estados de Memoria ────────────────────────────────────────────
  async function handleEnviarGerencia(mem: MemoriaCalculo) {
    try {
      const res = await enviarMemoriaGerencia(mem.id);
      mostrarMensaje('success', res.message);
      if (selectedGestionId) await cargarDatosGestion(selectedGestionId);
    } catch (err: any) {
      mostrarMensaje('error', err.response?.data?.error || 'Error al enviar a gerencia.');
    }
  }

  async function handleAprobarGerencia(mem: MemoriaCalculo) {
    try {
      const res = await aprobarMemoriaGerencia(mem.id);
      mostrarMensaje('success', res.message);
      if (selectedGestionId) await cargarDatosGestion(selectedGestionId);
    } catch (err: any) {
      mostrarMensaje('error', 'Error al aprobar por gerencia.');
    }
  }

  async function handleAprobarFinanzas(mem: MemoriaCalculo) {
    try {
      const res = await aprobarMemoriaFinanzas(mem.id);
      mostrarMensaje('success', res.message);
      if (selectedGestionId) await cargarDatosGestion(selectedGestionId);
    } catch (err: any) {
      mostrarMensaje('error', 'Error al aprobar por finanzas.');
    }
  }

  async function handleRechazarMemoria(mem: MemoriaCalculo) {
    const motivo = prompt('Ingrese el motivo del rechazo (opcional):') || '';
    try {
      const res = await rechazarMemoria(mem.id, motivo);
      mostrarMensaje('success', res.message);
      if (selectedGestionId) await cargarDatosGestion(selectedGestionId);
    } catch (err: any) {
      mostrarMensaje('error', 'Error al rechazar memoria.');
    }
  }

  async function handleVolverBorrador(mem: MemoriaCalculo) {
    try {
      const res = await volverMemoriaBorrador(mem.id);
      mostrarMensaje('success', res.message);
      if (selectedGestionId) await cargarDatosGestion(selectedGestionId);
    } catch (err: any) {
      mostrarMensaje('error', 'Error al devolver a borrador.');
    }
  }

  // ── Acciones de Gastos Reales ──────────────────────────────────────────────
  const renglonesDisponiblesParaGasto = useMemo(() => {
    const items: Array<{
      detalleId: number;
      descripcion: string;
      memoriaCodigo: string;
      areaNombre: string;
      partidaCodigo: string;
      partidaNombre: string;
      montoTotal: number;
      montoGastado: number;
      saldoDisponible: number;
    }> = [];

    memorias
      .filter((m) => ['APROBADO_FINANZAS', 'APROBADO_GERENCIA'].includes(m.estado))
      .forEach((m) => {
        m.detalles.forEach((d) => {
          const totalItem = parseFloat(d.precio_total || '0');
          const gastado = parseFloat(d.monto_ejecutado || '0');
          const saldo = Math.max(0, totalItem - gastado);
          items.push({
            detalleId: d.id!,
            descripcion: d.descripcion,
            memoriaCodigo: m.codigo,
            areaNombre: m.area_nombre,
            partidaCodigo: d.partida_codigo || '',
            partidaNombre: d.partida_nombre || '',
            montoTotal: totalItem,
            montoGastado: gastado,
            saldoDisponible: saldo,
          });
        });
      });

    return items;
  }, [memorias]);

  const selectedDetalleForGasto = useMemo(() => {
    if (!formGasto.detalleMemoriaId) return null;
    return renglonesDisponiblesParaGasto.find((r) => r.detalleId === Number(formGasto.detalleMemoriaId)) || null;
  }, [formGasto.detalleMemoriaId, renglonesDisponiblesParaGasto]);

  async function handleGuardarGasto(e: React.FormEvent) {
    e.preventDefault();
    if (!formGasto.detalleMemoriaId || !formGasto.monto || Number(formGasto.monto) <= 0) {
      mostrarMensaje('error', 'Seleccione un ítem de memoria y un monto ejecutado mayor a 0.');
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

      mostrarMensaje('success', 'Gasto ejecutado registrado. Presupuesto disponible recalculado en tiempo real.');
      setShowModalGasto(false);
      setFormGasto({
        detalleMemoriaId: '',
        monto: '',
        fecha: new Date().toISOString().split('T')[0],
        comprobante: '',
        observacion: '',
      });
      if (selectedGestionId) await cargarDatosGestion(selectedGestionId);
    } catch (err: any) {
      console.error(err);
      mostrarMensaje('error', err.response?.data?.monto_ejecutado?.[0] || 'Error al registrar el gasto.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeleteGasto(gastoId: number) {
    if (!confirm('¿Desea anular este gasto? El saldo disponible será restaurado automáticamente.')) return;
    setActionLoading(true);
    try {
      await deleteGasto(gastoId);
      mostrarMensaje('success', 'Gasto anulado y saldo presupuestario restaurado.');
      if (selectedGestionId) await cargarDatosGestion(selectedGestionId);
    } catch (err: any) {
      mostrarMensaje('error', 'Error al anular gasto.');
    } finally {
      setActionLoading(false);
    }
  }

  // ── Memorias Filtradas ─────────────────────────────────────────────────────
  const memoriasFiltradas = useMemo(() => {
    return memorias.filter((m) => {
      const matchArea = filtroArea === 'todas' || String(m.area_id) === filtroArea;
      const matchEstado = filtroEstadoMemoria === 'todos' || m.estado === filtroEstadoMemoria;
      const matchSearch =
        !searchTerm.trim() ||
        m.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.area_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.justificacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.partida_codigo && m.partida_codigo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.partida_nombre && m.partida_nombre.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchArea && matchEstado && matchSearch;
    });
  }, [memorias, filtroArea, filtroEstadoMemoria, searchTerm]);

  // ── Renders Auxiliares ─────────────────────────────────────────────────────
  const formatMoney = (val: number | string) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB', minimumFractionDigits: 2 }).format(num || 0);
  };

  const getBadgeEstadoMemoria = (estado: string) => {
    switch (estado) {
      case 'BORRADOR':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"><Clock size={12} /> Borrador</span>;
      case 'PENDIENTE_GERENCIA':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"><AlertCircle size={12} /> Pendiente Gerencia</span>;
      case 'APROBADO_GERENCIA':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"><CheckCircle2 size={12} /> Aprobado Gerencia</span>;
      case 'APROBADO_FINANZAS':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"><CheckCircle2 size={12} /> Aprobado Finanzas (Cierre)</span>;
      case 'RECHAZADO':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"><XCircle size={12} /> Rechazado</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{estado}</span>;
    }
  };

  const isGestionBloqueada = activeGestion?.estado === 'CERRADO_FORMULACION' || activeGestion?.estado === 'EN_EJECUCION' || activeGestion?.estado === 'FINALIZADO';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── NOTIFICACIONES FEEDBACK ────────────────────────────────────────── */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between shadow-md transition-all ${
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

      {/* ── CABECERA Y SELECTOR DE GESTIÓN ─────────────────────────────────── */}
      <div className="card p-6 bg-gradient-to-r from-theme-surface via-theme-surface to-brand-50/20 dark:to-brand-900/10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-theme-primary/15 text-theme-main">
                <WalletCards size={28} className="text-theme-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-theme-main tracking-tight">Módulo de Presupuestos y POA</h1>
                <p className="text-sm text-theme-muted">
                  Flujo integral: Formulación de Memorias → Consolidación de Techos → Control de Ejecución en Tiempo Real.
                </p>
              </div>
            </div>
          </div>

          {/* Selector de Gestión y Acciones del Ciclo */}
          <div className="flex flex-wrap items-center gap-3 bg-theme-base/80 p-2 rounded-2xl border border-theme-border">
            <div className="flex items-center gap-2 px-3 py-1">
              <Calendar size={18} className="text-theme-muted" />
              <span className="text-xs font-semibold uppercase tracking-wider text-theme-muted">Gestión:</span>
              <select
                value={selectedGestionId || ''}
                onChange={(e) => setSelectedGestionId(Number(e.target.value))}
                className="bg-theme-surface font-bold text-sm px-3 py-1.5 rounded-xl border border-theme-border text-theme-main focus:outline-none focus:ring-2 focus:ring-theme-primary"
              >
                {gestiones.map((g) => (
                  <option key={g.id} value={g.id}>
                    Gestión {g.anio} ({g.estado_display})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowModalGestion(true)}
              className="p-2 rounded-xl text-theme-muted hover:text-theme-main hover:bg-theme-surface transition-colors"
              title="Crear Nueva Gestión Anual"
            >
              <Plus size={18} />
            </button>

            <button
              onClick={() => selectedGestionId && cargarDatosGestion(selectedGestionId)}
              className="p-2 rounded-xl text-theme-muted hover:text-theme-main hover:bg-theme-surface transition-colors"
              title="Refrescar datos"
            >
              <RefreshCw size={18} />
            </button>

            {/* BOTONES DE TRANSICIÓN DE ESTADO DE LA GESTIÓN */}
            {activeGestion?.estado === 'FORMULACION' && (
              <button
                onClick={() => setShowModalConfirmCierre(true)}
                disabled={actionLoading}
                className="btn-primary bg-amber-500 hover:bg-amber-600 text-white dark:bg-amber-600 px-4 py-2 text-xs font-bold shadow-md flex items-center gap-2"
                title="Bloquea la creación de memorias y consolida los techos de presupuesto para cada área"
              >
                <Lock size={15} /> Cerrar Formulación (Septiembre)
              </button>
            )}

            {activeGestion?.estado === 'CERRADO_FORMULACION' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePasarAEjecucion}
                  disabled={actionLoading}
                  className="btn-primary bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 text-xs font-bold shadow-md flex items-center gap-1.5"
                  title="Abre el periodo operativo para registrar gastos reales"
                >
                  <Play size={14} /> Iniciar Ejecución
                </button>
                <button
                  onClick={handleReabrirFormulacion}
                  disabled={actionLoading}
                  className="px-3 py-2 rounded-xl border border-theme-border bg-theme-surface text-xs font-medium text-theme-muted hover:text-theme-main transition-colors flex items-center gap-1.5"
                  title="Reabrir fase de formulación de memorias"
                >
                  <Unlock size={14} /> Reabrir
                </button>
              </div>
            )}

            {activeGestion?.estado === 'EN_EJECUCION' && (
              <button
                onClick={handleConsolidarPresupuestos}
                disabled={actionLoading}
                className="px-3 py-2 rounded-xl border border-theme-border bg-theme-surface text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors flex items-center gap-1.5"
                title="Recalcular montos de ejecución y presupuestos"
              >
                <RefreshCw size={14} /> Sincronizar Saldos
              </button>
            )}
          </div>
        </div>

        {/* ALERTA DE ESTADO DE FORMULACIÓN CERRADA */}
        {isGestionBloqueada && (
          <div className="mt-4 p-3 bg-blue-50/70 border border-blue-200 dark:bg-blue-950/40 dark:border-blue-800 rounded-xl flex items-center gap-3 text-xs text-blue-800 dark:text-blue-300">
            <Lock size={16} className="shrink-0 text-blue-600 dark:text-blue-400" />
            <div>
              <strong>Formulación de Gestión {activeGestion?.anio} cerrada:</strong> La creación y modificación de memorias de cálculo está bloqueada. El presupuesto inicial está consolidado y listo para ejecución.
            </div>
          </div>
        )}
      </div>

      {/* ── KPI METRICS CARDS ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-theme-muted">Presupuesto Inicial ($Monto\_Inicial$)</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <DollarSign size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-theme-main mt-3 tracking-tight">{formatMoney(totalPresupuestoInicial)}</p>
          <p className="text-xs text-theme-muted mt-1">Consolidado de memorias aprobadas</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-theme-muted">Gastos Ejecutados Reales</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <TrendingDown size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-theme-main mt-3 tracking-tight">{formatMoney(totalGastosEjecutados)}</p>
          <p className="text-xs text-theme-muted mt-1">{gastos.length} registro(s) de gasto formal</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-theme-muted">Presupuesto Disponible ($Monto\_Actual$)</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <WalletCards size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-3 tracking-tight">
            {formatMoney(totalPresupuestoDisponible)}
          </p>
          <p className="text-xs text-theme-muted mt-1">Saldo restante en tiempo real</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-theme-muted">% de Ejecución Global</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Building2 size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-theme-main tracking-tight">{porcentajeGlobalEjecucion}%</span>
            <span className="text-xs text-theme-muted">del presupuesto</span>
          </div>
          <div className="w-full bg-theme-border/60 rounded-full h-2 mt-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                porcentajeGlobalEjecucion > 85
                  ? 'bg-rose-500'
                  : porcentajeGlobalEjecucion > 50
                  ? 'bg-amber-500'
                  : 'bg-theme-primary'
              }`}
              style={{ width: `${porcentajeGlobalEjecucion}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── NAVEGACIÓN POR PESTAÑAS ────────────────────────────────────────── */}
      <div className="flex border-b border-theme-border gap-2">
        <button
          onClick={() => setActiveTab('techos')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'techos'
              ? 'border-theme-primary text-theme-main'
              : 'border-transparent text-theme-muted hover:text-theme-main'
          }`}
        >
          <Building2 size={16} /> 1. Techos y Presupuestos por Área ({presupuestosArea.length})
        </button>

        <button
          onClick={() => setActiveTab('memorias')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'memorias'
              ? 'border-theme-primary text-theme-main'
              : 'border-transparent text-theme-muted hover:text-theme-main'
          }`}
        >
          <FileText size={16} /> 2. Formulación de Memorias de Cálculo ({memorias.length})
        </button>

        <button
          onClick={() => setActiveTab('ejecucion')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'ejecucion'
              ? 'border-theme-primary text-theme-main'
              : 'border-transparent text-theme-muted hover:text-theme-main'
          }`}
        >
          <TrendingDown size={16} /> 3. Ejecución y Gastos Reales ({gastos.length})
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* PESTAÑA 1: TECHOS Y PRESUPUESTOS POR ÁREA                          */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'techos' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-theme-main">Presupuestos Asignados por Área / Gerencia</h2>
              <p className="text-xs text-theme-muted">
                El Presupuesto Inicial ($Monto\_Inicial$) es la sumatoria de las memorias aprobadas por Finanzas. Los gastos reales descuentan del $Monto\_Actual$ en tiempo real.
              </p>
            </div>
          </div>

          <div className="card overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-theme-border bg-theme-base/60 text-xs font-semibold uppercase tracking-wider text-theme-muted">
                  <th className="py-3.5 px-4">Código</th>
                  <th className="py-3.5 px-4">Área / Gerencia</th>
                  <th className="py-3.5 px-4">Tipo</th>
                  <th className="py-3.5 px-4 text-center">Memorias Aprobadas</th>
                  <th className="py-3.5 px-4 text-right">Presupuesto Inicial</th>
                  <th className="py-3.5 px-4 text-right">Gastos Ejecutados</th>
                  <th className="py-3.5 px-4 text-right">Disponible ($Monto\_Actual$)</th>
                  <th className="py-3.5 px-4 text-center w-36">% Ejecución</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border">
                {presupuestosArea.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-theme-muted">
                      <Layers size={36} className="mx-auto mb-2 opacity-40" />
                      <p className="font-medium">No hay presupuestos consolidados para la Gestión {activeGestion?.anio}.</p>
                      <p className="text-xs mt-1">
                        Formule y apruebe memorias de cálculo, luego use <strong>"Cerrar Formulación y Consolidar"</strong> para fijar los presupuestos iniciales.
                      </p>
                    </td>
                  </tr>
                ) : (
                  presupuestosArea.map((p) => {
                    const inicial = parseFloat(p.monto_inicial || '0');
                    const ejecutado = parseFloat(p.monto_ejecutado || '0');
                    const actual = parseFloat(p.monto_actual || '0');
                    const pct = p.porcentaje_ejecucion || 0;

                    return (
                      <tr key={p.id} className="hover:bg-theme-border/20 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-xs text-theme-muted">{p.area_codigo}</td>
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-theme-main">{p.area_nombre}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-xs px-2 py-0.5 rounded-lg bg-theme-border/60 text-theme-muted font-medium">
                            {p.area_tipo}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="font-semibold text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                            {p.total_memorias_aprobadas} memoria(s)
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-theme-main">{formatMoney(inicial)}</td>
                        <td className="py-3.5 px-4 text-right font-semibold text-rose-600 dark:text-rose-400">
                          {formatMoney(ejecutado)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          {formatMoney(actual)}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-theme-border/60 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full ${pct > 80 ? 'bg-rose-500' : pct > 40 ? 'bg-amber-500' : 'bg-theme-primary'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-theme-muted w-10 text-right">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* PESTAÑA 2: FORMULACIÓN DE MEMORIAS DE CÁLCULO                       */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'memorias' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-theme-main">Memorias de Cálculo Operativas</h2>
              <p className="text-xs text-theme-muted">
                Cada memoria está asociada a una partida presupuestaria y detalla renglones con cantidades y precios unitarios.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenCrearMemoria}
                disabled={isGestionBloqueada}
                className="btn-primary flex items-center gap-2 text-xs font-semibold px-4 py-2.5"
                title={isGestionBloqueada ? 'Formulación cerrada para esta gestión' : 'Crear nueva memoria'}
              >
                <Plus size={16} /> Nueva Memoria de Cálculo
              </button>
            </div>
          </div>

          {/* Barra de Filtros */}
          <div className="card p-4 flex flex-col md:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-muted" />
              <input
                type="text"
                placeholder="Buscar por código, partida, justificación o área..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-theme pl-10 text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={filtroArea}
                onChange={(e) => setFiltroArea(e.target.value)}
                className="input-theme text-xs py-2 w-full sm:w-auto"
              >
                <option value="todas">Todas las Áreas</option>
                {areas.map((a) => (
                  <option key={a.id} value={String(a.id)}>
                    {a.nombre}
                  </option>
                ))}
              </select>

              <select
                value={filtroEstadoMemoria}
                onChange={(e) => setFiltroEstadoMemoria(e.target.value)}
                className="input-theme text-xs py-2 w-full sm:w-auto"
              >
                <option value="todos">Todos los Estados</option>
                <option value="BORRADOR">Borrador</option>
                <option value="PENDIENTE_GERENCIA">Pendiente de Gerencia</option>
                <option value="APROBADO_GERENCIA">Aprobado por Gerencia</option>
                <option value="APROBADO_FINANZAS">Aprobado por Finanzas</option>
                <option value="RECHAZADO">Rechazado</option>
              </select>
            </div>
          </div>

          {/* Tabla de Memorias */}
          <div className="card overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-theme-border bg-theme-base/60 text-xs font-semibold uppercase tracking-wider text-theme-muted">
                  <th className="py-3.5 px-4">Código</th>
                  <th className="py-3.5 px-4">Área / Sección</th>
                  <th className="py-3.5 px-4">Partida Presupuestaria</th>
                  <th className="py-3.5 px-4">Justificación / Objeto</th>
                  <th className="py-3.5 px-4 text-center">Renglones</th>
                  <th className="py-3.5 px-4 text-right">Total Presupuestado</th>
                  <th className="py-3.5 px-4 text-center">Estado</th>
                  <th className="py-3.5 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border">
                {memoriasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-theme-muted">
                      <FileText size={36} className="mx-auto mb-2 opacity-40" />
                      <p className="font-medium">No se encontraron memorias de cálculo con los filtros seleccionados.</p>
                      {!isGestionBloqueada && (
                        <button onClick={handleOpenCrearMemoria} className="btn-primary mt-3 text-xs">
                          Crear Primera Memoria
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  memoriasFiltradas.map((mem) => {
                    const total = parseFloat(mem.total_presupuesto || '0');
                    return (
                      <tr key={mem.id} className="hover:bg-theme-border/20 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-xs text-theme-main">{mem.codigo}</td>
                        <td className="py-3.5 px-4">
                          <p className="font-medium text-theme-main text-xs">{mem.area_nombre}</p>
                          <p className="text-[11px] text-theme-muted">{mem.seccion_nombre}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-mono font-bold text-xs text-theme-main">{mem.partida_codigo || 'Partida'}</p>
                          <p className="text-[11px] text-theme-muted line-clamp-1">{mem.partida_nombre || 'Sin partida'}</p>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <p className="text-xs text-theme-main line-clamp-2">{mem.justificacion}</p>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-theme-border/60 text-theme-muted">
                            {mem.detalles?.length || 0} ítem(s)
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-theme-main text-xs">{formatMoney(total)}</td>
                        <td className="py-3.5 px-4 text-center">{getBadgeEstadoMemoria(mem.estado)}</td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Ver detalle completo */}
                            <button
                              onClick={() => setShowDetalleMemoriaModal(mem)}
                              className="p-1.5 rounded-lg text-theme-muted hover:text-theme-main hover:bg-theme-border/40 transition-colors"
                              title="Ver detalle de renglones"
                            >
                              <Eye size={15} />
                            </button>

                            {/* Flujo de Estados */}
                            {mem.estado === 'BORRADOR' && (
                              <>
                                <button
                                  onClick={() => handleEnviarGerencia(mem)}
                                  className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-500/10 transition-colors"
                                  title="Enviar a Revisión de Gerencia"
                                >
                                  <Send size={15} />
                                </button>
                                {!isGestionBloqueada && (
                                  <>
                                    <button
                                      onClick={() => handleOpenEditarMemoria(mem)}
                                      className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-500/10 transition-colors"
                                      title="Editar memoria"
                                    >
                                      <Edit3 size={15} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteMemoria(mem.id)}
                                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-500/10 transition-colors"
                                      title="Eliminar memoria"
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  </>
                                )}
                              </>
                            )}

                            {mem.estado === 'PENDIENTE_GERENCIA' && (
                              <>
                                <button
                                  onClick={() => handleAprobarGerencia(mem)}
                                  className="px-2 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-[11px] font-semibold flex items-center gap-1"
                                  title="Aprobar como Gerente de Área"
                                >
                                  <CheckCircle2 size={13} /> Aprobar Gerencia
                                </button>
                                <button
                                  onClick={() => handleRechazarMemoria(mem)}
                                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-500/10 transition-colors"
                                  title="Rechazar"
                                >
                                  <XCircle size={15} />
                                </button>
                              </>
                            )}

                            {mem.estado === 'APROBADO_GERENCIA' && (
                              <>
                                <button
                                  onClick={() => handleAprobarFinanzas(mem)}
                                  className="px-2 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-[11px] font-semibold flex items-center gap-1"
                                  title="Aprobar por Finanzas / Economía para Cierre"
                                >
                                  <CheckCircle2 size={13} /> Aprobar Finanzas
                                </button>
                                <button
                                  onClick={() => handleRechazarMemoria(mem)}
                                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-500/10 transition-colors"
                                  title="Rechazar"
                                >
                                  <XCircle size={15} />
                                </button>
                              </>
                            )}

                            {mem.estado === 'RECHAZADO' && !isGestionBloqueada && (
                              <button
                                onClick={() => handleVolverBorrador(mem)}
                                className="px-2 py-1 rounded-lg border border-theme-border text-xs text-theme-muted hover:text-theme-main transition-colors"
                                title="Regresar a borrador para corregir"
                              >
                                Corregir
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* PESTAÑA 3: EJECUCIÓN Y GASTOS REALES                                */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'ejecucion' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-theme-main">Registro y Control de Gastos Reales</h2>
              <p className="text-xs text-theme-muted">
                Cada gasto formalmente ejecutado se imputa a un renglón de memoria aprobada y descuenta del presupuesto disponible en tiempo real.
              </p>
            </div>

            <button
              onClick={() => setShowModalGasto(true)}
              className="btn-primary flex items-center gap-2 text-xs font-semibold px-4 py-2.5"
            >
              <Plus size={16} /> Registrar Gasto Real
            </button>
          </div>

          <div className="card overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-theme-border bg-theme-base/60 text-xs font-semibold uppercase tracking-wider text-theme-muted">
                  <th className="py-3.5 px-4">Fecha</th>
                  <th className="py-3.5 px-4">N° Comprobante</th>
                  <th className="py-3.5 px-4">Área / Sección</th>
                  <th className="py-3.5 px-4">Partida</th>
                  <th className="py-3.5 px-4">Memoria & Renglón Imputado</th>
                  <th className="py-3.5 px-4">Observación</th>
                  <th className="py-3.5 px-4 text-right">Monto Ejecutado</th>
                  <th className="py-3.5 px-4">Registrado por</th>
                  <th className="py-3.5 px-4 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border">
                {gastos.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-theme-muted">
                      <TrendingDown size={36} className="mx-auto mb-2 opacity-40" />
                      <p className="font-medium">No hay gastos ejecutados registrados en la Gestión {activeGestion?.anio}.</p>
                      <button onClick={() => setShowModalGasto(true)} className="btn-primary mt-3 text-xs">
                        Registrar Primer Gasto
                      </button>
                    </td>
                  </tr>
                ) : (
                  gastos.map((g) => (
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
                          onClick={() => handleDeleteGasto(g.id)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-500/10 transition-colors"
                          title="Anular gasto y restaurar saldo"
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

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL: FORMULACIÓN / EDICIÓN DE MEMORIA                             */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {showModalMemoria && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl bg-theme-surface">
            <div className="p-5 border-b border-theme-border flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileText className="text-theme-primary" size={22} />
                <div>
                  <h3 className="text-base font-bold text-theme-main">
                    {editingMemoria ? 'Editar Memoria de Cálculo' : 'Formular Nueva Memoria de Cálculo'}
                  </h3>
                  <p className="text-xs text-theme-muted">
                    Gestión {activeGestion?.anio} • Planificación presupuestaria operativa
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModalMemoria(false)}
                className="text-theme-muted hover:text-theme-main text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarMemoria} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Datos Matriz */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-theme-muted mb-1">
                    Código de Memoria *
                  </label>
                  <input
                    type="text"
                    required
                    value={formMemoria.codigo}
                    onChange={(e) => setFormMemoria({ ...formMemoria, codigo: e.target.value })}
                    className="input-theme text-xs font-mono font-semibold"
                    placeholder="Ej. MEM-2027-INF-001"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-theme-muted mb-1">
                    Área / Sección Solicitante *
                  </label>
                  <select
                    required
                    value={formMemoria.seccionId}
                    onChange={(e) => setFormMemoria({ ...formMemoria, seccionId: Number(e.target.value) })}
                    className="input-theme text-xs"
                  >
                    <option value="">Seleccione Sección...</option>
                    {secciones.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre} ({s.area_nombre || 'Área'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-theme-muted mb-1">
                    Partida Presupuestaria de Gasto *
                  </label>
                  <select
                    required
                    value={formMemoria.partidaId}
                    onChange={(e) => setFormMemoria({ ...formMemoria, partidaId: Number(e.target.value) })}
                    className="input-theme text-xs"
                  >
                    <option value="">Seleccione Partida del Catálogo...</option>
                    {partidas.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.codigo} - {p.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Justificación */}
              <div>
                <label className="block text-xs font-semibold uppercase text-theme-muted mb-1">
                  Justificación Técnica / Operativa del Requerimiento *
                </label>
                <textarea
                  required
                  rows={2}
                  value={formMemoria.justificacion}
                  onChange={(e) => setFormMemoria({ ...formMemoria, justificacion: e.target.value })}
                  placeholder="Explique el objetivo, sustento y necesidad de estos recursos..."
                  className="input-theme text-xs"
                />
              </div>

              {/* Desglose de Renglones / Ítems */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-theme-main">
                    Desglose de Ítems / Renglones de la Memoria
                  </span>
                  <button
                    type="button"
                    onClick={handleAddRenglon}
                    className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
                  >
                    <Plus size={14} /> Agregar Renglón
                  </button>
                </div>

                <div className="border border-theme-border rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-theme-base border-b border-theme-border font-semibold text-theme-muted">
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Descripción del Bien / Servicio</th>
                        <th className="py-2.5 px-3 w-32">Unidad Medida</th>
                        <th className="py-2.5 px-3 w-24 text-right">Cantidad</th>
                        <th className="py-2.5 px-3 w-32 text-right">P. Unitario (Bs.)</th>
                        <th className="py-2.5 px-3 w-32 text-right">Subtotal</th>
                        <th className="py-2.5 px-3 w-12 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-border">
                      {formMemoria.renglones.map((renglon, idx) => {
                        const subtotal = (Number(renglon.cantidad) || 0) * (Number(renglon.precio_unitario) || 0);
                        return (
                          <tr key={idx} className="bg-theme-surface">
                            <td className="py-2 px-3 font-bold text-theme-muted">{idx + 1}</td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                required
                                placeholder="Ej. Renovación de licencias de firewall..."
                                value={renglon.descripcion}
                                onChange={(e) => handleUpdateRenglon(idx, 'descripcion', e.target.value)}
                                className="w-full bg-transparent border-b border-theme-border/60 focus:border-theme-primary px-1 py-1 focus:outline-none text-theme-main"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                required
                                placeholder="Servicio, Licencia..."
                                value={renglon.unidad_medida}
                                onChange={(e) => handleUpdateRenglon(idx, 'unidad_medida', e.target.value)}
                                className="w-full bg-transparent border-b border-theme-border/60 focus:border-theme-primary px-1 py-1 focus:outline-none text-theme-main"
                              />
                            </td>
                            <td className="py-2 px-3 text-right">
                              <input
                                type="number"
                                required
                                min="0.01"
                                step="any"
                                value={renglon.cantidad}
                                onChange={(e) => handleUpdateRenglon(idx, 'cantidad', parseFloat(e.target.value) || 0)}
                                className="w-full bg-transparent border-b border-theme-border/60 focus:border-theme-primary px-1 py-1 text-right focus:outline-none text-theme-main font-semibold"
                              />
                            </td>
                            <td className="py-2 px-3 text-right">
                              <input
                                type="number"
                                required
                                min="0"
                                step="any"
                                value={renglon.precio_unitario}
                                onChange={(e) => handleUpdateRenglon(idx, 'precio_unitario', parseFloat(e.target.value) || 0)}
                                className="w-full bg-transparent border-b border-theme-border/60 focus:border-theme-primary px-1 py-1 text-right focus:outline-none text-theme-main font-semibold"
                              />
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-theme-main">{formatMoney(subtotal)}</td>
                            <td className="py-2 px-3 text-center">
                              {formMemoria.renglones.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveRenglon(idx)}
                                  className="text-rose-500 hover:text-rose-700 p-1"
                                >
                                  ✕
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Total Memoria */}
                <div className="mt-3 flex justify-end items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-theme-muted">
                    Total Presupuesto de la Memoria:
                  </span>
                  <span className="text-lg font-bold text-theme-primary">{formatMoney(totalCalculadoMemoria)}</span>
                </div>
              </div>

              {/* Botones footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-theme-border">
                <button
                  type="button"
                  onClick={() => setShowModalMemoria(false)}
                  className="px-4 py-2 rounded-xl border border-theme-border text-xs font-semibold text-theme-muted hover:text-theme-main"
                >
                  Cancelar
                </button>
                <button type="submit" disabled={actionLoading} className="btn-primary text-xs px-6 py-2">
                  {editingMemoria ? 'Guardar Cambios' : 'Registrar Memoria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL: VER DETALLE COMPLETO DE MEMORIA                              */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {showDetalleMemoriaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl bg-theme-surface">
            <div className="p-5 border-b border-theme-border flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-theme-primary">{showDetalleMemoriaModal.codigo}</span>
                <h3 className="text-base font-bold text-theme-main">{showDetalleMemoriaModal.justificacion}</h3>
              </div>
              <button
                onClick={() => setShowDetalleMemoriaModal(null)}
                className="text-theme-muted hover:text-theme-main text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-theme-base border border-theme-border">
                <div>
                  <span className="text-theme-muted uppercase font-semibold">Área:</span>
                  <p className="font-bold text-theme-main mt-0.5">{showDetalleMemoriaModal.area_nombre}</p>
                </div>
                <div>
                  <span className="text-theme-muted uppercase font-semibold">Partida:</span>
                  <p className="font-bold text-theme-main mt-0.5 font-mono">
                    {showDetalleMemoriaModal.partida_codigo} - {showDetalleMemoriaModal.partida_nombre}
                  </p>
                </div>
                <div>
                  <span className="text-theme-muted uppercase font-semibold">Estado:</span>
                  <div className="mt-0.5">{getBadgeEstadoMemoria(showDetalleMemoriaModal.estado)}</div>
                </div>
                <div>
                  <span className="text-theme-muted uppercase font-semibold">Total Proyectado:</span>
                  <p className="font-bold text-theme-primary text-sm mt-0.5">
                    {formatMoney(showDetalleMemoriaModal.total_presupuesto)}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-theme-main mb-2 uppercase tracking-wider text-xs">Renglones Detallados</h4>
                <div className="border border-theme-border rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-theme-base border-b border-theme-border font-semibold text-theme-muted">
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Descripción</th>
                        <th className="py-2.5 px-3">U. Medida</th>
                        <th className="py-2.5 px-3 text-right">Cantidad</th>
                        <th className="py-2.5 px-3 text-right">P. Unitario</th>
                        <th className="py-2.5 px-3 text-right">Total</th>
                        <th className="py-2.5 px-3 text-center">Estado Gasto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-border">
                      {showDetalleMemoriaModal.detalles.map((d, i) => (
                        <tr key={d.id || i}>
                          <td className="py-2 px-3 font-bold text-theme-muted">{i + 1}</td>
                          <td className="py-2 px-3 font-medium text-theme-main">{d.descripcion}</td>
                          <td className="py-2 px-3 text-theme-muted">{d.unidad_medida}</td>
                          <td className="py-2 px-3 text-right font-semibold">{d.cantidad}</td>
                          <td className="py-2 px-3 text-right font-semibold">{formatMoney(d.precio_unitario)}</td>
                          <td className="py-2 px-3 text-right font-bold text-theme-main">{formatMoney(d.precio_total || 0)}</td>
                          <td className="py-2 px-3 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-theme-border/60 text-theme-muted">
                              {d.estado_ejecucion || 'PENDIENTE'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-theme-border flex justify-end">
              <button
                onClick={() => setShowDetalleMemoriaModal(null)}
                className="btn-primary text-xs px-5 py-2"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL: REGISTRO DE GASTO REAL                                       */}
      {/* ─────────────────────────────────────────────────────────────────── */}
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
                  {renglonesDisponiblesParaGasto.map((r) => (
                    <option key={r.detalleId} value={r.detalleId}>
                      [{r.memoriaCodigo}] {r.descripcion} • Saldo Disp: {formatMoney(r.saldoDisponible)}
                    </option>
                  ))}
                </select>
              </div>

              {selectedDetalleForGasto && (
                <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-1">
                  <p className="font-semibold text-blue-900 dark:text-blue-200">
                    Área: {selectedDetalleForGasto.areaNombre} • Partida: {selectedDetalleForGasto.partidaCodigo}
                  </p>
                  <div className="flex justify-between text-[11px] text-blue-800 dark:text-blue-300">
                    <span>Presupuesto Asignado al Ítem: {formatMoney(selectedDetalleForGasto.montoTotal)}</span>
                    <span className="font-bold">Saldo Disponible: {formatMoney(selectedDetalleForGasto.saldoDisponible)}</span>
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
                <label className="block font-semibold uppercase text-theme-muted mb-1">N° Comprobante / Factura</label>
                <input
                  type="text"
                  placeholder="Ej. FAC-9842 / VALE-102"
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
                <button type="submit" disabled={actionLoading} className="btn-primary text-xs px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white">
                  Registrar Gasto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL CONFIRMAR CIERRE DE FORMULACIÓN                               */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {showModalConfirmCierre && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card w-full max-w-md shadow-2xl bg-theme-surface p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
              <ShieldAlert size={28} />
              <h3 className="text-base font-bold text-theme-main">Cerrar Formulación y Consolidar Presupuesto</h3>
            </div>

            <p className="text-xs text-theme-muted leading-relaxed">
              Al cerrar la formulación de la <strong>Gestión {activeGestion?.anio}</strong>:
            </p>

            <ul className="text-xs space-y-2 text-theme-main bg-theme-base p-3 rounded-xl border border-theme-border">
              <li className="flex items-start gap-2">
                <Lock size={14} className="text-amber-500 shrink-0 mt-0.5" />
                <span>Se <strong>bloqueará la creación y edición</strong> de nuevas memorias de cálculo.</span>
              </li>
              <li className="flex items-start gap-2">
                <DollarSign size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  Se sumarán todas las memorias con estado <strong>Aprobado por Finanzas</strong> para generar el <strong>Presupuesto Inicial ($Monto\_Inicial$)</strong> de cada área.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight size={14} className="text-blue-500 shrink-0 mt-0.5" />
                <span>La gestión quedará consolidada para dar paso al año operativo.</span>
              </li>
            </ul>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowModalConfirmCierre(false)}
                className="px-4 py-2 rounded-xl border border-theme-border text-xs font-semibold text-theme-muted hover:text-theme-main"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCerrarFormulacion}
                disabled={actionLoading}
                className="btn-primary bg-amber-600 hover:bg-amber-700 text-white text-xs px-5 py-2 font-bold flex items-center gap-2"
              >
                <Lock size={14} /> Confirmar Cierre y Consolidación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL CREAR NUEVA GESTIÓN                                           */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {showModalGestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card w-full max-w-sm shadow-2xl bg-theme-surface p-6 space-y-4">
            <h3 className="text-base font-bold text-theme-main">Crear Nueva Gestión Anual</h3>
            <form onSubmit={handleCrearGestion} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold uppercase text-theme-muted mb-1">Año de Gestión *</label>
                <input
                  type="number"
                  required
                  min="2020"
                  max="2050"
                  value={nuevoAnio}
                  onChange={(e) => setNuevoAnio(parseInt(e.target.value) || 2026)}
                  className="input-theme text-sm font-bold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModalGestion(false)}
                  className="px-4 py-2 rounded-xl border border-theme-border text-xs font-semibold text-theme-muted hover:text-theme-main"
                >
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
