import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  FileText,
  Printer,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  XCircle,
  Ban,
  CheckCircle2,
  Clock,
  Coins,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Layers,
  ArrowRight,
  TrendingDown,
  Search,
  Check,
  RotateCcw,
} from 'lucide-react';
import { CertificacionPOA } from '../../../types/certificacion';
import { Modal, Button, StatusBadge } from '../../../components/commons';
import { CertificacionDocumentoOficial, cleanOficioSolicitud } from './CertificacionDocumentoOficial';
import { imprimirCertificacion } from '../utils/printCertificacion';
import { partidaService } from '../../../services/partidaService';
import { planificacionService } from '../../../services/planificacionService';
import { getMemorias, MemoriaCalculo } from '../../../services/presupuestoService';
import type { Operacion } from '../../../types/planificacion';
import type { Partida } from '../../../types/partida';
import alertService from '../../../utils/alerts';
import { useAuth } from '../../../hooks/useAuth';

interface CertificacionDetalleModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificacion: CertificacionPOA | null;
  // Planificación
  canCertify?: boolean;
  onCertificar?: (data: {
    codigo_certificacion?: string;
    numero_oficio_solicitud?: string;
    observacion?: string;
    categoria_programatica_codigo?: string;
    categoria_programatica?: string;
    notas?: string;
    memoria_id?: number;
    partida_id?: number;
    operacion_id?: number;
  }) => Promise<void>;
  // Presupuestos
  canApprove?: boolean;
  onAprobarPresupuestos?: (data?: {
    observacion?: string;
    memoria_id?: number;
    partida_id?: number;
  } | string) => Promise<void>;
  onDevolverPlanificacion?: (motivo: string) => Promise<void>;
  // Shared actions
  onObservar?: (motivo: string) => Promise<void>;
  onRechazar?: (motivo: string) => Promise<void>;
  canCancel?: boolean;
  canPrint?: boolean;
  onCancelRequest?: (cert: CertificacionPOA) => void;
  siguienteCorrelativoGlobal?: string;
  siguienteCorrelativoArea?: string;
}

class DetalleErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error en CertificacionDetalleModal:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center space-y-3">
          <AlertCircle size={36} className="text-rose-500 mx-auto" />
          <h4 className="font-bold text-sm text-theme-main">
            Ocurrió un inconveniente al cargar la vista de la certificación
          </h4>
          <p className="text-xs text-theme-muted max-w-md mx-auto">
            {this.state.error?.message || 'Error inesperado al renderizar el documento'}
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Reintentar
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const CertificacionDetalleModal: React.FC<CertificacionDetalleModalProps> = (props) => {
  if (!props.isOpen) return null;
  return (
    <DetalleErrorBoundary>
      <CertificacionDetalleModalContent {...props} />
    </DetalleErrorBoundary>
  );
};

