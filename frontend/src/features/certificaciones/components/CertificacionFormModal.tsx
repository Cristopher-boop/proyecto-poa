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
  Save,
  Layers,
  Sparkles,
  User,
  Check,
} from 'lucide-react';
import { CertificacionPOA, CertificacionFormData } from '../../../types/certificacion';
import { Area } from '../../../services/presupuestoService';
import { planificacionService } from '../../../services/planificacionService';
import { Operacion } from '../../../types/planificacion';
import { memoriasApi, MemoriaCalculo } from '../../memorias/api/memoriasApi';
import { Modal, Button, Dropdown, DropdownItem } from '../../../components/commons';
import alertService from '../../../utils/alerts';

interface CertificacionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CertificacionFormData, enviarDirecto?: boolean) => Promise<void>;
  initialData?: CertificacionPOA | null;
  gestionId: number;
  gestionAnio: number;
  areas: Area[];
  userAreaId: number | null;
  isSuperAdmin: boolean;
  userName?: string;
  userCargo?: string;
}

export const CertificacionFormModal: React.FC<CertificacionFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  gestionId,
  gestionAnio,
  areas,
  userAreaId,
  isSuperAdmin,
  userName = '',
  userCargo = '',
}) => {
  // ── 1. Estado del Formulario ──────────────────────────────────────────────────
  const [areaId, setAreaId] = useState<number>(userAreaId || (areas[0]?.id ?? 0));
  const [hojaRuta, setHojaRuta] = useState<string>('');
  const [conceptoGasto, setConceptoGasto] = useState<string>('');
  const [montoSolicitado, setMontoSolicitado] = useState<string>('');
  const [memoriaId, setMemoriaId] = useState<number | null>(null);
  const [selectedOperaciones, setSelectedOperaciones] = useState<number[]>([]);
  const [solicitanteNombre, setSolicitanteNombre] = useState<string>('');
  const [solicitanteCargo, setSolicitanteCargo] = useState<string>('');

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
      setHojaRuta(initialData.hoja_ruta || '');
      setConceptoGasto(initialData.concepto_gasto || '');
      setMontoSolicitado(String(initialData.monto_solicitado || ''));
      setMemoriaId(initialData.memoria || null);
      setSelectedOperaciones(initialData.operaciones || []);
      setSolicitanteNombre(initialData.solicitante_nombre || userName || '');
      setSolicitanteCargo(initialData.solicitante_cargo || userCargo || '');
    } else {
      const defArea = userAreaId || (areas[0]?.id ?? 0);
      setAreaId(defArea);
      setHojaRuta('');
      setConceptoGasto('');
      setMontoSolicitado('');
      setMemoriaId(null);
      setSelectedOperaciones([]);
      setSolicitanteNombre(userName || '');
      const areaObj = areas.find((a) => a.id === defArea);
      setSolicitanteCargo(userCargo || (areaObj ? `GERENTE DE ${areaObj.nombre.toUpperCase()}` : 'Encargado de Área'));
    }
    setErrorMsg(null);
  }, [initialData, isOpen, userAreaId, userName, userCargo, areas]);

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

  // Toggle de selección de operaciones
  const handleToggleOperacion = (opId: number) => {
    setSelectedOperaciones((prev) => {
      if (prev.includes(opId)) {
        return prev.filter((id) => id !== opId);
      }
      return [...prev, opId];
    });
  };

  // ── 5. Jerarquía Implícita Derivada (PEE / POA / Programa) ───────────────────
  const jerarquiaEnVivo = useMemo(() => {
    const selectedOpObjs = selectedOperaciones
      .map((opId) => todasOperaciones.find((o) => o.id === opId))
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
  }, [selectedOperaciones, todasOperaciones]);

  // ── 6. Cálculos de Memoria y Saldos ──────────────────────────────────────────
  const selectedMemoria = useMemo(() => {
    if (!memoriaId) return null;
    return memorias.find((m) => m.id === memoriaId) || null;
  }, [memoriaId, memorias]);

  const saldoDisponibleMC = useMemo(() => {
    if (!selectedMemoria) {
      if (initialData && initialData.memoria === memoriaId) {
        return Number(initialData.memoria_saldo_disponible || 0);
      }
      return 0;
    }
    return Number(selectedMemoria.saldo_disponible || 0);
  }, [selectedMemoria, initialData, memoriaId]);

  const numMonto = Number(montoSolicitado) || 0;
  const saldoRestanteProyectado = Math.max(0, saldoDisponibleMC - numMonto);
  const isMontoExcedido = memoriaId !== null && numMonto > saldoDisponibleMC;

  // Dropdown items de Memorias
  const memoriaDropdownItems: DropdownItem[] = useMemo(() => {
    return [
      { id: '', label: 'Sin vinculación directa a Memoria (se definirá en revisión)' },
      ...memorias.map((m) => {
        const saldo = Number(m.saldo_disponible || 0);
        return {
          id: m.id,
          label: `${m.codigo} — ${m.justificacion || 'Sin descripción'}`,
          badge: `Disp: Bs. ${saldo.toLocaleString('es-BO', { minimumFractionDigits: 2 })}`,
          badgeClassName:
            saldo > 0
              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
        };
      }),
    ];
  }, [memorias]);

  // ── 7. Validación y Envío ────────────────────────────────────────────────────
  const handleSave = async (enviarDirecto = false) => {
    setErrorMsg(null);

    // 1. Hoja de Ruta OBLIGATORIA
    const hr = hojaRuta.trim();
    if (!hr) {
      setErrorMsg('La Hoja de Ruta / CITE / Razón de la solicitud es OBLIGATORIA.');
      return;
    }

    // 2. Operaciones POA OBLIGATORIAS (Dónde se hará el gasto)
    if (selectedOperaciones.length === 0) {
      setErrorMsg('Debe seleccionar al menos una Operación POA donde se imputará el gasto.');
      return;
    }

    // 3. Breve descripción OBLIGATORIA
    const desc = conceptoGasto.trim();
    if (!desc) {
      setErrorMsg('Debe ingresar una breve descripción / justificación del gasto solicitado.');
      return;
    }

    // 4. Monto mayor a 0
    if (numMonto <= 0) {
      setErrorMsg('El monto solicitado debe ser mayor a Bs. 0.00.');
      return;
    }

    // 5. Saldo disponible si hay memoria vinculada
    if (isMontoExcedido) {
      setErrorMsg(
        `El monto solicitado (Bs. ${numMonto.toLocaleString('es-BO', { minimumFractionDigits: 2 })}) supera el saldo disponible de la memoria seleccionada (Bs. ${saldoDisponibleMC.toLocaleString('es-BO', { minimumFractionDigits: 2 })}).`
      );
      return;
    }

    if (enviarDirecto) {
      const confirmacion = await alertService.confirm({
        title: '¿Confirmar envío a Planificación?',
        text: `La solicitud con Hoja de Ruta "${hr}" se remitirá a la Unidad de Planificación para revisión de alineación técnica y emisión de la Certificación POA.`,
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
        es_contratacion: true, // Por defecto pasa al flujo oficial
        gestion: gestionId,
        area: areaId,
        operaciones: selectedOperaciones,
        memoria: memoriaId,
        monto_solicitado: numMonto,
        concepto_gasto: desc,
        solicitante_nombre: solicitanteNombre.trim(),
        solicitante_cargo: solicitanteCargo.trim(),
        fecha: initialData?.fecha || new Date().toISOString().split('T')[0],
        version: initialData?.version || `Versión 1: ${gestionAnio}`,
        notas: initialData?.notas || '',
      };

      await onSubmit(payload, enviarDirecto);
      onClose();
    } catch (err: any) {
      const data = err?.response?.data;
      if (typeof data === 'object') {
        const firstKey = Object.keys(data)[0];
        const val = data[firstKey];
        setErrorMsg(Array.isArray(val) ? val[0] : String(val));
      } else {
        setErrorMsg('Ocurrió un error al guardar la solicitud de certificación.');
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
      title={initialData ? `Editar Solicitud (${initialData.hoja_ruta})` : 'Solicitud de Gasto y Certificación POA — Gerencia'}
      size="xl"
    >
      <div className="space-y-6">
        {/* Banner Institucional Explicativo */}
        <div className="p-4 rounded-2xl bg-theme-primary/10 border border-theme-primary/20 text-theme-main">
          <div className="flex items-start gap-3">
            <span className="p-2 rounded-xl bg-theme-primary/20 text-theme-primary shrink-0 mt-0.5">
              <FileText size={20} />
            </span>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-theme-main">
                Paso 1: Solicitud de Imputación de Gasto Institucional
              </h4>
              <p className="text-xs text-theme-muted leading-relaxed">
                Seleccione las <strong>Operaciones POA</strong> donde se realizará el gasto, indique la <strong>Hoja de Ruta obligatoria</strong> y una <strong>breve justificación</strong>. Esta solicitud pasará a revisión técnica de la Unidad de Planificación.
              </p>
            </div>
          </div>
        </div>

        {/* Mensaje de error general si ocurre */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {/* ── SECCIÓN 1: DÓNDE SE HARÁ EL GASTO (OPERACIONES POA) ────────────────── */}
        <div className="space-y-3 p-4 rounded-2xl bg-theme-surface border border-theme-border shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-theme-primary/15 text-theme-primary">
                <Layers size={16} />
              </span>
              <div>
                <label className="font-bold text-sm text-theme-main block">
                  1. Dónde se hará el gasto: Operación(es) POA <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-theme-muted block">
                  Área: <strong>{areaActualObj?.nombre || 'Gerencia'}</strong> ({areaActualObj?.codigo || '---'})
                </span>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-theme-primary/15 text-theme-primary border border-theme-primary/25">
              {selectedOperaciones.length} seleccionada(s)
            </span>
          </div>

          {/* Selector de Área si es Administrador */}
          {isSuperAdmin && (
            <div className="pt-2">
              <label className="block text-xs font-semibold text-theme-muted mb-1">
                Cambiar Gerencia / Unidad Solicitante (SuperAdmin):
              </label>
              <select
                value={areaId}
                onChange={(e) => {
                  setAreaId(Number(e.target.value));
                  setSelectedOperaciones([]);
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

          {/* Lista interactiva de Operaciones con Checkboxes */}
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {loadingOps ? (
              <div className="py-8 text-center text-xs text-theme-muted">
                Cargando operaciones POA del área...
              </div>
            ) : operacionesDelArea.length === 0 ? (
              <div className="p-4 rounded-xl bg-theme-base border border-theme-border text-center text-xs text-theme-muted">
                No hay operaciones activas registradas para esta gerencia en la gestión.
              </div>
            ) : (
              operacionesDelArea.map((op) => {
                const isSelected = selectedOperaciones.includes(op.id);
                return (
                  <div
                    key={op.id}
                    onClick={() => handleToggleOperacion(op.id)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'bg-theme-primary/10 border-theme-primary text-theme-main font-medium shadow-xs'
                        : 'bg-theme-base border-theme-border hover:border-theme-primary/40 text-theme-muted'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="mt-0.5 rounded text-theme-primary focus:ring-0 cursor-pointer"
                    />
                    <div className="flex-1 leading-snug">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-theme-primary font-mono text-xs">
                          {op.codigo}
                        </span>
                        {op.acp_codigo && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-theme-surface border border-theme-border text-theme-main font-mono font-semibold">
                            ACP: {op.acp_codigo}
                          </span>
                        )}
                        {op.amp_codigo && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-theme-surface border border-theme-border text-theme-muted font-mono">
                            PEE: {op.amp_codigo}
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

          {/* Tarjeta de Jerarquía Implícita Autocompletada */}
          {jerarquiaEnVivo.operaciones.length > 0 && (
            <div className="p-3 rounded-xl bg-theme-primary/5 border border-theme-primary/20 text-xs space-y-1.5 text-theme-main animate-fadeIn">
              <div className="flex items-center gap-1.5 font-bold text-theme-primary text-xs">
                <Sparkles size={14} />
                <span>Jerarquía Estratégica Institucional Implícita:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                <div className="p-2 rounded-lg bg-theme-surface border border-theme-border">
                  <span className="text-theme-muted block font-semibold">Acción Mediano Plazo (PEE)</span>
                  <strong className="text-theme-main font-mono">
                    {jerarquiaEnVivo.amps.map((a) => a.codigo).join(', ') || 'No asignada'}
                  </strong>
                </div>
                <div className="p-2 rounded-lg bg-theme-surface border border-theme-border">
                  <span className="text-theme-muted block font-semibold">Acción Corto Plazo (POA)</span>
                  <strong className="text-theme-main font-mono">
                    {jerarquiaEnVivo.acps.map((a) => a.codigo).join(', ') || 'No asignada'}
                  </strong>
                </div>
                <div className="p-2 rounded-lg bg-theme-surface border border-theme-border">
                  <span className="text-theme-muted block font-semibold">Programa Institucional</span>
                  <strong className="text-theme-main font-mono truncate block" title={jerarquiaEnVivo.programas.map((p) => p.nombre).join(', ')}>
                    {jerarquiaEnVivo.programas.map((p) => `[${p.codigo}] ${p.nombre}`).join('; ') || 'No asignado'}
                  </strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── SECCIÓN 2: HOJA DE RUTA Y DESCRIPCIÓN ──────────────────────────────── */}
        <div className="space-y-4 p-4 rounded-2xl bg-theme-surface border border-theme-border shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Hoja de Ruta Obligatoria */}
            <div>
              <label className="block text-xs font-bold text-theme-main mb-1">
                2. Hoja de Ruta / CITE / Razón de la Solicitud <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={hojaRuta}
                  onChange={(e) => setHojaRuta(e.target.value)}
                  placeholder="Ej: HR-GI-2026-042 / CITE-EPTAM-015/2026"
                  className="w-full bg-theme-base border border-theme-border rounded-xl px-3.5 py-2.5 text-xs text-theme-main font-semibold placeholder:text-theme-muted focus:outline-none focus:ring-1 focus:ring-theme-primary uppercase"
                />
              </div>
              <span className="text-[10px] text-theme-muted mt-1 block">
                Identificador oficial del trámite (CITE u Hoja de Ruta de Correspondencia).
              </span>
            </div>

            {/* Monto Solicitado */}
            <div>
              <label className="block text-xs font-bold text-theme-main mb-1">
                Monto Solicitado Estimado (Bs.) <span className="text-rose-500">*</span>
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
                  className="w-full bg-theme-base border border-theme-border rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-theme-main font-extrabold placeholder:text-theme-muted focus:outline-none focus:ring-1 focus:ring-theme-primary"
                />
              </div>
              <span className="text-[10px] text-theme-muted mt-1 block">
                Presupuesto estimado necesario para ejecutar la contratación o gasto.
              </span>
            </div>
          </div>

          {/* Breve Descripción / Concepto del Gasto */}
          <div>
            <label className="block text-xs font-bold text-theme-main mb-1">
              3. Breve Descripción / Justificación del Gasto <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={conceptoGasto}
              onChange={(e) => setConceptoGasto(e.target.value)}
              placeholder="Describa brevemente el objeto del gasto, requerimiento técnico o necesidad operativa..."
              className="w-full bg-theme-base border border-theme-border rounded-xl p-3 text-xs text-theme-main placeholder:text-theme-muted focus:outline-none focus:ring-1 focus:ring-theme-primary leading-relaxed"
            />
          </div>
        </div>

        {/* ── SECCIÓN 3: VINCULACIÓN A MEMORIA DE CÁLCULO (OPCIONAL/RECOMENDADO) ─── */}
        <div className="p-4 rounded-2xl bg-theme-surface border border-theme-border shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <Wallet size={16} />
              </span>
              <div>
                <label className="font-bold text-xs text-theme-main block">
                  4. Vincular a Memoria de Cálculo (Partida y Saldo)
                </label>
                <span className="text-[10px] text-theme-muted block">
                  Permite imputar y descontar automáticamente del saldo presupuestado de la gerencia.
                </span>
              </div>
            </div>
          </div>

          <Dropdown
            items={memoriaDropdownItems}
            value={memoriaId || ''}
            onChange={(val) => setMemoriaId(val ? Number(val) : null)}
            placeholder={loadingMemorias ? 'Cargando memorias...' : 'Seleccione una Memoria de Cálculo (opcional)...'}
            size="md"
            searchable
          />

          {/* Resumen financiero en vivo si se seleccionó memoria */}
          {selectedMemoria && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 text-xs">
              <div className="p-2.5 rounded-xl bg-theme-base border border-theme-border">
                <span className="text-theme-muted text-[10px] uppercase font-semibold block">
                  Presupuesto Total MC
                </span>
                <strong className="text-theme-main font-mono text-xs">
                  Bs. {Number(selectedMemoria.total_presupuestado || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                </strong>
              </div>

              <div className="p-2.5 rounded-xl bg-theme-base border border-theme-border">
                <span className="text-theme-muted text-[10px] uppercase font-semibold block">
                  Saldo Disponible
                </span>
                <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-xs">
                  Bs. {saldoDisponibleMC.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                </strong>
              </div>

              <div className={`p-2.5 rounded-xl border ${
                isMontoExcedido
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-600'
                  : 'bg-theme-base border-theme-border'
              }`}>
                <span className="text-theme-muted text-[10px] uppercase font-semibold block">
                  Saldo Restante Proyectado
                </span>
                <strong className={`font-mono text-xs ${isMontoExcedido ? 'text-rose-600 font-bold' : 'text-theme-main'}`}>
                  Bs. {saldoRestanteProyectado.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                </strong>
              </div>
            </div>
          )}
        </div>

        {/* ── SECCIÓN 4: DATOS DEL SOLICITANTE (FIRMAS) ─────────────────────────── */}
        <div className="p-4 rounded-2xl bg-theme-surface border border-theme-border shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <span className="p-1.5 rounded-lg bg-theme-primary/15 text-theme-primary">
              <User size={15} />
            </span>
            <label className="font-bold text-xs text-theme-main">
              5. Solicitante Responsable (Jefe / Gerente de Área)
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-theme-muted mb-1">Nombre Completo</label>
              <input
                type="text"
                value={solicitanteNombre}
                onChange={(e) => setSolicitanteNombre(e.target.value)}
                placeholder="Nombre del Solicitante"
                className="w-full bg-theme-base border border-theme-border rounded-xl px-3 py-2 text-theme-main focus:outline-none focus:ring-1 focus:ring-theme-primary"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-theme-muted mb-1">Cargo Institucional</label>
              <input
                type="text"
                value={solicitanteCargo}
                onChange={(e) => setSolicitanteCargo(e.target.value)}
                placeholder="Ej: GERENTE DE INFORMÁTICA"
                className="w-full bg-theme-base border border-theme-border rounded-xl px-3 py-2 text-theme-main focus:outline-none focus:ring-1 focus:ring-theme-primary"
              />
            </div>
          </div>
        </div>

        {/* ── BOTONES DE ACCIÓN (PIE DEL MODAL) ─────────────────────────────────── */}
        <div className="flex items-center justify-between pt-2 border-t border-theme-border">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              onClick={() => handleSave(false)}
              loading={saving}
              icon={<Save size={15} />}
            >
              Guardar como Borrador
            </Button>

            <Button
              variant="primary"
              onClick={() => handleSave(true)}
              loading={saving}
              icon={<Send size={15} />}
            >
              Enviar a Planificación
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
