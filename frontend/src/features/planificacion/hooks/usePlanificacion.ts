import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { planificacionApi } from '../api/planificacionApi';
import type {
  AccionMedianoPlazo,
  AccionCortoPlazo,
  Operacion,
  PlanificacionTab,
  AmpFormData,
  AcpFormData,
  OpFormData,
} from '../types/planificacion.types';
import type { Area, Programa } from '../../../types/organizacional';
import type { Gestion } from '../../../services/presupuestoService';
import alertService from '../../../utils/alerts';

export function usePlanificacion() {
  const { user } = useAuth();
  const rolClean = (user?.rol_nombre || '')
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const isSuperadmin = Boolean(user?.is_superuser) || rolClean.includes('ADMIN');
  const isPlanificador = rolClean.includes('PLANIFIC');
  const isGerente = rolClean.includes('GERENT');
  const isElaborador = rolClean.includes('ELABORAD');
  const isPresupuestos = rolClean.includes('PRESUPUEST') || rolClean.includes('APROBAD');
  const isAprobador = isSuperadmin || isPresupuestos;

  // Únicamente superadmin y planificación pueden crear o modificar ACP y AMP
  const canManageAmpOrAcp = isSuperadmin || isPlanificador;

  const canCreateOp = isSuperadmin || isPlanificador || isGerente || isElaborador;
  const canEditOrToggleOp = isSuperadmin || isPlanificador || isGerente;
  const canReplicate = isSuperadmin || isPlanificador || isGerente;

  const userAreaId = user?.area_id;

  // Active Tab
  const [activeTab, setActiveTab] = useState<PlanificacionTab>('OPERACIONES');

  // Master Lists
  const [ampList, setAmpList] = useState<AccionMedianoPlazo[]>([]);
  const [acpList, setAcpList] = useState<AccionCortoPlazo[]>([]);
  const [operacionesList, setOperacionesList] = useState<Operacion[]>([]);
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [gestiones, setGestiones] = useState<Gestion[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGestion, setFilterGestion] = useState<string>(() => String(new Date().getFullYear()));
  const [filterPrograma, setFilterPrograma] = useState<string>('ALL');
  const [filterArea, setFilterArea] = useState<string>('ALL');

  // Modal States - Operaciones
  const [showOpModal, setShowOpModal] = useState(false);
  const [editingOp, setEditingOp] = useState<Operacion | null>(null);
  const [showOpDetalleModal, setShowOpDetalleModal] = useState(false);
  const [viewingOp, setViewingOp] = useState<Operacion | null>(null);

  // Modal States - ACP
  const [showAcpModal, setShowAcpModal] = useState(false);
  const [editingAcp, setEditingAcp] = useState<AccionCortoPlazo | null>(null);
  const [showAcpDetalleModal, setShowAcpDetalleModal] = useState(false);
  const [viewingAcp, setViewingAcp] = useState<AccionCortoPlazo | null>(null);

  // Modal States - AMP
  const [showAmpModal, setShowAmpModal] = useState(false);
  const [editingAmp, setEditingAmp] = useState<AccionMedianoPlazo | null>(null);
  const [showAmpDetalleModal, setShowAmpDetalleModal] = useState(false);
  const [viewingAmp, setViewingAmp] = useState<AccionMedianoPlazo | null>(null);

  // Form States
  const [ampForm, setAmpForm] = useState<AmpFormData>({
    programa: '',
    periodo_inicio: 2026,
    periodo_fin: 2030,
    descripcion: '',
  });

  const [acpForm, setAcpForm] = useState<AcpFormData>({
    programa: '',
    accion_mediano_plazo: '',
    gestion: '',
    descripcion: '',
  });

  const [opForm, setOpForm] = useState<OpFormData>({
    programa: '',
    accion_corto_plazo: '',
    area: '',
    descripcion: '',
    es_contratacion: true,
  });

  // Interannual Comparison States
  const [compGestionBase, setCompGestionBase] = useState<number>(2026);
  const [compGestionDestino, setCompGestionDestino] = useState<number>(2027);
  const [compAreaId, setCompAreaId] = useState<string>('ALL');
  const [replicating, setReplicating] = useState(false);

  // Fetch all planning data
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [amps, acps, ops, progs, ars, gests] = await Promise.all([
        planificacionApi.getAmps(),
        planificacionApi.getAcps(),
        planificacionApi.getOperaciones(),
        planificacionApi.getProgramas(),
        planificacionApi.getAreas(),
        planificacionApi.getGestiones(),
      ]);

      setAmpList(amps || []);
      setAcpList(acps || []);
      setOperacionesList(ops || []);
      setProgramas(progs || []);
      setAreas(ars || []);
      setGestiones(gests || []);

      const currentYear = new Date().getFullYear();
      const hasCurrentYear = (gests || []).some((g) => g.anio === currentYear);
      setFilterGestion((prev) => {
        if (prev && prev !== 'ALL' && (gests || []).some((g) => String(g.anio) === prev || String(g.id) === prev)) {
          return prev;
        }
        if (hasCurrentYear) {
          return String(currentYear);
        }
        return gests && gests.length > 0 ? String(gests[0].anio) : 'ALL';
      });

      if (userAreaId && !isAprobador && !isPlanificador) {
        setFilterArea(String(userAreaId));
      }
    } catch (err) {
      console.error('Error cargando planificación:', err);
      alertService.error('Error de carga', 'No se pudieron obtener los datos de Planificación Estratégica.');
    } finally {
      setLoading(false);
    }
  }, [userAreaId, isAprobador, isPlanificador]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ==========================================
  // AUTOINCREMENTABLE CODE GENERATORS (READ-ONLY)
  // ==========================================

  const calculatedAmpCode = useMemo(() => {
    if (editingAmp) return editingAmp.codigo.replace(/-\d+$/, '');
    if (!ampForm.programa) return 'AMP-P?';
    const prog = programas.find((p) => String(p.id) === String(ampForm.programa));
    const rawCode = prog?.codigo || '1';
    const cleanNum = rawCode.replace(/[^0-9]/g, '') || rawCode;
    return `AMP-P${cleanNum}`;
  }, [editingAmp, ampForm.programa, programas]);

  const calculatedAcpCode = useMemo(() => {
    if (editingAcp) return editingAcp.codigo;
    if (!acpForm.programa && !acpForm.accion_mediano_plazo) return 'ACP-P?-2026';
    let progCode = '1';
    if (acpForm.programa) {
      const prog = programas.find((p) => String(p.id) === String(acpForm.programa));
      progCode = prog?.codigo || '1';
    } else if (acpForm.accion_mediano_plazo) {
      const amp = ampList.find((a) => String(a.id) === String(acpForm.accion_mediano_plazo));
      progCode = amp?.programa_codigo || '1';
    }
    const cleanNum = progCode.replace(/[^0-9]/g, '') || progCode;

    let anioGestion = '2026';
    if (acpForm.gestion) {
      const gObj = gestiones.find((g) => String(g.id) === String(acpForm.gestion));
      if (gObj) anioGestion = String(gObj.anio);
    } else if (filterGestion && filterGestion !== 'ALL') {
      anioGestion = filterGestion;
    }
    return `ACP-P${cleanNum}-${anioGestion}`;
  }, [editingAcp, acpForm.programa, acpForm.accion_mediano_plazo, acpForm.gestion, filterGestion, programas, ampList, gestiones]);

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

  const availableAmpsForAcpForm = useMemo(() => {
    if (!acpForm.programa) return [];
    const selectedGestionObj = gestiones.find(
      (g) => String(g.anio) === filterGestion || String(g.id) === filterGestion || (acpForm.gestion && String(g.id) === String(acpForm.gestion))
    );
    const targetAnio = selectedGestionObj ? selectedGestionObj.anio : (filterGestion !== 'ALL' ? Number(filterGestion) : null);

    return ampList.filter((amp) => {
      const matchProg = String(amp.programa) === String(acpForm.programa) && amp.estado;
      if (!matchProg) return false;
      if (targetAnio !== null && !isNaN(targetAnio)) {
        return amp.periodo_inicio <= targetAnio && amp.periodo_fin >= targetAnio;
      }
      return true;
    });
  }, [acpForm.programa, ampList, filterGestion, gestiones, acpForm.gestion]);

  const availableAcpsForOpForm = useMemo(() => {
    if (!opForm.programa) return [];
    const selectedGestionObj = gestiones.find(
      (g) => String(g.anio) === filterGestion || String(g.id) === filterGestion
    );
    const targetAnio = selectedGestionObj ? selectedGestionObj.anio : (filterGestion !== 'ALL' ? Number(filterGestion) : null);
    const targetId = selectedGestionObj ? selectedGestionObj.id : null;

    return acpList.filter((acp) => {
      const progId = acp.programa_id || ampList.find((m) => m.id === acp.accion_mediano_plazo)?.programa;
      const matchProg = String(progId) === String(opForm.programa) && acp.estado;
      if (!matchProg) return false;

      if (filterGestion === 'ALL') return true;
      const matchGestion =
        (Boolean(targetAnio) && acp.gestion_anio === targetAnio) ||
        (Boolean(targetId) && acp.gestion === targetId) ||
        String(acp.gestion) === filterGestion ||
        String(acp.gestion_anio) === filterGestion;
      return matchGestion;
    });
  }, [opForm.programa, acpList, ampList, filterGestion, gestiones]);

  const availableAreasForOpForm = useMemo(() => {
    if (!opForm.programa) return [];
    return areas.filter((area) => String(area.programa) === String(opForm.programa) && area.estado);
  }, [opForm.programa, areas]);

  // ==========================================
  // FILTERED LISTS
  // ==========================================

  const filteredOperaciones = useMemo(() => {
    return operacionesList.filter((op) => {
      const q = searchTerm.toLowerCase();
      const matchText =
        !searchTerm ||
        op.codigo.toLowerCase().includes(q) ||
        (op.descripcion && op.descripcion.toLowerCase().includes(q)) ||
        (op.area_nombre && op.area_nombre.toLowerCase().includes(q)) ||
        (op.acp_codigo && op.acp_codigo.toLowerCase().includes(q));

      const selectedGestionObj = gestiones.find(
        (g) => String(g.anio) === filterGestion || String(g.id) === filterGestion
      );
      const targetAnio = selectedGestionObj ? selectedGestionObj.anio : Number(filterGestion);
      const targetId = selectedGestionObj ? selectedGestionObj.id : null;

      const matchGestion =
        filterGestion === 'ALL' ||
        (Boolean(targetAnio) && op.gestion_anio === targetAnio) ||
        (Boolean(targetId) && op.gestion_id === targetId) ||
        String(op.gestion_id) === filterGestion ||
        String(op.gestion_anio) === filterGestion;

      const matchPrograma =
        filterPrograma === 'ALL' ||
        String(op.area_programa_id) === filterPrograma ||
        String(op.acp_programa_id) === filterPrograma;

      const matchArea = filterArea === 'ALL' || String(op.area) === filterArea;

      return matchText && matchGestion && matchPrograma && matchArea;
    });
  }, [operacionesList, searchTerm, filterGestion, filterPrograma, filterArea, gestiones]);

  const filteredAcps = useMemo(() => {
    return acpList.filter((a) => {
      const q = searchTerm.toLowerCase();
      const matchText =
        !searchTerm ||
        a.codigo.toLowerCase().includes(q) ||
        (a.descripcion && a.descripcion.toLowerCase().includes(q)) ||
        (a.amp_codigo && a.amp_codigo.toLowerCase().includes(q));

      const selectedGestionObj = gestiones.find(
        (g) => String(g.anio) === filterGestion || String(g.id) === filterGestion
      );
      const targetAnio = selectedGestionObj ? selectedGestionObj.anio : Number(filterGestion);
      const targetId = selectedGestionObj ? selectedGestionObj.id : null;

      const matchGestion =
        filterGestion === 'ALL' ||
        (Boolean(targetAnio) && a.gestion_anio === targetAnio) ||
        (Boolean(targetId) && a.gestion === targetId) ||
        String(a.gestion) === filterGestion ||
        String(a.gestion_anio) === filterGestion;

      const matchPrograma =
        filterPrograma === 'ALL' ||
        String(a.programa_id) === filterPrograma;

      return matchText && matchGestion && matchPrograma;
    });
  }, [acpList, searchTerm, filterGestion, filterPrograma, gestiones]);

  const filteredAmps = useMemo(() => {
    return ampList.filter((m) => {
      const q = searchTerm.toLowerCase();
      const matchText =
        !searchTerm ||
        m.codigo.toLowerCase().includes(q) ||
        (m.descripcion && m.descripcion.toLowerCase().includes(q)) ||
        (m.programa_codigo && m.programa_codigo.toLowerCase().includes(q)) ||
        (m.programa_nombre && m.programa_nombre.toLowerCase().includes(q));

      const matchPrograma = filterPrograma === 'ALL' || String(m.programa) === filterPrograma;

      const selectedGestionObj = gestiones.find(
        (g) => String(g.anio) === filterGestion || String(g.id) === filterGestion
      );
      const targetAnio = selectedGestionObj ? selectedGestionObj.anio : (filterGestion !== 'ALL' ? Number(filterGestion) : null);

      const matchGestion =
        filterGestion === 'ALL' ||
        (targetAnio !== null && !isNaN(targetAnio) && m.periodo_inicio <= targetAnio && m.periodo_fin >= targetAnio);

      return matchText && matchPrograma && matchGestion;
    });
  }, [ampList, searchTerm, filterPrograma, filterGestion, gestiones]);

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

  // ==========================================
  // HANDLERS: OPERACIONES
  // ==========================================

  const handleOpenCreateOp = () => {
    if (!canCreateOp) return;

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
      descripcion: '',
      es_contratacion: true,
    });
    setShowOpModal(true);
  };

  const handleOpenEditOp = (op: Operacion) => {
    if (!canEditOrToggleOp) return;
    const progId = op.area_programa_id || op.acp_programa_id || areas.find((a) => a.id === op.area)?.programa;
    setEditingOp(op);
    setOpForm({
      programa: progId ? String(progId) : '',
      accion_corto_plazo: String(op.accion_corto_plazo),
      area: String(op.area),
      descripcion: op.descripcion || '',
      es_contratacion: op.es_contratacion ?? true,
    });
    setShowOpDetalleModal(false);
    setShowOpModal(true);
  };

  const handleOpenViewOp = (op: Operacion) => {
    setViewingOp(op);
    setShowOpDetalleModal(true);
  };

  const handleSaveOp = async (formData: OpFormData) => {
    if (!formData.programa) {
      alertService.error('Campo requerido', 'Debe seleccionar un Programa Institucional.');
      return;
    }
    if (!formData.accion_corto_plazo) {
      alertService.error('Campo requerido', 'Debe seleccionar una Acción a Corto Plazo (ACP).');
      return;
    }
    if (!formData.area) {
      alertService.error('Campo requerido', 'Debe seleccionar el Área Responsable.');
      return;
    }

    const selectedAreaObj = areas.find((a) => String(a.id) === String(formData.area));
    const selectedAcpObj = acpList.find((a) => String(a.id) === String(formData.accion_corto_plazo));
    const autoDesc = formData.descripcion?.trim()
      ? formData.descripcion.trim()
      : editingOp?.descripcion ||
        `OPERACIÓN ${calculatedOpCode} - ${selectedAreaObj?.nombre || 'ÁREA'} (${selectedAcpObj?.codigo || 'POA'})`;

    try {
      const selectedAreaId = isAprobador || isPlanificador ? Number(formData.area) : Number(userAreaId || formData.area);
      if (editingOp) {
        if (!canEditOrToggleOp) return;
        await planificacionApi.updateOperacion(editingOp.id, {
          accion_corto_plazo: Number(formData.accion_corto_plazo),
          area: selectedAreaId,
          codigo: editingOp.codigo,
          descripcion: autoDesc,
          es_contratacion: formData.es_contratacion ?? true,
        });
        alertService.success('Operación Actualizada', 'Los cambios en la Operación fueron guardados.');
      } else {
        if (!canCreateOp) return;
        await planificacionApi.createOperacion({
          accion_corto_plazo: Number(formData.accion_corto_plazo),
          area: selectedAreaId,
          codigo: calculatedOpCode,
          descripcion: autoDesc,
          es_contratacion: formData.es_contratacion ?? true,
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
    if (!canEditOrToggleOp) return;
    const confirm = await alertService.confirm({
      title: op.estado ? '¿Desactivar Operación?' : '¿Reactivar Operación?',
      text: op.estado ? `La Operación ${op.codigo} quedará inactiva en el catálogo.` : `La Operación ${op.codigo} volverá a estar activa.`,
      isDanger: op.estado,
    });
    if (!confirm) return;

    try {
      await planificacionApi.toggleEstadoOperacion(op.id);
      alertService.success('Estado Actualizado', `La Operación ${op.codigo} fue ${op.estado ? 'desactivada' : 'reactivada'}.`);
      fetchAll();
    } catch (err) {
      alertService.error('Error', 'No se pudo cambiar el estado de la Operación.');
    }
  };

  // ==========================================
  // HANDLERS: ACP (POA)
  // ==========================================

  const handleOpenCreateAcp = () => {
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
      descripcion: '',
    });
    setShowAcpModal(true);
  };

  const handleOpenEditAcp = (acp: AccionCortoPlazo) => {
    if (!canManageAmpOrAcp) return;
    const progId = acp.programa_id || ampList.find((m) => m.id === acp.accion_mediano_plazo)?.programa;
    setEditingAcp(acp);
    setAcpForm({
      programa: progId ? String(progId) : '',
      accion_mediano_plazo: String(acp.accion_mediano_plazo),
      gestion: acp.gestion ? String(acp.gestion) : '',
      descripcion: acp.descripcion || '',
    });
    setShowAcpDetalleModal(false);
    setShowAcpModal(true);
  };

  const handleOpenViewAcp = (acp: AccionCortoPlazo) => {
    setViewingAcp(acp);
    setShowAcpDetalleModal(true);
  };

  const handleSaveAcp = async (formData: AcpFormData) => {
    if (!canManageAmpOrAcp) return;
    if (!formData.accion_mediano_plazo) {
      alertService.error('Campo requerido', 'Debe seleccionar una Acción a Mediano Plazo (AMP).');
      return;
    }
    const ampObj = ampList.find((a) => String(a.id) === String(formData.accion_mediano_plazo));
    const autoDesc = formData.descripcion?.trim()
      ? formData.descripcion.trim()
      : editingAcp?.descripcion || `OBJETIVO POA ${calculatedAcpCode} - ${ampObj?.codigo || 'AMP'}`;

    try {
      if (editingAcp) {
        await planificacionApi.updateAcp(editingAcp.id, {
          accion_mediano_plazo: Number(formData.accion_mediano_plazo),
          gestion: formData.gestion ? Number(formData.gestion) : undefined,
          codigo: editingAcp.codigo,
          descripcion: autoDesc,
        });
        alertService.success('ACP Actualizada', 'Los cambios en la Acción a Corto Plazo fueron guardados.');
      } else {
        await planificacionApi.createAcp({
          accion_mediano_plazo: Number(formData.accion_mediano_plazo),
          gestion: formData.gestion ? Number(formData.gestion) : undefined,
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

  const handleToggleAcp = async (acp: AccionCortoPlazo) => {
    if (!canManageAmpOrAcp) return;
    const confirm = await alertService.confirm({
      title: acp.estado ? '¿Desactivar ACP?' : '¿Reactivar ACP?',
      text: acp.estado ? `La ACP ${acp.codigo} quedará inactiva.` : `La ACP ${acp.codigo} volverá a estar activa.`,
      isDanger: acp.estado,
    });
    if (!confirm) return;

    try {
      await planificacionApi.toggleEstadoAcp(acp.id);
      alertService.success('Estado Actualizado', `La ACP ${acp.codigo} fue ${acp.estado ? 'desactivada' : 'reactivada'}.`);
      fetchAll();
    } catch (err) {
      alertService.error('Error', 'No se pudo cambiar el estado de la ACP.');
    }
  };

  // ==========================================
  // HANDLERS: AMP (PEI)
  // ==========================================

  const handleOpenCreateAmp = () => {
    if (!canManageAmpOrAcp) return;
    const defaultProg = programas[0]?.id ? String(programas[0].id) : '';
    setEditingAmp(null);
    setAmpForm({
      programa: defaultProg,
      periodo_inicio: 2026,
      periodo_fin: 2030,
      descripcion: '',
    });
    setShowAmpModal(true);
  };

  const handleOpenEditAmp = (amp: AccionMedianoPlazo) => {
    if (!canManageAmpOrAcp) return;
    setEditingAmp(amp);
    setAmpForm({
      programa: String(amp.programa),
      periodo_inicio: amp.periodo_inicio,
      periodo_fin: amp.periodo_fin,
      descripcion: amp.descripcion || '',
    });
    setShowAmpDetalleModal(false);
    setShowAmpModal(true);
  };

  const handleOpenViewAmp = (amp: AccionMedianoPlazo) => {
    setViewingAmp(amp);
    setShowAmpDetalleModal(true);
  };

  const handleSaveAmp = async (formData: AmpFormData) => {
    if (!canManageAmpOrAcp) return;
    if (!formData.programa) {
      alertService.error('Campo requerido', 'Debe seleccionar un Programa Institucional.');
      return;
    }
    const progObj = programas.find((p) => String(p.id) === String(formData.programa));
    const autoDesc = formData.descripcion?.trim()
      ? formData.descripcion.trim()
      : editingAmp?.descripcion ||
        `OBJETIVO ESTRATÉGICO PEI ${calculatedAmpCode} - ${progObj?.nombre || 'PROGRAMA'}`;

    try {
      if (editingAmp) {
        await planificacionApi.updateAmp(editingAmp.id, {
          programa: Number(formData.programa),
          codigo: editingAmp.codigo,
          descripcion: autoDesc,
          periodo_inicio: Number(formData.periodo_inicio),
          periodo_fin: Number(formData.periodo_fin),
        });
        alertService.success('AMP Actualizada', 'Los cambios en la Acción a Mediano Plazo fueron guardados.');
      } else {
        await planificacionApi.createAmp({
          programa: Number(formData.programa),
          codigo: calculatedAmpCode,
          descripcion: autoDesc,
          periodo_inicio: Number(formData.periodo_inicio),
          periodo_fin: Number(formData.periodo_fin),
        });
        alertService.success('AMP Creada', 'Acción a Mediano Plazo registrada correctamente.');
      }
      setShowAmpModal(false);
      fetchAll();
    } catch (err: any) {
      alertService.error('Error', err?.response?.data?.detail || err?.response?.data?.non_field_errors?.[0] || 'No se pudo guardar la AMP.');
    }
  };

  const handleToggleAmp = async (amp: AccionMedianoPlazo) => {
    if (!canManageAmpOrAcp) return;
    const confirm = await alertService.confirm({
      title: amp.estado ? '¿Desactivar AMP?' : '¿Reactivar AMP?',
      text: amp.estado ? `La AMP ${amp.codigo} quedará inactiva.` : `La AMP ${amp.codigo} volverá a estar activa.`,
      isDanger: amp.estado,
    });
    if (!confirm) return;

    try {
      await planificacionApi.toggleEstadoAmp(amp.id);
      alertService.success('Estado Actualizado', `La AMP ${amp.codigo} fue ${amp.estado ? 'desactivada' : 'reactivada'}.`);
      fetchAll();
    } catch (err) {
      alertService.error('Error', 'No se pudo cambiar el estado de la AMP.');
    }
  };

  // ==========================================
  // HANDLER: REPLICAR OPERACIONES A NUEVA GESTIÓN
  // ==========================================

  const handleReplicarOperaciones = async () => {
    if (!canReplicate) return;
    const effectiveAreaId = (isGerente && !isSuperadmin && !isPlanificador && userAreaId)
      ? String(userAreaId)
      : compAreaId;

    const confirm = await alertService.confirm({
      title: `¿Replicar Operaciones de Gestión ${compGestionBase} a ${compGestionDestino}?`,
      text: `Se duplicarán las operaciones del año ${compGestionBase} a la gestión ${compGestionDestino} vinculándolas a la nueva formulación POA.`,
      isDanger: false,
    });
    if (!confirm) return;

    setReplicating(true);
    try {
      const res = await planificacionApi.duplicarGestionOperaciones({
        gestion_base: compGestionBase,
        gestion_destino: compGestionDestino,
        area_id: effectiveAreaId,
      });

      alertService.success(
        'Replicación Completada',
        res.message || `Se han formulado ${res.creadas} operaciones en la Gestión ${compGestionDestino}.`
      );
      if (res.errores && res.errores.length > 0) {
        alertService.info('Aviso de Planificación', res.errores.join('\n'));
      }
      fetchAll();
    } catch (err: any) {
      console.error('Error al replicar operaciones:', err);
      const errMsg = err?.response?.data?.error || err?.response?.data?.detail || 'No se pudo completar la replicación de operaciones.';
      alertService.error('Aviso de Planificación', errMsg);
    } finally {
      setReplicating(false);
    }
  };

  return {
    // Roles & Permissions
    user,
    isSuperadmin,
    isAprobador: isSuperadmin || isPresupuestos,
    isPresupuestos,
    isGerente,
    isElaborador,
    isPlanificador,
    canCreateOp,
    canEditOrToggleOp,
    canManageAmpOrAcp,
    canReplicate,
    userAreaId,

    // Tabs & State
    activeTab,
    setActiveTab,
    loading,
    fetchAll,

    // Filter States
    searchTerm,
    setSearchTerm,
    filterGestion,
    setFilterGestion,
    filterPrograma,
    setFilterPrograma,
    filterArea,
    setFilterArea,

    // Data Lists
    programas,
    areas,
    gestiones,
    ampList,
    acpList,
    operacionesList,
    filteredOperaciones,
    filteredAcps,
    filteredAmps,

    // Modals: Operaciones
    showOpModal,
    setShowOpModal,
    editingOp,
    showOpDetalleModal,
    setShowOpDetalleModal,
    viewingOp,
    opForm,
    setOpForm,
    calculatedOpCode,
    availableAcpsForOpForm,
    availableAreasForOpForm,
    handleOpenCreateOp,
    handleOpenEditOp,
    handleOpenViewOp,
    handleSaveOp,
    handleToggleOp,

    // Modals: ACP
    showAcpModal,
    setShowAcpModal,
    editingAcp,
    showAcpDetalleModal,
    setShowAcpDetalleModal,
    viewingAcp,
    acpForm,
    setAcpForm,
    calculatedAcpCode,
    availableAmpsForAcpForm,
    handleOpenCreateAcp,
    handleOpenEditAcp,
    handleOpenViewAcp,
    handleSaveAcp,
    handleToggleAcp,

    // Modals: AMP
    showAmpModal,
    setShowAmpModal,
    editingAmp,
    showAmpDetalleModal,
    setShowAmpDetalleModal,
    viewingAmp,
    ampForm,
    setAmpForm,
    calculatedAmpCode,
    handleOpenCreateAmp,
    handleOpenEditAmp,
    handleOpenViewAmp,
    handleSaveAmp,
    handleToggleAmp,

    // Comparativa
    compGestionBase,
    setCompGestionBase,
    compGestionDestino,
    setCompGestionDestino,
    compAreaId,
    setCompAreaId,
    replicating,
    compOperacionesBase,
    compOperacionesDestino,
    handleReplicarOperaciones,
  };
}
