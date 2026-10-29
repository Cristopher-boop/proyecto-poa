import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Sparkles,
  BookOpen,
  ArrowRightLeft,
  ShieldCheck,
  Coins,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building,
  Send,
  HelpCircle,
  Copy,
  Plus,
  Percent,
  Check,
  Calculator,
  RefreshCw,
  Info,
  CheckSquare,
  Eye,
  Wand2,
} from 'lucide-react';
import { Button } from '../../../../components/commons';
import { RolTour } from '../../types/guia.types';

export interface SimulatedModalConfig {
  type:
    | 'memoria_form'
    | 'traspaso_form'
    | 'certificacion_form'
    | 'planif_review'
    | 'presup_review'
    | 'tesoreria_pago';
  title: string;
  subtitle: string;
  actionButtonLabel: string;
  defaultData?: Record<string, any>;
  roleAdvice?: string;
  onSuccessMessage: string;
}

interface TourSimulatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SimulatedModalConfig;
  userRole?: RolTour;
  onConfirm: () => void;
}

export const TourSimulatedModal: React.FC<TourSimulatedModalProps> = ({
  isOpen,
  onClose,
  config,
  userRole = 'gerente',
  onConfirm,
}) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [exampleNotice, setExampleNotice] = useState<string | null>(null);

  // ── ESTADOS PARA MEMORIAS DE CÁLCULO ──────────────────────────────────────
  const [modoMemoria, setModoMemoria] = useState<'nueva' | 'duplicar'>('nueva');
  const [gestionBase, setGestionBase] = useState('2025');
  const [porcentajeInflacion, setPorcentajeInflacion] = useState('5');
  const [aplicarInflacion, setAplicarInflacion] = useState(true);
  const [partidaSeleccionada, setPartidaSeleccionada] = useState('34110');
  const [operacionSeleccionada, setOperacionSeleccionada] = useState('OP-03');
  const [itemNombre, setItemNombre] = useState('Adquisición de combustible y lubricantes');
  const [itemCantidad, setItemCantidad] = useState('500');
  const [itemUnidad, setItemUnidad] = useState('Litros');
  const [itemPrecioUnitario, setItemPrecioUnitario] = useState('30.00');
  const [justificacionMemoria, setJustificacionMemoria] = useState(
    config.defaultData?.justificacion ||
      'Adquisición de combustible y lubricantes para el parque automotor operativo de la gerencia.'
  );
  const [itemsDuplicar, setItemsDuplicar] = useState([
    { id: '1', partida: '34110 — Combustibles y Lubricantes', montoBase: 14000, seleccionado: true },
    { id: '2', partida: '39500 — Útiles de Escritorio y Oficina', montoBase: 8000, seleccionado: true },
    { id: '3', partida: '24130 — Mantenimiento Preventivo de Equipos', montoBase: 12000, seleccionado: false },
  ]);

  // Cálculo automático del total de la memoria nueva
  const montoMemoriaCalculado = useMemo(() => {
    const qty = parseFloat(itemCantidad) || 0;
    const price = parseFloat(itemPrecioUnitario) || 0;
    return (qty * price).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, [itemCantidad, itemPrecioUnitario]);

  // Cálculo de items duplicados con inflación
  const inflacionNum = parseFloat(porcentajeInflacion) || 0;
  const totalDuplicadoCalculado = useMemo(() => {
    const factor = aplicarInflacion ? 1 + inflacionNum / 100 : 1;
    const total = itemsDuplicar
      .filter((i) => i.seleccionado)
      .reduce((sum, item) => sum + item.montoBase * factor, 0);
    return total.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, [itemsDuplicar, aplicarInflacion, inflacionNum]);

  // ── ESTADOS PARA MODIFICACIONES / TRASPASOS ───────────────────────────────
  const [tipoTraspaso, setTipoTraspaso] = useState<'intra' | 'inter'>('inter');
  const [partidaOrigen, setPartidaOrigen] = useState('39500');
  const [partidaDestino, setPartidaDestino] = useState('25600');
  const [montoTraspaso, setMontoTraspaso] = useState(config.defaultData?.monto || '5000.00');
  const [justificacionTraspaso, setJustificacionTraspaso] = useState(
    'Refuerzo de servicios técnicos por alta demanda operativa en el trimestre.'
  );

  // Cálculos dinámicos de saldo en traspasos
  const saldoCedenteBase = 28400;
  const saldoReceptoraBase = 2100;
  const montoTraspasoNum = parseFloat(String(montoTraspaso).replace(/[^0-9.]/g, '')) || 0;
  const nuevoSaldoCedente = Math.max(0, saldoCedenteBase - montoTraspasoNum);
  const nuevoSaldoReceptor = saldoReceptoraBase + montoTraspasoNum;
  const hayExcesoSaldo = montoTraspasoNum > saldoCedenteBase;

  // ── ESTADOS PARA CERTIFICACIONES POA ──────────────────────────────────────
  const [esPac, setEsPac] = useState(true);
  const [citeDoc, setCiteDoc] = useState('CITE-GG-2026-0089');
  const [objetoGasto, setObjetoGasto] = useState(
    'Mantenimiento preventivo y correctivo de redes de comunicaciones'
  );
  const [montoCertificacion, setMontoCertificacion] = useState(config.defaultData?.monto || '4800.00');
  const [memoriaSeleccionada, setMemoriaSeleccionada] = useState('MC-2026-0045');
  const montoCertNum = parseFloat(String(montoCertificacion).replace(/[^0-9.]/g, '')) || 0;
  const saldoMCBase = 12000;
  const nuevoSaldoMC = Math.max(0, saldoMCBase - montoCertNum);
  const requiereCertificacion = montoCertNum > 2000 || esPac;

  // ── ESTADOS PARA PLANIFICACIÓN ─────────────────────────────────────────────
  const [checkPei, setCheckPei] = useState(true);
  const [checkOperacion, setCheckOperacion] = useState(true);
  const [checkCronograma, setCheckCronograma] = useState(true);
  const [dictamenPlanif, setDictamenPlanif] = useState<'favorable' | 'observado'>('favorable');
  const [obsPlanif, setObsPlanif] = useState(
    'La solicitud guarda coherencia con el Objetivo Estratégico 2 del PEI y las metas físicas de la gestión 2026.'
  );

  // ── ESTADOS PARA PRESUPUESTOS ─────────────────────────────────────────────
  const [montoComprometerPresup, setMontoComprometerPresup] = useState('15000.00');
  const [dictamenPresup, setDictamenPresup] = useState<'aprobar' | 'recorte'>('aprobar');
  const [obsPresup, setObsPresup] = useState(
    'Verificado crédito presupuestario suficiente en la estructura programática institucional.'
  );

  // ── ESTADOS PARA TESORERÍA (LIC. ZAIDA) ───────────────────────────────────
  const [numFactura, setNumFactura] = useState('FACT-84920');
  const [proveedor, setProveedor] = useState('ENTEL S.A.');
  const [numComprobante, setNumComprobante] = useState('TR-BANCO-UNION-4920');
  const [cuentaBancaria, setCuentaBancaria] = useState('union-principal');
  const [montoPago, setMontoPago] = useState('4800.00');
  const [confirmarSalidaDinero, setConfirmarSalidaDinero] = useState(true);

  // Sincronizar modo inicial si config lo define
  useEffect(() => {
    if (config?.defaultData?.tipo === 'duplicar') {
      setModoMemoria('duplicar');
    }
  }, [config]);

  // ── FUNCIÓN PARA AUTOCOMPLETAR CON EJEMPLO DIDÁCTICO ──────────────────────
  const handleFillExample = () => {
    switch (config.type) {
      case 'memoria_form':
        if (modoMemoria === 'nueva') {
          setPartidaSeleccionada('34110');
          setOperacionSeleccionada('OP-03');
          setItemNombre('Combustible Diésel Oíl para vehículos de inspección operativa');
          setItemCantidad('500');
          setItemUnidad('Litros');
          setItemPrecioUnitario('30.00');
          setJustificacionMemoria(
            'Suministro de combustible para garantizar las inspecciones operativas en campo durante el primer y segundo trimestre POA 2026.'
          );
        } else {
          setGestionBase('2025');
          setAplicarInflacion(true);
          setPorcentajeInflacion('5');
          setItemsDuplicar((prev) => prev.map((i) => ({ ...i, seleccionado: true })));
        }
        break;

      case 'traspaso_form':
        setTipoTraspaso('inter');
        setPartidaOrigen('39500');
        setPartidaDestino('25600');
        setMontoTraspaso('5000.00');
        setJustificacionTraspaso(
          'Refuerzo presupuestario indispensable para contratación de soporte técnico especializado ante contingencia de servidores en el Q2.'
        );
        break;

      case 'certificacion_form':
        setCiteDoc('CITE-GG-2026-0089');
        setObjetoGasto(
          'Contratación del servicio de mantenimiento correctivo y ampliación de cableado estructurado y redes'
        );
        setMontoCertificacion('4800.00');
        setEsPac(true);
        setMemoriaSeleccionada('MC-2026-0045');
        break;

      case 'tesoreria_pago':
        setNumFactura('FACT-84920');
        setProveedor('ENTEL S.A.');
        setNumComprobante('TR-BANCO-UNION-4920');
        setMontoPago('4800.00');
        setCuentaBancaria('union-principal');
        setConfirmarSalidaDinero(true);
        break;

      case 'planif_review':
        setCheckPei(true);
        setCheckOperacion(true);
        setCheckCronograma(true);
        setDictamenPlanif('favorable');
        setObsPlanif(
          'Conformidad técnica acreditada: la solicitud guarda correlación directa con el Objetivo Estratégico 2 y las metas de eficiencia operativa.'
        );
        break;

      case 'presup_review':
        setMontoComprometerPresup('15000.00');
        setDictamenPresup('aprobar');
        setObsPresup(
          'Disponibilidad presupuestaria constatada en el clasificador institucional. Se incorpora al presupuesto oficial vigente.'
        );
        break;
    }

    setExampleNotice('✓ Datos didácticos cargados en todos los campos. Puedes editarlos libremente o pulsar el botón de confirmación.');
    setTimeout(() => {
      setExampleNotice(null);
    }, 4500);
  };

  if (!isOpen) return null;

  const handleAction = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onConfirm();
      }, 700);
    }, 600);
  };

  const isGerente = userRole === 'gerente';

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] pointer-events-auto select-auto flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div
        className="relative pointer-events-auto select-auto w-full max-w-2xl bg-white dark:bg-slate-900 border-2 border-amber-400 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── HEADER MODAL ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-theme-border bg-theme-base/60 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/30">
              <Sparkles size={20} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-theme-main">{config.title}</h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  Formulario Interactivo
                </span>
              </div>
              <p className="text-xs text-theme-muted mt-0.5">{config.subtitle}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-theme-main rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── CUERPO SCROLLEABLE INTERACTIVO ── */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[72vh] overflow-y-auto pointer-events-auto select-auto">
          {/* Asesoría contextual del rol */}
          {config.roleAdvice && (
            <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2.5">
              <HelpCircle size={16} className="shrink-0 mt-0.5 text-blue-500" />
              <span>{config.roleAdvice}</span>
            </div>
          )}

          {/* ── BANNER ASISTENTE GUIADO: AUTOCOMPLETAR EJEMPLO ── */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-blue-500/10 to-emerald-500/15 border border-amber-500/30 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-amber-500 text-white shadow-xs">
                <Wand2 size={15} />
              </span>
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                  Asistente Didáctico de Llenado
                </span>
                <p className="text-xs text-theme-main font-semibold">
                  Consulta las pistas de <strong>"Aquí ingresas..."</strong> y <strong>"Aquí puedes ver..."</strong> en cada campo.
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={handleFillExample}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md px-3 py-1.5 rounded-xl cursor-pointer"
            >
              <Sparkles size={13} />
              <span>Autocompletar Ejemplo</span>
            </Button>
          </div>

          {/* Notificación de datos de ejemplo cargados */}
          {exampleNotice && (
            <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              <span>{exampleNotice}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 1. FORMULARIO INTERACTIVO DE MEMORIAS DE CÁLCULO (MCs)                    */}
          {/* ========================================================================= */}
          {config.type === 'memoria_form' && (
            <div className="space-y-4 text-xs">
              {/* Pestañas: Formular Nueva vs Duplicar */}
              <div className="space-y-1">
                <div className="grid grid-cols-2 gap-2 p-1 bg-theme-base rounded-2xl border border-theme-border">
                  <button
                    type="button"
                    onClick={() => setModoMemoria('nueva')}
                    className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      modoMemoria === 'nueva'
                        ? 'bg-theme-surface text-theme-main shadow-xs border border-theme-border'
                        : 'text-theme-muted hover:text-theme-main'
                    }`}
                  >
                    <Plus size={14} className="text-amber-500" />
                    <span>Formular Nueva Memoria</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModoMemoria('duplicar')}
                    className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      modoMemoria === 'duplicar'
                        ? 'bg-blue-500 text-white shadow-xs'
                        : 'text-theme-muted hover:text-theme-main'
                    }`}
                  >
                    <Copy size={14} />
                    <span>Duplicar de Gestión Anterior</span>
                  </button>
                </div>
                <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1.5 px-2.5 py-1 bg-blue-50/70 dark:bg-blue-950/30 rounded-xl border border-blue-200/50">
                  <Info size={12} className="text-blue-500 shrink-0" />
                  <span><strong>Aquí eliges:</strong> Si formulas un ítem nuevo desde cero o si duplicas la base presupuestaria del año anterior.</span>
                </div>
              </div>

              {/* MODO A: FORMULAR NUEVA */}
              {modoMemoria === 'nueva' && (
                <div className="space-y-3.5 animate-in fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-theme-base rounded-xl border border-theme-border">
                      <span className="text-[10px] font-bold text-theme-muted uppercase block mb-1">
                        Área Solicitante
                      </span>
                      <div className="font-bold text-theme-main flex items-center gap-1.5">
                        <Building size={14} className="text-theme-primary" />
                        Gerencia de Operaciones y Servicios
                      </div>
                      {isGerente && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block mt-1">
                          ✓ Como Gerente puedes formular y otorgar pertinencia directa
                        </span>
                      )}
                    </div>

                    <div className="p-3 bg-theme-base rounded-xl border border-theme-border">
                      <span className="text-[10px] font-bold text-theme-muted uppercase block mb-1">
                        Gestión Fiscal
                      </span>
                      <div className="font-bold text-emerald-600 dark:text-emerald-400">
                        POA 2026 — Techo Financiero Asignado
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-theme-muted uppercase block mb-1">
                        Partida Presupuestaria
                      </label>
                      <select
                        value={partidaSeleccionada}
                        onChange={(e) => setPartidaSeleccionada(e.target.value)}
                        className="input-theme text-xs font-bold w-full"
                      >
                        <option value="34110">34110 — Combustibles y Lubricantes</option>
                        <option value="31110">31110 — Alimentos y Bebidas para Personas</option>
                        <option value="24130">24130 — Mantenimiento de Edificios y Equipos</option>
                        <option value="39500">39500 — Útiles de Escritorio y Oficina</option>
                        <option value="25600">25600 — Servicios Técnicos Profesionales</option>
                      </select>
                      <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 mt-1 bg-blue-50/60 dark:bg-blue-950/30 px-2 py-0.5 rounded-lg border border-blue-200/50">
                        <Info size={11} className="text-blue-500 shrink-0" />
                        <span><strong>Aquí ingresas:</strong> El código presupuestario que tipifica el gasto.</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-theme-muted uppercase block mb-1">
                        Operación POA Vinculada
                      </label>
                      <select
                        value={operacionSeleccionada}
                        onChange={(e) => setOperacionSeleccionada(e.target.value)}
                        className="input-theme text-xs font-bold w-full"
                      >
                        <option value="OP-03">OP-03: Mantenimiento y Combustible Vehicular</option>
                        <option value="OP-01">OP-01: Gestión y Soporte Operativo General</option>
                        <option value="OP-02">OP-02: Fortalecimiento Tecnológico e Infraestructura</option>
                      </select>
                      <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 mt-1 bg-blue-50/60 dark:bg-blue-950/30 px-2 py-0.5 rounded-lg border border-blue-200/50">
                        <Info size={11} className="text-blue-500 shrink-0" />
                        <span><strong>Aquí ingresas:</strong> La meta estratégica a la que aporta tu gerencia.</span>
                      </div>
                    </div>
                  </div>

                  {/* Especificación de Ítem, Cantidad y Precio */}
                  <div className="p-3.5 bg-theme-base rounded-2xl border border-theme-border space-y-2.5">
                    <span className="text-[10px] font-extrabold uppercase text-theme-muted block">
                      Desglose de Ítems (Cálculo Automático)
                    </span>
                    <div>
                      <label className="text-[10px] font-bold text-theme-muted uppercase block mb-1">
                        Descripción del Ítem
                      </label>
                      <input
                        type="text"
                        value={itemNombre}
                        onChange={(e) => setItemNombre(e.target.value)}
                        placeholder="Ej. Combustible Diésel Oíl para maquinaria"
                        className="input-theme text-xs font-semibold w-full"
                      />
                      <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 mt-1 bg-blue-50/60 dark:bg-blue-950/30 px-2 py-0.5 rounded-lg border border-blue-200/50">
                        <Info size={11} className="text-blue-500 shrink-0" />
                        <span><strong>Aquí ingresas:</strong> El nombre claro y especificación del bien o servicio.</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      <div>
                        <label className="text-[10px] font-bold text-theme-muted uppercase block mb-1">
                          Cantidad
                        </label>
                        <input
                          type="number"
                          value={itemCantidad}
                          onChange={(e) => setItemCantidad(e.target.value)}
                          className="input-theme text-xs font-mono font-bold w-full"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-theme-muted uppercase block mb-1">
                          Unidad
                        </label>
                        <input
                          type="text"
                          value={itemUnidad}
                          onChange={(e) => setItemUnidad(e.target.value)}
                          className="input-theme text-xs font-semibold w-full"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-theme-muted uppercase block mb-1">
                          Precio Unit. (BOB)
                        </label>
                        <input
                          type="number"
                          step="0.10"
                          value={itemPrecioUnitario}
                          onChange={(e) => setItemPrecioUnitario(e.target.value)}
                          className="input-theme text-xs font-mono font-bold w-full"
                        />
                      </div>
                    </div>
                    <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 bg-blue-50/60 dark:bg-blue-950/30 px-2 py-0.5 rounded-lg border border-blue-200/50">
                      <Info size={11} className="text-blue-500 shrink-0" />
                      <span><strong>Aquí ingresas:</strong> Cuántas unidades requieres y su costo unitario estimado.</span>
                    </div>

                    <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-theme-main flex items-center gap-1.5">
                          <Calculator size={14} className="text-emerald-500" /> Presupuesto Requerido Total:
                        </span>
                        <span className="font-mono text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                          {montoMemoriaCalculado} BOB
                        </span>
                      </div>
                      <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-1">
                        <Eye size={11} className="text-emerald-500 shrink-0" />
                        <span><strong>Aquí puedes ver:</strong> El importe resultante de multiplicar Cantidad × Precio Unitario.</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-theme-muted uppercase block mb-1">
                      Justificación Técnica Institucional
                    </label>
                    <textarea
                      rows={2}
                      value={justificacionMemoria}
                      onChange={(e) => setJustificacionMemoria(e.target.value)}
                      placeholder="Explica la necesidad y beneficio institucional..."
                      className="input-theme text-xs w-full"
                    />
                    <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 mt-1 bg-blue-50/60 dark:bg-blue-950/30 px-2 py-0.5 rounded-lg border border-blue-200/50">
                      <Info size={11} className="text-blue-500 shrink-0" />
                      <span><strong>Aquí ingresas:</strong> La fundamentación técnica que evaluará Planificación.</span>
                    </div>
                  </div>
                </div>
              )}

              {/* MODO B: DUPLICAR DE GESTIÓN ANTERIOR */}
              {modoMemoria === 'duplicar' && (
                <div className="space-y-3.5 animate-in fade-in">
                  <div className="p-4 bg-blue-500/10 border-2 border-blue-500/30 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase text-blue-600 dark:text-blue-400">
                        Duplicación de Requerimientos Previos
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-theme-muted">Gestión Base:</span>
                        <select
                          value={gestionBase}
                          onChange={(e) => setGestionBase(e.target.value)}
                          className="input-theme text-xs font-bold py-0.5 px-2"
                        >
                          <option value="2025">2025</option>
                          <option value="2024">2024</option>
                        </select>
                      </div>
                    </div>

                    <p className="text-xs text-theme-main font-semibold">
                      Como Gerente de Área, puedes clonar las partidas de la gestión {gestionBase} para formular con base técnica y reajustar proyecciones de inflación para el POA 2026.
                    </p>

                    <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 bg-white/40 dark:bg-slate-900/40 px-2.5 py-1 rounded-xl border border-blue-200/50">
                      <Info size={11} className="text-blue-500 shrink-0" />
                      <span><strong>Aquí ingresas:</strong> El año anterior de referencia para importar tus partidas consolidadas.</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-blue-500/20">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={aplicarInflacion}
                          onChange={(e) => setAplicarInflacion(e.target.checked)}
                          className="rounded text-blue-600 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-theme-main">
                          Reajuste proyectado de precios:
                        </span>
                      </label>
                      <div className="inline-flex items-center gap-1">
                        <input
                          type="number"
                          value={porcentajeInflacion}
                          onChange={(e) => setPorcentajeInflacion(e.target.value)}
                          disabled={!aplicarInflacion}
                          className="input-theme text-xs font-mono font-bold w-16 py-0.5 px-2 text-center"
                        />
                        <span className="text-xs font-bold text-theme-muted">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Tabla de ítems con checkboxes interactivos */}
                  <div className="border border-theme-border rounded-2xl overflow-hidden shadow-xs">
                    <div className="bg-theme-base px-3.5 py-2 text-[10px] font-bold uppercase text-theme-muted border-b border-theme-border flex justify-between items-center">
                      <span>Seleccionar Partidas de {gestionBase}</span>
                      <span>Monto 2026 Proyectado</span>
                    </div>

                    <div className="p-2 space-y-1.5 text-xs bg-theme-surface">
                      {itemsDuplicar.map((item) => {
                        const factor = aplicarInflacion ? 1 + inflacionNum / 100 : 1;
                        const montoProyectado = (item.montoBase * factor).toLocaleString('es-BO', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        });
                        return (
                          <label
                            key={item.id}
                            className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                              item.seleccionado
                                ? 'bg-blue-500/10 border-blue-500/30'
                                : 'bg-theme-base/50 border-theme-border/60 hover:bg-theme-base'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={item.seleccionado}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setItemsDuplicar((prev) =>
                                    prev.map((i) => (i.id === item.id ? { ...i, seleccionado: checked } : i))
                                  );
                                }}
                                className="rounded text-blue-600 cursor-pointer"
                              />
                              <div>
                                <span className="font-bold text-theme-main block">{item.partida}</span>
                                <span className="text-[10px] text-theme-muted">
                                  Base {gestionBase}: {item.montoBase.toLocaleString('es-BO')} Bs
                                </span>
                              </div>
                            </div>
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {montoProyectado} Bs
                            </span>
                          </label>
                        );
                      })}
                    </div>

                    <div className="bg-theme-base p-3 border-t border-theme-border space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-theme-main">Total Proyectado a Duplicar:</span>
                        <span className="font-mono text-sm font-extrabold text-blue-600 dark:text-blue-400">
                          {totalDuplicadoCalculado} BOB
                        </span>
                      </div>
                      <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
                        <Eye size={11} className="text-blue-500 shrink-0" />
                        <span><strong>Aquí puedes ver:</strong> La suma global de las partidas seleccionadas con el reajuste aplicado.</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. FORMULARIO INTERACTIVO DE TRASPASOS Y MODIFICACIONES                   */}
          {/* ========================================================================= */}
          {config.type === 'traspaso_form' && (
            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <div className="grid grid-cols-2 gap-2 p-1 bg-theme-base rounded-2xl border border-theme-border">
                  <button
                    type="button"
                    onClick={() => setTipoTraspaso('intra')}
                    className={`py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      tipoTraspaso === 'intra'
                        ? 'bg-theme-surface text-theme-main shadow-xs border border-theme-border'
                        : 'text-theme-muted hover:text-theme-main'
                    }`}
                  >
                    Misma Gerencia (Intra)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoTraspaso('inter')}
                    className={`py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      tipoTraspaso === 'inter'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-theme-muted hover:text-theme-main'
                    }`}
                  >
                    Inter-Gerencias (Requiere Aceptación)
                  </button>
                </div>
                <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1.5 px-2.5 py-1 bg-blue-50/70 dark:bg-blue-950/30 rounded-xl border border-blue-200/50">
                  <Info size={12} className="text-blue-500 shrink-0" />
                  <span><strong>Aquí eliges:</strong> Si mueves presupuesto entre tus propias partidas (Intra) o si solicitas crédito a otra área (Inter).</span>
                </div>
              </div>

              {tipoTraspaso === 'inter' ? (
                <div className="p-3 bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-start gap-2.5">
                  <AlertCircle size={16} className="shrink-0 text-amber-500 mt-0.5" />
                  <span>
                    <strong>Condición Inter-Gerencias:</strong> La otra gerencia (donante) recibirá una notificación institucional en su sistema y debe presionar <em>"Aceptar Traspaso"</em> para que la solicitud avance a Presupuestos.
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-800 dark:text-blue-300 text-xs font-semibold flex items-start gap-2.5">
                  <Info size={16} className="shrink-0 text-blue-500 mt-0.5" />
                  <span>
                    <strong>Traspaso Interno:</strong> Como ocurre dentro de tu misma gerencia, no altera el techo presupuestario asignado. Pasa directo a verificación técnica de Presupuestos.
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-rose-500/5 border border-rose-500/20 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-rose-600 block">
                    PARTIDA CEDENTE (DONANTE DE FONDOS)
                  </span>
                  <select
                    value={partidaOrigen}
                    onChange={(e) => setPartidaOrigen(e.target.value)}
                    className="input-theme text-xs font-bold w-full"
                  >
                    <option value="39500">
                      {tipoTraspaso === 'inter'
                        ? 'Gerencia Infraestructura: 39500 (Saldo: 28,400 Bs)'
                        : 'Partida 39500 — Útiles de Escritorio (Saldo: 28,400 Bs)'}
                    </option>
                    <option value="34110">Partida 34110 — Combustibles (Saldo: 35,000 Bs)</option>
                    <option value="31110">Partida 31110 — Alimentos (Saldo: 18,200 Bs)</option>
                  </select>
                  <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 pt-0.5">
                    <Info size={11} className="text-blue-500 shrink-0" />
                    <span><strong>Aquí ingresas:</strong> De qué partida se restarán los recursos disponibles.</span>
                  </div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 font-mono">
                    <Eye size={11} className="shrink-0" />
                    <span><strong>Aquí puedes ver:</strong> Saldo inicial disponible: <strong>28,400.00 Bs</strong>.</span>
                  </div>
                </div>

                <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-emerald-600 block">
                    PARTIDA RECEPTORA (DESTINO DE FONDOS)
                  </span>
                  <select
                    value={partidaDestino}
                    onChange={(e) => setPartidaDestino(e.target.value)}
                    className="input-theme text-xs font-bold w-full"
                  >
                    <option value="25600">Partida 25600 — Servicios Técnicos Especializados</option>
                    <option value="24130">Partida 24130 — Mantenimiento de Edificios</option>
                    <option value="22110">Partida 22110 — Pasajes y Viáticos</option>
                  </select>
                  <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 pt-0.5">
                    <Info size={11} className="text-blue-500 shrink-0" />
                    <span><strong>Aquí ingresas:</strong> La partida que requiere ser reforzada con presupuesto.</span>
                  </div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 font-mono">
                    <Eye size={11} className="shrink-0" />
                    <span><strong>Aquí puedes ver:</strong> Saldo actual antes del traspaso: <strong>2,100.00 Bs</strong>.</span>
                  </div>
                </div>
              </div>

              {/* Importe y Saldo Dinámico */}
              <div className="p-3.5 bg-theme-base rounded-2xl border border-theme-border space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-theme-muted uppercase">
                    IMPORTE A TRASPASAR (BOB)
                  </label>
                  <div className="flex items-center gap-1">
                    {['1000', '5000', '10000'].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMontoTraspaso(m + '.00')}
                        className="px-2 py-0.5 rounded-lg bg-theme-surface hover:bg-theme-border text-[10px] font-mono font-bold text-theme-main transition-colors border border-theme-border cursor-pointer"
                      >
                        +{m}
                      </button>
                    ))}
                  </div>
                </div>

                <input
                  type="text"
                  value={montoTraspaso}
                  onChange={(e) => setMontoTraspaso(e.target.value)}
                  placeholder="5000.00"
                  className="input-theme text-sm font-mono font-extrabold w-full"
                />

                <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 bg-blue-50/60 dark:bg-blue-950/30 px-2 py-0.5 rounded-lg border border-blue-200/50">
                  <Info size={11} className="text-blue-500 shrink-0" />
                  <span><strong>Aquí ingresas:</strong> La cantidad exacta a traspasar (o usa los botones rápidos).</span>
                </div>

                {/* Simulador dinámico de impacto en saldos */}
                <div className="p-2.5 rounded-xl bg-theme-surface border border-theme-border/60 text-[11px] font-mono space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-theme-muted">Nuevo saldo cedente:</span>
                    <span className={`font-bold ${hayExcesoSaldo ? 'text-rose-600' : 'text-theme-main'}`}>
                      {nuevoSaldoCedente.toLocaleString('es-BO', { minimumFractionDigits: 2 })} Bs
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-theme-muted">Nuevo saldo receptora:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {nuevoSaldoReceptor.toLocaleString('es-BO', { minimumFractionDigits: 2 })} Bs
                    </span>
                  </div>
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-1 pt-1 border-t border-theme-border/40 font-sans">
                    <Eye size={11} className="shrink-0 text-emerald-500" />
                    <span><strong>Aquí puedes ver:</strong> La deducción automática y acreditación antes de confirmar.</span>
                  </div>
                </div>

                {hayExcesoSaldo && (
                  <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-1.5">
                    <AlertCircle size={14} />
                    <span>El importe solicitado excede los 28,400.00 Bs disponibles en la partida cedente.</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold text-theme-muted uppercase block mb-1">
                  JUSTIFICACIÓN DEL TRASPASO
                </label>
                <textarea
                  rows={2}
                  value={justificacionTraspaso}
                  onChange={(e) => setJustificacionTraspaso(e.target.value)}
                  placeholder="Describe la causa técnica del ajuste..."
                  className="input-theme text-xs w-full"
                />
                <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 mt-1 bg-blue-50/60 dark:bg-blue-950/30 px-2 py-0.5 rounded-lg border border-blue-200/50">
                  <Info size={11} className="text-blue-500 shrink-0" />
                  <span><strong>Aquí ingresas:</strong> La justificación del porqué se requiere compensar esta partida.</span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. FORMULARIO INTERACTIVO DE CERTIFICACIÓN POA                             */}
          {/* ========================================================================= */}
          {config.type === 'certificacion_form' && (
            <div className="space-y-4 text-xs">
              <div
                className={`p-3.5 rounded-2xl border flex items-center justify-between transition-colors ${
                  requiereCertificacion
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
                }`}
              >
                <div>
                  <span className="text-[10px] font-extrabold uppercase block">
                    CRITERIO DE CERTIFICACIÓN POA
                  </span>
                  <p className="font-semibold text-xs mt-0.5">
                    {requiereCertificacion
                      ? '✓ Gasto > 2,000.00 Bs o Proceso PAC: Certificación Preventiva Obligatoria'
                      : 'ℹ Gasto Menor (≤ 2,000.00 Bs y No PAC): Exento de certificación obligatoria'}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase ${
                    requiereCertificacion ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                  }`}
                >
                  {requiereCertificacion ? 'Obligatoria' : 'Gasto Menor'}
                </span>
              </div>
              <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/50">
                <Eye size={12} className="text-emerald-500 shrink-0" />
                <span><strong>Aquí puedes ver:</strong> El clasificador del sistema que detecta automáticamente si el monto requiere certificación según normativa.</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-theme-muted uppercase block mb-1">
                    CITE / HOJA DE RUTA FORMAL
                  </label>
                  <input
                    type="text"
                    value={citeDoc}
                    onChange={(e) => setCiteDoc(e.target.value)}
                    placeholder="Ej. CITE-GG-2026-0089"
                    className="input-theme text-xs font-bold w-full"
                  />
                  <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 mt-1 bg-blue-50/60 dark:bg-blue-950/30 px-2 py-0.5 rounded-lg border border-blue-200/50">
                    <Info size={11} className="text-blue-500 shrink-0" />
                    <span><strong>Aquí ingresas:</strong> El código oficial del trámite (Nota Interna o CITE).</span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-theme-muted uppercase block mb-1">
                    IMPORTE PREVENTIVO REQUERIDO (BOB)
                  </label>
                  <input
                    type="text"
                    value={montoCertificacion}
                    onChange={(e) => setMontoCertificacion(e.target.value)}
                    placeholder="4800.00"
                    className="input-theme text-xs font-mono font-bold w-full"
                  />
                  <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 mt-1 bg-blue-50/60 dark:bg-blue-950/30 px-2 py-0.5 rounded-lg border border-blue-200/50">
                    <Info size={11} className="text-blue-500 shrink-0" />
                    <span><strong>Aquí ingresas:</strong> El presupuesto requerido para comprometer preventivamente.</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-theme-muted uppercase block mb-1">
                  OBJETO DE CONTRATACIÓN O GASTO
                </label>
                <input
                  type="text"
                  value={objetoGasto}
                  onChange={(e) => setObjetoGasto(e.target.value)}
                  placeholder="Detalle del gasto o contratación a certificar..."
                  className="input-theme text-xs font-semibold w-full"
                />
                <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 mt-1 bg-blue-50/60 dark:bg-blue-950/30 px-2 py-0.5 rounded-lg border border-blue-200/50">
                  <Info size={11} className="text-blue-500 shrink-0" />
                  <span><strong>Aquí ingresas:</strong> La descripción detallada del bien o servicio que se contratará.</span>
                </div>
              </div>

              {/* Toggle de PAC */}
              <div className="space-y-1">
                <div className="p-3 bg-theme-base rounded-2xl border border-theme-border flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-theme-main block">
                      ¿Pertenece al Programa Anual de Contrataciones (PAC)?
                    </span>
                    <span className="text-[10px] text-theme-muted">
                      Todo ítem de compra o contratación mayor debe certificarse antes de iniciar convocatoria.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={esPac}
                      onChange={(e) => setEsPac(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
                <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 px-2.5 py-1 bg-blue-50/70 dark:bg-blue-950/30 rounded-xl border border-blue-200/50">
                  <Info size={11} className="text-blue-500 shrink-0" />
                  <span><strong>Aquí ingresas:</strong> La condición si es contratación formal que debe publicarse en el SICOES.</span>
                </div>
              </div>

              {/* Memoria de Cálculo Asociada y Saldo Restante */}
              <div className="p-3.5 bg-theme-base rounded-2xl border border-theme-border space-y-2">
                <span className="text-[10px] font-bold text-theme-muted uppercase block">
                  MEMORIA DE CÁLCULO ASOCIADA
                </span>
                <select
                  value={memoriaSeleccionada}
                  onChange={(e) => setMemoriaSeleccionada(e.target.value)}
                  className="input-theme text-xs font-bold w-full"
                >
                  <option value="MC-2026-0045">MC-2026-0045 — Partida 24130 (Mantenimiento de Redes)</option>
                  <option value="MC-2026-0012">MC-2026-0012 — Partida 34110 (Combustibles y Lubricantes)</option>
                  <option value="MC-2026-0033">MC-2026-0033 — Partida 39500 (Útiles de Oficina)</option>
                </select>

                <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
                  <Info size={11} className="text-blue-500 shrink-0" />
                  <span><strong>Aquí ingresas:</strong> La memoria aprobada con cargo a la cual se pagará el compromiso.</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-theme-surface border border-theme-border font-mono text-[11px]">
                  <span className="text-theme-muted">Saldo Disponible en Memoria:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {nuevoSaldoMC.toLocaleString('es-BO', { minimumFractionDigits: 2 })} Bs
                  </span>
                </div>
                <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-1">
                  <Eye size={11} className="shrink-0 text-emerald-500" />
                  <span><strong>Aquí puedes ver:</strong> El saldo libre remanente que le queda a la memoria tras esta reserva.</span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 4. MODAL INTERACTIVO DE REVISIÓN PLANIFICACIÓN                            */}
          {/* ========================================================================= */}
          {config.type === 'planif_review' && (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
                <span className="text-[10px] font-bold text-indigo-600 uppercase block mb-1">
                  DIRECCIÓN DE PLANIFICACIÓN (SPO)
                </span>
                <p className="font-bold text-theme-main">
                  Evaluación técnica de concordancia con las operaciones del PEI institucional y cronograma operativo.
                </p>
              </div>

              <div className="p-3.5 bg-theme-base rounded-2xl border border-theme-border space-y-2.5">
                <span className="text-[10px] font-extrabold uppercase text-theme-muted block">
                  Lista de Verificación Técnica (Checklist)
                </span>
                <label className="flex items-center gap-2.5 cursor-pointer p-1.5 rounded-lg hover:bg-theme-surface transition-colors">
                  <input
                    type="checkbox"
                    checked={checkPei}
                    onChange={(e) => setCheckPei(e.target.checked)}
                    className="rounded text-indigo-600 cursor-pointer"
                  />
                  <span className="font-semibold text-theme-main">
                    Concordancia plena con los Objetivos Estratégicos del PEI
                  </span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer p-1.5 rounded-lg hover:bg-theme-surface transition-colors">
                  <input
                    type="checkbox"
                    checked={checkOperacion}
                    onChange={(e) => setCheckOperacion(e.target.checked)}
                    className="rounded text-indigo-600 cursor-pointer"
                  />
                  <span className="font-semibold text-theme-main">
                    Operación POA declarada corresponde a las competencias del área
                  </span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer p-1.5 rounded-lg hover:bg-theme-surface transition-colors">
                  <input
                    type="checkbox"
                    checked={checkCronograma}
                    onChange={(e) => setCheckCronograma(e.target.checked)}
                    className="rounded text-indigo-600 cursor-pointer"
                  />
                  <span className="font-semibold text-theme-main">
                    Cronograma trimestral técnicamente justificado
                  </span>
                </label>

                <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 pt-1 border-t border-theme-border/60">
                  <Info size={11} className="text-blue-500 shrink-0" />
                  <span><strong>Aquí ingresas:</strong> La validación de los 3 filtros técnicos de pertinencia estratégica.</span>
                </div>
              </div>

              {/* Dictamen */}
              <div>
                <label className="text-[10px] font-bold text-theme-muted uppercase block mb-1">
                  Dictamen de Planificación
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDictamenPlanif('favorable')}
                    className={`p-2.5 rounded-xl border text-left font-bold text-xs transition-all cursor-pointer ${
                      dictamenPlanif === 'favorable'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                        : 'border-theme-border text-theme-muted'
                    }`}
                  >
                    ✓ Favorable (Pasa a Presupuestos)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDictamenPlanif('observado')}
                    className={`p-2.5 rounded-xl border text-left font-bold text-xs transition-all cursor-pointer ${
                      dictamenPlanif === 'observado'
                        ? 'bg-rose-500/10 border-rose-500 text-rose-700 dark:text-rose-300'
                        : 'border-theme-border text-theme-muted'
                    }`}
                  >
                    ⚠ Observado (Devolver a Gerencia)
                  </button>
                </div>
                <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 mt-1 bg-blue-50/60 dark:bg-blue-950/30 px-2 py-0.5 rounded-lg border border-blue-200/50">
                  <Info size={11} className="text-blue-500 shrink-0" />
                  <span><strong>Aquí ingresas:</strong> El fallo institucional que define si avanza a Presupuestos o si se devuelve al área.</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-theme-muted uppercase block mb-1">
                  Observaciones Técnicas de Planificación
                </label>
                <textarea
                  rows={2}
                  value={obsPlanif}
                  onChange={(e) => setObsPlanif(e.target.value)}
                  className="input-theme text-xs w-full"
                />
                <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 mt-1 bg-blue-50/60 dark:bg-blue-950/30 px-2 py-0.5 rounded-lg border border-blue-200/50">
                  <Info size={11} className="text-blue-500 shrink-0" />
                  <span><strong>Aquí ingresas:</strong> El sustento o condiciones técnicas de la revisión de planificación.</span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 5. MODAL INTERACTIVO DE REVISIÓN Y APROBACIÓN DE PRESUPUESTOS              */}
          {/* ========================================================================= */}
          {config.type === 'presup_review' && (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                <span className="text-[10px] font-bold text-emerald-600 uppercase block mb-1">
                  DIRECCIÓN DE PRESUPUESTOS
                </span>
                <p className="font-bold text-theme-main">
                  Verificación de disponibilidad presupuestaria, techo dictado e incorporación formal al crédito oficial del POA.
                </p>
              </div>

              <div className="p-4 bg-theme-base rounded-2xl border border-theme-border space-y-2.5">
                <span className="text-[10px] font-extrabold uppercase text-theme-muted block">
                  Calculadora de Techos y Crédito
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-theme-muted uppercase block mb-1">
                      Techo Financiero del Área
                    </label>
                    <div className="font-mono text-xs font-bold text-theme-main p-2 bg-theme-surface rounded-xl border border-theme-border">
                      150,000.00 Bs
                    </div>
                    <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-1 mt-1">
                      <Eye size={11} className="shrink-0 text-emerald-500" />
                      <span><strong>Aquí puedes ver:</strong> El techo máximo dictado por Presupuestos para el área.</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-theme-muted uppercase block mb-1">
                      Monto a Comprometer (BOB)
                    </label>
                    <input
                      type="text"
                      value={montoComprometerPresup}
                      onChange={(e) => setMontoComprometerPresup(e.target.value)}
                      className="input-theme text-xs font-mono font-bold w-full"
                    />
                    <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 mt-1">
                      <Info size={11} className="text-blue-500 shrink-0" />
                      <span><strong>Aquí ingresas:</strong> El crédito presupuestario a comprometer.</span>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 bg-theme-surface rounded-xl border border-theme-border font-mono text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-theme-muted">Saldo Disponible Restante:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {(
                        150000 - (parseFloat(montoComprometerPresup.replace(/[^0-9.]/g, '')) || 0)
                      ).toLocaleString('es-BO', { minimumFractionDigits: 2 })}{' '}
                      BOB
                    </span>
                  </div>
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-sans font-medium flex items-center gap-1 pt-1 border-t border-theme-border/40">
                    <Eye size={11} className="shrink-0 text-emerald-500" />
                    <span><strong>Aquí puedes ver:</strong> El crédito libre que conservará el área tras esta aprobación.</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-theme-muted uppercase block mb-1">
                  Decisión Presupuestaria
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDictamenPresup('aprobar')}
                    className={`p-2.5 rounded-xl border text-left font-bold text-xs transition-all cursor-pointer ${
                      dictamenPresup === 'aprobar'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                        : 'border-theme-border text-theme-muted'
                    }`}
                  >
                    ✓ Aprobar e Incorporar al POA Oficial
                  </button>
                  <button
                    type="button"
                    onClick={() => setDictamenPresup('recorte')}
                    className={`p-2.5 rounded-xl border text-left font-bold text-xs transition-all cursor-pointer ${
                      dictamenPresup === 'recorte'
                        ? 'bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-300'
                        : 'border-theme-border text-theme-muted'
                    }`}
                  >
                    📢 Notificar Adecuación de Techo
                  </button>
                </div>
                <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 mt-1 bg-blue-50/60 dark:bg-blue-950/30 px-2 py-0.5 rounded-lg border border-blue-200/50">
                  <Info size={11} className="text-blue-500 shrink-0" />
                  <span><strong>Aquí ingresas:</strong> La decisión de incorporación definitiva o solicitud de ajuste de techo.</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-theme-muted uppercase block mb-1">
                  Observaciones Presupuestarias
                </label>
                <textarea
                  rows={2}
                  value={obsPresup}
                  onChange={(e) => setObsPresup(e.target.value)}
                  className="input-theme text-xs w-full"
                />
                <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 mt-1 bg-blue-50/60 dark:bg-blue-950/30 px-2 py-0.5 rounded-lg border border-blue-200/50">
                  <Info size={11} className="text-blue-500 shrink-0" />
                  <span><strong>Aquí ingresas:</strong> La glosa técnica o asignación de código presupuestario institucional.</span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 6. MODAL INTERACTIVO DE LIQUIDACIÓN Y PAGO (LIC. ZAIDA - TESORERÍA)       */}
          {/* ========================================================================= */}
          {config.type === 'tesoreria_pago' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-violet-500/10 border-2 border-violet-500/30 rounded-2xl text-violet-800 dark:text-violet-300 font-semibold flex items-start gap-3">
                <Coins size={20} className="shrink-0 text-violet-500 mt-0.5" />
                <div>
                  <span className="text-[10px] font-extrabold uppercase block text-violet-600 dark:text-violet-400">
                    DIRECCIÓN DE TESORERÍA — LIC. ZAIDA
                  </span>
                  <span className="leading-relaxed block mt-0.5">
                    El preventivo ya estaba aprobado formalmente, pero el dinero físico aún no había salido de cuentas. La Lic. Zaida es quien dicta formalmente <strong>"Ya salió el dinero"</strong> al cancelar la factura y reduce físicamente el saldo en el sistema.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-theme-muted uppercase block mb-1">
                    N° Factura Comercial
                  </label>
                  <input
                    type="text"
                    value={numFactura}
                    onChange={(e) => setNumFactura(e.target.value)}
                    placeholder="FACT-84920"
                    className="input-theme text-xs font-bold w-full"
                  />
                  <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 mt-1 bg-blue-50/60 dark:bg-blue-950/30 px-2 py-0.5 rounded-lg border border-blue-200/50">
                    <Info size={11} className="text-blue-500 shrink-0" />
                    <span><strong>Aquí ingresas:</strong> El número oficial de la factura emitida por el proveedor.</span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-theme-muted uppercase block mb-1">
                    Proveedor / Beneficiario
                  </label>
                  <input
                    type="text"
                    value={proveedor}
                    onChange={(e) => setProveedor(e.target.value)}
                    placeholder="ENTEL S.A."
                    className="input-theme text-xs font-bold w-full"
                  />
                  <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 mt-1 bg-blue-50/60 dark:bg-blue-950/30 px-2 py-0.5 rounded-lg border border-blue-200/50">
                    <Info size={11} className="text-blue-500 shrink-0" />
                    <span><strong>Aquí ingresas:</strong> La empresa contratista a cuyo favor se gira el pago.</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-theme-muted uppercase block mb-1">
                    N° Comprobante Bancario / SIGEP
                  </label>
                  <input
                    type="text"
                    value={numComprobante}
                    onChange={(e) => setNumComprobante(e.target.value)}
                    placeholder="TR-BANCO-UNION-4920"
                    className="input-theme text-xs font-mono font-bold w-full"
                  />
                  <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 mt-1 bg-blue-50/60 dark:bg-blue-950/30 px-2 py-0.5 rounded-lg border border-blue-200/50">
                    <Info size={11} className="text-blue-500 shrink-0" />
                    <span><strong>Aquí ingresas:</strong> El correlativo de la transferencia bancaria o cheque fiscal.</span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-theme-muted uppercase block mb-1">
                    Importe Desembolsado (BOB)
                  </label>
                  <input
                    type="text"
                    value={montoPago}
                    onChange={(e) => setMontoPago(e.target.value)}
                    placeholder="4800.00"
                    className="input-theme text-xs font-mono font-bold w-full"
                  />
                  <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 mt-1 bg-blue-50/60 dark:bg-blue-950/30 px-2 py-0.5 rounded-lg border border-blue-200/50">
                    <Info size={11} className="text-blue-500 shrink-0" />
                    <span><strong>Aquí ingresas:</strong> El monto en dinero efectivo liquidado en la operación.</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-theme-muted uppercase block mb-1">
                  Cuenta Fiscal de Desembolso
                </label>
                <select
                  value={cuentaBancaria}
                  onChange={(e) => setCuentaBancaria(e.target.value)}
                  className="input-theme text-xs font-bold w-full"
                >
                  <option value="union-principal">Banco Unión — Cta Fiscal Única N° 10000049281</option>
                  <option value="bcb-recursos">Banco Central de Bolivia — Cta Recursos Propios N° 00291</option>
                </select>
                <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 mt-1 bg-blue-50/60 dark:bg-blue-950/30 px-2 py-0.5 rounded-lg border border-blue-200/50">
                  <Info size={11} className="text-blue-500 shrink-0" />
                  <span><strong>Aquí ingresas:</strong> La cuenta corriente fiscal del Tesoro de donde se debitaron los fondos.</span>
                </div>
              </div>

              {/* Confirmación obligatoria de la Lic. Zaida */}
              <div className="p-3.5 bg-violet-500/10 border border-violet-500/30 rounded-2xl space-y-1">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmarSalidaDinero}
                    onChange={(e) => setConfirmarSalidaDinero(e.target.checked)}
                    className="rounded text-violet-600 cursor-pointer"
                  />
                  <span className="font-extrabold text-xs text-violet-900 dark:text-violet-200">
                    Confirmo la salida física de fondos de cuentas fiscales ("Ya salió el dinero")
                  </span>
                </label>
                <div className="text-[10px] text-violet-700 dark:text-violet-300 font-medium flex items-center gap-1 pt-1">
                  <Eye size={11} className="text-violet-500 shrink-0" />
                  <span><strong>Aquí puedes ver:</strong> El paso clave de Tesorería donde se reduce físicamente el saldo en el sistema.</span>
                </div>
              </div>
            </div>
          )}

          {/* Notificación de Éxito al Completar */}
          {success && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 size={18} />
              <span>{config.onSuccessMessage}</span>
            </div>
          )}
        </div>

        {/* ── FOOTER DEL MODAL ── */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-theme-border bg-theme-base/60 backdrop-blur">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs font-semibold cursor-pointer"
          >
            Cancelar
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleAction}
            disabled={loading || success}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer px-4 py-2"
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <RefreshCw size={14} className="animate-spin" /> Registrando...
              </span>
            ) : (
              <>
                <Send size={14} />
                <span>
                  {modoMemoria === 'duplicar' && config.type === 'memoria_form'
                    ? isGerente
                      ? 'Duplicar y Aprobar para Gestión 2026'
                      : 'Duplicar en Borrador'
                    : config.actionButtonLabel}
                </span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
};
