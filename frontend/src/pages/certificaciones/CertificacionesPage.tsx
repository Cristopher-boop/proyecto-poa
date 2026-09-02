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
  RotateCcw,
  Search,
  Building2,
  Calendar,
  Layers,
  ChevronRight,
  Sparkles,
  Info,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  Gestion,
  Area,
  Partida,
  getGestiones,
  getAreas,
  getPartidas,
} from '../../services/presupuestoService';
import { planificacionService } from '../../services/planificacionService';
import { Operacion } from '../../types/planificacion';
import { CertificacionPOA, CertificacionFormData } from '../../types/certificacion';
import { certificacionService } from '../../services/certificacionService';

export default function CertificacionesPage() {
  const { user } = useAuth();
  const rolName = user?.rol_nombre?.toUpperCase() || '';

  // Roles y permisos
  // Gerente y Planificador / Administrador / Aprobador pueden editar
  // Elaborador y Trabajador NO pueden editar
  const canEdit =
    Boolean(user?.is_superuser) ||
    ['ADMINISTRADOR', 'APROBADOR', 'PLANIFICADOR', 'PLANIFICACIÓN', 'PLANIFICACION', 'GERENTE'].includes(
      rolName
    );

  const isRestrictedToOwnArea =
    ['GERENTE', 'ELABORADOR', 'TRABAJADOR'].includes(rolName) && !user?.is_superuser;

  const userAreaId = user?.area_id || null;

  // Estados principales de datos
  const [gestiones, setGestiones] = useState<Gestion[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [operaciones, setOperaciones] = useState<Operacion[]>([]);
  const [certificaciones, setCertificaciones] = useState<CertificacionPOA[]>([]);

  // Filtros seleccionados
  const [selectedGestionId, setSelectedGestionId] = useState<number | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<number | 'todas'>('todas');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Certificación activa y modo
  const [activeCertId, setActiveCertId] = useState<number | null>(null);
  const [isSplitEditing, setIsSplitEditing] = useState<boolean>(false);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);

  // Estados de carga y feedback
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Buscador de operaciones en el formulario
  const [searchOpTerm, setSearchOpTerm] = useState<string>('');

  // Estado del formulario
  const [formData, setFormData] = useState<CertificacionFormData>({
    codigo_certificacion: '',
    numero_oficio_solicitud: '',
    gestion: 0,
    area: 0,
    fecha: new Date().toISOString().split('T')[0],
    version: 'Versión 1: 2026',
    operaciones: [],
    partida: null,
    partida_literal: '',
    monto_solicitado: '0.00',
    concepto_gasto: '',
    notas:
      'Notas: El presente documento da a conocer únicamente que la solicitud en mención se encuentra programada en alineación a la Acción de Mediano Plazo (PEE) y la Acción de Corto Plazo (POA) registrados en el Plan Operativo Anual. Los aspectos presupuestarios y de contratación corresponden al área solicitante y se encuentran en el marco de las atribuciones y competencias de la Gerencia de Asuntos Administrativos EPTAM y sus instancias correspondientes según el D.S. Nº 0181 y normativa vigente relacionada.',
    solicitante_nombre: '',
    solicitante_cargo: '',
    elaborador_nombre: '',
    elaborador_cargo: '',
    estado: 'BORRADOR',
  });

  // Mostrar mensaje de feedback temporal
  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 5000);
  };

  // Carga inicial de datos maestros
  useEffect(() => {
    const fetchCatalogos = async () => {
      try {
        setLoading(true);
        const [gList, aList, pList, oList] = await Promise.all([
          getGestiones(),
          getAreas(),
          getPartidas(),
          planificacionService.getOperaciones(),
        ]);

        setGestiones(gList);
        setAreas(aList);
        setPartidas(pList);
        setOperaciones(oList);

        // Seleccionar gestión por defecto
        const currentYear = new Date().getFullYear();
        const defGestion = gList.find((g) => g.anio === currentYear) || gList[0];
        if (defGestion) {
          setSelectedGestionId(defGestion.id);
        }

        // Si el usuario pertenece a un área restringida, fijar su área
        if (isRestrictedToOwnArea && userAreaId) {
          setSelectedAreaId(userAreaId);
        }
      } catch (err: any) {
        console.error('Error al cargar catálogos:', err);
        showFeedback('error', 'No se pudieron cargar los catálogos base.');
      } finally {
        setLoading(false);
      }
    };

    fetchCatalogos();
  }, [isRestrictedToOwnArea, userAreaId]);

  // Cargar certificaciones al cambiar filtros
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

  // Certificación activa seleccionada
  const activeCert = useMemo(() => {
    return certificaciones.find((c) => c.id === activeCertId) || null;
  }, [certificaciones, activeCertId]);

  // Inicializar o sincronizar el formulario cuando cambia la certificación activa o se entra en modo edición
  useEffect(() => {
    if (isCreatingNew) return;

    if (activeCert) {
      setFormData({
        codigo_certificacion: activeCert.codigo_certificacion,
        numero_oficio_solicitud: activeCert.numero_oficio_solicitud,
        gestion: activeCert.gestion,
        area: activeCert.area,
        fecha: activeCert.fecha || new Date().toISOString().split('T')[0],
        version: activeCert.version || 'Versión 1: 2026',
        operaciones: activeCert.operaciones || [],
        memoria: activeCert.memoria,
        partida: activeCert.partida,
        partida_literal: activeCert.partida_literal || '',
        monto_solicitado: activeCert.monto_solicitado || '0.00',
        concepto_gasto: activeCert.concepto_gasto || '',
        notas: activeCert.notas,
        solicitante_nombre: activeCert.solicitante_nombre,
        solicitante_cargo: activeCert.solicitante_cargo,
        elaborador_nombre: activeCert.elaborador_nombre,
        elaborador_cargo: activeCert.elaborador_cargo,
        estado: activeCert.estado,
      });
    }
  }, [activeCert, isCreatingNew]);

  // Iniciar creación de una nueva certificación
  const handleStartCreate = () => {
    if (!canEdit) return;
    const defaultAreaId =
      isRestrictedToOwnArea && userAreaId
        ? userAreaId
        : selectedAreaId !== 'todas'
        ? selectedAreaId
        : areas[0]?.id || 1;

    const areaObj = areas.find((a) => a.id === defaultAreaId);
    const gestObj = gestiones.find((g) => g.id === selectedGestionId);
    const anio = gestObj ? gestObj.anio : new Date().getFullYear();

    const initialOficio = areaObj ? `${areaObj.codigo}.EPTAM. Stría Nº 001/${anio.toString().slice(-2)}` : '';
    const initialCert = `UPLANIF.EPTAM.CP. Nº 001/${anio}`;

    setFormData({
      codigo_certificacion: initialCert,
      numero_oficio_solicitud: initialOficio,
      gestion: selectedGestionId || gestiones[0]?.id || 1,
      area: defaultAreaId,
      fecha: new Date().toISOString().split('T')[0],
      version: `Versión 1: ${anio}`,
      operaciones: [],
      partida: partidas[0]?.id || null,
      partida_literal: partidas[0] ? `${partidas[0].codigo} ${partidas[0].nombre}` : '',
      monto_solicitado: '0.00',
      concepto_gasto: '',
      notas:
        'Notas: El presente documento da a conocer únicamente que la solicitud en mención se encuentra programada en alineación a la Acción de Mediano Plazo (PEE) y la Acción de Corto Plazo (POA) registrados en el Plan Operativo Anual. Los aspectos presupuestarios y de contratación corresponden al área solicitante y se encuentran en el marco de las atribuciones y competencias de la Gerencia de Asuntos Administrativos EPTAM y sus instancias correspondientes según el D.S. Nº 0181 y normativa vigente relacionada.',
      solicitante_nombre: user?.first_name ? `${user.first_name} ${user.last_name}` : '',
      solicitante_cargo: user?.cargo || 'Encargado de Área',
      elaborador_nombre: 'UNIDAD DE PLANIFICACIÓN',
      elaborador_cargo: 'Técnico de Planificación',
      estado: 'BORRADOR',
    });

    setIsCreatingNew(true);
    setIsSplitEditing(true);
  };

  // Iniciar edición de la certificación activa
  const handleStartEdit = () => {
    if (!canEdit || !activeCert) return;
    setIsCreatingNew(false);
    setIsSplitEditing(true);
  };

  // Cancelar edición y volver a vista previa
  const handleCancelEdit = () => {
    setIsSplitEditing(false);
    setIsCreatingNew(false);
    if (activeCert) {
      setActiveCertId(activeCert.id);
    }
  };

  // Guardar certificación (Crear o Actualizar)
  const handleSave = async () => {
    if (!canEdit) {
      showFeedback('error', 'No tienes permisos para guardar o editar certificaciones.');
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

    if (formData.operaciones.length === 0) {
      showFeedback('error', 'Debe seleccionar al menos una operación POA.');
      return;
    }

    try {
      setActionLoading(true);
      if (isCreatingNew) {
        const nueva = await certificacionService.createCertificacion(formData);
        showFeedback('success', `Certificación POA "${nueva.codigo_certificacion}" creada exitosamente.`);
        await fetchCertificaciones();
        setActiveCertId(nueva.id);
      } else if (activeCertId) {
        const actualizada = await certificacionService.updateCertificacion(activeCertId, formData);
        showFeedback('success', `Certificación POA "${actualizada.codigo_certificacion}" actualizada exitosamente.`);
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

  // Aprobar certificación activa
  const handleAprobar = async () => {
    if (!canEdit || !activeCertId) return;
    if (!window.confirm('¿Está seguro de aprobar formalmente esta Certificación POA?')) return;

    try {
      setActionLoading(true);
      await certificacionService.aprobarCertificacion(activeCertId);
      showFeedback('success', 'Certificación POA aprobada formalmente.');
      await fetchCertificaciones();
    } catch (err: any) {
      console.error('Error al aprobar certificación:', err);
      showFeedback('error', 'No se pudo aprobar la certificación.');
    } finally {
      setActionLoading(false);
    }
  };

  // Eliminar certificación activa
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

  // Imprimir Certificado
  const handlePrint = () => {
    window.print();
  };

  // Filtrado de operaciones disponibles según el área seleccionada en el formulario
  const currentFormAreaId = formData.area;
  const operacionesDelArea = useMemo(() => {
    if (!currentFormAreaId) return [];
    return operaciones.filter((op) => op.area === currentFormAreaId && op.estado);
  }, [operaciones, currentFormAreaId]);

  const operacionesFiltradas = useMemo(() => {
    if (!searchOpTerm.trim()) return operacionesDelArea;
    const term = searchOpTerm.toLowerCase();
    return operacionesDelArea.filter(
      (op) =>
        op.codigo.toLowerCase().includes(term) ||
        op.descripcion.toLowerCase().includes(term) ||
        (op.acp_codigo && op.acp_codigo.toLowerCase().includes(term))
    );
  }, [operacionesDelArea, searchOpTerm]);

  // Toggle de selección de operaciones
  const handleToggleOperacion = (opId: number) => {
    setFormData((prev) => {
      const exists = prev.operaciones.includes(opId);
      const newOps = exists ? prev.operaciones.filter((id) => id !== opId) : [...prev.operaciones, opId];
      return { ...prev, operaciones: newOps };
    });
  };

  // Calcular la jerarquía derivada implícitamente de las operaciones seleccionadas en el formulario
  const jerarquiaEnVivo = useMemo(() => {
    const selectedOpObjs = operaciones.filter((op) => formData.operaciones.includes(op.id));
    const ampsMap = new Map<string, { codigo: string; descripcion: string }>();
    const acpsMap = new Map<string, { codigo: string; descripcion: string }>();
    const programasMap = new Map<string, { codigo: string; nombre: string }>();

    selectedOpObjs.forEach((op) => {
      if (op.amp_codigo) {
        ampsMap.set(op.amp_codigo, {
          codigo: op.amp_codigo,
          descripcion: (op as any).amp_descripcion || 'Objetivo Estratégico Institucional de Mediano Plazo (PEE)',
        });
      }
      if (op.acp_codigo) {
        acpsMap.set(op.acp_codigo, {
          codigo: op.acp_codigo,
          descripcion: op.acp_descripcion || 'Acción de Corto Plazo (POA)',
        });
      }
      if (op.area_programa_codigo || (op as any).acp_programa_codigo) {
        const pCod = op.area_programa_codigo || (op as any).acp_programa_codigo || '';
        const pNom = op.area_programa_nombre || (op as any).acp_programa_nombre || 'Programa Institucional';
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

  // Certificaciones filtradas por búsqueda
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

  // Formateador de fecha legible (ej: La Paz, 10 de junio de 2026)
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

  // Datos para renderizar la hoja (según si está en edición activa o visualización)
  const renderData = useMemo(() => {
    if (isSplitEditing) {
      const areaObj = areas.find((a) => a.id === formData.area);
      const gestObj = gestiones.find((g) => g.id === formData.gestion);
      const partObj = partidas.find((p) => p.id === formData.partida);

      return {
        codigo_certificacion: formData.codigo_certificacion || 'S/N',
        numero_oficio_solicitud: formData.numero_oficio_solicitud || 'S/N',
        fecha_texto: formatearFechaCertificado(formData.fecha),
        version: formData.version || 'Versión 1: 2026',
        area_nombre: areaObj ? areaObj.nombre.toUpperCase() : 'ÁREA SOLICITANTE',
        gestion_anio: gestObj ? gestObj.anio : new Date().getFullYear(),
        partida_texto:
          formData.partida_literal ||
          (partObj ? `${partObj.codigo} ${partObj.nombre}` : 'Partida presupuestaria no asignada'),
        solicitante_nombre: formData.solicitante_nombre || 'Firma de Solicitante',
        solicitante_cargo: formData.solicitante_cargo || 'Cargo Solicitante',
        elaborador_nombre: formData.elaborador_nombre || 'Firma de Elaborador',
        elaborador_cargo: formData.elaborador_cargo || 'Cargo Elaborador / Planificación',
        notas: formData.notas,
        estado: formData.estado || 'BORRADOR',
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
        partida_texto:
          activeCert.partida_literal ||
          (activeCert.partida_codigo ? `${activeCert.partida_codigo} ${activeCert.partida_nombre}` : 'Partida no asignada'),
        solicitante_nombre: activeCert.solicitante_nombre || 'Sin nombre',
        solicitante_cargo: activeCert.solicitante_cargo || 'Sin cargo',
        elaborador_nombre: activeCert.elaborador_nombre || 'Sin nombre',
        elaborador_cargo: activeCert.elaborador_cargo || 'Sin cargo',
        notas: activeCert.notas,
        estado: activeCert.estado,
        jerarquia: {
          amps: activeCert.jerarquia_resumen?.amps || [],
          acps: activeCert.jerarquia_resumen?.acps || [],
          operaciones: activeCert.jerarquia_resumen?.operaciones || [],
          programas: activeCert.jerarquia_resumen?.programas || [],
        },
      };
    }

    return null;
  }, [isSplitEditing, formData, activeCert, areas, gestiones, partidas, jerarquiaEnVivo]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-theme-bg">
      {/* Estilos para impresión */}
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
            }
            .no-print {
              display: none !important;
            }
          }
        `
      }} />

      {/* Barra de cabecera superior */}
      <header className="no-print bg-theme-card border-b border-theme-border px-6 py-4 shrink-0 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-theme-primary/10 text-theme-primary flex items-center justify-center font-bold">
            <FileText size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-display font-bold text-theme-main">Certificación POA</h1>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-theme-primary/10 text-theme-primary border border-theme-primary/20">
                Módulo de Gastos
              </span>
            </div>
            <p className="text-xs text-theme-muted">
              Control, emisión y articulación de Operaciones, ACP y AMP
            </p>
          </div>
        </div>

        {/* Acciones principales de la cabecera */}
        <div className="flex items-center gap-2 flex-wrap">
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
              <span className="font-bold text-theme-primary">
                {user?.area_nombre || 'Tu Gerencia'}
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

          {/* Botón Imprimir */}
          {activeCert && !isSplitEditing && (
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-theme-border text-theme-main hover:bg-theme-border/50 transition-colors shadow-sm"
              title="Imprimir o exportar PDF"
            >
              <Printer size={15} />
              <span>Imprimir</span>
            </button>
          )}

          {/* Botón Editar */}
          {canEdit && activeCert && !isSplitEditing && (
            <button
              onClick={handleStartEdit}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-sm"
            >
              <Edit3 size={15} />
              <span>Editar Certificación</span>
            </button>
          )}

          {/* Botón Aprobar */}
          {canEdit && activeCert && activeCert.estado === 'BORRADOR' && !isSplitEditing && (
            <button
              onClick={handleAprobar}
              disabled={actionLoading}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
            >
              <CheckCircle2 size={15} />
              <span>Aprobar</span>
            </button>
          )}

          {/* Botón Nueva Certificación */}
          {canEdit && !isSplitEditing && (
            <button
              onClick={handleStartCreate}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-theme-primary text-theme-primaryText shadow-sm hover:opacity-90 transition-opacity"
            >
              <Plus size={15} />
              <span>Nueva Certificación</span>
            </button>
          )}

          {/* Botón Eliminar */}
          {canEdit && activeCert && !isSplitEditing && (
            <button
              onClick={handleDelete}
              disabled={actionLoading}
              className="p-2 text-xs text-rose-500 hover:bg-rose-500/10 rounded-xl border border-rose-200 transition-colors"
              title="Eliminar certificación"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </header>

      {/* Banner de Mensajes de Feedback */}
      {feedbackMsg && (
        <div
          className={`no-print px-6 py-2.5 text-xs font-medium flex items-center gap-2 shrink-0 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
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

      {/* Aviso para roles de solo lectura (Elaborador / Trabajador) */}
      {!canEdit && (
        <div className="no-print mx-6 mt-4 p-3 rounded-xl bg-blue-50/80 border border-blue-200/80 text-blue-900 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Lock size={16} className="text-blue-600 shrink-0" />
            <span>
              <strong>Modo Solo Lectura:</strong> Tu rol (<strong>{rolName || 'Usuario'}</strong>) te
              permite consultar e imprimir la certificación de tu área, pero la edición está reservada para
              <strong> Gerente</strong> y <strong>Planificador</strong>.
            </span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-200/60 px-2 py-0.5 rounded text-blue-800">
            Vista Protegida
          </span>
        </div>
      )}

      {/* Contenido Principal */}
      <div className="flex-1 overflow-auto p-6 custom-scrollbar">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center text-theme-muted gap-3">
            <div className="w-8 h-8 border-3 border-theme-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-medium">Cargando módulo de certificaciones...</p>
          </div>
        ) : isSplitEditing ? (
          /* ========================================================================= */
          /* MODO EDICIÓN LADO A LADO (SPLIT VIEW)                                     */
          /* ========================================================================= */
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            {/* PANEL IZQUIERDO: FORMULARIO DE LLENADO / EDICIÓN (5 Columnas) */}
            <div className="xl:col-span-5 bg-theme-card border border-theme-border rounded-2xl p-5 shadow-sm space-y-5 no-print sticky top-0">
              <div className="flex items-center justify-between border-b border-theme-border pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                    <Edit3 size={16} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-theme-main">
                      {isCreatingNew ? 'Nueva Certificación POA' : 'Editar Certificación POA'}
                    </h2>
                    <p className="text-[11px] text-theme-muted">
                      Los cambios se reflejan en tiempo real a la derecha
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCancelEdit}
                    disabled={actionLoading}
                    className="px-3 py-1.5 text-xs font-semibold text-theme-muted hover:text-theme-main hover:bg-theme-border/50 rounded-xl transition-colors"
                  >
                    Cancelar
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

              {/* Formulario de campos */}
              <div className="space-y-4 text-xs max-h-[calc(100vh-220px)] overflow-y-auto pr-1 custom-scrollbar">
                {/* 1. Área / Unidad Solicitante */}
                <div>
                  <label className="block font-semibold text-theme-main mb-1">
                    Unidad Solicitante / Gerencia <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.area}
                    disabled={isRestrictedToOwnArea}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        area: Number(e.target.value),
                        operaciones: [], // reiniciar selección al cambiar área
                      }))
                    }
                    className="w-full bg-theme-bg border border-theme-border rounded-xl px-3 py-2 text-theme-main font-medium focus:ring-2 focus:ring-theme-primary/20 focus:outline-none disabled:opacity-75"
                  >
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>
                        [{a.codigo}] {a.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Selección de Operaciones (Soporta 2 o más) */}
                <div className="p-3 bg-theme-bg/60 border border-theme-border rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-theme-main flex items-center gap-1.5">
                      <Layers size={14} className="text-theme-primary" />
                      <span>Operaciones POA Asociadas ({formData.operaciones.length} seleccionada(s))</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-theme-muted font-semibold uppercase">
                      Puede seleccionar 2 o más
                    </span>
                  </div>

                  <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-2.5 text-theme-muted" />
                    <input
                      type="text"
                      placeholder="Buscar operación por código o descripción..."
                      value={searchOpTerm}
                      onChange={(e) => setSearchOpTerm(e.target.value)}
                      className="w-full bg-theme-card border border-theme-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-theme-main focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                    {operacionesFiltradas.length === 0 ? (
                      <p className="text-[11px] text-theme-muted py-2 text-center italic">
                        No hay operaciones disponibles para esta área con el filtro actual.
                      </p>
                    ) : (
                      operacionesFiltradas.map((op) => {
                        const isSelected = formData.operaciones.includes(op.id);
                        return (
                          <div
                            key={op.id}
                            onClick={() => handleToggleOperacion(op.id)}
                            className={`p-2 rounded-lg border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                              isSelected
                                ? 'bg-theme-primary/10 border-theme-primary/40 text-theme-main font-medium shadow-2xs'
                                : 'bg-theme-card border-theme-border/60 hover:bg-theme-border/30 text-theme-muted'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}} // handled by div
                              className="mt-0.5 rounded text-theme-primary focus:ring-0 cursor-pointer"
                            />
                            <div className="flex-1 leading-snug">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-theme-primary font-mono">
                                  {op.codigo}
                                </span>
                                {op.acp_codigo && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-200 text-gray-700 font-mono">
                                    ACP: {op.acp_codigo}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] mt-0.5 text-theme-main line-clamp-2">
                                {op.descripcion}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Resumen de Jerarquía Derivada */}
                  {jerarquiaEnVivo.operaciones.length > 0 && (
                    <div className="mt-2 p-2.5 rounded-lg bg-theme-primary/5 border border-theme-primary/20 text-[11px] space-y-1 text-theme-main">
                      <div className="flex items-center gap-1 font-bold text-theme-primary">
                        <Sparkles size={13} />
                        <span>Jerarquía Implícita Derivada:</span>
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

                {/* 3. Números de Oficio y Certificación */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-theme-main mb-1">
                      Nº Oficio de Solicitud <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.numero_oficio_solicitud}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, numero_oficio_solicitud: e.target.value }))
                      }
                      placeholder="Ej: GCIA.OPS.EPTAM. Stría Nº 221/26"
                      className="w-full bg-theme-bg border border-theme-border rounded-xl px-3 py-2 text-theme-main focus:ring-2 focus:ring-theme-primary/20 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-theme-main mb-1">
                      Nº Certificación POA <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.codigo_certificacion}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, codigo_certificacion: e.target.value }))
                      }
                      placeholder="Ej: UPLANIF.EPTAM.CP. Nº 164/2026"
                      className="w-full bg-theme-bg border border-theme-border rounded-xl px-3 py-2 text-theme-main font-bold focus:ring-2 focus:ring-theme-primary/20 focus:outline-none"
                    />
                  </div>
                </div>

                {/* 4. Fecha y Versión */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-theme-main mb-1">Fecha de Emisión</label>
                    <input
                      type="date"
                      value={formData.fecha}
                      onChange={(e) => setFormData((prev) => ({ ...prev, fecha: e.target.value }))}
                      className="w-full bg-theme-bg border border-theme-border rounded-xl px-3 py-2 text-theme-main focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-theme-main mb-1">Versión</label>
                    <input
                      type="text"
                      value={formData.version}
                      onChange={(e) => setFormData((prev) => ({ ...prev, version: e.target.value }))}
                      placeholder="Ej: Versión 1: 2026"
                      className="w-full bg-theme-bg border border-theme-border rounded-xl px-3 py-2 text-theme-main focus:outline-none"
                    />
                  </div>
                </div>

                {/* 5. Partida Presupuestaria */}
                <div>
                  <label className="block font-semibold text-theme-main mb-1">
                    Partida Presupuestaria
                  </label>
                  <select
                    value={formData.partida || ''}
                    onChange={(e) => {
                      const pid = e.target.value ? Number(e.target.value) : null;
                      const pObj = partidas.find((p) => p.id === pid);
                      setFormData((prev) => ({
                        ...prev,
                        partida: pid,
                        partida_literal: pObj ? `${pObj.codigo} ${pObj.nombre}` : '',
                      }));
                    }}
                    className="w-full bg-theme-bg border border-theme-border rounded-xl px-3 py-2 text-theme-main focus:outline-none"
                  >
                    <option value="">-- Seleccione una Partida del Catálogo --</option>
                    {partidas.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.codigo} - {p.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 6. Firmantes */}
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

                {/* 7. Notas Legales */}
                <div>
                  <label className="block font-semibold text-theme-main mb-1">
                    Notas y Observaciones
                  </label>
                  <textarea
                    rows={3}
                    value={formData.notas}
                    onChange={(e) => setFormData((prev) => ({ ...prev, notas: e.target.value }))}
                    className="w-full bg-theme-bg border border-theme-border rounded-xl p-2.5 text-theme-main focus:outline-none text-[11px]"
                  />
                </div>
              </div>
            </div>

            {/* PANEL DERECHO: VISTA PREVIA EN VIVO (7 Columnas) */}
            <div className="xl:col-span-7 space-y-3">
              <div className="no-print flex items-center justify-between px-2">
                <div className="flex items-center gap-2 text-xs text-theme-muted font-semibold">
                  <Eye size={15} className="text-theme-primary" />
                  <span>Previsualización en tiempo real del documento</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg border border-theme-border text-theme-main hover:bg-theme-border/50"
                  >
                    <Printer size={13} />
                    <span>Imprimir Prueba</span>
                  </button>
                </div>
              </div>

              {/* Render de la Hoja Oficial */}
              <div id="cert-printable-container">
                <OfficialCertificateSheet data={renderData} />
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* MODO VISTA PREVIA Y GESTIÓN DE CERTIFICACIONES                            */
          /* ========================================================================= */
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* Barra de Selección / Tabs de Certificaciones Existentes */}
            {certificaciones.length > 0 && (
              <div className="no-print bg-theme-card border border-theme-border rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-theme-primary" />
                    <span className="text-xs font-bold text-theme-main uppercase tracking-wider">
                      Certificaciones Registradas ({certificaciones.length})
                    </span>
                  </div>

                  <div className="relative w-64">
                    <Search size={14} className="absolute left-2.5 top-2.5 text-theme-muted" />
                    <input
                      type="text"
                      placeholder="Buscar por Nº o solicitante..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-theme-bg border border-theme-border rounded-xl pl-8 pr-3 py-1.5 text-xs text-theme-main focus:outline-none"
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
                              : isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {c.estado}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Hoja del Certificado o Estado Vacío */}
            {activeCert ? (
              <div id="cert-printable-container">
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
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE VISUAL: HOJA FORMATEADA OFICIAL DE CERTIFICACIÓN POA
// ─────────────────────────────────────────────────────────────────────────────
interface OfficialCertificateSheetProps {
  data: {
    codigo_certificacion: string;
    numero_oficio_solicitud: string;
    fecha_texto: string;
    version: string;
    area_nombre: string;
    gestion_anio: number;
    partida_texto: string;
    solicitante_nombre: string;
    solicitante_cargo: string;
    elaborador_nombre: string;
    elaborador_cargo: string;
    notas: string;
    estado: string;
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

      {/* Tabla 1: Oficio y Certificación */}
      <table className="w-full border-collapse border border-black text-xs mb-4">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-black p-2 w-1/2 text-center font-bold">Nº Oficio de Solicitud</th>
            <th className="border border-black p-2 w-1/2 text-center font-bold">Nº Certificación POA</th>
          </tr>
        </thead>
        <tbody>
          <tr className="text-center font-medium">
            <td className="border border-black p-2.5">{data.numero_oficio_solicitud || 'S/N'}</td>
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
      <table className="w-full border-collapse border border-black text-xs mb-5">
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

          {/* OPERACIONES (Soporte para 1, 2 o más) */}
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

      {/* Tabla 4: Partida Presupuestaria */}
      <table className="w-full border-collapse border border-black text-xs mb-6">
        <tbody>
          <tr>
            <td className="border border-black p-2 font-bold uppercase w-1/3 bg-gray-100">
              Partida Presupuestaria
            </td>
            <td className="border border-black p-2 font-medium">{data.partida_texto}</td>
          </tr>
        </tbody>
      </table>

      {/* Notas Legales */}
      <div className="text-[11px] mb-8 space-y-2 text-justify text-gray-800 leading-relaxed border-t border-b border-gray-200 py-3">
        <p>{data.notas}</p>
      </div>

      {/* Tabla 5: Firmas */}
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
              : 'bg-amber-100 text-amber-800 border-amber-300'
          }`}
        >
          {data.estado}
        </span>
      </div>
    </div>
  );
}

