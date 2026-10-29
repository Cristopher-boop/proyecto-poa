import React, { useState } from 'react';
import {
  BookOpen,
  ArrowRightLeft,
  ShieldCheck,
  Coins,
  PlayCircle,
  HelpCircle,
  X,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  FileText,
  Building,
} from 'lucide-react';
import { ModuloGuiaId, RolTour } from '../types/guia.types';
import { MODULOS_GUIA_INFO, FLUJOS_GRAPH_DATA } from '../data/flujosData';
import { ROLES_TOUR_INFO } from '../data/liveTourData';
import { InteractiveFlowDiagram } from './FlowDiagram/InteractiveFlowDiagram';
import { Modal, Button } from '../../../components/commons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';

export interface GuiaModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialModuloId?: ModuloGuiaId;
  initialMode?: 'diagrama' | 'pasos';
  currentRole?: RolTour;
  onChangeRole?: (role: RolTour) => void;
  onStartLiveTour?: (moduloId: ModuloGuiaId, initialStep?: number, role?: RolTour) => void;
}

export const GuiaModal: React.FC<GuiaModalProps> = ({
  isOpen,
  onClose,
  initialModuloId = 'memorias',
  initialMode = 'diagrama',
  currentRole = 'gerente',
  onChangeRole,
  onStartLiveTour,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = Boolean(
    user?.is_superuser ||
    user?.rol_nombre?.toUpperCase().includes('ADMIN') ||
    user?.rol_nombre?.toUpperCase().includes('SISTEMA')
  );
  const [activeModulo, setActiveModulo] = useState<ModuloGuiaId>(initialModuloId);
  const [activeRole, setActiveRole] = useState<RolTour>(currentRole);

  const handleStartTour = (step: number = 1) => {
    if (onStartLiveTour) {
      onStartLiveTour(activeModulo, step, activeRole);
    } else {
      handleGoToRealPage();
    }
  };
  const [viewMode, setViewMode] = useState<'diagrama' | 'pasos'>(initialMode === 'pasos' ? 'pasos' : 'diagrama');
  const [activeAlternativaId, setActiveAlternativaId] = useState<string>('mc-individual');

  const currentModuloInfo = MODULOS_GUIA_INFO[activeModulo];

  // Alternativa activa para el módulo
  const resolvedAlternativaId =
    currentModuloInfo.alternativas.some((a) => a.id === activeAlternativaId)
      ? activeAlternativaId
      : currentModuloInfo.alternativas[0].id;

  const currentGraphData =
    FLUJOS_GRAPH_DATA[activeModulo][resolvedAlternativaId] ||
    FLUJOS_GRAPH_DATA[activeModulo][currentModuloInfo.alternativas[0].id];

  const handleSelectModulo = (mod: ModuloGuiaId) => {
    setActiveModulo(mod);
    setActiveAlternativaId(MODULOS_GUIA_INFO[mod].alternativas[0].id);
  };

  const handleGoToRealPage = () => {
    onClose();
    switch (activeModulo) {
      case 'memorias':
        navigate('/memorias');
        break;
      case 'modificaciones':
        navigate('/traspasos');
        break;
      case 'certificaciones':
        navigate('/certificaciones');
        break;
      case 'ejecucion':
        navigate('/ejecucion');
        break;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-7xl max-h-[94vh] bg-theme-surface border border-theme-border rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* ── HEADER MODAL ───────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-theme-border bg-theme-base/60 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-theme-primary/10 text-theme-primary ring-1 ring-theme-primary/20">
              <HelpCircle size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-theme-main">
                  Centro de Capacitación y Flujos Operativos POA
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Interactivo 2026
                </span>
              </div>
              <p className="text-xs text-theme-muted mt-0.5">
                Diagramas de flujo con alternativas, simulador guiado paso a paso y normativa institucional.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleStartTour(1)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer"
              title="Iniciar simulación sobre los botones y pestañas del sistema real"
            >
              <Sparkles size={14} /> Simular en el Sistema Real ({ROLES_TOUR_INFO[activeRole]?.label})
            </button>
            <button
              onClick={handleGoToRealPage}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-theme-border text-xs font-semibold text-theme-main hover:bg-theme-border/50 transition-colors"
            >
              <ExternalLink size={13} className="text-theme-primary" /> Ir al Módulo
            </button>
            <button
              onClick={onClose}
              className="p-2 text-theme-muted hover:text-theme-main hover:bg-theme-border/50 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ── BARRA DE SELECCIÓN DE LOS 4 MÓDULOS ──────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 p-3 bg-theme-base border-b border-theme-border">
          {/* 1. MEMORIAS */}
          <button
            type="button"
            onClick={() => handleSelectModulo('memorias')}
            className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${
              activeModulo === 'memorias'
                ? 'bg-theme-surface border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
                : 'bg-theme-surface/50 border-theme-border hover:bg-theme-surface'
            }`}
          >
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
              <BookOpen size={18} />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider block">
                Formulación POA
              </span>
              <h4 className="text-xs font-bold text-theme-main truncate">
                Memorias de Cálculo (MCs)
              </h4>
            </div>
          </button>

          {/* 2. MODIFICACIONES */}
          <button
            type="button"
            onClick={() => handleSelectModulo('modificaciones')}
            className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${
              activeModulo === 'modificaciones'
                ? 'bg-theme-surface border-amber-500 ring-2 ring-amber-500/20 shadow-sm'
                : 'bg-theme-surface/50 border-theme-border hover:bg-theme-surface'
            }`}
          >
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
              <ArrowRightLeft size={18} />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block">
                Ajuste Dinámico
              </span>
              <h4 className="text-xs font-bold text-theme-main truncate">
                Modificaciones y Traspasos
              </h4>
            </div>
          </button>

          {/* 3. CERTIFICACIONES */}
          <button
            type="button"
            onClick={() => handleSelectModulo('certificaciones')}
            className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${
              activeModulo === 'certificaciones'
                ? 'bg-theme-surface border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                : 'bg-theme-surface/50 border-theme-border hover:bg-theme-surface'
            }`}
          >
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider block">
                Control Preventivo
              </span>
              <h4 className="text-xs font-bold text-theme-main truncate">
                Certificaciones POA
              </h4>
            </div>
          </button>

          {/* 4. EJECUCIÓN */}
          <button
            type="button"
            onClick={() => handleSelectModulo('ejecucion')}
            className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${
              activeModulo === 'ejecucion'
                ? 'bg-theme-surface border-violet-500 ring-2 ring-violet-500/20 shadow-sm'
                : 'bg-theme-surface/50 border-theme-border hover:bg-theme-surface'
            }`}
          >
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 shrink-0">
              <Coins size={18} />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-violet-500 uppercase tracking-wider block">
                Desembolso Real
              </span>
              <h4 className="text-xs font-bold text-theme-main truncate">
                Ejecuciones y Pagos
              </h4>
            </div>
          </button>
        </div>

        {/* ── SELECTOR DE PERSPECTIVA POR ROL INSTITUCIONAL ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-2.5 bg-theme-base border-b border-theme-border">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-theme-muted">
              {isAdmin ? 'Perspectiva de Rol:' : 'Tu Rol Autorizado:'}
            </span>
            {isAdmin ? (
              <div className="flex flex-wrap items-center gap-1.5">
                {(Object.keys(ROLES_TOUR_INFO) as RolTour[]).map((r) => {
                  const cfg = ROLES_TOUR_INFO[r];
                  const isActive = r === activeRole;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        setActiveRole(r);
                        onChangeRole?.(r);
                      }}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-amber-500 text-white shadow-xs ring-2 ring-amber-500/20'
                          : 'bg-theme-surface text-theme-muted hover:text-theme-main border border-theme-border hover:bg-theme-base'
                      }`}
                    >
                      <span>{cfg.label}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                          isActive ? 'bg-white/20 text-white' : 'bg-theme-border text-theme-muted'
                        }`}
                      >
                        {cfg.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-amber-500 text-white shadow-xs ring-2 ring-amber-500/20">
                <span>{ROLES_TOUR_INFO[activeRole]?.label}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-white/20 text-white">
                  {ROLES_TOUR_INFO[activeRole]?.badge}
                </span>
              </div>
            )}
          </div>
          <span className="text-[11px] text-theme-muted hidden md:inline">
            {isAdmin
              ? 'Modo Administrador: Explora cómo opera cada actor institucional en el circuito.'
              : 'Flujos, diagramas y simulaciones restringidos exclusivamente a tu perfil operativo.'}
          </span>
        </div>

        {/* ── SELECTOR DE MODALIDAD: DIAGRAMA VS SIMULADOR VS PASO A PASO ────── */}
        <div className="flex items-center justify-between px-6 py-2.5 border-b border-theme-border bg-theme-surface">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode('diagrama')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'diagrama'
                  ? 'bg-theme-primary text-theme-primaryText shadow-sm'
                  : 'text-theme-muted hover:text-theme-main hover:bg-theme-border/40'
              }`}
            >
              <Layers size={14} /> Diagrama de Flujo Interactivo
            </button>

            

            <button
              type="button"
              onClick={() => setViewMode('pasos')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'pasos'
                  ? 'bg-theme-primary text-theme-primaryText shadow-sm'
                  : 'text-theme-muted hover:text-theme-main hover:bg-theme-border/40'
              }`}
            >
              <FileText size={14} /> Paso a Paso y Normativa
            </button>
          </div>

          <div className="text-xs text-theme-muted hidden sm:block">
            Módulo Activo:{' '}
            <strong className="text-theme-main">{currentModuloInfo.titulo}</strong>
          </div>
        </div>

        {/* ── CUERPO PRINCIPAL DEL CONTENIDO ─────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-theme-base/30">
          {/* MODO 1: DIAGRAMA DE FLUJO INTERACTIVO */}
          {viewMode === 'diagrama' && (
            <InteractiveFlowDiagram
              titulo={currentModuloInfo.titulo}
              subtitulo={currentModuloInfo.subtitulo}
              alternativas={currentModuloInfo.alternativas}
              activeAlternativaId={resolvedAlternativaId}
              onSelectAlternativa={(altId) => setActiveAlternativaId(altId)}
              nodes={currentGraphData.nodes}
              edges={currentGraphData.edges}
              onStartSimulation={(stepId) => {
                handleStartTour(stepId || 1);
              }}
            />
          )}

          {/* MODO 2: PASO A PASO Y NORMATIVA ESTRUCTURADA */}
          {viewMode === 'pasos' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              {/* Resumen general */}
              <div className="p-5 bg-theme-surface rounded-2xl border border-theme-border shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-theme-primary px-2.5 py-1 rounded-full bg-theme-primary/10">
                  Concepto Institucional
                </span>
                <h3 className="text-base font-bold text-theme-main mt-2">
                  {currentModuloInfo.titulo}
                </h3>
                <p className="text-xs text-theme-muted leading-relaxed mt-1">
                  {currentModuloInfo.descripcionLarga}
                </p>
              </div>

              {/* Matriz de Alternativas de Camino */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-theme-muted mb-3">
                  Alternativas y Caminos Disponibles
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {currentModuloInfo.alternativas.map((alt) => (
                    <div
                      key={alt.id}
                      onClick={() => {
                        setActiveAlternativaId(alt.id);
                        setViewMode('diagrama');
                      }}
                      className="p-4 bg-theme-surface rounded-2xl border border-theme-border hover:border-theme-primary transition-all cursor-pointer shadow-xs group"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-theme-main group-hover:text-theme-primary transition-colors">
                          {alt.nombre}
                        </span>
                        {alt.badge && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-theme-primary/10 text-theme-primary">
                            {alt.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-theme-muted leading-relaxed">
                        {alt.descripcion}
                      </p>
                      <span className="text-[10px] font-bold text-theme-primary mt-2 flex items-center gap-1 group-hover:underline">
                        Ver flujo de este camino <ChevronRight size={11} />
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Normativa y Reglas de Negocio */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-theme-muted mb-3">
                  Reglas Institucionales y Normativa Presupuestaria
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentModuloInfo.normativaReferencial.map((norm, i) => (
                    <div
                      key={i}
                      className="p-4 bg-theme-surface rounded-2xl border border-theme-border shadow-xs"
                    >
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400 block mb-1">
                        {norm.articulo}
                      </span>
                      <p className="text-xs text-theme-muted leading-relaxed">
                        {norm.descripcion}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botón para probar en el simulador */}
              <div className="p-6 bg-gradient-to-r from-theme-primary/10 via-indigo-500/10 to-amber-500/10 border border-theme-primary/20 rounded-3xl flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-theme-main">
                    ¿Quieres practicar sin alterar datos de producción?
                  </h4>
                  <p className="text-xs text-theme-muted mt-0.5">
                    Entra al Escenario de Prueba Guiado con atenuación y botones resaltados como {ROLES_TOUR_INFO[activeRole]?.label}.
                  </p>
                </div>
                <Button
                  variant="primary"
                  onClick={() => handleStartTour(1)}
                  className="flex items-center gap-2 py-2 px-4 text-xs font-bold shadow-md bg-amber-500 hover:bg-amber-600 text-white"
                >
                  <Sparkles size={16} /> Iniciar Simulación en el Sistema Real
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
