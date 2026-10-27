import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowRightLeft,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Building2,
  ShieldCheck,
  Sparkles,
  Layers,
  HelpCircle,
} from 'lucide-react';
import {
  Area,
  MemoriaCalculo,
  CrearModificacionPayload,
  Partida,
} from '../../../services/presupuestoService';
import { Modal, Button, Dropdown, DropdownItem } from '../../../components/commons';
import { modificacionesApi } from '../api/modificacionesApi';
import alertService from '../../../utils/alerts';

interface FilaOrigenItem {
  id: string;
  memoriaId: number | '';
  monto: number | '';
}

interface FilaDestinoItem {
  id: string;
  esNuevaPartida: boolean;
  memoriaId: number | '';
  partidaId: number | '';
  operacionId: number | '';
  monto: number | '';
}

interface NuevaModificacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CrearModificacionPayload) => Promise<void>;
  areas: Area[];
  memorias: MemoriaCalculo[];
  partidas?: Partida[];
  operaciones?: any[];
  selectedGestionId: number | null;
  gestionAnio?: number;
  isGestionBloqueada: boolean;
  userAreaId?: number | null;
  userAreaNombre?: string | null;
  isAdmin: boolean;
  isGerente: boolean;
  actionLoading?: boolean;
}

export const NuevaModificacionModal: React.FC<NuevaModificacionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  areas,
  memorias,
  partidas = [],
  operaciones = [],
  selectedGestionId,
  gestionAnio,
  isGestionBloqueada,
  userAreaId,
  userAreaNombre,
  isAdmin,
  isGerente,
  actionLoading = false,
}) => {
  // Modalidad de la modificación
  const [tipoModificacion, setTipoModificacion] = useState<'TRASPASO_INTRA_AREA' | 'TRASPASO_INTER_AREA'>(
    'TRASPASO_INTRA_AREA'
  );

  // Áreas
  const [modalAreaId, setModalAreaId] = useState<number | ''>(''); // Área Solicitante (Receptora)
  const [areaCedenteId, setAreaCedenteId] = useState<number | ''>(''); // Área Cedente (en caso Inter-Gerencias)
  const [extraMemorias, setExtraMemorias] = useState<MemoriaCalculo[]>([]);
  const [loadingCedente, setLoadingCedente] = useState<boolean>(false);

  const [motivo, setMotivo] = useState<string>('');
  const [filasOrigen, setFilasOrigen] = useState<FilaOrigenItem[]>([
    { id: 'orig-1', memoriaId: '', monto: '' },
  ]);
  const [filasDestino, setFilasDestino] = useState<FilaDestinoItem[]>([
    { id: 'dest-1', esNuevaPartida: false, memoriaId: '', partidaId: '', operacionId: '', monto: '' },
  ]);

  // Carga reactiva de memorias del Área Cedente cuando se selecciona en flujo Inter-Gerencias
  useEffect(() => {
    if (!isOpen || tipoModificacion !== 'TRASPASO_INTER_AREA' || !areaCedenteId || !selectedGestionId) {
      setExtraMemorias([]);
      return;
    }

    let isMounted = true;
    setLoadingCedente(true);
    modificacionesApi
      .getMemorias({
        gestion: selectedGestionId,
        area: Number(areaCedenteId),
        para_modificacion: true,
      })
      .then((res) => {
        if (isMounted) {
          setExtraMemorias(Array.isArray(res) ? res : []);
        }
      })
      .catch((err) => {
        console.error('Error al cargar memorias del área cedente:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingCedente(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, tipoModificacion, areaCedenteId, selectedGestionId]);

  // Inicializar estado al abrir modal
  useEffect(() => {
    if (isOpen) {
      setTipoModificacion('TRASPASO_INTRA_AREA');
      if (isGerente && !isAdmin) {
        setModalAreaId(userAreaId || '');
      } else {
        setModalAreaId(areas[0]?.id || '');
      }
      setAreaCedenteId('');
      setExtraMemorias([]);
      setMotivo('');
      setFilasOrigen([{ id: `orig-${Date.now()}-1`, memoriaId: '', monto: '' }]);
      setFilasDestino([
        {
          id: `dest-${Date.now()}-1`,
          esNuevaPartida: false,
          memoriaId: '',
          partidaId: '',
          operacionId: '',
          monto: '',
        },
      ]);
    }
  }, [isOpen, isGerente, isAdmin, userAreaId, areas]);

  const formatMoney = (val: number | string) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB', minimumFractionDigits: 2 }).format(num || 0);
  };

  const getSaldo = (m?: MemoriaCalculo | null) => {
    if (!m) return 0;
    return parseFloat(m.saldo_disponible || m.total_disponible || '0');
  };

  // Áreas cedentes elegibles (excluyendo la solicitante)
  const areasCedentesDisponibles = useMemo(() => {
    return areas.filter((a) => a.id !== Number(modalAreaId));
  }, [areas, modalAreaId]);

  // Memorias del Área Cedente (de donde sale el dinero)
  const memoriasCedentes = useMemo(() => {
    const targetAreaId =
      tipoModificacion === 'TRASPASO_INTER_AREA' ? Number(areaCedenteId) : Number(modalAreaId);

    if (!targetAreaId) return [];
    const areaObj = areas.find((a) => a.id === targetAreaId);

    // Combinar memorias generales + extraMemorias cargadas dinámicamente para el área cedente
    const combined = [...(Array.isArray(memorias) ? memorias : []), ...extraMemorias];
    const unique = Array.from(new Map(combined.map((m) => [m.id, m])).values());

    return unique.filter((m) => {
      const matchArea =
        Number(m.area_id) === targetAreaId ||
        (areaObj && m.area_nombre && m.area_nombre.trim().toLowerCase() === areaObj.nombre.trim().toLowerCase());
      const matchEstado = ['APROBADO_FINANZAS', 'APROBADO_GERENCIA', 'APROBADO_PLANIFICACION'].includes(m.estado);
      return matchArea && matchEstado;
    });
  }, [memorias, extraMemorias, tipoModificacion, areaCedenteId, modalAreaId, areas]);

  // Memorias del Área Solicitante (para destinos existentes)
  const memoriasReceptoras = useMemo(() => {
    if (!modalAreaId) return [];
    const areaObj = areas.find((a) => a.id === Number(modalAreaId));

    return (Array.isArray(memorias) ? memorias : []).filter((m) => {
      const matchArea =
        m.area_id === Number(modalAreaId) ||
        (areaObj && m.area_nombre && m.area_nombre.trim().toLowerCase() === areaObj.nombre.trim().toLowerCase());
      const matchEstado = ['APROBADO_FINANZAS', 'APROBADO_GERENCIA', 'APROBADO_PLANIFICACION'].includes(m.estado);
      return matchArea && matchEstado;
    });
  }, [memorias, modalAreaId, areas]);

  // Partidas oficiales (egresos activos)
  const partidasEgresos = useMemo(() => {
    return (Array.isArray(partidas) ? partidas : []).filter((p) => p.clase !== 'INGRESO');
  }, [partidas]);

  // Operaciones del área solicitante en la gestión
  const operacionesArea = useMemo(() => {
    return (Array.isArray(operaciones) ? operaciones : []).filter((op) => {
      if (!modalAreaId) return true;
      return !op.area || Number(op.area) === Number(modalAreaId);
    });
  }, [operaciones, modalAreaId]);

  // Dropdown items
  const areaDropdownItems: DropdownItem[] = useMemo(() => {
    return areas.map((a) => ({
      id: a.id,
      label: a.nombre,
      badge: a.codigo,
      badgeClassName: 'bg-theme-border/60 text-theme-main font-mono text-[10px]',
      sublabel: `${a.tipo || 'Área'} institucional`,
    }));
  }, [areas]);

  const areasCedentesItems: DropdownItem[] = useMemo(() => {
    return areasCedentesDisponibles.map((a) => ({
      id: a.id,
      label: a.nombre,
      badge: a.codigo,
      badgeClassName: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 font-mono text-[10px]',
      sublabel: `${a.tipo || 'Gerencia/Unidad'} cedente`,
    }));
  }, [areasCedentesDisponibles]);

  const memoriasCedentesItems: DropdownItem[] = useMemo(() => {
    return memoriasCedentes.map((m) => {
      const d = getSaldo(m);
      return {
        id: m.id,
        label: `Partida ${m.partida_codigo || 'S/P'}${m.partida_nombre ? ` - ${m.partida_nombre}` : ''}`,
        badge: m.codigo,
        badgeClassName: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 font-mono text-[10px] font-bold',
        sublabel: `Saldo disponible: ${formatMoney(d)}`,
      };
    });
  }, [memoriasCedentes]);

  const memoriasReceptorasItems: DropdownItem[] = useMemo(() => {
    return memoriasReceptoras.map((m) => {
      const d = getSaldo(m);
      return {
        id: m.id,
        label: `Partida ${m.partida_codigo || 'S/P'}${m.partida_nombre ? ` - ${m.partida_nombre}` : ''}`,
        badge: m.codigo,
        badgeClassName: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-mono text-[10px] font-bold',
        sublabel: `Saldo actual: ${formatMoney(d)}`,
      };
    });
  }, [memoriasReceptoras]);

  const partidasDropdownItems: DropdownItem[] = useMemo(() => {
    return partidasEgresos.map((p) => ({
      id: p.id,
      label: `${p.codigo} - ${p.nombre}`,
      badge: 'Partida Oficial',
      badgeClassName: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 font-mono text-[10px]',
      sublabel: p.descripcion || undefined,
    }));
  }, [partidasEgresos]);

  const operacionesDropdownItems: DropdownItem[] = useMemo(() => {
    return [
      { id: '', label: 'Sin vinculación directa a Operación (General de Área)' },
      ...operacionesArea.map((op) => ({
        id: op.id,
        label: `${op.codigo} - ${op.descripcion || 'Operación POA'}`,
        badge: op.codigo,
        badgeClassName: 'bg-theme-border/60 text-theme-main font-mono text-[10px]',
      })),
    ];
  }, [operacionesArea]);

  // Totales de comprobación en vivo
  const totalCedido = useMemo(() => {
    return filasOrigen.reduce((acc, f) => acc + (parseFloat(String(f.monto)) || 0), 0);
  }, [filasOrigen]);

  const totalRecibido = useMemo(() => {
    return filasDestino.reduce((acc, f) => acc + (parseFloat(String(f.monto)) || 0), 0);
  }, [filasDestino]);

  const diferencia = useMemo(() => {
    return Math.abs(totalCedido - totalRecibido);
  }, [totalCedido, totalRecibido]);

  const isCuadrado = useMemo(() => {
    return totalCedido > 0 && totalRecibido > 0 && diferencia < 0.01;
  }, [totalCedido, totalRecibido, diferencia]);

  function handleAddFilaOrigen() {
    setFilasOrigen((prev) => [
      ...prev,
      { id: `orig-${Date.now()}-${prev.length + 1}`, memoriaId: '', monto: '' },
    ]);
  }

  function handleRemoveFilaOrigen(id: string) {
    if (filasOrigen.length <= 1) {
      alertService.warning('Validación', 'Debe haber al menos una partida cedente.');
      return;
    }
    setFilasOrigen((prev) => prev.filter((f) => f.id !== id));
  }

  function handleAddFilaDestino() {
    setFilasDestino((prev) => [
      ...prev,
      {
        id: `dest-${Date.now()}-${prev.length + 1}`,
        esNuevaPartida: false,
        memoriaId: '',
        partidaId: '',
        operacionId: '',
        monto: '',
      },
    ]);
  }

  function handleRemoveFilaDestino(id: string) {
    if (filasDestino.length <= 1) {
      alertService.warning('Validación', 'Debe haber al menos una partida receptora.');
      return;
    }
    setFilasDestino((prev) => prev.filter((f) => f.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isGestionBloqueada) {
      alertService.error('Error', 'Solo se pueden realizar modificaciones en gestiones En Ejecución.');
      return;
    }
    if (!modalAreaId) {
      alertService.error('Validación', 'Selecciona el área organizacional solicitante.');
      return;
    }

    if (tipoModificacion === 'TRASPASO_INTER_AREA') {
      if (!areaCedenteId) {
        alertService.error('Validación', 'Selecciona la Gerencia Cedente a la que se le solicita presupuesto.');
        return;
      }
      if (Number(areaCedenteId) === Number(modalAreaId)) {
        alertService.error('Validación', 'El área cedente no puede ser la misma que el área solicitante.');
        return;
      }
    }

    if (!motivo.trim()) {
      alertService.error('Validación', 'Ingresa la justificación técnica de la modificación presupuestaria.');
      return;
    }

    // Validar orígenes
    for (let i = 0; i < filasOrigen.length; i++) {
      const f = filasOrigen[i];
      if (!f.memoriaId) {
        alertService.error('Validación', `Selecciona la partida y memoria cedente en la fila ${i + 1}.`);
        return;
      }
      const montoNum = parseFloat(String(f.monto));
      if (!montoNum || montoNum <= 0) {
        alertService.error('Validación', `Ingresa un monto válido mayor a 0 en la partida cedente ${i + 1}.`);
        return;
      }
      const memObj = memoriasCedentes.find((m) => m.id === Number(f.memoriaId));
      const disp = getSaldo(memObj);
      if (montoNum > disp) {
        alertService.error(
          'Saldo Insuficiente',
          `El monto en la partida cedente ${i + 1} (${formatMoney(montoNum)}) excede el saldo disponible (${formatMoney(disp)}).`
        );
        return;
      }
    }

    // Validar destinos
    for (let i = 0; i < filasDestino.length; i++) {
      const f = filasDestino[i];
      if (f.esNuevaPartida) {
        if (!f.partidaId) {
          alertService.error('Validación', `Selecciona la Partida Oficial a crear en la fila receptora ${i + 1}.`);
          return;
        }
      } else {
        if (!f.memoriaId) {
          alertService.error('Validación', `Selecciona la partida y memoria receptora en la fila ${i + 1}.`);
          return;
        }
      }
      const montoNum = parseFloat(String(f.monto));
      if (!montoNum || montoNum <= 0) {
        alertService.error('Validación', `Ingresa un monto válido mayor a 0 en la partida receptora ${i + 1}.`);
        return;
      }
    }

    // Validar orígenes repetidos
    const origMemIds = filasOrigen.map((f) => Number(f.memoriaId));
    if (new Set(origMemIds).size !== origMemIds.length) {
      alertService.error('Validación', 'No puedes repetir la misma memoria o partida cedente.');
      return;
    }

    // Validar destinos repetidos
    const destKeys = filasDestino.map((f) => (f.esNuevaPartida ? `partida-${f.partidaId}` : `mem-${f.memoriaId}`));
    if (new Set(destKeys).size !== destKeys.length) {
      alertService.error('Validación', 'No puedes repetir la misma partida o memoria receptora en los destinos.');
      return;
    }

    // Si es intra-área, validar que no se ceda y reciba a la misma memoria
    if (tipoModificacion === 'TRASPASO_INTRA_AREA') {
      const destMemIds = filasDestino.filter((f) => !f.esNuevaPartida).map((f) => Number(f.memoriaId));
      const solapadas = origMemIds.filter((id) => destMemIds.includes(id));
      if (solapadas.length > 0) {
        alertService.error(
          'Validación',
          'Una memoria no puede ser simultáneamente cedente y receptora en la misma modificación intra-área.'
        );
        return;
      }
    }

    // Validar suma cero
    if (!isCuadrado) {
      alertService.error(
        'Operación Descuadrada',
        `Total Cedido (${formatMoney(totalCedido)}) ≠ Total Recibido (${formatMoney(totalRecibido)}). Diferencia: ${formatMoney(diferencia)}.`
      );
      return;
    }

    const confirmTitle =
      tipoModificacion === 'TRASPASO_INTER_AREA'
        ? 'Confirmar Petición Inter-Gerencias'
        : 'Confirmar Solicitud a Presupuestos';

    const confirmText =
      tipoModificacion === 'TRASPASO_INTER_AREA'
        ? `¿Desea enviar la solicitud por ${formatMoney(totalCedido)} a la Gerencia Cedente (${
            areas.find((a) => a.id === Number(areaCedenteId))?.nombre || 'seleccionada'
          })? Tras su visto bueno, pasará a Presupuestos.`
        : `¿Desea enviar esta solicitud por un importe compensado de ${formatMoney(
            totalCedido
          )} a Presupuestos (Lic. Acha)?`;

    const confirm = await alertService.confirm({
      title: confirmTitle,
      text: confirmText,
      icon: 'question',
      confirmButtonText:
        tipoModificacion === 'TRASPASO_INTER_AREA'
          ? 'Sí, Enviar a Gerencia Cedente'
          : 'Sí, Enviar a Presupuestos',
    });
    if (!confirm) return;

    await onSubmit({
      gestion_id: Number(selectedGestionId),
      area_id: Number(modalAreaId),
      area_cedente_id: tipoModificacion === 'TRASPASO_INTER_AREA' ? Number(areaCedenteId) : null,
      tipo: tipoModificacion,
      motivo: motivo.trim(),
      origenes: filasOrigen.map((f) => ({
        memoria_id: Number(f.memoriaId),
        monto: parseFloat(String(f.monto)),
      })),
      destinos: filasDestino.map((f) => {
        if (f.esNuevaPartida) {
          return {
            es_nueva_partida: true,
            partida_id: Number(f.partidaId),
            operacion_id: f.operacionId ? Number(f.operacionId) : undefined,
            monto: parseFloat(String(f.monto)),
          };
        }
        return {
          memoria_id: Number(f.memoriaId),
          monto: parseFloat(String(f.monto)),
        };
      }),
    });
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        tipoModificacion === 'TRASPASO_INTER_AREA'
          ? 'Solicitud de Modificación Presupuestaria Inter-Gerencias'
          : 'Solicitud de Modificación Presupuestaria Intra-Área'
      }
      subtitle={`Reasignación compensada de saldos • Gestión ${gestionAnio || 'Actual'}`}
      icon={<ArrowRightLeft className="text-theme-primary" size={24} />}
      size="3xl"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={actionLoading || !isCuadrado}
            loading={actionLoading}
            icon={<CheckCircle2 size={16} />}
            className={
              tipoModificacion === 'TRASPASO_INTER_AREA'
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                : undefined
            }
          >
            {tipoModificacion === 'TRASPASO_INTER_AREA'
              ? 'Enviar a Gerencia Cedente (En Espera)'
              : 'Enviar a Presupuestos (En Espera)'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Paso 0: Selección de Modalidad (Intra-Área vs Inter-Gerencias) */}
        <div>
          <label className="block text-xs font-semibold uppercase text-theme-muted mb-2">
            Modalidad de la Modificación Presupuestaria *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setTipoModificacion('TRASPASO_INTRA_AREA');
                setAreaCedenteId('');
                setFilasOrigen([{ id: `orig-${Date.now()}-1`, memoriaId: '', monto: '' }]);
              }}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                tipoModificacion === 'TRASPASO_INTRA_AREA'
                  ? 'border-theme-primary bg-theme-primary/10 ring-1 ring-theme-primary shadow-sm'
                  : 'border-theme-border bg-theme-surface hover:bg-theme-border/30'
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    tipoModificacion === 'TRASPASO_INTRA_AREA'
                      ? 'border-theme-primary bg-theme-primary text-white'
                      : 'border-theme-muted'
                  }`}
                >
                  {tipoModificacion === 'TRASPASO_INTRA_AREA' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <span className="font-bold text-xs text-theme-main">Traspaso Interno (Misma Gerencia)</span>
              </div>
              <p className="text-[11px] text-theme-muted mt-1.5 pl-6">
                Movimiento de recursos entre partidas y memorias de la propia gerencia o unidad.
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setTipoModificacion('TRASPASO_INTER_AREA');
                setFilasOrigen([{ id: `orig-${Date.now()}-1`, memoriaId: '', monto: '' }]);
              }}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                tipoModificacion === 'TRASPASO_INTER_AREA'
                  ? 'border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500 shadow-sm'
                  : 'border-theme-border bg-theme-surface hover:bg-theme-border/30'
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    tipoModificacion === 'TRASPASO_INTER_AREA'
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-theme-muted'
                  }`}
                >
                  {tipoModificacion === 'TRASPASO_INTER_AREA' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <span className="font-bold text-xs text-indigo-700 dark:text-indigo-400">
                  Solicitud Inter-Gerencias (Fuerza Mayor)
                </span>
              </div>
              <p className="text-[11px] text-theme-muted mt-1.5 pl-6">
                Petición formal a otra Gerencia para que ceda saldo. Requiere consentimiento previo del Gerente Cedente.
              </p>
            </button>
          </div>
        </div>

        {/* Banner Informativo del Flujo Seleccionado */}
        {tipoModificacion === 'TRASPASO_INTER_AREA' ? (
          <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-900 dark:text-indigo-200 text-xs space-y-1">
            <div className="flex items-center gap-2 font-bold text-indigo-700 dark:text-indigo-400">
              <Building2 size={16} />
              <span>Flujo de Fuerza Mayor: Solicitante ➔ Gerente Cedente ➔ Presupuestos</span>
            </div>
            <p className="text-[11px] opacity-90">
              La solicitud irá en primer término a la <strong>Gerencia Cedente</strong> en estado{' '}
              <strong>En Espera (Gerencia Cedente)</strong>. Si el gerente cedente acepta, continuará hacia{' '}
              <strong>Presupuestos</strong> para el dictamen oficial. Si la rechaza, quedará cancelada.
            </p>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-theme-primary/10 border border-theme-primary/20 text-theme-main text-xs space-y-1">
            <div className="flex items-center gap-2 font-bold text-theme-primary">
              <ShieldCheck size={16} />
              <span>Flujo Directo Área ➔ Presupuestos</span>
            </div>
            <p className="text-[11px] text-theme-muted">
              Esta modificación es solicitada directamente por su Gerencia hacia Presupuestos (Lic. Acha). Quedará en
              estado <strong>En Espera</strong> hasta su aprobación oficial definitiva.
            </p>
          </div>
        )}

        {/* Configuración de Áreas: Solicitante y Cedente */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Área Solicitante (Receptora) */}
          <div>
            <label className="block text-xs font-semibold uppercase text-theme-muted mb-1.5">
              1. Área Organizacional Solicitante *
            </label>
            {isGerente && !isAdmin ? (
              <div className="p-2.5 rounded-xl border border-theme-border bg-theme-base/60 text-xs font-semibold text-theme-main flex items-center justify-between">
                <span>{areas.find((a) => a.id === Number(modalAreaId))?.nombre || userAreaNombre || 'Mi Área'}</span>
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-theme-border/60">
                  {areas.find((a) => a.id === Number(modalAreaId))?.codigo || 'ÁREA'}
                </span>
              </div>
            ) : (
              <Dropdown
                items={areaDropdownItems}
                value={modalAreaId}
                onChange={(val) => {
                  setModalAreaId(val ? Number(val) : '');
                  setFilasOrigen([{ id: `orig-${Date.now()}-1`, memoriaId: '', monto: '' }]);
                  setFilasDestino([
                    {
                      id: `dest-${Date.now()}-1`,
                      esNuevaPartida: false,
                      memoriaId: '',
                      partidaId: '',
                      operacionId: '',
                      monto: '',
                    },
                  ]);
                }}
                placeholder="Seleccionar Área Solicitante..."
                searchable={true}
                searchPlaceholder="Buscar área..."
                size="sm"
              />
            )}
          </div>

          {/* Área Cedente (Solo visible si es Inter-Gerencias) */}
          {tipoModificacion === 'TRASPASO_INTER_AREA' && (
            <div>
              <label className="block text-xs font-semibold uppercase text-indigo-700 dark:text-indigo-400 mb-1.5">
                2. Gerencia / Unidad Cedente (A quien se solicita) *
              </label>
              <Dropdown
                items={areasCedentesItems}
                value={areaCedenteId}
                onChange={(val) => {
                  setAreaCedenteId(val ? Number(val) : '');
                  setFilasOrigen([{ id: `orig-${Date.now()}-1`, memoriaId: '', monto: '' }]);
                }}
                placeholder="Seleccionar Gerencia Cedente..."
                searchable={true}
                searchPlaceholder="Buscar gerencia cedente..."
                size="sm"
              />
            </div>
          )}
        </div>

        {/* Paneles Dobles: Cedentes (-) vs Receptoras (+) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Panel Izquierdo: Orígenes / Cedentes (-) */}
          <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/[0.02] flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-theme-border mb-3">
                <div>
                  <h4 className="text-xs font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1.5">
                    <span>(-) Partidas Cedentes (Salida)</span>
                  </h4>
                  <p className="text-[10px] text-theme-muted">
                    {tipoModificacion === 'TRASPASO_INTER_AREA'
                      ? 'Partidas de la Gerencia Cedente seleccionada'
                      : 'De qué partidas de su área se disminuirá saldo'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddFilaOrigen}
                  className="text-[11px] font-semibold text-theme-primary hover:underline flex items-center gap-1"
                >
                  <Plus size={13} /> Agregar Partida
                </button>
              </div>

              <div className="space-y-3">
                {filasOrigen.map((fila, idx) => {
                  const memSeleccionada = memoriasCedentes.find((m) => m.id === Number(fila.memoriaId));
                  const disp = getSaldo(memSeleccionada);
                  const montoNum = parseFloat(String(fila.monto)) || 0;
                  const excede = montoNum > disp;

                  return (
                    <div key={fila.id} className="p-3 rounded-lg border border-theme-border bg-theme-surface space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">
                          Partida Cedente #{idx + 1}
                        </span>
                        {filasOrigen.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveFilaOrigen(fila.id)}
                            className="text-rose-500 hover:text-rose-700 transition-colors p-1"
                            title="Eliminar fila"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>

                      {/* Dropdown de Memorias Cedentes */}
                      <Dropdown
                        items={memoriasCedentesItems}
                        value={fila.memoriaId || null}
                        onChange={(val) => {
                          const numVal = val ? Number(val) : '';
                          setFilasOrigen((prev) =>
                            prev.map((f) => (f.id === fila.id ? { ...f, memoriaId: numVal } : f))
                          );
                        }}
                        placeholder="Seleccionar Partida Cedente..."
                        searchable={true}
                        searchPlaceholder="Buscar por código de partida..."
                        emptyMessage={
                          loadingCedente
                            ? 'Cargando partidas de la gerencia cedente...'
                            : tipoModificacion === 'TRASPASO_INTER_AREA' && !areaCedenteId
                            ? 'Seleccione primero la Gerencia Cedente arriba'
                            : 'No hay partidas con saldo en esta área'
                        }
                        size="sm"
                      />

                      {memSeleccionada && (
                        <div className="flex items-center justify-between text-[11px] px-1">
                          <span className="text-theme-muted font-mono">
                            Saldo Disponible: <strong className="text-emerald-600">{formatMoney(disp)}</strong>
                          </span>
                          {excede && (
                            <span className="text-rose-600 font-bold text-[10px]">¡Excede saldo disponible!</span>
                          )}
                        </div>
                      )}

                      <div>
                        <label className="block text-[10px] font-semibold text-theme-muted uppercase mb-1">
                          Monto a Ceder (Bs.) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          required
                          value={fila.monto}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                            setFilasOrigen((prev) =>
                              prev.map((f) => (f.id === fila.id ? { ...f, monto: val } : f))
                            );
                          }}
                          className={`input-theme text-xs font-mono font-bold ${
                            excede ? 'border-rose-500 focus:border-rose-500' : ''
                          }`}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Subtotal Cedido */}
            <div className="mt-4 pt-3 border-t border-theme-border flex items-center justify-between font-bold text-xs">
              <span className="text-theme-muted">Total Cedido:</span>
              <span className="font-mono text-rose-600 text-sm">{formatMoney(totalCedido)}</span>
            </div>
          </div>

          {/* Panel Derecho: Destinos / Receptores (+) con opción de Nueva Partida */}
          <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.02] flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-theme-border mb-3">
                <div>
                  <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
                    <span>(+) Partidas Receptoras (Ingreso)</span>
                  </h4>
                  <p className="text-[10px] text-theme-muted">Asignación a memoria existente o nueva partida en ejecución</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddFilaDestino}
                  className="text-[11px] font-semibold text-theme-primary hover:underline flex items-center gap-1"
                >
                  <Plus size={13} /> Agregar Partida
                </button>
              </div>

              <div className="space-y-3">
                {filasDestino.map((fila, idx) => {
                  const memSeleccionada = memoriasReceptoras.find((m) => m.id === Number(fila.memoriaId));
                  const disp = getSaldo(memSeleccionada);

                  return (
                    <div key={fila.id} className="p-3 rounded-lg border border-theme-border bg-theme-surface space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">
                          Partida Receptora #{idx + 1}
                        </span>
                        {filasDestino.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveFilaDestino(fila.id)}
                            className="text-rose-500 hover:text-rose-700 transition-colors p-1"
                            title="Eliminar fila"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>

                      {/* Selector de tipo: Partida Existente vs Nueva Partida en Ejecución */}
                      <div className="flex items-center gap-2 p-1 bg-theme-border/30 rounded-lg text-[10px] font-semibold">
                        <button
                          type="button"
                          onClick={() => {
                            setFilasDestino((prev) =>
                              prev.map((f) =>
                                f.id === fila.id
                                  ? { ...f, esNuevaPartida: false, partidaId: '', operacionId: '' }
                                  : f
                              )
                            );
                          }}
                          className={`flex-1 py-1 px-2 rounded-md transition-colors ${
                            !fila.esNuevaPartida
                              ? 'bg-theme-surface text-theme-main shadow-xs font-bold'
                              : 'text-theme-muted hover:text-theme-main'
                          }`}
                        >
                          Memoria Existente
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFilasDestino((prev) =>
                              prev.map((f) =>
                                f.id === fila.id
                                  ? { ...f, esNuevaPartida: true, memoriaId: '' }
                                  : f
                              )
                            );
                          }}
                          className={`flex-1 py-1 px-2 rounded-md transition-colors flex items-center justify-center gap-1 ${
                            fila.esNuevaPartida
                              ? 'bg-purple-600 text-white shadow-xs font-bold'
                              : 'text-purple-600 dark:text-purple-400 hover:text-purple-700'
                          }`}
                        >
                          <Sparkles size={11} />
                          [+] Nueva Partida en Ejecución
                        </button>
                      </div>

                      {/* Contenido según tipo elegido */}
                      {fila.esNuevaPartida ? (
                        <div className="space-y-2 pt-1 border-t border-purple-500/20">
                          {/* Banner informativo de nueva partida en ejecución */}
                          <div className="p-2 rounded bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-800 dark:text-purple-300">
                            <strong>Partida creada durante la ejecución (sin detalles):</strong> Se creará una memoria directa
                            sin desglose analítico para habilitar presupuesto en esta partida oficial no formulada inicialmente.
                          </div>

                          {/* Selector de Partida Oficial */}
                          <div>
                            <label className="block text-[10px] font-semibold uppercase text-theme-muted mb-1">
                              Partida del Catálogo Oficial *
                            </label>
                            <Dropdown
                              items={partidasDropdownItems}
                              value={fila.partidaId || null}
                              onChange={(val) => {
                                const numVal = val ? Number(val) : '';
                                setFilasDestino((prev) =>
                                  prev.map((f) => (f.id === fila.id ? { ...f, partidaId: numVal } : f))
                                );
                              }}
                              placeholder="Seleccionar Partida de Egreso..."
                              searchable={true}
                              searchPlaceholder="Buscar por código o nombre..."
                              size="sm"
                            />
                          </div>

                          {/* Operación Opcional */}
                          {operacionesArea.length > 0 && (
                            <div>
                              <label className="block text-[10px] font-semibold uppercase text-theme-muted mb-1">
                                Vinculación a Operación POA (Opcional)
                              </label>
                              <Dropdown
                                items={operacionesDropdownItems}
                                value={fila.operacionId || ''}
                                onChange={(val) => {
                                  const numVal = val ? Number(val) : '';
                                  setFilasDestino((prev) =>
                                    prev.map((f) => (f.id === fila.id ? { ...f, operacionId: numVal } : f))
                                  );
                                }}
                                placeholder="Vincular a Operación..."
                                searchable={true}
                                size="sm"
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          {/* Dropdown de Memorias Receptoras Existentes */}
                          <Dropdown
                            items={memoriasReceptorasItems}
                            value={fila.memoriaId || null}
                            onChange={(val) => {
                              const numVal = val ? Number(val) : '';
                              setFilasDestino((prev) =>
                                prev.map((f) => (f.id === fila.id ? { ...f, memoriaId: numVal } : f))
                              );
                            }}
                            placeholder="Seleccionar Partida Receptora Existente..."
                            searchable={true}
                            searchPlaceholder="Buscar por código de memoria o partida..."
                            emptyMessage="No hay memorias en esta área"
                            size="sm"
                          />

                          {memSeleccionada && (
                            <p className="text-[11px] text-theme-muted font-mono px-1 mt-1.5">
                              Saldo Actual: <strong className="text-theme-main">{formatMoney(disp)}</strong>
                            </p>
                          )}
                        </div>
                      )}

                      <div>
                        <label className="block text-[10px] font-semibold text-theme-muted uppercase mb-1">
                          Monto a Incrementar (Bs.) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          required
                          value={fila.monto}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                            setFilasDestino((prev) =>
                              prev.map((f) => (f.id === fila.id ? { ...f, monto: val } : f))
                            );
                          }}
                          className="input-theme text-xs font-mono font-bold"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Subtotal Recibido */}
            <div className="mt-4 pt-3 border-t border-theme-border flex items-center justify-between font-bold text-xs">
              <span className="text-theme-muted">Total Recibido:</span>
              <span className="font-mono text-emerald-600 text-sm">{formatMoney(totalRecibido)}</span>
            </div>
          </div>
        </div>

        {/* Barra de Cuadre en Tiempo Real (Suma Cero) */}
        <div
          className={`p-4 rounded-xl border flex items-center justify-between transition-colors ${
            isCuadrado
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400'
          }`}
        >
          <div className="flex items-center gap-3">
            {isCuadrado ? (
              <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle size={24} className="text-amber-600 shrink-0" />
            )}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">
                {isCuadrado ? '¡Operación Compensada Cuadrada!' : 'Diferencia en Cuadre Presupuestario'}
              </p>
              <p className="text-[11px] opacity-90 mt-0.5">
                {isCuadrado
                  ? 'El total cedido coincide exactamente con el total recibido (suma cero).'
                  : totalCedido > totalRecibido
                  ? `Sobran Bs. ${diferencia.toFixed(2)} por asignar en las partidas receptoras.`
                  : totalRecibido > totalCedido
                  ? `Faltan Bs. ${diferencia.toFixed(2)} por debitar en las partidas cedentes.`
                  : 'Ingresa los montos en ambas columnas.'}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <p className="text-[10px] uppercase font-bold text-theme-muted">Diferencia</p>
            <p className="text-base font-mono font-bold">{formatMoney(diferencia)}</p>
          </div>
        </div>

        {/* Justificación Técnica / Motivo */}
        <div>
          <label className="block text-xs font-semibold uppercase text-theme-muted mb-1">
            3. Justificación Técnica Institucional *
          </label>
          <textarea
            required
            rows={3}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            className="input-theme text-xs"
            placeholder={
              tipoModificacion === 'TRASPASO_INTER_AREA'
                ? 'Explica detalladamente la causa de fuerza mayor y la necesidad de solicitar recursos a otra Gerencia...'
                : 'Explica la necesidad técnica y el respaldo de la modificación presupuestaria para la Lic. Acha...'
            }
          />
        </div>
      </form>
    </Modal>
  );
};
