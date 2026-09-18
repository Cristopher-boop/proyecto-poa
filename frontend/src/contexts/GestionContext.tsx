import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getGestiones, Gestion } from '../services/presupuestoService';

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
  const [gestiones, setGestiones] = useState<Gestion[]>([]);
  const [gestionActivaId, setGestionActivaId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchGestiones = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getGestiones();
      setGestiones(list);
      if (list.length > 0) {
        setGestionActivaId((prev) => {
          // Si ya había una seleccionada y sigue existiendo, la mantenemos
          if (prev && list.some((g) => g.id === prev)) {
            return prev;
          }
          // Priorizar gestión 'EN_EJECUCION' o la primera de la lista
          const enEjecucion = list.find((g) => g.estado === 'EN_EJECUCION');
          return enEjecucion ? enEjecucion.id : list[0].id;
        });
      }
    } catch (err) {
      console.error('Error al cargar gestiones fiscales:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGestiones();
  }, [fetchGestiones]);

  const gestionActiva = gestiones.find((g) => g.id === gestionActivaId) || null;
  const isGestionBloqueada = gestionActiva?.estado === 'FINALIZADO';

  return (
    <GestionContext.Provider
      value={{
        gestiones,
        gestionActivaId,
        gestionActiva,
        isGestionBloqueada,
        loading,
        setGestionActivaId,
        refetchGestiones: fetchGestiones,
      }}
    >
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
