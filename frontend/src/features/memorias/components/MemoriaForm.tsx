import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import alertService from '../../../utils/alerts';
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
} from '../../../services/presupuestoService';
import { planificacionService } from '../../../services/planificacionService';
import { Operacion, AccionCortoPlazo } from '../../../types/planificacion';

export const MemoriaForm = ({ memoria, onClose, onSaved }: any) => {
  
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
          .then((mem: any) => {
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
          .catch((err: any) => {
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
    } catch (err: any) {
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
    } catch (err: any) {
      console.error(err);
    }
  }

  function mostrarMensaje(type: 'success' | 'error', text: string) {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4000);
  }

  const activeGestion = useMemo(() => {
    return (Array.isArray(gestiones) ? gestiones : []).find((g: any) => g.id === selectedGestionId) || null;
  }, [gestiones, selectedGestionId]);

  const isGestionBloqueada = activeGestion?.estado === 'FINALIZADO';

  const [partidaSelectorOpen, setPartidaSelectorOpen] = useState(false);
  const partidaSelectorRef = useRef<HTMLDivElement>(null);

  const [operacionSelectorOpen, setOperacionSelectorOpen] = useState(false);
  const operacionSelectorRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (partidaSelectorRef.current && !partidaSelectorRef.current.contains(e.target as Node)) {
        setPartidaSelectorOpen(false);
      }
      if (operacionSelectorRef.current && !operacionSelectorRef.current.contains(e.target as Node)) {
        setOperacionSelectorOpen(false);
      }
    }
    if (partidaSelectorOpen || operacionSelectorOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [partidaSelectorOpen, operacionSelectorOpen]);

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
    } catch (err: any) {
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

      let savedId: number | null = null;
      if (editingMemoria) {
        await updateMemoria(editingMemoria.id, payload);
        mostrarMensaje('success', 'Memoria de cálculo actualizada.');
        savedId = editingMemoria.id;
      } else {
        const res = await createMemoria(payload);
        mostrarMensaje('success', 'Memoria de cálculo registrada en estado Borrador.');
        if (res && res.id) savedId = res.id;
      }

      setShowModalMemoria(false);
      if (selectedGestionId) await cargarMemorias(selectedGestionId);

      // Si estábamos editando como revisor o elaborador, recargamos y mostramos la ficha técnica actualizada
      if (savedId) {
        try {
          const fresca = await getMemoria(savedId);
          setFichaMemoria(fresca);
        } catch (e) {
          console.error(e);
        }
      }
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
    } catch (err: any) {
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
      if (fichaMemoria && fichaMemoria.id === mem.id) {
        const fresca = await getMemoria(mem.id);
        setFichaMemoria(fresca);
      }
    } catch (err: any) {
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
      if (fichaMemoria && fichaMemoria.id === mem.id) {
        const fresca = await getMemoria(mem.id);
        setFichaMemoria(fresca);
      }
    } catch (err: any) {
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
      if (fichaMemoria && fichaMemoria.id === mem.id) {
        const fresca = await getMemoria(mem.id);
        setFichaMemoria(fresca);
      }
    } catch (err: any) {
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
      if (fichaMemoria && fichaMemoria.id === mem.id) {
        const fresca = await getMemoria(mem.id);
        setFichaMemoria(fresca);
      }
    } catch (err: any) {
      alertService.error('Error', 'Error al aprobar por finanzas.');
    }
  }

  async function handleRechazar(mem: MemoriaCalculo) {
    const motivo = await alertService.prompt({
      title: 'Rechazar Memoria de Cálculo',
      text: `Por favor indique el motivo de rechazo para la memoria ${mem.codigo}. Se notificará al elaborador y gerencia con el nivel correspondiente.`,
      confirmButtonText: 'Sí, Rechazar Memoria',
      inputPlaceholder: 'Indique detalladamente el motivo del rechazo...',
      required: true,
      isDanger: true,
    });
    if (!motivo) return;

    try {
      const res = await rechazarMemoria(mem.id, motivo);
      alertService.success('Memoria Rechazada', res.message);
      if (selectedGestionId) await cargarMemorias(selectedGestionId);
      if (fichaMemoria && fichaMemoria.id === mem.id) {
        const fresca = await getMemoria(mem.id);
        setFichaMemoria(fresca);
      }
    } catch (err: any) {
      alertService.error('Error', 'Error al rechazar memoria.');
    }
  }

  async function handleVolverABorrador(mem: MemoriaCalculo) {
    const motivo = await alertService.prompt({
      title: 'Reiniciar Memoria a Borrador',
      text: `Indique las observaciones para reiniciar la memoria ${mem.codigo} a estado Borrador para correcciones.`,
      confirmButtonText: 'Reiniciar a Borrador',
      inputPlaceholder: 'Indique observaciones o motivo de reinicio...',
      required: true,
    });
    if (!motivo) return;

    try {
      const res = await volverMemoriaBorrador(mem.id, motivo);
      alertService.success('Reiniciado a Borrador', res.message);
      if (selectedGestionId) await cargarMemorias(selectedGestionId);
      if (fichaMemoria && fichaMemoria.id === mem.id) {
        const fresca = await getMemoria(mem.id);
        setFichaMemoria(fresca);
      }
    } catch (err: any) {
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
                onClick={() => {
                  const prev = editingMemoria;
                  onClose();
                  if (prev) setFichaMemoria(prev);
                }}
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
                                <div key={gIdx} className="border-b border-theme-border/40 last:border-0">
                                  {group.parent && (
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-theme-base border-b border-theme-border/60">
                                      <span className="font-mono text-[10px] font-bold text-theme-muted/80 bg-theme-border/60 px-1 rounded">
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
                        <Plus size={12} /> {showQuickOperacion ? 'Ocultar' : 'Nueva Operación'}
                      </button>
                    </div>

                    {/* Combobox selector de operación (sin buscador, solo selección de lista) */}
                    <div className="relative" ref={operacionSelectorRef}>
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

                        const selectedOp = operaciones.find((o) => o.id === Number(formMemoria.operacionId));

                        return (
                          <>
                            <button
                              type="button"
                              onClick={() => setOperacionSelectorOpen(!operacionSelectorOpen)}
                              className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border transition-colors text-left ${selectedOp
                                ? 'border-theme-border bg-theme-surface hover:border-theme-primary'
                                : 'border-amber-500/50 bg-amber-500/5 hover:border-amber-500'
                                }`}
                            >
                              {selectedOp ? (
                                <span className="flex-1 min-w-0">
                                  <span className="font-mono font-bold text-xs text-theme-primary mr-2">
                                    {selectedOp.codigo}
                                  </span>
                                  <span className="text-xs text-theme-main line-clamp-1">{selectedOp.descripcion}</span>
                                </span>
                              ) : (
                                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                                  <AlertCircle size={14} className="shrink-0" />
                                  Seleccione Operación POA institucional...
                                </span>
                              )}
                              <svg
                                className={`w-4 h-4 shrink-0 text-theme-muted transition-transform ${operacionSelectorOpen ? 'rotate-180' : ''}`}
                                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>

                            {/* Dropdown lista de operaciones sin buscador */}
                            {operacionSelectorOpen && (
                              <div
                                className="absolute z-50 mt-1 w-full bg-theme-surface border border-theme-border rounded-xl shadow-xl overflow-hidden flex flex-col"
                                style={{ maxHeight: '240px' }}
                              >
                                <div className="overflow-y-auto" style={{ maxHeight: '240px' }}>
                                  {opsFiltradas.length === 0 ? (
                                    <div className="py-6 text-center text-theme-muted text-xs">
                                      No existen operaciones disponibles para su área.
                                    </div>
                                  ) : (
                                    opsFiltradas.map((op) => {
                                      const isActive = op.id === Number(formMemoria.operacionId);
                                      return (
                                        <button
                                          key={op.id}
                                          type="button"
                                          onClick={() => {
                                            setFormMemoria({
                                              ...formMemoria,
                                              operacionId: op.id,
                                              es_contratacion: op.es_contratacion ?? formMemoria.es_contratacion,
                                            });
                                            setOperacionSelectorOpen(false);
                                          }}
                                          className={`w-full flex items-start gap-3 px-3 py-2 text-left transition-colors border-b border-theme-border/30 last:border-0 ${isActive
                                            ? 'bg-theme-primary/10 hover:bg-theme-primary/15'
                                            : 'hover:bg-theme-border/30'
                                            }`}
                                        >
                                          <span
                                            className={`shrink-0 font-mono font-bold text-[11px] px-1.5 py-0.5 rounded-md ${isActive
                                              ? 'bg-theme-primary text-theme-primaryText'
                                              : 'bg-theme-base text-theme-primary border border-theme-border'
                                              }`}
                                          >
                                            {op.codigo}
                                          </span>

                                          <div className="flex-1 min-w-0">
                                            <p className={`text-xs leading-tight ${isActive ? 'font-semibold text-theme-main' : 'text-theme-main'}`}>
                                              {op.descripcion}
                                            </p>
                                          </div>

                                          {isActive && (
                                            <Check size={14} className="shrink-0 text-theme-primary mt-0.5" />
                                          )}
                                        </button>
                                      );
                                    })
                                  )}
                                </div>
                              </div>
                            )}

                            <input
                              type="text"
                              required
                              readOnly
                              tabIndex={-1}
                              value={formMemoria.operacionId}
                              className="absolute opacity-0 h-0 w-0 pointer-events-none"
                            />
                          </>
                        );
                      })()}
                    </div>
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

                      <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-1">
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
                          className="btn-primary text-xs px-3.5 py-1"
                        >
                          Guardar y Vincular
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Checkbox Contratación */}
                <div className="flex items-center gap-2 pt-1 border-t border-theme-border/60">
                  <input
                    type="checkbox"
                    id="chk-es-contratacion"
                    checked={formMemoria.es_contratacion}
                    onChange={(e) => setFormMemoria({ ...formMemoria, es_contratacion: e.target.checked })}
                    className="w-4 h-4 rounded text-theme-primary focus:ring-theme-primary cursor-pointer"
                  />
                  <label htmlFor="chk-es-contratacion" className="text-xs font-semibold text-theme-main cursor-pointer select-none">
                    Aplica a Contrataciones
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
                    <div className="lg:col-span-6 flex flex-col space-y-2 h-full">
                      <label className="block text-xs font-bold uppercase tracking-wider text-theme-main">
                        Justificación Técnica y Sustento *
                      </label>
                      <div className="flex-1 flex flex-col justify-between rounded-xl border border-theme-border bg-theme-surface p-3.5 space-y-2 min-h-[260px]">
                        <textarea
                          required
                          value={formMemoria.justificacion}
                          onChange={(e) => setFormMemoria({ ...formMemoria, justificacion: e.target.value })}
                          placeholder="Detalle los objetivos operativos, necesidad institucional y justificación técnica del gasto..."
                          className="w-full flex-1 min-h-[200px] h-full bg-transparent resize-none focus:outline-none text-xs text-theme-main uppercase leading-relaxed placeholder:normal-case placeholder:text-theme-muted overflow-y-auto"
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
                  onClick={() => {
                    const prev = editingMemoria;
                    onClose();
                    if (prev) setFichaMemoria(prev);
                  }}
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
  );
}
