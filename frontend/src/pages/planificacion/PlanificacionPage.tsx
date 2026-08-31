import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  Compass,
  Target,
  FileCheck2,
  ListTodo,
  Plus,
  Edit2,
  Power,
  X,
  Search,
  ChevronDown,
  Layers,
  Building2,
  Calendar,
  Sparkles,
  Check,
  History,
  Copy,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { planificacionService } from '../../services/planificacionService';
import { organizacionalService } from '../../services/organizacionalService';
import { getGestiones, Gestion } from '../../services/presupuestoService';
import { AccionMedianoPlazo, AccionCortoPlazo, Operacion, Tarea } from '../../types/planificacion';
import { Area, Programa } from '../../types/organizacional';
import alertService from '../../utils/alerts';

export default function PlanificacionPage() {
  const { user } = useAuth();
  const rolName = user?.rol_nombre?.toUpperCase() || '';
  const isAprobador = user?.is_superuser || rolName === 'APROBADOR' || rolName === 'ADMINISTRADOR';
  const isGerente = rolName === 'GERENTE';
  const isElaborador = rolName === 'ELABORADOR';
  const isPlanificador = rolName === 'PLANIFICADOR';

  const canCreateOpOrTarea = isAprobador || isPlanificador || isGerente || isElaborador;
  const canEditOrToggleOpOrTarea = isAprobador || isPlanificador || isGerente;
  const canManageAmpOrAcp = isAprobador || isPlanificador;

  const userAreaId = user?.area_id;

  // Tabs
  const [activeTab, setActiveTab] = useState<'OPERACIONES' | 'TAREAS' | 'ACP' | 'AMP' | 'COMPARATIVA'>('OPERACIONES');

  // Data lists
  const [ampList, setAmpList] = useState<AccionMedianoPlazo[]>([]);
  const [acpList, setAcpList] = useState<AccionCortoPlazo[]>([]);
  const [operacionesList, setOperacionesList] = useState<Operacion[]>([]);
  const [tareasList, setTareasList] = useState<Tarea[]>([]);
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [gestiones, setGestiones] = useState<Gestion[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter bar states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGestion, setFilterGestion] = useState<string>('ALL');
  const [filterPrograma, setFilterPrograma] = useState<string>('ALL');
  const [filterArea, setFilterArea] = useState<string>('ALL');

  // Modals state
  const [showAmpModal, setShowAmpModal] = useState(false);
  const [editingAmp, setEditingAmp] = useState<AccionMedianoPlazo | null>(null);

  const [showAcpModal, setShowAcpModal] = useState(false);
  const [editingAcp, setEditingAcp] = useState<AccionCortoPlazo | null>(null);

  const [showOpModal, setShowOpModal] = useState(false);
  const [editingOp, setEditingOp] = useState<Operacion | null>(null);

  const [showTareaModal, setShowTareaModal] = useState(false);
  const [editingTarea, setEditingTarea] = useState<Tarea | null>(null);

  // Form states with Cascading Program Hierarchy
  const [ampForm, setAmpForm] = useState({
    programa: '',
    periodo_inicio: 2026,
    periodo_fin: 2030,
  });

  const [acpForm, setAcpForm] = useState({
    programa: '',
    accion_mediano_plazo: '',
    gestion: '',
  });

  const [opForm, setOpForm] = useState({
    programa: '',
    accion_corto_plazo: '',
    area: '',
  });

  const [tareaForm, setTareaForm] = useState({
    operacion: '',
    codigo: '',
  });

  // Dropdowns Open States (Filter bar & Modals)
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});
  const toggleDropdown = (key: string) => {
    setOpenDropdowns((prev) => {
      const newState: Record<string, boolean> = {};
      if (!prev[key]) {
        newState[key] = true;
      }
      return newState;
    });
  };
  const closeAllDropdowns = () => setOpenDropdowns({});

  // Interannual Comparison State
  const [compGestionBase, setCompGestionBase] = useState<number>(2026);
  const [compGestionDestino, setCompGestionDestino] = useState<number>(2027);
  const [compAreaId, setCompAreaId] = useState<string>('ALL');
  const [replicating, setReplicating] = useState(false);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAmpModal(false);
        setShowAcpModal(false);
        setShowOpModal(false);
        setShowTareaModal(false);
        closeAllDropdowns();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Global click outside to close dropdowns
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        closeAllDropdowns();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch all planning data
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [amps, acps, ops, tareas, progsRes, arsRes, gests] = await Promise.all([
        planificacionService.getAccionesMedianoPlazo(),
        planificacionService.getAccionesCortoPlazo(),
        planificacionService.getOperaciones(),
        planificacionService.getTareas(),
        organizacionalService.getProgramas(),
        organizacionalService.getAreas(),
        getGestiones().catch(() => [] as Gestion[]),
      ]);
      setAmpList(amps || []);
      setAcpList(acps || []);
      setOperacionesList(ops || []);
      setTareasList(tareas || []);
      setProgramas(progsRes.data || []);
      setAreas(arsRes.data || []);
      setGestiones(gests || []);

      if (userAreaId && !isAprobador && !isPlanificador) {
        setFilterArea(String(userAreaId));
      }
    } catch (err) {
      console.error('Error cargando planificación:', err);
      alertService.error('Error de carga', 'No se pudieron obtener los datos de Planificación Estratégica.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // ==========================================
  // AUTOINCREMENTABLE CODE GENERATORS (READ-ONLY)
  // ==========================================

  // Auto-generate AMP Code
  const calculatedAmpCode = useMemo(() => {
    if (editingAmp) return editingAmp.codigo;
    if (!ampForm.programa) return 'AMP-P?-??';
    const prog = programas.find((p) => String(p.id) === String(ampForm.programa));
    const prefix = prog ? prog.codigo.replace(/[^a-zA-Z0-9]/g, '') : 'P1';

    const existing = ampList.filter((a) => String(a.programa) === String(ampForm.programa));
    let nextNum = existing.length + 1;
    let code = `AMP-${prefix}-${String(nextNum).padStart(2, '0')}`;
    while (ampList.some((a) => a.codigo === code)) {
      nextNum++;
      code = `AMP-${prefix}-${String(nextNum).padStart(2, '0')}`;
    }
    return code;
  }, [editingAmp, ampForm.programa, programas, ampList]);

  // Auto-generate ACP Code
  const calculatedAcpCode = useMemo(() => {
    if (editingAcp) return editingAcp.codigo;
    if (!acpForm.accion_mediano_plazo) return 'ACP-P?-??';
    const amp = ampList.find((a) => String(a.id) === String(acpForm.accion_mediano_plazo));
    const ampCode = amp ? amp.codigo : 'AMP';

    const existingInAmp = acpList.filter((acp) => String(acp.accion_mediano_plazo) === String(acpForm.accion_mediano_plazo));
    let nextNum = existingInAmp.length + 1;
    let code = `${ampCode}-ACP${String(nextNum).padStart(2, '0')}`;
    while (acpList.some((acp) => acp.codigo === code)) {
      nextNum++;
      code = `${ampCode}-ACP${String(nextNum).padStart(2, '0')}`;
    }
    return code;
  }, [editingAcp, acpForm.accion_mediano_plazo, ampList, acpList]);

  // Auto-generate Operacion Code
  const calculatedOpCode = useMemo(() => {
    if (editingOp) return editingOp.codigo;
    if (!opForm.area) return 'OP-???-??';
    const area = areas.find((a) => String(a.id) === String(opForm.area));
    const areaCode = area ? area.codigo.replace(/[^a-zA-Z0-9]/g, '') : 'OPE';

    const existingInArea = operacionesList.filter((op) => String(op.area) === String(opForm.area));
    let nextNum = existingInArea.length + 1;
    let code = `OP-${areaCode}-${String(nextNum).padStart(2, '0')}`;
    while (operacionesList.some((op) => op.codigo === code)) {
      nextNum++;
      code = `OP-${areaCode}-${String(nextNum).padStart(2, '0')}`;
    }
    return code;
  }, [editingOp, opForm.area, areas, operacionesList]);

  // ==========================================
  // HIERARCHICAL CASCADING HELPERS
  // ==========================================

  // AMPs for selected Programa in ACP modal
  const availableAmpsForAcpForm = useMemo(() => {
    if (!acpForm.programa) return [];
    return ampList.filter((amp) => String(amp.programa) === String(acpForm.programa) && amp.estado);
  }, [acpForm.programa, ampList]);

  // ACPs for selected Programa in Operacion modal
  const availableAcpsForOpForm = useMemo(() => {
    if (!opForm.programa) return [];
    return acpList.filter((acp) => {
      const progId = acp.programa_id || ampList.find((m) => m.id === acp.accion_mediano_plazo)?.programa;
      return String(progId) === String(opForm.programa) && acp.estado;
    });
  }, [opForm.programa, acpList, ampList]);

  // Areas for selected Programa in Operacion modal
  const availableAreasForOpForm = useMemo(() => {
    if (!opForm.programa) return [];
    return areas.filter((area) => String(area.programa) === String(opForm.programa) && area.estado);
  }, [opForm.programa, areas]);

  // ==========================================
  // MODAL HANDLERS: AMP (PEI)
  // ==========================================
  const handleOpenCreateAMP = () => {
    if (!canManageAmpOrAcp) return;
    const defaultProg = programas[0]?.id ? String(programas[0].id) : '';
    setEditingAmp(null);
    setAmpForm({
      programa: defaultProg,
      periodo_inicio: 2026,
      periodo_fin: 2030,
    });
    setShowAmpModal(true);
  };

  const handleOpenEditAMP = (amp: AccionMedianoPlazo) => {
    if (!canManageAmpOrAcp) return;
    setEditingAmp(amp);
    setAmpForm({
      programa: String(amp.programa),
      periodo_inicio: amp.periodo_inicio,
      periodo_fin: amp.periodo_fin,
    });
    setShowAmpModal(true);
  };

  const handleSaveAMP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageAmpOrAcp) return;
    if (!ampForm.programa) {
      alertService.error('Campo requerido', 'Debe seleccionar un Programa Institucional.');
      return;
    }
    const progObj = programas.find((p) => String(p.id) === String(ampForm.programa));
    const autoDesc = editingAmp
      ? editingAmp.descripcion
      : `OBJETIVO ESTRATÉGICO PEI ${calculatedAmpCode} - ${progObj?.nombre || 'PROGRAMA'}`;

    try {
      if (editingAmp) {
        await planificacionService.updateAccionMedianoPlazo(editingAmp.id, {
          programa: Number(ampForm.programa),
          codigo: editingAmp.codigo,
          descripcion: autoDesc,
          periodo_inicio: Number(ampForm.periodo_inicio),
          periodo_fin: Number(ampForm.periodo_fin),
        });
        alertService.success('AMP Actualizada', 'Los cambios en la Acción a Mediano Plazo fueron guardados.');
      } else {
        await planificacionService.createAccionMedianoPlazo({
          programa: Number(ampForm.programa),
          codigo: calculatedAmpCode,
          descripcion: autoDesc,
          periodo_inicio: Number(ampForm.periodo_inicio),
          periodo_fin: Number(ampForm.periodo_fin),
        });
        alertService.success('AMP Creada', 'Acción a Mediano Plazo registrada correctamente.');
      }
      setShowAmpModal(false);
      fetchAll();
    } catch (err: any) {
      alertService.error('Error', err?.response?.data?.detail || err?.response?.data?.non_field_errors?.[0] || 'No se pudo guardar la AMP.');
    }
  };

  const handleToggleAMP = async (amp: AccionMedianoPlazo) => {
    if (!canManageAmpOrAcp) return;
    const confirm = await alertService.confirm({
      title: amp.estado ? '¿Desactivar AMP (Baja Lógica)?' : '¿Reactivar AMP?',
      text: amp.estado ? `La AMP ${amp.codigo} quedará dada de baja lógica.` : `La AMP ${amp.codigo} volverá a estar activa.`,
      isDanger: amp.estado,
    });
    if (!confirm) return;

    try {
      await planificacionService.toggleEstadoAMP(amp.id);
      alertService.success('Estado Actualizado', `La AMP ${amp.codigo} fue ${amp.estado ? 'desactivada' : 'reactivada'}.`);
      fetchAll();
    } catch (err) {
      alertService.error('Error', 'No se pudo cambiar el estado de la AMP.');
    }
  };

  // ==========================================
  // MODAL HANDLERS: ACP (POA)
  // ==========================================
  const handleOpenCreateACP = () => {
    if (!canManageAmpOrAcp) return;
    const defaultProg = programas[0]?.id ? String(programas[0].id) : '';
    const matchingAmps = ampList.filter((a) => String(a.programa) === defaultProg && a.estado);
    const defaultAmp = matchingAmps[0]?.id ? String(matchingAmps[0].id) : '';
    const defaultGestion = gestiones[0]?.id ? String(gestiones[0].id) : '';

    setEditingAcp(null);
    setAcpForm({
      programa: defaultProg,
      accion_mediano_plazo: defaultAmp,
      gestion: defaultGestion,
    });
    setShowAcpModal(true);
  };

  const handleOpenEditACP = (acp: AccionCortoPlazo) => {
    if (!canManageAmpOrAcp) return;
    const progId = acp.programa_id || ampList.find((m) => m.id === acp.accion_mediano_plazo)?.programa;
    setEditingAcp(acp);
    setAcpForm({
      programa: progId ? String(progId) : '',
      accion_mediano_plazo: String(acp.accion_mediano_plazo),
      gestion: acp.gestion ? String(acp.gestion) : '',
    });
    setShowAcpModal(true);
  };

  const handleSaveACP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageAmpOrAcp) return;
    if (!acpForm.accion_mediano_plazo) {
      alertService.error('Campo requerido', 'Debe seleccionar una Acción a Mediano Plazo (AMP).');
      return;
    }
    const ampObj = ampList.find((a) => String(a.id) === String(acpForm.accion_mediano_plazo));
    const autoDesc = editingAcp
      ? editingAcp.descripcion
      : `OBJETIVO POA ${calculatedAcpCode} - ${ampObj?.codigo || 'AMP'}`;

    try {
      if (editingAcp) {
        await planificacionService.updateAccionCortoPlazo(editingAcp.id, {
          accion_mediano_plazo: Number(acpForm.accion_mediano_plazo),
          gestion: acpForm.gestion ? Number(acpForm.gestion) : undefined,
          codigo: editingAcp.codigo,
          descripcion: autoDesc,
        });
        alertService.success('ACP Actualizada', 'Los cambios en la Acción a Corto Plazo fueron guardados.');
      } else {
        await planificacionService.createAccionCortoPlazo({
          accion_mediano_plazo: Number(acpForm.accion_mediano_plazo),
          gestion: acpForm.gestion ? Number(acpForm.gestion) : undefined,
          codigo: calculatedAcpCode,
          descripcion: autoDesc,
        });
        alertService.success('ACP Creada', 'Acción a Corto Plazo registrada correctamente.');
      }
      setShowAcpModal(false);
      fetchAll();
    } catch (err: any) {
      alertService.error('Error', err?.response?.data?.detail || err?.response?.data?.non_field_errors?.[0] || 'No se pudo guardar la ACP.');
    }
  };

  const handleToggleACP = async (acp: AccionCortoPlazo) => {
    if (!canManageAmpOrAcp) return;
    const confirm = await alertService.confirm({
      title: acp.estado ? '¿Desactivar ACP (Baja Lógica)?' : '¿Reactivar ACP?',
      text: acp.estado ? `La ACP ${acp.codigo} quedará dada de baja lógica.` : `La ACP ${acp.codigo} volverá a estar activa.`,
      isDanger: acp.estado,
    });
    if (!confirm) return;

    try {
      await planificacionService.toggleEstadoACP(acp.id);
      alertService.success('Estado Actualizado', `La ACP ${acp.codigo} fue ${acp.estado ? 'desactivada' : 'reactivada'}.`);
      fetchAll();
    } catch (err) {
      alertService.error('Error', 'No se pudo cambiar el estado de la ACP.');
    }
  };

  // ==========================================
  // MODAL HANDLERS: OPERACION
  // ==========================================
  const handleOpenCreateOp = () => {
    if (!canCreateOpOrTarea) return;

    // Detect user's area program or default to first program
    let initialProg = programas[0]?.id ? String(programas[0].id) : '';
    let initialArea = '';

    if (userAreaId && !isAprobador && !isPlanificador) {
      const userAreaObj = areas.find((a) => a.id === userAreaId);
      if (userAreaObj) {
        initialProg = String(userAreaObj.programa);
        initialArea = String(userAreaObj.id);
      }
    } else {
      const areasOfProg = areas.filter((a) => String(a.programa) === initialProg && a.estado);
      initialArea = areasOfProg[0]?.id ? String(areasOfProg[0].id) : '';
    }

    const acpsOfProg = acpList.filter((acp) => {
      const progId = acp.programa_id || ampList.find((m) => m.id === acp.accion_mediano_plazo)?.programa;
      return String(progId) === initialProg && acp.estado;
    });
    const initialAcp = acpsOfProg[0]?.id ? String(acpsOfProg[0].id) : '';

    setEditingOp(null);
    setOpForm({
      programa: initialProg,
      accion_corto_plazo: initialAcp,
      area: initialArea,
    });
    setShowOpModal(true);
  };

  const handleOpenEditOp = (op: Operacion) => {
    if (!canEditOrToggleOpOrTarea) return;
    const progId = op.area_programa_id || op.acp_programa_id || areas.find((a) => a.id === op.area)?.programa;
    setEditingOp(op);
    setOpForm({
      programa: progId ? String(progId) : '',
      accion_corto_plazo: String(op.accion_corto_plazo),
      area: String(op.area),
    });
    setShowOpModal(true);
  };

  const handleSaveOp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opForm.programa) {
      alertService.error('Campo requerido', 'Debe seleccionar un Programa Institucional.');
      return;
    }
    if (!opForm.accion_corto_plazo) {
      alertService.error('Campo requerido', 'Debe seleccionar una Acción a Corto Plazo (ACP).');
      return;
    }
    if (!opForm.area) {
      alertService.error('Campo requerido', 'Debe seleccionar el Área Responsable.');
      return;
    }

    const selectedAreaObj = areas.find((a) => String(a.id) === String(opForm.area));
    const selectedAcpObj = acpList.find((a) => String(a.id) === String(opForm.accion_corto_plazo));
    const autoDesc = editingOp
      ? editingOp.descripcion
      : `OPERACIÓN ${calculatedOpCode} - ${selectedAreaObj?.nombre || 'ÁREA'} (${selectedAcpObj?.codigo || 'POA'})`;

    try {
      const selectedAreaId = isAprobador || isPlanificador ? Number(opForm.area) : Number(userAreaId || opForm.area);
      if (editingOp) {
        if (!canEditOrToggleOpOrTarea) return;
        await planificacionService.updateOperacion(editingOp.id, {
          accion_corto_plazo: Number(opForm.accion_corto_plazo),
          area: selectedAreaId,
          codigo: editingOp.codigo,
          descripcion: autoDesc,
          es_contratacion: true,
        });
        alertService.success('Operación Actualizada', 'Los cambios en la Operación fueron guardados.');
      } else {
        if (!canCreateOpOrTarea) return;
        await planificacionService.createOperacion({
          accion_corto_plazo: Number(opForm.accion_corto_plazo),
          area: selectedAreaId,
          codigo: calculatedOpCode,
          descripcion: autoDesc,
          es_contratacion: true,
        });
        alertService.success('Operación Creada', 'Operación registrada correctamente.');
      }
      setShowOpModal(false);
      fetchAll();
    } catch (err: any) {
      alertService.error('Error', err?.response?.data?.detail || err?.response?.data?.non_field_errors?.[0] || 'No se pudo guardar la Operación.');
    }
  };

  const handleToggleOp = async (op: Operacion) => {
    if (!canEditOrToggleOpOrTarea) return;
    const confirm = await alertService.confirm({
      title: op.estado ? '¿Desactivar Operación (Baja Lógica)?' : '¿Reactivar Operación?',
      text: op.estado ? `La Operación ${op.codigo} quedará dada de baja lógica.` : `La Operación ${op.codigo} volverá a estar activa.`,
      isDanger: op.estado,
    });
    if (!confirm) return;

    try {
      await planificacionService.toggleEstadoOperacion(op.id);
      alertService.success('Estado Actualizado', `La Operación ${op.codigo} fue ${op.estado ? 'desactivada' : 'reactivada'}.`);
      fetchAll();
    } catch (err) {
      alertService.error('Error', 'No se pudo cambiar el estado de la Operación.');
    }
  };

  // ==========================================
  // REPLICAR OPERACIONES A NUEVA GESTION
  // ==========================================
  const handleReplicarOperaciones = async () => {
    if (!isAprobador && !isPlanificador) return;
    const confirm = await alertService.confirm({
      title: `¿Replicar Operaciones de Gestión ${compGestionBase} a ${compGestionDestino}?`,
      text: `Se copiarán las operaciones base del año ${compGestionBase} a la gestión ${compGestionDestino} para facilitar la formulación interanual.`,
      isDanger: false,
    });
    if (!confirm) return;

    setReplicating(true);
    try {
      const opsToReplicate = operacionesList.filter((op) => {
        const matchesArea = compAreaId === 'ALL' || String(op.area) === compAreaId;
        const matchesGestion = !op.gestion_anio || op.gestion_anio === compGestionBase;
        return matchesArea && matchesGestion && op.estado;
      });

      if (opsToReplicate.length === 0) {
        alertService.error('Sin Operaciones', `No se encontraron operaciones activas en la gestión ${compGestionBase} para replicar.`);
        setReplicating(false);
        return;
      }

      let countSuccess = 0;
      for (const op of opsToReplicate) {
        const newCode = `${op.codigo}-${compGestionDestino}`;
        if (!operacionesList.some((existing) => existing.codigo === newCode)) {
          try {
            await planificacionService.createOperacion({
              accion_corto_plazo: op.accion_corto_plazo,
              area: op.area,
              codigo: newCode,
              descripcion: `[GESTIÓN ${compGestionDestino}] ${op.descripcion}`,
              es_contratacion: true,
            });
            countSuccess++;
          } catch (e) {
            console.error('Error replicando operacion:', op.codigo, e);
          }
        }
      }

      alertService.success(
        'Replicación Completada',
        `Se han formulado ${countSuccess} operaciones en la Gestión ${compGestionDestino} con base en la Gestión ${compGestionBase}.`
      );
      fetchAll();
    } catch (err) {
      alertService.error('Error', 'No se pudo completar la replicación de operaciones.');
    } finally {
      setReplicating(false);
    }
  };

  // ==========================================
  // FILTERED LISTS
  // ==========================================
  const filteredOperaciones = useMemo(() => {
    return operacionesList.filter((op) => {
      const q = searchTerm.toLowerCase();
      const matchText =
        !searchTerm ||
        op.codigo.toLowerCase().includes(q) ||
        op.descripcion.toLowerCase().includes(q) ||
        (op.area_nombre && op.area_nombre.toLowerCase().includes(q)) ||
        (op.acp_codigo && op.acp_codigo.toLowerCase().includes(q));

      const matchGestion =
        filterGestion === 'ALL' ||
        String(op.gestion_id) === filterGestion ||
        String(op.gestion_anio) === filterGestion;

      const matchPrograma =
        filterPrograma === 'ALL' ||
        String(op.area_programa_id) === filterPrograma ||
        String(op.acp_programa_id) === filterPrograma;

      const matchArea = filterArea === 'ALL' || String(op.area) === filterArea;

      return matchText && matchGestion && matchPrograma && matchArea;
    });
  }, [operacionesList, searchTerm, filterGestion, filterPrograma, filterArea]);

  const filteredAcps = useMemo(() => {
    return acpList.filter((a) => {
      const q = searchTerm.toLowerCase();
      const matchText =
        !searchTerm ||
        a.codigo.toLowerCase().includes(q) ||
        a.descripcion.toLowerCase().includes(q) ||
        (a.amp_codigo && a.amp_codigo.toLowerCase().includes(q));

      const matchGestion =
        filterGestion === 'ALL' ||
        String(a.gestion) === filterGestion ||
        String(a.gestion_anio) === filterGestion;

      const matchPrograma =
        filterPrograma === 'ALL' ||
        String(a.programa_id) === filterPrograma;

      return matchText && matchGestion && matchPrograma;
    });
  }, [acpList, searchTerm, filterGestion, filterPrograma]);

  const filteredAmps = useMemo(() => {
    return ampList.filter((m) => {
      const q = searchTerm.toLowerCase();
      const matchText =
        !searchTerm ||
        m.codigo.toLowerCase().includes(q) ||
        m.descripcion.toLowerCase().includes(q) ||
        (m.programa_codigo && m.programa_codigo.toLowerCase().includes(q)) ||
        (m.programa_nombre && m.programa_nombre.toLowerCase().includes(q));

      const matchPrograma = filterPrograma === 'ALL' || String(m.programa) === filterPrograma;

      return matchText && matchPrograma;
    });
  }, [ampList, searchTerm, filterPrograma]);

  // Operations for Interannual Comparison
  const compOperacionesBase = useMemo(() => {
    return operacionesList.filter((op) => {
      const matchesArea = compAreaId === 'ALL' || String(op.area) === compAreaId;
      const matchesGestion = !op.gestion_anio || op.gestion_anio === compGestionBase;
      return matchesArea && matchesGestion;
    });
  }, [operacionesList, compAreaId, compGestionBase]);

  const compOperacionesDestino = useMemo(() => {
    return operacionesList.filter((op) => {
      const matchesArea = compAreaId === 'ALL' || String(op.area) === compAreaId;
      const matchesGestion = op.gestion_anio === compGestionDestino || op.codigo.includes(String(compGestionDestino));
      return matchesArea && matchesGestion;
    });
  }, [operacionesList, compAreaId, compGestionDestino]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 px-2 sm:px-4" ref={dropdownRef}>
      {/* 1. CABECERA PRINCIPAL ESTANDARIZADA */}
      <div className="rounded-2xl border border-theme-border bg-theme-surface p-6 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-theme-primary/10 text-theme-primary border border-theme-primary/20 flex items-center justify-center shadow-sm shrink-0">
              <Compass size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-md bg-theme-primary/10 text-theme-primary border border-theme-primary/20 text-[10px] font-bold uppercase tracking-wider">
                  SPO • Alineación Estratégica
                </span>
                <span className="text-[11px] font-medium text-theme-muted">
                  Estructura Oficial PEI / POA
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-display font-bold text-theme-main tracking-tight">
                Planificación Estratégica Institucional
              </h1>
              <p className="text-xs text-theme-muted">
                Catálogo de Operaciones por Programa, Objetivos POA (ACP) y Planes Quinquenales (AMP).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
            {activeTab === 'OPERACIONES' && canCreateOpOrTarea && (
              <button
                onClick={handleOpenCreateOp}
                className="px-4 py-2 rounded-xl bg-theme-primary text-theme-primaryText font-semibold text-xs shadow-sm hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus size={15} /> Nueva Operación
              </button>
            )}
            {activeTab === 'ACP' && canManageAmpOrAcp && (
              <button
                onClick={handleOpenCreateACP}
                className="px-4 py-2 rounded-xl bg-theme-primary text-theme-primaryText font-semibold text-xs shadow-sm hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus size={15} /> Nueva ACP (POA)
              </button>
            )}
            {activeTab === 'AMP' && canManageAmpOrAcp && (
              <button
                onClick={handleOpenCreateAMP}
                className="px-4 py-2 rounded-xl bg-theme-primary text-theme-primaryText font-semibold text-xs shadow-sm hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus size={15} /> Nueva AMP (PEI)
              </button>
            )}
            {activeTab === 'COMPARATIVA' && (isAprobador || isPlanificador) && (
              <button
                onClick={handleReplicarOperaciones}
                disabled={replicating}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-sm hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <Copy size={14} /> {replicating ? 'Replicando...' : `Replicar Base a ${compGestionDestino}`}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. PESTAÑAS DE NAVEGACIÓN ESTILIZADAS */}
      <div className="flex flex-wrap items-center gap-2 border-b border-theme-border/80 pb-2.5">
        <button
          onClick={() => setActiveTab('OPERACIONES')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs transition-all ${
            activeTab === 'OPERACIONES'
              ? 'bg-theme-primary text-theme-primaryText shadow-sm'
              : 'text-theme-muted hover:bg-theme-surface hover:text-theme-main'
          }`}
        >
          <FileCheck2 size={15} />
          <span>Operaciones por Área</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${activeTab === 'OPERACIONES' ? 'bg-white/20 text-white' : 'bg-theme-border/60 text-theme-muted'}`}>
            {operacionesList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('ACP')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs transition-all ${
            activeTab === 'ACP'
              ? 'bg-theme-primary text-theme-primaryText shadow-sm'
              : 'text-theme-muted hover:bg-theme-surface hover:text-theme-main'
          }`}
        >
          <Target size={15} />
          <span>Acciones Corto Plazo (POA)</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${activeTab === 'ACP' ? 'bg-white/20 text-white' : 'bg-theme-border/60 text-theme-muted'}`}>
            {acpList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('AMP')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs transition-all ${
            activeTab === 'AMP'
              ? 'bg-theme-primary text-theme-primaryText shadow-sm'
              : 'text-theme-muted hover:bg-theme-surface hover:text-theme-main'
          }`}
        >
          <Compass size={15} />
          <span>Acciones Mediano Plazo (PEI)</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${activeTab === 'AMP' ? 'bg-white/20 text-white' : 'bg-theme-border/60 text-theme-muted'}`}>
            {ampList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('COMPARATIVA')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs transition-all ${
            activeTab === 'COMPARATIVA'
              ? 'bg-theme-primary text-theme-primaryText shadow-sm'
              : 'text-theme-muted hover:bg-theme-surface hover:text-theme-main'
          }`}
        >
          <History size={15} />
          <span>Comparativa Interanual Gestiones</span>
          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-indigo-500/20 text-indigo-400">
            Multi-Gestión
          </span>
        </button>
      </div>

      {/* 3. BARRA DE BÚSQUEDA Y FILTROS */}
      {activeTab !== 'COMPARATIVA' && (
        <div className="p-4 rounded-2xl border border-theme-border bg-theme-surface shadow-sm space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
            {/* Buscador */}
            <div className="lg:col-span-4 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-muted" size={16} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por código, área o programa..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-theme-border bg-theme-base text-theme-main focus:outline-none focus:border-theme-primary transition-colors placeholder:text-theme-muted"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-main">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Selector Gestión */}
            <div className="lg:col-span-2 relative">
              <button
                type="button"
                onClick={() => toggleDropdown('filter_gestion')}
                className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl border border-theme-border bg-theme-base text-theme-main hover:border-theme-primary/50 transition-colors"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Calendar size={14} className="text-theme-muted shrink-0" />
                  <span className="truncate">
                    {filterGestion === 'ALL'
                      ? 'Todas las Gestiones'
                      : `Gestión ${filterGestion}`}
                  </span>
                </div>
                <ChevronDown size={14} className="text-theme-muted shrink-0 ml-1" />
              </button>

              {openDropdowns['filter_gestion'] && (
                <div className="absolute top-full left-0 mt-1 w-full z-30 rounded-xl border border-theme-border bg-theme-surface p-1 shadow-lg max-h-56 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setFilterGestion('ALL');
                      closeAllDropdowns();
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors ${
                      filterGestion === 'ALL' ? 'bg-theme-primary text-theme-primaryText font-semibold' : 'text-theme-main hover:bg-theme-border/40'
                    }`}
                  >
                    Todas las Gestiones
                  </button>
                  {gestiones.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => {
                        setFilterGestion(String(g.anio));
                        closeAllDropdowns();
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                        filterGestion === String(g.anio) ? 'bg-theme-primary text-theme-primaryText font-semibold' : 'text-theme-main hover:bg-theme-border/40'
                      }`}
                    >
                      <span>Gestión {g.anio}</span>
                      <span className="text-[10px] opacity-75 font-mono">{g.estado_display}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selector Programa */}
            <div className="lg:col-span-3 relative">
              <button
                type="button"
                onClick={() => toggleDropdown('filter_programa')}
                className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl border border-theme-border bg-theme-base text-theme-main hover:border-theme-primary/50 transition-colors"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Layers size={14} className="text-theme-muted shrink-0" />
                  <span className="truncate">
                    {filterPrograma === 'ALL'
                      ? 'Todos los Programas'
                      : (() => {
                          const p = programas.find((pr) => String(pr.id) === filterPrograma);
                          return p ? `${p.codigo} - ${p.nombre}` : 'Programa';
                        })()}
                  </span>
                </div>
                <ChevronDown size={14} className="text-theme-muted shrink-0 ml-1" />
              </button>

              {openDropdowns['filter_programa'] && (
                <div className="absolute top-full left-0 mt-1 w-72 z-30 rounded-xl border border-theme-border bg-theme-surface p-1 shadow-lg max-h-56 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setFilterPrograma('ALL');
                      closeAllDropdowns();
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors ${
                      filterPrograma === 'ALL' ? 'bg-theme-primary text-theme-primaryText font-semibold' : 'text-theme-main hover:bg-theme-border/40'
                    }`}
                  >
                    Todos los Programas
                  </button>
                  {programas.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setFilterPrograma(String(p.id));
                        closeAllDropdowns();
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors ${
                        filterPrograma === String(p.id) ? 'bg-theme-primary text-theme-primaryText font-semibold' : 'text-theme-main hover:bg-theme-border/40'
                      }`}
                    >
                      <span className="font-bold text-theme-primary font-mono mr-1.5">{p.codigo}</span>
                      <span>{p.nombre}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selector Área */}
            {(isAprobador || isPlanificador) && (
              <div className="lg:col-span-3 relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown('filter_area')}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl border border-theme-border bg-theme-base text-theme-main hover:border-theme-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <Building2 size={14} className="text-theme-muted shrink-0" />
                    <span className="truncate">
                      {filterArea === 'ALL'
                        ? 'Todas las Áreas'
                        : (() => {
                            const a = areas.find((ar) => String(ar.id) === filterArea);
                            return a ? a.nombre : 'Área';
                          })()}
                    </span>
                  </div>
                  <ChevronDown size={14} className="text-theme-muted shrink-0 ml-1" />
                </button>

                {openDropdowns['filter_area'] && (
                  <div className="absolute top-full right-0 mt-1 w-72 z-30 rounded-xl border border-theme-border bg-theme-surface p-1 shadow-lg max-h-56 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setFilterArea('ALL');
                        closeAllDropdowns();
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors ${
                        filterArea === 'ALL' ? 'bg-theme-primary text-theme-primaryText font-semibold' : 'text-theme-main hover:bg-theme-border/40'
                      }`}
                    >
                      Todas las Áreas
                    </button>
                    {areas.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => {
                          setFilterArea(String(a.id));
                          closeAllDropdowns();
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors ${
                          filterArea === String(a.id) ? 'bg-theme-primary text-theme-primaryText font-semibold' : 'text-theme-main hover:bg-theme-border/40'
                        }`}
                      >
                        <span className="font-mono text-theme-muted mr-1">[{a.codigo}]</span>
                        <span>{a.nombre}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. CONTENIDO PRINCIPAL */}
      {loading ? (
        <div className="p-16 rounded-2xl border border-theme-border bg-theme-surface text-center text-theme-muted space-y-3">
          <div className="animate-spin inline-block w-7 h-7 border-2 border-theme-primary border-t-transparent rounded-full" />
          <p className="text-xs font-semibold uppercase tracking-wider">Cargando catálogo estratégico...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: OPERACIONES */}
          {activeTab === 'OPERACIONES' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-theme-muted">
                  Mostrando <strong className="text-theme-main">{filteredOperaciones.length}</strong> operaciones registradas
                </span>
              </div>

              {filteredOperaciones.length === 0 ? (
                <div className="p-12 rounded-2xl border border-dashed border-theme-border bg-theme-surface text-center text-theme-muted space-y-2">
                  <FileCheck2 size={32} className="mx-auto opacity-40" />
                  <p className="text-sm font-semibold text-theme-main">No se encontraron operaciones registradas</p>
                  <p className="text-xs">Presione "Nueva Operación" para registrar una en el programa correspondiente.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredOperaciones.map((op) => (
                    <div
                      key={op.id}
                      className={`p-5 rounded-2xl border border-theme-border bg-theme-surface hover:border-theme-primary/40 transition-all flex flex-col justify-between space-y-3 shadow-sm ${
                        !op.estado ? 'opacity-60 bg-theme-base/50' : ''
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-theme-primary/10 text-theme-primary border border-theme-primary/20">
                              {op.codigo}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-theme-base border border-theme-border text-theme-main flex items-center gap-1">
                              <Building2 size={11} className="text-theme-muted" />
                              {op.area_nombre || `Área ${op.area_codigo || ''}`}
                            </span>
                          </div>

                          {canEditOrToggleOpOrTarea && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => handleOpenEditOp(op)}
                                className="p-1.5 rounded-lg border border-theme-border bg-theme-base hover:bg-theme-border/60 text-blue-600 transition-colors"
                                title="Editar Operación"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => handleToggleOp(op)}
                                className={`p-1.5 rounded-lg border border-theme-border bg-theme-base hover:bg-theme-border/60 transition-colors ${
                                  op.estado ? 'text-rose-600' : 'text-emerald-600'
                                }`}
                                title={op.estado ? 'Desactivar (Baja Lógica)' : 'Reactivar'}
                              >
                                <Power size={13} />
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-theme-main font-semibold">
                          <span className="font-mono text-theme-primary font-bold">[{op.acp_codigo || 'ACP'}]</span>
                          <span className="text-theme-muted">
                            Programa: {op.area_programa_codigo || op.acp_programa_codigo || 'General'}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2.5 border-t border-theme-border/70 flex items-center justify-between text-[11px] text-theme-muted">
                        <span className="text-theme-muted font-medium">
                          Área: <strong className="text-theme-main">{op.area_nombre}</strong>
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            op.estado
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          }`}
                        >
                          {op.estado ? '✓ Activa' : '✕ Baja Lógica'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ACP (POA) */}
          {activeTab === 'ACP' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-theme-muted">
                  Total <strong className="text-theme-main">{filteredAcps.length}</strong> acciones a corto plazo
                </span>
              </div>

              {filteredAcps.length === 0 ? (
                <div className="p-12 rounded-2xl border border-dashed border-theme-border bg-theme-surface text-center text-theme-muted space-y-2">
                  <Target size={32} className="mx-auto opacity-40" />
                  <p className="text-sm font-semibold text-theme-main">No hay acciones a corto plazo registradas</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3.5">
                  {filteredAcps.map((acp) => (
                    <div
                      key={acp.id}
                      className={`p-5 rounded-2xl border border-theme-border bg-theme-surface hover:border-theme-primary/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm ${
                        !acp.estado ? 'opacity-60 bg-theme-base/50' : ''
                      }`}
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            {acp.codigo}
                          </span>
                          <span className="text-xs text-theme-muted font-medium">
                            PEI: <strong className="text-theme-main">{acp.amp_codigo}</strong>
                          </span>
                          <span className="text-xs text-theme-muted font-medium">
                            Programa: <strong className="text-theme-main">{acp.programa_codigo || 'P-1'}</strong>
                          </span>
                          {acp.gestion_anio && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-theme-base border border-theme-border text-theme-muted">
                              Gestión {acp.gestion_anio}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2.5">
                        <span
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                            acp.estado
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          }`}
                        >
                          {acp.estado ? '✓ Activa' : '✕ Baja Lógica'}
                        </span>
                        {canManageAmpOrAcp && (
                          <>
                            <button
                              onClick={() => handleOpenEditACP(acp)}
                              className="p-1.5 rounded-lg border border-theme-border bg-theme-base hover:bg-theme-border/60 text-blue-600 transition-colors"
                              title="Editar ACP"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleToggleACP(acp)}
                              className={`p-1.5 rounded-lg border border-theme-border bg-theme-base hover:bg-theme-border/60 transition-colors ${
                                acp.estado ? 'text-rose-600' : 'text-emerald-600'
                              }`}
                              title={acp.estado ? 'Desactivar' : 'Reactivar'}
                            >
                              <Power size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AMP (PEI) */}
          {activeTab === 'AMP' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-theme-muted">
                  Total <strong className="text-theme-main">{filteredAmps.length}</strong> acciones a mediano plazo (Quinquenal)
                </span>
              </div>

              {filteredAmps.length === 0 ? (
                <div className="p-12 rounded-2xl border border-dashed border-theme-border bg-theme-surface text-center text-theme-muted space-y-2">
                  <Compass size={32} className="mx-auto opacity-40" />
                  <p className="text-sm font-semibold text-theme-main">No hay acciones a mediano plazo registradas</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredAmps.map((amp) => (
                    <div
                      key={amp.id}
                      className={`p-6 rounded-2xl border border-theme-border bg-theme-surface hover:border-theme-primary/40 transition-all flex flex-wrap items-center justify-between gap-3 shadow-sm ${
                        !amp.estado ? 'opacity-60 bg-theme-base/50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          {amp.codigo}
                        </span>
                        <span className="text-xs font-semibold text-theme-main bg-theme-base border border-theme-border px-2.5 py-0.5 rounded-md">
                          Programa: {amp.programa_codigo} - {amp.programa_nombre}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-3 py-1 rounded-lg bg-theme-primary/10 text-theme-primary border border-theme-primary/20 font-mono">
                          Período {amp.periodo_inicio} - {amp.periodo_fin}
                        </span>
                        {canManageAmpOrAcp && (
                          <>
                            <button
                              onClick={() => handleOpenEditAMP(amp)}
                              className="p-1.5 rounded-lg border border-theme-border bg-theme-base hover:bg-theme-border/60 text-blue-600 transition-colors"
                              title="Editar AMP"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleToggleAMP(amp)}
                              className={`p-1.5 rounded-lg border border-theme-border bg-theme-base hover:bg-theme-border/60 transition-colors ${
                                amp.estado ? 'text-rose-600' : 'text-emerald-600'
                              }`}
                              title={amp.estado ? 'Desactivar' : 'Reactivar'}
                            >
                              <Power size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: COMPARATIVA INTERANUAL & GESTIONES */}
          {activeTab === 'COMPARATIVA' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl border border-theme-border bg-theme-surface shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-theme-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <History className="text-theme-primary" size={18} />
                    <h3 className="font-bold text-sm text-theme-main">Matriz de Comparación Interanual POA</h3>
                  </div>
                  <span className="text-xs text-theme-muted">
                    Analice la evolución de las operaciones entre gestiones
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-theme-muted mb-1.5">
                      1. Gestión Base (Histórica / Anterior)
                    </label>
                    <select
                      value={compGestionBase}
                      onChange={(e) => setCompGestionBase(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-theme-border bg-theme-base text-theme-main focus:outline-none focus:border-theme-primary"
                    >
                      {gestiones.map((g) => (
                        <option key={g.id} value={g.anio}>
                          Gestión {g.anio} ({g.estado_display})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-theme-muted mb-1.5">
                      2. Gestión Destino (Planificación / Formulación)
                    </label>
                    <select
                      value={compGestionDestino}
                      onChange={(e) => setCompGestionDestino(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-theme-border bg-theme-base text-theme-main focus:outline-none focus:border-theme-primary font-bold text-theme-primary"
                    >
                      {gestiones.map((g) => (
                        <option key={g.id} value={g.anio}>
                          Gestión {g.anio} ({g.estado_display})
                        </option>
                      ))}
                      {!gestiones.some((g) => g.anio === 2027) && (
                        <option value={2027}>Gestión 2027 (Próxima Formulación)</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-theme-muted mb-1.5">
                      3. Filtrar por Área Específica
                    </label>
                    <select
                      value={compAreaId}
                      onChange={(e) => setCompAreaId(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-theme-border bg-theme-base text-theme-main focus:outline-none focus:border-theme-primary"
                    >
                      <option value="ALL">Todas las Áreas</option>
                      {areas.map((a) => (
                        <option key={a.id} value={a.id}>
                          [{a.codigo}] {a.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl border border-theme-border bg-theme-base flex items-center justify-between">
                    <span className="font-bold text-xs text-theme-main uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar size={14} className="text-theme-primary" />
                      Operaciones en Gestión {compGestionBase} ({compOperacionesBase.length})
                    </span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-theme-surface border border-theme-border">
                      Base Histórica
                    </span>
                  </div>

                  <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                    {compOperacionesBase.map((op) => (
                      <div key={op.id} className="p-3.5 rounded-xl border border-theme-border bg-theme-surface space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-theme-primary text-[11px]">
                            {op.codigo}
                          </span>
                          <span className="text-[10px] text-theme-muted font-medium">
                            {op.area_nombre}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl border border-theme-border bg-theme-base flex items-center justify-between">
                    <span className="font-bold text-xs text-theme-primary uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles size={14} className="text-theme-primary" />
                      Operaciones en Gestión {compGestionDestino} ({compOperacionesDestino.length})
                    </span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-theme-primary/10 text-theme-primary border border-theme-primary/20">
                      Nueva Planificación
                    </span>
                  </div>

                  <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                    {compOperacionesDestino.length === 0 ? (
                      <div className="p-12 rounded-xl border border-dashed border-theme-border bg-theme-surface text-center text-theme-muted space-y-2">
                        <p className="text-xs font-semibold text-theme-main">Aún no hay operaciones formuladas en {compGestionDestino}</p>
                        <p className="text-[11px]">Utilice el botón "Replicar Base" para inicializar la formulación.</p>
                      </div>
                    ) : (
                      compOperacionesDestino.map((op) => (
                        <div key={op.id} className="p-3.5 rounded-xl border border-theme-border bg-theme-surface space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-theme-primary text-[11px]">
                              {op.codigo}
                            </span>
                            <span className="text-[10px] text-theme-muted font-medium">
                              {op.area_nombre}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: AMP (Crear / Editar) */}
      {/* ======================================================== */}
      {showAmpModal && canManageAmpOrAcp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-theme-surface rounded-2xl p-6 w-full max-w-lg border border-theme-border space-y-4 shadow-xl">
            {/* Cabecera con Código Autogenerado NO Modificable */}
            <div className="flex items-center justify-between border-b border-theme-border pb-3">
              <div className="flex items-center gap-2.5">
                <Compass size={20} className="text-theme-primary" />
                <div>
                  <h3 className="font-bold text-sm text-theme-main">
                    {editingAmp ? 'Editar Acción a Mediano Plazo' : 'Nueva Acción a Mediano Plazo (PEI)'}
                  </h3>
                  <span className="text-[11px] text-theme-muted">Plan Estratégico Quinquenal</span>
                </div>
              </div>

              {/* Badge de Código Autogenerado */}
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-theme-primary/10 text-theme-primary border border-theme-primary/20 shadow-sm">
                  {calculatedAmpCode}
                </span>
                <button
                  onClick={() => setShowAmpModal(false)}
                  className="p-1 rounded-lg text-theme-muted hover:text-theme-main hover:bg-theme-border/40"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveAMP} className="space-y-4 text-xs">
              {/* 1. Selección de Programa con Estilo Memorias */}
              <div className="relative">
                <label className="block font-bold uppercase tracking-wider text-theme-muted mb-1.5">
                  1. Programa Institucional *
                </label>
                <button
                  type="button"
                  onClick={() => toggleDropdown('modal_amp_prog')}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs rounded-xl border border-theme-border bg-theme-base text-theme-main hover:border-theme-primary/60 transition-colors text-left"
                >
                  {ampForm.programa ? (
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono font-bold text-theme-primary bg-theme-primary/10 px-1.5 py-0.5 rounded text-[11px]">
                        {programas.find((p) => String(p.id) === ampForm.programa)?.codigo}
                      </span>
                      <span className="truncate">{programas.find((p) => String(p.id) === ampForm.programa)?.nombre}</span>
                    </div>
                  ) : (
                    <span className="text-theme-muted">Seleccione Programa...</span>
                  )}
                  <ChevronDown size={14} className="text-theme-muted shrink-0 ml-1" />
                </button>

                {openDropdowns['modal_amp_prog'] && (
                  <div className="absolute top-full left-0 mt-1 w-full z-50 rounded-xl border border-theme-border bg-theme-surface p-1 shadow-xl max-h-52 overflow-y-auto">
                    {programas.map((p) => {
                      const isSel = String(p.id) === ampForm.programa;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setAmpForm({ ...ampForm, programa: String(p.id) });
                            closeAllDropdowns();
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                            isSel ? 'bg-theme-primary/10 text-theme-primary font-semibold' : 'text-theme-main hover:bg-theme-border/40'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-theme-base border border-theme-border text-[11px]">
                              {p.codigo}
                            </span>
                            <span>{p.nombre}</span>
                          </div>
                          {isSel && <Check size={14} className="text-theme-primary" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 2. Período Quinquenal */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-theme-muted mb-1.5">
                    Año Inicio
                  </label>
                  <input
                    type="number"
                    value={ampForm.periodo_inicio}
                    onChange={(e) => setAmpForm({ ...ampForm, periodo_inicio: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-theme-border bg-theme-base text-theme-main focus:outline-none focus:border-theme-primary font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider text-theme-muted mb-1.5">
                    Año Fin (5 Años)
                  </label>
                  <input
                    type="number"
                    value={ampForm.periodo_fin}
                    onChange={(e) => setAmpForm({ ...ampForm, periodo_fin: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-theme-border bg-theme-base text-theme-main focus:outline-none focus:border-theme-primary font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-theme-border/60">
                <button
                  type="button"
                  onClick={() => setShowAmpModal(false)}
                  className="px-4 py-2 rounded-xl border border-theme-border text-theme-muted hover:text-theme-main hover:bg-theme-border/40 text-xs font-semibold transition-colors"
                >
                  Cancelar (ESC)
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-theme-primary text-theme-primaryText text-xs font-semibold shadow-sm hover:opacity-90 transition-opacity"
                >
                  Guardar AMP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: ACP (Crear / Editar) */}
      {/* ======================================================== */}
      {showAcpModal && canManageAmpOrAcp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-theme-surface rounded-2xl p-6 w-full max-w-lg border border-theme-border space-y-4 shadow-xl">
            {/* Cabecera con Código Autogenerado NO Modificable */}
            <div className="flex items-center justify-between border-b border-theme-border pb-3">
              <div className="flex items-center gap-2.5">
                <Target size={20} className="text-theme-primary" />
                <div>
                  <h3 className="font-bold text-sm text-theme-main">
                    {editingAcp ? 'Editar Acción a Corto Plazo' : 'Nueva Acción a Corto Plazo (POA)'}
                  </h3>
                  <span className="text-[11px] text-theme-muted">Meta Anual Institucional</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-theme-primary/10 text-theme-primary border border-theme-primary/20 shadow-sm">
                  {calculatedAcpCode}
                </span>
                <button
                  onClick={() => setShowAcpModal(false)}
                  className="p-1 rounded-lg text-theme-muted hover:text-theme-main hover:bg-theme-border/40"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveACP} className="space-y-4 text-xs">
              {/* Paso 1: Selección de Programa General */}
              <div className="relative">
                <label className="block font-bold uppercase tracking-wider text-theme-muted mb-1.5">
                  1. Programa General *
                </label>
                <button
                  type="button"
                  onClick={() => toggleDropdown('modal_acp_prog')}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs rounded-xl border border-theme-border bg-theme-base text-theme-main hover:border-theme-primary/60 transition-colors text-left"
                >
                  {acpForm.programa ? (
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono font-bold text-theme-primary bg-theme-primary/10 px-1.5 py-0.5 rounded text-[11px]">
                        {programas.find((p) => String(p.id) === acpForm.programa)?.codigo}
                      </span>
                      <span className="truncate">{programas.find((p) => String(p.id) === acpForm.programa)?.nombre}</span>
                    </div>
                  ) : (
                    <span className="text-theme-muted">Seleccione Programa...</span>
                  )}
                  <ChevronDown size={14} className="text-theme-muted shrink-0 ml-1" />
                </button>

                {openDropdowns['modal_acp_prog'] && (
                  <div className="absolute top-full left-0 mt-1 w-full z-50 rounded-xl border border-theme-border bg-theme-surface p-1 shadow-xl max-h-52 overflow-y-auto">
                    {programas.map((p) => {
                      const isSel = String(p.id) === acpForm.programa;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            const newProg = String(p.id);
                            const matchingAmps = ampList.filter((a) => String(a.programa) === newProg && a.estado);
                            const newAmp = matchingAmps[0]?.id ? String(matchingAmps[0].id) : '';
                            setAcpForm({ ...acpForm, programa: newProg, accion_mediano_plazo: newAmp });
                            closeAllDropdowns();
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                            isSel ? 'bg-theme-primary/10 text-theme-primary font-semibold' : 'text-theme-main hover:bg-theme-border/40'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-theme-base border border-theme-border text-[11px]">
                              {p.codigo}
                            </span>
                            <span>{p.nombre}</span>
                          </div>
                          {isSel && <Check size={14} className="text-theme-primary" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Paso 2: Selección de AMP (Filtrada por Programa) */}
              <div className="relative">
                <label className="block font-bold uppercase tracking-wider text-theme-muted mb-1.5">
                  2. Acción a Mediano Plazo (AMP del Programa) *
                </label>
                <button
                  type="button"
                  onClick={() => toggleDropdown('modal_acp_amp')}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs rounded-xl border border-theme-border bg-theme-base text-theme-main hover:border-theme-primary/60 transition-colors text-left"
                >
                  {acpForm.accion_mediano_plazo ? (
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono font-bold text-theme-primary bg-theme-primary/10 px-1.5 py-0.5 rounded text-[11px]">
                        {ampList.find((a) => String(a.id) === acpForm.accion_mediano_plazo)?.codigo}
                      </span>
                      <span className="truncate">
                        {ampList.find((a) => String(a.id) === acpForm.accion_mediano_plazo)?.descripcion.substring(0, 50)}...
                      </span>
                    </div>
                  ) : (
                    <span className="text-theme-muted">
                      {availableAmpsForAcpForm.length === 0 ? 'No hay AMPs para este programa' : 'Seleccione AMP...'}
                    </span>
                  )}
                  <ChevronDown size={14} className="text-theme-muted shrink-0 ml-1" />
                </button>

                {openDropdowns['modal_acp_amp'] && (
                  <div className="absolute top-full left-0 mt-1 w-full z-50 rounded-xl border border-theme-border bg-theme-surface p-1 shadow-xl max-h-52 overflow-y-auto">
                    {availableAmpsForAcpForm.length === 0 ? (
                      <div className="p-4 text-center text-xs text-theme-muted">
                        No hay AMPs registradas en este programa.
                      </div>
                    ) : (
                      availableAmpsForAcpForm.map((a) => {
                        const isSel = String(a.id) === acpForm.accion_mediano_plazo;
                        return (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => {
                              setAcpForm({ ...acpForm, accion_mediano_plazo: String(a.id) });
                              closeAllDropdowns();
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                              isSel ? 'bg-theme-primary/10 text-theme-primary font-semibold' : 'text-theme-main hover:bg-theme-border/40'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate mr-2">
                              <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-theme-base border border-theme-border text-[11px] shrink-0">
                                {a.codigo}
                              </span>
                              <span className="truncate">{a.descripcion}</span>
                            </div>
                            {isSel && <Check size={14} className="text-theme-primary shrink-0" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Paso 3: Selección de Gestión */}
              <div className="relative">
                <label className="block font-bold uppercase tracking-wider text-theme-muted mb-1.5">
                  3. Gestión POA
                </label>
                <select
                  value={acpForm.gestion}
                  onChange={(e) => setAcpForm({ ...acpForm, gestion: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-theme-border bg-theme-base text-theme-main focus:outline-none focus:border-theme-primary font-semibold"
                >
                  <option value="">Gestión General / Vigente</option>
                  {gestiones.map((g) => (
                    <option key={g.id} value={g.id}>
                      Gestión {g.anio} ({g.estado_display})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-theme-border/60">
                <button
                  type="button"
                  onClick={() => setShowAcpModal(false)}
                  className="px-4 py-2 rounded-xl border border-theme-border text-theme-muted hover:text-theme-main hover:bg-theme-border/40 text-xs font-semibold transition-colors"
                >
                  Cancelar (ESC)
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-theme-primary text-theme-primaryText text-xs font-semibold shadow-sm hover:opacity-90 transition-opacity"
                >
                  Guardar ACP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: OPERACION (Crear / Editar con Estilo Memorias) */}
      {/* ======================================================== */}
      {showOpModal && canCreateOpOrTarea && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-theme-surface rounded-2xl p-6 w-full max-w-lg border border-theme-border space-y-4 shadow-xl">
            {/* Cabecera con Código Autogenerado NO Modificable */}
            <div className="flex items-center justify-between border-b border-theme-border pb-3">
              <div className="flex items-center gap-2.5">
                <FileCheck2 size={20} className="text-theme-primary" />
                <div>
                  <h3 className="font-bold text-sm text-theme-main">
                    {editingOp ? 'Editar Operación Institucional' : 'Nueva Operación por Área'}
                  </h3>
                  <span className="text-[11px] text-theme-muted">Asignación por Programa y Área</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-theme-primary/10 text-theme-primary border border-theme-primary/20 shadow-sm">
                  {calculatedOpCode}
                </span>
                <button
                  onClick={() => setShowOpModal(false)}
                  className="p-1 rounded-lg text-theme-muted hover:text-theme-main hover:bg-theme-border/40"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveOp} className="space-y-4 text-xs">
              {/* PASO 1: Selección de Programa General */}
              <div className="relative">
                <label className="block font-bold uppercase tracking-wider text-theme-muted mb-1.5">
                  1. Programa Institucional General *
                </label>
                <button
                  type="button"
                  onClick={() => toggleDropdown('modal_op_prog')}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs rounded-xl border border-theme-border bg-theme-base text-theme-main hover:border-theme-primary/60 transition-colors text-left"
                >
                  {opForm.programa ? (
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono font-bold text-theme-primary bg-theme-primary/10 px-1.5 py-0.5 rounded text-[11px]">
                        {programas.find((p) => String(p.id) === opForm.programa)?.codigo}
                      </span>
                      <span className="truncate">{programas.find((p) => String(p.id) === opForm.programa)?.nombre}</span>
                    </div>
                  ) : (
                    <span className="text-theme-muted">Seleccione Programa...</span>
                  )}
                  <ChevronDown size={14} className="text-theme-muted shrink-0 ml-1" />
                </button>

                {openDropdowns['modal_op_prog'] && (
                  <div className="absolute top-full left-0 mt-1 w-full z-50 rounded-xl border border-theme-border bg-theme-surface p-1 shadow-xl max-h-52 overflow-y-auto">
                    {programas.map((p) => {
                      const isSel = String(p.id) === opForm.programa;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            const newProg = String(p.id);
                            const acpsOfProg = acpList.filter((acp) => {
                              const progId = acp.programa_id || ampList.find((m) => m.id === acp.accion_mediano_plazo)?.programa;
                              return String(progId) === newProg && acp.estado;
                            });
                            const areasOfProg = areas.filter((a) => String(a.programa) === newProg && a.estado);

                            setOpForm({
                              ...opForm,
                              programa: newProg,
                              accion_corto_plazo: acpsOfProg[0]?.id ? String(acpsOfProg[0].id) : '',
                              area: areasOfProg[0]?.id ? String(areasOfProg[0].id) : '',
                            });
                            closeAllDropdowns();
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                            isSel ? 'bg-theme-primary/10 text-theme-primary font-semibold' : 'text-theme-main hover:bg-theme-border/40'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-theme-base border border-theme-border text-[11px]">
                              {p.codigo}
                            </span>
                            <span>{p.nombre}</span>
                          </div>
                          {isSel && <Check size={14} className="text-theme-primary" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* PASO 2: Selección de ACP (Filtrada estrictamente por el Programa) */}
              <div className="relative">
                <label className="block font-bold uppercase tracking-wider text-theme-muted mb-1.5">
                  2. Acción a Corto Plazo (ACP del Programa) *
                </label>
                <button
                  type="button"
                  onClick={() => toggleDropdown('modal_op_acp')}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs rounded-xl border border-theme-border bg-theme-base text-theme-main hover:border-theme-primary/60 transition-colors text-left"
                >
                  {opForm.accion_corto_plazo ? (
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono font-bold text-theme-primary bg-theme-primary/10 px-1.5 py-0.5 rounded text-[11px]">
                        {acpList.find((a) => String(a.id) === opForm.accion_corto_plazo)?.codigo}
                      </span>
                      <span className="truncate">
                        {acpList.find((a) => String(a.id) === opForm.accion_corto_plazo)?.descripcion.substring(0, 50)}...
                      </span>
                    </div>
                  ) : (
                    <span className="text-theme-muted">
                      {availableAcpsForOpForm.length === 0 ? 'No hay ACPs para este programa' : 'Seleccione ACP...'}
                    </span>
                  )}
                  <ChevronDown size={14} className="text-theme-muted shrink-0 ml-1" />
                </button>

                {openDropdowns['modal_op_acp'] && (
                  <div className="absolute top-full left-0 mt-1 w-full z-50 rounded-xl border border-theme-border bg-theme-surface p-1 shadow-xl max-h-52 overflow-y-auto">
                    {availableAcpsForOpForm.length === 0 ? (
                      <div className="p-4 text-center text-xs text-theme-muted">
                        No hay ACPs registradas para este programa.
                      </div>
                    ) : (
                      availableAcpsForOpForm.map((a) => {
                        const isSel = String(a.id) === opForm.accion_corto_plazo;
                        return (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => {
                              setOpForm({ ...opForm, accion_corto_plazo: String(a.id) });
                              closeAllDropdowns();
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                              isSel ? 'bg-theme-primary/10 text-theme-primary font-semibold' : 'text-theme-main hover:bg-theme-border/40'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate mr-2">
                              <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-theme-base border border-theme-border text-[11px] shrink-0">
                                {a.codigo}
                              </span>
                              <span className="truncate">{a.descripcion}</span>
                            </div>
                            {isSel && <Check size={14} className="text-theme-primary shrink-0" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* PASO 3: Selección de Área Responsable (Filtrada por el Programa) */}
              <div className="relative">
                <label className="block font-bold uppercase tracking-wider text-theme-muted mb-1.5">
                  3. Área Responsable (del Programa) *
                </label>
                <button
                  type="button"
                  disabled={!isAprobador && !isPlanificador}
                  onClick={() => toggleDropdown('modal_op_area')}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs rounded-xl border border-theme-border bg-theme-base text-theme-main hover:border-theme-primary/60 transition-colors text-left disabled:opacity-75"
                >
                  {opForm.area ? (
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono font-bold text-theme-primary bg-theme-primary/10 px-1.5 py-0.5 rounded text-[11px]">
                        [{areas.find((a) => String(a.id) === opForm.area)?.codigo}]
                      </span>
                      <span className="truncate">{areas.find((a) => String(a.id) === opForm.area)?.nombre}</span>
                    </div>
                  ) : (
                    <span className="text-theme-muted">
                      {availableAreasForOpForm.length === 0 ? 'No hay áreas para este programa' : 'Seleccione Área...'}
                    </span>
                  )}
                  <ChevronDown size={14} className="text-theme-muted shrink-0 ml-1" />
                </button>

                {openDropdowns['modal_op_area'] && (isAprobador || isPlanificador) && (
                  <div className="absolute top-full left-0 mt-1 w-full z-50 rounded-xl border border-theme-border bg-theme-surface p-1 shadow-xl max-h-52 overflow-y-auto">
                    {availableAreasForOpForm.length === 0 ? (
                      <div className="p-4 text-center text-xs text-theme-muted">
                        No hay áreas asignadas a este programa.
                      </div>
                    ) : (
                      availableAreasForOpForm.map((ar) => {
                        const isSel = String(ar.id) === opForm.area;
                        return (
                          <button
                            key={ar.id}
                            type="button"
                            onClick={() => {
                              setOpForm({ ...opForm, area: String(ar.id) });
                              closeAllDropdowns();
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                              isSel ? 'bg-theme-primary/10 text-theme-primary font-semibold' : 'text-theme-main hover:bg-theme-border/40'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-theme-base border border-theme-border text-[11px]">
                                [{ar.codigo}]
                              </span>
                              <span>{ar.nombre}</span>
                            </div>
                            {isSel && <Check size={14} className="text-theme-primary" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-theme-border/60">
                <button
                  type="button"
                  onClick={() => setShowOpModal(false)}
                  className="px-4 py-2 rounded-xl border border-theme-border text-theme-muted hover:text-theme-main hover:bg-theme-border/40 text-xs font-semibold transition-colors"
                >
                  Cancelar (ESC)
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-theme-primary text-theme-primaryText text-xs font-semibold shadow-sm hover:opacity-90 transition-opacity"
                >
                  Guardar Operación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
