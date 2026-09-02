import { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Printer,
  Edit3,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Building2,
  Calendar,
  Layers,
  Sparkles,
  Lock,
  Send,
  MessageSquare,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  Gestion,
  Area,
  getGestiones,
  getAreas,
} from '../../services/presupuestoService';
import { planificacionService } from '../../services/planificacionService';
import { Operacion } from '../../types/planificacion';
import { CertificacionPOA, CertificacionFormData } from '../../types/certificacion';
import { certificacionService } from '../../services/certificacionService';

export default function CertificacionesPage() {
  const { user } = useAuth();
  const rolName = user?.rol_nombre?.toUpperCase() || '';

  // ── Roles y Permisos ──────────────────────────────────────────────────────────
  const isSuperAdmin = Boolean(user?.is_superuser);
  const isPlanificador =
    isSuperAdmin ||
    ['ADMINISTRADOR', 'APROBADOR', 'PLANIFICADOR', 'PLANIFICACIÓN', 'PLANIFICACION'].includes(rolName);
  const isGerente = rolName === 'GERENTE';
  const isElaborador = rolName === 'ELABORADOR';
  const isTrabajador = rolName === 'TRABAJADOR';

  // Ambos pueden editar (Gerente y Planificador)
  const canEdit = isSuperAdmin || isPlanificador || isGerente;

  // Solo Planificador / Administrador puede aprobar formalmente
  const canApprove = isSuperAdmin || isPlanificador;

  // Solo Gerente, Planificador y Administrador pueden imprimir (Elaborador y Trabajador NO pueden imprimir)
  const canPrint = isSuperAdmin || isPlanificador || isGerente;

  // Restricción de área para Gerente, Elaborador y Trabajador
  const isRestrictedToOwnArea = !isPlanificador && !isSuperAdmin;
  const userAreaId = user?.area_id || null;

  // ── Estados de Datos ──────────────────────────────────────────────────────────
  const [gestiones, setGestiones] = useState<Gestion[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [operaciones, setOperaciones] = useState<Operacion[]>([]);
  const [certificaciones, setCertificaciones] = useState<CertificacionPOA[]>([]);

  // Filtros
  const [selectedGestionId, setSelectedGestionId] = useState<number | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<number | 'todas'>('todas');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modos y Certificación Activa
  const [activeCertId, setActiveCertId] = useState<number | null>(null);
  const [isSplitEditing, setIsSplitEditing] = useState<boolean>(false);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);

  // Estados de carga y retroalimentación
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Modal para observación de Planificación
  const [showObservarModal, setShowObservarModal] = useState<boolean>(false);
  const [textoObservacion, setTextoObservacion] = useState<string>('');

  // ── Estado del Formulario ─────────────────────────────────────────────────────
  const [formData, setFormData] = useState<CertificacionFormData>({
    codigo_certificacion: '',
    numero_oficio_solicitud: '',
    gestion: 0,
    area: 0,
    fecha: new Date().toISOString().split('T')[0],
    version: 'Versión 1: 2026',
    operaciones: [],
    monto_solicitado: '0.00',
    concepto_gasto: '',
    notas: '',
    solicitante_nombre: '',
    solicitante_cargo: '',
    elaborador_nombre: '',
    elaborador_cargo: '',
    estado: 'BORRADOR',
  });

  const showFeedback = (type: 'success' | 'error' | 'info', text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 6000);
  };

  // ── Carga inicial de catálogos ────────────────────────────────────────────────
  useEffect(() => {
    const fetchCatalogos = async () => {
      try {
        setLoading(true);
        const [gList, aList, oList] = await Promise.all([
          getGestiones(),
          getAreas(),
          planificacionService.getOperaciones(),
        ]);

        setGestiones(gList);
        setAreas(aList);
        setOperaciones(oList);

        const currentYear = new Date().getFullYear();
        const defGestion = gList.find((g) => g.anio === currentYear) || gList[0];
        if (defGestion) {
          setSelectedGestionId(defGestion.id);
        }

        if (isRestrictedToOwnArea && userAreaId) {
          setSelectedAreaId(userAreaId);
        }
      } catch (err) {
        console.error('Error al cargar catálogos:', err);
        showFeedback('error', 'No se pudieron cargar los datos organizacionales.');
      } finally {
        setLoading(false);
      }
    };

    fetchCatalogos();
  }, [isRestrictedToOwnArea, userAreaId]);

  // ── Carga de Certificaciones por filtros ──────────────────────────────────────
  const fetchCertificaciones = async () => {
    if (!selectedGestionId) return;
    try {
      const params: Record<string, any> = { gestion: selectedGestionId };
      if (selectedAreaId !== 'todas') {
        params.area = selectedAreaId;
      }
      const data = await certificacionService.getCertificaciones(params);
      setCertificaciones(data);

      if (data.length > 0) {
        if (!activeCertId || !data.some((c) => c.id === activeCertId)) {
          setActiveCertId(data[0].id);
        }
      } else {
        setActiveCertId(null);
      }
    } catch (err) {
      console.error('Error al cargar certificaciones:', err);
    }
  };

  useEffect(() => {
    if (selectedGestionId) {
      fetchCertificaciones();
    }
  }, [selectedGestionId, selectedAreaId]);

  const activeCert = useMemo(() => {
    return certificaciones.find((c) => c.id === activeCertId) || null;
  }, [certificaciones, activeCertId]);

  // ── Sincronizar formulario con la certificación activa cuando NO se esté editando ──
  useEffect(() => {
    if (isSplitEditing || isCreatingNew) return;

    if (activeCert) {
      // Filtrar operaciones que pertenezcan al área de la certificación
      const opsIdsArea = operaciones.filter((o) => o.area === activeCert.area).map((o) => o.id);
      const cleanedOps = (activeCert.operaciones || []).filter((id) =>
        opsIdsArea.length > 0 ? opsIdsArea.includes(id) : true
      );

      setFormData({
        codigo_certificacion: activeCert.codigo_certificacion,
        numero_oficio_solicitud: activeCert.numero_oficio_solicitud,
        gestion: activeCert.gestion,
        area: activeCert.area,
        fecha: activeCert.fecha || new Date().toISOString().split('T')[0],
        version: activeCert.version || 'Versión 1: 2026',
        operaciones: cleanedOps,
        monto_solicitado: activeCert.monto_solicitado || '0.00',
        concepto_gasto: activeCert.concepto_gasto || '',
        notas: activeCert.notas,
        solicitante_nombre: activeCert.solicitante_nombre,
        solicitante_cargo: activeCert.solicitante_cargo,
        elaborador_nombre: activeCert.elaborador_nombre,
        elaborador_cargo: activeCert.elaborador_cargo,
        observacion_planificacion: activeCert.observacion_planificacion || '',
        estado: activeCert.estado,
      });
    }
  }, [activeCert, isSplitEditing, isCreatingNew, operaciones]);

  // ── Generador automático de Notas Legales contextuales ─────────────────────────
  const generarNotaContextual = (areaId: number, opsIds: number[]) => {
    const areaObj = areas.find((a) => a.id === areaId);
    const gestObj = gestiones.find((g) => g.id === selectedGestionId);
    const gestionAnio = gestObj ? gestObj.anio : new Date().getFullYear();
    const areaNombre = areaObj ? areaObj.nombre : 'Área Solicitante';

    const selectedOpObjs = operaciones.filter((o) => opsIds.includes(o.id));
    const isContratacion = selectedOpObjs.some((o) => o.es_contratacion);
    const isAeronautico =
      areaObj?.codigo?.includes('GO') ||
      areaObj?.codigo?.includes('AE') ||
      areaObj?.codigo?.includes('SMS') ||
      areaObj?.nombre?.toLowerCase().includes('operaciones') ||
      areaObj?.nombre?.toLowerCase().includes('aeronavegabilidad');

    if (isContratacion) {
      return `Notas: El presente documento da a conocer únicamente que la solicitud en mención se encuentra programada en alineación a la Acción de Mediano Plazo (PEE) y la Acción de Corto Plazo (POA) registrados en el Plan Operativo Anual ${gestionAnio}. Los aspectos presupuestarios y de contratación corresponden a la ${areaNombre} y se encuentran en el marco de las atribuciones y competencias de la Gerencia de Asuntos Administrativos EPTAM y sus instancias correspondientes según el D.S. Nº 0181 (NB-SABS) y normativa vigente relacionada.`;
    }

    if (isAeronautico) {
      return `Notas: El presente documento certifica que las operaciones y requerimientos solicitados se encuentran programados en el Plan Operativo Anual (POA) ${gestionAnio} en concordancia con las Regulaciones Aeronáuticas Bolivianas (RAB) y normativas de seguridad operacional vigentes. La ejecución técnica corresponde a la ${areaNombre}.`;
    }

    return `Notas: El presente documento certifica que la solicitud en mención se encuentra programada en alineación a la Acción de Mediano Plazo (PEE) y la Acción de Corto Plazo (POA) del Plan Operativo Anual ${gestionAnio}. La ejecución de las actividades corresponde a la ${areaNombre} en cumplimiento de la normativa institucional de la EPTAM.`;
  };

  // ── Iniciar Nueva Certificación ──────────────────────────────────────────────
  const handleStartCreate = async () => {
    if (!canEdit) return;

    // Validación de que el gerente tenga su área
    if (isGerente && !userAreaId) {
      showFeedback('error', 'Tu usuario Gerente no tiene un área asignada en el sistema. Contacta al Administrador.');
      return;
    }

    const defaultAreaId =
      isRestrictedToOwnArea && userAreaId
        ? userAreaId
        : selectedAreaId !== 'todas'
        ? selectedAreaId
        : areas[0]?.id || 1;

    const areaObj = areas.find((a) => a.id === defaultAreaId);
    const gestObj = gestiones.find((g) => g.id === selectedGestionId);
    const anio = gestObj ? gestObj.anio : new Date().getFullYear();

    // Obtener correlativos automáticos del backend
    let autoOficio = `${areaObj?.codigo || 'GCIA'}.EPTAM. Stría Nº 001/${anio.toString().slice(-2)}`;
    let autoCert = `UPLANIF.EPTAM.CP. Nº 001/${anio}`;

    try {
      if (selectedGestionId) {
        const corr = await certificacionService.getSiguienteCorrelativo(selectedGestionId, defaultAreaId);
        autoOficio = corr.numero_oficio_solicitud;
        autoCert = corr.codigo_certificacion;
      }
    } catch (e) {
      console.warn('Error calculando correlativo automático:', e);
    }

    setFormData({
      codigo_certificacion: autoCert,
      numero_oficio_solicitud: autoOficio,
      gestion: selectedGestionId || gestiones[0]?.id || 1,
      area: defaultAreaId,
      fecha: new Date().toISOString().split('T')[0],
      version: `Versión 1: ${anio}`,
      operaciones: [], // Primero debe seleccionar operaciones
      monto_solicitado: '0.00',
      concepto_gasto: '',
      notas: '',
      solicitante_nombre: user?.first_name ? `${user.first_name} ${user.last_name}` : '',
      solicitante_cargo: user?.cargo || (areaObj ? `GERENTE DE ${areaObj.nombre.toUpperCase()}` : 'Encargado de Área'),
      elaborador_nombre: 'UNIDAD DE PLANIFICACIÓN',
      elaborador_cargo: 'Jefe Unidad de Planificación EPTAM',
      estado: 'BORRADOR',
    });

    setIsCreatingNew(true);
    setIsSplitEditing(true);
  };

  const handleStartEdit = () => {
    if (!canEdit || !activeCert) return;

    // Filtrar operaciones que correspondan al área de la certificación para evitar arrastrar operaciones de otras áreas
    const opsIdsArea = operaciones.filter((o) => o.area === activeCert.area).map((o) => o.id);
    const cleanedOps = (activeCert.operaciones || []).filter((id) =>
      opsIdsArea.length > 0 ? opsIdsArea.includes(id) : true
    );

    setFormData({
      codigo_certificacion: activeCert.codigo_certificacion,
      numero_oficio_solicitud: activeCert.numero_oficio_solicitud,
      gestion: activeCert.gestion,
      area: activeCert.area,
      fecha: activeCert.fecha || new Date().toISOString().split('T')[0],
      version: activeCert.version || 'Versión 1: 2026',
      operaciones: cleanedOps,
      monto_solicitado: activeCert.monto_solicitado || '0.00',
      concepto_gasto: activeCert.concepto_gasto || '',
      notas: activeCert.notas,
      solicitante_nombre: activeCert.solicitante_nombre,
      solicitante_cargo: activeCert.solicitante_cargo,
      elaborador_nombre: activeCert.elaborador_nombre,
      elaborador_cargo: activeCert.elaborador_cargo,
      observacion_planificacion: activeCert.observacion_planificacion || '',
      estado: activeCert.estado,
    });
    setIsCreatingNew(false);
    setIsSplitEditing(true);
  };

  const handleCancelEdit = () => {
    setIsSplitEditing(false);
    setIsCreatingNew(false);
    if (activeCert) {
      setActiveCertId(activeCert.id);
    }
  };

  // ── Guardar Certificación ─────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!canEdit) {
      showFeedback('error', 'No tienes permisos para guardar o editar certificaciones.');
      return;
    }

    if (formData.operaciones.length === 0) {
      showFeedback('error', 'Debe seleccionar al menos una operación POA antes de guardar.');
      return;
    }

    if (!formData.codigo_certificacion.trim()) {
      showFeedback('error', 'El número de certificación POA es obligatorio.');
      return;
    }

    if (!formData.numero_oficio_solicitud.trim()) {
      showFeedback('error', 'El número de oficio de solicitud es obligatorio.');
      return;
    }

    try {
      setActionLoading(true);
      if (isCreatingNew) {
        const nueva = await certificacionService.createCertificacion(formData);
        showFeedback('success', `Certificación POA "${nueva.codigo_certificacion}" guardada como borrador.`);
        await fetchCertificaciones();
        setActiveCertId(nueva.id);
      } else if (activeCertId) {
        const actualizada = await certificacionService.updateCertificacion(activeCertId, formData);
        showFeedback('success', `Certificación POA "${actualizada.codigo_certificacion}" actualizada.`);
        await fetchCertificaciones();
      }
      setIsSplitEditing(false);
      setIsCreatingNew(false);
    } catch (err: any) {
      console.error('Error al guardar certificación:', err);
      const errMsg =
        err?.response?.data?.non_field_errors?.[0] ||
        err?.response?.data?.detail ||
        'Ocurrió un error al guardar la certificación.';
      showFeedback('error', errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  // ── Flujo: Enviar a Planificación (Gerente) ──────────────────────────────────
  const handleEnviarPlanificacion = async () => {
    if (!activeCertId) return;
    if (!window.confirm('¿Desea enviar esta certificación a Planificación para su revisión y aprobación?')) return;

    try {
      setActionLoading(true);
      await certificacionService.enviarPlanificacion(activeCertId);
      showFeedback('success', 'Certificación enviada a Planificación con éxito.');
      await fetchCertificaciones();
    } catch (err: any) {
      console.error('Error al enviar a planificación:', err);
      showFeedback('error', 'No se pudo enviar la certificación a planificación.');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Flujo: Aprobar Certificación (Solo Planificador) ──────────────────────────
  const handleAprobar = async () => {
    if (!canApprove || !activeCertId) return;
    if (!window.confirm('¿Está seguro de Aprobar formalmente esta Certificación POA? Se devolverá aprobada a la Gerencia.')) return;

    try {
      setActionLoading(true);
      await certificacionService.aprobarCertificacion(activeCertId);
      showFeedback('success', 'Certificación POA aprobada formalmente y devuelta a la gerencia.');
      await fetchCertificaciones();
    } catch (err: any) {
      console.error('Error al aprobar certificación:', err);
      const errMsg = err?.response?.data?.error || 'No se pudo aprobar la certificación.';
      showFeedback('error', errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  // ── Flujo: Observar / Devolver (Planificador) ──────────────────────────────────
  const handleConfirmarObservacion = async () => {
    if (!canApprove || !activeCertId) return;
    if (!textoObservacion.trim()) {
      alert('Por favor ingrese el motivo u observación.');
      return;
    }

    try {
      setActionLoading(true);
      await certificacionService.observarCertificacion(activeCertId, textoObservacion);
      showFeedback('info', 'Certificación devuelta a la Gerencia con observaciones.');
      setShowObservarModal(false);
      setTextoObservacion('');
      await fetchCertificaciones();
    } catch (err: any) {
      console.error('Error al observar certificación:', err);
      showFeedback('error', 'No se pudo registrar la observación.');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Eliminar Certificación ────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!canEdit || !activeCertId) return;
    if (!window.confirm('¿Está seguro de eliminar esta certificación POA?')) return;

    try {
      setActionLoading(true);
      await certificacionService.deleteCertificacion(activeCertId);
      showFeedback('success', 'Certificación POA eliminada.');
      setActiveCertId(null);
      await fetchCertificaciones();
    } catch (err: any) {
      console.error('Error al eliminar certificación:', err);
      showFeedback('error', 'No se pudo eliminar la certificación.');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Imprimir ──────────────────────────────────────────────────────────────────
  const handlePrint = () => {
    if (!canPrint || !activeCert) {
      showFeedback('error', 'No hay una certificación seleccionada o no tienes permisos para imprimir.');
      return;
    }
    window.print();
  };

  // ── Operaciones del Área ───────────────────────────────────────────────────────
  const currentFormAreaId = formData.area;
  const operacionesDelArea = useMemo(() => {
    if (!currentFormAreaId) return [];
    return operaciones.filter((op) => op.area === currentFormAreaId && op.estado);
  }, [operaciones, currentFormAreaId]);

  // Al seleccionar / deseleccionar operaciones
  const handleToggleOperacion = (opId: number) => {
    setFormData((prev) => {
      const exists = prev.operaciones.includes(opId);
      const newOps = exists ? prev.operaciones.filter((id) => id !== opId) : [...prev.operaciones, opId];
      // Si antes no tenía notas o se actualizan las operaciones, autogenerar la nota contextual
      const nuevaNota = prev.notas && prev.notas.trim() ? prev.notas : generarNotaContextual(prev.area, newOps);
      return {
        ...prev,
        operaciones: newOps,
        notas: nuevaNota,
      };
    });
  };

  // ── Jerarquía implícita en vivo (Reactivamente calculada a partir de formData.operaciones) ──
  const jerarquiaEnVivo = useMemo(() => {
    const selectedOpObjs = formData.operaciones
      .map((opId) => operaciones.find((o) => o.id === opId))
      .filter(Boolean) as Operacion[];

    const ampsMap = new Map<string, { codigo: string; descripcion: string }>();
    const acpsMap = new Map<string, { codigo: string; descripcion: string }>();
    const programasMap = new Map<string, { codigo: string; nombre: string }>();

    selectedOpObjs.forEach((op) => {
      if (op.amp_codigo) {
        ampsMap.set(op.amp_codigo, {
          codigo: op.amp_codigo,
          descripcion: op.amp_descripcion || 'Acción de Mediano Plazo (PEE)',
        });
      }
      if (op.acp_codigo) {
        acpsMap.set(op.acp_codigo, {
          codigo: op.acp_codigo,
          descripcion: op.acp_descripcion || 'Acción de Corto Plazo (POA)',
        });
      }
      const pCod = op.area_programa_codigo || (op as any).acp_programa_codigo || '';
      const pNom = op.area_programa_nombre || (op as any).acp_programa_nombre || 'Programa Institucional';
      if (pCod) {
        programasMap.set(pCod, { codigo: pCod, nombre: pNom });
      }
    });

    return {
      amps: Array.from(ampsMap.values()),
      acps: Array.from(acpsMap.values()),
      operaciones: selectedOpObjs,
      programas: Array.from(programasMap.values()),
    };
  }, [formData.operaciones, operaciones]);

  // ── Certificaciones filtradas por búsqueda ────────────────────────────────────
  const certificacionesFiltradas = useMemo(() => {
    if (!searchTerm.trim()) return certificaciones;
    const term = searchTerm.toLowerCase();
    return certificaciones.filter(
      (c) =>
        c.codigo_certificacion.toLowerCase().includes(term) ||
        c.numero_oficio_solicitud.toLowerCase().includes(term) ||
        c.area_nombre.toLowerCase().includes(term)
    );
  }, [certificaciones, searchTerm]);

  // ── Formatear fecha para el certificado ───────────────────────────────────────
  const formatearFechaCertificado = (fechaStr: string) => {
    if (!fechaStr) return 'La Paz, fecha no especificada';
    try {
      const [year, month, day] = fechaStr.split('-').map(Number);
      const meses = [
        'enero',
        'febrero',
        'marzo',
        'abril',
        'mayo',
        'junio',
        'julio',
        'agosto',
        'septiembre',
        'octubre',
        'noviembre',
        'diciembre',
      ];
      const mesNombre = meses[month - 1] || '';
      return `La Paz, ${day} de ${mesNombre} de ${year}`;
    } catch {
      return `La Paz, ${fechaStr}`;
    }
  };

  // ── Datos de la hoja oficial ──────────────────────────────────────────────────
  const renderData = useMemo(() => {
    if (isSplitEditing) {
      const areaObj = areas.find((a) => a.id === formData.area);
      const gestObj = gestiones.find((g) => g.id === formData.gestion);

      return {
        codigo_certificacion: formData.codigo_certificacion || 'S/N',
        numero_oficio_solicitud: formData.numero_oficio_solicitud || 'S/N',
        fecha_texto: formatearFechaCertificado(formData.fecha),
        version: formData.version || 'Versión 1: 2026',
        area_nombre: areaObj ? areaObj.nombre.toUpperCase() : 'ÁREA SOLICITANTE',
        gestion_anio: gestObj ? gestObj.anio : new Date().getFullYear(),
        solicitante_nombre: formData.solicitante_nombre || 'Firma de Solicitante',
        solicitante_cargo: formData.solicitante_cargo || 'Cargo Solicitante',
        elaborador_nombre: formData.elaborador_nombre || 'Firma de Elaborador',
        elaborador_cargo: formData.elaborador_cargo || 'Cargo Elaborador / Planificación',
        notas: formData.notas || generarNotaContextual(formData.area, formData.operaciones),
        estado: formData.estado || 'BORRADOR',
        observacion_planificacion: formData.observacion_planificacion || '',
        jerarquia: jerarquiaEnVivo,
      };
    }

    if (activeCert) {
      return {
        codigo_certificacion: activeCert.codigo_certificacion,
        numero_oficio_solicitud: activeCert.numero_oficio_solicitud,
        fecha_texto: formatearFechaCertificado(activeCert.fecha),
        version: activeCert.version,
        area_nombre: activeCert.area_nombre.toUpperCase(),
        gestion_anio: activeCert.gestion_anio,
        solicitante_nombre: activeCert.solicitante_nombre || 'Sin nombre',
        solicitante_cargo: activeCert.solicitante_cargo || 'Sin cargo',
        elaborador_nombre: activeCert.elaborador_nombre || 'Sin nombre',
        elaborador_cargo: activeCert.elaborador_cargo || 'Sin cargo',
        notas: activeCert.notas,
        estado: activeCert.estado,
        observacion_planificacion: activeCert.observacion_planificacion || '',
        jerarquia: {
          amps: activeCert.jerarquia_resumen?.amps || [],
          acps: activeCert.jerarquia_resumen?.acps || [],
          operaciones: activeCert.jerarquia_resumen?.operaciones || [],
          programas: activeCert.jerarquia_resumen?.programas || [],
        },
      };
    }

    return null;
  }, [isSplitEditing, formData, activeCert, areas, gestiones, jerarquiaEnVivo]);

  // Indicador de si las opciones del formulario están habilitadas (requiere al menos 1 operación)
  const isFormUnlocked = formData.operaciones.length > 0;

  // Estado de zoom para previsualización cómoda
  const [previewZoom, setPreviewZoom] = useState<'fit' | 'normal'>('fit');

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-theme-bg">
      {/* Estilos para impresión limpia */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            body * {
              visibility: hidden !important;
            }
            #cert-printable-container,
            #cert-printable-container * {
              visibility: visible !important;
            }
            #cert-printable-container {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
            }
            #cert-sheet {
              box-shadow: none !important;
              border: none !important;
              padding: 0 !important;
              width: 100% !important;
              transform: none !important;
            }
            .no-print {
              display: none !important;
            }
          }
        `
      }} />

      {/* ── BARRA SUPERIOR UNIFICADA Y PERMANENTE (SIN DESPLAZAMIENTOS) ───────────── */}
      <header className="no-print bg-theme-card border-b border-theme-border px-6 py-3 shrink-0 flex flex-wrap items-center justify-between gap-4 z-20 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-theme-primary/10 text-theme-primary flex items-center justify-center font-bold">
            <FileText size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-display font-bold text-theme-main">Certificación POA</h1>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-theme-primary/10 text-theme-primary border border-theme-primary/20">
                Pestaña Gastos
              </span>
            </div>
            <p className="text-xs text-theme-muted">
              Control correlativo y articulación institucional de Operaciones, ACP y AMP
            </p>
          </div>
        </div>

        {/* Barra Fija de Filtros y Botones */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Selector de Gestión */}
          <div className="flex items-center gap-1.5 bg-theme-bg border border-theme-border rounded-xl px-3 py-1.5 text-xs">
            <Calendar size={14} className="text-theme-muted" />
            <span className="text-theme-muted font-medium">Gestión:</span>
            <select
              value={selectedGestionId || ''}
              onChange={(e) => setSelectedGestionId(Number(e.target.value))}
              className="bg-transparent font-bold text-theme-main focus:outline-none cursor-pointer"
            >
              {gestiones.map((g) => (
                <option key={g.id} value={g.id} className="bg-theme-card text-theme-main">
                  {g.anio}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Área / Gerencia */}
          <div className="flex items-center gap-1.5 bg-theme-bg border border-theme-border rounded-xl px-3 py-1.5 text-xs">
            <Building2 size={14} className="text-theme-muted" />
            <span className="text-theme-muted font-medium">Área:</span>
            {isRestrictedToOwnArea ? (
              <span className="font-bold text-theme-primary max-w-[200px] truncate">
                {user?.area_nombre || (userAreaId ? `Área #${userAreaId}` : 'Sin Área')}
              </span>
            ) : (
              <select
                value={selectedAreaId}
                onChange={(e) =>
                  setSelectedAreaId(e.target.value === 'todas' ? 'todas' : Number(e.target.value))
                }
                className="bg-transparent font-bold text-theme-main focus:outline-none cursor-pointer max-w-[200px] truncate"
              >
                <option value="todas" className="bg-theme-card text-theme-main">
                  Todas las Áreas
                </option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id} className="bg-theme-card text-theme-main">
                    [{a.codigo}] {a.nombre}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="h-6 w-px bg-theme-border hidden sm:block"></div>

          {/* Botones de acción del documento */}
          {!isSplitEditing && (
            <div className="flex items-center gap-2 flex-wrap">
              {/* Botón Imprimir */}
              <button
                onClick={handlePrint}
                disabled={!activeCert || !canPrint}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-theme-border text-theme-main hover:bg-theme-border/50 transition-colors shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                title={!activeCert ? 'No hay certificación seleccionada' : 'Imprimir'}
              >
                <Printer size={14} />
                <span>Imprimir</span>
              </button>

              {/* Botón Editar Certificación */}
              <button
                onClick={handleStartEdit}
                disabled={!activeCert || !canEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Edit3 size={14} />
                <span>Editar</span>
              </button>

              {/* Botón Enviar a Planificación (Gerente) */}
              {isGerente && (
                <button
                  onClick={handleEnviarPlanificacion}
                  disabled={!activeCert || actionLoading || (activeCert.estado !== 'BORRADOR' && activeCert.estado !== 'OBSERVADO')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Enviar a Planificación para revisión y aprobación"
                >
                  <Send size={13} />
                  <span>Enviar a Planificación</span>
                </button>
              )}

              {/* Botón Aprobar (Planificación) */}
              {canApprove && (
                <button
                  onClick={handleAprobar}
                  disabled={!activeCert || actionLoading || activeCert.estado !== 'PENDIENTE_PLANIFICACION'}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Aprobar y devolver a la Gerencia"
                >
                  <CheckCircle2 size={14} />
                  <span>Aprobar</span>
                </button>
              )}

              {/* Botón Observar (Planificación) */}
              {canApprove && (
                <button
                  onClick={() => setShowObservarModal(true)}
                  disabled={!activeCert || actionLoading || activeCert.estado !== 'PENDIENTE_PLANIFICACION'}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Devolver con observaciones al Gerente"
                >
                  <XCircle size={14} />
                  <span>Observar</span>
                </button>
              )}

              {/* Botón Eliminar */}
              <button
                onClick={handleDelete}
                disabled={!activeCert || !canEdit || actionLoading}
                className="p-1.5 text-xs text-rose-500 hover:bg-rose-500/10 rounded-xl border border-rose-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                title="Eliminar certificación"
              >
                <Trash2 size={15} />
              </button>

              {/* Botón Nueva Certificación */}
              {canEdit && (
                <button
                  onClick={handleStartCreate}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-theme-primary text-theme-primaryText shadow-xs hover:opacity-90 transition-opacity"
                >
                  <Plus size={15} />
                  <span>Nueva Certificación</span>
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* ── MENSAJES DE RETROALIMENTACIÓN ─────────────────────────────────────────── */}
      {feedbackMsg && (
        <div
          className={`no-print px-6 py-2.5 text-xs font-medium flex items-center gap-2 shrink-0 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
              : feedbackMsg.type === 'info'
              ? 'bg-blue-50 text-blue-800 border-b border-blue-200'
              : 'bg-rose-50 text-rose-800 border-b border-rose-200'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Banner para Elaborador / Trabajador (Solo ver, no imprimir) */}
      {!canPrint && (
        <div className="no-print mx-6 mt-3 p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <Lock size={15} className="text-slate-500 shrink-0" />
            <span>
              <strong>Modo Consulta ({rolName || 'Personal'}):</strong> Tienes permiso para consultar y revisar las certificaciones de tu área. La emisión formal, edición e impresión corresponden al <strong>Gerente de Área</strong> y a <strong>Planificación</strong>.
            </span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 px-2 py-0.5 rounded text-slate-700">
            Solo Consulta
          </span>
        </div>
      )}

      {/* Alerta si el Gerente no tiene área asignada */}
      {isGerente && !userAreaId && (
        <div className="no-print mx-6 mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 shrink-0">
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          <span>
            <strong>Atención:</strong> Tu usuario Gerente no tiene un área o gerencia asociada en la base de datos. Por favor solicita al administrador asignarte tu Gerencia para emitir certificaciones.
          </span>
        </div>
      )}

      {/* Observación activa de Planificación si existe */}
      {activeCert && activeCert.observacion_planificacion && (
        <div className="no-print mx-6 mt-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 shrink-0">
          <MessageSquare size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Observación de Planificación:</strong>
            <p className="mt-0.5 text-amber-800">{activeCert.observacion_planificacion}</p>
          </div>
        </div>
      )}

      {/* ── CONTENIDO PRINCIPAL (VIEWPORT COMPLETO SIN DESBORDARSE) ───────────────── */}
      <div className="flex-1 p-5 overflow-hidden">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-theme-muted gap-3">
            <div className="w-8 h-8 border-3 border-theme-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-medium">Cargando módulo de certificaciones...</p>
          </div>
        ) : isSplitEditing ? (
          /* ========================================================================= */
          /* MODO EDICIÓN LADO A LADO CÓMODO Y SINCRONIZADO EN PANTALLA                */
          /* ========================================================================= */
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 h-full items-stretch">
            {/* PANEL IZQUIERDO: FORMULARIO DE LLENADO / EDICIÓN (5 Columnas) */}
            <div className="xl:col-span-5 bg-theme-card border border-theme-border rounded-2xl flex flex-col h-[calc(100vh-140px)] shadow-sm overflow-hidden no-print">
              {/* Encabezado fijo del formulario */}
              <div className="p-4 border-b border-theme-border flex items-center justify-between shrink-0 bg-theme-card">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                    <Edit3 size={16} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-theme-main">
                      {isCreatingNew ? 'Nueva Certificación' : 'Editar Certificación'}
                    </h2>
                    <p className="text-[10px] text-theme-muted">
                      Selecciona operaciones y revisa la vista previa en vivo
                    </p>
                  </div>
                </div>

                {/* Botones Guardar y Cancelar */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCancelEdit}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 border-2 border-rose-300 hover:bg-rose-100 rounded-xl transition-all shadow-xs"
                  >
                    <XCircle size={14} />
                    <span>Cancelar</span>
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-xl bg-theme-primary text-theme-primaryText shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    <CheckCircle2 size={14} />
                    <span>{actionLoading ? 'Guardando...' : 'Guardar'}</span>
                  </button>
                </div>
              </div>

              {/* Cuerpo del formulario desplazable internamente */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs custom-scrollbar">
                {/* 1. Área / Unidad Solicitante */}
                <div>
                  <label className="block font-semibold text-theme-main mb-1">
                    Unidad Solicitante / Gerencia <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.area}
                    disabled={isRestrictedToOwnArea}
                    onChange={async (e) => {
                      const newAreaId = Number(e.target.value);
                      setFormData((prev) => ({
                        ...prev,
                        area: newAreaId,
                        operaciones: [], // reiniciar operaciones al cambiar área
                      }));
                      if (selectedGestionId) {
                        try {
                          const corr = await certificacionService.getSiguienteCorrelativo(selectedGestionId, newAreaId);
                          setFormData((prev) => ({
                            ...prev,
                            numero_oficio_solicitud: corr.numero_oficio_solicitud,
                            codigo_certificacion: corr.codigo_certificacion,
                          }));
                        } catch (err) {}
                      }
                    }}
                    className="w-full bg-theme-bg border border-theme-border rounded-xl px-3 py-2 text-theme-main font-medium focus:ring-2 focus:ring-theme-primary/20 focus:outline-none disabled:opacity-75"
                  >
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>
                        [{a.codigo}] {a.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. PASO OBLIGATORIO 1: Selección de Operaciones */}
                <div className="p-3.5 bg-theme-bg border-2 border-theme-primary/30 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-theme-main flex items-center gap-1.5">
                      <Layers size={15} className="text-theme-primary" />
                      <span>1. Seleccionar Operación(es) POA <span className="text-rose-500">*</span></span>
                    </label>
                    <span className="text-[10px] text-theme-primary font-bold bg-theme-primary/10 px-2 py-0.5 rounded-full">
                      {formData.operaciones.length} seleccionada(s)
                    </span>
                  </div>

                  <p className="text-[11px] text-theme-muted">
                    Marca o desmarca las operaciones de la gerencia para actualizar el certificado:
                  </p>

                  <div className="space-y-2">
                    {operacionesDelArea.length === 0 ? (
                      <p className="text-[11px] text-theme-muted py-2 text-center italic bg-theme-card rounded-lg border border-theme-border">
                        No hay operaciones registradas para esta área en el sistema.
                      </p>
                    ) : (
                      operacionesDelArea.map((op) => {
                        const isSelected = formData.operaciones.includes(op.id);
                        return (
                          <div
                            key={op.id}
                            onClick={() => handleToggleOperacion(op.id)}
                            className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                              isSelected
                                ? 'bg-theme-primary/10 border-theme-primary text-theme-main font-medium shadow-xs'
                                : 'bg-theme-card border-theme-border hover:border-theme-primary/40 hover:bg-theme-border/20 text-theme-muted'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="mt-0.5 rounded text-theme-primary focus:ring-0 cursor-pointer"
                            />
                            <div className="flex-1 leading-snug">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-theme-primary font-mono text-xs">
                                  {op.codigo}
                                </span>
                                {op.acp_codigo && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-800 font-mono font-semibold">
                                    ACP: {op.acp_codigo}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] mt-1 text-theme-main">
                                {op.descripcion}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Jerarquía Automática Derivada */}
                  {jerarquiaEnVivo.operaciones.length > 0 && (
                    <div className="mt-2 p-2.5 rounded-lg bg-theme-primary/5 border border-theme-primary/20 text-[11px] space-y-1 text-theme-main">
                      <div className="flex items-center gap-1 font-bold text-theme-primary">
                        <Sparkles size={13} />
                        <span>Jerarquía Implícita Autocompletada:</span>
                      </div>
                      <p>
                        <strong>PEE (AMP):</strong>{' '}
                        {jerarquiaEnVivo.amps.map((a) => a.codigo).join(', ') || 'No asignada'}
                      </p>
                      <p>
                        <strong>POA (ACP):</strong>{' '}
                        {jerarquiaEnVivo.acps.map((a) => a.codigo).join(', ') || 'No asignada'}
                      </p>
                      <p>
                        <strong>Programa:</strong>{' '}
                        {jerarquiaEnVivo.programas.map((p) => `[${p.codigo}] ${p.nombre}`).join('; ') || 'No asignado'}
                      </p>
                    </div>
                  )}
                </div>

                {/* AVISO DE BLOQUEO SI NO HAY OPERACIÓN SELECCIONADA */}
                {!isFormUnlocked && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center gap-2">
                    <HelpCircle size={16} className="text-amber-600 shrink-0" />
                    <span>
                      👉 <strong>Paso 1:</strong> Selecciona al menos una operación arriba para desbloquear y autocompletar los números de oficio, certificación y firmas.
                    </span>
                  </div>
                )}

                {/* ── PASO 2: CAMPOS RESTANTES (HABILITADOS TRAS SELECCIONAR OPERACIÓN) ── */}
                <div className={`space-y-4 transition-all ${!isFormUnlocked ? 'opacity-40 pointer-events-none' : ''}`}>
                  {/* Números Correlativos */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-theme-main mb-1">
                        Nº Oficio Solicitud (Gerencia) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        disabled={!isFormUnlocked}
                        value={formData.numero_oficio_solicitud}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, numero_oficio_solicitud: e.target.value }))
                        }
                        placeholder="Ej: GCIA.OPS.EPTAM. Stría Nº 001/26"
                        className="w-full bg-theme-bg border border-theme-border rounded-xl px-3 py-2 text-theme-main focus:ring-2 focus:ring-theme-primary/20 focus:outline-none"
                      />
                      <span className="text-[10px] text-theme-muted mt-0.5 block">Correlativo por Gerencia</span>
                    </div>
                    <div>
                      <label className="block font-semibold text-theme-main mb-1">
                        Nº Certificación POA (Global) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        disabled={!isFormUnlocked}
                        value={formData.codigo_certificacion}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, codigo_certificacion: e.target.value }))
                        }
                        placeholder="Ej: UPLANIF.EPTAM.CP. Nº 001/2026"
                        className="w-full bg-theme-bg border border-theme-border rounded-xl px-3 py-2 text-theme-main font-bold focus:ring-2 focus:ring-theme-primary/20 focus:outline-none"
                      />
                      <span className="text-[10px] text-theme-muted mt-0.5 block">Correlativo Planificación</span>
                    </div>
                  </div>

                  {/* Fecha y Versión */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-theme-main mb-1">Fecha de Emisión</label>
                      <input
                        type="date"
                        disabled={!isFormUnlocked}
                        value={formData.fecha}
                        onChange={(e) => setFormData((prev) => ({ ...prev, fecha: e.target.value }))}
                        className="w-full bg-theme-bg border border-theme-border rounded-xl px-3 py-2 text-theme-main focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-theme-main mb-1">Versión</label>
                      <input
                        type="text"
                        disabled={!isFormUnlocked}
                        value={formData.version}
                        onChange={(e) => setFormData((prev) => ({ ...prev, version: e.target.value }))}
                        placeholder="Ej: Versión 1: 2026"
                        className="w-full bg-theme-bg border border-theme-border rounded-xl px-3 py-2 text-theme-main focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Firmantes */}
                  <div className="border-t border-theme-border pt-3 space-y-3">
                    <h3 className="font-bold text-theme-main text-xs uppercase tracking-wide">
                      Responsables / Firmas
                    </h3>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-theme-main mb-1">
                          Solicitado por (Nombre)
                        </label>
                        <input
                          type="text"
                          disabled={!isFormUnlocked}
                          value={formData.solicitante_nombre}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, solicitante_nombre: e.target.value }))
                          }
                          placeholder="Nombre y Apellidos"
                          className="w-full bg-theme-bg border border-theme-border rounded-xl px-3 py-1.5 text-theme-main focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-theme-main mb-1">
                          Solicitado por (Cargo)
                        </label>
                        <input
                          type="text"
                          disabled={!isFormUnlocked}
                          value={formData.solicitante_cargo}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, solicitante_cargo: e.target.value }))
                          }
                          placeholder="Ej: GERENTE DE OPERACIONES"
                          className="w-full bg-theme-bg border border-theme-border rounded-xl px-3 py-1.5 text-theme-main focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-theme-main mb-1">
                          Elaborado / Revisado por (Nombre)
                        </label>
                        <input
                          type="text"
                          disabled={!isFormUnlocked}
                          value={formData.elaborador_nombre}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, elaborador_nombre: e.target.value }))
                          }
                          placeholder="Nombre y Apellidos"
                          className="w-full bg-theme-bg border border-theme-border rounded-xl px-3 py-1.5 text-theme-main focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-theme-main mb-1">
                          Elaborado / Revisado por (Cargo)
                        </label>
                        <input
                          type="text"
                          disabled={!isFormUnlocked}
                          value={formData.elaborador_cargo}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, elaborador_cargo: e.target.value }))
                          }
                          placeholder="Ej: JEFE UNIDAD DE PLANIFICACIÓN"
                          className="w-full bg-theme-bg border border-theme-border rounded-xl px-3 py-1.5 text-theme-main focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notas y Obligaciones Contextuales */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-theme-main">
                        Notas y Obligaciones Contextuales
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            notas: generarNotaContextual(prev.area, prev.operaciones),
                          }))
                        }
                        className="text-[10px] text-theme-primary hover:underline font-semibold"
                      >
                        Restablecer sugerida
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      disabled={!isFormUnlocked}
                      value={formData.notas}
                      onChange={(e) => setFormData((prev) => ({ ...prev, notas: e.target.value }))}
                      className="w-full bg-theme-bg border border-theme-border rounded-xl p-2.5 text-theme-main focus:outline-none text-[11px] leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* PANEL DERECHO: VISTA PREVIA EN VIVO CONFORTABLE (7 Columnas) */}
            <div className="xl:col-span-7 bg-theme-card border border-theme-border rounded-2xl flex flex-col h-[calc(100vh-140px)] shadow-sm overflow-hidden">
              <div className="no-print p-3 border-b border-theme-border flex items-center justify-between shrink-0 bg-theme-card">
                <div className="flex items-center gap-2 text-xs text-theme-muted font-semibold">
                  <Eye size={15} className="text-theme-primary" />
                  <span>Previsualización en tiempo real del documento</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-theme-bg border border-theme-border rounded-lg p-0.5 text-[11px]">
                    <button
                      onClick={() => setPreviewZoom('fit')}
                      className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                        previewZoom === 'fit'
                          ? 'bg-theme-primary text-theme-primaryText shadow-2xs'
                          : 'text-theme-muted hover:text-theme-main'
                      }`}
                    >
                      Ajustar (80%)
                    </button>
                    <button
                      onClick={() => setPreviewZoom('normal')}
                      className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                        previewZoom === 'normal'
                          ? 'bg-theme-primary text-theme-primaryText shadow-2xs'
                          : 'text-theme-muted hover:text-theme-main'
                      }`}
                    >
                      100%
                    </button>
                  </div>
                  {canPrint && (
                    <button
                      onClick={handlePrint}
                      className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg border border-theme-border text-theme-main hover:bg-theme-border/50"
                    >
                      <Printer size={13} />
                      <span>Imprimir</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Contenedor desplazable con escala cómoda */}
              <div className="flex-1 overflow-y-auto p-4 bg-slate-900/10 custom-scrollbar flex justify-center items-start">
                <div
                  id="cert-printable-container"
                  className={`w-full transition-transform duration-200 ${
                    previewZoom === 'fit' ? 'transform scale-[0.82] origin-top' : ''
                  }`}
                >
                  <OfficialCertificateSheet data={renderData} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* MODO VISTA PREVIA Y GESTIÓN DE CERTIFICACIONES                            */
          /* ========================================================================= */
          <div className="h-full overflow-y-auto space-y-5 max-w-5xl mx-auto custom-scrollbar pr-1">
            {/* Barra de Selección / Tabs de Certificaciones Existentes */}
            {certificaciones.length > 0 && (
              <div className="no-print bg-theme-card border border-theme-border rounded-2xl p-4 shadow-sm space-y-3 shrink-0">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-theme-primary" />
                    <span className="text-xs font-bold text-theme-main uppercase tracking-wider">
                      Certificaciones Registradas ({certificaciones.length})
                    </span>
                  </div>

                  <div className="relative w-64">
                    <input
                      type="text"
                      placeholder="Buscar certificación..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-theme-bg border border-theme-border rounded-xl px-3 py-1.5 text-xs text-theme-main focus:outline-none"
                    />
                  </div>
                </div>

                {/* Pills de selección de certificación */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                  {certificacionesFiltradas.map((c) => {
                    const isSelected = c.id === activeCertId;
                    return (
                      <button
                        key={c.id}
                        onClick={() => setActiveCertId(c.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all border flex items-center gap-2 ${
                          isSelected
                            ? 'bg-theme-primary text-theme-primaryText border-theme-primary shadow-sm'
                            : 'bg-theme-bg border-theme-border text-theme-muted hover:text-theme-main hover:bg-theme-border/30'
                        }`}
                      >
                        <span>{c.codigo_certificacion}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase ${
                            c.estado === 'APROBADO'
                              ? isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-emerald-100 text-emerald-800'
                              : c.estado === 'PENDIENTE_PLANIFICACION'
                              ? isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-blue-100 text-blue-800'
                              : c.estado === 'OBSERVADO'
                              ? isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-rose-100 text-rose-800'
                              : isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {c.estado === 'PENDIENTE_PLANIFICACION'
                            ? 'En Planificación'
                            : c.estado === 'APROBADO'
                            ? 'Aprobado'
                            : c.estado === 'OBSERVADO'
                            ? 'Observado'
                            : 'Borrador'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Hoja del Certificado o Estado Vacío */}
            {activeCert ? (
              <div id="cert-printable-container" className="pb-10">
                <OfficialCertificateSheet data={renderData} />
              </div>
            ) : (
              <div className="bg-theme-card border border-dashed border-theme-border rounded-2xl p-12 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-theme-primary/10 text-theme-primary flex items-center justify-center mx-auto">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-theme-main">
                    No se encontraron certificaciones POA
                  </h3>
                  <p className="text-xs text-theme-muted mt-1 max-w-md mx-auto">
                    {selectedAreaId !== 'todas'
                      ? 'No hay certificaciones registradas para el área seleccionada en esta gestión.'
                      : 'No existen certificaciones registradas para esta gestión.'}
                  </p>
                </div>
                {canEdit && (
                  <button
                    onClick={handleStartCreate}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-theme-primary text-theme-primaryText shadow-sm hover:opacity-90 transition-opacity"
                  >
                    <Plus size={15} />
                    <span>Crear Primera Certificación</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── MODAL: OBSERVACIÓN DE PLANIFICACIÓN ───────────────────────────────────── */}
      {showObservarModal && (
        <div className="no-print fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-theme-card border border-theme-border rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
              <XCircle size={18} />
              <span>Devolver con Observación a la Gerencia</span>
            </div>
            <p className="text-xs text-theme-muted">
              Escribe el motivo u observación por el cual la certificación requiere correcciones:
            </p>
            <textarea
              rows={4}
              value={textoObservacion}
              onChange={(e) => setTextoObservacion(e.target.value)}
              placeholder="Ej: Corregir las operaciones asignadas o actualizar el nombre del solicitante..."
              className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs text-theme-main focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowObservarModal(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-theme-muted hover:bg-theme-border/50 rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarObservacion}
                disabled={actionLoading || !textoObservacion.trim()}
                className="px-4 py-1.5 text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 rounded-xl disabled:opacity-50"
              >
                Devolver a Gerencia
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE VISUAL: HOJA FORMATEADA OFICIAL DE CERTIFICACIÓN POA
// (SIN PARTIDA PRESUPUESTARIA CONFORME AL NUEVO REQUERIMIENTO)
// ─────────────────────────────────────────────────────────────────────────────
interface OfficialCertificateSheetProps {
  data: {
    codigo_certificacion: string;
    numero_oficio_solicitud: string;
    fecha_texto: string;
    version: string;
    area_nombre: string;
    gestion_anio: number;
    solicitante_nombre: string;
    solicitante_cargo: string;
    elaborador_nombre: string;
    elaborador_cargo: string;
    notas: string;
    estado: string;
    observacion_planificacion?: string;
    jerarquia: {
      amps: { codigo: string; descripcion: string }[];
      acps: { codigo: string; descripcion: string }[];
      operaciones: { codigo: string; descripcion: string }[];
      programas: { codigo: string; nombre: string }[];
    };
  } | null;
}

function OfficialCertificateSheet({ data }: OfficialCertificateSheetProps) {
  if (!data) return null;

  return (
    <div
      id="cert-sheet"
      className="bg-white text-black p-8 md:p-12 shadow-xl rounded-sm border border-gray-300 text-xs font-sans relative max-w-4xl mx-auto leading-relaxed select-text"
    >
      {/* Encabezado: Fecha y Versión */}
      <div className="flex justify-between items-start mb-6 text-[11px] font-semibold border-b border-gray-200 pb-2">
        <span>{data.fecha_texto}</span>
        <span>{data.version}</span>
      </div>

      {/* Título Institucional */}
      <div className="text-center font-bold mb-6 space-y-1">
        <p className="text-sm tracking-wider">EMPRESA PÚBLICA DE TRANSPORTE AÉREO MILITAR</p>
        <p className="text-xs text-gray-700 tracking-wide">UNIDAD DE PLANIFICACIÓN Y CONTROL DE GESTIÓN</p>
        <p className="text-base mt-2 underline uppercase tracking-widest font-black text-gray-900">
          CERTIFICACIÓN POA
        </p>
      </div>

      {/* Tabla 1: Oficio y Certificación (Correlativos) */}
      <table className="w-full border-collapse border border-black text-xs mb-4">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-black p-2 w-1/2 text-center font-bold">Nº Oficio de Solicitud</th>
            <th className="border border-black p-2 w-1/2 text-center font-bold">Nº Certificación POA</th>
          </tr>
        </thead>
        <tbody>
          <tr className="text-center font-medium">
            <td className="border border-black p-2.5 font-mono">{data.numero_oficio_solicitud || 'S/N'}</td>
            <td className="border border-black p-2.5 font-bold font-mono text-sm">
              {data.codigo_certificacion || 'S/N'}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Tabla 2: Unidad Solicitante */}
      <table className="w-full border-collapse border border-black text-xs mb-5 font-bold">
        <tbody>
          <tr>
            <td className="border border-black p-2 w-1/3 bg-gray-100 uppercase">Unidad Solicitante:</td>
            <td className="border border-black p-2 uppercase text-gray-900">{data.area_nombre}</td>
          </tr>
        </tbody>
      </table>

      {/* Texto de Introducción */}
      <p className="text-xs mb-3 text-gray-800">
        La solicitud se encuentra programada en el Plan Operativo Anual (POA){' '}
        <strong>{data.gestion_anio}</strong> de acuerdo al siguiente detalle:
      </p>

      {/* Tabla 3: Jerarquía POA (AMP, ACP, Operaciones, Categoría Programática) */}
      <table className="w-full border-collapse border border-black text-xs mb-6">
        <tbody>
          {/* ACCIÓN DE MEDIANO PLAZO (PEE / PEI) */}
          {data.jerarquia.amps.length > 0 ? (
            data.jerarquia.amps.map((amp, idx) => (
              <tr key={`amp-${idx}`}>
                <td className="border border-black p-2 font-bold font-mono w-20 align-top bg-gray-50/50">
                  {amp.codigo}
                </td>
                <td className="border border-black p-2 font-bold w-48 align-top bg-gray-50/50">
                  ACCIÓN DE MEDIANO PLAZO (PEE)
                </td>
                <td className="border border-black p-2 align-top text-justify">{amp.descripcion}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td className="border border-black p-2 font-bold font-mono w-20 align-top">-</td>
              <td className="border border-black p-2 font-bold w-48 align-top">ACCIÓN DE MEDIANO PLAZO (PEE)</td>
              <td className="border border-black p-2 align-top italic text-gray-500">
                Alineado al Plan Estratégico Empresarial (PEE)
              </td>
            </tr>
          )}

          {/* ACCIÓN DE CORTO PLAZO (POA) */}
          {data.jerarquia.acps.length > 0 ? (
            data.jerarquia.acps.map((acp, idx) => (
              <tr key={`acp-${idx}`}>
                <td className="border border-black p-2 font-bold font-mono w-20 align-top bg-gray-50/50">
                  {acp.codigo}
                </td>
                <td className="border border-black p-2 font-bold w-48 align-top bg-gray-50/50">
                  ACCIÓN DE CORTO PLAZO (POA)
                </td>
                <td className="border border-black p-2 align-top text-justify">{acp.descripcion}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td className="border border-black p-2 font-bold font-mono w-20 align-top">-</td>
              <td className="border border-black p-2 font-bold w-48 align-top">ACCIÓN DE CORTO PLAZO (POA)</td>
              <td className="border border-black p-2 align-top italic text-gray-500">
                Alineado a las Acciones Anuales Institucionales
              </td>
            </tr>
          )}

          {/* OPERACIONES (Soporta 1, 2 o más operaciones) */}
          {data.jerarquia.operaciones.length > 0 ? (
            data.jerarquia.operaciones.map((op, idx) => (
              <tr key={`op-${idx}`} className="bg-amber-50/30">
                <td className="border border-black p-2 font-bold font-mono w-20 align-top">
                  {op.codigo}
                </td>
                <td className="border border-black p-2 font-bold w-48 align-top">
                  OPERACIÓN {data.jerarquia.operaciones.length > 1 ? `(${idx + 1})` : ''}
                </td>
                <td className="border border-black p-2 align-top text-justify font-medium">
                  {op.descripcion}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td className="border border-black p-2 font-bold font-mono w-20 align-top">-</td>
              <td className="border border-black p-2 font-bold w-48 align-top">OPERACIÓN</td>
              <td className="border border-black p-2 align-top text-rose-600 italic">
                (Debe seleccionar una o más operaciones en el formulario)
              </td>
            </tr>
          )}

          {/* CATEGORÍA PROGRAMÁTICA */}
          {data.jerarquia.programas.length > 0 ? (
            data.jerarquia.programas.map((prog, idx) => (
              <tr key={`prog-${idx}`}>
                <td className="border border-black p-2 font-bold font-mono w-20 align-top bg-gray-50/50">
                  {prog.codigo}
                </td>
                <td className="border border-black p-2 font-bold w-48 align-top bg-gray-50/50">
                  CATEGORÍA PROGRAMÁTICA
                </td>
                <td className="border border-black p-2 align-top font-medium">{prog.nombre}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td className="border border-black p-2 font-bold font-mono w-20 align-top">-</td>
              <td className="border border-black p-2 font-bold w-48 align-top">CATEGORÍA PROGRAMÁTICA</td>
              <td className="border border-black p-2 align-top italic text-gray-500">
                Programa Institucional correspondiente al Área
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Notas y Obligaciones Legales */}
      <div className="text-[11px] mb-8 space-y-2 text-justify text-gray-800 leading-relaxed border-t border-b border-gray-200 py-3">
        <p>{data.notas}</p>
      </div>

      {/* Tabla 4: Firmas */}
      <table className="w-full border-collapse border border-black text-xs text-center mt-6">
        <tbody>
          <tr>
            <td className="border border-black p-4 w-1/2 align-top">
              <p className="font-bold text-left mb-16 text-[11px]">Solicitado por:</p>
              <div className="w-4/5 mx-auto border-t border-black mb-1.5"></div>
              <p className="text-[10px] uppercase text-gray-600">Firma</p>
              <p className="font-bold text-xs mt-1">{data.solicitante_nombre}</p>
              <p className="text-[11px] text-gray-700 uppercase font-medium">{data.solicitante_cargo}</p>
            </td>
            <td className="border border-black p-4 w-1/2 align-top">
              <p className="font-bold text-left mb-16 text-[11px]">Elaborado / Revisado por:</p>
              <div className="w-4/5 mx-auto border-t border-black mb-1.5"></div>
              <p className="text-[10px] uppercase text-gray-600">Firma</p>
              <p className="font-bold text-xs mt-1">{data.elaborador_nombre}</p>
              <p className="text-[11px] text-gray-700 uppercase font-medium">{data.elaborador_cargo}</p>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Badge de estado en vista previa */}
      <div className="no-print absolute top-4 right-4">
        <span
          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-2xs ${
            data.estado === 'APROBADO'
              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
              : data.estado === 'PENDIENTE_PLANIFICACION'
              ? 'bg-blue-100 text-blue-800 border-blue-300'
              : data.estado === 'OBSERVADO'
              ? 'bg-rose-100 text-rose-800 border-rose-300'
              : 'bg-amber-100 text-amber-800 border-amber-300'
          }`}
        >
          {data.estado === 'PENDIENTE_PLANIFICACION'
            ? 'En Planificación'
            : data.estado === 'APROBADO'
            ? 'Aprobado por Planificación'
            : data.estado === 'OBSERVADO'
            ? 'Observado / Devuelto'
            : 'Borrador'}
        </span>
      </div>
    </div>
  );
}


