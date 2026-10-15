import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FileText,
  Printer,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Building2,
  Send,
  Coins,
  ShieldCheck,
  Ban,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useGestion } from '../../contexts/GestionContext';
import {
  Gestion,
  Area,
  getAreas,
} from '../../services/presupuestoService';
import { certificacionService } from '../../services/certificacionService';
import { CertificacionPOA, CertificacionFormData } from '../../types/certificacion';
import alertService from '../../utils/alerts';
import {
  PageHeader,
  GestionSelector,
  TabsFilter,
  DataTable,
  Column,
  Button,
  StatusBadge,
  Dropdown,
  DropdownItem,
} from '../../components/commons';
import {
  CertificacionFormModal,
  CertificacionObservarModal,
  CertificacionRechazarModal,
  CertificacionDetalleModal,
  BoletaCertificacionModal,
} from '../../features/certificaciones/components';
import type { ModoRechazo } from '../../features/certificaciones/components/CertificacionRechazarModal';

export default function CertificacionesPage() {
  const { user } = useAuth();
  const rolName = (user?.rol_nombre || '').toUpperCase().trim();
  const rolClean = rolName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // ── 1. Roles y Permisos Institucionales ──────────────────────────────────────────
  const isSuperAdmin = Boolean(user?.is_superuser) || rolClean.includes('ADMIN');
  const isPlanificador = !isSuperAdmin && rolClean.includes('PLANIFIC');
  const isPresupuestos =
    !isSuperAdmin &&
    (rolClean.includes('APROBAD') ||
      rolClean.includes('PRESUPUEST') ||
      rolClean.includes('FINANZ'));
  const isTesoreria = !isSuperAdmin && rolClean.includes('TESORER');
  const isGerente = !isSuperAdmin && rolClean.includes('GERENT');
  const isElaborador = !isSuperAdmin && rolClean.includes('ELABORAD');
  const isTrabajador =
    !isSuperAdmin &&
    (rolClean.includes('TRABAJAD') ||
      (!isPlanificador && !isPresupuestos && !isTesoreria && !isGerente && !isElaborador));

  // Roles institucionales globales (pueden ver cualquier gerencia y cambiar filtros)
  const isGlobalRole = isSuperAdmin || isPlanificador || isPresupuestos || isTesoreria;

  // Gerente y Admin pueden solicitar formalmente
  const canCreate = isSuperAdmin || isGerente;
  // Planificador emite certificación técnica (solo en base a solicitudes recibidas)
  const canCertify = isSuperAdmin || isPlanificador;
  // Presupuestos otorga visto bueno final financiero
  const canApprove = isSuperAdmin || isPresupuestos;
  // Tesorería confirma la salida de dinero (desembolso)
  const canDisburse = isSuperAdmin || isTesoreria;
  // Gerente puede cancelar su propia solicitud si ya no requiere el gasto o ante observaciones
  const canCancelGerente = isSuperAdmin || isGerente;
  // Permiso de impresión oficial: SOLO Planificación puede imprimir ("SOLO PLANIFICACION PUEDE IMPRIMIR, nadie mas")
  const canPrint = isPlanificador;

  // Área del usuario (para Gerente, Trabajador y Elaborador)
  const userAreaId = user?.area_id || (user as any)?.seccion?.area_id || null;

  // ── 2. Estados Principales ───────────────────────────────────────────────────
  const {
    gestiones,
    gestionActivaId: selectedGestionId,
    setGestionActivaId: setSelectedGestionId,
  } = useGestion();
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<number | 'todas'>('todas');
  const [certificaciones, setCertificaciones] = useState<CertificacionPOA[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Pestaña inicial según rol
  const defaultTab = useMemo(() => {
    if (isPlanificador) return 'PENDIENTE_PLANIFICACION';
    if (isPresupuestos) return 'PENDIENTE_PRESUPUESTOS';
    if (isTesoreria) return 'PENDIENTE_TESORERIA';
    return 'TODAS';
  }, [isPlanificador, isPresupuestos, isTesoreria]);

  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modales
  const [formModalOpen, setFormModalOpen] = useState<boolean>(false);
  const [observarModalOpen, setObservarModalOpen] = useState<boolean>(false);
  const [rechazarModalOpen, setRechazarModalOpen] = useState<boolean>(false);
  const [modoRechazo, setModoRechazo] = useState<ModoRechazo>('rechazar_planificacion');
  const [detalleModalOpen, setDetalleModalOpen] = useState<boolean>(false);
  const [boletaModalOpen, setBoletaModalOpen] = useState<boolean>(false);

  // Elemento activo y correlativos sugeridos
  const [selectedCert, setSelectedCert] = useState<CertificacionPOA | null>(null);
  const [siguienteCorrelativoGlobal, setSiguienteCorrelativoGlobal] = useState<string>('');
  const [siguienteCorrelativoArea, setSiguienteCorrelativoArea] = useState<string>('');

  // Fijar pestaña por defecto cuando se determine el rol
  useEffect(() => {
    if (isPlanificador) {
      setActiveTab('PENDIENTE_PLANIFICACION');
    } else if (isPresupuestos) {
      setActiveTab('PENDIENTE_PRESUPUESTOS');
    } else if (isTesoreria) {
      setActiveTab('PENDIENTE_TESORERIA');
    }
  }, [isPlanificador, isPresupuestos, isTesoreria]);

  // ── 3. Carga Inicial de Áreas ─────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    getAreas()
      .then((aList) => {
        if (!isMounted) return;
        setAreas(aList);

        // Si es rol de área (Gerente, Trabajador, Elaborador), fijar a su respectiva área
        if (!isGlobalRole && userAreaId) {
          setSelectedAreaId(userAreaId);
        }
      })
      .catch((err) => {
        console.error('Error al inicializar áreas:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [isGlobalRole, userAreaId]);

  // ── 4. Cargar Certificaciones POA ────────────────────────────────────────────
  const fetchCertificaciones = useCallback(async () => {
    if (!selectedGestionId) return;
    setLoading(true);
    try {
      const params: Record<string, any> = { gestion: selectedGestionId };
      if (!isGlobalRole && userAreaId) {
        params.area = userAreaId;
      } else if (selectedAreaId && selectedAreaId !== 'todas') {
        params.area = selectedAreaId;
      }
      const data = await certificacionService.getCertificaciones(params);
      setCertificaciones(data);
    } catch (err) {
      console.error('Error al cargar certificaciones POA:', err);
      alertService.toast('Error al consultar las certificaciones', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedGestionId, selectedAreaId, isGlobalRole, userAreaId]);

  useEffect(() => {
    fetchCertificaciones();
  }, [fetchCertificaciones]);

  // Gestión activa seleccionada
  const activeGestion = useMemo(() => {
    return gestiones.find((g) => g.id === selectedGestionId) || null;
  }, [gestiones, selectedGestionId]);

  // ── 5. Métricas y Contadores KPI para Pestañas ────────────────────────────────
  const counts = useMemo(() => {
    const list = certificaciones;
    return {
      total: list.length,
      borrador: list.filter((c) => c.estado === 'BORRADOR').length,
      pendiente_planificacion: list.filter((c) => c.estado === 'PENDIENTE_PLANIFICACION').length,
      pendiente_presupuestos: list.filter((c) => c.estado === 'PENDIENTE_PRESUPUESTOS').length,
      pendiente_tesoreria: list.filter((c) => c.estado === 'PENDIENTE_TESORERIA').length,
      en_tramite: list.filter(
        (c) =>
          c.estado === 'PENDIENTE_PLANIFICACION' ||
          c.estado === 'PENDIENTE_PRESUPUESTOS' ||
          c.estado === 'PENDIENTE_TESORERIA'
      ).length,
      aprobado: list.filter((c) => c.estado === 'APROBADO').length,
      observado: list.filter((c) => c.estado === 'OBSERVADO').length,
      rechazado: list.filter((c) => c.estado === 'RECHAZADO').length,
      anulado: list.filter((c) => c.estado === 'ANULADO').length,
      rechazado_o_anulado: list.filter((c) => c.estado === 'RECHAZADO' || c.estado === 'ANULADO').length,
      observadas_o_rechazadas: list.filter(
        (c) => c.estado === 'OBSERVADO' || c.estado === 'RECHAZADO' || c.estado === 'ANULADO'
      ).length,
    };
  }, [certificaciones]);

  // ── 6. Definición Dinámica de Pestañas según Rol ─────────────────────────────
  const tabs = useMemo(() => {
    if (isTrabajador || isElaborador) {
      // Trabajador / Elaborador: Solo ve sus certificados, observaciones y aprobadas de su área
      return [
        { id: 'TODAS', label: 'Todas las Solicitudes', count: counts.total },
        { id: 'APROBADO', label: 'Certificados Aprobados', count: counts.aprobado },
        { id: 'OBSERVADO', label: 'Observadas', count: counts.observado },
        { id: 'RECHAZADO', label: 'Rechazadas / Denegadas', count: counts.rechazado_o_anulado },
      ];
    }

    if (isGerente) {
      // Gerente: Ve estado y seguimiento de sus solicitudes sin bandejas internas ajenas
      return [
        { id: 'TODAS', label: 'Todas', count: counts.total },
        { id: 'BORRADOR', label: 'Borradores', count: counts.borrador },
        { id: 'EN_TRAMITE', label: 'En Trámite', count: counts.en_tramite },
        { id: 'APROBADO', label: 'Certificados Aprobados', count: counts.aprobado },
        { id: 'OBSERVADO', label: 'Observadas', count: counts.observado },
        { id: 'RECHAZADO', label: 'Rechazadas / Canceladas', count: counts.rechazado_o_anulado },
      ];
    }

    if (isPlanificador) {
      // Planificador: Solo ve Por Certificar, Enviadas, Aprobadas POA y Observadas (que unifica rechazadas)
      return [
        { id: 'PENDIENTE_PLANIFICACION', label: 'Por Certificar', count: counts.pendiente_planificacion },
        { id: 'PENDIENTE_PRESUPUESTOS', label: 'Enviadas', count: counts.pendiente_presupuestos },
        { id: 'APROBADO', label: 'Aprobadas POA', count: counts.aprobado },
        { id: 'OBSERVADO', label: 'Observadas', count: counts.observadas_o_rechazadas },
      ];
    }

    if (isPresupuestos) {
      // Presupuestos: Su bandeja de trabajo es el control financiero y seguimiento a Tesorería
      return [
        { id: 'PENDIENTE_PRESUPUESTOS', label: 'Por Revisar', count: counts.pendiente_presupuestos },
        { id: 'PENDIENTE_TESORERIA', label: 'En Tesorería', count: counts.pendiente_tesoreria },
        { id: 'APROBADO', label: 'Revisadas y Pagadas', count: counts.aprobado },
        { id: 'OBSERVADO', label: 'Observadas', count: counts.observadas_o_rechazadas },
      ];
    }

    if (isTesoreria) {
      // Tesorería (Lic. Zaida): Solo confirma desembolso de certificaciones aprobadas
      return [
        { id: 'PENDIENTE_TESORERIA', label: 'Por Desembolsar', count: counts.pendiente_tesoreria },
        { id: 'APROBADO', label: 'Desembolsados', count: counts.aprobado },
        { id: 'TODAS', label: 'Todas las Solicitudes', count: counts.total },
      ];
    }

    // Administrador General / SuperAdmin
    return [
      { id: 'TODAS', label: 'Todas', count: counts.total },
      { id: 'BORRADOR', label: 'Borrador', count: counts.borrador },
      { id: 'PENDIENTE_PLANIFICACION', label: 'En Planificación', count: counts.pendiente_planificacion },
      { id: 'PENDIENTE_PRESUPUESTOS', label: 'En Presupuestos', count: counts.pendiente_presupuestos },
      { id: 'PENDIENTE_TESORERIA', label: 'En Tesorería', count: counts.pendiente_tesoreria },
      { id: 'APROBADO', label: 'Aprobadas / Pagadas', count: counts.aprobado },
      { id: 'OBSERVADO', label: 'Observadas', count: counts.observado },
      { id: 'RECHAZADO', label: 'Rechazadas / Canceladas', count: counts.rechazado_o_anulado },
    ];
  }, [
    isTrabajador,
    isElaborador,
    isGerente,
    isPlanificador,
    isPresupuestos,
    isTesoreria,
    counts,
  ]);

  // ── 7. Filtrado de la Tabla ──────────────────────────────────────────────────
  const filteredCertificaciones = useMemo(() => {
    return certificaciones.filter((item) => {
      // Filtro por pestaña de estado
      if (activeTab !== 'TODAS') {
        if (activeTab === 'EN_TRAMITE') {
          if (
            item.estado !== 'PENDIENTE_PLANIFICACION' &&
            item.estado !== 'PENDIENTE_PRESUPUESTOS' &&
            item.estado !== 'PENDIENTE_TESORERIA'
          ) {
            return false;
          }
        } else if (activeTab === 'OBSERVADO' && (isPlanificador || isPresupuestos)) {
          // Para Planificador y Presupuestos, 'OBSERVADO' unifica Observadas, Rechazadas y Anuladas
          if (item.estado !== 'OBSERVADO' && item.estado !== 'RECHAZADO' && item.estado !== 'ANULADO') {
            return false;
          }
        } else if (activeTab === 'RECHAZADO') {
          if (item.estado !== 'RECHAZADO' && item.estado !== 'ANULADO') {
            return false;
          }
        } else if (item.estado !== activeTab) {
          return false;
        }
      }

      // Filtro por término de búsqueda
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesHojaRuta = (item.hoja_ruta || '').toLowerCase().includes(query);
        const matchesCodigoCert = (item.codigo_certificacion || '').toLowerCase().includes(query);
        const matchesOficio = (item.numero_oficio_solicitud || '').toLowerCase().includes(query);
        const matchesArea = (item.area_nombre || '').toLowerCase().includes(query);
        const matchesConcepto = (item.concepto_gasto || '').toLowerCase().includes(query);
        const matchesMemoria = (item.memoria_codigo || '').toLowerCase().includes(query);
        const matchesPartida =
          (item.partida_codigo || '').toLowerCase().includes(query) ||
          (item.partida_nombre || '').toLowerCase().includes(query);
        const matchesSolicitante = (item.solicitante_nombre || '').toLowerCase().includes(query);

        if (
          !matchesHojaRuta &&
          !matchesCodigoCert &&
          !matchesOficio &&
          !matchesArea &&
          !matchesConcepto &&
          !matchesMemoria &&
          !matchesPartida &&
          !matchesSolicitante
        ) {
          return false;
        }
      }

      return true;
    });
  }, [certificaciones, activeTab, searchTerm]);

  // ── 8. Manejo de Acciones de Workflow ────────────────────────────────────────
  // Enviar a revisión de Planificación (Gerente)
  const handleEnviarRevision = async (item: CertificacionPOA) => {
    const confirm = await alertService.confirm({
      title: '¿Enviar solicitud a Planificación?',
      text: `La solicitud con Hoja de Ruta "${item.hoja_ruta}" será remitida a la Unidad de Planificación para revisión de alineación técnica y emisión de la Certificación POA.`,
      confirmButtonText: 'Sí, enviar ahora',
      cancelButtonText: 'Cancelar',
      icon: 'question',
    });
    if (!confirm) return;

    try {
      await certificacionService.enviarRevision(item.id);
      alertService.toast(
        'Solicitud enviada a la Unidad de Planificación para revisión técnica exitosamente.',
        'success'
      );
      await fetchCertificaciones();
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Error al enviar la solicitud.';
      alertService.toast(msg, 'error');
    }
  };

  // Abrir vista previa oficial y detalle de Certificación POA
  const handleOpenDetalle = async (item: CertificacionPOA) => {
    setSelectedCert(item);
    if (!item.codigo_certificacion && item.gestion && item.area) {
      try {
        const nextNum = await certificacionService.getSiguienteCorrelativo(
          item.gestion,
          item.area
        );
        setSiguienteCorrelativoGlobal(nextNum.codigo_certificacion || '');
        setSiguienteCorrelativoArea(nextNum.numero_oficio_solicitud || '');
      } catch {
        setSiguienteCorrelativoGlobal('');
        setSiguienteCorrelativoArea('');
      }
    } else {
      setSiguienteCorrelativoGlobal(item.codigo_certificacion || '');
      setSiguienteCorrelativoArea(item.numero_oficio_solicitud || '');
    }
    setDetalleModalOpen(true);
  };

  // Planificación certifica
  const handleCertificarPlanificacion = async (data: {
    codigo_certificacion?: string;
    numero_oficio_solicitud?: string;
    observacion?: string;
    categoria_programatica_codigo?: string;
    categoria_programatica?: string;
    notas?: string;
    memoria_id?: number;
    partida_id?: number;
    operacion_id?: number;
  }) => {
    if (!selectedCert) return;
    try {
      const res = await certificacionService.certificarPlanificacion(selectedCert.id, data);
      alertService.toast(
        'Ya se imprimió, puede pasar a recoger la certificación (remitida a Presupuestos).',
        'success'
      );
      await fetchCertificaciones();

      // Auto-abrir la boleta oficial para impresión inmediata por Planificación
      const updatedCert: CertificacionPOA = {
        ...selectedCert,
        codigo_certificacion: res?.codigo_certificacion || data.codigo_certificacion || selectedCert.codigo_certificacion,
        numero_oficio_solicitud: res?.numero_oficio_solicitud || data.numero_oficio_solicitud || selectedCert.numero_oficio_solicitud,
        estado: 'PENDIENTE_PRESUPUESTOS',
        estado_display: 'En Revisión (Presupuestos)',
      };
      setSelectedCert(updatedCert);
      setBoletaModalOpen(true);
    } catch (err: any) {
      throw err;
    }
  };

  // Presupuestos otorga visto bueno final financiero
  const handleAprobarPresupuestos = async (
    data?: { observacion?: string; memoria_id?: number; partida_id?: number } | string
  ) => {
    if (!selectedCert) return;
    try {
      await certificacionService.aprobarPresupuestos(selectedCert.id, data);
      alertService.toast(
        'Visto bueno financiero otorgado. Solicitud remitida a Tesorería para confirmación de salida de dinero.',
        'success'
      );
      await fetchCertificaciones();
    } catch (err: any) {
      throw err;
    }
  };

  // Presupuestos devuelve a Planificación para reajuste técnico
  const handleDevolverPlanificacion = async (motivo: string) => {
    if (!selectedCert) return;
    try {
      await certificacionService.devolverPlanificacion(selectedCert.id, motivo);
      alertService.toast(
        'Certificación devuelta a Planificación para reajuste técnico.',
        'info'
      );
      await fetchCertificaciones();
    } catch (err: any) {
      throw err;
    }
  };

  // Tesorería (Lic. Zaida) confirma salida de dinero y registro automático de gasto
  const handleConfirmarDesembolso = async (item: CertificacionPOA) => {
    const montoStr = Number(item.monto_solicitado).toLocaleString('es-BO', { minimumFractionDigits: 2 });
    const confirm = await alertService.confirm({
      title: '¿Confirmar salida del dinero?',
      text: `Tesorería (Lic. Zaida): Confirmar que el dinero ya salió por un monto de Bs. ${montoStr} para la Hoja de Ruta "${item.hoja_ruta}". Al confirmar, el sistema registrará automáticamente el Gasto Ejecutado en el presupuesto institucional.`,
      confirmButtonText: 'Sí, el dinero ya salió',
      cancelButtonText: 'Cancelar',
      icon: 'question',
    });
    if (!confirm) return;

    try {
      const res = await certificacionService.confirmarDesembolso(item.id);
      alertService.toast(
        `¡Dinero desembolsado! Se registró automáticamente como Gasto con comprobante ${res.comprobante_pago || 'de desembolso'}.`,
        'success'
      );
      await fetchCertificaciones();
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        err?.response?.data?.monto_solicitado?.[0] ||
        'Error al confirmar el desembolso.';
      alertService.toast(msg, 'error');
    }
  };

  // Observar solicitud
  const handleConfirmObservacion = async (motivo: string) => {
    if (!selectedCert) return;
    try {
      await certificacionService.observarCertificacion(selectedCert.id, motivo);
      alertService.toast(
        'Certificación devuelta con observaciones a la gerencia solicitante para ajuste.',
        'info'
      );
      await fetchCertificaciones();
    } catch (err: any) {
      throw err;
    }
  };

  // Rechazar / Denegar / Cancelar
  const handleOpenRechazoPlanif = (item: CertificacionPOA) => {
    setSelectedCert(item);
    setModoRechazo('rechazar_planificacion');
    setRechazarModalOpen(true);
  };

  const handleOpenDenegarPresup = (item: CertificacionPOA) => {
    setSelectedCert(item);
    setModoRechazo('denegar_presupuestos');
    setRechazarModalOpen(true);
  };

  const handleOpenCancelarGerente = (item: CertificacionPOA) => {
    setSelectedCert(item);
    setModoRechazo('cancelar_gerente');
    setRechazarModalOpen(true);
  };

  const handleConfirmRechazo = async (motivo: string) => {
    if (!selectedCert) return;
    try {
      if (modoRechazo === 'cancelar_gerente') {
        await certificacionService.cancelarCertificacion(selectedCert.id, motivo);
        alertService.toast('Solicitud cancelada por el área exitosamente.', 'info');
      } else {
        await certificacionService.rechazarCertificacion(selectedCert.id, motivo);
        alertService.toast(
          modoRechazo === 'rechazar_planificacion'
            ? 'Solicitud rechazada formalmente por Planificación.'
            : 'Visto bueno denegado y certificación rechazada formalmente.',
          'info'
        );
      }
      setRechazarModalOpen(false);
      setDetalleModalOpen(false);
      await fetchCertificaciones();
    } catch (err: any) {
      throw err;
    }
  };

  // Eliminar borrador
  const handleDeleteCertificacion = async (item: CertificacionPOA) => {
    const confirm = await alertService.confirm({
      title: '¿Eliminar solicitud en borrador?',
      text: `Se eliminará definitivamente la solicitud con Hoja de Ruta "${item.hoja_ruta}".`,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      isDanger: true,
    });
    if (!confirm) return;

    try {
      await certificacionService.deleteCertificacion(item.id);
      alertService.toast('Solicitud eliminada correctamente.', 'success');
      await fetchCertificaciones();
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Error al eliminar la solicitud.';
      alertService.toast(msg, 'error');
    }
  };

  // Crear o actualizar solicitud desde el modal del Gerente
  const handleFormSubmit = async (data: CertificacionFormData, enviarDirecto = false) => {
    try {
      let savedCert: CertificacionPOA;
      if (selectedCert) {
        savedCert = await certificacionService.updateCertificacion(selectedCert.id, data);
        alertService.toast('Solicitud actualizada con éxito.', 'success');
      } else {
        savedCert = await certificacionService.createCertificacion(data);
        alertService.toast('Solicitud registrada con éxito.', 'success');
      }

      if (enviarDirecto && savedCert?.id) {
        await certificacionService.enviarRevision(savedCert.id);
        alertService.toast(
          'Solicitud remitida a la Unidad de Planificación exitosamente.',
          'success'
        );
      }

      await fetchCertificaciones();
    } catch (err: any) {
      throw err;
    }
  };

  // ── 9. Definición de Columnas de la DataTable ────────────────────────────────
  const columns: Column<CertificacionPOA>[] = [
    {
      header: 'Hoja de Ruta / CITE',
      minWidth: '180px',
      render: (row) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-theme-main">
            <FileText size={15} className="text-theme-primary shrink-0" />
            <span className="truncate font-mono" title={row.hoja_ruta}>
              {row.hoja_ruta}
            </span>
          </div>
          <span
            className={`inline-block px-2 py-0.5 text-[10px] font-extrabold rounded-md shadow-xs ${
              row.es_contratacion
                ? 'bg-amber-400 text-slate-950 border border-amber-500 font-bold'
                : 'bg-theme-base text-theme-muted border border-theme-border font-medium'
            }`}
          >
            {row.es_contratacion ? 'Contratación POA' : 'Gasto Directo'}
          </span>
        </div>
      ),
    },
    {
      header: 'Unidad Solicitante',
      minWidth: '170px',
      render: (row) => (
        <div>
          <span className="font-semibold text-theme-main block truncate" title={row.area_nombre}>
            {row.area_nombre}
          </span>
          <span className="text-[11px] text-theme-muted font-sans">
            {row.fecha}
          </span>
        </div>
      ),
    },
    {
      header: 'Memoria POA',
      minWidth: '140px',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-md bg-theme-base border border-theme-border text-xs font-mono font-bold text-theme-main">
            {row.memoria_codigo || 'S/M'}
          </span>
        </div>
      ),
    },
    {
      header: 'Monto Solicitado',
      minWidth: '130px',
      align: 'right',
      render: (row) => {
        const monto = Number(row.monto_solicitado) || 0;
        return (
          <div className="text-right">
            <span className="text-sm font-extrabold text-theme-main font-mono">
              Bs. {monto.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Código Certificación',
      minWidth: '170px',
      render: (row) => {
        if (!row.codigo_certificacion) {
          return <span className="text-xs text-theme-muted font-mono">-</span>;
        }
        return (
          <span
            className="font-mono font-bold text-xs text-theme-main bg-theme-base px-2.5 py-1 rounded-lg border border-theme-border truncate inline-block"
            title={row.codigo_certificacion}
          >
            {row.codigo_certificacion}
          </span>
        );
      },
    },
    {
      header: 'Estado',
      minWidth: '130px',
      align: 'center',
      render: (row) => {
        if (isPlanificador) {
          if (row.estado === 'PENDIENTE_PLANIFICACION') {
            return <StatusBadge status="PENDIENTE_PLANIFICACION" label="Revisar" />;
          }
          if (row.estado === 'PENDIENTE_PRESUPUESTOS') {
            return <StatusBadge status="PENDIENTE_GERENCIA" label="Enviada" />;
          }
          if (row.estado === 'PENDIENTE_TESORERIA') {
            return <StatusBadge status="PENDIENTE_TESORERIA" label="En Tesorería" />;
          }
          if (row.estado === 'APROBADO') {
            return <StatusBadge status="APROBADO" label="Revisado" />;
          }
          if (row.estado === 'OBSERVADO') {
            return <StatusBadge status="OBSERVADO" label="Observado" />;
          }
          if (row.estado === 'RECHAZADO' || row.estado === 'ANULADO') {
            return <StatusBadge status="RECHAZADO" label="Rechazado" />;
          }
        }
        if (isPresupuestos) {
          if (row.estado === 'PENDIENTE_PRESUPUESTOS') {
            return <StatusBadge status="PENDIENTE_PRESUPUESTOS" label="Revisar" />;
          }
          if (row.estado === 'PENDIENTE_TESORERIA') {
            return <StatusBadge status="PENDIENTE_TESORERIA" label="En Tesorería" />;
          }
          if (row.estado === 'APROBADO') {
            return <StatusBadge status="APROBADO" label="Revisado" />;
          }
          if (row.estado === 'OBSERVADO') {
            return <StatusBadge status="OBSERVADO" label="Observado" />;
          }
          if (row.estado === 'RECHAZADO' || row.estado === 'ANULADO') {
            return <StatusBadge status="RECHAZADO" label="Rechazado" />;
          }
        }
        if (isTesoreria) {
          if (row.estado === 'PENDIENTE_TESORERIA') {
            return <StatusBadge status="PENDIENTE_TESORERIA" label="Por Desembolsar" />;
          }
          if (row.estado === 'APROBADO') {
            return <StatusBadge status="APROBADO" label="Desembolsado" />;
          }
        }
        return <StatusBadge status={row.estado} />;
      },
    },
    {
      header: 'Acciones',
      minWidth: '100px',
      align: 'right',
      render: (row) => {
        const isBorrador = row.estado === 'BORRADOR';
        const isObservado = row.estado === 'OBSERVADO';
        const isPendPlanif = row.estado === 'PENDIENTE_PLANIFICACION';
        const isPendPresup = row.estado === 'PENDIENTE_PRESUPUESTOS';
        const isPendTesoreria = row.estado === 'PENDIENTE_TESORERIA';
        const isAprobado = row.estado === 'APROBADO';
        const isRechazado = row.estado === 'RECHAZADO' || row.estado === 'ANULADO';

        return (
          <div className="flex items-center justify-end gap-1.5">
            {/* Si está en BORRADOR u OBSERVADO y el usuario es Gerente o Admin */}
            {(isBorrador || isObservado) && canCreate && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCert(row);
                    setFormModalOpen(true);
                  }}
                  title="Editar Solicitud"
                  className="p-1.5 rounded-lg text-theme-muted hover:text-theme-primary hover:bg-theme-base transition"
                >
                  <Edit3 size={15} />
                </button>

                <button
                  type="button"
                  onClick={() => handleEnviarRevision(row)}
                  title="Enviar a Planificación"
                  className="p-1.5 rounded-lg text-theme-muted hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-theme-base transition"
                >
                  <Send size={15} />
                </button>

                {isBorrador && (
                  <button
                    type="button"
                    onClick={() => handleDeleteCertificacion(row)}
                    title="Eliminar Borrador"
                    className="p-1.5 rounded-lg text-theme-muted hover:text-rose-600 dark:hover:text-rose-400 hover:bg-theme-base transition"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </>
            )}

            {/* Cancelar Solicitud para Gerente (si ya no requiere el gasto) */}
            {canCancelGerente && !isAprobado && !isRechazado && (
              <button
                type="button"
                onClick={() => handleOpenCancelarGerente(row)}
                title="Cancelar Solicitud de Gasto"
                className="p-1.5 rounded-lg text-theme-muted hover:text-rose-600 dark:hover:text-rose-400 hover:bg-theme-base transition"
              >
                <Ban size={15} />
              </button>
            )}

            {/* Acciones para Planificador en PENDIENTE_PLANIFICACION: exactamente los 3 botones de iconos */}
            {isPendPlanif && canCertify && (
              <>
                <button
                  type="button"
                  onClick={() => handleOpenDetalle(row)}
                  title="Revisar Certificación POA (Panel de Control y Vista Previa)"
                  className="p-1.5 rounded-lg text-theme-muted hover:text-theme-main hover:bg-theme-base transition"
                >
                  <Eye size={15} />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedCert(row);
                    setObservarModalOpen(true);
                  }}
                  title="Devolver con Observación a la Gerencia"
                  className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-theme-base transition"
                >
                  <AlertCircle size={15} />
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenRechazoPlanif(row)}
                  title="Rechazar Solicitud"
                  className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-theme-base transition"
                >
                  <XCircle size={15} />
                </button>
              </>
            )}

            {/* Acciones para Presupuestos en PENDIENTE_PRESUPUESTOS: exactamente los 3 botones de iconos */}
            {isPendPresup && canApprove && (
              <>
                <button
                  type="button"
                  onClick={() => handleOpenDetalle(row)}
                  title="Revisar y Control Presupuestario"
                  className="p-1.5 rounded-lg text-theme-muted hover:text-theme-main hover:bg-theme-base transition"
                >
                  <Eye size={15} />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedCert(row);
                    setObservarModalOpen(true);
                  }}
                  title="Devolver con Observación"
                  className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-theme-base transition"
                >
                  <AlertCircle size={15} />
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenDenegarPresup(row)}
                  title="Denegar Visto Bueno (Rechazar)"
                  className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-theme-base transition"
                >
                  <XCircle size={15} />
                </button>
              </>
            )}

            {/* Acciones para Tesorería en PENDIENTE_TESORERIA: exactamente el botón simple para confirmar desembolso */}
            {isPendTesoreria && canDisburse && (
              <button
                type="button"
                onClick={() => handleConfirmarDesembolso(row)}
                title="Confirmar salida de dinero (Registrar Gasto)"
                className="p-1.5 rounded-lg text-teal-600 dark:text-teal-400 hover:bg-theme-base transition"
              >
                <Coins size={15} />
              </button>
            )}

            {/* Si está APROBADO: botón para imprimir boleta oficial (salvo Presupuestos que NO puede imprimir) */}
            {isAprobado && canPrint && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCert(row);
                  setBoletaModalOpen(true);
                }}
                title="Ver Boleta Oficial / Imprimir"
                className="p-1.5 rounded-lg text-theme-muted hover:text-theme-primary hover:bg-theme-base transition"
              >
                <Printer size={15} />
              </button>
            )}

            {/* Ver Detalle y Seguimiento (Disponible cuando no se muestran ya los botones de acción rápida) */}
            {!(isPendPlanif && canCertify) && !(isPendPresup && canApprove) && !(isPendTesoreria && canDisburse) && (
              <button
                type="button"
                onClick={() => handleOpenDetalle(row)}
                title="Ver Vista Previa y Seguimiento del Trámite"
                className="p-1.5 rounded-lg text-theme-muted hover:text-theme-main hover:bg-theme-base transition"
              >
                <Eye size={15} />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  // ── 10. Opciones de Filtro de Área ───────────────────────────────────────────
  const areaFilterItems: DropdownItem[] = useMemo(() => {
    return [
      { id: 'todas', label: 'Todas las Gerencias' },
      ...areas.map((a) => ({
        id: a.id,
        label: a.nombre,
        badge: a.codigo,
      })),
    ];
  }, [areas]);

  return (
    <div className="space-y-6 pb-12">
      {/* ── PageHeader ────────────────────────────────────────────────────────── */}
      <PageHeader
        icon={<FileText size={24} />}
        title="Certificaciones POA"
        subtitle="Flujo institucional: solicitud por Gerencia, certificación técnica en Planificación, visto bueno financiero en Presupuestos y confirmación de desembolso en Tesorería."
        tag="Ejecución Presupuestaria"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            {/* Selector de Gestión Fiscal */}
            {gestiones.length > 0 && (
              <GestionSelector
                gestiones={gestiones}
                selectedGestionId={selectedGestionId}
                onSelectGestion={(id) => setSelectedGestionId(id)}
              />
            )}
          </div>
        }
      />

      {/* ── Pestañas y Búsqueda (TabsFilter - Sin ResumenCards duplicados) ─────── */}
      <div className="space-y-4">
        <TabsFilter
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(tabId) => setActiveTab(tabId)}
          searchTerm={searchTerm}
          onSearchChange={(term) => setSearchTerm(term)}
          searchPlaceholder="Buscar por CITE, código, gerencia, partida, concepto..."
          actions={
            isGlobalRole ? (
              <div className="w-56">
                <Dropdown
                  items={areaFilterItems}
                  value={selectedAreaId}
                  onChange={(val) => setSelectedAreaId(val)}
                  placeholder="Filtrar por Área..."
                  size="sm"
                  searchable
                />
              </div>
            ) : (
              <div className="px-3 py-1.5 rounded-xl bg-theme-surface border border-theme-border text-xs font-semibold text-theme-main flex items-center gap-1.5">
                <Building2 size={14} className="text-theme-muted" />
                <span>
                  {user?.area_nombre || areas.find((a) => a.id === userAreaId)?.nombre || 'Área Asignada'}
                </span>
              </div>
            )
          }
        />

        {/* ── Tabla de Certificaciones (DataTable) ────────────────────────────── */}
        <DataTable
          columns={columns}
          data={filteredCertificaciones}
          keyExtractor={(row) => row.id}
          loading={loading}
          emptyMessage="No se encontraron certificaciones POA en este estado."
        />
      </div>

      {/* ── Modales del Módulo ───────────────────────────────────────────────── */}
      {/* 1. Modal Formulario del Gerente (Paso 1) */}
      <CertificacionFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={selectedCert}
        gestionId={selectedGestionId || 0}
        gestionAnio={activeGestion?.anio || new Date().getFullYear()}
        areas={areas}
        userAreaId={userAreaId}
        isSuperAdmin={isSuperAdmin}
        userName={user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username : ''}
        userCargo={user?.cargo || ''}
      />

      {/* 2. Modal Observar Solicitud */}
      <CertificacionObservarModal
        isOpen={observarModalOpen}
        onClose={() => setObservarModalOpen(false)}
        onSubmit={handleConfirmObservacion}
        solicitudInfo={
          selectedCert
            ? {
                hojaRuta: selectedCert.hoja_ruta,
                areaNombre: selectedCert.area_nombre,
                monto: selectedCert.monto_solicitado,
                origen:
                  selectedCert.estado === 'PENDIENTE_PLANIFICACION'
                    ? 'Planificación'
                    : 'Presupuestos',
              }
            : undefined
        }
      />

      {/* 5. Modal Rechazar / Denegar / Cancelar */}
      <CertificacionRechazarModal
        isOpen={rechazarModalOpen}
        onClose={() => setRechazarModalOpen(false)}
        onSubmit={handleConfirmRechazo}
        certificacion={selectedCert}
        modo={modoRechazo}
      />

      {/* 6. Modal Detalle Completo con Vista Previa Oficial y Panel de Control */}
      <CertificacionDetalleModal
        isOpen={detalleModalOpen}
        onClose={() => setDetalleModalOpen(false)}
        certificacion={selectedCert}
        canCertify={canCertify}
        canApprove={canApprove}
        canCancel={canCancelGerente}
        canPrint={canPrint}
        onCancelRequest={(cert) => {
          setDetalleModalOpen(false);
          handleOpenCancelarGerente(cert);
        }}
        onCertificar={handleCertificarPlanificacion}
        onAprobarPresupuestos={handleAprobarPresupuestos}
        onDevolverPlanificacion={handleDevolverPlanificacion}
        onObservar={handleConfirmObservacion}
        onRechazar={handleConfirmRechazo}
        siguienteCorrelativoGlobal={siguienteCorrelativoGlobal}
        siguienteCorrelativoArea={siguienteCorrelativoArea}
      />

      {/* 7. Modal Boleta Oficial / Imprimir */}
      <BoletaCertificacionModal
        isOpen={boletaModalOpen}
        onClose={() => setBoletaModalOpen(false)}
        certificacion={selectedCert}
        canPrint={canPrint}
      />
    </div>
  );
}
