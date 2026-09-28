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
  const rolName = user?.rol_nombre?.toUpperCase() || '';
  const isAprobador = user?.is_superuser || rolName === 'APROBADOR' || rolName === 'ADMINISTRADOR';
  const isGerente = rolName === 'GERENTE';
  const isElaborador = rolName === 'ELABORADOR';
  const isPlanificador = rolName === 'PLANIFICADOR';

  const canCreateOp = isAprobador || isPlanificador || isGerente || isElaborador;
  const canEditOrToggleOp = isAprobador || isPlanificador || isGerente;
  const canManageAmpOrAcp = isAprobador || isPlanificador;

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
  const [filterGestion, setFilterGestion] = useState<string>('ALL');
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
    return ampList.filter((amp) => String(amp.programa) === String(acpForm.programa) && amp.estado);
  }, [acpForm.programa, ampList]);

  const availableAcpsForOpForm = useMemo(() => {
    if (!opForm.programa) return [];
    return acpList.filter((acp) => {
      const progId = acp.programa_id || ampList.find((m) => m.id === acp.accion_mediano_plazo)?.programa;
      return String(progId) === String(opForm.programa) && acp.estado;
    });
  }, [opForm.programa, acpList, ampList]);

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
        (a.descripcion && a.descripcion.toLowerCase().includes(q)) ||
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
        (m.descripcion && m.descripcion.toLowerCase().includes(q)) ||
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
            await planificacionApi.createOperacion({
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

  return {
    // Roles & Permissions
    user,
    isAprobador,
    isGerente,
    isElaborador,
    isPlanificador,
    canCreateOp,
    canEditOrToggleOp,
    canManageAmpOrAcp,
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
