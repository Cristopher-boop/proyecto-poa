import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  AlertCircle,
  Building2,
  Calendar,
  Wallet,
  CheckCircle2,
  HelpCircle,
  Send,
  Layers,
  Coins,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { CertificacionPOA, CertificacionFormData } from '../../../types/certificacion';
import { Area } from '../../../services/presupuestoService';
import { planificacionService } from '../../../services/planificacionService';
import { Operacion } from '../../../types/planificacion';
import { memoriasApi, MemoriaCalculo } from '../../memorias/api/memoriasApi';
import { Modal, Button, Dropdown, DropdownItem } from '../../../components/commons';
import alertService from '../../../utils/alerts';

interface SolicitudGastoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CertificacionFormData, enviarDirecto?: boolean) => Promise<void>;
  initialData?: CertificacionPOA | null;
  gestionId: number;
  gestionAnio: number;
  areas: Area[];
  userAreaId: number | null;
  isSuperAdmin: boolean;
  preselectedMemoriaId?: number | null;
  preselectedPartidaId?: number | null;
  userName?: string;
  userCargo?: string;
}

export const SolicitudGastoModal: React.FC<SolicitudGastoModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  gestionId,
  gestionAnio,
  areas,
  userAreaId,
  isSuperAdmin,
  preselectedMemoriaId = null,
}) => {
  // ── 1. Estado del Formulario ──────────────────────────────────────────────────
  const [areaId, setAreaId] = useState<number>(userAreaId || (areas[0]?.id ?? 0));
  const [selectedOperacionId, setSelectedOperacionId] = useState<number | null>(null);
  const [memoriaId, setMemoriaId] = useState<number | null>(preselectedMemoriaId);
  const [hojaRuta, setHojaRuta] = useState<string>('');
  const [montoSolicitado, setMontoSolicitado] = useState<string>('');
  const [justificacionGasto, setJustificacionGasto] = useState<string>('');
  const [esContratacion, setEsContratacion] = useState<boolean>(true);

  // ── 2. Estados de Carga y Catálogos ──────────────────────────────────────────
  const [todasOperaciones, setTodasOperaciones] = useState<Operacion[]>([]);
  const [memorias, setMemorias] = useState<MemoriaCalculo[]>([]);
  const [loadingOps, setLoadingOps] = useState<boolean>(false);
  const [loadingMemorias, setLoadingMemorias] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ── 3. Reset o Carga de Datos Iniciales ───────────────────────────────────────
  useEffect(() => {
    if (initialData) {
      setAreaId(initialData.area);
      setSelectedOperacionId(initialData.operaciones?.[0] ?? null);
      setMemoriaId(initialData.memoria || null);
      setHojaRuta(initialData.hoja_ruta || '');
      setMontoSolicitado(String(initialData.monto_solicitado || ''));
      setJustificacionGasto(initialData.concepto_gasto || '');
      setEsContratacion(initialData.es_contratacion ?? true);
    } else {
      const defArea = userAreaId || (areas[0]?.id ?? 0);
      setAreaId(defArea);
      setSelectedOperacionId(null);
      setMemoriaId(preselectedMemoriaId || null);
      setHojaRuta('');
      setMontoSolicitado('');
      setJustificacionGasto('');
      setEsContratacion(true);
    }
    setErrorMsg(null);
  }, [initialData, isOpen, userAreaId, areas, preselectedMemoriaId]);

  // Cargar operaciones POA
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setLoadingOps(true);
    planificacionService
      .getOperaciones()
      .then((ops) => {
        if (!isMounted) return;
        setTodasOperaciones(Array.isArray(ops) ? ops : []);
      })
      .catch((err) => {
        console.error('Error al cargar operaciones POA:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingOps(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Cargar memorias de cálculo del área y gestión seleccionadas
  useEffect(() => {
    if (!isOpen || !gestionId || !areaId) return;
    let isMounted = true;
    setLoadingMemorias(true);
    memoriasApi
      .getMemorias({ gestion: gestionId, area: areaId })
      .then((data) => {
        if (!isMounted) return;
        setMemorias(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error('Error al cargar memorias:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingMemorias(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, gestionId, areaId]);

  // ── 4. Operaciones filtradas del Área ─────────────────────────────────────────
  const operacionesDelArea = useMemo(() => {
    if (!areaId) return [];
    return todasOperaciones.filter((op) => op.area === areaId && op.estado);
  }, [todasOperaciones, areaId]);

  // Regla: En caso de que el área tenga solo una operación, se auto-selecciona automáticamente
  useEffect(() => {
    if (operacionesDelArea.length === 1 && selectedOperacionId === null) {
      setSelectedOperacionId(operacionesDelArea[0].id);
    }
  }, [operacionesDelArea, selectedOperacionId]);

  // Selección única de operación
  const handleSelectOperacion = (opId: number) => {
    setSelectedOperacionId(opId);
  };

  // ── 5. Selección de Memoria de Cálculo (MC) ──────────────────────────────────
  const selectedMemoriaObj = useMemo(() => {
    if (!memoriaId) return null;
    return memorias.find((m) => m.id === memoriaId) || null;
  }, [memoriaId, memorias]);

  // Derivar partida automáticamente desde la Memoria de Cálculo seleccionada
  const derivedPartida = useMemo(() => {
    if (!selectedMemoriaObj) return null;
    const det = selectedMemoriaObj.detalles?.[0];
    const pid = det?.partida?.id || (selectedMemoriaObj as any).partida_id || (selectedMemoriaObj as any).partida?.id || null;
    const pcod = selectedMemoriaObj.partida_codigo || det?.partida?.codigo || det?.partida_codigo || '';
    const pnom = selectedMemoriaObj.partida_nombre || det?.partida?.nombre || det?.partida_nombre || '';
    return { id: pid, codigo: pcod, nombre: pnom };
  }, [selectedMemoriaObj]);

  // Si el área tiene una sola memoria de cálculo, se auto-selecciona automáticamente
  useEffect(() => {
    if (memorias.length === 1 && !memoriaId) {
      setMemoriaId(memorias[0].id);
    }
  }, [memorias, memoriaId]);

  // Opciones de Memoria de Cálculo para Dropdown (única selección)
  const memoriaDropdownItems: DropdownItem[] = useMemo(() => {
    return memorias.map((m) => {
      const saldo = Number(m.saldo_disponible || 0);
      const detPartida = m.detalles?.[0]?.partida;
      const codPartida = m.partida_codigo || detPartida?.codigo;
      const nomPartida = m.partida_nombre || detPartida?.nombre;
      const infoPartida = codPartida ? `[Partida ${codPartida}${nomPartida ? ` - ${nomPartida}` : ''}]` : '';

      return {
        id: m.id,
        label: `${m.codigo}${infoPartida ? ` ${infoPartida}` : ''} — ${m.justificacion || 'Sin justificación'}`,
        badge: `Disp: Bs. ${saldo.toLocaleString('es-BO', { minimumFractionDigits: 2 })}`,
        badgeClassName:
          saldo > 0
            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono'
            : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 font-mono',
      };
    });
  }, [memorias]);

  const saldoDisponibleMC = useMemo(() => {
    if (!selectedMemoriaObj) {
      if (initialData && initialData.memoria === memoriaId) {
        return Number(initialData.memoria_saldo_disponible || 0);
      }
      return 0;
    }
    return Number(selectedMemoriaObj.saldo_disponible || 0);
  }, [selectedMemoriaObj, initialData, memoriaId]);

  const numMonto = Number(montoSolicitado) || 0;
  const saldoRestanteProyectado = Math.max(0, saldoDisponibleMC - numMonto);
  const isMontoExcedido = memoriaId !== null && numMonto > saldoDisponibleMC;

  // ── 6. Regla de Contrataciones por Monto (> 2000 Bs) ─────────────────────────
  const esMayorA2000 = numMonto > 2000;

  // Si el gasto es mayor a 2000, automáticamente es contratación sin preguntar
  useEffect(() => {
    if (esMayorA2000) {
      setEsContratacion(true);
    }
  }, [esMayorA2000]);

  // ── 7. Validación y Envío ────────────────────────────────────────────────────
  const handleSave = async (enviarDirecto = true) => {
    setErrorMsg(null);

    // 1. Operación POA obligatoria
    if (!selectedOperacionId) {
      setErrorMsg('Debe seleccionar la Operación POA donde se imputará el gasto.');
      return;
    }

    // 2. Memoria de Cálculo (MC) obligatoria
    if (!memoriaId) {
      setErrorMsg('Debe seleccionar la Memoria de Cálculo (MC) de manera obligatoria.');
      return;
    }

    // 3. Hoja de Ruta obligatoria
    const hr = hojaRuta.trim();
    if (!hr) {
      setErrorMsg('La Hoja de Ruta / CITE / Razón de la solicitud es OBLIGATORIA.');
      return;
    }

    // 4. Monto solicitado mayor a 0
    if (numMonto <= 0) {
      setErrorMsg('El monto solicitado debe ser mayor a Bs. 0.00.');
      return;
    }

    // 5. Justificación del Gasto obligatoria
    const justif = justificacionGasto.trim();
    if (!justif) {
      setErrorMsg('Debe ingresar la Justificación del Gasto de manera obligatoria.');
      return;
    }

    // 6. Validación de saldo en memoria si hay vinculación
    if (isMontoExcedido) {
      setErrorMsg(
        `El monto solicitado (Bs. ${numMonto.toLocaleString('es-BO', { minimumFractionDigits: 2 })}) supera el saldo disponible de la memoria de cálculo (Bs. ${saldoDisponibleMC.toLocaleString('es-BO', { minimumFractionDigits: 2 })}).`
      );
      return;
    }

    // Modalidad definitiva de contratación
    const finalEsContratacion = esMayorA2000 ? true : esContratacion;

    if (enviarDirecto) {
      const destinoStr = finalEsContratacion
        ? 'la Unidad de Planificación para revisión técnica y emisión de Certificación POA'
        : 'la Unidad de Presupuestos para visto bueno presupuestario financiero';

      const confirmacion = await alertService.confirm({
        title: '¿Confirmar envío a revisión?',
        text: `La solicitud con Hoja de Ruta "${hr}" (${finalEsContratacion ? 'Contratación POA' : 'Gasto Menor / Directo'}) será remitida a ${destinoStr}.`,
        confirmButtonText: 'Sí, enviar ahora',
        cancelButtonText: 'Cancelar',
        icon: 'question',
      });
      if (!confirmacion) return;
    }

    setSaving(true);
    try {
      const payload: CertificacionFormData = {
        hoja_ruta: hr,
        es_contratacion: finalEsContratacion,
        gestion: gestionId,
        area: areaId,
        operaciones: selectedOperacionId ? [selectedOperacionId] : [],
        partida: derivedPartida?.id || null,
        partida_literal: derivedPartida?.nombre || selectedMemoriaObj?.justificacion || '',
        memoria: memoriaId,
        monto_solicitado: numMonto,
        concepto_gasto: justif,
        fecha: initialData?.fecha || new Date().toISOString().split('T')[0],
        version: initialData?.version || `Versión 1: ${gestionAnio}`,
        notas: initialData?.notas || '',
      };

      await onSubmit(payload, enviarDirecto);
      onClose();
    } catch (err: any) {
      console.error(err);
      const resData = err?.response?.data;
      if (resData) {
        const errorList = Object.entries(resData)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join(' | ');
        setErrorMsg(errorList || 'Error al guardar la solicitud de gasto.');
      } else {
        setErrorMsg('Ocurrió un error al guardar la solicitud de gasto.');
      }
    } finally {
      setSaving(false);
    }
  };

  const areaActualObj = areas.find((a) => a.id === areaId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? `Editar Solicitud de Gasto (${initialData.hoja_ruta})` : 'Solicitud de Gasto Institucional — Gerencia'}
      size="xl"
    >
      <div className="space-y-5">
        {/* Banner Institucional */}
        <div className="p-3.5 rounded-2xl bg-theme-primary/10 border border-theme-primary/20 text-theme-main flex items-start gap-3">
          <span className="p-2 rounded-xl bg-theme-primary/20 text-theme-primary shrink-0 mt-0.5">
            <FileText size={18} />
          </span>
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-theme-main">
              Formulación de Solicitud de Gasto
            </h4>
            <p className="text-[11px] text-theme-muted leading-relaxed">
              Seleccione la <strong>Operación POA</strong> y la <strong>Memoria de Cálculo (MC)</strong> correspondiente, ingrese la <strong>Hoja de Ruta</strong>, el <strong>Monto</strong> y la <strong>Justificación del Gasto</strong>.
            </p>
          </div>
        </div>

        {/* Mensaje de error general si ocurre */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {/* Selector de Área si es Administrador */}
        {isSuperAdmin && (
          <div className="p-3 rounded-xl bg-theme-surface border border-theme-border">
            <label className="block text-xs font-semibold text-theme-muted mb-1">
              Gerencia / Unidad Solicitante (SuperAdmin):
            </label>
            <select
              value={areaId}
              onChange={(e) => {
                setAreaId(Number(e.target.value));
                setSelectedOperacionId(null);
                setMemoriaId(null);
              }}
              className="w-full bg-theme-base border border-theme-border rounded-xl px-3 py-2 text-xs text-theme-main focus:outline-none focus:ring-1 focus:ring-theme-primary"
            >
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  [{a.codigo}] {a.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* ── 1. DÓNDE SE HARÁ EL GASTO: OPERACIÓN POA ─────────────────────────── */}
        <div className="space-y-3 p-4 rounded-2xl bg-theme-surface border border-theme-border shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-theme-primary/15 text-theme-primary">
                <Layers size={16} />
              </span>
              <div>
                <label className="font-bold text-xs text-theme-main block">
                  1. Dónde se hará el gasto: Operación POA <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-theme-muted block">
                  Área: <strong>{areaActualObj?.nombre || 'Gerencia'}</strong> ({areaActualObj?.codigo || '---'})
                </span>
              </div>
            </div>
            {operacionesDelArea.length === 1 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                Auto-seleccionada
              </span>
            )}
          </div>

          {/* Lista interactiva de Operaciones con Selección Única */}
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {loadingOps ? (
              <div className="py-6 text-center text-xs text-theme-muted">
                Cargando operaciones POA del área...
              </div>
            ) : operacionesDelArea.length === 0 ? (
              <div className="p-3.5 rounded-xl bg-theme-base border border-theme-border text-center text-xs text-theme-muted">
                No hay operaciones POA activas registradas para esta gerencia en la gestión.
              </div>
            ) : (
              operacionesDelArea.map((op) => {
                const isSelected = selectedOperacionId === op.id;
                return (
                  <div
                    key={op.id}
                    onClick={() => handleSelectOperacion(op.id)}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-theme-primary/10 border-theme-primary text-theme-main font-medium shadow-xs'
                        : 'bg-theme-base border-theme-border hover:border-theme-primary/40 text-theme-muted'
                    }`}
                  >
                    <input
                      type="radio"
                      name="operacion_poa_radio"
                      checked={isSelected}
                      onChange={() => handleSelectOperacion(op.id)}
                      className="mt-0.5 text-theme-primary focus:ring-0 cursor-pointer"
                    />
                    <div className="flex-1 leading-snug">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-theme-primary font-mono text-xs">
                          {op.codigo}
                        </span>
                        {op.acp_codigo && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-theme-surface border border-theme-border text-theme-main font-mono">
                            ACP: {op.acp_codigo}
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-1 text-theme-main font-normal">
                        {op.descripcion}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── 2. MEMORIA DE CÁLCULO (MC) (OBLIGATORIA) ─────────────────────────── */}
        <div className="space-y-3 p-4 rounded-2xl bg-theme-surface border border-theme-border shadow-xs">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <Wallet size={16} />
              </span>
              <div>
                <label className="font-bold text-xs text-theme-main block">
                  2. Memoria de Cálculo (MC) <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-theme-muted block">
                  Seleccione la Memoria de Cálculo asignada con saldo presupuestario disponible para su área.
                </span>
              </div>
            </div>
            {selectedMemoriaObj && derivedPartida?.codigo && (
              <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-md bg-theme-base border border-theme-border text-theme-primary">
                Partida {derivedPartida.codigo}
              </span>
            )}
          </div>

          <Dropdown
            items={memoriaDropdownItems}
            value={memoriaId || ''}
            onChange={(val) => setMemoriaId(val ? Number(val) : null)}
            placeholder={
              loadingMemorias
                ? 'Cargando memorias de cálculo...'
                : memorias.length === 0
                ? 'No hay memorias de cálculo disponibles para esta área'
                : 'Seleccione una Memoria de Cálculo (MC)...'
            }
            size="md"
            searchable
          />

          {/* Indicadores de Saldo en vivo si se seleccionó memoria */}
          {selectedMemoriaObj && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
              <div className="p-2.5 rounded-xl bg-theme-base border border-theme-border">
                <span className="text-theme-muted text-[10px] uppercase font-semibold block">Presupuesto Total MC</span>
                <strong className="text-theme-main font-mono text-xs">
                  Bs. {Number(selectedMemoriaObj.total_presupuestado || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                </strong>
              </div>
              <div className="p-2.5 rounded-xl bg-theme-base border border-theme-border">
                <span className="text-theme-muted text-[10px] uppercase font-semibold block">Saldo Disponible</span>
                <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-xs">
                  Bs. {saldoDisponibleMC.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                </strong>
              </div>
              <div className={`p-2.5 rounded-xl border ${
                isMontoExcedido ? 'bg-rose-500/10 border-rose-500/30 text-rose-600' : 'bg-theme-base border-theme-border'
              }`}>
                <span className="text-theme-muted text-[10px] uppercase font-semibold block">Saldo Proyectado</span>
                <strong className={`font-mono text-xs ${isMontoExcedido ? 'text-rose-600 font-bold' : 'text-theme-main'}`}>
                  Bs. {saldoRestanteProyectado.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                </strong>
              </div>
            </div>
          )}
        </div>

        {/* ── 3 y 4. HOJA DE RUTA Y MONTO ───────────────────────────────────────── */}
        <div className="space-y-3 p-4 rounded-2xl bg-theme-surface border border-theme-border shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Hoja de Ruta Obligatoria */}
            <div>
              <label className="block text-xs font-bold text-theme-main mb-1">
                3. Hoja de Ruta / CITE / Razón de la Solicitud <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={hojaRuta}
                onChange={(e) => setHojaRuta(e.target.value)}
                placeholder="Ej: HR-GI-2026-042 / CITE-EPTAM-015/2026"
                className="w-full bg-theme-base border border-theme-border rounded-xl px-3.5 py-2.5 text-xs text-theme-main font-semibold placeholder:text-theme-muted focus:outline-none focus:ring-1 focus:ring-theme-primary uppercase"
              />
              <span className="text-[10px] text-theme-muted mt-1 block">
                Identificador oficial del trámite (CITE u Hoja de Ruta institucional).
              </span>
            </div>

            {/* Monto Solicitado */}
            <div>
              <label className="block text-xs font-bold text-theme-main mb-1">
                4. Monto Solicitado Estimado (Bs.) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-theme-muted">
                  Bs.
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={montoSolicitado}
                  onChange={(e) => setMontoSolicitado(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-theme-base border border-theme-border rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-theme-main font-extrabold placeholder:text-theme-muted focus:outline-none focus:ring-1 focus:ring-theme-primary font-mono"
                />
              </div>
              <span className="text-[10px] text-theme-muted mt-1 block">
                Presupuesto estimado necesario para ejecutar el gasto.
              </span>
            </div>
          </div>

          {/* 5. Justificación del Gasto */}
          <div>
            <label className="block text-xs font-bold text-theme-main mb-1">
              5. Justificación del Gasto <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={justificacionGasto}
              onChange={(e) => setJustificacionGasto(e.target.value)}
              placeholder="Describa la justificación operativa, técnica o administrativa del requerimiento del gasto solicitado..."
              className="w-full bg-theme-base border border-theme-border rounded-xl p-3 text-xs text-theme-main placeholder:text-theme-muted focus:outline-none focus:ring-1 focus:ring-theme-primary leading-relaxed"
            />
          </div>
        </div>

        {/* ── MODALIDAD DE CONTRATACIÓN (PREGUNTA / CLASIFICACIÓN) ───── */}
        <div className="p-4 rounded-2xl bg-theme-surface border border-theme-border shadow-xs space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-theme-primary/15 text-theme-primary">
                <HelpCircle size={16} />
              </span>
              <div>
                <label className="font-bold text-xs text-theme-main block">
                  ¿Pertenece a Contrataciones? <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-theme-muted block">
                  Define el flujo del trámite antes de remitir a revisión.
                </span>
              </div>
            </div>

            {esMayorA2000 && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-theme-primary/10 text-theme-primary border border-theme-primary/20">
                <ShieldCheck size={13} />
                Asignación automática (monto &gt; Bs. 2.000,00)
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Opción Sí */}
            <div
              onClick={() => setEsContratacion(true)}
              className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                esContratacion
                  ? 'bg-theme-primary/10 border-theme-primary text-theme-main shadow-xs'
                  : 'bg-theme-base border-theme-border hover:border-theme-primary/40 text-theme-muted'
              }`}
            >
              <input
                type="radio"
                name="es_contratacion"
                checked={esContratacion}
                onChange={() => setEsContratacion(true)}
                className="mt-0.5 text-theme-primary focus:ring-0 cursor-pointer"
              />
              <div className="space-y-0.5 flex-1">
                <div className="flex items-center justify-between">
                  <strong className="block text-theme-main font-semibold">Sí, Contratación POA</strong>
                  {esMayorA2000 && (
                    <span className="text-[10px] text-theme-primary font-medium">
                      (Auto)
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-theme-muted leading-tight">
                  Pasa a la Unidad de Planificación para revisión de alineación técnica y emisión de la Certificación POA.
                </p>
              </div>
            </div>

            {/* Opción No */}
            <div
              onClick={() => {
                if (!esMayorA2000) setEsContratacion(false);
              }}
              className={`p-3 rounded-xl border text-xs transition-all flex items-start gap-2.5 ${
                esMayorA2000
                  ? 'bg-theme-base/50 border-theme-border/60 opacity-50 cursor-not-allowed text-theme-muted'
                  : !esContratacion
                  ? 'bg-theme-primary/10 border-theme-primary text-theme-main shadow-xs cursor-pointer'
                  : 'bg-theme-base border-theme-border hover:border-theme-primary/40 text-theme-muted cursor-pointer'
              }`}
            >
              <input
                type="radio"
                name="es_contratacion"
                checked={!esContratacion}
                disabled={esMayorA2000}
                onChange={() => {
                  if (!esMayorA2000) setEsContratacion(false);
                }}
                className="mt-0.5 text-theme-primary focus:ring-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <div className="space-y-0.5 flex-1">
                <strong className="block text-theme-main font-semibold">No, Gasto Menor / Directo</strong>
                <p className="text-[11px] text-theme-muted leading-tight">
                  {esMayorA2000
                    ? 'No aplica para importes mayores a Bs. 2.000,00 según normativa.'
                    : 'No requiere certificación en Planificación; pasa directamente a Presupuestos para visto bueno financiero.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── BOTONES DE ACCIÓN (PIE DEL MODAL) ─────────────────────────────────── */}
        <div className="flex items-center justify-between pt-2 border-t border-theme-border">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>

          <Button
            variant="primary"
            onClick={() => handleSave(true)}
            loading={saving}
            icon={<Send size={15} />}
          >
            Enviar a Revisión
          </Button>
        </div>
      </div>
    </Modal>
  );
};