const CertificacionDetalleModalContent: React.FC<CertificacionDetalleModalProps> = ({
  isOpen,
  onClose,
  certificacion,
  canCertify = false,
  canApprove = false,
  onCertificar,
  onAprobarPresupuestos,
  onDevolverPlanificacion,
  onObservar,
  onRechazar,
  canCancel = false,
  canPrint = false,
  onCancelRequest,
  siguienteCorrelativoGlobal = '',
  siguienteCorrelativoArea = '',
}) => {
  const { user } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);
  const notasTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Catálogos para alineación en Planificación
  const [partidasList, setPartidasList] = useState<Partida[]>([]);
  const [operacionesList, setOperacionesList] = useState<Operacion[]>([]);
  const [loadingCatalogos, setLoadingCatalogos] = useState<boolean>(false);

  // Memorias de Cálculo del Área (para comprobación de asignación)
  const [memoriasArea, setMemoriasArea] = useState<MemoriaCalculo[]>([]);
  const [loadingMemorias, setLoadingMemorias] = useState<boolean>(false);
  const [selectedMemoriaId, setSelectedMemoriaId] = useState<number | null>(null);
  const [showOtrasMemorias, setShowOtrasMemorias] = useState<boolean>(false);
  const [busquedaMemoria, setBusquedaMemoria] = useState<string>('');

  // Estados de alineación y edición (Planificación)
  const [selectedPartidaId, setSelectedPartidaId] = useState<number | null>(null);
  const [selectedOperacionId, setSelectedOperacionId] = useState<number | null>(null);
  const [codigoCert, setCodigoCert] = useState<string>('');
  const [oficioSolicitud, setOficioSolicitud] = useState<string>('');
  const [catProgCodigo, setCatProgCodigo] = useState<string>('210.0.0');
  const [catProgNombre, setCatProgNombre] = useState<string>('');
  const [notas, setNotas] = useState<string>('');
  const [observacionPlanif, setObservacionPlanif] = useState<string>('');

  // Estados para Presupuestos
  const [observacionPresup, setObservacionPresup] = useState<string>('');

  // Estados de acciones / submódulos
  const [actionPanelMode, setActionPanelMode] = useState<'none' | 'observar' | 'rechazar' | 'devolver_planificacion'>('none');
  const [motivoAccion, setMotivoAccion] = useState<string>('');
  const [showTrazabilidad, setShowTrazabilidad] = useState<boolean>(false);
  const [showDetallesAvanzadosPlanif, setShowDetallesAvanzadosPlanif] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Cargar catálogos cuando se abre el modal
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setLoadingCatalogos(true);

    Promise.all([
      partidaService.getPartidas().catch(() => ({ data: [] })),
      planificacionService.getOperaciones().catch(() => []),
    ])
      .then(([partidasRes, opsRes]) => {
        if (!isMounted) return;
        setPartidasList(partidasRes?.data || []);
        setOperacionesList(Array.isArray(opsRes) ? opsRes : []);
      })
      .finally(() => {
        if (isMounted) setLoadingCatalogos(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Cargar memorias de cálculo del área para comprobación
  useEffect(() => {
    if (!isOpen || !certificacion) return;
    let isMounted = true;
    setSelectedMemoriaId(certificacion.memoria || null);
    setShowOtrasMemorias(false);
    setBusquedaMemoria('');

    if (certificacion.gestion && certificacion.area) {
      setLoadingMemorias(true);
      getMemorias({
        gestion: certificacion.gestion,
        area: certificacion.area,
      })
        .then((list) => {
          if (isMounted) {
            setMemoriasArea(Array.isArray(list) ? list : []);
          }
        })
        .catch((err) => {
          console.error('Error al cargar memorias del área:', err);
        })
        .finally(() => {
          if (isMounted) setLoadingMemorias(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, certificacion]);

  // Inicializar valores según la certificación seleccionada
  useEffect(() => {
    if (isOpen && certificacion) {
      const initialPartidaId =
        typeof certificacion.partida === 'object' && certificacion.partida !== null
          ? Number((certificacion.partida as any).id) || null
          : Number(certificacion.partida) || null;
      setSelectedPartidaId(initialPartidaId);

      const rawOp = certificacion.operaciones?.[0];
      const initialOpId =
        typeof rawOp === 'number'
          ? rawOp
          : typeof rawOp === 'object' && rawOp !== null && 'id' in rawOp
          ? Number((rawOp as any).id) || null
          : certificacion.operaciones_detalle?.[0]?.id || null;
      setSelectedOperacionId(initialOpId);

      setCodigoCert(
        certificacion.codigo_certificacion || siguienteCorrelativoGlobal || ''
      );
      const rawOficio =
        certificacion.numero_oficio_solicitud ||
        siguienteCorrelativoArea ||
        certificacion.hoja_ruta ||
        '';
      setOficioSolicitud(
        cleanOficioSolicitud(
          rawOficio,
          certificacion.area_codigo,
          certificacion.area_nombre
        )
      );

      const defaultProgCod =
        certificacion.categoria_programatica_codigo ||
        certificacion.operaciones_detalle?.[0]?.programa_codigo ||
        certificacion.jerarquia_resumen?.programas?.[0]?.codigo ||
        '210.0.0';
      const defaultProgNom =
        certificacion.categoria_programatica ||
        certificacion.operaciones_detalle?.[0]?.programa_nombre ||
        certificacion.jerarquia_resumen?.programas?.[0]?.nombre ||
        'Programas de Producción y/o Servicios Institucionales EPTAM';

      setCatProgCodigo(defaultProgCod);
      setCatProgNombre(defaultProgNom);
      setNotas(certificacion.notas || '');
      setObservacionPlanif(certificacion.observacion_planificacion || '');
      setObservacionPresup(certificacion.observacion_presupuestos || '');
      setActionPanelMode('none');
      setMotivoAccion('');
    }
  }, [isOpen, certificacion, siguienteCorrelativoGlobal, siguienteCorrelativoArea]);

  // Auto-ajustar altura del textarea de notas
  const handleNotasInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    target.style.height = 'auto';
    target.style.height = `${target.scrollHeight}px`;
    setNotas(target.value);
  };

  if (!certificacion) return null;

  const montoNum = Number(certificacion.monto_solicitado) || 0;
  const estado = certificacion.estado;
  const isPendientePlanif = estado === 'PENDIENTE_PLANIFICACION';
  const isPendientePresup = estado === 'PENDIENTE_PRESUPUESTOS';
  const isAprobado = estado === 'APROBADO';

  const isPlanifControl = isPendientePlanif && canCertify;
  const isPresupControl = isPendientePresup && canApprove;
  const isSplitMode = isPlanifControl || isPresupControl;

  // Filtrado de memorias para búsqueda
  const memoriasFiltradas = useMemo(() => {
    if (!Array.isArray(memoriasArea)) return [];
    if (!busquedaMemoria.trim()) return memoriasArea;
    const q = busquedaMemoria.toLowerCase();
    return memoriasArea.filter((m) => {
      if (!m) return false;
      const matchCod = String(m.codigo || '').toLowerCase().includes(q);
      const matchJust = String(m.justificacion || '').toLowerCase().includes(q);
      const matchPart =
        String(m.partida_codigo || '').toLowerCase().includes(q) ||
        String(m.partida_nombre || '').toLowerCase().includes(q);
      const matchOp =
        String(m.operacion_codigo || '').toLowerCase().includes(q) ||
        String(m.operacion_descripcion || '').toLowerCase().includes(q);
      return matchCod || matchJust || matchPart || matchOp;
    });
  }, [memoriasArea, busquedaMemoria]);

  // Memoria actualmente seleccionada (con soporte de reasignación)
  const activeMemoria = useMemo(() => {
    if (!selectedMemoriaId || !Array.isArray(memoriasArea)) return null;
    return memoriasArea.find((m) => m && m.id === selectedMemoriaId) || null;
  }, [selectedMemoriaId, memoriasArea]);

  const esMemoriaReasignada = Boolean(
    selectedMemoriaId && certificacion.memoria && selectedMemoriaId !== certificacion.memoria
  );

  // Reasignar a otra Memoria de Cálculo del Área
  const handleSelectMemoria = (mem: MemoriaCalculo) => {
    setSelectedMemoriaId(mem.id);

    // Sincronizar Partida
    let newPartidaId = mem.partida_id || null;
    if (!newPartidaId && Array.isArray(mem.detalles) && mem.detalles.length > 0) {
      newPartidaId =
        (mem.detalles[0] as any).partida_id || (mem.detalles[0] as any).partida || null;
    }
    if (newPartidaId) {
      setSelectedPartidaId(newPartidaId);
    }

    // Sincronizar Operación POA
    if (mem.operacion) {
      setSelectedOperacionId(mem.operacion);
    }

    alertService.toast(`Memoria de Cálculo reasignada a: ${mem.codigo}`, 'info');
  };

  const handleRestaurarMemoriaOriginal = () => {
    setSelectedMemoriaId(certificacion.memoria || null);
    setSelectedPartidaId(certificacion.partida || null);
    const rawOp = certificacion.operaciones?.[0];
    const initialOpId =
      typeof rawOp === 'number'
        ? rawOp
        : typeof rawOp === 'object' && rawOp !== null && 'id' in rawOp
        ? Number((rawOp as any).id) || null
        : certificacion.operaciones_detalle?.[0]?.id || null;
    setSelectedOperacionId(initialOpId);
    alertService.toast('Se restauró la asignación original del área', 'info');
  };

  // Encontrar partida y operación seleccionada activamente (con fallback a la MC)
  const activePartida = useMemo(() => {
    if (selectedPartidaId && Array.isArray(partidasList)) {
      const found = partidasList.find((p) => p.id === selectedPartidaId);
      if (found) return found;
    }
    if (activeMemoria?.partida_codigo) {
      return {
        id: activeMemoria.partida_id || 0,
        codigo: activeMemoria.partida_codigo,
        nombre: activeMemoria.partida_nombre || '',
      } as Partida;
    }
    if (certificacion.partida_codigo) {
      return {
        id: typeof certificacion.partida === 'number' ? certificacion.partida : 0,
        codigo: certificacion.partida_codigo,
        nombre: certificacion.partida_nombre || certificacion.partida_literal || '',
      } as Partida;
    }
    return null;
  }, [selectedPartidaId, partidasList, activeMemoria, certificacion]);

  const activeOperacion = useMemo(() => {
    if (selectedOperacionId && Array.isArray(operacionesList)) {
      const found = operacionesList.find((op) => op.id === selectedOperacionId);
      if (found) return found;
    }
    if (activeMemoria?.operacion_codigo) {
      return {
        id: activeMemoria.operacion || 0,
        codigo: activeMemoria.operacion_codigo,
        descripcion: activeMemoria.operacion_descripcion || '',
      } as Operacion;
    }
    if (certificacion.operaciones_detalle?.[0]?.codigo) {
      return {
        id: certificacion.operaciones_detalle[0].id || 0,
        codigo: certificacion.operaciones_detalle[0].codigo,
        descripcion: certificacion.operaciones_detalle[0].descripcion || '',
      } as Operacion;
    }
    return null;
  }, [selectedOperacionId, operacionesList, activeMemoria, certificacion]);

  // Filtrar operaciones relevantes para el área de la solicitud
  const areaOperaciones = useMemo(() => {
    if (!Array.isArray(operacionesList)) return [];
    return operacionesList.filter(
      (op) => !op.area || op.area === certificacion.area
    );
  }, [operacionesList, certificacion.area]);
  const listaOpsParaMostrar = areaOperaciones.length > 0 ? areaOperaciones : (Array.isArray(operacionesList) ? operacionesList : []);

  // Cálculos financieros reactivos
  const memoriaTotalPresup = useMemo(() => {
    if (activeMemoria) {
      return Number(activeMemoria.total_presupuesto || 0);
    }
    return Number(certificacion.memoria_total_presupuestado || 0);
  }, [activeMemoria, certificacion.memoria_total_presupuestado]);

  const memoriaSaldoDisp = useMemo(() => {
    if (activeMemoria) {
      return Number(activeMemoria.saldo_disponible ?? activeMemoria.total_disponible ?? 0);
    }
    return Number(certificacion.memoria_saldo_disponible || 0);
  }, [activeMemoria, certificacion.memoria_saldo_disponible]);

  const saldoRestanteProyectado = memoriaSaldoDisp - montoNum;
  const tieneFondosSuficientes =
    !selectedMemoriaId || memoriaSaldoDisp >= montoNum;

  // Handlers para Planificación
  const handleCertificarAction = async () => {
    if (!codigoCert.trim()) {
      alertService.toast('El Nº de Certificación POA es obligatorio.', 'error');
      return;
    }
    if (!oficioSolicitud.trim()) {
      alertService.toast('El Nº de Oficio de Solicitud es obligatorio.', 'error');
      return;
    }

    const confirm = await alertService.confirm({
      title: '¿Emitir Certificación POA Oficial?',
      text: `Se emitirá el certificado "${codigoCert.trim()}" con la partida y operación verificadas. La solicitud se remitirá a Presupuestos para el visto bueno financiero.`,
      confirmButtonText: 'Sí, certificar y notificar',
      cancelButtonText: 'Cancelar',
      icon: 'question',
    });
    if (!confirm) return;

    setSubmitting(true);
    try {
      if (onCertificar) {
        await onCertificar({
          codigo_certificacion: codigoCert.trim(),
          numero_oficio_solicitud: oficioSolicitud.trim(),
          observacion: observacionPlanif.trim(),
          categoria_programatica_codigo: catProgCodigo.trim(),
          categoria_programatica: catProgNombre.trim(),
          notas: notas.trim(),
          memoria_id: selectedMemoriaId || undefined,
          partida_id: selectedPartidaId || undefined,
          operacion_id: selectedOperacionId || undefined,
        });
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      alertService.toast(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          'Error al emitir la certificación.',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Handlers para Presupuestos
  const handleAprobarPresupuestosAction = async () => {
    if (!tieneFondosSuficientes && (selectedMemoriaId || certificacion.memoria)) {
      alertService.toast(
        'No se puede otorgar visto bueno debido a que la Memoria de Cálculo no tiene fondos suficientes.',
        'error'
      );
      return;
    }

    const confirm = await alertService.confirm({
      title: '¿Otorgar Visto Bueno Financiero?',
      text: `Se verificó la suficiencia de fondos en la Memoria de Cálculo (Saldo: Bs. ${memoriaSaldoDisp.toLocaleString(
        'es-BO',
        { minimumFractionDigits: 2 }
      )}). La certificación quedará aprobada y concluida formalmente.`,
      confirmButtonText: 'Sí, otorgar visto bueno',
      cancelButtonText: 'Cancelar',
      icon: 'question',
    });
    if (!confirm) return;

    setSubmitting(true);
    try {
      if (onAprobarPresupuestos) {
        await onAprobarPresupuestos({
          observacion: observacionPresup.trim(),
          memoria_id: selectedMemoriaId || undefined,
          partida_id: selectedPartidaId || undefined,
        });
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      alertService.toast(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          'Error al otorgar el visto bueno financiero.',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Handlers comunes (Observar / Rechazar)
  const handleConfirmObservacion = async () => {
    if (!motivoAccion.trim()) {
      alertService.toast('Debe ingresar el motivo de la observación.', 'error');
      return;
    }

    const confirm = await alertService.confirm({
      title: '¿Devolver con Observación?',
      text: `La solicitud será devuelta a la Gerencia ${certificacion.area_nombre} para subsanar los puntos observados.`,
      confirmButtonText: 'Sí, devolver con observación',
      cancelButtonText: 'Cancelar',
      isDanger: true,
    });
    if (!confirm) return;

    setSubmitting(true);
    try {
      if (onObservar) {
        await onObservar(motivoAccion.trim());
      }
      setActionPanelMode('none');
      onClose();
    } catch (err: any) {
      console.error(err);
      alertService.toast(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          'Error al observar la solicitud.',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmRechazo = async () => {
    if (!motivoAccion.trim()) {
      alertService.toast('Debe ingresar el motivo del rechazo.', 'error');
      return;
    }

    const confirm = await alertService.confirm({
      title: '¿Rechazar Solicitud Definitivamente?',
      text: `La solicitud quedará en estado RECHAZADO y se notificará a la Gerencia ${certificacion.area_nombre}.`,
      confirmButtonText: 'Sí, rechazar solicitud',
      cancelButtonText: 'Cancelar',
      isDanger: true,
    });
    if (!confirm) return;

    setSubmitting(true);
    try {
      if (onRechazar) {
        await onRechazar(motivoAccion.trim());
      }
      setActionPanelMode('none');
      onClose();
    } catch (err: any) {
      console.error(err);
      alertService.toast(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          'Error al rechazar la solicitud.',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDevolverPlanificacion = async () => {
    if (!motivoAccion.trim()) {
      alertService.toast('Debe ingresar el motivo de la devolución a Planificación.', 'error');
      return;
    }

    const confirm = await alertService.confirm({
      title: '¿Devolver a Certificación / Planificación?',
      text: `La solicitud será devuelta a la Unidad de Planificación para reajuste técnico de alineación o certificación.`,
      confirmButtonText: 'Sí, devolver a Planificación',
      cancelButtonText: 'Cancelar',
      icon: 'question',
    });
    if (!confirm) return;

    setSubmitting(true);
    try {
      if (onDevolverPlanificacion) {
        await onDevolverPlanificacion(motivoAccion.trim());
      }
      setActionPanelMode('none');
      onClose();
    } catch (err: any) {
      console.error(err);
      alertService.toast(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          'Error al devolver la solicitud a Planificación.',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderMemoriaSelector = (roleBadge: 'Planificación' | 'Presupuestos') => (
    <div className="p-3.5 rounded-xl bg-theme-base border border-theme-border space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-theme-main">
          <Coins
            size={15}
            className={
              roleBadge === 'Planificación'
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-emerald-600 dark:text-emerald-400'
            }
          />
          <span>Memoria de Cálculo (MC) Asignada:</span>
          {esMemoriaReasignada && (
            <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
              Reasignada
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowOtrasMemorias(!showOtrasMemorias)}
          className="text-[11px] font-semibold text-theme-primary hover:underline flex items-center gap-1"
        >
          <span>
            {showOtrasMemorias
              ? 'Ocultar catálogo'
              : `Comprobar otras MCs (${memoriasArea.length})`}
          </span>
          {showOtrasMemorias ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {/* Tarjeta de la MC actualmente seleccionada */}
      <div className="p-2.5 rounded-lg bg-theme-surface border border-theme-border/60 text-xs space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="font-mono font-bold text-sm text-theme-main">
            {activeMemoria?.codigo || certificacion.memoria_codigo || 'Sin MC directa'}
          </span>
          <span
            className={`text-[11px] font-mono font-bold ${
              tieneFondosSuficientes
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            Saldo: Bs. {memoriaSaldoDisp.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
          </span>
        </div>
        {(activeMemoria?.justificacion || certificacion.memoria_justificacion) && (
          <p className="text-[11px] text-theme-muted italic line-clamp-2">
            "{activeMemoria?.justificacion || certificacion.memoria_justificacion}"
          </p>
        )}
        <div className="grid grid-cols-2 gap-2 text-[10.5px] pt-1.5 border-t border-theme-border/50 text-theme-muted">
          <div>
            <span className="block text-[9px] uppercase font-bold text-theme-muted">
              Partida Vinculada:
            </span>
            <span
              className="font-semibold text-theme-main truncate block"
              title={activePartida?.nombre || ''}
            >
              {activePartida?.codigo || activeMemoria?.partida_codigo || certificacion.partida_codigo || 'S/C'}{' '}
              —{' '}
              {activePartida?.nombre || activeMemoria?.partida_nombre || certificacion.partida_nombre || 'S/P'}
            </span>
          </div>
          <div>
            <span className="block text-[9px] uppercase font-bold text-theme-muted">
              Operación POA:
            </span>
            <span
              className="font-semibold text-theme-main truncate block"
              title={activeOperacion?.descripcion || ''}
            >
              {activeOperacion?.codigo || activeMemoria?.operacion_codigo || certificacion.operaciones_detalle?.[0]?.codigo || 'S/C'}
            </span>
          </div>
        </div>
      </div>

      {/* Catálogo desplegable para comprobar y reasignar si la gerencia se equivocó */}
      {showOtrasMemorias && (
        <div className="p-2.5 rounded-lg bg-theme-surface border border-theme-border/70 space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-theme-muted">
              Memorias registradas de la Gerencia ({certificacion.area_nombre}):
            </span>
            {esMemoriaReasignada && (
              <button
                type="button"
                onClick={handleRestaurarMemoriaOriginal}
                className="text-[10px] text-theme-muted hover:text-theme-main underline flex items-center gap-1"
              >
                <RotateCcw size={10} />
                Restaurar original
              </button>
            )}
          </div>

          {memoriasArea.length > 3 && (
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-2 text-theme-muted" />
              <input
                type="text"
                value={busquedaMemoria}
                onChange={(e) => setBusquedaMemoria(e.target.value)}
                placeholder="Buscar por código, justificación, partida u operación..."
                className="w-full pl-7 pr-2.5 py-1 text-xs rounded border border-theme-border bg-theme-base text-theme-main focus:outline-none focus:ring-1 focus:ring-theme-primary"
              />
            </div>
          )}

          <div className="max-h-52 overflow-y-auto space-y-1.5 pr-0.5">
            {loadingMemorias ? (
              <div className="p-3 text-center text-xs text-theme-muted">
                Cargando memorias del área...
              </div>
            ) : memoriasFiltradas.length === 0 ? (
              <div className="p-3 text-center text-xs text-theme-muted">
                {memoriasArea.length === 0
                  ? 'No existen otras memorias de cálculo registradas para esta área y gestión.'
                  : 'No se encontraron memorias que coincidan con la búsqueda.'}
              </div>
            ) : (
              memoriasFiltradas.map((mem) => {
                const isSelected = mem.id === selectedMemoriaId;
                const saldo = Number(mem.saldo_disponible ?? mem.total_disponible ?? 0);
                const alcanza = saldo >= montoNum;
                return (
                  <div
                    key={mem.id}
                    className={`p-2 rounded-lg border text-xs transition flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-theme-primary/10 border-theme-primary text-theme-main shadow-xs'
                        : 'bg-theme-base border-theme-border/70 hover:border-theme-primary/40'
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-theme-main">{mem.codigo}</span>
                        <span className="text-[10px] font-mono text-theme-muted">
                          Partida: {mem.partida_codigo || 'S/P'}
                        </span>
                        {mem.operacion_codigo && (
                          <span className="text-[10px] font-mono text-theme-muted">
                            &bull; Op: {mem.operacion_codigo}
                          </span>
                        )}
                      </div>
                      <p className="text-[10.5px] text-theme-muted truncate" title={mem.justificacion}>
                        {mem.justificacion}
                      </p>
                      <div className="flex items-center gap-2 text-[10px]">
                        <span
                          className={`font-mono font-bold ${
                            alcanza
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          Saldo: Bs. {saldo.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                        </span>
                        {!alcanza && (
                          <span className="text-rose-500 font-semibold">(Fondos insuficientes)</span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isSelected ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded bg-theme-primary text-white">
                          <Check size={11} /> Asignada
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSelectMemoria(mem)}
                          className="text-[10.5px] py-1 px-2 font-bold hover:bg-theme-primary hover:text-white"
                        >
                          Asignar
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isPlanifControl
          ? `Panel de Revisión POA — ${certificacion.hoja_ruta || 'S/N'}`
          : isPresupControl
          ? `Control Presupuestario — ${certificacion.hoja_ruta || 'S/N'}`
          : `Certificación POA — ${certificacion.hoja_ruta || 'S/N'}`
      }
      size="full"
    >
      <div className="space-y-4 max-w-[1550px] mx-auto">
        {/* ── Barra Superior Informativa ─────────────────────────────────────── */}
        <div className="p-3 rounded-xl bg-theme-surface border border-theme-border flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            <StatusBadge status={certificacion.estado} />
            <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-theme-primary/10 text-theme-primary border border-theme-primary/20">
              {certificacion.es_contratacion ? 'Contratación POA' : 'Gasto Directo'}
            </span>
            <span className="text-[11px] font-semibold text-theme-muted">
              Área: <strong className="text-theme-main">{certificacion.area_nombre}</strong>
            </span>
            {(activeMemoria?.codigo || certificacion.memoria_codigo) && (
              <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-theme-base border border-theme-border text-theme-main">
                MC: {activeMemoria?.codigo || certificacion.memoria_codigo}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-theme-muted block">
                Monto Solicitado
              </span>
              <strong className="text-sm font-extrabold font-mono text-theme-main">
                Bs. {montoNum.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
              </strong>
            </div>

            {isAprobado && canPrint && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  imprimirCertificacion(certificacion, {
                    codigo_certificacion: codigoCert,
                    numero_oficio_solicitud: oficioSolicitud,
                    categoria_programatica_codigo: catProgCodigo,
                    categoria_programatica: catProgNombre,
                    notas: notas,
                    partida_codigo: activePartida?.codigo || activeMemoria?.partida_codigo,
                    partida_nombre: activePartida?.nombre || activeMemoria?.partida_nombre,
                    operacion_codigo: activeOperacion?.codigo || activeMemoria?.operacion_codigo,
                    operacion_descripcion: activeOperacion?.descripcion || activeMemoria?.operacion_descripcion,
                  })
                }
                icon={<Printer size={14} />}
                className="font-bold print:hidden"
              >
                Imprimir
              </Button>
            )}
          </div>
        </div>

        {/* ── CUERPO PRINCIPAL: PANEL DE CONTROL SPLIT VIEW O VISTA LIMPIA ──── */}
        <div
          className={`grid gap-5 items-start ${
            isSplitMode ? 'grid-cols-1 xl:grid-cols-12' : 'grid-cols-1'
          }`}
        >
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* COLUMNA IZQUIERDA: PANEL DE CONTROL DE PLANIFICACIÓN               */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {isPlanifControl && (
            <div className="xl:col-span-5 space-y-4">
              <div className="p-4 rounded-2xl bg-theme-surface border border-indigo-500/30 shadow-sm space-y-4">
                {/* Encabezado del Panel */}
                <div className="flex items-center justify-between pb-3 border-b border-theme-border">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                    <ShieldCheck size={18} />
                    <span>Alineación Técnica y Emisión</span>
                  </div>
                  <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-mono font-bold">
                    Planificación
                  </span>
                </div>

                {/* Subpanel de Observar o Rechazar si está activo */}
                {actionPanelMode !== 'none' ? (
                  <div
                    className={`p-3.5 rounded-xl border space-y-2.5 animate-in fade-in duration-150 ${
                      actionPanelMode === 'observar'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span>
                        {actionPanelMode === 'observar'
                          ? 'Motivo de la Observación (Devolver al Área):'
                          : 'Motivo del Rechazo Definitivo:'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setActionPanelMode('none')}
                        className="text-theme-muted hover:text-theme-main text-xs"
                      >
                        ✕ Cancelar
                      </button>
                    </div>
                    <textarea
                      value={motivoAccion}
                      onChange={(e) => setMotivoAccion(e.target.value)}
                      placeholder={
                        actionPanelMode === 'observar'
                          ? 'Indica qué debe corregir la gerencia (imputación incorrecta, justificación, especificaciones)...'
                          : 'Indica la causa insubsanable del rechazo...'
                      }
                      rows={3}
                      className="w-full text-xs p-2.5 rounded-lg border border-theme-border bg-theme-surface text-theme-main focus:outline-none focus:ring-1 focus:ring-theme-primary"
                    />
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setActionPanelMode('none')}
                        disabled={submitting}
                      >
                        Volver
                      </Button>
                      <Button
                        size="sm"
                        variant={actionPanelMode === 'observar' ? 'outline' : 'danger'}
                        onClick={
                          actionPanelMode === 'observar'
                            ? handleConfirmObservacion
                            : handleConfirmRechazo
                        }
                        loading={submitting}
                        className={
                          actionPanelMode === 'observar'
                            ? 'text-amber-700 dark:text-amber-400 border-amber-500/40 hover:bg-amber-500/10 font-bold'
                            : 'font-bold'
                        }
                      >
                        {actionPanelMode === 'observar'
                          ? 'Confirmar y Devolver'
                          : 'Confirmar Rechazo'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* 1. Comprobación de Suficiencia de Dinero en Memoria (Simple y Directo) */}
                    <div
                      className={`p-3 rounded-xl border ${
                        tieneFondosSuficientes
                          ? 'bg-emerald-500/10 border-emerald-500/30'
                          : 'bg-rose-500/10 border-rose-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {tieneFondosSuficientes ? (
                            <CheckCircle2
                              size={17}
                              className="text-emerald-600 dark:text-emerald-400 shrink-0"
                            />
                          ) : (
                            <AlertTriangle
                              size={17}
                              className="text-rose-600 dark:text-rose-400 shrink-0"
                            />
                          )}
                          <span
                            className={`text-xs font-bold ${
                              tieneFondosSuficientes
                                ? 'text-emerald-800 dark:text-emerald-200'
                                : 'text-rose-800 dark:text-rose-200'
                            }`}
                          >
                            {tieneFondosSuficientes
                              ? 'Fondos Suficientes para la Solicitud'
                              : 'Saldo Insuficiente en Memoria de Cálculo'}
                          </span>
                        </div>
                        <span className="font-mono text-xs font-bold text-theme-muted">
                          {activeMemoria?.codigo || certificacion.memoria_codigo || 'Sin MC'}
                        </span>
                      </div>

                      {/* 3 Valores clave en fila */}
                      <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-theme-border/40">
                        <div className="p-1.5 rounded-lg bg-theme-surface/80 border border-theme-border/40">
                          <span className="text-[9px] uppercase font-bold text-theme-muted block">
                            Saldo en MC:
                          </span>
                          <span className="text-xs font-mono font-bold text-theme-main">
                            Bs. {memoriaSaldoDisp.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="p-1.5 rounded-lg bg-theme-surface/80 border border-theme-border/40">
                          <span className="text-[9px] uppercase font-bold text-theme-muted block">
                            Solicitado:
                          </span>
                          <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            Bs. {montoNum.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="p-1.5 rounded-lg bg-theme-surface/80 border border-theme-border/40">
                          <span className="text-[9px] uppercase font-bold text-theme-muted block">
                            Saldo Restante:
                          </span>
                          <span
                            className={`text-xs font-mono font-bold ${
                              saldoRestanteProyectado >= 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            Bs. {saldoRestanteProyectado.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      {/* Opción para verificar o cambiar a otra MC de la gerencia */}
                      <div className="pt-2 mt-2 border-t border-theme-border/30 flex items-center justify-between text-[11px]">
                        <button
                          type="button"
                          onClick={() => setShowOtrasMemorias(!showOtrasMemorias)}
                          className="font-semibold text-theme-primary hover:underline flex items-center gap-1"
                        >
                          <span>
                            {showOtrasMemorias
                              ? 'Ocultar catálogo de MCs'
                              : `Comprobar o cambiar a otra MC (${memoriasArea.length})`}
                          </span>
                          {showOtrasMemorias ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                        {esMemoriaReasignada && (
                          <button
                            type="button"
                            onClick={handleRestaurarMemoriaOriginal}
                            className="text-[10px] text-amber-600 hover:underline font-bold"
                          >
                            Restaurar original
                          </button>
                        )}
                      </div>

                      {showOtrasMemorias && (
                        <div className="mt-2 pt-2 border-t border-theme-border/50 space-y-2">
                          <input
                            type="text"
                            value={busquedaMemoria}
                            onChange={(e) => setBusquedaMemoria(e.target.value)}
                            placeholder="Buscar otra MC del área por código o partida..."
                            className="w-full text-[11px] p-2 rounded-lg border border-theme-border bg-theme-surface text-theme-main focus:outline-none"
                          />
                          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                            {memoriasFiltradas.map((m) => (
                              <div
                                key={m.id}
                                onClick={() => handleSelectMemoria(m)}
                                className={`p-2 rounded-lg border text-[11px] cursor-pointer transition ${
                                  selectedMemoriaId === m.id
                                    ? 'bg-theme-primary/10 border-theme-primary font-bold'
                                    : 'bg-theme-surface border-theme-border/60 hover:bg-theme-base'
                                }`}
                              >
                                <div className="flex justify-between">
                                  <span className="font-mono">{m.codigo}</span>
                                  <span className="font-mono text-emerald-600 font-bold">
                                    Bs. {Number(m.saldo_disponible || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                                <p className="text-[10px] text-theme-muted truncate">
                                  {m.justificacion || m.partida_nombre}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 2. Cotejo de Gasto y Partida Asignada (Comparar descripción de Gerencia vs Partida) */}
                    <div className="p-3.5 rounded-xl bg-theme-base border border-theme-border space-y-3">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-theme-main">
                        <FileText size={15} className="text-indigo-600 dark:text-indigo-400" />
                        <span>Cotejo de Gasto y Partida Asignada:</span>
                      </div>

                      {/* Descripción redactada por la Gerencia */}
                      <div className="p-2.5 rounded-lg bg-theme-surface border border-theme-border/60 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-theme-muted block">
                          Descripción / Concepto del Gasto (Redactado por Gerencia):
                        </span>
                        <p className="text-xs text-theme-main font-medium leading-relaxed bg-amber-50/60 dark:bg-amber-900/10 p-2 rounded border border-amber-200/60 dark:border-amber-700/30">
                          "{certificacion.concepto_gasto || 'Sin descripción detallada por la gerencia'}"
                        </p>
                        {certificacion.memoria_justificacion && (
                          <span className="text-[10px] text-theme-muted italic block pt-0.5">
                            Justificación en MC: {certificacion.memoria_justificacion}
                          </span>
                        )}
                      </div>

                      {/* Partida Presupuestaria Asignada con opción de corregir */}
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <label className="font-bold text-theme-main flex items-center gap-1.5">
                            <Layers size={14} className="text-theme-primary" />
                            <span>Partida Asignada (¿Corresponde al gasto?):</span>
                          </label>
                          {activePartida && (
                            <span className="text-[10px] font-mono font-bold text-theme-primary">
                              Partida {activePartida.codigo}
                            </span>
                          )}
                        </div>
                        <select
                          value={selectedPartidaId || ''}
                          onChange={(e) => setSelectedPartidaId(Number(e.target.value) || null)}
                          className="w-full text-xs p-2.5 rounded-lg border border-theme-border bg-theme-surface text-theme-main font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="">-- Seleccionar Partida Presupuestaria --</option>
                          {partidasList.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.codigo} — {p.nombre}
                            </option>
                          ))}
                        </select>
                        {activePartida && (
                          <p className="text-[11px] text-theme-muted bg-theme-surface/60 p-1.5 rounded border border-theme-border/40">
                            <strong>Objeto de la partida:</strong> {activePartida.nombre}
                          </p>
                        )}
                      </div>

                      {/* Operación POA */}
                      <div className="space-y-1.5 text-xs pt-1 border-t border-theme-border/40">
                        <div className="flex items-center justify-between">
                          <label className="font-bold text-theme-main flex items-center gap-1.5">
                            <Sparkles size={14} className="text-indigo-600 dark:text-indigo-400" />
                            <span>Operación POA:</span>
                          </label>
                          {activeOperacion && (
                            <span className="text-[10px] font-mono font-bold text-theme-muted">
                              {activeOperacion.codigo}
                            </span>
                          )}
                        </div>
                        <select
                          value={selectedOperacionId || ''}
                          onChange={(e) => setSelectedOperacionId(Number(e.target.value) || null)}
                          className="w-full text-xs p-2.5 rounded-lg border border-theme-border bg-theme-surface text-theme-main font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="">-- Seleccionar Operación POA --</option>
                          {listaOpsParaMostrar.map((op) => (
                            <option key={op.id} value={op.id}>
                              {op.codigo} — {(op.descripcion || '').slice(0, 75)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* 3. Acordeón para Más Detalles y Ajustes Técnicos (Sin Ruido por Defecto) */}
                    <div className="rounded-xl border border-theme-border bg-theme-base overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setShowDetallesAvanzadosPlanif(!showDetallesAvanzadosPlanif)}
                        className="w-full flex items-center justify-between p-2.5 text-left text-xs font-bold text-theme-muted hover:text-theme-main transition-colors"
                      >
                        <span>Más detalles y ajustes técnicos (Categoría, Notas, Correlativos)</span>
                        {showDetallesAvanzadosPlanif ? (
                          <ChevronUp size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        )}
                      </button>

                      {showDetallesAvanzadosPlanif && (
                        <div className="p-3 border-t border-theme-border space-y-3 bg-theme-surface animate-in fade-in duration-150">
                          {/* Categoría Programática */}
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="space-y-1">
                              <label className="font-bold text-theme-main text-[11px]">
                                Código Categ.:
                              </label>
                              <input
                                type="text"
                                value={catProgCodigo}
                                onChange={(e) => setCatProgCodigo(e.target.value)}
                                placeholder="210.0.0"
                                className="w-full p-2 text-xs rounded-lg border border-theme-border bg-theme-base text-theme-main font-mono"
                              />
                            </div>
                            <div className="col-span-2 space-y-1">
                              <label className="font-bold text-theme-main text-[11px]">
                                Denominación Categ. Programática:
                              </label>
                              <input
                                type="text"
                                value={catProgNombre}
                                onChange={(e) => setCatProgNombre(e.target.value)}
                                placeholder="Programas de Producción y/o Servicios..."
                                className="w-full p-2 text-xs rounded-lg border border-theme-border bg-theme-base text-theme-main"
                              />
                            </div>
                          </div>

                          {/* Notas Aclaratorias */}
                          <div className="space-y-1 text-xs">
                            <label className="font-bold text-theme-main text-[11px] block">
                              Notas del Certificado POA:
                            </label>
                            <textarea
                              ref={notasTextareaRef}
                              value={notas}
                              onInput={handleNotasInput}
                              rows={2}
                              placeholder="Notas adicionales o aclaratorias..."
                              className="w-full p-2.5 text-xs rounded-lg border border-theme-border bg-theme-base text-theme-main resize-none overflow-hidden"
                            />
                          </div>

                          {/* Códigos Oficiales Correlativos */}
                          <div className="p-2 rounded bg-theme-base border border-theme-border/60 text-[11px] grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-[10px] text-theme-muted block">
                                Nº Oficio Solicitud:
                              </span>
                              <span className="font-mono font-bold text-theme-main truncate block">
                                {oficioSolicitud || 'Generando...'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-theme-muted block">
                                Nº Certificación POA:
                              </span>
                              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 truncate block">
                                {codigoCert || 'Generando...'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Botones de Acción de Planificación */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-theme-border">
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setActionPanelMode('observar');
                            setMotivoAccion('');
                          }}
                          icon={<AlertCircle size={14} />}
                          className="text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 border-amber-500/30 font-bold"
                        >
                          Observar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setActionPanelMode('rechazar');
                            setMotivoAccion('');
                          }}
                          icon={<XCircle size={14} />}
                          className="text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border-rose-500/30 font-bold"
                        >
                          Rechazar
                        </Button>
                      </div>

                      <Button
                        size="sm"
                        variant="primary"
                        onClick={handleCertificarAction}
                        loading={submitting}
                        icon={<ShieldCheck size={15} />}
                        className="font-bold shadow-sm"
                      >
                        Certificar y Notificar
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* COLUMNA IZQUIERDA: PANEL DE CONTROL DE PRESUPUESTOS                */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {isPresupControl && (
            <div className="xl:col-span-5 space-y-4">
              <div className="p-4 rounded-2xl bg-theme-surface border border-emerald-500/30 shadow-sm space-y-4">
                {/* Encabezado del Panel */}
                <div className="flex items-center justify-between pb-3 border-b border-theme-border">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                    <Coins size={18} />
                    <span>Control y Verificación Financiera</span>
                  </div>
                  <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-mono font-bold">
                    Presupuestos
                  </span>
                </div>

                {/* Subpanel de Observar o Rechazar si está activo */}
                {actionPanelMode !== 'none' ? (
                  <div
                    className={`p-3.5 rounded-xl border space-y-2.5 animate-in fade-in duration-150 ${
                      actionPanelMode === 'observar'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
                        : actionPanelMode === 'devolver_planificacion'
                        ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-900 dark:text-indigo-200'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span>
                        {actionPanelMode === 'observar'
                          ? 'Motivo de la Observación (Devolver al Área):'
                          : actionPanelMode === 'devolver_planificacion'
                          ? 'Motivo de Devolución a Certificación / Planificación:'
                          : 'Motivo del Rechazo Presupuestario:'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setActionPanelMode('none')}
                        className="text-theme-muted hover:text-theme-main text-xs"
                      >
                        ✕ Cancelar
                      </button>
                    </div>
                    <textarea
                      value={motivoAccion}
                      onChange={(e) => setMotivoAccion(e.target.value)}
                      placeholder={
                        actionPanelMode === 'observar'
                          ? 'Indica qué aspecto financiero debe corregir o ajustar la gerencia...'
                          : actionPanelMode === 'devolver_planificacion'
                          ? 'Indica a la Unidad de Planificación los motivos para devolver la certificación...'
                          : 'Indica la justificación financiera por la que se deniega la solicitud...'
                      }
                      rows={3}
                      className="w-full text-xs p-2.5 rounded-lg border border-theme-border bg-theme-surface text-theme-main focus:outline-none focus:ring-1 focus:ring-theme-primary"
                    />
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setActionPanelMode('none')}
                        disabled={submitting}
                      >
                        Volver
                      </Button>
                      <Button
                        size="sm"
                        variant={actionPanelMode === 'rechazar' ? 'danger' : 'outline'}
                        onClick={
                          actionPanelMode === 'observar'
                            ? handleConfirmObservacion
                            : actionPanelMode === 'devolver_planificacion'
                            ? handleConfirmDevolverPlanificacion
                            : handleConfirmRechazo
                        }
                        loading={submitting}
                        className={
                          actionPanelMode === 'observar'
                            ? 'text-amber-700 dark:text-amber-400 border-amber-500/40 hover:bg-amber-500/10 font-bold'
                            : actionPanelMode === 'devolver_planificacion'
                            ? 'text-indigo-700 dark:text-indigo-400 border-indigo-500/40 hover:bg-indigo-500/10 font-bold'
                            : 'font-bold'
                        }
                      >
                        {actionPanelMode === 'observar'
                          ? 'Confirmar y Devolver al Área'
                          : actionPanelMode === 'devolver_planificacion'
                          ? 'Confirmar Devolución a Planificación'
                          : 'Confirmar Rechazo'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* 0. Comprobación y Selección de Memoria de Cálculo */}
                    {renderMemoriaSelector('Presupuestos')}

                    {/* Tarjeta Digestiva: Verificación de Plata y Suficiencia */}
                    <div className="p-3.5 rounded-xl bg-theme-base border border-theme-border space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-theme-muted">
                          Disponibilidad Financiera
                        </span>
                        <span className="font-mono text-xs font-bold text-theme-main">
                          {activeMemoria?.codigo || certificacion.memoria_codigo || 'General'}
                        </span>
                      </div>

                      {/* Métricas de Plata */}
                      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-theme-border/60 text-center">
                        <div className="p-2 rounded-lg bg-theme-surface border border-theme-border/50">
                          <span className="text-[9px] uppercase font-bold text-theme-muted block">
                            Saldo Disponible
                          </span>
                          <span className="font-mono font-bold text-xs text-theme-main">
                            Bs. {memoriaSaldoDisp.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        <div className="p-2 rounded-lg bg-theme-surface border border-theme-border/50">
                          <span className="text-[9px] uppercase font-bold text-theme-muted block">
                            Solicitado
                          </span>
                          <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
                            Bs. {montoNum.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        <div className="p-2 rounded-lg bg-theme-surface border border-theme-border/50">
                          <span className="text-[9px] uppercase font-bold text-theme-muted block">
                            Restante Proy.
                          </span>
                          <span
                            className={`font-mono font-bold text-xs ${
                              saldoRestanteProyectado >= 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            Bs. {saldoRestanteProyectado.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      {/* Semáforo / Badge de Suficiencia de Fondos */}
                      <div
                        className={`p-2.5 rounded-lg flex items-center gap-2 text-xs font-semibold ${
                          tieneFondosSuficientes
                            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                            : 'bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300'
                        }`}
                      >
                        {tieneFondosSuficientes ? (
                          <>
                            <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>Fondos Suficientes: Hay liquidez en la MC para este requerimiento.</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle size={16} className="text-rose-600 dark:text-rose-400 shrink-0" />
                            <span>Fondos Insuficientes: El monto solicitado supera el disponible.</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Observación de Presupuestos (opcional) */}
                    <div className="space-y-1 text-xs">
                      <label className="font-bold text-theme-main text-[11px] block">
                        Observación Presupuestaria (Opcional):
                      </label>
                      <textarea
                        value={observacionPresup}
                        onChange={(e) => setObservacionPresup(e.target.value)}
                        rows={2}
                        placeholder="Nota o constancia para el visto bueno financiero..."
                        className="w-full p-2.5 text-xs rounded-lg border border-theme-border bg-theme-base text-theme-main focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    {/* Botones de Acción de Presupuestos */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-theme-border">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setActionPanelMode('devolver_planificacion');
                            setMotivoAccion('');
                          }}
                          icon={<RotateCcw size={14} />}
                          className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 border-indigo-500/30 font-bold"
                        >
                          Devolver a Certificación
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setActionPanelMode('observar');
                            setMotivoAccion('');
                          }}
                          icon={<AlertCircle size={14} />}
                          className="text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 border-amber-500/30 font-bold"
                        >
                          Observar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setActionPanelMode('rechazar');
                            setMotivoAccion('');
                          }}
                          icon={<XCircle size={14} />}
                          className="text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border-rose-500/30 font-bold"
                        >
                          Rechazar
                        </Button>
                      </div>

                      <Button
                        size="sm"
                        variant="primary"
                        onClick={handleAprobarPresupuestosAction}
                        loading={submitting}
                        disabled={!tieneFondosSuficientes && Boolean(selectedMemoriaId || certificacion.memoria)}
                        icon={<Coins size={15} />}
                        className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                      >
                        Otorgar Visto Bueno
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* COLUMNA DERECHA (O COMPLETA): VISTA PREVIA REACTIVA DEL DOCUMENTO   */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div className={isSplitMode ? 'xl:col-span-7' : 'w-full'}>
            <div className="rounded-2xl overflow-hidden border border-theme-border/60 shadow-sm bg-slate-100 dark:bg-slate-900/60 p-2 sm:p-4">
              <CertificacionDocumentoOficial
                certificacion={certificacion}
                modoEdicion={false}
                valoresEdicion={{
                  codigo_certificacion: codigoCert,
                  numero_oficio_solicitud: oficioSolicitud,
                  categoria_programatica_codigo: catProgCodigo,
                  categoria_programatica: catProgNombre,
                  notas: notas,
                  partida_codigo: activePartida?.codigo || activeMemoria?.partida_codigo,
                  partida_nombre: activePartida?.nombre || activeMemoria?.partida_nombre,
                  operacion_codigo: activeOperacion?.codigo || activeMemoria?.operacion_codigo,
                  operacion_descripcion: activeOperacion?.descripcion || activeMemoria?.operacion_descripcion,
                }}
                printRef={printRef}
              />
            </div>
          </div>
        </div>

        {/* ── TRAZABILIDAD E HISTORIAL DEL TRÁMITE (AL FINAL DEL TODO) ────────── */}
        <div className="rounded-xl border border-theme-border bg-theme-base overflow-hidden">
          <button
            type="button"
            onClick={() => setShowTrazabilidad(!showTrazabilidad)}
            className="w-full flex items-center justify-between p-3.5 text-left text-xs font-bold text-theme-muted hover:text-theme-main transition-colors"
          >
            <div className="flex items-center gap-2">
              <Clock size={15} />
              <span>Trazabilidad del Flujo Institucional (Seguimiento del Trámite)</span>
            </div>
            {showTrazabilidad ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>

          {showTrazabilidad && (
            <div className="p-4 pt-1 space-y-3.5 border-t border-theme-border text-xs animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {/* Paso 1: Solicitud de Gerencia */}
                <div
                  className={`p-3 rounded-xl border text-xs space-y-1 ${
                    estado !== 'BORRADOR'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                      : 'bg-theme-surface border-theme-primary/40 text-theme-main'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    {estado !== 'BORRADOR' ? (
                      <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <Clock size={15} className="text-theme-primary shrink-0" />
                    )}
                    <span>1. Solicitud de Gerencia</span>
                  </div>
                  <p className="text-[11px] opacity-80 truncate">
                    {certificacion.solicitante_nombre || certificacion.area_nombre}
                  </p>
                  <span className="text-[10px] font-mono opacity-70 block">
                    CITE: {certificacion.hoja_ruta}
                  </span>
                </div>

                {/* Paso 2: Planificación */}
                <div
                  className={`p-3 rounded-xl border text-xs space-y-1 ${
                    isPendientePlanif
                      ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-800 dark:text-indigo-300 ring-1 ring-indigo-500/30'
                      : isPendientePresup || estado === 'PENDIENTE_TESORERIA' || isAprobado
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                      : estado === 'OBSERVADO' && certificacion.observacion_planificacion
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300'
                      : 'bg-theme-surface border-theme-border opacity-50 text-theme-muted'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    {isPendientePresup || estado === 'PENDIENTE_TESORERIA' || isAprobado ? (
                      <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : isPendientePlanif ? (
                      <Clock size={15} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                    ) : (
                      <ShieldCheck size={15} className="shrink-0" />
                    )}
                    <span>2. Certificación Técnica</span>
                  </div>
                  <p className="text-[11px] opacity-80 truncate">
                    {isPendientePresup || estado === 'PENDIENTE_TESORERIA' || isAprobado
                      ? certificacion.codigo_certificacion || 'Certificado Emitido'
                      : isPendientePlanif
                      ? 'En revisión de Planificación'
                      : 'Pendiente de turno'}
                  </p>
                </div>

                {/* Paso 3: Presupuestos */}
                <div
                  className={`p-3 rounded-xl border text-xs space-y-1 ${
                    estado === 'PENDIENTE_TESORERIA' || isAprobado
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                      : isPendientePresup
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-800 dark:text-amber-300 ring-1 ring-amber-500/30'
                      : estado === 'OBSERVADO' && certificacion.observacion_presupuestos
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300'
                      : 'bg-theme-surface border-theme-border opacity-50 text-theme-muted'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    {estado === 'PENDIENTE_TESORERIA' || isAprobado ? (
                      <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : isPendientePresup ? (
                      <Clock size={15} className="text-amber-600 dark:text-amber-400 shrink-0" />
                    ) : (
                      <Coins size={15} className="shrink-0" />
                    )}
                    <span>3. Visto Bueno Presupuestos</span>
                  </div>
                  <p className="text-[11px] opacity-80 truncate">
                    {estado === 'PENDIENTE_TESORERIA' || isAprobado
                      ? 'Aprobación Presupuestaria'
                      : isPendientePresup
                      ? 'En verificación de fondos'
                      : 'Pendiente de visto bueno'}
                  </p>
                </div>

                {/* Paso 4: Tesorería */}
                <div
                  className={`p-3 rounded-xl border text-xs space-y-1 ${
                    isAprobado
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                      : estado === 'PENDIENTE_TESORERIA'
                      ? 'bg-teal-500/10 border-teal-500/40 text-teal-800 dark:text-teal-300 ring-1 ring-teal-500/30'
                      : 'bg-theme-surface border-theme-border opacity-50 text-theme-muted'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    {isAprobado ? (
                      <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : estado === 'PENDIENTE_TESORERIA' ? (
                      <Coins size={15} className="text-teal-600 dark:text-teal-400 shrink-0" />
                    ) : (
                      <Coins size={15} className="shrink-0" />
                    )}
                    <span>4. Tesorería (Salida Fondos)</span>
                  </div>
                  <p className="text-[11px] opacity-80 truncate">
                    {isAprobado
                      ? `Desembolsado (${certificacion.comprobante_pago || 'Pagado'})`
                      : estado === 'PENDIENTE_TESORERIA'
                      ? 'En Tesorería (Por Desembolsar)'
                      : 'Pendiente de turno'}
                  </p>
                </div>
              </div>

              {/* Observaciones registradas si las hay */}
              {certificacion.observacion_planificacion && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs">
                  <strong>Observación Planificación:</strong> {certificacion.observacion_planificacion}
                </div>
              )}
              {certificacion.observacion_presupuestos && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs">
                  <strong>Observación Presupuestos:</strong> {certificacion.observacion_presupuestos}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Pie de Botones ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-2 border-t border-theme-border">
          <div>
            {canCancel &&
              (certificacion.estado === 'BORRADOR' ||
                certificacion.estado === 'OBSERVADO' ||
                certificacion.estado === 'PENDIENTE_PLANIFICACION') && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => onCancelRequest?.(certificacion)}
                  icon={<Ban size={14} />}
                >
                  Cancelar Solicitud
                </Button>
              )}
          </div>

          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
};
