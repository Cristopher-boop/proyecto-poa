import React, { useEffect, useState, useRef } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  Lightbulb,
} from 'lucide-react';
import { SandboxStep } from '../../types/guia.types';
import { Button } from '../../../../components/commons';

interface SpotlightOverlayProps {
  currentStep: SandboxStep;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  targetRect: DOMRect | null;
}

export const SpotlightOverlay: React.FC<SpotlightOverlayProps> = ({
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onClose,
  targetRect,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardHeight, setCardHeight] = useState<number>(320);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  useEffect(() => {
    if (targetRect) {
      setCoords({
        top: targetRect.top,
        left: targetRect.left,
        width: targetRect.width,
        height: targetRect.height,
      });
    } else {
      setCoords(null);
    }
  }, [targetRect]);

  // Medir la altura real de la tarjeta para calcular su posición sin desbordamiento
  useEffect(() => {
    if (cardRef.current) {
      const measured = cardRef.current.offsetHeight;
      if (measured > 0) {
        setCardHeight(measured);
      }
    }
  }, [currentStep]);

  // Determinar si el elemento objetivo está en la mitad inferior de la ventana
  const isLowerHalf = coords ? coords.top > window.innerHeight * 0.45 : false;

  // Cálculo de posición vertical 'top' seguro contra desbordes
  let computedTop = '50%';
  let computedTransform = 'translate(-50%, -50%)';

  if (coords) {
    if (isLowerHalf) {
      // Posicionar ARRIBA del elemento resaltado
      const idealTop = coords.top - cardHeight - 20;
      computedTop = `${Math.max(16, idealTop)}px`;
      computedTransform = 'none';
    } else {
      // Posicionar DEBAJO del elemento resaltado
      const idealTop = coords.top + coords.height + 20;
      const maxAllowedTop = window.innerHeight - cardHeight - 20;
      computedTop = `${Math.min(idealTop, maxAllowedTop)}px`;
      computedTransform = 'none';
    }
  }

  // Cálculo de posición horizontal 'left'
  let computedLeft = '50%';
  if (coords) {
    const cardWidth = 384; // w-96 = 24rem = 384px
    const idealLeft = coords.left;
    const maxAllowedLeft = window.innerWidth - cardWidth - 20;
    computedLeft = `${Math.max(16, Math.min(idealLeft, maxAllowedLeft))}px`;
  }

  return (
    <div className="fixed inset-0 z-50 pointer-events-none select-none overflow-hidden">
      {/* ── FONDO OSCURO Y DESENFOCADO CON RECORTE SPOTLIGHT LIMPIO ── */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-auto"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <defs>
          <mask id="spotlight-mask">
            {/* Relleno blanco: oscurece toda la pantalla */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Recorte transparente donde está el elemento objetivo */}
            {coords && (
              <rect
                x={coords.left - 8}
                y={coords.top - 8}
                width={coords.width + 16}
                height={coords.height + 16}
                rx="14"
                fill="black"
              />
            )}
          </mask>
        </defs>

        {/* Rectángulo oscuro con efecto backdrop aplicado únicamente al área opaca */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(8, 12, 22, 0.78)"
          mask="url(#spotlight-mask)"
        />
      </svg>

      {/* ── ANILLO LUMINOSO NEÓN ALREDEDOR DEL ELEMENTO OBJETIVO ── */}
      {coords && (
        <div
          className="absolute pointer-events-none transition-all duration-200"
          style={{
            top: `${coords.top - 8}px`,
            left: `${coords.left - 8}px`,
            width: `${coords.width + 16}px`,
            height: `${coords.height + 16}px`,
            borderRadius: '14px',
          }}
        >
          {/* Anillo exterior palpitante con resplandor neón */}
          <div className="absolute inset-0 rounded-2xl ring-4 ring-amber-400 dark:ring-amber-300 ring-offset-2 ring-offset-transparent animate-pulse shadow-[0_0_40px_rgba(245,158,11,0.7)]" />
          
          {/* Baliza o puntero flotante con el número de paso */}
          <div className="absolute -top-3 -right-3 flex h-7 w-7">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-7 w-7 bg-amber-500 text-white font-extrabold text-xs items-center justify-center shadow-xl border-2 border-white dark:border-slate-900">
              {currentStep.stepIndex}
            </span>
          </div>
        </div>
      )}

      {/* ── TARJETA FLOTANTE CON INSTRUCCIÓN PASO A PASO (SIN DESBORDAMIENTO) ── */}
      <div
        ref={cardRef}
        className="absolute pointer-events-auto z-50 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 border-2 border-amber-400 rounded-2xl shadow-2xl p-4 sm:p-5 text-left flex flex-col transition-all duration-200 animate-in fade-in zoom-in-95"
        style={{
          top: computedTop,
          left: computedLeft,
          transform: computedTransform,
          maxHeight: 'calc(100vh - 36px)',
        }}
      >
        {/* Cabecera de la Guía */}
        <div className="flex items-center justify-between gap-2 border-b border-theme-border pb-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Sparkles size={16} />
            </span>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Paso {currentStep.stepIndex} de {totalSteps}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Cerrar Guía"
          >
            <X size={16} />
          </button>
        </div>

        {/* Contenido scrolleable seguro si la pantalla es muy pequeña */}
        <div className="overflow-y-auto pr-1 my-2 space-y-2 flex-1">
          {/* Título y Rol */}
          <div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              {currentStep.roleContext}
            </span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1 leading-snug">
              {currentStep.title}
            </h4>
          </div>

          {/* Instrucción directa */}
          <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-amber-50/80 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-300/80 dark:border-amber-900/50 font-medium">
            👉 {currentStep.instruction}
          </div>

          {/* Pista / Tip institucional */}
          {currentStep.hint && (
            <div className="flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg">
              <Lightbulb size={13} className="text-amber-500 shrink-0 mt-0.5" />
              <span>{currentStep.hint}</span>
            </div>
          )}
        </div>

        {/* Botones de Navegación del Paso (Siempre Visibles en la base) */}
        <div className="pt-2.5 border-t border-theme-border flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onPrev}
            disabled={currentStep.stepIndex === 1}
            className="px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1"
          >
            <ArrowLeft size={13} /> Anterior
          </button>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="py-1 px-2.5 text-xs text-slate-500 hover:text-slate-700"
            >
              Cerrar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onNext}
              className="py-1 px-3 text-xs bg-amber-500 hover:bg-amber-600 text-white shadow-sm flex items-center gap-1 font-bold"
            >
              {currentStep.stepIndex === totalSteps ? 'Finalizar' : 'Siguiente'}
              <ArrowRight size={13} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
