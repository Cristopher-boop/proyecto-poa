import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building2,
  Printer,
  Coins,
  Send,
  Layers,
  ShieldCheck,
  ArrowRight,
  RotateCcw,
  BookOpen,
  DollarSign,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';
import { ModuloGuiaId, SandboxScenario, SandboxStep } from '../../types/guia.types';
import { ESCENARIOS_SANDBOX } from '../../data/flujosData';
import { SpotlightOverlay } from './SpotlightOverlay';
import { Button } from '../../../../components/commons';

interface InteractiveSandboxProps {
  moduloId: ModuloGuiaId;
  initialStepIndex?: number;
  onExit: () => void;
}

export const InteractiveSandbox: React.FC<InteractiveSandboxProps> = ({
  moduloId,
  initialStepIndex = 1,
  onExit,
}) => {
  const scenario: SandboxScenario = ESCENARIOS_SANDBOX[moduloId];
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(initialStepIndex);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  // Estados interactivos simulados - Memorias
  const [modalMemoriaOpen, setModalMemoriaOpen] = useState(false);
  const [memoriaPartidaSeleccionada, setMemoriaPartidaSeleccionada] = useState(false);
  const [memoriaGerenteAprobada, setMemoriaGerenteAprobada] = useState(false);
  const [memoriaPlanifAprobada, setMemoriaPlanifAprobada] = useState(false);
  const [memoriaPoaAprobada, setMemoriaPoaAprobada] = useState(false);

  // Modificaciones simuladas
  const [modalModOpen, setModalModOpen] = useState(false);
  const [tipoTraspaso, setTipoTraspaso] = useState<'intra' | 'inter'>('intra');
  const [cedenteAceptado, setCedenteAceptado] = useState(false);
  const [modPresupuestosAprobado, setModPresupuestosAprobado] = useState(false);

  // Certificaciones simuladas (> 2,000 Bs o Contratación)
  const [modalCertOpen, setModalCertOpen] = useState(false);
  const [certPlanifOk, setCertPlanifOk] = useState(false);
  const [certPresupOk, setCertPresupOk] = useState(false);
  const [zaidaDineroSalio, setZaidaDineroSalio] = useState(false);

  // Ejecución simulada
  const [modalGastoOpen, setModalGastoOpen] = useState(false);
  const [facturaCargada, setFacturaCargada] = useState(false);
  const [pagoEfectuadoZaida, setPagoEfectuadoZaida] = useState(false);

  const currentStep: SandboxStep =
    scenario.steps.find((s) => s.stepIndex === currentStepIndex) || scenario.steps[0];

  // Actualizar coordenadas del elemento objetivo para el foco spotlight y scrollear
  const updateTargetRect = () => {
    if (!currentStep) return;
    const el = document.getElementById(currentStep.targetId);
    if (el) {
      // Auto-scrollear suavemente al elemento objetivo
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      setTargetRect(null);
    }
  };

  useEffect(() => {
    updateTargetRect();
    const t1 = setTimeout(updateTargetRect, 80);
    const t2 = setTimeout(updateTargetRect, 250);
    window.addEventListener('resize', updateTargetRect);
    window.addEventListener('scroll', updateTargetRect, true);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', updateTargetRect);
      window.removeEventListener('scroll', updateTargetRect, true);
    };
  }, [
    currentStepIndex,
    moduloId,
    modalMemoriaOpen,
    memoriaPartidaSeleccionada,
    memoriaGerenteAprobada,
    memoriaPlanifAprobada,
    modalModOpen,
    tipoTraspaso,
    cedenteAceptado,
    modalCertOpen,
    certPlanifOk,
    certPresupOk,
    zaidaDineroSalio,
    modalGastoOpen,
    facturaCargada,
    pagoEfectuadoZaida,
  ]);

  const handleNextStep = () => {
    if (currentStepIndex < scenario.steps.length) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 1) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const resetSimulation = () => {
    setCurrentStepIndex(1);
    setIsCompleted(false);
    setModalMemoriaOpen(false);
    setMemoriaPartidaSeleccionada(false);
    setMemoriaGerenteAprobada(false);
    setMemoriaPlanifAprobada(false);
    setMemoriaPoaAprobada(false);

    setModalModOpen(false);
    setTipoTraspaso('intra');
    setCedenteAceptado(false);
    setModPresupuestosAprobado(false);

    setModalCertOpen(false);
    setCertPlanifOk(false);
    setCertPresupOk(false);
    setZaidaDineroSalio(false);

    setModalGastoOpen(false);
    setFacturaCargada(false);
    setPagoEfectuadoZaida(false);
  };

  return (
    <div className="relative min-h-[580px] bg-theme-base rounded-2xl border border-theme-border overflow-hidden p-4 sm:p-6 select-none flex flex-col justify-between">
      {/* ── BANNER DEL ESCENARIO DE PRUEBA ──────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-theme-surface rounded-xl border border-theme-border shadow-xs mb-5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full bg-amber-500/10">
                MODO SIMULADOR INTERACTIVO
              </span>
              <span className="text-xs text-theme-muted font-bold truncate max-w-sm sm:max-w-none">
                — {scenario.titulo}
              </span>
            </div>
            <p className="text-xs text-theme-muted mt-0.5">{scenario.resumen}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={resetSimulation}
            className="flex items-center gap-1 text-xs"
          >
            <RotateCcw size={13} /> Reiniciar
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onExit}
            className="text-xs"
          >
            Salir del Simulador
          </Button>
        </div>
      </div>

      {/* ── ÁREA DE TRABAJO SIMULADA SEGÚN EL MÓDULO ────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center overflow-y-auto py-2">
        {/* ========================================================================= */}
        {/* 1. SIMULADOR DE MEMORIAS DE CÁLCULO (TECHOS NUEVOS A POA OFICIAL)          */}
        {/* ========================================================================= */}
        {moduloId === 'memorias' && (
          <div className="space-y-4 max-w-4xl mx-auto w-full">
            {/* Banner: Presupuestos dicta techos nuevos */}
            <div className="p-4 bg-blue-500/10 border-2 border-blue-500/30 rounded-2xl flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-500 text-white uppercase">
                  Paso 1: Presupuestos dicta techos
                </span>
                <h4 className="text-sm font-bold text-theme-main mt-1">
                  Techo Presupuestario Oficial Asignado: 150,000.00 Bs
                </h4>
                <p className="text-xs text-theme-muted">
                  Presupuestos ha fijado el límite financiero para la Gerencia de Operaciones.
                </p>
              </div>

              {/* OBJETIVO 1: NUEVA MEMORIA */}
              <button
                id="btn-nueva-memoria"
                type="button"
                onClick={() => {
                  setModalMemoriaOpen(true);
                  if (currentStepIndex === 1) handleNextStep();
                }}
                className="btn-primary flex items-center gap-2 px-4 py-2 text-xs font-bold shadow-md cursor-pointer shrink-0"
              >
                + Nueva Memoria (Borrador)
              </button>
            </div>

            {/* Modal Simulado de Memoria */}
            {modalMemoriaOpen && (
              <div className="p-5 bg-theme-surface rounded-2xl border-2 border-theme-primary/30 shadow-2xl space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-theme-border pb-2.5">
                  <h4 className="text-sm font-bold text-theme-main flex items-center gap-2">
                    <BookOpen size={16} className="text-theme-primary" /> Borrador de Memoria de Cálculo (Nuevo o Base Anterior)
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600">
                    Paso 2: Elaborador
                  </span>
                </div>

                {/* OBJETIVO 2: SELECT PARTIDA / OPERACION */}
                <div
                  id="select-partida-operacion"
                  onClick={() => {
                    setMemoriaPartidaSeleccionada(true);
                    if (currentStepIndex === 2) handleNextStep();
                  }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-colors ${
                    memoriaPartidaSeleccionada
                      ? 'border-emerald-500 bg-emerald-50/20 text-theme-main'
                      : 'border-theme-border bg-theme-base/60 hover:border-theme-primary'
                  }`}
                >
                  <label className="text-[10px] font-bold text-theme-muted block mb-1">
                    SELECCIÓN DE PARTIDA Y VINCULACIÓN A OPERACIÓN POA
                  </label>
                  <div className="text-xs font-bold">
                    {memoriaPartidaSeleccionada
                      ? 'Partida 34110 (Combustibles) — Vinculada a OP-03: Mantenimiento Operativo Flota'
                      : '👉 Clic para seleccionar partida 34110 y Operación POA...'}
                  </div>
                </div>

                {/* OBJETIVO 3: APROBACIÓN GERENTE */}
                {memoriaPartidaSeleccionada && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                        Paso 3: Gerente de Área
                      </span>
                      <p className="text-xs font-bold text-theme-main">
                        Aprobación de pertinencia de la memoria de su gerencia
                      </p>
                    </div>

                    <button
                      id="btn-aprobar-gerente-mc"
                      type="button"
                      onClick={() => {
                        setMemoriaGerenteAprobada(true);
                        if (currentStepIndex === 3) handleNextStep();
                      }}
                      className={`btn-primary px-4 py-2 text-xs font-bold cursor-pointer ${
                        memoriaGerenteAprobada ? 'bg-emerald-600' : 'bg-amber-600 hover:bg-amber-700'
                      }`}
                    >
                      {memoriaGerenteAprobada ? '✓ Aprobado por Gerente' : 'Aprobar Borrador (Gerente de Área)'}
                    </button>
                  </div>
                )}

                {/* OBJETIVO 4: REVISIÓN PLANIFICACIÓN */}
                {memoriaGerenteAprobada && (
                  <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                        Paso 4: Dirección de Planificación
                      </span>
                      <p className="text-xs font-bold text-theme-main">
                        Revisión de operaciones que manejan y coherencia
                      </p>
                    </div>

                    <button
                      id="btn-planif-check-mc"
                      type="button"
                      onClick={() => {
                        setMemoriaPlanifAprobada(true);
                        if (currentStepIndex === 4) handleNextStep();
                      }}
                      className={`btn-primary px-4 py-2 text-xs font-bold cursor-pointer ${
                        memoriaPlanifAprobada ? 'bg-emerald-600' : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {memoriaPlanifAprobada ? '✓ Operaciones Conformes' : 'Verificar Operaciones (Planificación)'}
                    </button>
                  </div>
                )}

                {/* OBJETIVO 5: PRESUPUESTOS APRUEBA AL POA OFICIAL */}
                {memoriaPlanifAprobada && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        Paso 5: Dirección de Presupuestos
                      </span>
                      <p className="text-xs font-bold text-theme-main">
                        Aprobación final de cada MC para pasar al POA oficial
                      </p>
                    </div>

                    <button
                      id="btn-presup-aprobar-mc"
                      type="button"
                      onClick={() => {
                        setMemoriaPoaAprobada(true);
                        if (currentStepIndex === 5) handleNextStep();
                      }}
                      className="btn-primary px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md cursor-pointer"
                    >
                      {memoriaPoaAprobada ? '✓ Incorporado al POA' : 'Aprobar para el POA Oficial (Presupuestos)'}
                    </button>
                  </div>
                )}

                {memoriaPoaAprobada && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 size={16} /> ¡Memoria consolidada en el POA! En caso de reducción de techo global, Presupuestos notificará para rebajar sin rechazar MCs.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. SIMULADOR DE MODIFICACIONES (MISMA GERENCIA VS OTRA GERENCIA ACEPTA)    */}
        {/* ========================================================================= */}
        {moduloId === 'modificaciones' && (
          <div className="space-y-4 max-w-4xl mx-auto w-full">
            <div className="flex items-center justify-between p-4 bg-theme-surface rounded-2xl border border-theme-border shadow-xs">
              <div>
                <h3 className="text-base font-bold text-theme-main">
                  Modificaciones Presupuestarias
                </h3>
                <p className="text-xs text-theme-muted">
                  Intra-Gerencia (solicitud a Presupuestos) e Inter-Gerencias (la otra gerencia tiene que aceptar)
                </p>
              </div>

              {/* OBJETIVO 1 */}
              <button
                id="btn-nueva-modificacion"
                type="button"
                onClick={() => {
                  setModalModOpen(true);
                  if (currentStepIndex === 1) handleNextStep();
                }}
                className="btn-primary flex items-center gap-2 px-4 py-2 text-xs font-bold shadow-md cursor-pointer shrink-0"
              >
                + Nuevo Traspaso / Modificación
              </button>
            </div>

            {modalModOpen && (
              <div className="p-5 bg-theme-surface rounded-2xl border-2 border-theme-primary/30 shadow-2xl space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-theme-border pb-2.5">
                  <h4 className="text-sm font-bold text-theme-main flex items-center gap-2">
                    <Layers size={16} className="text-theme-primary" /> Configurar Modificación Presupuestaria
                  </h4>

                  {/* OBJETIVO 2: TAB INTER-GERENCIAS */}
                  <div className="flex items-center gap-1 p-1 bg-theme-base rounded-xl border border-theme-border">
                    <button
                      type="button"
                      onClick={() => setTipoTraspaso('intra')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold ${
                        tipoTraspaso === 'intra' ? 'bg-theme-surface shadow-xs text-theme-main' : 'text-theme-muted'
                      }`}
                    >
                      Misma Gerencia
                    </button>
                    <button
                      id="tab-traspaso-inter"
                      type="button"
                      onClick={() => {
                        setTipoTraspaso('inter');
                        if (currentStepIndex === 2) handleNextStep();
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                        tipoTraspaso === 'inter'
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'text-theme-muted hover:text-theme-main'
                      }`}
                    >
                      👉 Inter-Gerencias (Otra Gerencia)
                    </button>
                  </div>
                </div>

                <div className="p-3.5 bg-theme-base/60 rounded-xl border border-theme-border text-xs">
                  <span className="text-[10px] font-bold text-amber-600 uppercase block mb-1">
                    Petición de fondos formulada
                  </span>
                  <p className="font-bold text-theme-main">
                    Gerencia de Sistemas solicita 5,000.00 Bs a la Gerencia de Infraestructura para refuerzo de servidores.
                  </p>
                </div>

                {/* OBJETIVO 3: LA OTRA GERENCIA TIENE QUE ACEPTAR */}
                <div className="p-4 bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl flex items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500 text-white uppercase">
                      Paso 3: Regla Indispensable
                    </span>
                    <h5 className="text-xs font-bold text-theme-main mt-1">
                      LA OTRA GERENCIA TIENE QUE ACEPTAR PRIMERO
                    </h5>
                    <p className="text-[11px] text-theme-muted">
                      ¿La Gerencia de Infraestructura consiente disponer de sus partidas?
                    </p>
                  </div>

                  <button
                    id="btn-aceptar-cedente"
                    type="button"
                    onClick={() => {
                      setCedenteAceptado(true);
                      if (currentStepIndex === 3) handleNextStep();
                    }}
                    className={`btn-primary px-4 py-2 text-xs font-bold cursor-pointer shrink-0 ${
                      cedenteAceptado ? 'bg-emerald-600' : 'bg-amber-600 hover:bg-amber-700'
                    }`}
                  >
                    {cedenteAceptado ? '✓ La Otra Gerencia Aceptó' : 'Aceptar Cesión de Presupuesto'}
                  </button>
                </div>

                {/* OBJETIVO 4: RECIÉN VA A PRESUPUESTOS */}
                {cedenteAceptado && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        Paso 4: Presupuestos
                      </span>
                      <h5 className="text-xs font-bold text-theme-main mt-0.5">
                        Una vez que la otra gerencia acepta, recién va a Presupuestos
                      </h5>
                      <p className="text-[11px] text-theme-muted">
                        Presupuestos verifica que haya dinero y el por qué para aprobar.
                      </p>
                    </div>

                    <button
                      id="btn-aprobar-presupuestos"
                      type="button"
                      onClick={() => {
                        setModPresupuestosAprobado(true);
                        if (currentStepIndex === 4) handleNextStep();
                      }}
                      className="btn-primary px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md cursor-pointer shrink-0"
                    >
                      {modPresupuestosAprobado ? '✓ Traspaso Aprobado' : 'Verificar Dinero y Aprobar Traspaso'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. SIMULADOR CERTIFICACIONES (> 2,000 BS, PLANIF, PRESUP, LIC. ZAIDA)       */}
        {/* ========================================================================= */}
        {moduloId === 'certificaciones' && (
          <div className="space-y-4 max-w-4xl mx-auto w-full">
            <div className="flex items-center justify-between p-4 bg-theme-surface rounded-2xl border border-theme-border shadow-xs">
              <div>
                <h3 className="text-base font-bold text-theme-main">
                  Gastos, Certificaciones POA y Desembolsos
                </h3>
                <p className="text-xs text-theme-muted">
                  Umbral &gt; 2,000 Bs o contratación $\rightarrow$ Planif OK $\rightarrow$ Presup OK $\rightarrow$ Salida por Lic. Zaida
                </p>
              </div>

              {/* OBJETIVO 1 */}
              <button
                id="btn-nueva-certificacion"
                type="button"
                onClick={() => {
                  setModalCertOpen(true);
                  if (currentStepIndex === 1) handleNextStep();
                }}
                className="btn-primary flex items-center gap-2 px-4 py-2 text-xs font-bold shadow-md cursor-pointer shrink-0"
              >
                + Nueva Solicitud de Certificación
              </button>
            </div>

            {modalCertOpen && (
              <div className="p-5 bg-theme-surface rounded-2xl border-2 border-theme-primary/30 shadow-2xl space-y-3.5 animate-in fade-in duration-200">
                <div className="p-3 bg-theme-base/60 rounded-xl border border-theme-border text-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-blue-500 uppercase">Solicitud de Gasto Formulada</span>
                    <p className="font-bold text-theme-main">Contratación de Mantenimiento de Red — 4,800.00 Bs (&gt; 2,000 Bs)</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                    Certificación Obligatoria
                  </span>
                </div>

                {/* OBJETIVO 2: PLANIFICACIÓN DA EL OK */}
                <div className="p-3.5 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">Paso 2: Planificación</span>
                    <p className="text-xs font-bold text-theme-main">Planificación revisa operaciones y da el OK técnico</p>
                  </div>

                  <button
                    id="btn-certificar-planificacion"
                    type="button"
                    onClick={() => {
                      setCertPlanifOk(true);
                      if (currentStepIndex === 2) handleNextStep();
                    }}
                    className={`btn-primary px-4 py-2 text-xs font-bold cursor-pointer shrink-0 ${
                      certPlanifOk ? 'bg-emerald-600' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {certPlanifOk ? '✓ Planificación dio el OK' : 'Planificación: Dar OK Técnico'}
                  </button>
                </div>

                {/* OBJETIVO 3: PRESUPUESTOS VERIFICA Y DA EL OK */}
                {certPlanifOk && (
                  <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">Paso 3: Presupuestos</span>
                      <p className="text-xs font-bold text-theme-main">Presupuestos verifica dinero y da el OK (Preventivo)</p>
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold block">
                        * Ya está aprobado, pero el dinero AÚN NO SALIÓ
                      </span>
                    </div>

                    <button
                      id="btn-aprobar-preventivo"
                      type="button"
                      onClick={() => {
                        setCertPresupOk(true);
                        if (currentStepIndex === 3) handleNextStep();
                      }}
                      className={`btn-primary px-4 py-2 text-xs font-bold cursor-pointer shrink-0 ${
                        certPresupOk ? 'bg-emerald-600' : 'bg-indigo-600 hover:bg-indigo-700'
                      }`}
                    >
                      {certPresupOk ? '✓ Presupuestos dio el OK' : 'Presupuestos: Verificar Dinero y Dar OK'}
                    </button>
                  </div>
                )}

                {/* OBJETIVO 4: LIC. ZAIDA DICTA "YA SALIÓ EL DINERO" */}
                {certPresupOk && (
                  <div className="p-4 bg-emerald-500/10 border-2 border-emerald-500/40 rounded-2xl flex items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-600 text-white uppercase">
                        Paso 4: Desembolso y Salida
                      </span>
                      <h5 className="text-xs font-bold text-theme-main mt-1">
                        La Lic. Zaida (Tesorería) dicta: "Ya salió el dinero"
                      </h5>
                      <p className="text-[11px] text-theme-muted">
                        Reduce el dinero que tiene en el sistema al liquidar el pago bancario.
                      </p>
                    </div>

                    <button
                      id="btn-zaida-desembolso"
                      type="button"
                      onClick={() => {
                        setZaidaDineroSalio(true);
                        if (currentStepIndex === 4) handleNextStep();
                      }}
                      className="btn-primary flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md cursor-pointer shrink-0"
                    >
                      <Coins size={15} /> Lic. Zaida: "Ya Salió el Dinero" y Reducir Saldo
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. SIMULADOR EJECUCIÓN (PREVENTIVO A REDUCCIÓN POR LIC. ZAIDA)             */}
        {/* ========================================================================= */}
        {moduloId === 'ejecucion' && (
          <div className="space-y-4 max-w-4xl mx-auto w-full">
            <div
              id="kpi-saldo-vigente"
              onClick={() => {
                if (currentStepIndex === 4) handleNextStep();
              }}
              className="grid grid-cols-2 md:grid-cols-4 gap-3 cursor-pointer"
            >
              <div className="p-3 bg-theme-surface rounded-xl border border-theme-border">
                <span className="text-[10px] text-theme-muted font-bold">PRESUPUESTO VIGENTE</span>
                <p className="text-base font-extrabold text-theme-main">100,000.00 Bs</p>
              </div>
              <div className="p-3 bg-theme-surface rounded-xl border border-theme-border">
                <span className="text-[10px] text-amber-500 font-bold">PREVENTIVO (APROBADO)</span>
                <p className="text-base font-extrabold text-amber-500">
                  {pagoEfectuadoZaida ? '0.00 Bs' : '4,800.00 Bs'}
                </p>
              </div>
              <div className="p-3 bg-theme-surface rounded-xl border border-theme-border">
                <span className="text-[10px] text-violet-500 font-bold">PAGADO (LIC. ZAIDA)</span>
                <p className="text-base font-extrabold text-violet-500">
                  {pagoEfectuadoZaida ? '4,800.00 Bs' : '0.00 Bs'}
                </p>
              </div>
              <div className="p-3 bg-theme-surface rounded-xl border border-theme-border">
                <span className="text-[10px] text-emerald-500 font-bold">DISPONIBLE LÍQUIDO</span>
                <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                  95,200.00 Bs
                </p>
              </div>
            </div>

            {/* Fila: Certificación preventiva aprobada */}
            <div className="p-4 bg-theme-surface rounded-2xl border border-theme-border shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                  Preventivo Aprobado por Planif. y Presupuestos (CERT-2026-0045)
                </span>
                <h4 className="text-xs font-bold text-theme-main mt-1">
                  Mantenimiento Operativo — 4,800.00 Bs (El dinero aún no salió)
                </h4>
              </div>

              {/* OBJETIVO 1 */}
              <button
                id="btn-ejecutar-desde-cert"
                type="button"
                onClick={() => {
                  setModalGastoOpen(true);
                  if (currentStepIndex === 1) handleNextStep();
                }}
                className="btn-primary flex items-center gap-2 px-4 py-2 text-xs font-bold shadow-md cursor-pointer shrink-0"
              >
                <Coins size={14} /> Ejecutar Factura / Gasto
              </button>
            </div>

            {modalGastoOpen && (
              <div className="p-5 bg-theme-surface rounded-2xl border-2 border-theme-primary/30 shadow-2xl space-y-3.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-theme-border pb-2.5">
                  <h4 className="text-sm font-bold text-theme-main flex items-center gap-2">
                    <FileText size={16} className="text-theme-primary" /> Imputación de Factura Fiscal y Devengado
                  </h4>
                </div>

                {/* OBJETIVO 2 */}
                <div
                  id="input-factura-monto"
                  onClick={() => {
                    setFacturaCargada(true);
                    if (currentStepIndex === 2) handleNextStep();
                  }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-colors ${
                    facturaCargada
                      ? 'border-emerald-500 bg-emerald-50/20'
                      : 'border-theme-border bg-theme-base/60 hover:border-theme-primary'
                  }`}
                >
                  <label className="text-[10px] font-bold text-theme-muted block mb-1">
                    FACTURA FISCAL Y ACTA DE CONFORMIDAD
                  </label>
                  <div className="text-xs font-bold text-theme-main">
                    {facturaCargada
                      ? 'Factura N° 84920 (Entel S.A.) — Importe Devengado: 4,800.00 Bs'
                      : '👉 Clic para registrar número de factura y devengar...'}
                  </div>
                </div>

                {/* OBJETIVO 3: LIC. ZAIDA DICTA "YA SALIÓ EL DINERO" */}
                {facturaCargada && (
                  <div className="p-4 bg-emerald-500/10 border-2 border-emerald-500/40 rounded-2xl flex items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-600 text-white uppercase">
                        Paso 3: Tesorería
                      </span>
                      <h5 className="text-xs font-bold text-theme-main mt-0.5">
                        La Lic. Zaida dicta: "Ya salió el dinero"
                      </h5>
                      <p className="text-[11px] text-theme-muted">
                        Emisión de cheque / transferencia bancaria y reducción efectiva en el sistema.
                      </p>
                    </div>

                    <button
                      id="btn-confirmar-pago"
                      type="button"
                      onClick={() => {
                        setPagoEfectuadoZaida(true);
                        if (currentStepIndex === 3) handleNextStep();
                      }}
                      className="btn-primary flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white shadow-md cursor-pointer shrink-0"
                    >
                      <Coins size={16} /> Lic. Zaida: Confirmar Pago y Reducir Dinero
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── MODAL DE FINALIZACIÓN EXITOSA ───────────────────────────────────── */}
      {isCompleted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-theme-surface border-2 border-emerald-500 rounded-3xl p-6 text-center shadow-2xl space-y-4">
            <span className="inline-flex p-3 rounded-full bg-emerald-500/20 text-emerald-500 ring-8 ring-emerald-500/10">
              <CheckCircle2 size={36} />
            </span>
            <h3 className="text-lg font-bold text-theme-main">
              ¡Flujo Operativo Concluido!
            </h3>
            <p className="text-xs text-theme-muted leading-relaxed">
              Has completado el escenario con las reglas exactas: visto bueno de Planificación, verificación de Presupuestos y salida de fondos por la Lic. Zaida.
            </p>
            <div className="pt-2 flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" onClick={resetSimulation}>
                Repetir Simulación
              </Button>
              <Button variant="primary" size="sm" onClick={onExit}>
                Volver a Diagramas
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── SPOTLIGHT OVERLAY CON RECORTES Y CARD FLOTANTE CON RESGUARDO INFERIOR ── */}
      {!isCompleted && currentStep && (
        <SpotlightOverlay
          currentStep={currentStep}
          totalSteps={scenario.steps.length}
          onNext={handleNextStep}
          onPrev={handlePrevStep}
          onClose={onExit}
          targetRect={targetRect}
        />
      )}
    </div>
  );
};
