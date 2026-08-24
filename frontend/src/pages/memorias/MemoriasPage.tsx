import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import alertService from '../../utils/alerts';
import {
  BookOpenText,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  AlertCircle,
  FileText,
  Building2,
  Calendar,
  Layers,
  Eye,
  Trash2,
  Edit3,
  Lock,
  Printer,
  User,
  Check,
  RefreshCw,
  Sparkles,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import {
  Gestion,
  MemoriaCalculo,
  Partida,
  Area,
  Seccion,
  getGestiones,
  getMemorias,
  getMemoria,
  createMemoria,
  updateMemoria,
  deleteMemoria,
  enviarMemoriaGerencia,
  aprobarMemoriaGerencia,
  aprobarMemoriaFinanzas,
  rechazarMemoria,
  volverMemoriaBorrador,
  getPartidas,
  getAreas,
  getSecciones,
} from '../../services/presupuestoService';

export default function MemoriasPage() {
  const [gestiones, setGestiones] = useState<Gestion[]>([]);
  const [selectedGestionId, setSelectedGestionId] = useState<number | null>(null);
  const [memorias, setMemorias] = useState<MemoriaCalculo[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const PAGE_SIZE = 15;
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [secciones, setSecciones] = useState<Seccion[]>([]);

  const { user } = useAuth();
  const rolName = user?.rol_nombre?.toUpperCase() || '';
  const isAprobador = user?.is_superuser || rolName === 'APROBADOR' || rolName === 'ADMINISTRADOR';
  const isGerente = rolName === 'GERENTE';
  const isElaborador = rolName === 'ELABORADOR';
  const isTrabajador = rolName === 'TRABAJADOR';

  const canCreate = isAprobador || isElaborador;
  const canGlobalView = isAprobador || isGerente;

  const [activeTab, setActiveTab] = useState<'todas' | 'borrador' | 'pendiente' | 'finanzas' | 'aprobadas' | 'rechazadas'>('todas');
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [filtroArea, setFiltroArea] = useState<string>('todas');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modales
  const [showModalMemoria, setShowModalMemoria] = useState<boolean>(false);
  const [editingMemoria, setEditingMemoria] = useState<MemoriaCalculo | null>(null);
  const [fichaMemoria, setFichaMemoria] = useState<MemoriaCalculo | null>(null);

  // Formulario
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

  useEffect(() => {
    cargarBase();
  }, []);

  useEffect(() => {
    if (selectedGestionId) {
      cargarMemorias(selectedGestionId);
    }
  }, [selectedGestionId]);

  async function cargarBase() {
    setLoading(true);
    try {
      const [gList, pList, aList, sList] = await Promise.all([
        getGestiones(),
        getPartidas(),
        getAreas(),
        getSecciones(),
      ]);
      setGestiones(gList);
      setPartidas(pList);
      setAreas(aList);
      setSecciones(sList);

      if (gList.length > 0) {
        const formulacionG = gList.find((g) => g.estado === 'FORMULACION');
        setSelectedGestionId(formulacionG ? formulacionG.id : gList[0].id);
      }
    } catch (err) {
      console.error(err);
      mostrarMensaje('error', 'Error al cargar catálogos base.');
    } finally {
      setLoading(false);
    }
  }

  async function cargarMemorias(gId: number) {
    try {
      const data = await getMemorias({ gestion: gId });
      setMemorias(data);
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

  const isGestionBloqueada =
    activeGestion?.estado === 'CERRADO_FORMULACION' ||
    activeGestion?.estado === 'EN_EJECUCION' ||
    activeGestion?.estado === 'FINALIZADO';

  const [partidaSelectorOpen, setPartidaSelectorOpen] = useState(false);
  const partidaSelectorRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (partidaSelectorRef.current && !partidaSelectorRef.current.contains(e.target as Node)) {
        setPartidaSelectorOpen(false);
      }
    }
    if (partidaSelectorOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [partidaSelectorOpen]);

  // ── Partidas de EGRESO: jerarquía de hojas ──────────────────────────────
  // Una partida es "hoja" si ninguna otra partida tiene un código que empiece
  // por el prefijo significativo de ésta (sin ceros finales).
  // Ej.: 24100 → prefijo "241" → tiene hijos 24110, 24120, 24130 → NO es hoja
  //      24110 → prefijo "2411" → nadie más empieza en "2411" → ES hoja
  //      24200 → prefijo "242" → nadie más → ES hoja

  const egresoPartidas = useMemo(
    () => partidas.filter((p) => p.clase === 'EGRESO'),
    [partidas]
  );

  const egresoCodes = useMemo(
    () => egresoPartidas.map((p) => p.codigo),
    [egresoPartidas]
  );

  const egresoLeafs = useMemo(() => {
    return egresoPartidas.filter((p) => {
      const prefix = p.codigo.replace(/0+$/, '');
      if (!prefix) return false; // código todo-ceros → padre
      // Si ALGÚN otro código empieza con este prefijo → es padre, no hoja
      return !egresoCodes.some((c) => c !== p.codigo && c.startsWith(prefix));
    });
  }, [egresoPartidas, egresoCodes]);

  // Para cada hoja, obtener su padre directo (prefijo más largo que la engloba)
  const parentMap = useMemo(() => {
    const map = new Map<string, Partida>();
    for (const leaf of egresoLeafs) {
      const leafPrefix = leaf.codigo.replace(/0+$/, '');
      // Todos los ancestros: otros códigos cuyo prefijo-sin-ceros es prefijo de leafPrefix
      const ancestors = egresoPartidas.filter((p) => {
        if (p.codigo === leaf.codigo) return false;
        const pPrefix = p.codigo.replace(/0+$/, '');
        return pPrefix && leafPrefix.startsWith(pPrefix);
      });
      // El padre directo es el ancestro con el prefijo más largo (más específico)
      if (ancestors.length > 0) {
        ancestors.sort(
          (a, b) =>
            b.codigo.replace(/0+$/, '').length - a.codigo.replace(/0+$/, '').length
        );
        map.set(leaf.codigo, ancestors[0]);
      }
    }
    return map;
  }, [egresoLeafs, egresoPartidas]);

  // Lista de hojas filtrada por búsqueda
  const filteredPartidas = useMemo(() => {
    if (!searchPartidaQuery.trim()) return egresoLeafs;
    const q = searchPartidaQuery.toLowerCase();
    return egresoLeafs.filter(
      (p) =>
        p.codigo.toLowerCase().includes(q) ||
        p.nombre.toLowerCase().includes(q) ||
        parentMap.get(p.codigo)?.nombre.toLowerCase().includes(q)
    );
  }, [egresoLeafs, searchPartidaQuery, parentMap]);

  // Hojas agrupadas por padre directo (para la vista sin búsqueda)
  type GroupedPartidas = { parent: Partida | null; leafs: Partida[] }[];
  const groupedPartidas = useMemo((): GroupedPartidas => {
    const groups = new Map<string | null, { parent: Partida | null; leafs: Partida[] }>();
    for (const leaf of filteredPartidas) {
      const parent = parentMap.get(leaf.codigo) ?? null;
      const key = parent ? parent.codigo : null;
      if (!groups.has(key)) {
        groups.set(key, { parent, leafs: [] });
      }
      groups.get(key)!.leafs.push(leaf);
    }
    // Ordenar grupos por código de padre
    return Array.from(groups.values()).sort((a, b) => {
      const ac = a.parent?.codigo ?? '';
      const bc = b.parent?.codigo ?? '';
      return ac.localeCompare(bc);
    });
  }, [filteredPartidas, parentMap]);


  // Contadores por estado
  const conteos = useMemo(() => {
    const arr = Array.isArray(memorias) ? memorias : [];
    return {
      todas: arr.length,
      borrador: arr.filter((m) => m.estado === 'BORRADOR').length,
      pendiente: arr.filter((m) => m.estado === 'PENDIENTE_GERENCIA').length,
      finanzas: arr.filter((m) => m.estado === 'APROBADO_GERENCIA' || m.estado === 'PENDIENTE_PLANIFICACION' || m.estado === 'APROBADO_PLANIFICACION').length,
      aprobadas: arr.filter((m) => m.estado === 'APROBADO_FINANZAS').length,
      rechazadas: arr.filter((m) => m.estado === 'RECHAZADO').length,
      montoTotal: arr.reduce((acc, m) => acc + parseFloat(m.total_presupuesto || '0'), 0),
    };
  }, [memorias]);

  // Memorias filtradas
  const memoriasFiltradas = useMemo(() => {
    return (Array.isArray(memorias) ? memorias : []).filter((m) => {
      let matchTab = true;
      if (activeTab === 'borrador') matchTab = m.estado === 'BORRADOR';
      else if (activeTab === 'pendiente') matchTab = m.estado === 'PENDIENTE_GERENCIA';
      else if (activeTab === 'finanzas') matchTab = m.estado === 'APROBADO_GERENCIA' || m.estado === 'PENDIENTE_PLANIFICACION' || m.estado === 'APROBADO_PLANIFICACION';
      else if (activeTab === 'aprobadas') matchTab = m.estado === 'APROBADO_FINANZAS';
      else if (activeTab === 'rechazadas') matchTab = m.estado === 'RECHAZADO';

      const matchArea = filtroArea === 'todas' || String(m.area_id) === filtroArea;
      const matchSearch =
        !searchTerm.trim() ||
        m.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.area_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.justificacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.partida_codigo && m.partida_codigo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.partida_nombre && m.partida_nombre.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchTab && matchArea && matchSearch;
    });
  }, [memorias, activeTab, filtroArea, searchTerm]);

  // Resetear página cuando cambia el filtro
  useEffect(() => { setCurrentPage(1); }, [memoriasFiltradas]);

  const totalPages = Math.max(1, Math.ceil(memoriasFiltradas.length / PAGE_SIZE));
  const memoriasPaginadas = useMemo(
    () => memoriasFiltradas.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [memoriasFiltradas, currentPage]
  );

  const formatMoney = (val: number | string) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB', minimumFractionDigits: 2 }).format(num || 0);
  };

  // Acciones de formulario
  function handleOpenCrear() {
    const defaultSeccion = user?.seccion || secciones[0]?.id || '';
    const anio = activeGestion?.anio || new Date().getFullYear();
    const correlativo = String(memorias.length + 1).padStart(3, '0');
    setEditingMemoria(null);
    setFormMemoria({
      codigo: `MEM-${anio}-${correlativo}`,
      seccionId: defaultSeccion,
      justificacion: '',
      partidaId: partidas.find((p) => p.clase === 'EGRESO')?.id || '',
      renglones: [{ descripcion: '', unidad_medida: 'UNIDAD', cantidad: 1, precio_unitario: 0 }],
    });
    setSearchPartidaQuery('');
    setPartidaSelectorOpen(false);
    setShowModalMemoria(true);
  }

  async function handleOpenEditar(mem: MemoriaCalculo) {
    try {
      // Cargamos la memoria completa (con detalles) antes de abrir el modal
      const memoriaCompleta = await getMemoria(mem.id);
      setEditingMemoria(memoriaCompleta);
      setFormMemoria({
        codigo: memoriaCompleta.codigo,
        seccionId: memoriaCompleta.seccion,
        justificacion: memoriaCompleta.justificacion,
        partidaId: memoriaCompleta.partida_id || partidas.find((p) => p.clase === 'EGRESO')?.id || '',
        renglones: (memoriaCompleta.detalles || []).map((d) => ({
          descripcion: d.descripcion,
          unidad_medida: d.unidad_medida,
          cantidad: Number(d.cantidad),
          precio_unitario: Number(d.precio_unitario),
        })),
      });
      setSearchPartidaQuery('');
      setPartidaSelectorOpen(false);
      setShowModalMemoria(true);
    } catch (err) {
      console.error('Error al cargar memoria para edición:', err);
      mostrarMensaje('error', 'No se pudo cargar los detalles de la memoria.');
    }
  }

  function handleAddRenglon() {
    setFormMemoria({
      ...formMemoria,
      renglones: [...formMemoria.renglones, { descripcion: '', unidad_medida: 'UNIDAD', cantidad: 1, precio_unitario: 0 }],
    });
  }

  function handleRemoveRenglon(index: number) {
    if (formMemoria.renglones.length <= 1) return;
    setFormMemoria({
      ...formMemoria,
      renglones: formMemoria.renglones.filter((_, i) => i !== index),
    });
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
      mostrarMensaje('error', 'Complete la sección y la partida presupuestaria obligatorias.');
      return;
    }

    if (formMemoria.renglones.some((r) => !r.descripcion.trim() || r.cantidad <= 0 || r.precio_unitario < 0)) {
      mostrarMensaje('error', 'Verifique que todos los renglones tengan descripción, cantidad > 0 y precio unitario.');
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
        mostrarMensaje('success', 'Memoria de cálculo actualizada.');
      } else {
        await createMemoria(payload);
        mostrarMensaje('success', 'Memoria de cálculo registrada en estado Borrador.');
      }

      setShowModalMemoria(false);
      if (selectedGestionId) await cargarMemorias(selectedGestionId);
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

  async function handleDelete(id: number) {
    if (!confirm('¿Desea eliminar esta memoria de cálculo?')) return;
    try {
      await deleteMemoria(id);
      mostrarMensaje('success', 'Memoria eliminada.');
      if (selectedGestionId) await cargarMemorias(selectedGestionId);
    } catch (err) {
      mostrarMensaje('error', 'No se pudo eliminar la memoria.');
    }
  }

  // Transiciones de estado

  async function handleEnviar(mem: MemoriaCalculo) {
    const confirm = await alertService.confirm({
      title: '¿Enviar a Gerencia?',
      text: `La memoria ${mem.codigo} cambiará a estado Pendiente de Gerencia para su revisión.`,
      confirmButtonText: 'Sí, enviar a revisión',
    });
    if (!confirm) return;

    try {
      const res = await enviarMemoriaGerencia(mem.id);
      alertService.success('Enviado a Gerencia', res.message);
      if (selectedGestionId) await cargarMemorias(selectedGestionId);
    } catch (err) {
      alertService.error('Error', 'No se pudo enviar a revisión.');
    }
  }

  async function handleAprobarGerente(mem: MemoriaCalculo) {
    const nota = await alertService.prompt({
      title: 'Aprobar Memoria por Gerencia',
      text: `¿Desea aprobar la memoria ${mem.codigo}? Puede adjuntar una nota u observación adicional (opcional).`,
      confirmButtonText: 'Aprobar y Derivar',
      inputPlaceholder: 'Nota u observación (opcional)...',
    });
    if (nota === null) return;

    try {
      const res = await aprobarMemoriaGerencia(mem.id, nota);
      alertService.success('Aprobado por Gerencia', res.message);
      if (selectedGestionId) await cargarMemorias(selectedGestionId);
    } catch (err) {
      alertService.error('Error', 'Error al aprobar por gerencia.');
    }
  }

  async function handleAprobarFinanciero(mem: MemoriaCalculo) {
    const nota = await alertService.prompt({
      title: 'Aprobación Presupuestaria Final',
      text: `¿Desea otorgar Aprobación Final a la memoria ${mem.codigo}? Puede ingresar una observación o nota de aprobación (opcional).`,
      confirmButtonText: 'Aprobar Definitivamente',
      inputPlaceholder: 'Nota de aprobación (opcional)...',
    });
    if (nota === null) return;

    try {
      const res = await aprobarMemoriaFinanzas(mem.id, nota);
      alertService.success('¡Memoria Aprobada!', res.message);
      if (selectedGestionId) await cargarMemorias(selectedGestionId);
    } catch (err) {
      alertService.error('Error', 'Error al aprobar por finanzas.');
    }
  }

  async function handleRechazar(mem: MemoriaCalculo) {
    const motivo = await alertService.prompt({
      title: 'Rechazar Memoria de Cálculo',
      text: `Por favor indique el motivo de rechazo para la memoria ${mem.codigo}. Se notificará al elaborador.`,
      confirmButtonText: 'Sí, Rechazar Memoria',
      inputPlaceholder: 'Indique el motivo del rechazo...',
      required: true,
      isDanger: true,
    });
    if (!motivo) return;

    try {
      const res = await rechazarMemoria(mem.id, motivo);
      alertService.success('Memoria Rechazada', res.message);
      if (selectedGestionId) await cargarMemorias(selectedGestionId);
    } catch (err) {
      alertService.error('Error', 'Error al rechazar memoria.');
    }
  }

  async function handleVolverABorrador(mem: MemoriaCalculo) {
    const motivo = await alertService.prompt({
      title: 'Devolver Memoria a Borrador',
      text: `Indique las observaciones para devolver la memoria ${mem.codigo} a estado Borrador para correcciones.`,
      confirmButtonText: 'Devolver a Borrador',
      inputPlaceholder: 'Indique observaciones o motivo de devolución...',
      required: true,
    });
    if (!motivo) return;

    try {
      const res = await volverMemoriaBorrador(mem.id, motivo);
      alertService.success('Devuelto a Borrador', res.message);
      if (selectedGestionId) await cargarMemorias(selectedGestionId);
    } catch (err) {
      alertService.error('Error', 'Error al regresar a borrador.');
    }
  }

  const getBadgeEstado = (estado: string) => {
    switch (estado) {
      case 'BORRADOR':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"><Clock size={12} /> Borrador</span>;
      case 'PENDIENTE_GERENCIA':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"><AlertCircle size={12} /> Pendiente Gerencia</span>;
      case 'APROBADO_GERENCIA':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"><CheckCircle2 size={12} /> Aprobado Gerencia</span>;
      case 'APROBADO_FINANZAS':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"><CheckCircle2 size={12} /> Aprobado Finanzas</span>;
      case 'RECHAZADO':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"><XCircle size={12} /> Rechazado</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100">{estado}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Notificación Feedback */}
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
          <button onClick={() => setFeedbackMsg(null)} className="text-xs opacity-75 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="card p-6 bg-gradient-to-r from-theme-surface via-theme-surface to-brand-50/20 dark:to-brand-900/10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-theme-primary/15 text-theme-main">
              <BookOpenText size={28} className="text-theme-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-theme-main tracking-tight">Módulo de Memorias de Cálculo</h1>
              <p className="text-sm text-theme-muted">
                Formulación, sustento técnico ítem por ítem y ciclo de aprobación para la Planificación Operativa Anual (POA).
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

            {canCreate && (
              <button
                onClick={handleOpenCrear}
                disabled={isGestionBloqueada}
                className="btn-primary text-xs font-semibold px-4 py-2 flex items-center gap-1.5"
              >
                <Plus size={15} /> Formular Memoria
              </button>
            )}
          </div>
        </div>

        {isGestionBloqueada && (
          <div className="mt-4 p-3 bg-blue-50/70 border border-blue-200 dark:bg-blue-950/40 dark:border-blue-800 rounded-xl flex items-center gap-3 text-xs text-blue-800 dark:text-blue-300">
            <Lock size={16} className="shrink-0 text-blue-600 dark:text-blue-400" />
            <span>
              <strong>Formulación de la Gestión {activeGestion?.anio} cerrada:</strong> Las memorias de cálculo están consolidadas para el presupuesto y no admiten modificaciones.
            </span>
          </div>
        )}
      </div>

      {/* Bandejas / Pestañas de Trabajo */}
      <div className="flex border-b border-theme-border gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('todas')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'todas' ? 'border-theme-primary text-theme-main font-bold' : 'border-transparent text-theme-muted hover:text-theme-main'
          }`}
        >
          <Layers size={16} /> Todas ({conteos.todas})
        </button>

        <button
          onClick={() => setActiveTab('borrador')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'borrador' ? 'border-theme-primary text-theme-main font-bold' : 'border-transparent text-theme-muted hover:text-theme-main'
          }`}
        >
          <Clock size={16} /> En Borrador ({conteos.borrador})
        </button>

        <button
          onClick={() => setActiveTab('pendiente')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'pendiente' ? 'border-amber-500 text-amber-600 font-bold' : 'border-transparent text-theme-muted hover:text-theme-main'
          }`}
        >
          <AlertCircle size={16} /> Pendientes de Gerencia ({conteos.pendiente})
        </button>

        <button
          onClick={() => setActiveTab('finanzas')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'finanzas' ? 'border-blue-500 text-blue-600 font-bold' : 'border-transparent text-theme-muted hover:text-theme-main'
          }`}
        >
          <CheckCircle2 size={16} /> Revisión Finanzas / Economía ({conteos.finanzas})
        </button>

        <button
          onClick={() => setActiveTab('aprobadas')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'aprobadas' ? 'border-emerald-500 text-emerald-600 font-bold' : 'border-transparent text-theme-muted hover:text-theme-main'
          }`}
        >
          <Sparkles size={16} /> Aprobadas POA ({conteos.aprobadas})
        </button>

        <button
          onClick={() => setActiveTab('rechazadas')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'rechazadas' ? 'border-rose-500 text-rose-600 font-bold' : 'border-transparent text-theme-muted hover:text-theme-main'
          }`}
        >
          <XCircle size={16} /> Rechazadas ({conteos.rechazadas})
        </button>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="card p-4 flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-muted" />
          <input
            type="text"
            placeholder="Buscar por código, partida, justificación o gerencia..."
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

      {/* Tabla de Memorias */}
      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-theme-border bg-theme-base/60 text-xs font-semibold uppercase tracking-wider text-theme-muted">
              <th className="py-3.5 px-4">Código</th>
              <th className="py-3.5 px-4">Área / Sección</th>
              <th className="py-3.5 px-4">Partida Presupuestaria</th>
              <th className="py-3.5 px-4">Justificación / Requerimiento</th>
              <th className="py-3.5 px-4 text-center">Ítems</th>
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
                  <p className="font-medium">No se encontraron memorias en esta bandeja.</p>
                  {!isGestionBloqueada && (
                    <button onClick={handleOpenCrear} className="btn-primary mt-3 text-xs">
                      Crear Memoria de Cálculo
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              memoriasPaginadas.map((mem) => {
                const total = parseFloat(mem.total_presupuesto || '0');
                return (
                  <tr key={mem.id} className="hover:bg-theme-border/20 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-xs text-theme-main">{mem.codigo}</td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-theme-main text-xs">{mem.area_nombre}</p>
                      <p className="text-[11px] text-theme-muted">{mem.seccion_nombre}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-mono font-bold text-xs text-theme-main">{mem.partida_codigo || 'Partida'}</p>
                      <p className="text-[11px] text-theme-muted line-clamp-1">{mem.partida_nombre || 'Sin partida'}</p>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-xs text-theme-main line-clamp-2">{mem.justificacion}</p>
                      {mem.motivo_rechazo && (
                        <p className={`text-[11px] font-medium mt-1 p-1.5 rounded-lg border ${
                          mem.estado === 'RECHAZADO'
                            ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300'
                            : 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-300'
                        }`}>
                          💬 <strong>{mem.estado === 'RECHAZADO' ? 'Motivo Rechazo:' : 'Nota / Obs:'}</strong> "{mem.motivo_rechazo}"
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-theme-border/60 text-theme-muted">
                        {mem.detalles?.length || 0}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-theme-main text-xs">{formatMoney(total)}</td>
                    <td className="py-3.5 px-4 text-center">{getBadgeEstado(mem.estado)}</td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Ver Ficha Oficial / Detalle */}
                        <button
                          onClick={async () => {
                            try {
                              const memoriaCompleta = await getMemoria(mem.id);
                              setFichaMemoria(memoriaCompleta);
                            } catch (err) {
                              console.error('Error al cargar ficha:', err);
                              mostrarMensaje('error', 'No se pudo cargar la ficha técnica.');
                            }
                          }}
                          className="p-1.5 rounded-lg text-theme-muted hover:text-theme-main hover:bg-theme-border/40 transition-colors"
                          title="Ver Ficha Técnica Oficial"
                        >
                          <Eye size={15} />
                        </button>

                        {/* Flujo de Estados */}
                        {mem.estado === 'BORRADOR' && (
                          <>
                            {isElaborador && (
                              <button
                                onClick={() => handleEnviar(mem)}
                                className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-500/10 transition-colors"
                                title="Enviar a Revisión de Gerencia"
                              >
                                <Send size={15} />
                              </button>
                            )}
                            {(isGerente || isAprobador) && (
                              <>
                                <button
                                  onClick={() => handleAprobarGerente(mem)}
                                  className="px-2 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-[11px] font-semibold flex items-center gap-1"
                                  title="Aprobar como Gerente de Área"
                                >
                                  <CheckCircle2 size={13} /> Aprobar Gerencia
                                </button>
                                <button
                                  onClick={() => handleRechazar(mem)}
                                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-500/10 transition-colors"
                                  title="Rechazar"
                                >
                                  <XCircle size={15} />
                                </button>
                              </>
                            )}
                            {!isGestionBloqueada && (isElaborador || isGerente || isAprobador) && (
                              <button
                                onClick={() => handleOpenEditar(mem)}
                                className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-500/10 transition-colors"
                                title="Editar"
                              >
                                <Edit3 size={15} />
                              </button>
                            )}
                            {!isGestionBloqueada && (isElaborador || isAprobador) && (
                              <button
                                onClick={() => handleDelete(mem.id)}
                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-500/10 transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </>
                        )}

                        {mem.estado === 'PENDIENTE_GERENCIA' && (isAprobador || isGerente) && (
                          <>
                            <button
                              onClick={() => handleAprobarGerente(mem)}
                              className="px-2 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-[11px] font-semibold flex items-center gap-1"
                              title="Aprobar como Gerente de Área"
                            >
                              <CheckCircle2 size={13} /> Aprobar Gerencia
                            </button>
                            <button
                              onClick={() => handleRechazar(mem)}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-500/10 transition-colors"
                              title="Rechazar"
                            >
                              <XCircle size={15} />
                            </button>
                            {!isGestionBloqueada && (
                              <button
                                onClick={() => handleOpenEditar(mem)}
                                className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-500/10 transition-colors"
                                title="Editar"
                              >
                                <Edit3 size={15} />
                              </button>
                            )}
                          </>
                        )}

                        {(mem.estado === 'APROBADO_GERENCIA' || mem.estado === 'PENDIENTE_PLANIFICACION' || mem.estado === 'APROBADO_PLANIFICACION') && isAprobador && (
                          <>
                            <button
                              onClick={() => handleAprobarFinanciero(mem)}
                              className="px-2 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-[11px] font-semibold flex items-center gap-1"
                              title="Aprobación Final"
                            >
                              <CheckCircle2 size={13} /> Aprobar Finanzas
                            </button>
                            <button
                              onClick={() => handleRechazar(mem)}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-500/10 transition-colors"
                              title="Rechazar"
                            >
                              <XCircle size={15} />
                            </button>
                            {!isGestionBloqueada && (
                              <button
                                onClick={() => handleOpenEditar(mem)}
                                className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-500/10 transition-colors"
                                title="Editar"
                              >
                                <Edit3 size={15} />
                              </button>
                            )}
                          </>
                        )}

                        {mem.estado === 'RECHAZADO' && (canCreate || isGerente) && (
                          <button
                            onClick={() => handleVolverABorrador(mem)}
                            className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-500/10 transition-colors"
                            title="Volver a Borrador para correcciones"
                          >
                            <RefreshCw size={15} />
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

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-theme-border">
          <p className="text-xs text-theme-muted">
            Mostrando {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, memoriasFiltradas.length)} de {memoriasFiltradas.length} memorias
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-theme-border text-theme-muted hover:text-theme-main disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Anterior
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...');
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                p === '...' ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-xs text-theme-muted">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p as number)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      currentPage === p
                        ? 'border-theme-primary bg-theme-primary text-white'
                        : 'border-theme-border text-theme-muted hover:text-theme-main'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-theme-border text-theme-muted hover:text-theme-main disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {/* Modal Formulación / Edición */}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  {isAprobador ? (
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
                  ) : (
                    <div className="input-theme text-xs bg-theme-base/60 text-theme-main font-semibold py-2.5 px-3 flex items-center gap-2 cursor-not-allowed">
                      <Building2 size={14} className="text-theme-muted" />
                      <span>
                        {secciones.find((s) => s.id === formMemoria.seccionId)?.nombre || user?.seccion_nombre || 'Sección Asignada'}
                        {' '}
                        <span className="text-[10px] text-theme-muted font-normal">
                          ({secciones.find((s) => s.id === formMemoria.seccionId)?.area_nombre || user?.area_nombre || 'Área'})
                        </span>
                      </span>
                    </div>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase text-theme-muted mb-1">
                    Partida Presupuestaria de Egreso *
                  </label>

                  {/* Combobox selector de partida */}
                  <div className="relative" ref={partidaSelectorRef}>
                    {/* Partida seleccionada – actúa como trigger */}
                    {(() => {
                      const selected = partidas.find((p) => p.id === Number(formMemoria.partidaId));
                      return (
                        <button
                          type="button"
                          onClick={() => setPartidaSelectorOpen(!partidaSelectorOpen)}
                          className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-theme-border bg-theme-surface hover:border-theme-primary focus:outline-none focus:border-theme-primary transition-colors text-left"
                        >
                          {selected ? (
                            <span className="flex-1 min-w-0">
                              <span className="font-mono font-bold text-xs text-theme-primary mr-2">
                                {selected.codigo}
                              </span>
                              <span className="text-xs text-theme-main line-clamp-1">{selected.nombre}</span>
                            </span>
                          ) : (
                            <span className="text-xs text-theme-muted">Seleccione una partida de egreso...</span>
                          )}
                          <svg
                            className={`w-4 h-4 shrink-0 text-theme-muted transition-transform ${partidaSelectorOpen ? 'rotate-180' : ''}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      );
                    })()}

                    {/* Dropdown con búsqueda y lista */}
                    {partidaSelectorOpen && (
                      <div className="absolute z-50 mt-1 w-full bg-theme-surface border border-theme-border rounded-xl shadow-xl overflow-hidden flex flex-col"
                           style={{ maxHeight: '320px' }}>
                        <div className="p-2 border-b border-theme-border sticky top-0 bg-theme-surface z-10">
                          <div className="relative">
                            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-theme-muted" />
                            <input
                              autoFocus
                              type="text"
                              value={searchPartidaQuery}
                              onChange={(e) => setSearchPartidaQuery(e.target.value)}
                              placeholder="Buscar por código, nombre o grupo..."
                              className="w-full pl-7 pr-3 py-1.5 text-xs rounded-lg border border-theme-border bg-theme-base focus:outline-none focus:border-theme-primary text-theme-main placeholder:text-theme-muted"
                            />
                          </div>
                          <p className="text-[10px] text-theme-muted mt-1 ml-1">
                            {filteredPartidas.length} partidas seleccionables (solo hojas de egreso)
                          </p>
                        </div>

                        {/* Lista de resultados agrupados */}
                        <div className="overflow-y-auto" style={{ maxHeight: '300px' }}>
                          {filteredPartidas.length === 0 ? (
                            <div className="py-8 text-center text-theme-muted text-xs">
                              No se encontraron partidas de egreso
                            </div>
                          ) : (
                            groupedPartidas.map((group, gIdx) => (
                              <div key={gIdx}>
                                {/* Encabezado de grupo (padre – no seleccionable) */}
                                {group.parent && (
                                  <div className="flex items-center gap-2 px-3 py-1.5 bg-theme-base/80 border-b border-theme-border/60 sticky top-0 z-[5]">
                                    <span className="font-mono text-[10px] font-bold text-theme-muted/70 bg-theme-border/60 px-1 rounded">
                                      {group.parent.codigo}
                                    </span>
                                    <span className="text-[10px] font-semibold text-theme-muted uppercase tracking-wide line-clamp-1">
                                      {group.parent.nombre}
                                    </span>
                                  </div>
                                )}

                                {/* Hojas seleccionables del grupo */}
                                {group.leafs.map((p) => {
                                  const isActive = p.id === Number(formMemoria.partidaId);
                                  const parent = parentMap.get(p.codigo);
                                  return (
                                    <button
                                      key={p.id}
                                      type="button"
                                      onClick={() => {
                                        setFormMemoria({ ...formMemoria, partidaId: p.id });
                                        setPartidaSelectorOpen(false);
                                        setSearchPartidaQuery('');
                                      }}
                                      className={`w-full flex items-start gap-3 pl-5 pr-3 py-2.5 text-left transition-colors border-b border-theme-border/30 last:border-0 ${
                                        isActive
                                          ? 'bg-theme-primary/10 hover:bg-theme-primary/15'
                                          : 'hover:bg-theme-border/30'
                                      }`}
                                    >
                                      {/* Línea de indentación visual */}
                                      <span className="shrink-0 flex items-start pt-0.5">
                                        <span className="w-3 h-px bg-theme-border/70 mt-2 mr-1" />
                                      </span>

                                      <span
                                        className={`shrink-0 font-mono font-bold text-[11px] px-1.5 py-0.5 rounded-md ${
                                          isActive
                                            ? 'bg-theme-primary text-white'
                                            : 'bg-theme-base text-theme-primary border border-theme-border'
                                        }`}
                                      >
                                        {p.codigo}
                                      </span>

                                      <div className="flex-1 min-w-0">
                                        <p className={`text-xs leading-tight ${isActive ? 'font-semibold text-theme-main' : 'text-theme-main'}`}>
                                          {p.nombre}
                                        </p>
                                        {/* Breadcrumb de padre en modo búsqueda */}
                                        {searchPartidaQuery.trim() && parent && (
                                          <p className="text-[10px] text-theme-muted mt-0.5 flex items-center gap-1">
                                            <span className="font-mono">{parent.codigo}</span>
                                            <span className="opacity-50">›</span>
                                            <span className="line-clamp-1">{parent.nombre}</span>
                                          </p>
                                        )}
                                      </div>

                                      {isActive && (
                                        <Check size={14} className="shrink-0 text-theme-primary mt-0.5" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {/* Hidden input for form validation */}
                    <input
                      type="text"
                      required
                      readOnly
                      tabIndex={-1}
                      value={formMemoria.partidaId}
                      className="absolute opacity-0 h-0 w-0 pointer-events-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-theme-muted mb-1">
                  Justificación Técnica / Sustento del Requerimiento *
                </label>
                <textarea
                  required
                  rows={2}
                  value={formMemoria.justificacion}
                  onChange={(e) => setFormMemoria({ ...formMemoria, justificacion: e.target.value })}
                  placeholder="Detalle los objetivos operativos y necesidad institucional de los bienes o servicios solicitados..."
                  className="input-theme text-xs"
                />
              </div>

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
                                placeholder="Ej. Renovación de licencias de servidor..."
                                value={renglon.descripcion}
                                onChange={(e) => handleUpdateRenglon(idx, 'descripcion', e.target.value)}
                                className="w-full bg-transparent border-b border-theme-border/60 focus:border-theme-primary px-1 py-1 focus:outline-none text-theme-main"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                required
                                placeholder="Servicio, Licencia, Unidad..."
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

                <div className="mt-3 flex justify-end items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-theme-muted">
                    Total Presupuesto Proyectado:
                  </span>
                  <span className="text-lg font-bold text-theme-primary">{formatMoney(totalCalculadoMemoria)}</span>
                </div>
              </div>

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

      {/* Ficha Oficial / Modal Detallado de Memoria */}
      {fichaMemoria && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl bg-theme-surface">
            <div className="p-5 border-b border-theme-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="text-theme-primary" size={20} />
                <span className="text-sm font-bold text-theme-main font-mono">
                  FICHA TÉCNICA POA • {fichaMemoria.codigo}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-1.5 rounded-lg border border-theme-border text-theme-muted hover:text-theme-main text-xs flex items-center gap-1"
                >
                  <Printer size={14} /> Imprimir
                </button>
                <button onClick={() => setFichaMemoria(null)} className="text-theme-muted hover:text-theme-main text-lg font-bold">
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-theme-base border border-theme-border">
                <div>
                  <span className="text-theme-muted uppercase font-semibold">Área Solicitante:</span>
                  <p className="font-bold text-theme-main mt-0.5">{fichaMemoria.area_nombre}</p>
                  <p className="text-[11px] text-theme-muted">{fichaMemoria.seccion_nombre}</p>
                </div>
                <div>
                  <span className="text-theme-muted uppercase font-semibold">Partida Presupuestaria:</span>
                  <p className="font-mono font-bold text-theme-main mt-0.5">{fichaMemoria.partida_codigo}</p>
                  <p className="text-[11px] text-theme-muted">{fichaMemoria.partida_nombre}</p>
                </div>
                <div>
                  <span className="text-theme-muted uppercase font-semibold">Estado Actual:</span>
                  <div className="mt-0.5">{getBadgeEstado(fichaMemoria.estado)}</div>
                </div>
                <div>
                  <span className="text-theme-muted uppercase font-semibold">Monto Total:</span>
                  <p className="font-bold text-theme-primary text-base mt-0.5">{formatMoney(fichaMemoria.total_presupuesto)}</p>
                </div>
              </div>

              <div>
                <span className="text-theme-muted uppercase font-semibold">Justificación y Sustento:</span>
                <p className="p-3 mt-1 rounded-xl bg-theme-base border border-theme-border text-theme-main text-xs leading-relaxed">
                  {fichaMemoria.justificacion}
                </p>
                {fichaMemoria.motivo_rechazo && (
                  <div className={`mt-2.5 p-3 rounded-xl border text-xs ${
                    fichaMemoria.estado === 'RECHAZADO'
                      ? 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-200'
                      : 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-200'
                  }`}>
                    <strong>💬 {fichaMemoria.estado === 'RECHAZADO' ? 'Motivo del Rechazo:' : 'Nota de Revisión / Aprobación:'}</strong>
                    <p className="mt-1 font-medium italic">"{fichaMemoria.motivo_rechazo}"</p>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-bold text-theme-main mb-2 uppercase tracking-wider text-xs">Renglones Detallados de la Memoria</h4>
                <div className="border border-theme-border rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-theme-base border-b border-theme-border font-semibold text-theme-muted">
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Descripción</th>
                        <th className="py-2.5 px-3">U. Medida</th>
                        <th className="py-2.5 px-3 text-right">Cantidad</th>
                        <th className="py-2.5 px-3 text-right">P. Unitario</th>
                        <th className="py-2.5 px-3 text-right">Total Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-border">
                      {(fichaMemoria.detalles || []).map((d, idx) => (
                        <tr key={d.id || idx}>
                          <td className="py-2.5 px-3 font-bold text-theme-muted">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-medium text-theme-main">{d.descripcion}</td>
                          <td className="py-2.5 px-3 text-theme-muted">{d.unidad_medida}</td>
                          <td className="py-2.5 px-3 text-right font-semibold">{d.cantidad}</td>
                          <td className="py-2.5 px-3 text-right font-semibold">{formatMoney(d.precio_unitario)}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-theme-main">{formatMoney(d.precio_total || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Registro de Participantes / Firmas */}
              <div className="border-t border-theme-border pt-4">
                <span className="text-theme-muted uppercase font-semibold text-xs">Registro de Control y Firmas:</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                  <div className="p-3 rounded-xl bg-theme-base border border-theme-border text-center">
                    <span className="text-[10px] uppercase font-bold text-theme-muted block">Elaborador</span>
                    <p className="font-semibold text-xs text-theme-main mt-1">Usuario Solicitante</p>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">✓ Registrado</span>
                  </div>

                  <div className="p-3 rounded-xl bg-theme-base border border-theme-border text-center">
                    <span className="text-[10px] uppercase font-bold text-theme-muted block">Revisión Gerencial</span>
                    <p className="font-semibold text-xs text-theme-main mt-1">Gerencia de Área</p>
                    {['APROBADO_GERENCIA', 'APROBADO_FINANZAS'].includes(fichaMemoria.estado) ? (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">✓ Aprobado</span>
                    ) : (
                      <span className="text-[10px] text-amber-600 font-medium">⏳ Pendiente</span>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-theme-base border border-theme-border text-center">
                    <span className="text-[10px] uppercase font-bold text-theme-muted block">Finanzas / Economía</span>
                    <p className="font-semibold text-xs text-theme-main mt-1">Aprobación Final POA</p>
                    {fichaMemoria.estado === 'APROBADO_FINANZAS' ? (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">✓ Aprobado (Septiembre)</span>
                    ) : (
                      <span className="text-[10px] text-amber-600 font-medium">⏳ Pendiente</span>
                    )}
                </div>
              </div>
            </div>
          </div>

            <div className="p-4 border-t border-theme-border flex justify-end">
              <button onClick={() => setFichaMemoria(null)} className="btn-primary text-xs px-5 py-2">
                Cerrar Ficha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
