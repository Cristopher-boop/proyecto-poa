import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ModuloGuiaId, RolTour } from '../types/guia.types';
import { GuiaModal } from '../components/GuiaModal';
import { LiveSystemTourOverlay } from '../components/LiveSystemTour/LiveSystemTourOverlay';
import { getLiveTourData } from '../data/liveTourData';
import { useAuth } from '../../../hooks/useAuth';

export interface ActiveLiveTour {
  moduloId: ModuloGuiaId;
  stepIndex: number;
  role: RolTour;
}

interface GuiaContextType {
  isGuiaOpen: boolean;
  activeModulo: ModuloGuiaId;
  activeMode: 'diagrama' | 'pasos';
  openGuia: (moduloId?: ModuloGuiaId, mode?: 'diagrama' | 'pasos') => void;
  closeGuia: () => void;
  activeLiveTour: ActiveLiveTour | null;
  tourRole: RolTour;
  setTourRole: (role: RolTour) => void;
  startLiveTour: (moduloId: ModuloGuiaId, initialStep?: number, role?: RolTour) => void;
  stopLiveTour: () => void;
  nextLiveStep: () => void;
  prevLiveStep: () => void;
}

const GuiaContext = createContext<GuiaContextType | undefined>(undefined);

export const GuiaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  // Deducción inteligente del rol predeterminado a partir del usuario en sesión
  const defaultTourRole: RolTour = useMemo(() => {
    const rolName = (user?.rol_nombre || '').toUpperCase().trim();
    if (rolName.includes('PLANIF')) return 'planificacion';
    if (
      rolName.includes('PRESUP') ||
      rolName.includes('APROB') ||
      rolName.includes('FINAN')
    ) {
      return 'presupuestos';
    }
    if (rolName.includes('TESOR')) return 'tesoreria';
    if (rolName.includes('ELABORAD') || rolName.includes('TRABAJAD')) return 'elaborador';
    return 'gerente';
  }, [user?.rol_nombre]);

  const [tourRole, setTourRole] = useState<RolTour>(defaultTourRole);
  const [isGuiaOpen, setIsGuiaOpen] = useState(false);
  const [activeModulo, setActiveModulo] = useState<ModuloGuiaId>('memorias');
  const [activeMode, setActiveMode] = useState<'diagrama' | 'pasos'>('diagrama');
  const [activeLiveTour, setActiveLiveTour] = useState<ActiveLiveTour | null>(null);

  // Sincronizar el rol cuando el usuario inicia sesión
  useEffect(() => {
    setTourRole(defaultTourRole);
  }, [defaultTourRole]);

  const openGuia = (
    moduloId: ModuloGuiaId = 'memorias',
    mode: 'diagrama' | 'pasos' = 'diagrama'
  ) => {
    setActiveModulo(moduloId);
    setActiveMode(mode);
    setIsGuiaOpen(true);
  };

  const closeGuia = () => {
    setIsGuiaOpen(false);
  };

  const startLiveTour = (
    moduloId: ModuloGuiaId,
    initialStep: number = 1,
    role?: RolTour
  ) => {
    setIsGuiaOpen(false);
    const selectedRole = role || tourRole;
    if (role) {
      setTourRole(role);
    }
    setActiveLiveTour({
      moduloId,
      stepIndex: initialStep,
      role: selectedRole,
    });
  };

  const stopLiveTour = () => {
    setActiveLiveTour(null);
  };

  const nextLiveStep = () => {
    if (!activeLiveTour) return;
    const tourData = getLiveTourData(activeLiveTour.moduloId, activeLiveTour.role);
    const maxSteps = tourData.steps.length;
    if (activeLiveTour.stepIndex < maxSteps) {
      setActiveLiveTour((prev) => (prev ? { ...prev, stepIndex: prev.stepIndex + 1 } : null));
    } else {
      setActiveLiveTour(null);
    }
  };

  const prevLiveStep = () => {
    if (!activeLiveTour) return;
    if (activeLiveTour.stepIndex > 1) {
      setActiveLiveTour((prev) => (prev ? { ...prev, stepIndex: prev.stepIndex - 1 } : null));
    }
  };

  // Atajo de teclado global: Shift + ? o F1 para abrir la guía
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        const target = e.target as HTMLElement;
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        ) {
          return;
        }
        e.preventDefault();
        setIsGuiaOpen((prev) => !prev);
      } else if (e.key === 'F1') {
        e.preventDefault();
        setIsGuiaOpen(true);
      } else if (e.key === 'Escape' && activeLiveTour) {
        stopLiveTour();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeLiveTour]);

  return (
    <GuiaContext.Provider
      value={{
        isGuiaOpen,
        activeModulo,
        activeMode,
        openGuia,
        closeGuia,
        activeLiveTour,
        tourRole,
        setTourRole,
        startLiveTour,
        stopLiveTour,
        nextLiveStep,
        prevLiveStep,
      }}
    >
      {children}
      {/* Modal Central de Flujos y Diagramas */}
      <GuiaModal
        isOpen={isGuiaOpen}
        onClose={closeGuia}
        initialModuloId={activeModulo}
        initialMode={activeMode}
        currentRole={tourRole}
        onChangeRole={setTourRole}
        onStartLiveTour={(modId, step, role) => startLiveTour(modId, step, role)}
      />
      {/* Guía en Vivo Sobre el Sistema Real */}
      <LiveSystemTourOverlay
        activeLiveTour={activeLiveTour}
        currentRole={tourRole}
        onChangeRole={(newRole) => {
          setTourRole(newRole);
          if (activeLiveTour) {
            setActiveLiveTour({
              ...activeLiveTour,
              stepIndex: 1,
              role: newRole,
            });
          }
        }}
        onStop={stopLiveTour}
        onNext={nextLiveStep}
        onPrev={prevLiveStep}
        onOpenDiagrama={(modId) => openGuia(modId as any, 'diagrama')}
      />
    </GuiaContext.Provider>
  );
};

export const useGuia = (): GuiaContextType => {
  const context = useContext(GuiaContext);
  if (!context) {
    throw new Error('useGuia debe ser utilizado dentro de un GuiaProvider');
  }
  return context;
};
