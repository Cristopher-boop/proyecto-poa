import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  Layers,
  Lightbulb,
  ShieldCheck,
  CheckCircle2,
  MousePointerClick,
  FileText,
  UserCheck,
  Building,
  Coins,
  ChevronDown, GripHorizontal, Move, RotateCcw,
} from 'lucide-react';
import { getLiveTourData, ROLES_TOUR_INFO } from '../../data/liveTourData';
import { RolTour, LiveTourStep, ModuloGuiaId } from '../../types/guia.types';
import { Button } from '../../../../components/commons';
import { useAuth } from '../../../../hooks/useAuth';
import { TourSimulatedModal } from './TourSimulatedModal';

export interface LiveSystemTourOverlayProps {
  activeLiveTour: { moduloId: ModuloGuiaId; stepIndex: number; role?: RolTour } | null;
  currentRole?: RolTour;
  onChangeRole?: (role: RolTour) => void;
  onStop: () => void;
  onNext: () => void;
  onPrev: () => void;
  onOpenDiagrama?: (moduloId: string) => void;
}

export const LiveSystemTourOverlay: React.FC<LiveSystemTourOverlayProps> = (props) => {
  if (!props.activeLiveTour) return null;
  return (
    <LiveSystemTourContent
      {...props}
      activeLiveTour={props.activeLiveTour}
      currentRole={props.activeLiveTour.role || props.currentRole || 'gerente'}
    />
  );
};

interface LiveSystemTourContentProps extends Omit<LiveSystemTourOverlayProps, 'activeLiveTour'> {
  activeLiveTour: { moduloId: ModuloGuiaId; stepIndex: number; role?: RolTour };
  currentRole: RolTour;
}

