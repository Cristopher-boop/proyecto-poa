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

  // Estados de verificación técnica y comparadores de Planificación
  const [operacionVerificada, setOperacionVerificada] = useState<boolean>(true);
  const [partidaVerificada, setPartidaVerificada] = useState<boolean>(true);
  const [showComparadorOps, setShowComparadorOps] = useState<boolean>(false);
  const [showComparadorPartidas, setShowComparadorPartidas] = useState<boolean>(false);
  const [busquedaComparadorOps, setBusquedaComparadorOps] = useState<string>('');

  // Cargar catálogos acotados a la gestión cuando se abre el modal
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setLoadingCatalogos(true);

    const gestParams: Record<string, any> = {};
    if (certificacion?.gestion) gestParams.gestion = certificacion.gestion;
    if (certificacion?.gestion_anio) gestParams.gestion_anio = certificacion.gestion_anio;

    Promise.all([
      partidaService.getPartidas().catch(() => ({ data: [] })),
      planificacionService.getOperaciones(gestParams).catch(() => []),
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
  }, [isOpen, certificacion?.gestion, certificacion?.gestion_anio]);

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
      setOperacionVerificada(true);
      setPartidaVerificada(true);
      setShowComparadorOps(false);
      setShowComparadorPartidas(false);
      setBusquedaComparadorOps('');
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

  // Partida asignada a la certificación (siempre resuelta sin depender de selección de edición)
  const activePartida = useMemo(() => {
    if (certificacion.partida_codigo) {
      return {
        id: typeof certificacion.partida === 'number' ? certificacion.partida : 0,
        codigo: certificacion.partida_codigo,
        nombre: certificacion.partida_nombre || certificacion.partida_literal || '',
      } as Partida;
    }
    if (activeMemoria?.partida_codigo) {
      return {
        id: activeMemoria.partida_id || 0,
        codigo: activeMemoria.partida_codigo,
        nombre: activeMemoria.partida_nombre || '',
      } as Partida;
    }
    if (selectedPartidaId && Array.isArray(partidasList)) {
      const found = partidasList.find((p) => p.id === selectedPartidaId);
      if (found) return found;
    }
    if (certificacion.partida_literal) {
      return {
        id: 0,
        codigo: '',
        nombre: certificacion.partida_literal,
      } as Partida;
    }
    return null;
  }, [certificacion, activeMemoria, selectedPartidaId, partidasList]);

  // Operación POA asignada a la certificación (siempre resuelta sin depender de select)
  const activeOperacion = useMemo(() => {
    if (certificacion.operaciones_detalle && certificacion.operaciones_detalle.length > 0) {
      const op0 = certificacion.operaciones_detalle[0];
      return {
        id: op0.id || 0,
        codigo: op0.codigo,
        descripcion: op0.descripcion,
        acp_codigo: op0.acp_codigo || '',
        acp_descripcion: op0.acp_descripcion || '',
        amp_codigo: op0.amp_codigo || '',
        programa_codigo: op0.programa_codigo || '',
        programa_nombre: op0.programa_nombre || '',
      } as any;
    }
    if (activeMemoria?.operacion_codigo) {
      return {
        id: activeMemoria.operacion || 0,
        codigo: activeMemoria.operacion_codigo,
        descripcion: activeMemoria.operacion_descripcion || '',
        acp_codigo: '',
        acp_descripcion: '',
        amp_codigo: '',
        programa_codigo: '',
      } as any;
    }
    if (selectedOperacionId && Array.isArray(operacionesList)) {
      const found = operacionesList.find((op) => op.id === selectedOperacionId);
      if (found) return found;
    }
    return null;
  }, [certificacion, activeMemoria, selectedOperacionId, operacionesList]);

  // Filtrar operaciones relevantes para el área de la solicitud
  const areaOperaciones = useMemo(() => {
    if (!Array.isArray(operacionesList)) return [];
    return operacionesList.filter((op) => {
      if (certificacion.gestion && op.gestion_id && Number(op.gestion_id) !== Number(certificacion.gestion)) return false;
      if (certificacion.gestion_anio && op.gestion_anio && Number(op.gestion_anio) !== Number(certificacion.gestion_anio)) return false;
      return !op.area || Number(op.area) === Number(certificacion.area);
    });
  }, [operacionesList, certificacion.area, certificacion.gestion, certificacion.gestion_anio]);
  const listaOpsParaMostrar = areaOperaciones.length > 0 ? areaOperaciones : (Array.isArray(operacionesList) ? operacionesList : []);

  // Operaciones del área filtradas para el comparador
  const operacionesComparadorFiltradas = useMemo(() => {
    const baseList = areaOperaciones.length > 0 ? areaOperaciones : (Array.isArray(operacionesList) ? operacionesList : []);
    if (!busquedaComparadorOps.trim()) return baseList;
    const q = busquedaComparadorOps.toLowerCase();
    return baseList.filter(
      (op) =>
        op.codigo.toLowerCase().includes(q) ||
        (op.descripcion || '').toLowerCase().includes(q) ||
        (op.acp_codigo || '').toLowerCase().includes(q)
    );
  }, [areaOperaciones, operacionesList, busquedaComparadorOps]);

  // Constantes y helpers para combinar sugerencias de Operación y Partida sin sobrescribir
  const TAG_SUG_OP = '[SUGERENCIA OPERACIÓN POA]';
  const TAG_SUG_PARTIDA = '[SUGERENCIA PARTIDA / MC]';

  const actualizarTextoObservacion = (
    prevText: string,
    tipo: 'operacion' | 'partida',
    detalle: string
  ): string => {
    const opRegex = /(?:\[SUGERENCIA OPERACIÓN POA\]|Asignación incorrecta de Operación POA)[^\n]*(?:\n(?!\s*\[SUGERENCIA|\s*Asignación incorrecta)[^\n]*)*/gi;
    const partRegex = /(?:\[SUGERENCIA PARTIDA \/ MC\]|Asignación incorrecta de Partida \/ MC)[^\n]*(?:\n(?!\s*\[SUGERENCIA|\s*Asignación incorrecta)[^\n]*)*/gi;

    let currentOpBlock = '';
    let currentPartidaBlock = '';
    let cleanText = prevText || '';

    const opMatch = cleanText.match(opRegex);
    if (opMatch) {
      currentOpBlock = opMatch[0].trim();
      cleanText = cleanText.replace(opRegex, '').trim();
    }

    const partMatch = cleanText.match(partRegex);
    if (partMatch) {
      currentPartidaBlock = partMatch[0].trim();
      cleanText = cleanText.replace(partRegex, '').trim();
    }

    if (tipo === 'operacion') {
      currentOpBlock = `${TAG_SUG_OP}: ${detalle}`;
    } else {
      currentPartidaBlock = `${TAG_SUG_PARTIDA}: ${detalle}`;
    }

    const sections: string[] = [];
    if (cleanText) sections.push(cleanText);
    if (currentOpBlock) sections.push(currentOpBlock);
    if (currentPartidaBlock) sections.push(currentPartidaBlock);

    return sections.join('\n\n');
  };

  const removerSugerencia = (
    prevText: string,
    tipo: 'operacion' | 'partida'
  ): string => {
    const opRegex = /(?:\[SUGERENCIA OPERACIÓN POA\]|Asignación incorrecta de Operación POA)[^\n]*(?:\n(?!\s*\[SUGERENCIA|\s*Asignación incorrecta)[^\n]*)*/gi;
    const partRegex = /(?:\[SUGERENCIA PARTIDA \/ MC\]|Asignación incorrecta de Partida \/ MC)[^\n]*(?:\n(?!\s*\[SUGERENCIA|\s*Asignación incorrecta)[^\n]*)*/gi;

    let res = prevText || '';
    if (tipo === 'operacion') {
      res = res.replace(opRegex, '').trim();
    } else {
      res = res.replace(partRegex, '').trim();
    }
    return res.replace(/\n{3,}/g, '\n\n').trim();
  };

  // Sugerir cambio de Operación (Planificación no cambia la BD, devuelve con sugerencia)
  const handleSugerirOperacion = (op: Operacion) => {
    setOperacionVerificada(false);
    setActionPanelMode('observar');
    const detalle = `Reasignar a la operación ${op.codigo} — ${op.descripcion || ''}${op.acp_codigo ? ` (ACP: ${op.acp_codigo})` : ''}. Motivo: No corresponde al concepto de gasto solicitado.`;
    setMotivoAccion((prev) => actualizarTextoObservacion(prev, 'operacion', detalle));
  };

  // Sugerir cambio de Partida / MC (Planificación no cambia la BD, devuelve con sugerencia)
  const handleSugerirPartidaMC = (mem: MemoriaCalculo) => {
    setPartidaVerificada(false);
    setActionPanelMode('observar');
    const pCod = mem.partida_codigo || '';
    const pNom = mem.partida_nombre || '';
    const saldo = Number(mem.saldo_disponible || 0);
    const detalle = `Reasignar a la Partida ${pCod ? `${pCod} — ${pNom}` : 'correspondiente'} (Memoria de Cálculo ${mem.codigo}, Saldo disponible: Bs. ${saldo.toLocaleString('es-BO', { minimumFractionDigits: 2 })}). Motivo: Se adecúa con mayor precisión al concepto de gasto.`;
    setMotivoAccion((prev) => actualizarTextoObservacion(prev, 'partida', detalle));
  };

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
          // Planificación certifica la solicitud validada sin sobreescribir la asignación de la gerencia
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
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded bg-theme-primary text-theme-primaryText">
                          <Check size={11} /> Asignada
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSelectMemoria(mem)}
                          className="text-[10.5px] py-1 px-2 font-bold hover:bg-theme-primary hover:text-theme-primaryText"
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
              <div className="p-4 rounded-2xl bg-theme-surface border border-theme-primary/30 shadow-sm space-y-4">
                {/* Encabezado del Panel */}
                <div className="flex items-center justify-between pb-3 border-b border-theme-border">
                  <div className="flex items-center gap-2 text-theme-primary font-bold text-sm">
                    <ShieldCheck size={18} />
                    <span>Cotejo y Verificación Técnica POA</span>
                  </div>
                  <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-theme-primary/10 text-theme-primary font-mono font-bold">
                    Planificación SPO
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
                      <span className="flex items-center gap-1.5">
                        <AlertCircle size={15} />
                        {actionPanelMode === 'observar'
                          ? 'Sugerencia y Devolución a la Gerencia:'
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
                    <p className="text-[11px] text-theme-muted">
                      {actionPanelMode === 'observar'
                        ? 'Planificación sugiere la corrección adecuada. La solicitud volverá a la Gerencia para que aplique la sugerencia.'
                        : 'Indica la causa insubsanable del rechazo formal de la solicitud.'}
                    </p>
                    <textarea
                      value={motivoAccion}
                      onChange={(e) => setMotivoAccion(e.target.value)}
                      placeholder={
                        actionPanelMode === 'observar'
                          ? 'Indica qué debe corregir la gerencia (imputación incorrecta, sugerencia de partida o de operación)...'
                          : 'Indica la causa insubsanable del rechazo...'
                      }
                      rows={4}
                      className="w-full text-xs p-2.5 rounded-lg border border-theme-border bg-theme-surface text-theme-main focus:outline-none focus:ring-1 focus:ring-theme-primary font-medium"
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
                          ? 'Confirmar y Devolver con Sugerencia'
                          : 'Confirmar Rechazo'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* ── 1. Resumen de la Solicitud (Redactado por Gerencia) ── */}
                    <div className="p-3 rounded-xl bg-theme-base border border-theme-border/70 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[10px] uppercase font-bold text-theme-muted">
                          Concepto del Gasto Solicitado:
                        </span>
                        <span className="font-mono font-bold text-xs text-theme-primary">
                          Bs. {montoNum.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <p className="text-xs text-theme-main font-medium leading-relaxed bg-theme-surface p-2 rounded-lg border border-theme-border/60">
                        "{certificacion.concepto_gasto || 'Sin descripción detallada por la gerencia'}"
                      </p>
                      {certificacion.memoria_justificacion && (
                        <p className="text-[11px] text-theme-muted italic">
                          <strong>Justificación en MC:</strong> {certificacion.memoria_justificacion}
                        </p>
                      )}
                    </div>

                    {/* ── 2. PREGUNTA 1: ¿La Operación POA corresponde al gasto? ── */}
                    <div className="p-3.5 rounded-xl bg-theme-base border border-theme-border space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-theme-main">
                          <Sparkles size={14} className="text-theme-primary" />
                          <span>1. ¿La Operación POA corresponde al gasto?</span>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            operacionVerificada
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              operacionVerificada ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                          />
                          {operacionVerificada ? 'Asignación Conforme' : 'Observada / Sugerir'}
                        </span>
                      </div>

                      {/* Operación Asignada por la Gerencia (Solo Lectura) */}
                      <div className="p-2.5 rounded-lg bg-theme-surface border border-theme-border/70 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-xs text-theme-primary">
                            {activeOperacion?.codigo || 'Sin Operación POA asignada'}
                          </span>
                          {activeOperacion?.acp_codigo && (
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-theme-base text-theme-muted border border-theme-border">
                              {activeOperacion.acp_codigo}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-theme-main font-medium leading-relaxed">
                          {activeOperacion?.descripcion || 'No se cuenta con descripción de la operación vinculada.'}
                        </p>
                      </div>

                      {/* Botones de Validación Rápida y Comparador */}
                      <div className="flex items-center justify-between pt-1 text-xs">
                        <button
                          type="button"
                          onClick={() => setShowComparadorOps(!showComparadorOps)}
                          className="font-semibold text-theme-primary hover:underline flex items-center gap-1 text-[11px]"
                        >
                          <span>
                            {showComparadorOps
                              ? 'Ocultar otras Operaciones'
                              : `Comparar con otras Operaciones (${areaOperaciones.length})`}
                          </span>
                          {showComparadorOps ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setOperacionVerificada(true);
                              setShowComparadorOps(false);
                              setMotivoAccion((prev) => {
                                const updated = removerSugerencia(prev, 'operacion');
                                if (!updated && partidaVerificada) {
                                  setActionPanelMode('none');
                                }
                                return updated;
                              });
                            }}
                            className={`px-2 py-0.5 rounded text-[11px] font-bold border transition ${
                              operacionVerificada
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                                : 'bg-theme-surface text-theme-muted hover:text-theme-main border-theme-border'
                            }`}
                          >
                            ✓ Corresponde
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOperacionVerificada(false);
                              setShowComparadorOps(true);
                              setActionPanelMode('observar');
                            }}
                            className={`px-2 py-0.5 rounded text-[11px] font-bold border transition ${
                              !operacionVerificada
                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                                : 'bg-theme-surface text-theme-muted hover:text-theme-main border-theme-border'
                            }`}
                          >
                            ✕ No corresponde
                          </button>
                        </div>
                      </div>

                      {/* Comparador desplegable de Operaciones */}
                      {showComparadorOps && (
                        <div className="mt-2 pt-2 border-t border-theme-border/50 space-y-2 animate-in fade-in duration-150">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={busquedaComparadorOps}
                              onChange={(e) => setBusquedaComparadorOps(e.target.value)}
                              placeholder="Buscar otra operación por código o descripción..."
                              className="w-full text-[11px] p-2 rounded-lg border border-theme-border bg-theme-surface text-theme-main focus:outline-none"
                            />
                          </div>
                          <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                            {operacionesComparadorFiltradas.length === 0 ? (
                              <p className="text-[11px] text-theme-muted italic text-center py-2">
                                No se encontraron otras operaciones para esta área.
                              </p>
                            ) : (
                              operacionesComparadorFiltradas.map((op) => {
                                const isCurrent = activeOperacion?.id === op.id || activeOperacion?.codigo === op.codigo;
                                return (
                                  <div
                                    key={op.id}
                                    className={`p-2 rounded-lg border text-[11px] flex items-center justify-between gap-2 ${
                                      isCurrent
                                        ? 'bg-theme-primary/10 border-theme-primary/40'
                                        : 'bg-theme-surface border-theme-border/60 hover:bg-theme-base'
                                    }`}
                                  >
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-mono font-bold text-theme-primary">
                                          {op.codigo}
                                        </span>
                                        {op.acp_codigo && (
                                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-theme-base text-theme-muted border">
                                            {op.acp_codigo}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[10px] text-theme-main truncate" title={op.descripcion}>
                                        {op.descripcion}
                                      </p>
                                    </div>
                                    {!isCurrent && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleSugerirOperacion(op)}
                                        className="text-[10px] py-1 px-2 font-bold shrink-0 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 border-amber-500/30"
                                      >
                                        Sugerir esta OP
                                      </Button>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ── 3. PREGUNTA 2: ¿La Partida / MC corresponde al concepto de gasto? ── */}
                    <div className="p-3.5 rounded-xl bg-theme-base border border-theme-border space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-theme-main">
                          <Layers size={14} className="text-theme-primary" />
                          <span>2. ¿La Partida / MC corresponde al concepto?</span>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            partidaVerificada
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              partidaVerificada ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                          />
                          {partidaVerificada ? 'Asignación Conforme' : 'Observada / Sugerir'}
                        </span>
                      </div>

                      {/* Partida Asignada por la Gerencia (SIEMPRE VISIBLE) */}
                      <div className="p-2.5 rounded-lg bg-theme-surface border border-theme-border/70 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-theme-muted">
                            Partida Presupuestaria Asignada:
                          </span>
                          {activePartida?.codigo && (
                            <span className="font-mono font-bold text-xs text-theme-primary">
                              Partida {activePartida.codigo}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-theme-main">
                          {activePartida
                            ? `${activePartida.codigo ? `${activePartida.codigo} — ` : ''}${activePartida.nombre}`
                            : certificacion.partida_literal || 'Sin Partida asignada en la solicitud'}
                        </p>

                        {/* Memoria de Cálculo y Suficiencia Financiera */}
                        <div className="pt-2 border-t border-theme-border/40 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-theme-muted font-semibold">
                              Memoria: <strong className="font-mono text-theme-main">{activeMemoria?.codigo || certificacion.memoria_codigo || 'Sin MC'}</strong>
                            </span>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                tieneFondosSuficientes
                                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-rose-500/10 text-rose-700 dark:text-rose-300'
                              }`}
                            >
                              {tieneFondosSuficientes ? 'Fondos Suficientes ✓' : 'Saldo Insuficiente ✕'}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                            <div className="p-1 rounded bg-theme-base border border-theme-border/50">
                              <span className="text-theme-muted block font-semibold">Saldo MC</span>
                              <strong className="font-mono text-theme-main">
                                Bs. {memoriaSaldoDisp.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                              </strong>
                            </div>
                            <div className="p-1 rounded bg-theme-base border border-theme-border/50">
                              <span className="text-theme-muted block font-semibold">Solicitado</span>
                              <strong className="font-mono text-theme-primary">
                                Bs. {montoNum.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                              </strong>
                            </div>
                            <div className="p-1 rounded bg-theme-base border border-theme-border/50">
                              <span className="text-theme-muted block font-semibold">Restante</span>
                              <strong
                                className={`font-mono ${
                                  saldoRestanteProyectado >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                }`}
                              >
                                Bs. {saldoRestanteProyectado.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                              </strong>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Botones de Validación Rápida y Comparador de Partidas */}
                      <div className="flex items-center justify-between pt-1 text-xs">
                        <button
                          type="button"
                          onClick={() => setShowComparadorPartidas(!showComparadorPartidas)}
                          className="font-semibold text-theme-primary hover:underline flex items-center gap-1 text-[11px]"
                        >
                          <span>
                            {showComparadorPartidas
                              ? 'Ocultar otras Partidas / MCs'
                              : `Comparar con otras Partidas / MCs (${memoriasArea.length})`}
                          </span>
                          {showComparadorPartidas ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setPartidaVerificada(true);
                              setShowComparadorPartidas(false);
                              setMotivoAccion((prev) => {
                                const updated = removerSugerencia(prev, 'partida');
                                if (!updated && operacionVerificada) {
                                  setActionPanelMode('none');
                                }
                                return updated;
                              });
                            }}
                            className={`px-2 py-0.5 rounded text-[11px] font-bold border transition ${
                              partidaVerificada
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                                : 'bg-theme-surface text-theme-muted hover:text-theme-main border-theme-border'
                            }`}
                          >
                            ✓ Corresponde
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPartidaVerificada(false);
                              setShowComparadorPartidas(true);
                              setActionPanelMode('observar');
                            }}
                            className={`px-2 py-0.5 rounded text-[11px] font-bold border transition ${
                              !partidaVerificada
                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                                : 'bg-theme-surface text-theme-muted hover:text-theme-main border-theme-border'
                            }`}
                          >
                            ✕ No corresponde
                          </button>
                        </div>
                      </div>

                      {/* Comparador desplegable de Partidas y MCs */}
                      {showComparadorPartidas && (
                        <div className="mt-2 pt-2 border-t border-theme-border/50 space-y-2 animate-in fade-in duration-150">
                          <input
                            type="text"
                            value={busquedaMemoria}
                            onChange={(e) => setBusquedaMemoria(e.target.value)}
                            placeholder="Buscar por código de MC, código o nombre de partida..."
                            className="w-full text-[11px] p-2 rounded-lg border border-theme-border bg-theme-surface text-theme-main focus:outline-none"
                          />
                          <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                            {memoriasFiltradas.length === 0 ? (
                              <p className="text-[11px] text-theme-muted italic text-center py-2">
                                No se encontraron otras memorias para esta área.
                              </p>
                            ) : (
                              memoriasFiltradas.map((m) => {
                                const isCurrent = (activeMemoria?.id === m.id) || (certificacion.memoria === m.id);
                                const saldo = Number(m.saldo_disponible || 0);
                                const pCod = m.partida_codigo || '';
                                const pNom = m.partida_nombre || '';
                                return (
                                  <div
                                    key={m.id}
                                    className={`p-2 rounded-lg border text-[11px] flex items-center justify-between gap-2 ${
                                      isCurrent
                                        ? 'bg-theme-primary/10 border-theme-primary/40'
                                        : 'bg-theme-surface border-theme-border/60 hover:bg-theme-base'
                                    }`}
                                  >
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center justify-between">
                                        <span className="font-mono font-bold text-theme-main">
                                          {m.codigo}
                                        </span>
                                        <span className="font-mono text-emerald-600 font-bold text-[10px]">
                                          Bs. {saldo.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                        </span>
                                      </div>
                                      <p className="text-[10px] font-bold text-theme-primary truncate">
                                        {pCod ? `Partida ${pCod} — ${pNom}` : (m.justificacion || 'Sin partida')}
                                      </p>
                                      {pCod && m.justificacion && (
                                        <p className="text-[9.5px] text-theme-muted truncate" title={m.justificacion}>
                                          {m.justificacion}
                                        </p>
                                      )}
                                    </div>
                                    {!isCurrent && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleSugerirPartidaMC(m)}
                                        className="text-[10px] py-1 px-2 font-bold shrink-0 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 border-amber-500/30"
                                      >
                                        Sugerir Partida
                                      </Button>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ── 4. Acordeón de Ajustes Oficiales (Categoría, Notas, Correlativos) ── */}
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
                              <span className="font-mono font-bold text-theme-primary truncate block">
                                {codigoCert || 'Generando...'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ── 5. Botones de Acción de Planificación ── */}
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
                          Devolver con Observación
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
