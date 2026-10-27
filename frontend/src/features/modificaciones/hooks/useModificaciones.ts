import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Area,
  MemoriaCalculo,
  ModificacionPresupuestaria,
  CrearModificacionPayload,
  Partida,
} from '../../../services/presupuestoService';
import { modificacionesApi } from '../api/modificacionesApi';
import { useAuth } from '../../../hooks/useAuth';
import { useGestion } from '../../../contexts/GestionContext';
import alertService from '../../../utils/alerts';

export type ModificacionTab =
  | 'TODAS'
  | 'PENDIENTE_GERENCIA_CEDENTE'
  | 'PENDIENTE_PRESUPUESTOS'
  | 'APROBADO'
  | 'RECHAZADO';

export function useModificaciones() {
  const { user } = useAuth();
  const {
    gestiones,
    gestionActivaId: selectedGestionId,
    setGestionActivaId: setSelectedGestionId,
  } = useGestion();

  // Control de Roles y Permisos Institucionales
  const rolName = (user?.rol_nombre || (user as any)?.rol?.nombre || '').toUpperCase().trim();
  const rolClean = rolName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const isSuperuser = !!user?.is_superuser;
  const isAdmin = isSuperuser || rolClean.includes('ADMIN');
  const isPresupuestos = isAdmin || rolClean.includes('PRESUPUEST') || rolClean.includes('APROBAD');
  const isGerente = !isAdmin && rolClean.includes('GERENTE');

  const canSolicitar = isAdmin || isGerente;
  const canAprobar = isPresupuestos;
  const isReadOnly = !canSolicitar && !canAprobar;

  // Datos base
  const [areas, setAreas] = useState<Area[]>([]);
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [operaciones, setOperaciones] = useState<any[]>([]);
  const [modificaciones, setModificaciones] = useState<ModificacionPresupuestaria[]>([]);
  const [memorias, setMemorias] = useState<MemoriaCalculo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filtros de navegación
  const [activeTab, setActiveTab] = useState<ModificacionTab>('TODAS');
  const [filtroArea, setFiltroArea] = useState<string>('todas');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modales
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [selectedModDetalle, setSelectedModDetalle] = useState<ModificacionPresupuestaria | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [modToReject, setModToReject] = useState<ModificacionPresupuestaria | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState<string>('');

  // Selección en lote para Aprobación "De Golpe" (Presupuestos / Admin)
  const [selectedModIds, setSelectedModIds] = useState<number[]>([]);

  // Paginación
  const [currentPage, setCurrentPage] = useState<number>(1);
  const PAGE_SIZE = 15;

  const activeGestion = useMemo(() => {
    return (Array.isArray(gestiones) ? gestiones : []).find((g) => g.id === selectedGestionId) || null;
  }, [gestiones, selectedGestionId]);

  const isGestionBloqueada = useMemo(() => {
    return !activeGestion || activeGestion.estado !== 'EN_EJECUCION';
  }, [activeGestion]);

  const userAreaId = useMemo(() => {
    if (user?.area_id) return Number(user.area_id);
    const userAreaNom = (user?.area_nombre || '').toLowerCase();
    const found = areas.find((a) => a.nombre.toLowerCase() === userAreaNom);
    return found ? found.id : null;
  }, [user, areas]);

  const mostrarMensaje = useCallback((type: 'success' | 'error', text: string) => {
    setFeedbackMsg({ type, text });
    if (type === 'success') {
      alertService.toast(text, 'success');
    } else {
      alertService.error('Modificaciones Presupuestarias', text);
    }
    setTimeout(() => setFeedbackMsg(null), 4000);
  }, []);

  const cargarBase = useCallback(async () => {
    setLoading(true);
    try {
      const [aList, pList] = await Promise.all([
        modificacionesApi.getAreas(),
        modificacionesApi.getPartidas(),
      ]);
      setAreas(aList);
      setPartidas(pList);
    } catch (err) {
      console.error(err);
      mostrarMensaje('error', 'Error al cargar áreas o catálogo de partidas.');
    } finally {
      setLoading(false);
    }
  }, [mostrarMensaje]);

  const cargarDatosModificaciones = useCallback(
    async (gId: number) => {
      setLoading(true);
      try {
        const [mList, modList, tList, opList] = await Promise.all([
          modificacionesApi.getMemorias({ gestion: gId, para_modificacion: true }),
          modificacionesApi.getModificaciones({ gestion: gId }),
          modificacionesApi.getTraspasos({ gestion: gId }),
          modificacionesApi.getOperaciones({ gestion: gId }).catch(() => []),
        ]);
        setMemorias(Array.isArray(mList) ? mList : []);
        setOperaciones(Array.isArray(opList) ? opList : []);

        // Unificar modificaciones con traspasos 1:1 legacy si existieran
        const listaM: ModificacionPresupuestaria[] = Array.isArray(modList) ? [...modList] : [];
        if (Array.isArray(tList) && tList.length > 0) {
          for (const t of tList) {
            if (!listaM.some((m) => m.codigo === `TRASP-${t.id}`)) {
              listaM.push({
                id: t.id + 100000,
                codigo: `TRASP-${t.id}`,
                gestion: gId,
                area: 0,
                area_nombre: t.area_nombre,
                tipo: 'TRASPASO_INTRA_AREA',
                tipo_display: 'Traspaso Directo',
                motivo: t.motivo,
                total_monto: t.monto,
                estado: 'APROBADO',
                usuario_registro_nombre: t.usuario_registro_nombre,
                fecha: t.created_at || '',
                created_at: t.created_at || '',
                detalles: [],
                origenes: [
                  {
                    memoria: t.memoria_origen,
                    memoria_codigo: t.memoria_origen_codigo || `MEM-${t.memoria_origen}`,
                    partida_codigo: t.memoria_origen_partida,
                    tipo_movimiento: 'DISMINUCION',
                    monto: t.monto,
                  },
                ],
                destinos: [
                  {
                    memoria: t.memoria_destino,
                    memoria_codigo: t.memoria_destino_codigo || `MEM-${t.memoria_destino}`,
                    partida_codigo: t.memoria_destino_partida,
                    tipo_movimiento: 'INCREMENTO',
                    monto: t.monto,
                  },
                ],
              });
            }
          }
        }

        setModificaciones(listaM);
      } catch (err) {
        console.error(err);
        mostrarMensaje('error', 'Error al cargar modificaciones presupuestarias.');
      } finally {
        setLoading(false);
      }
    },
    [mostrarMensaje]
  );

  useEffect(() => {
    cargarBase();
  }, [cargarBase]);

  useEffect(() => {
    if (selectedGestionId) {
      cargarDatosModificaciones(selectedGestionId);
      setSelectedModIds([]);
    }
  }, [selectedGestionId, cargarDatosModificaciones]);

  // Filtrado de Modificaciones
  const modificacionesFiltradas = useMemo(() => {
    return (Array.isArray(modificaciones) ? modificaciones : []).filter((mod) => {
      // Filtro por Estado (Tab)
      if (activeTab !== 'TODAS' && mod.estado !== activeTab) {
        return false;
      }

      // Filtro por Área
      const matchArea =
        filtroArea === 'todas' ||
        String(mod.area) === filtroArea ||
        String(mod.area_cedente) === filtroArea ||
        mod.area_nombre === areas.find((a) => String(a.id) === filtroArea)?.nombre;

      // Filtro por Buscador
      const term = searchTerm.trim().toLowerCase();
      const matchSearch =
        !term ||
        mod.codigo.toLowerCase().includes(term) ||
        mod.motivo.toLowerCase().includes(term) ||
        (mod.area_nombre && mod.area_nombre.toLowerCase().includes(term)) ||
        (mod.area_cedente_nombre && mod.area_cedente_nombre.toLowerCase().includes(term)) ||
        (mod.usuario_registro_nombre && mod.usuario_registro_nombre.toLowerCase().includes(term)) ||
        (mod.aprobado_por_nombre && mod.aprobado_por_nombre.toLowerCase().includes(term)) ||
        (mod.origenes || []).some(
          (o) =>
            o.memoria_codigo?.toLowerCase().includes(term) ||
            o.partida_codigo?.toLowerCase().includes(term) ||
            o.partida_nombre?.toLowerCase().includes(term)
        ) ||
        (mod.destinos || []).some(
          (d) =>
            d.memoria_codigo?.toLowerCase().includes(term) ||
            d.partida_codigo?.toLowerCase().includes(term) ||
            d.partida_nombre?.toLowerCase().includes(term)
        );

      return matchArea && matchSearch;
    });
  }, [modificaciones, activeTab, filtroArea, searchTerm, areas]);

  useEffect(() => {
    setCurrentPage(1);
  }, [modificacionesFiltradas]);

  const totalPages = Math.max(1, Math.ceil(modificacionesFiltradas.length / PAGE_SIZE));
  const modificacionesPaginadas = useMemo(() => {
    return modificacionesFiltradas.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  }, [modificacionesFiltradas, currentPage]);

  // Contadores para pestañas y KPIs
  const countPendientesGerencia = useMemo(() => {
    return modificaciones.filter((m) => m.estado === 'PENDIENTE_GERENCIA_CEDENTE').length;
  }, [modificaciones]);

  const countPendientesPresupuestos = useMemo(() => {
    return modificaciones.filter((m) => m.estado === 'PENDIENTE_PRESUPUESTOS').length;
  }, [modificaciones]);

  const countPendientes = countPendientesPresupuestos;

  const countAprobadas = useMemo(() => {
    return modificaciones.filter((m) => m.estado === 'APROBADO').length;
  }, [modificaciones]);

  const countRechazadas = useMemo(() => {
    return modificaciones.filter((m) => m.estado === 'RECHAZADO').length;
  }, [modificaciones]);

  const totalMontoPendienteGerencia = useMemo(() => {
    return modificaciones
      .filter((m) => m.estado === 'PENDIENTE_GERENCIA_CEDENTE')
      .reduce((acc, m) => acc + parseFloat(String(m.total_monto) || '0'), 0);
  }, [modificaciones]);

  const totalMontoPendientePresupuestos = useMemo(() => {
    return modificaciones
      .filter((m) => m.estado === 'PENDIENTE_PRESUPUESTOS')
      .reduce((acc, m) => acc + parseFloat(String(m.total_monto) || '0'), 0);
  }, [modificaciones]);

  const totalMontoPendiente = totalMontoPendientePresupuestos;

  const totalMontoAprobado = useMemo(() => {
    return modificaciones
      .filter((m) => m.estado === 'APROBADO')
      .reduce((acc, m) => acc + parseFloat(String(m.total_monto) || '0'), 0);
  }, [modificaciones]);

  // Pendientes visibles en la página actual para aprobación en lote por Presupuestos
  const pendingVisiblesEnPagina = useMemo(() => {
    return modificacionesPaginadas.filter((m) => m.estado === 'PENDIENTE_PRESUPUESTOS');
  }, [modificacionesPaginadas]);

  const areAllPendingOnPageSelected = useMemo(() => {
    if (pendingVisiblesEnPagina.length === 0) return false;
    return pendingVisiblesEnPagina.every((m) => selectedModIds.includes(m.id));
  }, [pendingVisiblesEnPagina, selectedModIds]);

  const totalSelectedMonto = useMemo(() => {
    return modificaciones
      .filter((m) => selectedModIds.includes(m.id))
      .reduce((acc, m) => acc + parseFloat(String(m.total_monto) || '0'), 0);
  }, [modificaciones, selectedModIds]);

  // Selección en lote
  const handleToggleSelectAllPending = useCallback(() => {
    if (areAllPendingOnPageSelected) {
      const pagePendingIds = pendingVisiblesEnPagina.map((m) => m.id);
      setSelectedModIds((prev) => prev.filter((id) => !pagePendingIds.includes(id)));
    } else {
      const newIds = pendingVisiblesEnPagina.map((m) => m.id);
      setSelectedModIds((prev) => Array.from(new Set([...prev, ...newIds])));
    }
  }, [areAllPendingOnPageSelected, pendingVisiblesEnPagina]);

  const handleToggleSelectRow = useCallback((id: number) => {
    setSelectedModIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  // Verificar si el usuario actual puede autorizar/rechazar como Gerencia Cedente
  const canAceptarGerencia = useCallback(
    (mod: ModificacionPresupuestaria) => {
      if (mod.estado !== 'PENDIENTE_GERENCIA_CEDENTE') return false;
      if (isAdmin) return true;
      if (isGerente && mod.area_cedente && Number(mod.area_cedente) === Number(userAreaId)) {
        return true;
      }
      return false;
    },
    [isAdmin, isGerente, userAreaId]
  );

  // Aceptar Solicitud por parte de Gerencia Cedente
  const handleAceptarGerencia = useCallback(
    async (mod: ModificacionPresupuestaria, nota?: string) => {
      if (!canAceptarGerencia(mod)) return;

      const confirm = await alertService.confirm({
        title: `¿Aceptar Petición de Transferencia ${mod.codigo}?`,
        text: `Como Gerente del Área Cedente (${mod.area_cedente_nombre || 'su área'}), usted autoriza ceder ${new Intl.NumberFormat(
          'es-BO',
          { style: 'currency', currency: 'BOB' }
        ).format(Number(mod.total_monto))} al área solicitante (${mod.area_nombre}). La solicitud pasará a Presupuestos para visto bueno final.`,
        icon: 'question',
        confirmButtonText: 'Sí, Aceptar y Pasar a Presupuestos',
      });
      if (!confirm) return;

      setActionLoading(true);
      try {
        await modificacionesApi.aceptarGerencia(mod.id, { nota });
        mostrarMensaje(
          'success',
          `Petición ${mod.codigo} aceptada por la Gerencia Cedente. Ha pasado a Presupuestos (En Espera).`
        );
        if (selectedModDetalle?.id === mod.id) {
          setSelectedModDetalle((prev) =>
            prev ? { ...prev, estado: 'PENDIENTE_PRESUPUESTOS' } : null
          );
        }
        if (selectedGestionId) {
          await cargarDatosModificaciones(selectedGestionId);
        }
      } catch (err: any) {
        console.error(err);
        const errMsg =
          err?.response?.data?.non_field_errors?.[0] ||
          err?.response?.data?.error ||
          'Error al aceptar la solicitud inter-gerencias.';
        mostrarMensaje('error', errMsg);
      } finally {
        setActionLoading(false);
      }
    },
    [canAceptarGerencia, selectedModDetalle, selectedGestionId, cargarDatosModificaciones, mostrarMensaje]
  );

  // Aprobación Masiva "De Golpe" (Presupuestos)
  const handleAprobarLote = useCallback(async () => {
    if (!canAprobar || selectedModIds.length === 0) return;

    const confirm = await alertService.confirm({
      title: `¿Aprobar de Golpe ${selectedModIds.length} Modificaciones?`,
      text: `Se autorizarán simultáneamente ${selectedModIds.length} solicitudes pendientes por un total compensado. Los saldos de las memorias y partidas se actualizarán de inmediato.`,
      icon: 'question',
      confirmButtonText: 'Sí, Aprobar de Golpe',
    });
    if (!confirm) return;

    setActionLoading(true);
    try {
      const res = await modificacionesApi.aprobarLoteModificaciones(selectedModIds);
      mostrarMensaje('success', `¡${res.aprobadas_count} modificaciones aprobadas de golpe con éxito!`);
      setSelectedModIds([]);
      if (selectedGestionId) {
        await cargarDatosModificaciones(selectedGestionId);
      }
    } catch (err: any) {
      console.error(err);
      const errMsg = err?.response?.data?.non_field_errors?.[0] || 'Error al aprobar modificaciones en lote.';
      mostrarMensaje('error', errMsg);
    } finally {
      setActionLoading(false);
    }
  }, [canAprobar, selectedModIds, selectedGestionId, cargarDatosModificaciones, mostrarMensaje]);

  // Aprobación Individual por Presupuestos
  const handleAprobarIndividual = useCallback(
    async (mod: ModificacionPresupuestaria) => {
      if (!canAprobar) return;

      const confirm = await alertService.confirm({
        title: `¿Aprobar Modificación ${mod.codigo}?`,
        text: `Se autorizará el traspaso para el área ${mod.area_nombre}. Los saldos se actualizarán inmediatamente.`,
        icon: 'question',
        confirmButtonText: 'Sí, Aprobar',
      });
      if (!confirm) return;

      setActionLoading(true);
      try {
        await modificacionesApi.aprobarModificacion(mod.id);
        mostrarMensaje('success', `Modificación ${mod.codigo} aprobada exitosamente.`);
        setSelectedModIds((prev) => prev.filter((id) => id !== mod.id));
        if (selectedModDetalle?.id === mod.id) {
          setSelectedModDetalle((prev) => (prev ? { ...prev, estado: 'APROBADO' } : null));
        }
        if (selectedGestionId) {
          await cargarDatosModificaciones(selectedGestionId);
        }
      } catch (err: any) {
        console.error(err);
        const errMsg = err?.response?.data?.non_field_errors?.[0] || 'Error al aprobar la modificación.';
        mostrarMensaje('error', errMsg);
      } finally {
        setActionLoading(false);
      }
    },
    [canAprobar, selectedModDetalle, selectedGestionId, cargarDatosModificaciones, mostrarMensaje]
  );

  // Apertura modal de rechazo (tanto para Gerencia Cedente como para Presupuestos)
  const handleOpenRechazoModal = useCallback((mod: ModificacionPresupuestaria) => {
    setModToReject(mod);
    setMotivoRechazo('');
    setShowRejectModal(true);
  }, []);

  // Confirmar rechazo (identifica si rechaza la Gerencia Cedente o Presupuestos)
  const handleConfirmarRechazo = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!modToReject || !motivoRechazo.trim()) {
        mostrarMensaje('error', 'Debe ingresar el motivo de rechazo.');
        return;
      }

      setActionLoading(true);
      try {
        if (modToReject.estado === 'PENDIENTE_GERENCIA_CEDENTE') {
          await modificacionesApi.rechazarGerencia(modToReject.id, { motivo: motivoRechazo.trim() });
          mostrarMensaje('success', `Petición ${modToReject.codigo} rechazada por la Gerencia Cedente.`);
        } else {
          await modificacionesApi.rechazarModificacion(modToReject.id, { motivo: motivoRechazo.trim() });
          mostrarMensaje('success', `Modificación ${modToReject.codigo} rechazada por Presupuestos.`);
        }

        setShowRejectModal(false);
        setModToReject(null);
        setSelectedModIds((prev) => prev.filter((id) => id !== modToReject.id));
        if (selectedModDetalle?.id === modToReject.id) {
          setSelectedModDetalle((prev) =>
            prev ? { ...prev, estado: 'RECHAZADO', motivo_rechazo: motivoRechazo.trim() } : null
          );
        }
        if (selectedGestionId) {
          await cargarDatosModificaciones(selectedGestionId);
        }
      } catch (err: any) {
        console.error(err);
        const errMsg =
          err?.response?.data?.non_field_errors?.[0] ||
          err?.response?.data?.error ||
          'Error al rechazar la modificación.';
        mostrarMensaje('error', errMsg);
      } finally {
        setActionLoading(false);
      }
    },
    [modToReject, motivoRechazo, selectedModDetalle, selectedGestionId, cargarDatosModificaciones, mostrarMensaje]
  );

  // Crear Modificación (Intra o Inter-Área)
  const handleCrearModificacion = useCallback(
    async (payload: CrearModificacionPayload) => {
      setActionLoading(true);
      try {
        await modificacionesApi.createModificacion(payload);
        if (payload.tipo === 'TRASPASO_INTER_AREA') {
          mostrarMensaje(
            'success',
            '¡Solicitud inter-gerencias registrada con éxito! Enviada a la Gerencia Cedente para su revisión.'
          );
        } else {
          mostrarMensaje('success', '¡Solicitud registrada con éxito! Enviada a Presupuestos (En Espera).');
        }
        setShowCreateModal(false);
        if (selectedGestionId) {
          await cargarDatosModificaciones(selectedGestionId);
        }
      } catch (err: any) {
        console.error(err);
        const backendErr =
          err?.response?.data?.non_field_errors?.[0] ||
          err?.response?.data?.origenes?.[0] ||
          err?.response?.data?.destinos?.[0] ||
          err?.response?.data?.motivo?.[0] ||
          err?.response?.data?.error ||
          'Error al registrar la modificación presupuestaria.';
        mostrarMensaje('error', backendErr);
        throw err;
      } finally {
        setActionLoading(false);
      }
    },
    [selectedGestionId, cargarDatosModificaciones, mostrarMensaje]
  );

  return {
    user,
    isAdmin,
    isPresupuestos,
    isGerente,
    canSolicitar,
    canAprobar,
    canAceptarGerencia,
    isReadOnly,
    userAreaId,
    gestiones,
    selectedGestionId,
    setSelectedGestionId,
    activeGestion,
    isGestionBloqueada,
    areas,
    partidas,
    operaciones,
    memorias,
    loading,
    actionLoading,
    feedbackMsg,
    activeTab,
    setActiveTab,
    filtroArea,
    setFiltroArea,
    searchTerm,
    setSearchTerm,
    modificaciones,
    modificacionesFiltradas,
    modificacionesPaginadas,
    currentPage,
    setCurrentPage,
    totalPages,
    PAGE_SIZE,
    countPendientesGerencia,
    countPendientesPresupuestos,
    countPendientes,
    countAprobadas,
    countRechazadas,
    totalMontoPendienteGerencia,
    totalMontoPendientePresupuestos,
    totalMontoPendiente,
    totalMontoAprobado,
    pendingVisiblesEnPagina,
    areAllPendingOnPageSelected,
    selectedModIds,
    setSelectedModIds,
    totalSelectedMonto,
    handleToggleSelectAllPending,
    handleToggleSelectRow,
    handleAprobarLote,
    handleAprobarIndividual,
    handleAceptarGerencia,
    handleOpenRechazoModal,
    handleConfirmarRechazo,
    handleCrearModificacion,
    showCreateModal,
    setShowCreateModal,
    selectedModDetalle,
    setSelectedModDetalle,
    showRejectModal,
    setShowRejectModal,
    modToReject,
    motivoRechazo,
    setMotivoRechazo,
    cargarDatosModificaciones,
  };
}
