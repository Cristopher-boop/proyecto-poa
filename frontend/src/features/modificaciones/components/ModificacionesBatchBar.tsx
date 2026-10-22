import React from 'react';
import { Sparkles, CheckCheck } from 'lucide-react';
import { Button } from '../../../components/commons';

interface ModificacionesBatchBarProps {
  selectedCount: number;
  totalSelectedMonto: number;
  actionLoading: boolean;
  onClearSelection: () => void;
  onAprobarLote: () => void;
}

export const ModificacionesBatchBar: React.FC<ModificacionesBatchBarProps> = ({
  selectedCount,
  totalSelectedMonto,
  actionLoading,
  onClearSelection,
  onAprobarLote,
}) => {
  if (selectedCount === 0) return null;

  const formatMoney = (val: number | string) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB', minimumFractionDigits: 2 }).format(num || 0);
  };

  return (
    <div className="sticky top-4 z-30 p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-emerald-500/15 to-theme-primary/15 border-2 border-amber-500/40 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
          <Sparkles size={22} className="animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-theme-main">
              {selectedCount} {selectedCount === 1 ? 'Modificación Seleccionada' : 'Modificaciones Seleccionadas'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700">
              En Espera
            </span>
          </div>
          <p className="text-xs text-theme-muted">
            Monto acumulado a autorizar de golpe:{' '}
            <strong className="text-emerald-600 font-mono text-sm">{formatMoney(totalSelectedMonto)}</strong>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <Button
          variant="secondary"
          size="sm"
          onClick={onClearSelection}
          disabled={actionLoading}
        >
          Cancelar Selección
        </Button>

        <Button
          variant="primary"
          size="md"
          loading={actionLoading}
          onClick={onAprobarLote}
          icon={<CheckCheck size={16} />}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/30"
        >
          Aprobar de Golpe ({selectedCount})
        </Button>
      </div>
    </div>
  );
};