const LiveSystemTourContent: React.FC<LiveSystemTourContentProps> = ({
  activeLiveTour,
  currentRole,
  onChangeRole,
  onStop,
  onNext,
  onPrev,
  onOpenDiagrama,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = Boolean(
    user?.is_superuser ||
    user?.rol_nombre?.toUpperCase().includes('ADMIN') ||
    user?.rol_nombre?.toUpperCase().includes('SISTEMA')
  );
  const lastNavigatedRoute = useRef<string>('');

  const cardRef = useRef<HTMLDivElement>(null);
  const [cardHeight, setCardHeight] = useState<number>(360);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const [isSimulatedModalOpen, setIsSimulatedModalOpen] = useState(false);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [userPosition, setUserPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number } | null>(null);

  // Manejar arrastre libre de la tarjeta para que el usuario pueda moverla si tapa algo
  const handleMouseDownHeader = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return; // No iniciar drag si hace clic en un botón
    const cardRect = cardRef.current?.getBoundingClientRect();
    if (!cardRect) return;
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: cardRect.left,
      startY: cardRect.top,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;
      const dx = e.clientX - dragStartRef.current.mouseX;
      const dy = e.clientY - dragStartRef.current.mouseY;
      const newX = Math.max(10, Math.min(window.innerWidth - 440, dragStartRef.current.startX + dx));
      const newY = Math.max(10, Math.min(window.innerHeight - 300, dragStartRef.current.startY + dy));
      setUserPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const effectiveRole = activeLiveTour.role || currentRole;
  const tourData = getLiveTourData(activeLiveTour.moduloId, effectiveRole);
  const currentStep: LiveTourStep | undefined =
    tourData?.steps?.find((s: LiveTourStep) => s.stepIndex === activeLiveTour.stepIndex) ||
    tourData?.steps?.[0];
  const totalSteps = tourData?.steps?.length || 0;

  // Resetear la posición de usuario cuando cambia el paso
  useEffect(() => {
    setUserPosition(null);
  }, [currentStep?.stepIndex]);

  // 1. Navegar de forma segura a la ruta requerida sin loops
  useEffect(() => {
    if (!currentStep) return;
    if (
      currentStep.route &&
      location.pathname !== currentStep.route &&
      lastNavigatedRoute.current !== currentStep.route
    ) {
      lastNavigatedRoute.current = currentStep.route;
      navigate(currentStep.route);
    }
  }, [currentStep?.route, location.pathname, navigate]);

  // 2. Si el paso especifica una pestaña objetivo (targetTab), activarla en la interfaz real
  useEffect(() => {
    if (!currentStep?.targetTab) return;
    const tabSelector = `[data-tour="tour-tab-${currentStep.targetTab}"]`;
    const tabEl = document.querySelector(tabSelector) as HTMLElement | null;
    if (tabEl) {
      tabEl.click();
    }
  }, [currentStep?.targetTab, currentStep?.stepIndex, location.pathname]);

  // 3. Medir y ubicar el elemento objetivo en la pantalla real
  useEffect(() => {
    if (!currentStep) return;
    let animationFrameId: number;
    let attempts = 0;

    const findAndMeasure = () => {
      const el = document.querySelector(currentStep.selector) as HTMLElement | null;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        const rect = el.getBoundingClientRect();
        setCoords({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
      } else if (attempts < 30) {
        attempts++;
        animationFrameId = requestAnimationFrame(findAndMeasure);
      } else {
        setCoords(null);
      }
    };

    findAndMeasure();
    const timer = setTimeout(findAndMeasure, 120);

    const handleResizeOrScroll = () => {
      findAndMeasure();
    };

    window.addEventListener('resize', handleResizeOrScroll);
    window.addEventListener('scroll', handleResizeOrScroll, true);

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(timer);
      window.removeEventListener('resize', handleResizeOrScroll);
      window.removeEventListener('scroll', handleResizeOrScroll, true);
    };
  }, [currentStep?.selector, currentStep?.stepIndex, location.pathname, isSimulatedModalOpen]);

  // 4. Medir la altura de la tarjeta de guía
  useEffect(() => {
    if (cardRef.current) {
      const measured = cardRef.current.offsetHeight;
      if (measured > 0) setCardHeight(measured);
    }
  }, [currentStep, showRoleSelector, feedbackToast]);

  // Retorno temprano seguro SÓLO DESPUÉS de que todos los hooks hayan sido ejecutados
  if (!tourData || !currentStep || totalSteps === 0) return null;

  // 5. Posicionamiento inteligente anti-colisión (NUNCA se interpone sobre el botón o elemento objetivo)
  const computedPosition = useMemo(() => {
    if (userPosition) {
      return {
        top: `${userPosition.y}px`,
        left: `${userPosition.x}px`,
        transform: 'none',
      };
    }

    if (!coords) {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }

    const cardWidth = 430;
    const effectiveHeight = cardHeight > 0 ? cardHeight : 390;
    const margin = 20;
    const winW = window.innerWidth;
    const winH = window.innerHeight;

    // Área del objetivo con halo de protección
    const target = {
      left: coords.left - 16,
      right: coords.left + coords.width + 16,
      top: coords.top - 16,
      bottom: coords.top + coords.height + 16,
    };

    const hasCollision = (left: number, top: number) => {
      const card = {
        left,
        right: left + cardWidth,
        top,
        bottom: top + effectiveHeight,
      };
      const xOverlap = card.left < target.right && card.right > target.left;
      const yOverlap = card.top < target.bottom && card.bottom > target.top;
      return xOverlap && yOverlap;
    };

    // Candidato 1: A la derecha del elemento (ideal cuando está a la izquierda o centro)
    const rightLeft = target.right + margin;
    const rightTop = Math.max(margin, Math.min(coords.top, winH - effectiveHeight - margin));
    if (rightLeft + cardWidth <= winW - margin && !hasCollision(rightLeft, rightTop)) {
      return { top: `${rightTop}px`, left: `${rightLeft}px`, transform: 'none' };
    }

    // Candidato 2: A la izquierda del elemento (si el objetivo está en la derecha)
    const leftLeft = target.left - cardWidth - margin;
    const leftTop = Math.max(margin, Math.min(coords.top, winH - effectiveHeight - margin));
    if (leftLeft >= margin && !hasCollision(leftLeft, leftTop)) {
      return { top: `${leftTop}px`, left: `${leftLeft}px`, transform: 'none' };
    }

    // Candidato 3: Debajo del elemento con holgura segura completa
    const belowTop = target.bottom + margin;
    const centeredLeft = Math.max(
      margin,
      Math.min(coords.left + coords.width / 2 - cardWidth / 2, winW - cardWidth - margin)
    );
    if (belowTop + effectiveHeight <= winH - margin && !hasCollision(centeredLeft, belowTop)) {
      return { top: `${belowTop}px`, left: `${centeredLeft}px`, transform: 'none' };
    }

    // Candidato 4: Encima del elemento con holgura segura completa
    const aboveTop = target.top - effectiveHeight - margin;
    if (aboveTop >= margin && !hasCollision(centeredLeft, aboveTop)) {
      return { top: `${aboveTop}px`, left: `${centeredLeft}px`, transform: 'none' };
    }

    // Candidato 5: Cuadrante de pantalla opuesto al centro del objetivo (garantiza cero solapamiento)
    const targetCenterX = coords.left + coords.width / 2;
    const targetCenterY = coords.top + coords.height / 2;
    const isTargetLeft = targetCenterX < winW / 2;
    const isTargetTop = targetCenterY < winH / 2;

    const fallbackLeft = isTargetLeft ? winW - cardWidth - margin : margin;
    const fallbackTop = isTargetTop ? winH - effectiveHeight - margin : margin;

    return { top: `${fallbackTop}px`, left: `${fallbackLeft}px`, transform: 'none' };
  }, [coords, cardHeight, userPosition]);

  // 6. Manejador de clic simulado interactivo
  const handleSimulateAction = () => {
    // Si este paso tiene un modal simulado interactivo, abrir el modal
    if (currentStep.modalConfig) {
      setIsSimulatedModalOpen(true);
      return;
    }

    try {
      const el = document.querySelector(currentStep.selector) as HTMLElement | null;
      if (el) {
        const isTab = el.getAttribute('data-tour')?.includes('tab') || el.getAttribute('data-tab-id');
        const isNav = el.getAttribute('data-tour')?.includes('nav');
        if (isTab || isNav) {
          el.click();
        }
      }
    } catch {
      // Entorno seguro sin fallos
    }

    setFeedbackToast(`¡Acción simulada en el Paso ${currentStep.stepIndex}!`);
    setTimeout(() => {
      setFeedbackToast(null);
      if (currentStep.stepIndex === totalSteps) {
        onStop();
      } else {
        onNext();
      }
    }, 550);
  };

  const handleModalConfirm = () => {
    setIsSimulatedModalOpen(false);
    setFeedbackToast(currentStep.modalConfig?.onSuccessMessage || '✓ Acción completada exitosamente.');
    setTimeout(() => {
      setFeedbackToast(null);
      if (currentStep.stepIndex === totalSteps) {
        onStop();
      } else {
        onNext();
      }
    }, 600);
  };

  const currentRoleConfig = ROLES_TOUR_INFO[effectiveRole] || ROLES_TOUR_INFO.gerente;

  return (
    <div className="fixed inset-0 z-[999] pointer-events-none select-none overflow-hidden">
      {/* ── FONDO OSCURO Y DESENFOCADO SOBRE EL SISTEMA REAL ── */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <defs>
          <mask id="live-tour-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {coords && (
              <rect
                x={coords.left - 6}
                y={coords.top - 6}
                width={coords.width + 12}
                height={coords.height + 12}
                rx="14"
                fill="black"
              />
            )}
          </mask>
        </defs>

        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(8, 12, 22, 0.78)"
          mask="url(#live-tour-mask)"
        />
      </svg>

      {/* ── ANILLO NEÓN INTERACTIVO RESALTANDO EL BOTÓN O PESTAÑA REAL ── */}
      {coords && (
        <div
          onClick={handleSimulateAction}
          className="absolute pointer-events-auto cursor-pointer transition-all duration-200 group"
          title="Toca para interactuar o simular este paso"
          style={{
            top: `${coords.top - 6}px`,
            left: `${coords.left - 6}px`,
            width: `${coords.width + 12}px`,
            height: `${coords.height + 12}px`,
            borderRadius: '14px',
          }}
        >
          <div className="absolute inset-0 rounded-2xl ring-4 ring-amber-400 dark:ring-amber-300 ring-offset-2 ring-offset-transparent animate-pulse shadow-[0_0_35px_rgba(245,158,11,0.75)] group-hover:ring-emerald-400 group-hover:shadow-[0_0_40px_rgba(16,185,129,0.85)] transition-all" />

          <div className="absolute -top-3.5 -right-3.5 flex h-7 w-7">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-7 w-7 bg-amber-500 text-white font-extrabold text-xs items-center justify-center shadow-xl border-2 border-white dark:border-slate-900 group-hover:bg-emerald-500 transition-colors">
              {currentStep.stepIndex}
            </span>
          </div>

          <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-0.5 rounded-md bg-slate-900/95 text-[10px] font-bold text-amber-300 border border-amber-400/30 shadow-xl pointer-events-none opacity-90 group-hover:opacity-100 flex items-center gap-1">
            <MousePointerClick size={11} className="text-amber-400" /> Toca para interactuar
          </div>
        </div>
      )}

      {/* ── TARJETA FLOTANTE CON INSTRUCCIÓN SOBRE EL SISTEMA REAL ── */}
      <div
        ref={cardRef}
        className="absolute pointer-events-auto z-[1000] w-[420px] max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 border-2 border-amber-400 rounded-3xl shadow-2xl p-4 sm:p-5 text-left flex flex-col transition-all duration-200 animate-in fade-in zoom-in-95"
        style={{
          top: computedPosition.top,
          left: computedPosition.left,
          transform: computedPosition.transform,
          maxHeight: 'calc(100vh - 36px)',
        }}
      >
        {/* Cabecera de la Guía con Soporte de Arrastre Libre */}
        <div
          onMouseDown={handleMouseDownHeader}
          className="flex items-center justify-between gap-2 border-b border-theme-border pb-2.5 shrink-0 cursor-grab active:cursor-grabbing select-none"
          title="Arrastra desde aquí para mover la tarjeta si tapa algún elemento"
        >
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Sparkles size={16} />
            </span>
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                Simulación en Vivo • Paso {currentStep.stepIndex} de {totalSteps}
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                ✓ Entorno seguro (No altera base de datos)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {userPosition && (
              <button
                type="button"
                onClick={() => setUserPosition(null)}
                className="p-1.5 text-amber-500 hover:text-amber-600 rounded-lg hover:bg-amber-500/10 transition-colors"
                title="Restaurar posición automática"
              >
                <RotateCcw size={15} />
              </button>
            )}
            <div className="p-1 text-slate-400 hover:text-slate-600 cursor-grab" title="Arrastra para mover">
              <GripHorizontal size={16} />
            </div>
            <button
              onClick={() => {
                onStop();
                onOpenDiagrama?.(activeLiveTour.moduloId);
              }}
              className="p-1.5 text-slate-400 hover:text-theme-primary rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Abrir Diagrama de Flujo"
            >
              <Layers size={16} />
            </button>
            <button
              onClick={onStop}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Salir de la Guía"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── SELECTOR DE ROL INSTITUCIONAL ── */}
        <div className="mt-2.5 pt-0.5 pb-1 border-b border-theme-border/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-theme-muted font-bold uppercase">Perspectiva:</span>
              {isAdmin ? (
                <button
                  type="button"
                  onClick={() => setShowRoleSelector(!showRoleSelector)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-colors"
                >
                  <span>{currentRoleConfig.label}</span>
                  <ChevronDown size={11} className={`transition-transform ${showRoleSelector ? 'rotate-180' : ''}`} />
                </button>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  {currentRoleConfig.label}
                </span>
              )}
            </div>
            <span className="text-[10px] text-theme-muted italic">
              {isAdmin ? 'Cambiar rol' : 'Rol institucional'}
            </span>
          </div>

          {isAdmin && showRoleSelector && (
            <div className="mt-2 grid grid-cols-2 gap-1.5 p-2 bg-theme-base/80 rounded-2xl border border-theme-border animate-in fade-in">
              {(Object.keys(ROLES_TOUR_INFO) as RolTour[]).map((r) => {
                const cfg = ROLES_TOUR_INFO[r];
                const isActive = r === effectiveRole;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      onChangeRole?.(r);
                      setShowRoleSelector(false);
                    }}
                    className={`p-1.5 rounded-xl text-left text-[11px] font-bold transition-all flex items-center justify-between ${
                      isActive
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'hover:bg-theme-surface text-theme-main'
                    }`}
                  >
                    <span className="truncate">{cfg.label}</span>
                    <span className="text-[9px] opacity-75">{cfg.badge}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Notificación de Acción Simulada */}
        {feedbackToast && (
          <div className="mt-2 p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 size={15} />
            <span>{feedbackToast}</span>
          </div>
        )}

        {/* Contenido scrolleable seguro */}
        <div className="overflow-y-auto pr-1 my-2.5 space-y-2.5 flex-1">
          {/* Rol institucional del paso */}
          <div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              {currentStep.role}
            </span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1 leading-snug">
              {currentStep.title}
            </h4>
          </div>

          {/* Instrucción paso a paso */}
          <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-amber-50/80 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-300/80 dark:border-amber-900/50 font-medium">
            👉 {currentStep.instruction}
          </div>

          {/* Límite de rol institucional */}
          {currentStep.limiteRol && (
            <div className="text-[11px] text-amber-800 dark:text-amber-200 leading-relaxed bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/30 font-semibold space-y-1">
              <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-extrabold uppercase text-[10px]">
                <ShieldCheck size={14} className="text-amber-600" /> Límite de tu rol y qué debes esperar
              </div>
              <p>{currentStep.limiteRol}</p>
            </div>
          )}

          {/* Pista / Hint */}
          {currentStep.hint && (
            <div className="flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg">
              <Lightbulb size={13} className="text-amber-500 shrink-0 mt-0.5" />
              <span>{currentStep.hint}</span>
            </div>
          )}

          {/* Botón directo para abrir modal simulado si aplica */}
          {currentStep.modalConfig && (
            <div className="pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSimulatedModalOpen(true)}
                className="w-full py-2 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-400/40 hover:bg-amber-500/20 flex items-center justify-center gap-2 rounded-xl shadow-xs"
              >
                <FileText size={14} className="text-amber-600" />
                <span>Abrir Formulario Interactivo ({currentStep.modalConfig.title})</span>
              </Button>
            </div>
          )}
        </div>

        {/* Botones de Navegación del Paso */}
        <div className="pt-2.5 border-t border-theme-border flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onPrev}
            disabled={currentStep.stepIndex === 1}
            className="px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1"
          >
            <ArrowLeft size={13} /> Anterior
          </button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSimulateAction}
              className="py-1 px-2.5 text-xs text-amber-600 dark:text-amber-400 border-amber-400/40 hover:bg-amber-500/10 flex items-center gap-1 font-semibold"
            >
              <MousePointerClick size={13} /> {currentStep.modalConfig ? 'Completar Modal' : 'Simular'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                if (currentStep.stepIndex === totalSteps) {
                  onStop();
                } else {
                  onNext();
                }
              }}
              className="py-1 px-3 text-xs bg-amber-500 hover:bg-amber-600 text-white shadow-sm flex items-center gap-1 font-bold"
            >
              {currentStep.stepIndex === totalSteps ? 'Finalizar' : 'Siguiente Paso'}
              <ArrowRight size={13} />
            </Button>
          </div>
        </div>
      </div>

      {/* ── MODAL INTERACTIVO SIMULADO DEL PASO ── */}
      {currentStep.modalConfig && (
        <TourSimulatedModal
          isOpen={isSimulatedModalOpen}
          onClose={() => setIsSimulatedModalOpen(false)}
          config={currentStep.modalConfig}
          userRole={effectiveRole}
          onConfirm={handleModalConfirm}
        />
      )}
    </div>
  );
};
