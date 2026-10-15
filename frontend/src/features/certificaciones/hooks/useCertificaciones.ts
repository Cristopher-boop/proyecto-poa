import { useState, useEffect, useCallback, useMemo } from 'react';
import { certificacionesApi } from '../api/certificacionesApi';
import { CertificacionPOA, CertificacionFormData } from '../../../types/certificacion';
import { useGestion } from '../../../contexts/GestionContext';
import { useAuth } from '../../../hooks/useAuth';
import alertService from '../../../utils/alerts';
import api from '../../../services/api';

export function useCertificaciones() {
  const { user } = useAuth();
  const { gestionActiva, gestionActivaId, isGestionBloqueada } = useGestion();

  // Roles institucionales
  const rolName = (user?.rol_nombre || (user as any)?.rol?.nombre || '').toUpperCase().trim();
  const rolClean = rolName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const isSuperAdmin = Boolean(user?.is_superuser) || rolClean.includes('ADMIN');
  const isPlanificador = isSuperAdmin || rolClean.includes('PLANIFIC');
  const isPresupuestos = isSuperAdmin || rolClean.includes('APROBAD') || rolClean.includes('PRESUPUEST') || rolClean.includes('FINANZ');
  const isGerente = rolClean.includes('GERENT');
  const isReadOnly = !isSuperAdmin && !isPlanificador && !isPresupuestos && !isGerente;

  const userAreaId = user?.area_id || (user as any)?.seccion?.area_id || null;

  // Permisos operativos
  const canCreate = !isGestionBloqueada && (isSuperAdmin || isGerente);
  const canCertify = !isGestionBloqueada && (isSuperAdmin || isPlanificador);
  const canApprove = !isGestionBloqueada && (isSuperAdmin || isPresupuestos);
  const canCancelGerente = !isGestionBloqueada && (isSuperAdmin || isGerente);

  // Estados de datos
  const [certificaciones, setCertificaciones] = useState<CertificacionPOA[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Filtros
  const [selectedGestionId, setSelectedGestionId] = useState<number | null>(gestionActivaId || null);
  const [filtroArea, setFiltroArea] = useState<string>(() => {
    if (isGerente && userAreaId) return String(userAreaId);
    return 'todas';
  });
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (isPlanificador) return 'por_certificar';
    if (isPresupuestos) return 'por_aprobar';
    return 'todas';
  });

  // Correlativos
  const [siguienteCorrelativoGlobal, setSiguienteCorrelativoGlobal] = useState<string>('');
  const [siguienteCorrelativoArea, setSiguienteCorrelativoArea] = useState<string>('');

  // Modales
  const [selectedCert, setSelectedCert] = useState<CertificacionPOA | null>(null);
  const [detalleModalOpen, setDetalleModalOpen] = useState<boolean>(false);
  const [formModalOpen, setFormModalOpen] = useState<boolean>(false);

  // Sincronizar gestión activa
  useEffect(() => {
    if (gestionActivaId && gestionActivaId !== selectedGestionId) {
      setSelectedGestionId(gestionActivaId);
    }
  }, [gestionActivaId]);

  // Cargar áreas
  useEffect(() => {
    api
      .get('/api/v1/organizacional/areas/')
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
        setAreas(data);
      })
      .catch((err) => console.error('Error al cargar áreas:', err));
  }, []);

  // Cargar certificaciones
  const fetchCertificaciones = useCallback(async () => {
    if (!selectedGestionId) return;
    setLoading(true);
    try {
      const params: Record<string, any> = { gestion: selectedGestionId };
      if (isGerente && userAreaId) {
        params.area = userAreaId;
      } else if (filtroArea !== 'todas') {
        params.area = filtroArea;
      }
      const data = await certificacionesApi.getAll(params);
      setCertificaciones(data);
    } catch (err: any) {
      console.error('Error al cargar certificaciones:', err);
      alertService.toast('Error al cargar las solicitudes de certificación.', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedGestionId, isGerente, userAreaId, filtroArea]);

  useEffect(() => {
    fetchCertificaciones();
  }, [fetchCertificaciones]);

  // Cargar siguientes correlativos
  const fetchCorrelativos = useCallback(async () => {
    if (!selectedGestionId) return;
    try {
      const areaIdParam = userAreaId || (filtroArea !== 'todas' ? Number(filtroArea) : undefined);
      const data = await certificacionesApi.getSiguienteCorrelativo(selectedGestionId, areaIdParam);
      setSiguienteCorrelativoGlobal(data.codigo_certificacion);
      setSiguienteCorrelativoArea(data.numero_oficio_solicitud);
    } catch (err) {
      console.error('Error al obtener siguientes correlativos:', err);
    }
  }, [selectedGestionId, userAreaId, filtroArea]);

  useEffect(() => {
    fetchCorrelativos();
  }, [fetchCorrelativos]);

  // Mutaciones
  const handleCrearOActualizar = async (formData: CertificacionFormData) => {
    setActionLoading(true);
    try {
      if (selectedCert) {
        await certificacionesApi.update(selectedCert.id, formData);
        alertService.toast('Solicitud actualizada correctamente.', 'success');
      } else {
        await certificacionesApi.create(formData);
        alertService.toast('Solicitud creada en borrador exitosamente.', 'success');
      }
      setFormModalOpen(false);
      setSelectedCert(null);
      await fetchCertificaciones();
      await fetchCorrelativos();
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.error || err?.response?.data?.non_field_errors?.[0] || 'Error al guardar la solicitud.';
      alertService.toast(msg, 'error');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const handleEnviarRevision = async (cert: CertificacionPOA) => {
    const isContratacionAuto = Number(cert.monto_solicitado) > 2000;
    const destinoStr = isContratacionAuto || cert.es_contratacion ? 'Planificación' : 'Presupuestos';

    const confirm = await alertService.confirm({
      title: '¿Enviar Solicitud a Revisión?',
      text: `Se remitirá formalmente a ${destinoStr} para su correspondiente revisión técnica y presupuestaria (Hoja de Ruta: ${cert.hoja_ruta}).`,
      confirmButtonText: 'Sí, enviar ahora',
      cancelButtonText: 'Cancelar',
      icon: 'question',
    });
    if (!confirm) return;

    setActionLoading(true);
    try {
      const res = await certificacionesApi.enviarRevision(cert.id, { es_contratacion: cert.es_contratacion });
      alertService.toast(res.status, 'success');
      await fetchCertificaciones();
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.error || err?.response?.data?.detail || 'Error al enviar la solicitud.';
      alertService.toast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCertificarPlanificacion = async (data: {
    codigo_certificacion?: string;
    numero_oficio_solicitud?: string;
    observacion?: string;
    categoria_programatica_codigo?: string;
    categoria_programatica?: string;
    notas?: string;
    partida_id?: number;
    operacion_id?: number;
  }) => {
    if (!selectedCert) return;
    setActionLoading(true);
    try {
      const res = await certificacionesApi.certificarPlanificacion(selectedCert.id, data);
      alertService.toast(res.status, 'success');
      setDetalleModalOpen(false);
      await fetchCertificaciones();
      await fetchCorrelativos();
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.error || err?.response?.data?.detail || 'Error al emitir la certificación.';
      alertService.toast(msg, 'error');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const handleAprobarPresupuestos = async (
    data?: { observacion?: string; memoria_id?: number; partida_id?: number } | string
  ) => {
    if (!selectedCert) return;
    setActionLoading(true);
    try {
      const res = await certificacionesApi.aprobarPresupuestos(selectedCert.id, data);
      alertService.toast(res.status, 'success');
      setDetalleModalOpen(false);
      await fetchCertificaciones();
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.error || err?.response?.data?.detail || 'Error al otorgar visto bueno.';
      alertService.toast(msg, 'error');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const handleObservar = async (observacion: string) => {
    if (!selectedCert) return;
    setActionLoading(true);
    try {
      const res = await certificacionesApi.observar(selectedCert.id, observacion);
      alertService.toast(res.status, 'info');
      setDetalleModalOpen(false);
      await fetchCertificaciones();
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.error || 'Error al observar la solicitud.';
      alertService.toast(msg, 'error');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const handleRechazar = async (motivo: string) => {
    if (!selectedCert) return;
    setActionLoading(true);
    try {
      const res = await certificacionesApi.rechazar(selectedCert.id, motivo);
      alertService.toast(res.status, 'error');
      setDetalleModalOpen(false);
      await fetchCertificaciones();
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.error || 'Error al rechazar la solicitud.';
      alertService.toast(msg, 'error');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelar = async (cert: CertificacionPOA) => {
    const motivo = await alertService.prompt({
      title: 'Cancelar Solicitud de Certificación',
      text: `Indica el motivo por el cual la gerencia da de baja esta solicitud (${cert.hoja_ruta}):`,
      inputPlaceholder: 'Motivo de la cancelación...',
      confirmButtonText: 'Sí, cancelar trámite',
      cancelButtonText: 'Volver',
      isDanger: true,
    });
    if (motivo === null) return;

    setActionLoading(true);
    try {
      const res = await certificacionesApi.cancelar(cert.id, motivo);
      alertService.toast(res.status, 'info');
      if (detalleModalOpen) setDetalleModalOpen(false);
      await fetchCertificaciones();
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.error || 'Error al cancelar la solicitud.';
      alertService.toast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (cert: CertificacionPOA) => {
    const confirm = await alertService.confirm({
      title: '¿Eliminar Borrador?',
      text: `Se eliminará permanentemente la solicitud en borrador con Hoja de Ruta ${cert.hoja_ruta}.`,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      isDanger: true,
    });
    if (!confirm) return;

    setActionLoading(true);
    try {
      await certificacionesApi.delete(cert.id);
      alertService.toast('Borrador eliminado correctamente.', 'success');
      await fetchCertificaciones();
    } catch (err: any) {
      console.error(err);
      alertService.toast('Error al eliminar el borrador.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtrado y conteos
  const filteredCertificaciones = useMemo(() => {
    return certificaciones.filter((item) => {
      // Pestaña
      if (isPlanificador) {
        if (activeTab === 'por_certificar' && item.estado !== 'PENDIENTE_PLANIFICACION') return false;
        if (activeTab === 'enviadas' && item.estado !== 'PENDIENTE_PRESUPUESTOS') return false;
        if (activeTab === 'aprobadas_poa' && item.estado !== 'APROBADO') return false;
        if (activeTab === 'observadas' && item.estado !== 'OBSERVADO' && item.estado !== 'RECHAZADO' && item.estado !== 'ANULADO') return false;
      } else if (isPresupuestos) {
        if (activeTab === 'por_aprobar' && item.estado !== 'PENDIENTE_PRESUPUESTOS') return false;
        if (activeTab === 'aprobadas' && item.estado !== 'APROBADO') return false;
        if (activeTab === 'observadas' && item.estado !== 'OBSERVADO' && item.estado !== 'RECHAZADO' && item.estado !== 'ANULADO') return false;
      } else {
        if (activeTab === 'borradores' && item.estado !== 'BORRADOR') return false;
        if (activeTab === 'en_revision' && item.estado !== 'PENDIENTE_PLANIFICACION' && item.estado !== 'PENDIENTE_PRESUPUESTOS') return false;
        if (activeTab === 'aprobadas' && item.estado !== 'APROBADO') return false;
        if (activeTab === 'observadas' && item.estado !== 'OBSERVADO' && item.estado !== 'RECHAZADO') return false;
      }

      // Buscador
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesHojaRuta = (item.hoja_ruta || '').toLowerCase().includes(query);
        const matchesCodigoCert = (item.codigo_certificacion || '').toLowerCase().includes(query);
        const matchesOficio = (item.numero_oficio_solicitud || '').toLowerCase().includes(query);
        const matchesConcepto = (item.concepto_gasto || '').toLowerCase().includes(query);
        const matchesArea = (item.area_nombre || '').toLowerCase().includes(query);
        const matchesPartida = (item.partida_nombre || item.partida_literal || '').toLowerCase().includes(query);
        const matchesMC = (item.memoria_codigo || '').toLowerCase().includes(query);
        if (!matchesHojaRuta && !matchesCodigoCert && !matchesOficio && !matchesConcepto && !matchesArea && !matchesPartida && !matchesMC) {
          return false;
        }
      }

      return true;
    });
  }, [certificaciones, activeTab, searchTerm, isPlanificador, isPresupuestos]);

  // Conteos
  const counts = useMemo(() => {
    return {
      todas: certificaciones.length,
      borradores: certificaciones.filter((c) => c.estado === 'BORRADOR').length,
      pendPlanif: certificaciones.filter((c) => c.estado === 'PENDIENTE_PLANIFICACION').length,
      pendPresup: certificaciones.filter((c) => c.estado === 'PENDIENTE_PRESUPUESTOS').length,
      aprobadas: certificaciones.filter((c) => c.estado === 'APROBADO').length,
      observadas: certificaciones.filter((c) => c.estado === 'OBSERVADO' || c.estado === 'RECHAZADO').length,
    };
  }, [certificaciones]);

  return {
    user,
    gestionActiva,
    selectedGestionId,
    setSelectedGestionId,
    areas,
    loading,
    actionLoading,
    certificaciones,
    filteredCertificaciones,
    counts,
    filtroArea,
    setFiltroArea,
    searchTerm,
    setSearchTerm,
    activeTab,
    setActiveTab,
    selectedCert,
    setSelectedCert,
    detalleModalOpen,
    setDetalleModalOpen,
    formModalOpen,
    setFormModalOpen,
    siguienteCorrelativoGlobal,
    siguienteCorrelativoArea,
    // Permisos
    isSuperAdmin,
    isPlanificador,
    isPresupuestos,
    isGerente,
    isReadOnly,
    canCreate,
    canCertify,
    canApprove,
    canCancelGerente,
    // Acciones
    fetchCertificaciones,
    handleCrearOActualizar,
    handleEnviarRevision,
    handleCertificarPlanificacion,
    handleAprobarPresupuestos,
    handleObservar,
    handleRechazar,
    handleCancelar,
    handleDelete,
  };
}
