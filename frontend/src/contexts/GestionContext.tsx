import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { getGestiones, Gestion } from '../services/presupuestoService';
import { useAuth } from '../hooks/useAuth';

const GESTION_STORAGE_KEY = 'poa_selected_gestion_id';

interface GestionContextType {
  gestiones: Gestion[];
  gestionActivaId: number | null;
  gestionActiva: Gestion | null;
  isGestionBloqueada: boolean;
  loading: boolean;
  setGestionActivaId: (id: number) => void;
  refetchGestiones: () => Promise<void>;
}

const GestionContext = createContext<GestionContextType | undefined>(undefined);

export const GestionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [gestiones, setGestiones] = useState<Gestion[]>([]);
  const [gestionActivaId, setGestionActivaId] = useState<number | null>(() => {
    const saved = localStorage.getItem(GESTION_STORAGE_KEY);
    return saved ? parseInt(saved, 10) : null;
  });
  const [loading, setLoading] = useState<boolean>(true);

  const fetchGestiones = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getGestiones();
      setGestiones(list);
      if (list.length > 0) {
        setGestionActivaId((prev) => {
          // 1. Si la que ya estaba seleccionada sigue existiendo en la lista, la mantenemos
          if (prev && list.some((g) => g.id === prev)) {
            localStorage.setItem(GESTION_STORAGE_KEY, String(prev));
            return prev;
          }

          // 2. Verificar si hay guardada en localStorage que exista en la lista
          const savedStr = localStorage.getItem(GESTION_STORAGE_KEY);
          const savedId = savedStr ? parseInt(savedStr, 10) : null;
          if (savedId && list.some((g) => g.id === savedId)) {
            return savedId;
          }

          // 3. Priorizar gestión 'EN_EJECUCION'
          const enEjecucion = list.find((g) => g.estado === 'EN_EJECUCION');
          if (enEjecucion) {
            localStorage.setItem(GESTION_STORAGE_KEY, String(enEjecucion.id));
            return enEjecucion.id;
          }

          // 4. Priorizar gestión del año en curso (ej. 2026)
          const anioActual = new Date().getFullYear();
          const delAnioActual = list.find((g) => g.anio === anioActual);
          if (delAnioActual) {
            localStorage.setItem(GESTION_STORAGE_KEY, String(delAnioActual.id));
            return delAnioActual.id;
          }

          // 5. Fallback a la primera gestión disponible
          const fallbackId = list[0].id;
          localStorage.setItem(GESTION_STORAGE_KEY, String(fallbackId));
          return fallbackId;
        });
      } else {
        setGestionActivaId(null);
      }
    } catch (err) {
      console.error('Error al cargar gestiones fiscales:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Escuchar estado de autenticación: cuando el usuario se autentica, cargar gestiones inmediatamente
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      setGestiones([]);
      setLoading(false);
      return;
    }

    fetchGestiones();
  }, [isAuthenticated, authLoading, fetchGestiones]);

  const handleSetGestionActivaId = useCallback((id: number) => {
    setGestionActivaId(id);
    localStorage.setItem(GESTION_STORAGE_KEY, String(id));
  }, []);

  const gestionActiva = useMemo(() => {
    return gestiones.find((g) => g.id === gestionActivaId) || null;
  }, [gestiones, gestionActivaId]);

  const isGestionBloqueada = Boolean(gestionActiva?.estado === 'FINALIZADO');

  const contextValue = useMemo<GestionContextType>(
    () => ({
      gestiones,
      gestionActivaId,
      gestionActiva,
      isGestionBloqueada,
      loading,
      setGestionActivaId: handleSetGestionActivaId,
      refetchGestiones: fetchGestiones,
    }),
    [
      gestiones,
      gestionActivaId,
      gestionActiva,
      isGestionBloqueada,
      loading,
      handleSetGestionActivaId,
      fetchGestiones,
    ]
  );

  return (
    <GestionContext.Provider value={contextValue}>
      {children}
    </GestionContext.Provider>
  );
};

export function useGestion(): GestionContextType {
  const context = useContext(GestionContext);
  if (!context) {
    throw new Error('useGestion debe ser usado dentro de un GestionProvider');
  }
  return context;
}
