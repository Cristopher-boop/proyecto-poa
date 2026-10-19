import React from 'react';
import {
  WalletCards,
  RefreshCw,
  Lock,
  Unlock,
  Play,
  Plus,
  BookOpenText,
  CheckCircle2,
} from 'lucide-react';
import { Gestion } from '../types/presupuestos.types';
import { Button, PageHeader, GestionSelector } from '../../../components/commons';

interface PresupuestosHeaderProps {
  gestiones: Gestion[];
  selectedGestionId: number | null;
  activeGestion: Gestion | null;
  isAprobador: boolean;
  actionLoading: boolean;
  onSelectGestion: (id: number) => void;
  onCerrarFormulacion: () => void;
  onReabrir: () => void;
  onPasarEjecucion: () => void;
  onOpenNuevaGestion: () => void;
  onAsignarTechosPOA?: () => void;
}

export const PresupuestosHeader: React.FC<PresupuestosHeaderProps> = ({
  gestiones,
  selectedGestionId,
  activeGestion,
  isAprobador,
  actionLoading,
  onSelectGestion,
  onCerrarFormulacion,
  onReabrir,
  onPasarEjecucion,
  onOpenNuevaGestion,
  onAsignarTechosPOA,
}) => {
  return (
    <PageHeader
      icon={<WalletCards size={26} />}
      title="Presupuestos & POA"
      subtitle="Control financiero institucional — Formulación, Aprobación y Ejecución Presupuestaria"
      actions={
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Selector Institucional de Gestión con Encaje Suave Azul */}
          <GestionSelector
            gestiones={gestiones}
            selectedGestionId={selectedGestionId}
            onSelectGestion={onSelectGestion}
          />

          {/* Acciones de ciclo de vida de la gestión */}
          {isAprobador && activeGestion?.estado === 'FORMULACION' && (
            <>
              {onAsignarTechosPOA && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={<WalletCards size={14} />}
                  onClick={onAsignarTechosPOA}
                  disabled={actionLoading}
                  className="shadow-xs font-semibold"
                  title="Ajustar el Techo General del POA y reasignar a las gerencias"
                >
                  Ajustar Techos POA
                </Button>
              )}
              <Button
                variant="danger"
                size="sm"
                icon={<Lock size={14} />}
                onClick={onCerrarFormulacion}
                disabled={actionLoading}
                title="Cerrar la etapa de formulación y consolidar los techos"
              >
                Cerrar Formulación
              </Button>
            </>
          )}

          {isAprobador && activeGestion?.estado === 'CERRADO_FORMULACION' && (
            <>
              <Button
                variant="secondary"
                size="sm"
                icon={<Unlock size={14} />}
                onClick={onReabrir}
                disabled={actionLoading}
                title="Reabrir la etapa de formulación para admitir ajustes de techos"
              >
                Reabrir Formulación
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<Play size={14} />}
                onClick={onPasarEjecucion}
                disabled={actionLoading}
                title="Iniciar la fase operativa y control de ejecución presupuestaria"
              >
                Habilitar Ejecución de Gastos
              </Button>
            </>
          )}

          {isAprobador && (
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={15} />}
              onClick={onOpenNuevaGestion}
              className="shadow-sm font-semibold"
              title={`Habilitar la formulación del POA para la siguiente Gestión ${gestiones && gestiones.length > 0 ? Math.max(...gestiones.map((g) => g.anio)) + 1 : new Date().getFullYear() + 1}`}
            >
              Habilitar Formulación POA {gestiones && gestiones.length > 0 ? Math.max(...gestiones.map((g) => g.anio)) + 1 : new Date().getFullYear() + 1}
            </Button>
          )}
        </div>
      }
    >
      {/* Banner Informativo de Estado de Gestión */}
      {activeGestion && (
        <div className="flex flex-wrap gap-3">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold ${
              activeGestion.estado === 'FORMULACION'
                ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                : activeGestion.estado === 'CERRADO_FORMULACION'
                ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                : activeGestion.estado === 'EN_EJECUCION'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {activeGestion.estado === 'FORMULACION' && (
              <>
                <BookOpenText size={13} /> Formulación abierta — Las unidades pueden formular memorias de cálculo
              </>
            )}
            {activeGestion.estado === 'CERRADO_FORMULACION' && (
              <>
                <Lock size={13} /> Formulación cerrada — Presupuestos consolidados y bloqueados
              </>
            )}
            {activeGestion.estado === 'EN_EJECUCION' && (
              <>
                <Play size={13} /> En Ejecución — Registro y control activo de gastos operativos
              </>
            )}
            {activeGestion.estado === 'FINALIZADO' && (
              <>
                <CheckCircle2 size={13} /> Gestión Finalizada
              </>
            )}
          </div>
        </div>
      )}
    </PageHeader>
  );
};

