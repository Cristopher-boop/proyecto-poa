import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  enviarTodasMemoriasGerencia,
  aprobarMemoriaGerencia,
  aprobarMemoriaPlanificacion,
  aprobarMemoriaFinanzas,
  rechazarMemoria,
  volverMemoriaBorrador,
  getPartidas,
  getAreas,
  getSecciones,
} from '../../services/presupuestoService';
import { planificacionService } from '../../services/planificacionService';
import { Operacion, AccionCortoPlazo } from '../../types/planificacion';

export default function MemoriasPage() {
  const [searchParams] = useSearchParams();
  const [gestiones, setGestiones] = useState<Gestion[]>([]);
  const [selectedGestionId, setSelectedGestionId] = useState<number | null>(null);
  const [memorias, setMemorias] = useState<MemoriaCalculo[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const PAGE_SIZE = 15;
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [operaciones, setOperaciones] = useState<Operacion[]>([]);
  const [accionesCortoPlazo, setAccionesCortoPlazo] = useState<AccionCortoPlazo[]>([]);

  const { user } = useAuth();
  const rolName = (user?.rol_nombre || (user as any)?.rol?.nombre || '').toUpperCase().trim();
  const rolClean = rolName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const isSuperuser = !!user?.is_superuser;
  const isAprobador = isSuperuser || rolClean === 'APROBADOR' || rolClean === 'ADMINISTRADOR';
  const isPlanificador = !isSuperuser && rolClean.includes('PLANIFIC');
  const isGerente = !isSuperuser && !isPlanificador && rolClean === 'GERENTE';
  const isElaborador = !isSuperuser && !isAprobador && !isPlanificador && !isGerente && rolClean === 'ELABORADOR';
  const isTrabajador = !isSuperuser && !isAprobador && !isPlanificador && !isGerente && !isElaborador;

  // Solo Elaborador y Aprobador/Superadmin pueden crear/formular nuevas memorias (Planificador NO formula)
  const canCreate = isAprobador || isElaborador;
  // Solo Superadmin, Aprobador y Planificador pueden ver todas las áreas institucionales
  const canGlobalView = isAprobador || isPlanificador;

  const [activeTab, setActiveTab] = useState<'todas' | 'borrador' | 'espera' | 'pendiente' | 'planificacion' | 'finanzas' | 'aprobadas' | 'rechazadas'>('todas');
  const [highlightedMemoriaId, setHighlightedMemoriaId] = useState<number | null>(null);
  const [soloPendientesGerente, setSoloPendientesGerente] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [filtroArea, setFiltroArea] = useState<string>('todas');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modales
  const [showModalMemoria, setShowModalMemoria] = useState<boolean>(false);
  const [editingMemoria, setEditingMemoria] = useState<MemoriaCalculo | null>(null);
  const [fichaMemoria, setFichaMemoria] = useState<MemoriaCalculo | null>(null);

  // Quick Operación inline creation
  const [showQuickOperacion, setShowQuickOperacion] = useState<boolean>(false);
  const [quickOpForm, setQuickOpForm] = useState<{
    codigo: string;
    descripcion: string;
    acp_id: number | '';
    es_contratacion: boolean;
  }>({
    codigo: '',
    descripcion: '',
    acp_id: '',
    es_contratacion: true,
  });

  // Formulario
  const [formMemoria, setFormMemoria] = useState<{
    codigo: string;
    seccionId: number | '';
    operacionId: number | '';
    es_contratacion: boolean;
    justificacion: string;
    partidaId: number | '';
    renglones: Array<{
      descripcion: string;
      unidad_medida: string;
      cantidad: number | string;
      precio_unitario: number | string;
    }>;
  }>({
    codigo: '',
    seccionId: '',
    operacionId: '',
    es_contratacion: false,
    justificacion: '',
    partidaId: '',
    renglones: [{ descripcion: '', unidad_medida: 'UNIDAD', cantidad: 1, precio_unitario: '' }],
  });

  const [searchPartidaQuery, setSearchPartidaQuery] = useState<string>('');

  const targetMemoriaId = searchParams.get('id') || searchParams.get('memoria');

  // Pestaña inicial según el rol del usuario (cuando no entra por notificación)
  useEffect(() => {
    if (!targetMemoriaId && user) {
      if (isSuperuser) setActiveTab('todas');
      else if (isAprobador) setActiveTab('finanzas');
      else if (isPlanificador) setActiveTab('planificacion');
      else if (isGerente) setActiveTab('espera');
      else if (isElaborador) setActiveTab('borrador');
      else if (isTrabajador) setActiveTab('todas');
    }
  }, [user?.rol_nombre, isSuperuser, isAprobador, isPlanificador, isGerente, isElaborador, isTrabajador, targetMemoriaId]);

  useEffect(() => {
    cargarBase();
  }, []);

  useEffect(() => {
    if (selectedGestionId) {
      cargarMemorias(selectedGestionId);
    }
  }, [selectedGestionId]);

  // Deep linking: Abrir modal de ficha técnica, situar pestaña correspondiente y parpadear fila al hacer clic en notificación
  useEffect(() => {
    if (targetMemoriaId) {
      const idNum = Number(targetMemoriaId);
      if (!isNaN(idNum) && idNum > 0) {
        getMemoria(idNum)
          .then((mem) => {
            if (mem && mem.id) {
              setFichaMemoria(mem);
              setHighlightedMemoriaId(mem.id);
              if (mem.gestion && (!selectedGestionId || mem.gestion !== selectedGestionId)) {
                setSelectedGestionId(mem.gestion);
              }

              // Posicionar en la pestaña de interés adecuada según el estado de la memoria y el rol
              if (mem.estado === 'RECHAZADO') {
                setActiveTab('rechazadas');
              } else if (mem.estado === 'APROBADO_FINANZAS') {
                setActiveTab('aprobadas');
              } else if (mem.estado === 'BORRADOR') {
                setActiveTab('borrador');
              } else if (mem.estado === 'PENDIENTE_PLANIFICACION') {
                if (isPlanificador) setActiveTab('planificacion');
                else if (isAprobador) setActiveTab('todas');
                else setActiveTab('espera');
              } else if (mem.estado === 'APROBADO_GERENCIA' || mem.estado === 'APROBADO_PLANIFICACION') {
                if (isAprobador) setActiveTab('finanzas');
                else setActiveTab('espera');
              } else if (mem.estado === 'PENDIENTE_GERENCIA') {
                if (isAprobador) setActiveTab('todas');
                else setActiveTab('espera');
              }

              // Auto-limpiar el resaltado después de 6 segundos
              setTimeout(() => {
                setHighlightedMemoriaId(null);
              }, 6000);
            }
          })
          .catch((err) => {
            console.error('No se pudo abrir la memoria vinculada a la notificación:', err);
          });
      }
    }
  }, [targetMemoriaId, isAprobador, isPlanificador, isGerente, isElaborador]);

  async function cargarBase() {
    setLoading(true);
    try {
      const [gList, pList, aList, sList, opList, acpList] = await Promise.all([
        getGestiones(),
        getPartidas(),
        getAreas(),
        getSecciones(),
        planificacionService.getOperaciones(),
        planificacionService.getAccionesCortoPlazo(),
      ]);
      setGestiones(gList);
      setPartidas(pList);
      setAreas(aList);
      setSecciones(sList);
      setOperaciones(opList);
      setAccionesCortoPlazo(acpList);

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

  const isGestionBloqueada = activeGestion?.estado === 'FINALIZADO';

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

  // Helper para verificar si una partida está activa (estado !== 0 / false)
  const isPartidaActiva = (p: Partida | null | undefined): boolean => {
    if (!p) return false;
    return p.estado === true || (p.estado as any) === 1 || (p.estado as any) === '1';
  };

  // Helper para verificar que una partida Y TODOS sus ancestros (padres/abuelos) estén activos
  const isPartidaYAncestrosActivos = (p: Partida, allPartidas: Partida[]): boolean => {
    if (!isPartidaActiva(p)) return false;

    const leafPrefix = p.codigo.replace(/0+$/, '');
    if (!leafPrefix) return isPartidaActiva(p);

    // Encontrar todos los ancestros de p en el catálogo
    const ancestors = allPartidas.filter((anc) => {
      if (anc.codigo === p.codigo) return false;
      const ancPrefix = anc.codigo.replace(/0+$/, '');
      return ancPrefix && leafPrefix.startsWith(ancPrefix);
    });

    // Si ALGÚN ancestro está inactivo (estado 0/false), entonces la partida NO se puede seleccionar ni ver
    const algunAncInactivo = ancestors.some((anc) => !isPartidaActiva(anc));
    return !algunAncInactivo;
  };

  // ── Partidas de EGRESO: jerarquía de hojas válidas (activas con padres activos) ──────────────────
  const egresoPartidas = useMemo(
    () => partidas.filter((p) => p.clase === 'EGRESO'),
    [partidas]
  );

  // Filtrar únicamente las partidas que están activas y cuyos padres/ancestros también están activos
  const egresoPartidasActivas = useMemo(() => {
    return egresoPartidas.filter((p) => isPartidaYAncestrosActivos(p, egresoPartidas));
  }, [egresoPartidas]);

  const egresoCodesActivos = useMemo(
    () => egresoPartidasActivas.map((p) => p.codigo),
    [egresoPartidasActivas]
  );

  const egresoLeafs = useMemo(() => {
    return egresoPartidasActivas.filter((p) => {
      const prefix = p.codigo.replace(/0+$/, '');
      if (!prefix) return false; // código todo-ceros → padre
      // Si ALGÚN otro código activo empieza con este prefijo → es padre, no hoja
      return !egresoCodesActivos.some((c) => c !== p.codigo && c.startsWith(prefix));
    });
  }, [egresoPartidasActivas, egresoCodesActivos]);

  // Para cada hoja activa, obtener su padre directo (prefijo más largo activo)
  const parentMap = useMemo(() => {
    const map = new Map<string, Partida>();
    for (const leaf of egresoLeafs) {
      const leafPrefix = leaf.codigo.replace(/0+$/, '');
      const ancestors = egresoPartidasActivas.filter((p) => {
        if (p.codigo === leaf.codigo) return false;
        const pPrefix = p.codigo.replace(/0+$/, '');
        return pPrefix && leafPrefix.startsWith(pPrefix);
      });
      if (ancestors.length > 0) {
        ancestors.sort(
          (a, b) =>
            b.codigo.replace(/0+$/, '').length - a.codigo.replace(/0+$/, '').length
        );
        map.set(leaf.codigo, ancestors[0]);
      }
    }
    return map;
  }, [egresoLeafs, egresoPartidasActivas]);

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
    const estadosEspera = ['PENDIENTE_GERENCIA', 'PENDIENTE_PLANIFICACION', 'APROBADO_GERENCIA', 'APROBADO_PLANIFICACION'];
    return {
      todas: arr.length,
      borrador: arr.filter((m) => m.estado === 'BORRADOR').length,
      espera: arr.filter((m) => estadosEspera.includes(m.estado)).length,
      pendiente: arr.filter((m) => m.estado === 'PENDIENTE_GERENCIA').length,
      planificacion: arr.filter((m) => m.estado === 'PENDIENTE_PLANIFICACION').length,
      finanzas: arr.filter((m) => m.estado === 'APROBADO_GERENCIA' || m.estado === 'APROBADO_PLANIFICACION').length,
      aprobadas: arr.filter((m) => m.estado === 'APROBADO_FINANZAS').length,
      rechazadas: arr.filter((m) => m.estado === 'RECHAZADO').length,
      montoTotal: arr.reduce((acc, m) => acc + parseFloat(m.total_presupuesto || '0'), 0),
    };
  }, [memorias]);

  // Memorias filtradas
  const memoriasFiltradas = useMemo(() => {
    const ordenEspera: Record<string, number> = {
      'PENDIENTE_GERENCIA': 1,
      'PENDIENTE_PLANIFICACION': 2,
      'APROBADO_GERENCIA': 3,
      'APROBADO_PLANIFICACION': 3,
    };

    const res = (Array.isArray(memorias) ? memorias : []).filter((m) => {
      let matchTab = true;
      if (activeTab === 'borrador') matchTab = m.estado === 'BORRADOR';
      else if (activeTab === 'espera') {
        if (isGerente && soloPendientesGerente) {
          matchTab = m.estado === 'PENDIENTE_GERENCIA';
        } else {
          matchTab = ['PENDIENTE_GERENCIA', 'PENDIENTE_PLANIFICACION', 'APROBADO_GERENCIA', 'APROBADO_PLANIFICACION'].includes(m.estado);
        }
      }
      else if (activeTab === 'pendiente') matchTab = m.estado === 'PENDIENTE_GERENCIA';
      else if (activeTab === 'planificacion') matchTab = m.estado === 'PENDIENTE_PLANIFICACION';
      else if (activeTab === 'finanzas') matchTab = m.estado === 'APROBADO_GERENCIA' || m.estado === 'APROBADO_PLANIFICACION';
      else if (activeTab === 'aprobadas') matchTab = m.estado === 'APROBADO_FINANZAS';
      else if (activeTab === 'rechazadas') matchTab = m.estado === 'RECHAZADO';

      const matchArea = filtroArea === 'todas' || String(m.area_id) === filtroArea;
      const matchSearch =
        !searchTerm.trim() ||
        m.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.area_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.justificacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.operacion_codigo && m.operacion_codigo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.partida_codigo && m.partida_codigo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.partida_nombre && m.partida_nombre.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchTab && matchArea && matchSearch;
    });

    if (activeTab === 'espera') {
      return [...res].sort((a, b) => (ordenEspera[a.estado] || 99) - (ordenEspera[b.estado] || 99) || b.id - a.id);
    }

    return res;
  }, [memorias, activeTab, filtroArea, searchTerm, soloPendientesGerente, isGerente]);

  // Áreas presentes en la gestión actualmente seleccionada
  const areasEnGestion = useMemo(() => {
    const seen = new Map<number, { id: number; nombre: string }>();
    (Array.isArray(memorias) ? memorias : []).forEach((m) => {
      if (m.area_id && !seen.has(m.area_id)) {
        seen.set(m.area_id, { id: m.area_id, nombre: m.area_nombre });
      }
    });
    return Array.from(seen.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [memorias]);

  // Resetear filtroArea si el área ya no existe en la nueva gestión
  useEffect(() => {
    if (filtroArea !== 'todas' && !areasEnGestion.some((a) => String(a.id) === filtroArea)) {
      setFiltroArea('todas');
    }
  }, [areasEnGestion]);

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
      operacionId: '',
      es_contratacion: false,
      justificacion: '',
      partidaId: '',
      renglones: [{ descripcion: '', unidad_medida: 'UNIDAD', cantidad: 1, precio_unitario: '' }],
    });
    setSearchPartidaQuery('');
    setPartidaSelectorOpen(false);
    setShowQuickOperacion(false);
    setShowModalMemoria(true);
  }

  async function handleOpenEditar(mem: MemoriaCalculo) {
    try {
      // Cargamos la memoria completa (con detalles) antes de abrir el modal
      const memoriaCompleta = await getMemoria(mem.id);
      setEditingMemoria(memoriaCompleta);

      // Partida ID segura recuperada de la memoria
      const rawPartidaId =
        memoriaCompleta.partida_id ||
        (memoriaCompleta.detalles && (memoriaCompleta.detalles[0]?.partida || (memoriaCompleta.detalles[0] as any)?.partida_id)) ||
        (partidas.find((p) => p.codigo === memoriaCompleta.partida_codigo)?.id) ||
        (partidas.find((p) => p.codigo === (memoriaCompleta.detalles && memoriaCompleta.detalles[0]?.partida_codigo))?.id) ||
        (partidas.find((p) => p.codigo === mem.partida_codigo)?.id) ||
        '';

      const opId = typeof memoriaCompleta.operacion === 'object'
        ? (memoriaCompleta.operacion as any)?.id
        : (memoriaCompleta.operacion || (operaciones.find((o) => o.codigo === (memoriaCompleta.operacion_codigo || mem.operacion_codigo))?.id || ''));

      const secId = typeof memoriaCompleta.seccion === 'object'
        ? (memoriaCompleta.seccion as any)?.id
        : (memoriaCompleta.seccion || (secciones.find((s) => s.nombre === (memoriaCompleta.seccion_nombre || mem.seccion_nombre))?.id || user?.seccion || ''));

      setFormMemoria({
        codigo: memoriaCompleta.codigo || mem.codigo,
        seccionId: secId ? Number(secId) : '',
        operacionId: opId ? Number(opId) : '',
        es_contratacion: Boolean(memoriaCompleta.es_contratacion ?? mem.es_contratacion),
        justificacion: memoriaCompleta.justificacion || mem.justificacion || '',
        partidaId: rawPartidaId ? Number(rawPartidaId) : '',
        renglones: (memoriaCompleta.detalles && memoriaCompleta.detalles.length > 0)
          ? memoriaCompleta.detalles.map((d: any) => ({
              descripcion: d.descripcion || '',
              unidad_medida: d.unidad_medida || 'UNIDAD',
              cantidad: Number(d.cantidad) || 1,
              precio_unitario: d.precio_unitario !== undefined ? Number(d.precio_unitario) : 0,
            }))
          : [{ descripcion: '', unidad_medida: 'UNIDAD', cantidad: 1, precio_unitario: '' }],
      });
      setSearchPartidaQuery('');
      setPartidaSelectorOpen(false);
      setShowQuickOperacion(false);
      setShowModalMemoria(true);
    } catch (err) {
      console.error('Error al cargar memoria para edición:', err);
      mostrarMensaje('error', 'No se pudo cargar los detalles de la memoria.');
    }
  }

  async function handleSaveQuickOperacion() {
    if (!quickOpForm.codigo.trim() || !quickOpForm.descripcion.trim() || !quickOpForm.acp_id) {
      alertService.error('Campos Incompletos', 'Complete el código, descripción y ACP para la nueva Operación.');
      return;
    }
    const secObj = secciones.find((s) => s.id === Number(formMemoria.seccionId));
    const currentAreaId = secObj
      ? (secObj.area || secObj.area_id)
      : user?.area_id;

    if (!currentAreaId) {
      alertService.error('Área no detectada', 'Seleccione una sección/área antes de crear la Operación.');
      return;
    }

    try {
      const nuevaOp = await planificacionService.createOperacion({
        codigo: quickOpForm.codigo.trim().toUpperCase(),
        descripcion: quickOpForm.descripcion.trim().toUpperCase(),
        accion_corto_plazo: Number(quickOpForm.acp_id),
        area: Number(currentAreaId),
        es_contratacion: quickOpForm.es_contratacion,
      });
      alertService.success('Operación Creada', `Operación ${nuevaOp.codigo} creada y vinculada.`);
      // Recargar operaciones
      const ops = await planificacionService.getOperaciones();
      setOperaciones(ops);
      // Auto-seleccionar en la memoria
      setFormMemoria((prev) => ({
        ...prev,
        operacionId: nuevaOp.id,
        es_contratacion: nuevaOp.es_contratacion ?? prev.es_contratacion,
      }));
      setShowQuickOperacion(false);
      setQuickOpForm({ codigo: '', descripcion: '', acp_id: '', es_contratacion: true });
    } catch (err: any) {
      alertService.error('Error al Crear Operación', err.response?.data?.error || 'No se pudo crear la operación.');
    }
  }

  function handleAddRenglon() {
    setFormMemoria({
      ...formMemoria,
      renglones: [...formMemoria.renglones, { descripcion: '', unidad_medida: 'UNIDAD', cantidad: 1, precio_unitario: '' }],
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

    const finalSeccionId = Number(formMemoria.seccionId) || (editingMemoria ? (typeof editingMemoria.seccion === 'object' ? (editingMemoria.seccion as any)?.id : Number(editingMemoria.seccion)) : Number(user?.seccion || secciones[0]?.id));
    const finalPartidaId = Number(formMemoria.partidaId) || (editingMemoria ? Number(editingMemoria.partida_id || (editingMemoria.detalles && (editingMemoria.detalles[0]?.partida || (editingMemoria.detalles[0] as any)?.partida_id))) : 0);
    const finalOperacionId = Number(formMemoria.operacionId) || (editingMemoria ? (typeof editingMemoria.operacion === 'object' ? (editingMemoria.operacion as any)?.id : Number(editingMemoria.operacion)) : 0);

    if (!selectedGestionId || !finalSeccionId || !finalPartidaId) {
      mostrarMensaje('error', 'Complete la sección y la partida presupuestaria obligatorias.');
      alertService.error('Campos Incompletos', 'Complete la sección y la partida presupuestaria obligatorias.');
      return;
    }

    if (!finalOperacionId) {
      mostrarMensaje('error', 'Debe seleccionar o registrar una Operación POA obligatoria para alinear la Memoria de Cálculo.');
      alertService.error('Operación POA Obligatoria', 'Debe seleccionar o registrar una Operación POA obligatoria para vincular y formular la Memoria de Cálculo.');
      return;
    }

    if (formMemoria.renglones.some((r) => !r.descripcion.trim() || Number(r.cantidad) <= 0 || Number(r.precio_unitario) < 0)) {
      mostrarMensaje('error', 'Verifique que todos los renglones tengan descripción, cantidad > 0 y precio unitario.');
      alertService.error('Ítems Incompletos', 'Verifique que todos los renglones tengan descripción, cantidad > 0 y precio unitario.');
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        codigo: formMemoria.codigo.trim().toUpperCase(),
        gestion: selectedGestionId,
        seccion: finalSeccionId,
        operacion: finalOperacionId,
        es_contratacion: formMemoria.es_contratacion,
        justificacion: formMemoria.justificacion.trim().toUpperCase(),
        partida_id: finalPartidaId,
        detalles: formMemoria.renglones.map((r) => ({
          partida: finalPartidaId,
          partida_id: finalPartidaId,
          descripcion: r.descripcion.trim().toUpperCase(),
          unidad_medida: r.unidad_medida.trim().toUpperCase(),
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
      mostrarMensaje('error', err.response?.data?.error || 'Error al guardar memoria.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete(id: number) {
    const confirm = await alertService.confirm({
      title: '¿Eliminar Memoria de Cálculo?',
      text: 'Esta acción dará de baja la memoria de cálculo en estado Borrador.',
      confirmButtonText: 'Sí, eliminar',
      isDanger: true,
    });
    if (!confirm) return;

    try {
      await deleteMemoria(id);
      alertService.success('Memoria Eliminada', 'La memoria fue removida exitosamente.');
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

  async function handleEnviarTodas() {
    const borradoresCount = conteos.borrador;
    if (borradoresCount === 0) {
      alertService.info('Sin memorias', 'No existen memorias en estado Borrador para enviar.');
      return;
    }

    const confirm = await alertService.confirm({
      title: '¿Enviar todas a Gerencia?',
      text: `Se enviarán ${borradoresCount} memoria(s) en borrador para revisión y aprobación de Gerencia.`,
      confirmButtonText: `Sí, enviar todas (${borradoresCount})`,
    });
    if (!confirm) return;

    setActionLoading(true);
    try {
      const res = await enviarTodasMemoriasGerencia({
        gestion: selectedGestionId || undefined,
        seccion: !isAprobador ? (user?.seccion ? Number(user.seccion) : undefined) : undefined
      });
      alertService.success('Memorias Enviadas', res.message);
      if (selectedGestionId) await cargarMemorias(selectedGestionId);
      setActiveTab('pendiente');
    } catch (err: any) {
      alertService.error('Error', err.response?.data?.error || 'No se pudieron enviar las memorias.');
    } finally {
      setActionLoading(false);
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

  async function handleAprobarPlanificacion(mem: MemoriaCalculo) {
    const nota = await alertService.prompt({
      title: 'Validar Alineación por Planificación (SPO)',
      text: `¿Desea validar la memoria ${mem.codigo} con su Operación POA correspondiente? Puede adjuntar una nota u observación técnica.`,
      confirmButtonText: 'Validar y Derivar a Presupuestos',
      inputPlaceholder: 'Nota u observación técnica de Planificación (opcional)...',
    });
    if (nota === null) return;

    try {
      const res = await aprobarMemoriaPlanificacion(mem.id, nota);
      alertService.success('Alineación Validada', res.message);
      if (selectedGestionId) await cargarMemorias(selectedGestionId);
    } catch (err) {
      alertService.error('Error', 'Error al validar por planificación.');
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
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600 shadow-sm"><Clock size={12} /> Borrador</span>;
      case 'PENDIENTE_GERENCIA':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700 shadow-sm"><AlertCircle size={12} /> Pendiente Gerencia</span>;
      case 'PENDIENTE_PLANIFICACION':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-900 border border-indigo-300 dark:bg-indigo-950/90 dark:text-indigo-200 dark:border-indigo-700 shadow-sm"><AlertCircle size={12} /> Pendiente Planificación</span>;
      case 'APROBADO_GERENCIA':
      case 'APROBADO_PLANIFICACION':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300 dark:bg-blue-950/90 dark:text-blue-200 dark:border-blue-700 shadow-sm"><CheckCircle2 size={12} /> Pendiente Presupuestos</span>;
      case 'APROBADO_FINANZAS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700 shadow-sm">
            <CheckCircle2 size={12} /> Aprobado POA {activeGestion?.anio || ''}
          </span>
        );
      case 'RECHAZADO':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300 dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-700 shadow-sm"><XCircle size={12} /> Rechazado</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600">{estado}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Notificación Feedback */}
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
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${activeTab === 'todas' ? 'border-theme-primary text-theme-main font-bold' : 'border-transparent text-theme-muted hover:text-theme-main'
            }`}
        >
          <Layers size={16} /> Todas ({conteos.todas})
        </button>

        {/* En Borrador: visible para Elaborador, Trabajador, Gerente y Superadmin */}
        {(isElaborador || isTrabajador || isGerente || isSuperuser) && (
          <button
            onClick={() => setActiveTab('borrador')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${activeTab === 'borrador' ? 'border-theme-primary text-theme-main font-bold' : 'border-transparent text-theme-muted hover:text-theme-main'
              }`}
          >
            <Clock size={16} /> En Borrador ({conteos.borrador})
          </button>
        )}

        {/* En Espera: visible para Elaborador, Trabajador, Gerente y Superadmin */}
        {(isTrabajador || isElaborador || isGerente || isSuperuser) && (
          <button
            onClick={() => setActiveTab('espera')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${activeTab === 'espera' ? 'border-amber-500 text-amber-600 font-bold' : 'border-transparent text-theme-muted hover:text-theme-main'
              }`}
            title="Memorias en trámite de revisión (Gerencia, Planificación y Presupuestos)"
          >
            <Clock size={16} /> En Espera ({conteos.espera})
          </button>
        )}

        {/* Revisión Planificación SPO: Solo Planificador */}
        {isPlanificador && (
          <button
            onClick={() => setActiveTab('planificacion')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${activeTab === 'planificacion' ? 'border-indigo-500 text-indigo-600 font-bold' : 'border-transparent text-theme-muted hover:text-theme-main'
              }`}
          >
            <Building2 size={16} /> Revisión Planificación SPO ({conteos.planificacion})
          </button>
        )}

        {/* Revisión Presupuestos: Solo Aprobador (no SuperAdmin) */}
        {isAprobador && !isSuperuser && (
          <button
            onClick={() => setActiveTab('finanzas')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${activeTab === 'finanzas' ? 'border-blue-500 text-blue-600 font-bold' : 'border-transparent text-theme-muted hover:text-theme-main'
              }`}
          >
            <CheckCircle2 size={16} /> Revisión Presupuestos ({conteos.finanzas})
          </button>
        )}

        <button
          onClick={() => setActiveTab('aprobadas')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${activeTab === 'aprobadas' ? 'border-emerald-500 text-emerald-600 font-bold' : 'border-transparent text-theme-muted hover:text-theme-main'
            }`}
        >
          <Sparkles size={16} /> Aprobadas POA ({conteos.aprobadas})
        </button>

        <button
          onClick={() => setActiveTab('rechazadas')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${activeTab === 'rechazadas' ? 'border-rose-500 text-rose-600 font-bold' : 'border-transparent text-theme-muted hover:text-theme-main'
            }`}
        >
          <XCircle size={16} /> Rechazadas ({conteos.rechazadas})
        </button>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="card p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-1 flex-col md:flex-row gap-3 items-center w-full">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-muted" />
            <input
              type="text"
              placeholder="Buscar por código, partida, operación, justificación o gerencia..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-theme pl-10 text-xs"
            />
          </div>

          {(isPlanificador || isAprobador) && (
            <select
              value={filtroArea}
              onChange={(e) => setFiltroArea(e.target.value)}
              className="input-theme text-xs py-2 w-full md:w-56 bg-theme-surface text-theme-main"
            >
              <option value="todas" className="bg-white text-slate-900 dark:bg-[#272B33] dark:text-white">Todas las Áreas</option>
              {areas.map((a) => (
                <option key={a.id} value={String(a.id)} className="bg-white text-slate-900 dark:bg-[#272B33] dark:text-white">
                  {a.nombre}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Toggle para Gerente en bandeja En Espera: Ver solo por Aprobar */}
        {isGerente && activeTab === 'espera' && (
          <button
            onClick={() => setSoloPendientesGerente(!soloPendientesGerente)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
              soloPendientesGerente
                ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-400/50'
                : 'border border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10'
            }`}
            title="Filtrar únicamente las memorias pendientes de visto bueno gerencial"
          >
            <AlertCircle size={14} />
            {soloPendientesGerente
              ? `Mostrando solo por Aprobar (${conteos.pendiente})`
              : `Ver solo por Aprobar Gerencia (${conteos.pendiente})`}
          </button>
        )}

        {/* Botón Enviar Todas en bandeja de Borrador */}
        {activeTab === 'borrador' && conteos.borrador > 0 && !isGestionBloqueada && (isElaborador || isAprobador) && (
          <button
            onClick={handleEnviarTodas}
            disabled={actionLoading}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all whitespace-nowrap shrink-0"
            title="Enviar todas las memorias en borrador a revisión de gerencia"
          >
            <Send size={14} /> Enviar todas ({conteos.borrador}) a Gerencia
          </button>
        )}
      </div>

      {/* Tabla de Memorias */}
      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-theme-border bg-theme-base/60 text-xs font-semibold uppercase tracking-wider text-theme-muted">
              <th className="py-3.5 px-4">Código</th>
              <th className="py-3.5 px-4">Área</th>
              <th className="py-3.5 px-4">Partida Presupuestaria</th>
              <th className="py-3.5 px-4">Operación POA & Justificación</th>
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
                  {!isGestionBloqueada && canCreate && (
                    <button onClick={handleOpenCrear} className="btn-primary mt-3 text-xs">
                      Crear Memoria de Cálculo
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              memoriasPaginadas.map((mem) => {
                const total = parseFloat(mem.total_presupuesto || '0');
                const isHighlighted = highlightedMemoriaId === mem.id;
                return (
                  <tr
                    key={mem.id}
                    id={`memoria-row-${mem.id}`}
                    className={`transition-all duration-500 ${
                      isHighlighted
                        ? 'bg-amber-500/20 dark:bg-amber-500/30 ring-2 ring-amber-500 ring-inset animate-pulse font-semibold'
                        : 'hover:bg-theme-border/20'
                    }`}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-xs text-theme-main">{mem.codigo}</td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-theme-main text-xs">{mem.area_nombre}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-mono font-bold text-xs text-theme-main">{mem.partida_codigo || 'Partida'}</p>
                      <p className="text-[11px] text-theme-muted line-clamp-1">{mem.partida_nombre || 'Sin partida'}</p>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="flex flex-wrap items-center gap-1 mb-1">
                        {mem.operacion_codigo && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-md bg-theme-base text-theme-main border border-theme-border">
                            POA: {mem.operacion_codigo}
                          </span>
                        )}
                        {mem.es_contratacion && (
                          <span className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-theme-border/40 text-theme-muted border border-theme-border">
                            PAC
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-theme-main line-clamp-2">{mem.justificacion}</p>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-theme-primary/10 text-theme-primary">
                        {mem.total_items ?? (mem.detalles ? mem.detalles.length : 0)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-theme-main text-xs">{formatMoney(total)}</td>
                    <td className="py-3.5 px-4 text-center">
                      {getBadgeEstado(mem.estado)}
                    </td>
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

                        {/* Botón Editar para memorias no aprobadas definitivamente */}
                        {!isGestionBloqueada && mem.estado !== 'APROBADO_FINANZAS' && (isElaborador || isGerente || isPlanificador || isAprobador) && (
                          <button
                            onClick={() => handleOpenEditar(mem)}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-500/10 transition-colors"
                            title="Editar Datos de la Memoria"
                          >
                            <Edit3 size={15} />
                          </button>
                        )}

                        {/* Flujo de Estados y Aprobaciones */}
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
                                  className="px-2 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-[11px] font-semibold flex items-center gap-1 shadow-sm"
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
                              className="px-2 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-[11px] font-semibold flex items-center gap-1 shadow-sm"
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

                        {mem.estado === 'PENDIENTE_PLANIFICACION' && (isAprobador || isPlanificador) && (
                          <>
                            <button
                              onClick={() => handleAprobarPlanificacion(mem)}
                              className="px-2 py-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-[11px] font-semibold flex items-center gap-1 shadow-sm"
                              title="Validar y Aprobar por Planificación (SPO)"
                            >
                              <CheckCircle2 size={13} /> Aprobar Planificación
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

                        {(mem.estado === 'APROBADO_GERENCIA' || mem.estado === 'APROBADO_PLANIFICACION') && isAprobador && (
                          <>
                            <button
                              onClick={() => handleAprobarFinanciero(mem)}
                              className="px-2 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-[11px] font-semibold flex items-center gap-1 shadow-sm"
                              title="Aprobación Presupuestaria Final"
                            >
                              <CheckCircle2 size={13} /> Aprobar Presupuestos
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${currentPage === p
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
          <div className="card w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl bg-theme-surface">
            <div className="p-5 border-b border-theme-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="text-theme-primary" size={24} />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-theme-main">
                      {editingMemoria ? 'Editar Memoria de Cálculo' : 'Formular Nueva Memoria de Cálculo'}
                    </h3>
                    <span className="font-mono font-bold text-xs bg-theme-base px-2 py-0.5 rounded border border-theme-border text-theme-main">
                      {formMemoria.codigo || 'MEM-AUTO'}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-theme-base border border-theme-border text-theme-main">
                      {secciones.find((s) => s.id === Number(formMemoria.seccionId))?.area_nombre || user?.area_nombre || 'Área'}
                    </span>
                  </div>
                  <p className="text-xs text-theme-muted mt-0.5">
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

            <form onSubmit={handleGuardarMemoria} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* PASO 1: Asignación de Parámetros Base */}
              <div className="p-4 rounded-xl bg-theme-base/60 border border-theme-border space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-theme-main flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-theme-primary text-theme-primaryText flex items-center justify-center text-[10px] font-bold">1</span>
                    Parámetros Base de la Memoria (Partida, Operación y Contratación)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* 1. Partida Presupuestaria */}
                  <div>
                    <label className="block text-xs font-semibold uppercase text-theme-muted mb-1">
                      1. Partida Presupuestaria de Egreso *
                    </label>

                    {/* Combobox selector de partida */}
                    <div className="relative" ref={partidaSelectorRef}>
                      {(() => {
                        const selected =
                          egresoLeafs.find((p) => p.id === Number(formMemoria.partidaId)) ||
                          partidas.find((p) => p.id === Number(formMemoria.partidaId));
                        return (
                          <button
                            type="button"
                            onClick={() => setPartidaSelectorOpen(!partidaSelectorOpen)}
                            className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border transition-colors text-left ${selected
                              ? 'border-theme-border bg-theme-surface hover:border-theme-primary'
                              : 'border-amber-500/50 bg-amber-500/5 hover:border-amber-500'
                              }`}
                          >
                            {selected ? (
                              <span className="flex-1 min-w-0">
                                <span className="font-mono font-bold text-xs text-theme-primary mr-2">
                                  {selected.codigo}
                                </span>
                                <span className="text-xs text-theme-main line-clamp-1">{selected.nombre}</span>
                              </span>
                            ) : (
                              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                                <AlertCircle size={14} className="shrink-0" />
                                Seleccionar partida de egreso obligatoria...
                              </span>
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
                          style={{ maxHeight: '300px' }}>
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
                          <div className="overflow-y-auto" style={{ maxHeight: '240px' }}>
                            {filteredPartidas.length === 0 ? (
                              <div className="py-8 text-center text-theme-muted text-xs">
                                No se encontraron partidas de egreso
                              </div>
                            ) : (
                              groupedPartidas.map((group, gIdx) => (
                                <div key={gIdx}>
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
                                        className={`w-full flex items-start gap-3 pl-5 pr-3 py-2 text-left transition-colors border-b border-theme-border/30 last:border-0 ${isActive
                                          ? 'bg-theme-primary/10 hover:bg-theme-primary/15'
                                          : 'hover:bg-theme-border/30'
                                          }`}
                                      >
                                        <span className="shrink-0 flex items-start pt-0.5">
                                          <span className="w-3 h-px bg-theme-border/70 mt-2 mr-1" />
                                        </span>

                                        <span
                                          className={`shrink-0 font-mono font-bold text-[11px] px-1.5 py-0.5 rounded-md ${isActive
                                            ? 'bg-theme-primary text-theme-primaryText'
                                            : 'bg-theme-base text-theme-primary border border-theme-border'
                                            }`}
                                        >
                                          {p.codigo}
                                        </span>

                                        <div className="flex-1 min-w-0">
                                          <p className={`text-xs leading-tight ${isActive ? 'font-semibold text-theme-main' : 'text-theme-main'}`}>
                                            {p.nombre}
                                          </p>
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

                  {/* 2. Operación POA */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold uppercase text-theme-muted">
                        2. Operación POA Institucional *
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowQuickOperacion(!showQuickOperacion)}
                        className="text-[11px] font-semibold text-theme-primary hover:underline flex items-center gap-1"
                      >
                        <Plus size={12} /> {showQuickOperacion ? 'Ocultar' : '+ Nueva Operación'}
                      </button>
                    </div>

                    <select
                      required
                      value={formMemoria.operacionId}
                      onChange={(e) => {
                        const opId = Number(e.target.value) || '';
                        const opObj = operaciones.find((o) => o.id === opId);
                        setFormMemoria({
                          ...formMemoria,
                          operacionId: opId,
                          es_contratacion: opObj ? (opObj.es_contratacion ?? formMemoria.es_contratacion) : formMemoria.es_contratacion,
                        });
                      }}
                      className={`input-theme text-xs bg-theme-surface text-theme-main ${!formMemoria.operacionId ? 'border-amber-500/80 bg-amber-500/5' : ''}`}
                    >
                      <option value="" className="bg-white text-slate-900 dark:bg-[#272B33] dark:text-white">Seleccione Operación POA institucional *...</option>
                      {(() => {
                        const sec = secciones.find((s) => s.id === Number(formMemoria.seccionId));
                        const areaId = (editingMemoria as any)?.area_id || (sec ? (sec.area || (sec as any).area_id) : (user?.area_id || null));
                        let opsFiltradas = areaId
                          ? operaciones.filter((o) => Number(o.area || (o as any).area_id) === Number(areaId))
                          : operaciones;

                        if (opsFiltradas.length === 0) {
                          opsFiltradas = operaciones;
                        }

                        if (formMemoria.operacionId && !opsFiltradas.some((o) => o.id === Number(formMemoria.operacionId))) {
                          const opActual = operaciones.find((o) => o.id === Number(formMemoria.operacionId));
                          if (opActual) {
                            opsFiltradas = [opActual, ...opsFiltradas];
                          }
                        }

                        return opsFiltradas.map((op) => (
                          <option key={op.id} value={op.id} className="bg-white text-slate-900 dark:bg-[#272B33] dark:text-white">
                            [{op.codigo}] {op.descripcion.slice(0, 60)} {op.es_contratacion ? '(Contratación)' : ''}
                          </option>
                        ));
                      })()}
                    </select>
                  </div>
                </div>

                {/* Subformulario quick operación si está abierto */}
                {showQuickOperacion && (
                  <div className="p-3.5 rounded-xl bg-theme-surface border border-theme-border space-y-3 shadow-sm animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-theme-main flex items-center gap-1.5">
                        <Building2 size={14} className="text-theme-primary" /> Registrar Nueva Operación para su Área
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      <div>
                        <label className="block text-[10px] font-semibold uppercase text-theme-muted mb-1">
                          Código de Operación *
                        </label>
                        <input
                          type="text"
                          placeholder="Ej. OP-INF-08"
                          value={quickOpForm.codigo}
                          onChange={(e) => setQuickOpForm({ ...quickOpForm, codigo: e.target.value })}
                          className="input-theme text-xs py-1.5 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold uppercase text-theme-muted mb-1">
                          Acción a Corto Plazo (ACP Padre) *
                        </label>
                        <select
                          value={quickOpForm.acp_id}
                          onChange={(e) => setQuickOpForm({ ...quickOpForm, acp_id: Number(e.target.value) })}
                          className="input-theme text-xs py-1.5 bg-theme-surface text-theme-main"
                        >
                          <option value="" className="bg-white text-slate-900 dark:bg-[#272B33] dark:text-white">Seleccione ACP...</option>
                          {accionesCortoPlazo.map((acp) => (
                            <option key={acp.id} value={acp.id} className="bg-white text-slate-900 dark:bg-[#272B33] dark:text-white">
                              {acp.codigo} - {acp.descripcion.slice(0, 45)}...
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-semibold uppercase text-theme-muted mb-1">
                          Descripción de la Operación *
                        </label>
                        <input
                          type="text"
                          placeholder="Ej. Fortalecimiento de la Infraestructura de Servidores..."
                          value={quickOpForm.descripcion}
                          onChange={(e) => setQuickOpForm({ ...quickOpForm, descripcion: e.target.value })}
                          className="input-theme text-xs py-1.5"
                        />
                      </div>

                      <div className="sm:col-span-2 flex items-center justify-between pt-1">
                        <label className="flex items-center gap-2 text-xs font-medium text-theme-main cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={quickOpForm.es_contratacion}
                            onChange={(e) => setQuickOpForm({ ...quickOpForm, es_contratacion: e.target.checked })}
                            className="rounded text-theme-primary focus:ring-theme-primary"
                          />
                          Aplica para Contrataciones / Compras
                        </label>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowQuickOperacion(false)}
                            className="px-2.5 py-1 text-xs text-theme-muted hover:text-theme-main"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveQuickOperacion}
                            className="btn-primary text-xs px-3 py-1"
                          >
                            Guardar y Vincular
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Checkbox Contratación PAC */}
                <div className="flex items-center gap-2 pt-1 border-t border-theme-border/60">
                  <input
                    type="checkbox"
                    id="chk-es-contratacion"
                    checked={formMemoria.es_contratacion}
                    onChange={(e) => setFormMemoria({ ...formMemoria, es_contratacion: e.target.checked })}
                    className="w-4 h-4 rounded text-theme-primary focus:ring-theme-primary cursor-pointer"
                  />
                  <label htmlFor="chk-es-contratacion" className="text-xs font-semibold text-theme-main cursor-pointer select-none">
                    ¿Corresponde a Contrataciones / Compras Públicas (PAC)?
                  </label>
                </div>
              </div>

              {/* PASO 2: Despliegue de Datos y Formulación Oficial (50% Tabla / 50% Justificación) */}
              {(editingMemoria || (formMemoria.partidaId && formMemoria.operacionId)) ? (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Formato Oficial: Desglose de Ítems a la izquierda (50%) + Justificación Amplia a la derecha (50%) */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                    {/* Columna Izquierda: Tabla de Renglones / Ítems (6 cols - 50%) */}
                    <div className="lg:col-span-6 flex flex-col justify-between space-y-2">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-theme-main">
                            Desglose de Ítems / Renglones
                          </span>
                          <button
                            type="button"
                            onClick={handleAddRenglon}
                            className="btn-primary text-xs px-2.5 py-1 flex items-center gap-1"
                          >
                            <Plus size={13} /> Agregar ítem
                          </button>
                        </div>

                        <div className="border border-theme-border rounded-xl overflow-hidden bg-theme-surface">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-theme-base border-b border-theme-border font-semibold text-theme-muted text-[11px]">
                                <th className="py-2 px-1.5 w-6 text-center">#</th>
                                <th className="py-2 px-2">Descripción</th>
                                <th className="py-2 px-1.5 w-20">U. Medida</th>
                                <th className="py-2 px-1.5 w-14 text-right">Cant.</th>
                                <th className="py-2 px-1.5 w-20 text-right">P. Unit.</th>
                                <th className="py-2 px-2 w-20 text-right">Subtotal</th>
                                <th className="py-2 px-1 w-6 text-center"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-theme-border">
                              {formMemoria.renglones.map((renglon, idx) => {
                                const subtotal = (Number(renglon.cantidad) || 0) * (Number(renglon.precio_unitario) || 0);
                                return (
                                  <tr key={idx} className="hover:bg-theme-border/10 transition-colors">
                                    <td className="py-1.5 px-1.5 text-center font-bold text-theme-muted text-[11px]">{idx + 1}</td>
                                    <td className="py-1.5 px-2">
                                      <input
                                        type="text"
                                        required
                                        placeholder="Descripción..."
                                        value={renglon.descripcion}
                                        onChange={(e) => handleUpdateRenglon(idx, 'descripcion', e.target.value)}
                                        className="w-full bg-transparent border-b border-theme-border/60 focus:border-theme-primary px-1 py-0.5 focus:outline-none text-theme-main text-xs uppercase"
                                      />
                                    </td>
                                    <td className="py-1.5 px-1.5">
                                      <input
                                        type="text"
                                        required
                                        placeholder="Unidad..."
                                        value={renglon.unidad_medida}
                                        onChange={(e) => handleUpdateRenglon(idx, 'unidad_medida', e.target.value)}
                                        className="w-full bg-transparent border-b border-theme-border/60 focus:border-theme-primary px-1 py-0.5 focus:outline-none text-theme-main text-xs uppercase"
                                      />
                                    </td>
                                    <td className="py-1.5 px-1.5 text-right">
                                      <input
                                        type="number"
                                        required
                                        min="0.01"
                                        step="any"
                                        value={renglon.cantidad === 0 || renglon.cantidad === '0' ? '' : renglon.cantidad}
                                        onChange={(e) => handleUpdateRenglon(idx, 'cantidad', e.target.value)}
                                        className="w-full bg-transparent border-b border-theme-border/60 focus:border-theme-primary px-1 py-0.5 text-right focus:outline-none text-theme-main text-xs font-semibold"
                                      />
                                    </td>
                                    <td className="py-1.5 px-1.5 text-right">
                                      <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        value={renglon.precio_unitario === 0 || renglon.precio_unitario === '0' ? '' : renglon.precio_unitario}
                                        onChange={(e) => handleUpdateRenglon(idx, 'precio_unitario', e.target.value)}
                                        className="w-full bg-transparent border-b border-theme-border/60 focus:border-theme-primary px-1 py-0.5 text-right focus:outline-none text-theme-main text-xs font-semibold"
                                      />
                                    </td>
                                    <td className="py-1.5 px-2 text-right font-bold text-theme-main font-mono text-xs">{formatMoney(subtotal)}</td>
                                    <td className="py-1.5 px-1 text-center">
                                      {formMemoria.renglones.length > 1 && (
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveRenglon(idx)}
                                          className="text-theme-muted hover:text-rose-500 p-0.5 transition-colors"
                                          title="Eliminar renglón"
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
                      </div>

                      <div className="flex justify-end items-center gap-3 pt-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-theme-muted">
                          Total Proyectado:
                        </span>
                        <span className="text-base font-bold text-theme-primary font-mono">{formatMoney(totalCalculadoMemoria)}</span>
                      </div>
                    </div>

                    {/* Columna Derecha: Justificación amplia a la misma altura (6 cols - 50%) */}
                    <div className="lg:col-span-6 flex flex-col justify-between space-y-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-theme-main">
                        Justificación Técnica y Sustento *
                      </label>
                      <div className="flex-1 flex flex-col rounded-xl border border-theme-border bg-theme-surface p-3.5 space-y-2">
                        <textarea
                          required
                          value={formMemoria.justificacion}
                          onChange={(e) => setFormMemoria({ ...formMemoria, justificacion: e.target.value })}
                          placeholder="Detalle los objetivos operativos, necesidad institucional y justificación técnica del gasto..."
                          className="w-full flex-1 min-h-[260px] max-h-[360px] overflow-y-auto bg-transparent resize-none focus:outline-none text-xs text-theme-main uppercase leading-relaxed placeholder:normal-case placeholder:text-theme-muted"
                        />
                        <div className="text-[10px] text-theme-muted border-t border-theme-border/60 pt-1.5 flex justify-between">
                          <span>Sustento Auditoría POA</span>
                          <span>{formMemoria.justificacion.length} caracteres</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-xl border border-dashed border-theme-border text-center text-theme-muted space-y-1.5">
                  <Layers className="mx-auto text-theme-muted opacity-50 mb-1" size={28} />
                  <p className="text-xs font-semibold text-theme-main">Paso 2: Seleccione la Partida y la Operación POA para continuar</p>
                  <p className="text-[11px]">Una vez asignados ambos parámetros, se desplegará el desglose de ítems y la justificación técnica de la memoria.</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-theme-border">
                <button
                  type="button"
                  onClick={() => setShowModalMemoria(false)}
                  className="px-4 py-2 rounded-xl border border-theme-border text-xs font-semibold text-theme-muted hover:text-theme-main"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || (!editingMemoria && (!formMemoria.partidaId || !formMemoria.operacionId))}
                  className="btn-primary text-xs px-6 py-2"
                >
                  {editingMemoria ? 'Guardar Cambios' : 'Registrar Memoria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ficha Oficial / Modal Detallado de Memoria (Formato de Creación) */}
      {fichaMemoria && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl bg-theme-surface">
            <div className="p-5 border-b border-theme-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="text-theme-primary" size={24} />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-theme-main font-mono">
                      Revisión de Memoria
                    </h3>
                    <span className="font-mono font-bold text-xs bg-theme-base px-2 py-0.5 rounded border border-theme-border text-theme-main">
                      {fichaMemoria.codigo}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-theme-base border border-theme-border text-theme-main">
                      {fichaMemoria.area_nombre}
                    </span>
                  </div>
                  <p className="text-xs text-theme-muted mt-0.5">
                    Gestión {activeGestion?.anio || fichaMemoria.gestion_anio || '2027'} • Estado: {fichaMemoria.estado.replace(/_/g, ' ')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const el = document.getElementById('printable-memoria');
                    if (!el) return;
                    const html = el.innerHTML;

                    const iframe = document.createElement('iframe');
                    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none;';
                    document.body.appendChild(iframe);

                    const doc = iframe.contentWindow?.document;
                    if (!doc) { document.body.removeChild(iframe); return; }

                    doc.open();
                    doc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Memoria de Cálculo — ${fichaMemoria.codigo}</title>
  <style>
    @page { size: letter portrait; margin: 12mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #000; background: #fff; margin: 0; padding: 8px; }
    h1 { font-size: 18px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; text-align: center; margin-bottom: 4px; }
    p { margin: 2px 0; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th, td { border: 1px solid #000; padding: 5px 6px; }
    .navy { background-color: #002060 !important; color: #fff !important; font-weight: bold; text-transform: uppercase; text-align: center; font-size: 10px; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-mono { font-family: 'Courier New', Courier, monospace; }
    .font-bold { font-weight: bold; }
    .uppercase { text-transform: uppercase; }
    .mt-8 { margin-top: 32px; }
    .h-16 { height: 64px; }
    .bg-white { background: #fff; }
  </style>
</head>
<body>${html}</body>
</html>`);
                    doc.close();

                    setTimeout(() => {
                      iframe.contentWindow?.print();
                      setTimeout(() => document.body.removeChild(iframe), 500);
                    }, 400);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-theme-border text-theme-muted hover:text-theme-main text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Printer size={14} /> Imprimir Ficha
                </button>
                <button onClick={() => setFichaMemoria(null)} className="text-theme-muted hover:text-theme-main text-lg font-bold">
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {/* PASO 1: Parámetros Base de la Memoria */}
              <div className="p-4 rounded-xl bg-theme-base/60 border border-theme-border space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-theme-main flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-theme-primary text-theme-primaryText flex items-center justify-center text-[10px] font-bold">1</span>
                  Parámetros Base de la Memoria (Partida, Operación y Contratación)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Partida Presupuestaria */}
                  <div className="p-3 rounded-xl bg-theme-surface border border-theme-border">
                    <span className="text-[10px] font-semibold uppercase text-theme-muted block mb-1">
                      1. Partida Presupuestaria de Egreso
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-theme-primary bg-theme-base px-2 py-0.5 rounded border border-theme-border">
                        {fichaMemoria.partida_codigo || 'N/A'}
                      </span>
                      <span className="text-xs font-semibold text-theme-main line-clamp-1">
                        {fichaMemoria.partida_nombre || 'Sin partida asignada'}
                      </span>
                    </div>
                  </div>

                  {/* Operación POA */}
                  <div className="p-3 rounded-xl bg-theme-surface border border-theme-border">
                    <span className="text-[10px] font-semibold uppercase text-theme-muted block mb-1">
                      2. Operación POA Institucional
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-theme-main bg-theme-base px-2 py-0.5 rounded border border-theme-border">
                        {fichaMemoria.operacion_codigo ? `POA: ${fichaMemoria.operacion_codigo}` : 'Sin Operación'}
                      </span>
                      <span className="text-xs text-theme-main line-clamp-1">
                        {fichaMemoria.operacion_descripcion || (fichaMemoria.es_contratacion ? 'Contratación Institucional' : 'Gasto Corriente')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Modalidad Contrataciones PAC */}
                <div className="flex items-center gap-2 pt-1 border-t border-theme-border/60">
                  <span className="text-xs font-semibold text-theme-muted">Modalidad de Adquisición:</span>
                  <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-md border border-theme-border bg-theme-border/30 text-theme-main">
                    {fichaMemoria.es_contratacion ? '✓ Aplica a Contrataciones / Compras Públicas (PAC)' : 'Gasto Corriente Operativo (No PAC)'}
                  </span>
                </div>
              </div>

              {/* PASO 2: Despliegue de Datos y Formato Oficial (50% Tabla / 50% Justificación) */}
              <div className="space-y-4">
                {/* Formato Oficial: Desglose de Ítems a la izquierda (50%) + Justificación a la derecha (50%) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                  {/* Columna Izquierda: Tabla de Renglones / Ítems (6 cols - 50%) */}
                  <div className="lg:col-span-6 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-theme-main">
                          Desglose de Ítems / Renglones ({fichaMemoria.detalles?.length || 0} ítems)
                        </span>
                      </div>

                      <div className="border border-theme-border rounded-xl overflow-hidden bg-theme-surface">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-theme-base border-b border-theme-border font-semibold text-theme-muted text-[11px]">
                              <th className="py-2 px-1.5 w-6 text-center">#</th>
                              <th className="py-2 px-2">Descripción</th>
                              <th className="py-2 px-1.5 w-20">U. Medida</th>
                              <th className="py-2 px-1.5 w-14 text-right">Cant.</th>
                              <th className="py-2 px-1.5 w-20 text-right">P. Unit.</th>
                              <th className="py-2 px-2 w-20 text-right">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-theme-border">
                            {(fichaMemoria.detalles || []).map((d, idx) => (
                              <tr key={d.id || idx} className="hover:bg-theme-border/10 transition-colors">
                                <td className="py-2 px-1.5 text-center font-bold text-theme-muted text-[11px]">{idx + 1}</td>
                                <td className="py-2 px-2 font-medium text-theme-main">{d.descripcion}</td>
                                <td className="py-2 px-1.5 text-theme-muted">{d.unidad_medida}</td>
                                <td className="py-2 px-1.5 text-right font-semibold">{d.cantidad}</td>
                                <td className="py-2 px-1.5 text-right font-semibold">{formatMoney(d.precio_unitario)}</td>
                                <td className="py-2 px-2 text-right font-bold text-theme-main font-mono">{formatMoney(d.precio_total || (Number(d.cantidad) * Number(d.precio_unitario)))}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="flex justify-end items-center gap-3 pt-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-theme-muted">
                        Total Presupuesto Proyectado:
                      </span>
                      <span className="text-base font-bold text-theme-primary font-mono">{formatMoney(fichaMemoria.total_presupuesto)}</span>
                    </div>
                  </div>

                  {/* Columna Derecha: Justificación amplia a la misma altura (6 cols - 50%) */}
                  <div className="lg:col-span-6 flex flex-col justify-between space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-theme-main">
                      Justificación Técnica y Sustento
                    </label>
                    <div className="flex-1 flex flex-col justify-between rounded-xl border border-theme-border bg-theme-surface p-3.5 space-y-2">
                      <div className="max-h-[350px] min-h-[250px] overflow-y-auto pr-1">
                        <p className="text-xs text-theme-main uppercase leading-relaxed whitespace-pre-wrap">
                          {fichaMemoria.justificacion}
                        </p>
                      </div>
                      <div className="text-[10px] text-theme-muted border-t border-theme-border/60 pt-1.5 flex justify-between">
                        <span>Sustento Auditoría POA</span>
                        <span>{fichaMemoria.justificacion?.length || 0} caracteres</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Nota de Rechazo / Observación si existe */}
              {fichaMemoria.motivo_rechazo && (
                <div className={`p-3 rounded-xl border text-xs ${fichaMemoria.estado === 'RECHAZADO'
                  ? 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-200'
                  : 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-200'
                  }`}>
                  <strong>💬 {fichaMemoria.estado === 'RECHAZADO' ? 'Motivo del Rechazo:' : 'Nota de Revisión / Aprobación:'}</strong>
                  <p className="mt-1 font-medium italic">"{fichaMemoria.motivo_rechazo}"</p>
                </div>
              )}

              {/* Registro de Control y Firmas Institucionales */}
              <div className="border-t border-theme-border pt-4">
                <span className="text-theme-muted uppercase font-semibold text-xs">Registro de Control y Firmas Institucionales:</span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 mt-2">
                  <div className="p-2.5 rounded-xl bg-theme-base border border-theme-border text-center">
                    <span className="text-[10px] uppercase font-bold text-theme-muted block">1. Elaborador</span>
                    <p className="font-semibold text-xs text-theme-main mt-0.5">Usuario Solicitante</p>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">✓ Formulado</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-theme-base border border-theme-border text-center">
                    <span className="text-[10px] uppercase font-bold text-theme-muted block">2. Gerencia de Área</span>
                    <p className="font-semibold text-xs text-theme-main mt-0.5">Visto Bueno Área</p>
                    {['APROBADO_GERENCIA', 'PENDIENTE_PLANIFICACION', 'APROBADO_PLANIFICACION', 'APROBADO_FINANZAS'].includes(fichaMemoria.estado) ? (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">✓ Aprobado</span>
                    ) : (
                      <span className="text-[10px] text-amber-600 font-medium">⏳ Pendiente</span>
                    )}
                  </div>

                  <div className="p-2.5 rounded-xl bg-theme-base border border-theme-border text-center">
                    <span className="text-[10px] uppercase font-bold text-theme-muted block">3. Planificación (SPO)</span>
                    <p className="font-semibold text-xs text-theme-main mt-0.5">Alineación PAC</p>
                    {fichaMemoria.es_contratacion && parseFloat(fichaMemoria.total_presupuesto || '0') >= 2000 ? (
                      ['APROBADO_GERENCIA', 'APROBADO_PLANIFICACION', 'APROBADO_FINANZAS'].includes(fichaMemoria.estado) && fichaMemoria.estado !== 'PENDIENTE_PLANIFICACION' ? (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">✓ Alineado</span>
                      ) : (
                        <span className="text-[10px] text-amber-600 font-medium">⏳ Por Validar</span>
                      )
                    ) : (
                      <span className="text-[10px] text-theme-muted font-medium italic">— Omitido (&lt; 2.000 Bs)</span>
                    )}
                  </div>

                  <div className="p-2.5 rounded-xl bg-theme-base border border-theme-border text-center">
                    <span className="text-[10px] uppercase font-bold text-theme-muted block">4. Presupuestos</span>
                    <p className="font-semibold text-xs text-theme-main mt-0.5">Aprobación POA Final</p>
                    {fichaMemoria.estado === 'APROBADO_FINANZAS' ? (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">✓ Aprobado POA</span>
                    ) : (
                      <span className="text-[10px] text-amber-600 font-medium">⏳ Pendiente</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer con Acciones Directas de Revisión */}
            <div className="p-4 border-t border-theme-border flex items-center justify-between">
              <div>
                {!isGestionBloqueada && fichaMemoria.estado !== 'APROBADO_FINANZAS' && (isElaborador || isGerente || isPlanificador || isAprobador) && (
                  <button
                    onClick={() => {
                      const targetMem = fichaMemoria;
                      setFichaMemoria(null);
                      handleOpenEditar(targetMem);
                    }}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Edit3 size={14} /> Editar Memoria
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Acciones de aprobación directa según la etapa en la que se encuentra la memoria */}
                {(fichaMemoria.estado === 'PENDIENTE_GERENCIA' || fichaMemoria.estado === 'BORRADOR') && (isGerente || isAprobador) && (
                  <>
                    <button
                      onClick={() => {
                        const target = fichaMemoria;
                        setFichaMemoria(null);
                        handleRechazar(target);
                      }}
                      className="px-3 py-2 rounded-xl border border-rose-500/50 text-rose-600 hover:bg-rose-500/10 text-xs font-semibold flex items-center gap-1"
                    >
                      <XCircle size={14} /> Rechazar
                    </button>
                    <button
                      onClick={() => {
                        const target = fichaMemoria;
                        setFichaMemoria(null);
                        handleAprobarGerente(target);
                      }}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle2 size={14} /> Aprobar Gerencia
                    </button>
                  </>
                )}

                {fichaMemoria.estado === 'PENDIENTE_PLANIFICACION' && (isPlanificador || isAprobador) && (
                  <>
                    <button
                      onClick={() => {
                        const target = fichaMemoria;
                        setFichaMemoria(null);
                        handleRechazar(target);
                      }}
                      className="px-3 py-2 rounded-xl border border-rose-500/50 text-rose-600 hover:bg-rose-500/10 text-xs font-semibold flex items-center gap-1"
                    >
                      <XCircle size={14} /> Rechazar
                    </button>
                    <button
                      onClick={() => {
                        const target = fichaMemoria;
                        setFichaMemoria(null);
                        handleAprobarPlanificacion(target);
                      }}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle2 size={14} /> Aprobar Planificación
                    </button>
                  </>
                )}

                {(fichaMemoria.estado === 'APROBADO_GERENCIA' || fichaMemoria.estado === 'APROBADO_PLANIFICACION') && isAprobador && (
                  <>
                    <button
                      onClick={() => {
                        const target = fichaMemoria;
                        setFichaMemoria(null);
                        handleRechazar(target);
                      }}
                      className="px-3 py-2 rounded-xl border border-rose-500/50 text-rose-600 hover:bg-rose-500/10 text-xs font-semibold flex items-center gap-1"
                    >
                      <XCircle size={14} /> Rechazar
                    </button>
                    <button
                      onClick={() => {
                        const target = fichaMemoria;
                        setFichaMemoria(null);
                        handleAprobarFinanciero(target);
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle2 size={14} /> Aprobar Presupuestos
                    </button>
                  </>
                )}

                <button onClick={() => setFichaMemoria(null)} className="btn-primary text-xs px-5 py-2">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Documento de Impresión Oficial - Memoria de Cálculo */}
      {(() => {
        // Partida específica seleccionada para la memoria (hoja seleccionada)
        const partidaEspecifica = useMemo(() => {
          if (!fichaMemoria) return { codigo: '', nombre: '' };
          const d0 = (fichaMemoria.detalles || [])[0];
          if (d0 && d0.partida_codigo) {
            return { codigo: d0.partida_codigo, nombre: d0.partida_nombre || '' };
          }
          if (fichaMemoria.partida_id && partidas.length > 0) {
            const pObj = partidas.find((p) => p.id === Number(fichaMemoria.partida_id));
            if (pObj) return { codigo: pObj.codigo, nombre: pObj.nombre };
          }
          return {
            codigo: fichaMemoria.partida_codigo || '',
            nombre: fichaMemoria.partida_nombre || '',
          };
        }, [fichaMemoria, partidas]);

        const headerNavyStyle = {
          backgroundColor: '#002060',
          color: '#ffffff',
          WebkitPrintColorAdjust: 'exact' as const,
          printColorAdjust: 'exact' as const,
        };

        if (!fichaMemoria) return null;

        return (
          <div id="printable-memoria" className="hidden print:block text-black bg-white p-4 font-sans text-xs">
            {/* Encabezado Principal */}
            <div className="text-center space-y-1 mb-5">
              <h1 className="text-xl font-bold uppercase tracking-wider">
                MEMORIA DE CÁLCULO
              </h1>
              <p className="text-xs font-bold uppercase mt-2 tracking-wide">
                PARTIDA: {partidaEspecifica.codigo} "{partidaEspecifica.nombre?.toUpperCase()}"
              </p>
              <p className="text-[11px] font-semibold text-gray-800 uppercase">
                Fuente 20 - "RECURSOS ESPECIFICOS" Organismo 230 - "OTROS RECURSOS ESPECIFICOS"
              </p>
              <p className="text-[11px] italic text-gray-700 mt-1">
                (Expresado en Cantidades y Bolivianos)
              </p>
            </div>

            {/* Tabla Principal de Detalle e Ítems */}
            <table className="w-full border-collapse border border-black text-xs">
              <thead>
                <tr style={headerNavyStyle} className="font-bold text-center uppercase text-[10px]">
                  <th style={headerNavyStyle} className="border border-black p-1.5 w-8">Nº</th>
                  <th style={headerNavyStyle} className="border border-black p-1.5 text-center">DESCRIPCIÓN</th>
                  <th style={headerNavyStyle} className="border border-black p-1.5 w-24 text-center leading-tight">CANTIDAD<br />REQUERIDA</th>
                  <th style={headerNavyStyle} className="border border-black p-1.5 w-20 text-center">UNIDAD</th>
                  <th style={headerNavyStyle} className="border border-black p-1.5 w-24 text-center leading-tight">PRECIO<br />UNITARIO</th>
                  <th style={headerNavyStyle} className="border border-black p-1.5 w-24 text-center">TOTAL</th>
                  <th style={headerNavyStyle} className="border border-black p-1.5 w-52 text-center">JUSTIFICACIÓN</th>
                </tr>
              </thead>
              <tbody>
                {(fichaMemoria.detalles || []).map((det, idx) => {
                  const cant = Number(det.cantidad) || 0;
                  const pu = Number(det.precio_unitario) || 0;
                  const subtotal = det.precio_total ? Number(det.precio_total) : cant * pu;
                  return (
                    <tr key={det.id || idx} className="text-[11px]">
                      <td className="border border-black p-2 text-center align-middle">{idx + 1}</td>
                      <td className="border border-black p-2 uppercase font-medium leading-snug align-middle">{det.descripcion}</td>
                      <td className="border border-black p-2 text-center align-middle">{det.cantidad}</td>
                      <td className="border border-black p-2 text-center uppercase align-middle">{det.unidad_medida}</td>
                      <td className="border border-black p-2 text-right align-middle font-mono">
                        {Number(det.precio_unitario).toFixed(2).replace('.', ',')}
                      </td>
                      <td className="border border-black p-2 text-right align-middle font-mono font-bold">
                        {subtotal.toFixed(2).replace('.', ',')}
                      </td>
                      {idx === 0 && (
                        <td
                          rowSpan={(fichaMemoria.detalles || []).length}
                          className="border border-black p-2.5 align-middle text-[10px] uppercase leading-relaxed font-normal"
                        >
                          {fichaMemoria.justificacion}
                        </td>
                      )}
                    </tr>
                  );
                })}

                {/* Fila Total Partida */}
                <tr style={headerNavyStyle} className="font-bold text-[11px]">
                  <td colSpan={5} style={headerNavyStyle} className="border border-black p-2 text-center uppercase tracking-wider font-bold">
                    TOTAL PARTIDA
                  </td>
                  <td style={headerNavyStyle} className="border border-black p-2 text-right font-mono text-xs font-bold">
                    {Number(fichaMemoria.total_presupuesto).toFixed(2).replace('.', ',')}
                  </td>
                  <td style={headerNavyStyle} className="border border-black"></td>
                </tr>
              </tbody>
            </table>

            {/* Tabla de Control de Firmas */}
            <div className="mt-8">
              <table className="w-full border-collapse border border-black text-xs">
                <thead>
                  <tr style={headerNavyStyle} className="font-bold text-center uppercase text-[10px]">
                    <th style={headerNavyStyle} className="border border-black p-1.5 w-32"></th>
                    <th style={headerNavyStyle} className="border border-black p-1.5 text-center">NOMBRE</th>
                    <th style={headerNavyStyle} className="border border-black p-1.5 text-center">CARGO</th>
                    <th style={headerNavyStyle} className="border border-black p-1.5 w-48 text-center">FIRMA</th>
                  </tr>
                </thead>
                <tbody className="text-[11px]">
                  {/* Elaborado por */}
                  <tr>
                    <td className="border border-black p-2 font-bold bg-white text-left align-middle">Elaborado por:</td>
                    <td className="border border-black p-2 text-center uppercase font-semibold align-middle">
                      {(fichaMemoria.participaciones || []).find((p) => p.tipo_participacion === 'ELABORADOR')?.usuario_nombre ||
                        (user ? `${user.first_name || ''} ${user.last_name || ''}`.trim().toUpperCase() : '')}
                    </td>
                    <td className="border border-black p-2 text-center uppercase font-semibold align-middle">
                      {fichaMemoria.seccion_nombre
                        ? `JEFE DE LA UNIDAD DE ${fichaMemoria.seccion_nombre.toUpperCase()}`
                        : 'JEFE DE LA UNIDAD SOLICITANTE'}
                    </td>
                    <td className="border border-black p-2 h-16"></td>
                  </tr>
                  {/* Aprobado por */}
                  <tr>
                    <td className="border border-black p-2 font-bold bg-white text-left align-middle">Aprobado por:</td>
                    <td className="border border-black p-2 text-center uppercase font-semibold align-middle">
                      {(fichaMemoria.participaciones || []).find((p) => p.tipo_participacion === 'APROBADOR')?.usuario_nombre || ''}
                    </td>
                    <td className="border border-black p-2 text-center uppercase font-semibold align-middle">
                      {fichaMemoria.area_nombre ? `GERENTE DE ÁREA DE ${fichaMemoria.area_nombre.toUpperCase()}` : 'GERENTE DE ÁREA'}
                    </td>
                    <td className="border border-black p-2 h-16"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
